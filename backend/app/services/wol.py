from wakeonlan import send_magic_packet
from loguru import logger

class WOLService:
    def send_packet(self, mac_address: str, broadcast_ip: str = "255.255.255.255", port: int = 9):
        """
        Sends a magic packet to the specified MAC address.
        """
        # Basic validation of MAC address format could go here, 
        # but wakeonlan handles most common formats.
        # We'll just strip widely used separators to be checking for validity if needed,
        # but for now rely on wakeonlan.
        
        try:
            logger.info(f"Sending WOL packet to {mac_address} via {broadcast_ip}:{port}")
            send_magic_packet(mac_address, ip_address=broadcast_ip, port=port)
            return True
        except Exception as e:
            logger.error(f"Failed to send WOL packet: {e}")
            raise e
    
    # Alias for backwards compatibility
    def wake_device(self, mac_address: str, broadcast_ip: str = "255.255.255.255", port: int = 9):
        return self.send_packet(mac_address, broadcast_ip, port)

wol_service = WOLService()
