"""
Guacamole Daemon (guacd) Manager

This module manages the guacd daemon as a subprocess of the FastAPI application.
It handles starting, stopping, and monitoring the guacd process.
"""

import subprocess
import logging
import time
import socket
import os
import signal
import psutil
from typing import Optional

logger = logging.getLogger(__name__)


class GuacdManager:
    """Manager for the guacd daemon subprocess"""
    
    def __init__(self, host: str = "127.0.0.1", port: int = 4822):
        """
        Initialize the guacd manager.
        
        Args:
            host: Host to bind guacd to (default: 127.0.0.1 for security)
            port: Port to bind guacd to (default: 4822)
        """
        self.host = host
        self.port = port
        self.process: Optional[subprocess.Popen] = None
        self._is_running = False
        
    def _find_guacd_binary(self) -> Optional[str]:
        """
        Find the guacd binary in the system.
        
        Returns:
            Path to guacd binary or None if not found
        """
        # Check common paths
        common_paths = [
            "/usr/sbin/guacd",
            "/usr/local/sbin/guacd",
            "/opt/guacamole/sbin/guacd",
            "guacd",  # Will search in PATH
        ]
        
        for path in common_paths:
            try:
                # Try to find the binary
                result = subprocess.run(
                    ["which", path] if os.name != 'nt' else ["where", path],
                    capture_output=True,
                    text=True,
                    timeout=5
                )
                if result.returncode == 0 and result.stdout.strip():
                    return result.stdout.strip().split('\n')[0]
            except (subprocess.SubprocessError, FileNotFoundError):
                continue
                
        # Try direct execution to check if it's in PATH
        try:
            result = subprocess.run(
                ["guacd", "--version"],
                capture_output=True,
                text=True,
                timeout=5
            )
            if result.returncode == 0:
                return "guacd"
        except (subprocess.SubprocessError, FileNotFoundError):
            pass
            
        return None
    
    def _is_port_available(self) -> bool:
        """
        Check if the configured port is available.
        
        Returns:
            True if port is available, False otherwise
        """
        try:
            with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
                s.bind((self.host, self.port))
                return True
        except OSError:
            return False
    
    def _wait_for_port(self, timeout: int = 10) -> bool:
        """
        Wait for guacd to start listening on the configured port.
        
        Args:
            timeout: Maximum time to wait in seconds
            
        Returns:
            True if port is listening, False if timeout
        """
        start_time = time.time()
        while time.time() - start_time < timeout:
            try:
                with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
                    s.settimeout(1)
                    s.connect((self.host, self.port))
                    return True
            except (socket.error, ConnectionRefusedError):
                time.sleep(0.5)
        return False
    
    def start(self) -> bool:
        """
        Start the guacd daemon.
        
        Returns:
            True if started successfully, False otherwise
        """
        if self._is_running and self.process:
            logger.warning("guacd is already running")
            return True
        
        # Check if port is already in use (e.g. by Docker container)
        if not self._is_port_available():
            logger.warning(f"Port {self.port} is already in use. Checking if guacd is already running...")
            # Try to connect to see if it's actually guacd
            try:
                with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
                    s.settimeout(2)
                    s.connect((self.host, self.port))
                    logger.info("guacd appears to be already running on the port (likely Docker)")
                    self._is_running = True
                    return True
            except:
                logger.error(f"Port {self.port} is in use by another process")
                return False

        # Find guacd binary
        guacd_path = self._find_guacd_binary()
        if not guacd_path:
            logger.error("guacd binary not found. Please install Apache Guacamole daemon.")
            logger.error("On Ubuntu/Debian: sudo apt-get install guacd")
            logger.error("On RHEL/CentOS: sudo yum install guacd")
            return False
        
        logger.info(f"Found guacd at: {guacd_path}")
        
        # Start guacd as a subprocess
        try:
            # Build command with arguments
            cmd = [
                guacd_path,
                "-b", self.host,  # Bind address
                "-l", str(self.port),  # Listen port
                "-f"  # Run in foreground (don't daemonize)
            ]
            
            logger.info(f"Starting guacd: {' '.join(cmd)}")
            
            # Start the process
            self.process = subprocess.Popen(
                cmd,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                text=True,
                bufsize=1
            )
            
            # Wait for guacd to start listening
            if self._wait_for_port(timeout=10):
                self._is_running = True
                logger.info(f"guacd started successfully on {self.host}:{self.port} (PID: {self.process.pid})")
                return True
            else:
                logger.error("guacd failed to start listening on the port")
                self.stop()
                return False
                
        except FileNotFoundError:
            logger.error(f"guacd binary not found at: {guacd_path}")
            return False
        except Exception as e:
            logger.error(f"Failed to start guacd: {e}")
            logger.exception(e)
            return False
    
    def stop(self):
        """Stop the guacd daemon"""
        if not self.process:
            logger.info("guacd is not running")
            return
        
        try:
            logger.info(f"Stopping guacd (PID: {self.process.pid})...")
            
            # Try graceful shutdown first
            if os.name != 'nt':
                self.process.send_signal(signal.SIGTERM)
            else:
                self.process.terminate()
            
            # Wait for process to exit
            try:
                self.process.wait(timeout=5)
                logger.info("guacd stopped gracefully")
            except subprocess.TimeoutExpired:
                logger.warning("guacd did not stop gracefully, forcing...")
                self.process.kill()
                self.process.wait(timeout=2)
                logger.info("guacd force stopped")
                
        except Exception as e:
            logger.error(f"Error stopping guacd: {e}")
        finally:
            self.process = None
            self._is_running = False
    
    def is_running(self) -> bool:
        """
        Check if guacd is running.
        
        Returns:
            True if running, False otherwise
        """
        if not self._is_running:
            return False
        
        # Check if process is still alive
        if self.process:
            poll_result = self.process.poll()
            if poll_result is not None:
                # Process has terminated
                logger.warning(f"guacd process terminated with code: {poll_result}")
                self._is_running = False
                self.process = None
                return False
        
        # Check if port is still listening
        try:
            with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
                s.settimeout(1)
                s.connect((self.host, self.port))
                return True
        except:
            self._is_running = False
            return False
    
    def get_status(self) -> dict:
        """
        Get the current status of guacd.
        
        Returns:
            Dictionary with status information
        """
        status = {
            "running": self.is_running(),
            "host": self.host,
            "port": self.port,
            "pid": self.process.pid if self.process else None
        }
        
        # Add process info if running
        if self.process and self._is_running:
            try:
                proc = psutil.Process(self.process.pid)
                status["memory_mb"] = proc.memory_info().rss / 1024 / 1024
                status["cpu_percent"] = proc.cpu_percent(interval=0.1)
                status["uptime_seconds"] = time.time() - proc.create_time()
            except (psutil.NoSuchProcess, psutil.AccessDenied):
                pass
        
        return status


# Global instance
guacd_manager = GuacdManager()
