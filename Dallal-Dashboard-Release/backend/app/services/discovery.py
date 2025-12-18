import asyncio
import socket
import subprocess
import platform
import ipaddress
import logging
import re
from typing import List, Dict, Optional
from datetime import datetime

from app.services.resolver import resolve_hostname
from app.services.vendor import lookup_vendor

# Try to import SNMP library, but make it optional
try:
    from pysnmp.hlapi import *
    SNMP_AVAILABLE = True
except ImportError:
    SNMP_AVAILABLE = False

logger = logging.getLogger(__name__)

class DiscoveryEngine:
    def __init__(self):
        self.os_type = platform.system().lower()
        self.is_scanning = False
        self.last_results = []
        self.last_scan_time = None
        self.scan_progress = 0
        self.total_ips = 0
        
        # Production settings
        self.max_concurrent = 100  # Max concurrent scans
        self.ping_timeout = 2.0  # seconds
        self.port_timeout = 0.5  # seconds
        self.max_retries = 2
        
    async def start(self):
        """Placeholder for background mDNS or passive discovery"""
        pass

    def stop(self):
        """Cancel any active scan tasks if tracked"""
        pass

    def get_status(self):
        """Return current scan status"""
        return {
            "is_scanning": self.is_scanning,
            "progress": self.scan_progress,
            "total": self.total_ips,
            "result_count": len(self.last_results),
            "last_scan_time": self.last_scan_time
        }
    
    async def scan_network(self, cidrs: List[str] = None):
        """
        Production-grade network scan with multiple detection methods
        """
        if self.is_scanning:
            logger.warning("Scan already in progress")
            return
        
        self.is_scanning = True
        self.last_results = []
        self.scan_progress = 0
        self.last_scan_time = None
        
        try:
            # Determine scan targets
            if not cidrs or len(cidrs) == 0:
                local_ip = self._get_local_ip()
                cidrs = [f"{'.'.join(local_ip.split('.')[:3])}.0/24"]
                logger.info(f'🌐 Auto-detected local IP: {local_ip}, scanning subnet: {cidrs[0]}')
            else:
                logger.info(f'🌐 Scanning configured CIDRs: {cidrs}')
            
            # Generate all IPs to scan
            all_ips = []
            for cidr in cidrs:
                subnet_ips = self._get_subnet_ips(cidr)
                all_ips.extend(subnet_ips)
                logger.info(f'📡 CIDR {cidr} expanded to {len(subnet_ips)} IPs')
            
            # Remove duplicates and sort
            all_ips = sorted(list(set(all_ips)))
            self.total_ips = len(all_ips)
            logger.info(f'🔍 Total IPs to scan: {len(all_ips)}')

            # Scan with controlled concurrency
            semaphore = asyncio.Semaphore(self.max_concurrent)
            found_count = 0
            
            async def scan_with_semaphore(ip):
                async with semaphore:
                    result = await self._scan_host_comprehensive(ip)
                    self.scan_progress += 1
                    return result
            
            # Process in batches for progress tracking
            batch_size = 50
            for i in range(0, len(all_ips), batch_size):
                batch = all_ips[i:i+batch_size]
                batch_num = i//batch_size + 1
                total_batches = (len(all_ips)-1)//batch_size + 1
                logger.debug(f'🔎 Scanning batch {batch_num}/{total_batches}: IPs {batch[0]} to {batch[-1]}')
                
                tasks = [scan_with_semaphore(ip) for ip in batch]
                results = await asyncio.gather(*tasks, return_exceptions=True)
                
                # Collect results
                for result in results:
                    if result and not isinstance(result, Exception):
                        self.last_results.append(result)
                        found_count += 1
                        logger.info(f'✅ Found device: {result["ip"]} ({result.get("hostname", "no hostname")})')
                
                logger.debug(f'📊 Progress: {self.scan_progress}/{self.total_ips}, found {found_count} devices')
        
        finally:
            self.is_scanning = False
            self.scan_progress = self.total_ips
            self.last_scan_time = datetime.now().isoformat()
            logger.info(f'✨ Scan complete! Found {len(self.last_results)} devices out of {self.total_ips} IPs scanned')
    
    def _get_local_ip(self) -> str:
        """Get local IP address"""
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        try:
            s.connect(("8.8.8.8", 80))
            ip = s.getsockname()[0]
        except Exception:
            ip = "127.0.0.1"
        finally:
            s.close()
        return ip

    def _get_subnet_ips(self, ip_or_cidr: str) -> List[str]:
        """Generate list of IPs from CIDR notation"""
        try:
            if '/' in ip_or_cidr:
                net = ipaddress.ip_network(ip_or_cidr, strict=False)
                return [str(ip) for ip in net.hosts()]
            else:
                parts = ip_or_cidr.split(".")
                base = ".".join(parts[:3])
                return [f"{base}.{i}" for i in range(1, 255)]
        except Exception as e:
            logger.error(f"Error parsing IP/CIDR {ip_or_cidr}: {e}")
            return []
    
    async def _scan_host_comprehensive(self, ip: str) -> Optional[Dict]:
        """
        Comprehensive multi-method host scanning
        Uses ARP, ICMP ping, and TCP port checks for maximum reliability
        """
        # Method 1: Try ARP first (most reliable on local network)
        mac = await self._get_mac_from_arp(ip)
        is_alive = mac is not None
        
        # Method 2: Try ICMP ping if ARP failed
        if not is_alive:
            is_alive = await self._ping_host_icmp(ip)
        
        # Method 3: Try common ports if ping failed
        if not is_alive:
            is_alive = await self._check_common_ports(ip)
        
        if not is_alive:
            return None
        
        # Host is alive - gather full details
        device = {
            "ip": ip,
            "hostname": await self._resolve_hostname(ip),
            "mac_address": mac if mac else await self._get_mac_from_arp(ip),  # Try again
            "vendor": None,
            "is_active": True,
            "has_ssh": await self._check_port(ip, 22),
            "has_rdp": await self._check_port(ip, 3389),
            "has_vnc": await self._check_port(ip, 5900),
            "has_http": await self._check_port(ip, 80),
            "has_https": await self._check_port(ip, 443),
            "has_snmp": False,
            "snmp_descr": None,
            "discovered_at": datetime.now().isoformat()
        }
        
        # Vendor lookup
        if device["mac_address"]:
            device["vendor"] = await lookup_vendor(device["mac_address"])
        
        # SNMP check if available
        if SNMP_AVAILABLE:
            loop = asyncio.get_event_loop()
            snmp_active, snmp_descr = await loop.run_in_executor(
                None,
                self._check_snmp_sync,
                ip
            )
            device["has_snmp"] = snmp_active
            device["snmp_descr"] = snmp_descr
        
        return device
    
    async def _ping_host_icmp(self, ip: str) -> bool:
        """ICMP ping with retries"""
        for attempt in range(self.max_retries):
            try:
                param = '-n' if self.os_type == 'windows' else '-c'
                if self.os_type == 'windows':
                    cmd = ['ping', '-n', '1', '-w', '1000', ip]
                else:
                    cmd = ['ping', '-c', '1', '-W', '1', ip]
                
                proc = await asyncio.create_subprocess_exec(
                    *cmd,
                    stdout=asyncio.subprocess.PIPE,
                    stderr=asyncio.subprocess.PIPE
                )
                stdout, stderr = await asyncio.wait_for(
                    proc.communicate(),
                    timeout=self.ping_timeout
                )
                
                if proc.returncode == 0:
                    return True
            except (asyncio.TimeoutError, Exception):
                continue
        
        return False
    
    async def _check_common_ports(self, ip: str) -> bool:
        """Check common ports to detect firewalled devices"""
        common_ports = [80, 443, 22, 3389, 445, 139, 21, 23]
        tasks = [self._check_port(ip, port) for port in common_ports]
        results = await asyncio.gather(*tasks, return_exceptions=True)
        return any(r is True for r in results)
    
    async def _get_mac_from_arp(self, ip: str) -> Optional[str]:
        """Get MAC address from ARP table"""
        try:
            cmd = ['arp', '-a', ip] if self.os_type == 'windows' else ['arp', '-n', ip]
            proc = await asyncio.create_subprocess_exec(
                *cmd,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.DEVNULL
            )
            stdout, _ = await proc.communicate()
            
            if proc.returncode == 0:
                output = stdout.decode('cp1252' if self.os_type == 'windows' else 'utf-8', errors='ignore')
                
                # Parse MAC address
                mac_pattern = r'([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})'
                match = re.search(mac_pattern, output)
                if match:
                    mac = match.group(0).replace('-', ':').upper()
                    return mac
        except Exception as e:
            logger.debug(f"ARP lookup failed for {ip}: {e}")
        
        return None
    
    async def _resolve_hostname(self, ip: str) -> Optional[str]:
        """Resolve IP to hostname"""
        try:
            loop = asyncio.get_event_loop()
            hostname = await asyncio.wait_for(
                loop.run_in_executor(
                    None,
                    lambda: socket.gethostbyaddr(ip)[0]
                ),
                timeout=2.0
            )
            return hostname
        except:
            return None
    
    async def _check_port(self, ip: str, port: int) -> bool:
        """Check if a port is open"""
        try:
            reader, writer = await asyncio.wait_for(
                asyncio.open_connection(ip, port),
                timeout=self.port_timeout
            )
            writer.close()
            await writer.wait_closed()
            return True
        except:
            return False

    def _check_snmp_sync(self, ip: str, community: str = 'public', port: int = 161) -> tuple:
        """Synchronous SNMP check"""
        if not SNMP_AVAILABLE:
            return False, ""
            
        try:
            is_ipv6 = False
            try:
                addr = ipaddress.ip_address(ip)
                is_ipv6 = isinstance(addr, ipaddress.IPv6Address)
            except ValueError:
                pass

            transport = Udp6TransportTarget((ip, port), timeout=1.0, retries=0) if is_ipv6 else UdpTransportTarget((ip, port), timeout=1.0, retries=0)

            iterator = getCmd(
                SnmpEngine(),
                CommunityData(community, mpModel=1),
                transport,
                ContextData(),
                ObjectType(ObjectIdentity('1.3.6.1.2.1.1.1.0'))
            )
            errorIndication, errorStatus, errorIndex, varBinds = next(iterator)
           
            if errorIndication or errorStatus:
                return False, ""
           
            descr = str(varBinds[0][1])
            return True, descr
        except:
            return False, ""

# Global instance
discovery_engine = DiscoveryEngine()
