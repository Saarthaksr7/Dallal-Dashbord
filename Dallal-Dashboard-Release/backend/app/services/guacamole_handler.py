"""
Guacamole WebSocket handler for RDP connections.

This module provides WebSocket-based RDP connectivity using Apache Guacamole.
"""

from fastapi import WebSocket, WebSocketDisconnect, Depends, HTTPException
from sqlmodel import Session, select
import socket
import struct
import logging

from app.core.database import get_session
from app.models.rdp_connection import RDPConnectionProfile
from app.models.user import User
from app.core.security import decrypt_password

logger = logging.getLogger(__name__)

# Guacamole protocol constants
GUAC_INSTRUCTION_TERMINATOR = ";"
GUAC_INSTRUCTION_SEPARATOR = ","


class GuacamoleProtocol:
    """Helper class for encoding/decoding Guacamole protocol messages"""
    
    @staticmethod
    def encode_instruction(*elements: str) -> str:
        """
        Encode elements into a Guacamole protocol instruction.
        
        Args:
            elements: String elements to encode
            
        Returns:
            Guacamole protocol instruction string
        """
        encoded_parts = []
        for element in elements:
            encoded_parts.append(f"{len(element)}.{element}")
        
        return ",".join(encoded_parts) + ";"
    
    @staticmethod
    def decode_instruction(instruction: str) -> list[str]:
        """
        Decode a Guacamole protocol instruction.
        
        Args:
            instruction: Guacamole protocol instruction string
            
        Returns:
            List of decoded elements
        """
        if not instruction.endswith(";"):
            raise ValueError("Invalid Guacamole instruction: missing terminator")
        
        instruction = instruction[:-1]  # Remove terminator
        elements = []
        
        parts = instruction.split(",")
        for part in parts:
            if "." not in part:
                continue
            
            length_str, content = part.split(".", 1)
            try:
                length = int(length_str)
                if len(content) >= length:
                    elements.append(content[:length])
            except ValueError:
                continue
        
        return elements


async def handle_guacamole_connection(
    websocket: WebSocket,
    profile_id: int,
    db: Session,
    current_user: User,
    guacd_host: str = "127.0.0.1",  # Always use localhost - guacd is embedded in backend
    guacd_port: int = 4822
):
    """
    Handle WebSocket connection for RDP via Guacamole.
    
    Args:
        websocket: FastAPI WebSocket connection
        profile_id: RDP connection profile ID
        db: Database session
       current_user: Authenticated user
        guacd_host: Guacamole daemon hostname
        guacd_port: Guacamole daemon port
    """
    # Fetch connection profile
    statement = select(RDPConnectionProfile).where(
        RDPConnectionProfile.id == profile_id,
        RDPConnectionProfile.user_id == current_user.id
    )
    profile = db.exec(statement).first()
    
    if not profile:
        await websocket.close(code=1008, reason="Profile not found")
        return
    
    # Decrypt password
    password = decrypt_password(profile.password_encrypted) if profile.password_encrypted else ""
    
    # Connect to guacd
    guacd_socket = None
    
    try:
        # Create socket connection to guacd
        guacd_socket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        guacd_socket.settimeout(10)
        guacd_socket.connect((guacd_host, guacd_port))
        
        logger.info(f"Connected to guacd at {guacd_host}:{guacd_port}")
        
        # Send handshake request to guacd
        # Step 1: Select protocol
        handshake = GuacamoleProtocol.encode_instruction("select", "rdp")
        guacd_socket.sendall(handshake.encode())
        logger.info(f"Sent: {handshake.strip()}")
        
        # Step 2: Receive args list from guacd
        args_response = guacd_socket.recv(4096).decode()
        logger.info(f"Received args: {args_response}")
        
        # Parse the args instruction to get the list of expected parameters
        args_elements = GuacamoleProtocol.decode_instruction(args_response)
        if not args_elements or args_elements[0] != "args":
            raise Exception(f"Expected 'args' instruction, got: {args_response}")
        
        # args_elements[1:] contains the list of argument names expected by guacd
        expected_args = args_elements[1:]
        logger.info(f"Guacd expects {len(expected_args)} arguments: {expected_args}")
        
        # Step 3: Send display size
        width, height = profile.resolution.split('x')
        size_instruction = GuacamoleProtocol.encode_instruction("size", width, height, "96")
        guacd_socket.sendall(size_instruction.encode())
        logger.info(f"Sent: {size_instruction.strip()}")
        
        # Step 4: Build argument values in the order guacd expects
        # Create a mapping of our values
        arg_values_map = {
            "hostname": profile.hostname,
            "port": str(profile.port),
            "username": profile.username or "",
            "password": password or "",
            "domain": profile.domain or "",
            "security": "any",
            "ignore-cert": "true",
            "disable-auth": "",
            "initial-program": "",
            "client-name": "Dallal-Dashboard",
            "server-layout": "",
            "timezone": "",
            "console": "",
            "width": width,
            "height": height,
            "dpi": "96",
            "color-depth": "",
            "enable-wallpaper": "",
            "enable-theming": "",
            "enable-font-smoothing": "",
            "enable-full-window-drag": "",
            "enable-desktop-composition": "",
            "enable-menu-animations": "",
            "disable-bitmap-caching": "",
            "disable-offscreen-caching": "",
            "disable-glyph-caching": "",
        }
        
        # Build values list in the exact order guacd specified
        arg_values = []
        for arg_name in expected_args:
            value = arg_values_map.get(arg_name, "")
            arg_values.append(value)
            logger.info(f"  {arg_name} = {value if arg_name != 'password' else '***'}")
        
        # Step 5: Send argument values as raw Guacamole protocol
        # Format:  length.value,length.value,...;
        # DO NOT use encode_instruction here as it would treat the first value as an opcode
        encoded_values = []
        for value in arg_values:
            encoded_values.append(f"{len(value)}.{value}")
        args_instruction = ",".join(encoded_values) + ";"
        
        guacd_socket.sendall(args_instruction.encode())
        logger.info(f"Sent {len(arg_values)} argument values")
        
        # Step 6: Send connect instruction to initiate the connection
        connect_instruction = GuacamoleProtocol.encode_instruction("connect")
        guacd_socket.sendall(connect_instruction.encode())
        logger.info(f"Sent: {connect_instruction.strip()}")
        
        logger.info(f"Handshake complete for {profile.name}")
        
        # Set socket to non-blocking for bidirectional communication
        guacd_socket.setblocking(False)
        
        # Accept WebSocket connection
        await websocket.accept()
        
        # Bidirectional relay loop
        import asyncio
        
        async def relay_from_guacd():
            """Relay data from guacd to WebSocket"""
            try:
                loop = asyncio.get_event_loop()
                while True:
                    try:
                        data = await loop.run_in_executor(None, guacd_socket.recv, 4096)
                        if not data:
                            break
                        await websocket.send_text(data.decode('utf-8', errors='ignore'))
                    except BlockingIOError:
                        await asyncio.sleep(0.01)
                    except socket.error as e:
                        logger.error(f"Socket error reading from guacd: {e}")
                        break
            except Exception as e:
                logger.error(f"Error relaying from guacd: {e}")
        
        async def relay_from_websocket():
            """Relay data from WebSocket to guacd"""
            try:
                while True:
                    data = await websocket.receive_text()
                    guacd_socket.sendall(data.encode())
            except WebSocketDisconnect:
                logger.info("WebSocket disconnected")
            except Exception as e:
                logger.error(f"Error relaying from WebSocket: {e}")
        
        # Run both relay tasks concurrently
        await asyncio.gather(
            relay_from_guacd(),
            relay_from_websocket(),
            return_exceptions=True
        )
        
    except socket.timeout:
        logger.error("Timeout connecting to guacd")
        await websocket.close(code=1008, reason="Guacamole daemon timeout")
    except ConnectionRefusedError:
        logger.error(f"Connection refused to guacd at {guacd_host}:{guacd_port}")
        await websocket.close(code=1008, reason="Guacamole daemon unavailable")
    except Exception as e:
        logger.error(f"Error in Guacamole connection: {e}")
        logger.exception(e)
        try:
            await websocket.close(code=1011, reason=f"Server error: {str(e)}")
        except:
            pass
    finally:
        # Clean up
        if guacd_socket:
            try:
                guacd_socket.close()
                logger.info("Closed guacd socket")
            except:
                pass
