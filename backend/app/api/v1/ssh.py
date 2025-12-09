from fastapi import APIRouter, Depends, HTTPException, WebSocket, WebSocketDisconnect
from sqlmodel import Session
from app.core.database import get_session
from app.models.service import Service
from pydantic import BaseModel
import paramiko
import asyncio
from loguru import logger

router = APIRouter()

class CommandRequest(BaseModel):
    username: str
    password: str
    command: str

@router.post("/exec/{service_id}")
def execute_command(service_id: int, request: CommandRequest, session: Session = Depends(get_session)):
    service = session.get(Service, service_id)
    if not service:
        # Also try to check local auth if request creds missing? For now require them
        raise HTTPException(status_code=404, detail="Service not found")
            
    try:
        u = request.username
        p = request.password
        
        # If blank, try saved
        if not p and service.ssh_password:
             from app.core.security import decrypt_password
             p = decrypt_password(service.ssh_password)
        if not u and service.ssh_username:
             u = service.ssh_username
             
        if not u or not p:
             raise HTTPException(status_code=400, detail="Credentials missing")

        client = paramiko.SSHClient()
        client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
        client.connect(
            hostname=service.ip,
            port=service.port or 22,
            username=u,
            password=p,
            timeout=10
        )
        
        stdin, stdout, stderr = client.exec_command(request.command)
        out = stdout.read().decode().strip()
        err = stderr.read().decode().strip()
        
        client.close()
        
        return {
            "stdout": out,
            "stderr": err,
            "exit_code": stdout.channel.recv_exit_status()
        }
    except Exception as e:
        logger.error(f"SSH Exec Failed: {e}")
        return {"error": str(e)}

@router.websocket("/ws/ssh/{service_id}")
async def ssh_websocket(websocket: WebSocket, service_id: int, session: Session = Depends(get_session)):
    await websocket.accept()
    
    # Authenticate / Validate Service
    try:
        service = session.get(Service, service_id)
        if not service:
            await websocket.close(code=4004, reason="Service not found")
            return
            
        # Initial Handshake for Credentials
        # Client should send JSON: { "username": "...", "password": "..." }
        data = await websocket.receive_json()
        username = data.get("username")
        password = data.get("password")
        
        # If client sends empty password but service has saved one, use saved (decrypted)
        if not password and service.ssh_password:
             from app.core.security import decrypt_password
             password = decrypt_password(service.ssh_password)
             # Should we also use saved username if blank?
             if not username and service.ssh_username:
                 username = service.ssh_username
        
        if not username or not password:
            await websocket.close(code=4003, reason="Credentials required")
            return

        # Connect SSH
        client = paramiko.SSHClient()
        client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
        
        try:
            client.connect(
                hostname=service.ip,
                port=service.port or 22,
                username=username,
                password=password,
                timeout=10
            )
        except Exception as e:
            logger.error(f"SSH Connect Failed: {e}")
            await websocket.send_text(f"Error: {str(e)}\r\n")
            await websocket.close(code=4000)
            return

        # Open Shell
        channel = client.invoke_shell()
        channel.settimeout(0.0) # Non-blocking

        # Piping Loop
        try:
            while True:
                # 1. Read from SSH -> WebSocket
                if channel.recv_ready():
                    output = channel.recv(1024).decode('utf-8', errors='ignore')
                    await websocket.send_text(output)
                
                # 2. Read from WebSocket -> SSH (Non-blocking check? WS is async)
                # This is tricky because `receive_text` awaits. 
                # We need a concurrent task or select.
                
                # Proper async pattern:
                # We need two loops? Or run_in_executor for paramiko blocking calls?
                # Paramiko is blocking/sync. 
                
                # Better approach: create a background task to read from channel
                # and main loop reads from websocket. However, Paramiko is not async friendly.
                # Let's use a small sleep loop or a specialized library like `asyncssh` would be better,
                # but plan said `paramiko`.
                
                # Simple polling loop for MVP (Performance Warning)
                await asyncio.sleep(0.01)
                
                # We can't await receive_text() AND poll channel in same loop easily without task.
                # So we spawn a reader/writer structure.
                break # Replaced by logic below
                
        except:
             pass
             
        # Re-Structure for bidirectional
        async def forward_ssh_to_ws():
            try:
                while True:
                    if channel.recv_ready():
                        data = channel.recv(4096).decode('utf-8', errors='ignore')
                        await websocket.send_text(data)
                    else:
                        await asyncio.sleep(0.05)
                        if channel.exit_status_ready():
                            break
            except Exception as e:
                logger.error(f"SSH->WS Error: {e}")
                
        # Main loop: WS -> SSH
        # Start SSH reader task
        task = asyncio.create_task(forward_ssh_to_ws())
        
        try:
            while True:
                command = await websocket.receive_text()
                # If using xterm, we get keystrokes. Send straight to channel.
                channel.send(command)
        except WebSocketDisconnect:
            pass
        except Exception as e:
            logger.error(f"WS->SSH Error: {e}")
        finally:
            task.cancel()
            client.close()
            
    except Exception as e:
        logger.error(f"WebSocket Error: {e}")
        await websocket.close()
