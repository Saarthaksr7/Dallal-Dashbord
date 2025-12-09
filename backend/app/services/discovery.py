import asyncio
import socket
import subprocess
import platform
from typing import List, Dict
from app.services.resolver import resolve_hostname
from app.services.vendor import lookup_vendor
from pysnmp.hlapi import *
import concurrent.futures

class DiscoveryEngine:
    def __init__(self):
        self.os_type = platform.system().lower()
        self.is_scanning = False
        self.last_results = []
        self.last_scan_time = None

    async def start(self):
        # Placeholder for background mDNS or passive discovery
        pass

    def stop(self):
        # Cancel any active scan tasks if tracked
        pass

    def get_status(self):
        return {
            "is_scanning": self.is_scanning,
            "last_scan_time": self.last_scan_time,
            "result_count": len(self.last_results)
        }

    def _get_local_ip(self):
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        try:
            # unlikely to connect to this, but triggers OS to select interface
            s.connect(("8.8.8.8", 80))
            ip = s.getsockname()[0]
        except Exception:
            ip = "127.0.0.1"
        finally:
            s.close()
        return ip

    def _get_subnet_ips(self, ip_or_cidr: str) -> List[str]:
        """
        Generates list of IPs from a CIDR (192.168.1.0/24) or single IP (defaults to /24 of that IP).
        """
        try:
            if '/' in ip_or_cidr:
                # CIDR
                net = ipaddress.ip_network(ip_or_cidr, strict=False)
                return [str(ip) for ip in net]
            else:
                # Fallback to old behavior (simple C class) or strict /24
                # Let's try to interpret as IP and get /24
                # Note: This is a simplification
                parts = ip_or_cidr.split(".")
                base = ".".join(parts[:3])
                return [f"{base}.{i}" for i in range(1, 255)]
        except Exception as e:
            return []

    async def _ping(self, ip: str) -> bool:
        param = '-n' if self.os_type == 'windows' else '-c'
        # Reduced timeout/count for speed
        cmd = ['ping', param, '1', '-w', '200' if self.os_type == 'windows' else '0.2', ip]
        
        proc = await asyncio.create_subprocess_exec(
            *cmd,
            stdout=asyncio.subprocess.DEVNULL,
            stderr=asyncio.subprocess.DEVNULL
        )
        await proc.wait()
        return proc.returncode == 0

    async def _get_mac_from_arp(self, ip: str) -> str:
        try:
            # Run arp -a and parse
            cmd = ['arp', '-a', ip]
            proc = await asyncio.create_subprocess_exec(
                *cmd,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.DEVNULL
            )
            stdout, _ = await proc.communicate()
            if proc.returncode == 0:
                output = stdout.decode('cp1252' if self.os_type == 'windows' else 'utf-8', errors='ignore')
                # Configurable regex for MAC?
                # Windows output: "  192.168.1.1          12-34-56-78-9a-bc     dynamic"
                for line in output.splitlines():
                    if ip in line:
                         # Simple extraction strategy: find parts looking like MAC
                         parts = line.split()
                         for part in parts:
                             if '-' in part and len(part) == 17: # Windows format
                                 return part
                             if ':' in part and len(part) == 17: # Unix format
                                 return part
        except:
            pass
        return None

    async def _check_port(self, ip: str, port: int) -> bool:
        try:
            # Short timeout for internal network scan
            conn = asyncio.open_connection(ip, port)
            reader, writer = await asyncio.wait_for(conn, timeout=0.5)
            writer.close()
            await writer.wait_closed()
            return True
        except:
            return False

    def _check_snmp_sync(self, ip: str, community: str = 'public', port: int = 161) -> tuple[bool, str]:
        """
        Synchronous SNMP check to be run in executor.
        Returns (is_active, sys_descr)
        """
        try:
           # Determine Transport
           is_ipv6 = False
           try:
                addr = ipaddress.ip_address(ip)
                is_ipv6 = isinstance(addr, ipaddress.IPv6Address)
           except ValueError:
                pass

           transport = Udp6TransportTarget((ip, port), timeout=1.0, retries=0) if is_ipv6 else UdpTransportTarget((ip, port), timeout=1.0, retries=0)

           iterator = getCmd(
                SnmpEngine(),
                CommunityData(community, mpModel=1), # v2c
                transport,
                ContextData(),
                ObjectType(ObjectIdentity('1.3.6.1.2.1.1.1.0')) # sysDescr
            )
           errorIndication, errorStatus, errorIndex, varBinds = next(iterator)
           
           if errorIndication or errorStatus:
               return False, ""
           
           descr = str(varBinds[0][1])
           return True, descr
        except:
            return False, ""

    async def _check_snmp(self, ip: str) -> tuple[bool, str]:
        loop = asyncio.get_running_loop()
        # Use a default executor (Thread pool)
        try:
             return await loop.run_in_executor(None, self._check_snmp_sync, ip)
        except Exception:
             return False, ""

    async def scan_network(self, cidrs: List[str] = None):
        if self.is_scanning:
            return # Already running
            
        self.is_scanning = True
        self.last_results = [] # Clear previous results or keep them until new ones ready? Usually clear or overlay. Let's clear.
        
        try:
            target_ips = []
            if cidrs:
                for cidr in cidrs:
                    target_ips.extend(self._get_subnet_ips(cidr))
            else:
                 local_ip = self._get_local_ip()
                 target_ips = self._get_subnet_ips(local_ip)
            
            # Remove duplicates
            target_ips = list(set(target_ips))
    
            # Limit concurrency but scan all
            sem = asyncio.Semaphore(20) # Reduced for safety on Windows
    
            async def scan_host(ip):
                try:
                    async with sem:
                        is_alive = await self._ping(ip)
                        if is_alive:
                            hostname = resolve_hostname(ip)
                            mac = await self._get_mac_from_arp(ip)
                            vendor = await lookup_vendor(mac) if mac else None
                            
                            # Check ports
                            has_ssh = await self._check_port(ip, 22)
                            has_rdp = await self._check_port(ip, 3389)
                            has_vnc = await self._check_port(ip, 5900)
                            has_http = await self._check_port(ip, 80)
                            has_https = await self._check_port(ip, 443)
                            
                            # Check SNMP
                            has_snmp, snmp_descr = await self._check_snmp(ip)
                            
                            return {
                                "ip": ip,
                                "hostname": hostname,
                                "mac_address": mac,
                                "vendor": vendor,
                                "is_active": True,
                                "has_ssh": has_ssh,
                                "has_rdp": has_rdp,
                                "has_vnc": has_vnc,
                                "has_http": has_http,
                                "has_https": has_https,
                                "has_snmp": has_snmp,
                                "snmp_descr": snmp_descr
                            }
                except Exception as e:
                    pass
                return None
    
            # Chunk tasks if too many IPs? 
            # For /24 (254 IPs) it's fine. 
            if len(target_ips) > 1024:
                target_ips = target_ips[:1024]
                
            tasks = [scan_host(ip) for ip in target_ips]
            results = await asyncio.gather(*tasks)
            self.last_results = [r for r in results if r is not None]
            
            from datetime import datetime
            self.last_scan_time = datetime.now()
            
        finally:
            self.is_scanning = False

discovery_engine = DiscoveryEngine()
