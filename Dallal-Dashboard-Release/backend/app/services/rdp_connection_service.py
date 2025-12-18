import socket
import logging
from datetime import datetime
from typing import Tuple, Optional
import asyncio

logger = logging.getLogger(__name__)

class RDPConnectionService:
    """Service for managing RDP connections and reachability checks"""
    
    @staticmethod
    def check_rdp_reachability(host: str, port: int = 3389, timeout: float = 2.0) -> Tuple[bool, Optional[str]]:
        """
        Check if RDP server is reachable via TCP socket connection.
        
        Args:
            host: Hostname or IP address
            port: RDP port (default: 3389)
            timeout: Connection timeout in seconds (default: 2.0)
            
        Returns:
            Tuple of (is_reachable, error_message)
        """
        try:
            # Create a socket and try to connect
            sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            sock.settimeout(timeout)
            
            logger.info(f"Checking RDP reachability for {host}:{port}")
            result = sock.connect_ex((host, port))
            sock.close()
            
            if result == 0:
                logger.info(f"✓ {host}:{port} is reachable")
                return True, None
            else:
                logger.warning(f"✗ {host}:{port} is not reachable (error code: {result})")
                return False, f"Connection failed with error code: {result}"
                
        except socket.gaierror as e:
            # Hostname resolution failed
            logger.error(f"✗ Failed to resolve hostname {host}: {e}")
            return False, f"Failed to resolve hostname: {str(e)}"
            
        except socket.timeout:
            logger.warning(f"✗ Connection to {host}:{port} timed out")
            return False, f"Connection timed out after {timeout}s"
            
        except Exception as e:
            logger.error(f"✗ Unexpected error checking {host}:{port}: {e}")
            return False, f"Unexpected error: {str(e)}"
    
    @staticmethod
    async def check_rdp_reachability_async(host: str, port: int = 3389, timeout: float = 2.0) -> Tuple[bool, Optional[str]]:
        """
        Async version of reachability check for use in FastAPI endpoints.
        
        Args:
            host: Hostname or IP address
            port: RDP port (default: 3389)
            timeout: Connection timeout in seconds (default: 2.0)
            
        Returns:
            Tuple of (is_reachable, error_message)
        """
        loop = asyncio.get_event_loop()
        return await loop.run_in_executor(
            None, 
            RDPConnectionService.check_rdp_reachability,
            host,
            port,
            timeout
        )
    
    @staticmethod
    def resolve_hostname(hostname: str) -> Optional[str]:
        """
        Resolve hostname to IP address.
        
        Args:
            hostname: Hostname to resolve
            
        Returns:
            IP address or None if resolution failed
        """
        try:
            ip_address = socket.gethostbyname(hostname)
            logger.info(f"Resolved {hostname} to {ip_address}")
            return ip_address
        except socket.gaierror as e:
            logger.error(f"Failed to resolve {hostname}: {e}")
            return None
    
    @staticmethod
    def validate_connection_params(host: str, port: int, username: str) -> Tuple[bool, Optional[str]]:
        """
        Validate connection parameters before saving.
        
        Args:
            host: Hostname or IP address
            port: Port number
            username: Username
            
        Returns:
            Tuple of (is_valid, error_message)
        """
        # Validate host
        if not host or len(host.strip()) == 0:
            return False, "Host cannot be empty"
        
        # Check for suspicious characters (basic injection prevention)
        suspicious_chars = [';', '&', '|', '`', '$', '(', ')', '{', '}', '<', '>']
        if any(char in host for char in suspicious_chars):
            return False, "Host contains invalid characters"
        
        # Validate port range
        if port < 1 or port > 65535:
            return False, f"Port must be between 1 and 65535 (got {port})"
        
        # Validate username
        if not username or len(username.strip()) == 0:
            return False, "Username cannot be empty"
        
        if any(char in username for char in suspicious_chars):
            return False, "Username contains invalid characters"
        
        return True, None


# Create singleton instance
rdp_connection_service = RDPConnectionService()
