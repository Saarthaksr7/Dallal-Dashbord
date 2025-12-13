from typing import List
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlmodel import Session, select
from app.core.database import get_session
from app.models.service import Service
from app.services.status_engine import check_and_update_service
from app.api.deps import get_current_user, get_current_admin_user

router = APIRouter()

@router.post("/discovery/scan")
async def scan_network(
    background_tasks: BackgroundTasks,
    current_user = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    from app.services.discovery import discovery_engine
    from app.models.settings import Setting
    import json
    
    if discovery_engine.is_scanning:
        raise HTTPException(status_code=409, detail="Scan already in progress")

    # Fetch Scan Settings
    setting = session.get(Setting, "scan_subnets")
    cidrs = []
    if setting and setting.value:
        try:
            cidrs = json.loads(setting.value)
        except:
            cidrs = [] 
            
    background_tasks.add_task(discovery_engine.scan_network, cidrs)
    return {"status": "started", "detail": "Network scan running in background"}

@router.get("/discovery/status")
async def get_scan_status(
    current_user = Depends(get_current_user)
):
    from app.services.discovery import discovery_engine
    return discovery_engine.get_status()

@router.get("/discovery/results")
async def get_scan_results(
    current_user = Depends(get_current_user)
):
    from app.services.discovery import discovery_engine
    return discovery_engine.last_results

@router.get("/", response_model=List[Service])
def read_services(
    skip: int = 0,
    limit: int = 100,
    session: Session = Depends(get_session),
    current_user = Depends(get_current_user)
):
    services = session.exec(select(Service).offset(skip).limit(limit)).all()
    return services

@router.get("/{service_id}/history", response_model=List[dict]) 
def read_service_history(
    service_id: int,
    limit: int = 50,
    session: Session = Depends(get_session),
    current_user = Depends(get_current_user)
):
    from app.models.history import ServiceHistory
    statement = select(ServiceHistory).where(ServiceHistory.service_id == service_id).order_by(ServiceHistory.timestamp.desc()).limit(limit)
    history = session.exec(statement).all()
    return [item.model_dump() for item in history]

@router.post("/", response_model=Service)
async def create_service(
    service: Service,
    background_tasks: BackgroundTasks,
    session: Session = Depends(get_session),
    current_user = Depends(get_current_user)
):
    # Auto-resolve hostname if missing
    if not service.hostname:
         from app.services.resolver import resolve_hostname
         # Note: resolve_hostname is blocking (socket), should run in executor if high load
         # For now, it's fast enough or we accept small delay
         service.hostname = resolve_hostname(service.ip)

    # Auto-lookup Vendor if MAC is present
    if service.mac_address and not service.vendor:
        from app.services.vendor import lookup_vendor
        service.vendor = await lookup_vendor(service.mac_address)

    if service.ssh_password:
        from app.core.security import encrypt_password
        service.ssh_password = encrypt_password(service.ssh_password)

    session.add(service)
    session.commit()
    session.refresh(service)
    
    # Audit Log
    from app.services.audit import log_audit
    log_audit(username=current_user.username, action="CREATE_SERVICE", details=f"Created service {service.name} ({service.ip})")

    # Trigger initial check (Pass ID, not object/session)
    background_tasks.add_task(check_and_update_service, service.id)
    return service

@router.post("/{service_id}/scan", response_model=Service)
async def scan_service(
    service_id: int,
    session: Session = Depends(get_session),
    current_user = Depends(get_current_user)
):
    service = session.get(Service, service_id)
    if not service:
        raise HTTPException(status_code=404, detail="Service not found")
    
    await check_and_update_service(service, session)
    session.refresh(service)
    return service

@router.post("/resolve")
def resolve_ip(ip: str):
    from app.services.resolver import resolve_hostname
    hostname = resolve_hostname(ip)
    return {"ip": ip, "hostname": hostname}

@router.post("/{service_id}/wake")
def wake_service(
    service_id: int,
    session: Session = Depends(get_session),
    current_user = Depends(get_current_user)
):
    service = session.get(Service, service_id)
    if not service:
        raise HTTPException(status_code=404, detail="Service not found")
        
    if not service.mac_address:
         raise HTTPException(status_code=400, detail="MAC address required for Wake-on-LAN")

    from app.services.wol import wol_service
    try:
        wol_service.wake_device(service.mac_address)
        
        # Audit
        from app.services.audit import log_audit
        log_audit(username=current_user.username, action="WAKE_SERVICE", details=f"Sent WoL packet to {service.name} ({service.mac_address})")
        
        return {"status": "success", "message": f"Magic packet sent to {service.mac_address}"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/{service_id}/start")
async def start_service(
    service_id: int,
    session: Session = Depends(get_session),
    current_user = Depends(get_current_user)
):
    """Start a service via SSH systemd command"""
    service = session.get(Service, service_id)
    if not service:
        raise HTTPException(status_code=404, detail="Service not found")
    
    #Check if configured for remote control
    if not service.restart_command:
        # Default to systemd if no custom command
        command = f"sudo systemctl start {service.name}" 
    else:
        # Use custom start command (user-defined)
        command = service.restart_command.replace("restart", "start")
    
    # Execute via SSH
    if not service.ssh_username or not service.ssh_password:
        raise HTTPException(status_code=400, detail="SSH credentials required for remote service control")
    
    try:
        import paramiko
        from app.core.security import decrypt_password
        
        plain_pass = decrypt_password(service.ssh_password)
        
        client = paramiko.SSHClient()
        client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
        client.connect(service.ip, port=service.port or 22, username=service.ssh_username, password=plain_pass, timeout=10)
        
        stdin, stdout, stderr = client.exec_command(command)
        output = stdout.read().decode()
        error = stderr.read().decode()
        client.close()
        
        # Audit
        from app.services.audit import log_audit
        log_audit(username=current_user.username, action="START_SERVICE", details=f"Started service {service.name} on {service.ip}")
        
        return {"status": "success", "message": f"Service start command executed", "output": output, "error": error}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to start service: {str(e)}")

@router.post("/{service_id}/stop")
async def stop_service(
    service_id: int,
    session: Session = Depends(get_session),
    current_user = Depends(get_current_user)
):
    """Stop a service via SSH systemd command"""
    service = session.get(Service, service_id)
    if not service:
        raise HTTPException(status_code=404, detail="Service not found")
    
    # Check if configured for remote control
    if not service.restart_command:
        command = f"sudo systemctl stop {service.name}"
    else:
        command = service.restart_command.replace("restart", "stop")
    
    if not service.ssh_username or not service.ssh_password:
        raise HTTPException(status_code=400, detail="SSH credentials required for remote service control")
    
    try:
        import paramiko
        from app.core.security import decrypt_password
        
        plain_pass = decrypt_password(service.ssh_password)
        
        client = paramiko.SSHClient()
        client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
        client.connect(service.ip, port=service.port or 22, username=service.ssh_username, password=plain_pass, timeout=10)
        
        stdin, stdout, stderr = client.exec_command(command)
        output = stdout.read().decode()
        error = stderr.read().decode()
        client.close()
        
        # Audit
        from app.services.audit import log_audit
        log_audit(username=current_user.username, action="STOP_SERVICE", details=f"Stopped service {service.name} on {service.ip}")
        
        return {"status": "success", "message": f"Service stop command executed", "output": output, "error": error}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to stop service: {str(e)}")

@router.post("/{service_id}/restart")
async def restart_service(
    service_id: int,
    session: Session = Depends(get_session),
    current_user = Depends(get_current_user)
):
    """Restart a service via SSH systemd command"""
    service = session.get(Service, service_id)
    if not service:
        raise HTTPException(status_code=404, detail="Service not found")
    
    # Use custom restart command if available
    if not service.restart_command:
        command = f"sudo systemctl restart {service.name}"
    else:
        command = service.restart_command
    
    if not service.ssh_username or not service.ssh_password:
        raise HTTPException(status_code=400, detail="SSH credentials required for remote service control")
    
    try:
        import paramiko
        from app.core.security import decrypt_password
        
        plain_pass = decrypt_password(service.ssh_password)
        
        client = paramiko.SSHClient()
        client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
        client.connect(service.ip, port=service.port or 22, username=service.ssh_username, password=plain_pass, timeout=10)
        
        stdin, stdout, stderr = client.exec_command(command)
        output = stdout.read().decode()
        error = stderr.read().decode()
        client.close()
        
        # Audit
        from app.services.audit import log_audit
        log_audit(username=current_user.username, action="RESTART_SERVICE", details=f"Restarted service {service.name} on {service.ip}")
        
        return {"status": "success", "message": f"Service restart command executed", "output": output, "error": error}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to restart service: {str(e)}")


from app.schemas.service_update import ServiceUpdate

@router.put("/{service_id}", response_model=Service)
def update_service(
    service_id: int,
    service_in: ServiceUpdate,
    session: Session = Depends(get_session),
    current_user = Depends(get_current_user)
):
    try:
        service = session.get(Service, service_id)
        if not service:
            raise HTTPException(status_code=404, detail="Service not found")
            
        service_data = service_in.model_dump(exclude_unset=True)
        
        # Handle Password Encryption if changed
        if 'ssh_password' in service_data and service_data['ssh_password']:
             from app.core.security import encrypt_password
             service_data['ssh_password'] = encrypt_password(service_data['ssh_password'])

        for key, value in service_data.items():
            setattr(service, key, value)
            
        session.add(service)
        session.commit()
        session.refresh(service)
        
        # Audit
        from app.services.audit import log_audit
        log_audit(username=current_user.username, action="UPDATE_SERVICE", details=f"Updated service {service.name}")
        
        return service
    except HTTPException:
        raise
    except Exception as e:
        import traceback
        error_msg = f"Error updating service: {str(e)}\n{traceback.format_exc()}"
        print(error_msg)  # This will show in terminal
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/{service_id}")
def delete_service(
    service_id: int,
    session: Session = Depends(get_session),
    current_user = Depends(get_current_user)  # All authenticated users can delete
):
    service = session.get(Service, service_id)
    if not service:
        raise HTTPException(status_code=404, detail="Service not found")
    
    service_name = service.name
    session.delete(service)
    session.commit()
    
    # Audit
    from app.services.audit import log_audit
    log_audit(username=current_user.username, action="DELETE_SERVICE", details=f"Deleted service {service_name} (ID: {service_id})")
    
    return {"status": "success", "message": f"Service {service_name} deleted"}

