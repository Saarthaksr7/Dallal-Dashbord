import asyncio
import httpx
import time
import sys
import tempfile
import os
import subprocess
import paramiko
from datetime import datetime
from sqlalchemy.orm import Session
from app.models.service import Service, CheckType
from app.models.history import ServiceHistory
from loguru import logger
from pysnmp.hlapi import *

import ipaddress
from pysnmp.hlapi import *

async def check_snmp(ip: str, community: str = 'public', port: int = 161) -> tuple[bool, str]:
    try:
        # Determine Transport Target (IPv4 vs IPv6)
        is_ipv6 = False
        try:
             addr = ipaddress.ip_address(ip)
             is_ipv6 = isinstance(addr, ipaddress.IPv6Address)
        except ValueError:
             pass # Hostname or invalid IP, assume IPv4/Hostname default
             
        transport = Udp6TransportTarget((ip, port), timeout=1.0, retries=0) if is_ipv6 else UdpTransportTarget((ip, port), timeout=1.0, retries=0)

        # Query sysDescr (1.3.6.1.2.1.1.1.0)
        iterator = getCmd(
            SnmpEngine(),
            CommunityData(community, mpModel=1), # v2c
            transport,
            ContextData(),
            ObjectType(ObjectIdentity('1.3.6.1.2.1.1.1.0')), # sysDescr
            ObjectType(ObjectIdentity('1.3.6.1.2.1.1.3.0'))  # sysUpTime
        )
        
        # Pysnmp is sync, so we should run it in executor if possible, but for now blocking is okay-ish 
        # or we wrap it. Let's assume low load or wrap in to_thread later if needed.
        # Actually, let's keep it simple.
        
        errorIndication, errorStatus, errorIndex, varBinds = next(iterator)
        
        if errorIndication:
            return False, str(errorIndication)
        elif errorStatus:
             return False, str(errorStatus)
        else:
             # Success
             descr = str(varBinds[0][1])
             uptime = str(varBinds[1][1]) 
             return True, f"SNMP OK. {descr} | Uptime: {uptime}"
    except Exception as e:
        return False, str(e)


def get_ssh_stats(ip, port, username, password):
    try:
        client = paramiko.SSHClient()
        client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
        client.connect(ip, port=port or 22, username=username, password=password, timeout=5)
        stats = {}

        # 1. CPU Usage
        # top -bn1 | grep "Cpu(s)"
        stdin, stdout, stderr = client.exec_command("top -bn1 | grep 'Cpu(s)'")
        cpu_line = stdout.read().decode().strip()
        if cpu_line:
            parts = cpu_line.split(',')
            for p in parts:
                if 'id' in p:
                    idle = float(p.strip().split()[0])
                    stats['cpu'] = round(100 - idle, 1)
                    break
        if 'cpu' not in stats: stats['cpu'] = 0.0

        # 2. RAM Usage
        # free -m | grep Mem
        stdin, stdout, stderr = client.exec_command("free -m | grep Mem")
        mem_line = stdout.read().decode().strip()
        if mem_line:
            parts = mem_line.split()
            total = int(parts[1])
            used = int(parts[2])
            stats['ram'] = round((used / total) * 100, 1)

        # 3. Disk Usage (Root)
        # df -h / | tail -1
        stdin, stdout, stderr = client.exec_command("df -h / | tail -1")
        disk_line = stdout.read().decode().strip()
        if disk_line:
            parts = disk_line.split()
            percent = parts[4].replace('%', '')
            stats['disk'] = float(percent)

        client.close()
        return stats
    except Exception as e:
        logger.warning(f"SSH Stats Failed: {e}")
        return None

async def check_tcp(host: str, port: int, timeout: int = 2) -> tuple[bool, str]:
    try:
        reader, writer = await asyncio.wait_for(
            asyncio.open_connection(host, port), timeout=timeout
        )
        # Try to read a banner
        banner = ""
        try:
            # Short read timeout for banner
            data = await asyncio.wait_for(reader.read(1024), timeout=1.0)
            banner = data.decode('utf-8', errors='ignore').strip()
        except:
            pass
            
        writer.close()
        await writer.wait_closed()
        return True, banner
    except (asyncio.TimeoutError, ConnectionRefusedError, OSError):
        return False, "Connection Failed"
    except Exception as e:
        return False, str(e)

async def check_http(url: str, timeout: int = 5) -> tuple[bool, str]:
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(url, timeout=timeout)
            is_ok = 200 <= response.status_code < 400
            return is_ok, response.text
    except httpx.TimeoutException:
        return False, "Timeout"
    except httpx.ConnectError:
        return False, "Connection Refused"
    except Exception as e:
        return False, str(e)

async def check_script(content: str, timeout: int = 5) -> tuple[bool, str]:
    if not content: return False, ""
    try:
        # Create temp file
        with tempfile.NamedTemporaryFile(mode='w', suffix='.py', delete=False) as f:
            f.write(content)
            temp_path = f.name
        
        # Execute
        proc = await asyncio.create_subprocess_exec(
            sys.executable, temp_path,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE
        )
        
        try:
            stdout, stderr = await asyncio.wait_for(proc.communicate(), timeout=timeout)
            output = stdout.decode('utf-8', errors='ignore') + stderr.decode('utf-8', errors='ignore')
            return proc.returncode == 0, output
        except asyncio.TimeoutError:
            proc.kill()
            return False, "Timeout"
        finally:
            if os.path.exists(temp_path):
                os.remove(temp_path)
    except Exception as e:
        logger.error(f"Script check failed: {e}")
        return False, str(e)

async def perform_check(service: Service) -> tuple[bool, int, str]:
    start_time = time.time()
    is_active = False
    response_content = ""
    
    try:
        if service.check_type == CheckType.TCP:
            if service.port:
                is_active, response_content = await check_tcp(service.ip, service.port)
        elif service.check_type == CheckType.HTTP:
            target = service.check_target or ""
            if not target.startswith("http"):
                 port_str = f":{service.port}" if service.port else ""
                 url = f"http://{service.ip}{port_str}{target}"
            else:
                 url = target
            is_active, response_content = await check_http(url)
        elif service.check_type == CheckType.SCRIPT:
            is_active, response_content = await check_script(service.script_content)
        elif service.check_type == CheckType.SNMP:
            is_active, response_content = await check_snmp(service.ip, service.snmp_community, service.snmp_port)
            if is_active:
                 # Parse response to update service fields if we wanted, 
                 # but check_and_update_service handles the string content.
                 # We might want to parse 'sys_descr' from the content string here if we want to save it separately.
                 # Content fmt: "SNMP OK. {descr} | Uptime: {uptime}"
                 parts = response_content.split("| Uptime:")
                 if len(parts) > 0:
                     service.sys_descr = parts[0].replace("SNMP OK. ", "").strip()
                 if len(parts) > 1:
                     # uptime is tricky to parse from string back to int ticks without regex, 
                     # but we can just store string representation in sys_descr or separate field if valid.
                     pass

    except Exception as e:
        # Catch-all for perform_check to prevent crash
        logger.error(f"Check failed for {service.name} ({service.ip}): {e}")
        is_active = False
        response_content = f"Error: {str(e)}"

    duration = int((time.time() - start_time) * 1000)
    return is_active, duration, response_content

from app.core.database import engine
from sqlmodel import Session, select

def get_snmp_stats(ip: str, community: str = 'public', port: int = 161) -> dict:
    stats = {}
    try:
        # Determine Transport (Basic IPv4 support for stats for now, can expand later if needed)
        transport = UdpTransportTarget((ip, port), timeout=1.0, retries=0)
        
        # UCD-SNMP OIDs
        # ssCpuIdle: .1.3.6.1.4.1.2021.11.11.0
        # memTotalReal: .1.3.6.1.4.1.2021.4.5.0
        # memAvailReal: .1.3.6.1.4.1.2021.4.6.0
        # dskPercent (root partition usually index 1): .1.3.6.1.4.1.2021.9.1.9.1
        
        iterator = getCmd(
            SnmpEngine(),
            CommunityData(community, mpModel=1),
            transport,
            ContextData(),
            ObjectType(ObjectIdentity('1.3.6.1.4.1.2021.11.11.0')), 
            ObjectType(ObjectIdentity('1.3.6.1.4.1.2021.4.5.0')),  
            ObjectType(ObjectIdentity('1.3.6.1.4.1.2021.4.6.0')),
            ObjectType(ObjectIdentity('1.3.6.1.4.1.2021.9.1.9.1')) 
        )
        
        errorIndication, errorStatus, errorIndex, varBinds = next(iterator)
        
        if not errorIndication and not errorStatus:
            try:
                # Type check/conversion can be tricky with pysnmp types, casting to int usually works
                cpu_idle = int(varBinds[0][1])
                mem_total = int(varBinds[1][1])
                mem_avail = int(varBinds[2][1])
                disk_percent = int(varBinds[3][1])
                
                stats['cpu'] = round(100.0 - cpu_idle, 1)
                if mem_total > 0:
                    stats['ram'] = round(((mem_total - mem_avail) / mem_total) * 100, 1)
                stats['disk'] = float(disk_percent)
            except Exception as e:
                # logger.warning(f"SNMP Stats parse error: {e}")
                pass

    except Exception:
        pass
    return stats

async def check_and_update_service(service_id: int):
    with Session(engine) as session:
        service = session.get(Service, service_id)
        if not service:
            return

        is_active, duration, content = await perform_check(service)
        
        # Drift Detection Logic
        drift = False
        if is_active and service.expected_response:
            if service.expected_response not in content:
                drift = True
        
        service.is_active = is_active
        service.response_time_ms = duration
        service.last_checked = datetime.utcnow()
        service.drift_detected = drift
        
        # Collect Resource Stats (SSH or SNMP)
        stats = {}
        
        # 1. Try SSH if credentials exist
        if service.ssh_username and service.ssh_password:
             from app.core.security import decrypt_password
             plain_pass = decrypt_password(service.ssh_password)
             stats = get_ssh_stats(service.ip, service.port, service.ssh_username, plain_pass) or {}
             
        # 2. If no SSH stats and check_type is SNMP, try SNMP stats
        if not stats and service.check_type == CheckType.SNMP:
            # We wrap this because get_snmp_stats is sync
            # For simplicity, calling directly as it's fast UDP, but technically blocking. 
            # Given single thread loop in monitor, it's acceptable for now.
            stats = get_snmp_stats(service.ip, service.snmp_community, service.snmp_port)

        # Update Service Model
        if stats:
             service.cpu_usage = stats.get('cpu')
             service.ram_usage = stats.get('ram')
             service.disk_usage = stats.get('disk')

        session.add(service)

        # Record History
        history = ServiceHistory(
            service_id=service.id,
            is_active=is_active,
            latency_ms=duration,
            cpu_usage=service.cpu_usage,
            ram_usage=service.ram_usage,
            disk_usage=service.disk_usage
        )
        
        # Webhook Notification (on Status Change)
        if service.is_active != is_active:
             # Status changed!
             # Fire and forget webhook
             from app.services.notification import notification_service
             
             payload = {
                 "event": "status_change",
                 "service_id": service.id,
                 "service_name": service.name,
                 "ip": service.ip,
                 "status": "UP" if is_active else "DOWN",
                 "timestamp": datetime.utcnow().isoformat()
             }
             
             await notification_service.send_notification("status_change", payload)

             # Auto-Healing Logic (Trigger only when going DOWN)
             if not is_active and service.auto_restart and service.restart_command:
                 now = datetime.utcnow()
                 # Check cooldown (15 minutes = 900 seconds)
                 if not service.last_healed or (now - service.last_healed).total_seconds() > 900:
                     logger.info(f"Auto-Healing triggered for {service.name} ({service.ip})")
                     try:
                         # For now, only SSH commands supported
                         if service.ssh_username and service.ssh_password:
                             from app.core.security import decrypt_password
                             plain_pass = decrypt_password(service.ssh_password)
                             
                             # We use paramiko to exec command
                             client = paramiko.SSHClient()
                             client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
                             client.connect(
                                 service.ip, 
                                 port=service.port or 22, 
                                 username=service.ssh_username, 
                                 password=plain_pass, 
                                 timeout=10
                             )
                             stdin, stdout, stderr = client.exec_command(service.restart_command)
                             # We don't really care about output for now, just that we sent it.
                             # But maybe log it?
                             out = stdout.read().decode().strip()
                             err = stderr.read().decode().strip()
                             client.close()
                             
                             service.last_healed = now
                             logger.info(f"Auto-Heal Command Executed: {service.restart_command} | Out: {out} | Err: {err}")
                             
                             # Log to Audit/History? 
                             # Maybe add a special event to history or separate log?
                             # For now, just relying on logger.
                             
                     except Exception as e:
                         logger.error(f"Auto-Healing Failed: {e}")

        session.add(history)
        
        session.commit()

import threading

class ServiceMonitor:
    def __init__(self):
        self._stop_event = threading.Event()
        self._thread = None

    def start(self):
        self._stop_event.clear()
        self._thread = threading.Thread(target=self._loop, daemon=True)
        self._thread.start()

    def stop(self):
        if self._thread:
            self._stop_event.set()
            self._thread.join()

    def _loop(self):
        while not self._stop_event.is_set():
            try:
                # We need a fresh event loop for the thread to run async tasks
                asyncio.run(self._check_all())
            except Exception as e:
                logger.error(f'Monitor Loop Error: {e}')
            
            # Simple sleep
            time.sleep(10)

    async def _check_all(self):
        with Session(engine) as session:
            statement = select(Service)
            services = session.exec(statement).all()
            
            for service in services:
                 # Check interval logic
                 if service.last_checked and service.check_interval:
                     elapsed = (datetime.utcnow() - service.last_checked).total_seconds()
                     if elapsed < service.check_interval:
                         continue

                 await check_and_update_service(service.id)

service_monitor = ServiceMonitor()
