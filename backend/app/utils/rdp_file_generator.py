import base64
from typing import Optional
import logging

logger = logging.getLogger(__name__)


class RDPFileGenerator:
    """Generate .rdp files for Remote Desktop connections"""
    
    @staticmethod
    def generate_rdp_file(
        host: str,
        username: str,
        port: int = 3389,
        domain: Optional[str] = None,
        resolution: str = "1920x1080",
        color_depth: int = 24,
        password: Optional[str] = None,
        include_password: bool = False,
        fullscreen: bool = False
    ) -> str:
        """
        Generate .rdp file content.
        
        Args:
            host: Hostname or IP address
            username: Username for authentication
            port: RDP port (default: 3389)
            domain: Windows domain (optional)
            resolution: Screen resolution (e.g., "1920x1080")
            color_depth: Color depth in bits (8, 16, 24, 32)
            password: Password (optional, will be base64 encoded if included)
            include_password: Whether to embed password in file (security trade-off)
            fullscreen: Whether to use fullscreen mode
            
        Returns:
            String containing .rdp file content
        """
        # Parse resolution
        try:
            width, height = resolution.split('x')
            width = int(width)
            height = int(height)
        except:
            logger.warning(f"Invalid resolution {resolution}, using 1920x1080")
            width, height = 1920, 1080
        
        # Map color depth to RDP session bpp value
        # 8 = 256 colors, 15 = 32k colors, 16 = 64k colors, 24 = 16m colors, 32 = true color
        bpp_map = {8: 8, 16: 16, 24: 24, 32: 32}
        bpp = bpp_map.get(color_depth, 24)
        
        # Build .rdp file content
        rdp_content = []
        
        # Connection settings
        rdp_content.append(f"full address:s:{host}:{port}")
        
        # Authentication
        if username:
            rdp_content.append(f"username:s:{username}")
        
        if domain:
            rdp_content.append(f"domain:s:{domain}")
        
        # Password (base64 encoded) - optional
        if include_password and password:
            # Note: This is NOT secure encryption, just encoding
            # The password can be easily decoded
            password_b64 = base64.b64encode(password.encode('utf-16-le')).decode('ascii')
            rdp_content.append(f"password 51:b:{password_b64}")
            logger.warning("Password embedded in .rdp file (base64 encoded, not encrypted)")
        
        # Display settings
        if fullscreen:
            rdp_content.append("screen mode id:i:2")  # 2 = fullscreen
        else:
            rdp_content.append("screen mode id:i:1")  # 1 = windowed
            
        rdp_content.append(f"desktopwidth:i:{width}")
        rdp_content.append(f"desktopheight:i:{height}")
        rdp_content.append(f"session bpp:i:{bpp}")
        
        # Performance and behavior settings
        rdp_content.append("compression:i:1")  # Enable compression
        rdp_content.append("keyboardhook:i:2")  # Apply Windows key combinations in full screen
        rdp_content.append("audiocapturemode:i:0")  # Disable audio capture
        rdp_content.append("videoplaybackmode:i:1")  # Enable video playback
        rdp_content.append("connection type:i:7")  # LAN connection type
        rdp_content.append("displayconnectionbar:i:1")  # Show connection bar
        rdp_content.append("disable wallpaper:i:0")  # Enable wallpaper
        rdp_content.append("disable full window drag:i:0")  # Enable full window drag
        rdp_content.append("disable menu anims:i:0")  # Enable menu animations
        rdp_content.append("disable themes:i:0")  # Enable themes
        rdp_content.append("disable cursor setting:i:0")  # Enable cursor settings
        rdp_content.append("bitmapcachepersistenable:i:1")  # Enable bitmap caching
        
        # Network settings
        rdp_content.append("autoreconnection enabled:i:1")  # Enable auto-reconnect
        rdp_content.append("authentication level:i:2")  # Require authentication
        rdp_content.append("prompt for credentials:i:0")  # Don't prompt if credentials are saved
        rdp_content.append("negotiate security layer:i:1")  # Negotiate security layer
        
        # Remote apps (disable)
        rdp_content.append("remoteapplicationmode:i:0")
        rdp_content.append("alternate shell:s:")
        rdp_content.append("shell working directory:s:")
        
        # Clipboard and drives
        rdp_content.append("redirectclipboard:i:1")  # Enable clipboard redirection
        rdp_content.append("redirectprinters:i:1")  # Enable printer redirection
        rdp_content.append("redirectcomports:i:0")  # Disable COM port redirection
        rdp_content.append("redirectsmartcards:i:1")  # Enable smart card redirection
        rdp_content.append("redirectdrives:i:0")  # Disable drive redirection (can enable if needed)
        
        # Gateway settings (none by default)
        rdp_content.append("gatewayusagemethod:i:0")  # Don't use gateway
        rdp_content.append("gatewayprofileusagemethod:i:0")
        
        # Join lines with Windows-style line endings
        return "\r\n".join(rdp_content) + "\r\n"
    
    @staticmethod
    def generate_filename(connection_name: str) -> str:
        """
        Generate safe filename for .rdp file.
        
        Args:
            connection_name: Name of the connection
            
        Returns:
            Safe filename with .rdp extension
        """
        # Remove unsafe characters
        safe_name = "".join(c for c in connection_name if c.isalnum() or c in (' ', '-', '_'))
        safe_name = safe_name.strip()
        
        if not safe_name:
            safe_name = "rdp_connection"
        
        return f"{safe_name}.rdp"


# Create singleton instance
rdp_file_generator = RDPFileGenerator()
