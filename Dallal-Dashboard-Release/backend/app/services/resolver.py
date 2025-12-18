import socket
import asyncio
from typing import Optional
from zeroconf import Zeroconf, ServiceBrowser, ServiceStateChange
from zeroconf.asyncio import AsyncServiceBrowser, AsyncZeroconf

def resolve_hostname(ip: str) -> str:
    """
    Attempt to resolve hostname via Reverse DNS.
    """
    try:
        # Set a short timeout for DNS operations
        socket.setdefaulttimeout(1)
        hostname, _, _ = socket.gethostbyaddr(ip)
        return hostname
    except (socket.herror, socket.gaierror, socket.timeout):
        return ip

# mDNS Cache (Simple in-memory cache)
mdns_cache = {}

class MDNSListener:
    def update_service(self, zc: Zeroconf, type_: str, name: str) -> None:
        pass

    def remove_service(self, zc: Zeroconf, type_: str, name: str) -> None:
        pass

    def add_service(self, zc: Zeroconf, type_: str, name: str) -> None:
        info = zc.get_service_info(type_, name)
        if info and info.addresses:
            # Convert bytes to string IP
            ip = socket.inet_ntoa(info.addresses[0])
            # Store server name (e.g., "MyMac.local.")
            mdns_cache[ip] = info.server.rstrip(".")

async def start_mdns_discovery():
    """
    Start mDNS listener in background to populate cache.
    """
    zc = AsyncZeroconf()
    services = ["_http._tcp.local.", "_workstation._tcp.local.", "_ssh._tcp.local."]
    browser = AsyncServiceBrowser(zc.zeroconf, services, handlers=[MDNSListener().add_service])
    # Keep browser running...
    # In a real app we might want to manage this lifecycle better
    return zc, browser
