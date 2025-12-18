from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from fastapi.responses import StreamingResponse
from typing import List, Optional
from sqlmodel import Session
from pydantic import BaseModel
import paramiko
import io
import stat

from app.core.database import get_session
from app.models.service import Service

router = APIRouter()

class FileItem(BaseModel):
    name: str
    size: int
    is_dir: bool
    path: str
    modify_time: int
    permissions: str

class ListRequest(BaseModel):
    path: str = "/"
    username: Optional[str] = None
    password: Optional[str] = None

def get_sftp_client(service, username, password):
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    u = username or service.ssh_username
    p = password 
    
    if not p and service.ssh_password:
         from app.core.security import decrypt_password
         p = decrypt_password(service.ssh_password)
    
    if not u or not p:
        raise HTTPException(status_code=400, detail="SSH Credentials required")
        
    client.connect(service.ip, port=service.port or 22, username=u, password=p, timeout=10)
    return client, client.open_sftp()

@router.post("/{service_id}/list", response_model=List[FileItem])
def list_files(service_id: int, req: ListRequest, session: Session = Depends(get_session)):
    service = session.get(Service, service_id)
    if not service: raise HTTPException(status_code=404, detail="Service not found")
    
    ssh, sftp = None, None
    try:
        ssh, sftp = get_sftp_client(service, req.username, req.password)
        path = req.path
        
        # Stat info
        try:
            items = sftp.listdir_attr(path)
        except IOError:
            raise HTTPException(status_code=404, detail="Path not found")
            
        results = []
        for item in items:
            is_dir = stat.S_ISDIR(item.st_mode)
            results.append(FileItem(
                name=item.filename,
                size=item.st_size,
                is_dir=is_dir,
                path=f"{path.rstrip('/')}/{item.filename}",
                modify_time=item.st_mtime,
                permissions=str(item.st_mode)
            ))
            
        # Sort directories first
        results.sort(key=lambda x: (not x.is_dir, x.name))
        return results
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if sftp: sftp.close()
        if ssh: ssh.close()

# Simplified Download (Loads into memory for now, should stream directly if large)
# For better streaming we need to keep connection open or yield generator
@router.get("/{service_id}/download")
def download_file(service_id: int, path: str, username: str = None, password: str = None, session: Session = Depends(get_session)):
    service = session.get(Service, service_id)
    if not service: raise HTTPException(status_code=404, detail="Service not found")
    
    # NOTE: keeping ssh connection open for generator is tricky in FastAPI without blocking worker.
    # For MVP, we read small files into memory or use temp file.
    # Let's try direct streaming via iterator if paramiko supports file-like stream
    
    try:
        ssh = paramiko.SSHClient()
        ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
        u = username or service.ssh_username
        p = password or service.ssh_password
        ssh.connect(service.ip, port=service.port or 22, username=u, password=p, timeout=10)
        sftp = ssh.open_sftp()
        
        file_obj = sftp.open(path, 'rb')
        filename = path.split('/')[-1]
        
        def iterfile():
            try:
                while True:
                    data = file_obj.read(8192)
                    if not data: break
                    yield data
            finally:
                file_obj.close()
                sftp.close()
                ssh.close()
        
        # Properly encode filename for Content-Disposition header
        from urllib.parse import quote
        encoded_filename = quote(filename)
        
        return StreamingResponse(
            iterfile(), 
            media_type="application/octet-stream", 
            headers={
                "Content-Disposition": f"attachment; filename=\"{filename}\"; filename*=UTF-8''{encoded_filename}",
                "Access-Control-Expose-Headers": "Content-Disposition",
                "X-Filename": filename  # Fallback header
            }
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


class DeleteRequest(BaseModel):
    path: str
    username: Optional[str] = None
    password: Optional[str] = None


@router.post("/{service_id}/upload")
async def upload_file(
    service_id: int,
    file: UploadFile = File(...),
    path: str = Form("/"),
    username: str = Form(None),
    password: str = Form(None),
    session: Session = Depends(get_session)
):
    service = session.get(Service, service_id)
    if not service:
        raise HTTPException(status_code=404, detail="Service not found")
    
    ssh, sftp = None, None
    try:
        ssh, sftp = get_sftp_client(service, username, password)
        
        # Build remote path
        remote_path = f"{path.rstrip('/')}/{file.filename}"
        
        # Read file content and upload
        content = await file.read()
        with sftp.open(remote_path, 'wb') as remote_file:
            remote_file.write(content)
        
        return {"success": True, "path": remote_path, "message": f"Uploaded {file.filename}"}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if sftp: sftp.close()
        if ssh: ssh.close()


@router.post("/{service_id}/delete")
def delete_file(service_id: int, req: DeleteRequest, session: Session = Depends(get_session)):
    service = session.get(Service, service_id)
    if not service:
        raise HTTPException(status_code=404, detail="Service not found")
    
    ssh, sftp = None, None
    try:
        ssh, sftp = get_sftp_client(service, req.username, req.password)
        
        # Check if it's a directory or file
        try:
            file_stat = sftp.stat(req.path)
            is_dir = stat.S_ISDIR(file_stat.st_mode)
        except IOError:
            raise HTTPException(status_code=404, detail="Path not found")
        
        if is_dir:
            # For directories, we need to recursively delete contents first
            def rmdir_recursive(path):
                for item in sftp.listdir_attr(path):
                    item_path = f"{path.rstrip('/')}/{item.filename}"
                    if stat.S_ISDIR(item.st_mode):
                        rmdir_recursive(item_path)
                    else:
                        sftp.remove(item_path)
                sftp.rmdir(path)
            
            rmdir_recursive(req.path)
        else:
            sftp.remove(req.path)
        
        return {"success": True, "message": f"Deleted {req.path}"}
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if sftp: sftp.close()
        if ssh: ssh.close()

