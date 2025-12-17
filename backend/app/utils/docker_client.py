"""
Docker Client Singleton Utility
Provides thread-safe, production-ready Docker SDK client with:
- Singleton pattern for connection reuse
- Automatic reconnection on failure
- Graceful degradation when Docker is unavailable
"""

import threading
import logging
from typing import Optional
from functools import wraps

import docker
from docker import DockerClient
from docker.errors import DockerException, APIError, NotFound, ImageNotFound

logger = logging.getLogger(__name__)


class DockerClientManager:
    """
    Thread-safe singleton manager for Docker client connections.
    
    Usage:
        client = DockerClientManager.get_client()
        if client:
            containers = client.containers.list()
    """
    
    _instance: Optional[DockerClient] = None
    _lock = threading.Lock()
    _last_error: Optional[str] = None
    
    @classmethod
    def get_client(cls) -> Optional[DockerClient]:
        """
        Get or create Docker client instance.
        Returns None if Docker is unavailable.
        """
        with cls._lock:
            if cls._instance is not None:
                # Verify existing connection is still valid
                try:
                    cls._instance.ping()
                    return cls._instance
                except Exception:
                    logger.warning("Docker connection lost, attempting reconnect...")
                    cls._instance = None
            
            # Create new connection
            try:
                cls._instance = docker.from_env()
                cls._instance.ping()
                cls._last_error = None
                logger.info("Docker client connected successfully")
                return cls._instance
            except DockerException as e:
                cls._last_error = f"Docker daemon not accessible: {str(e)}"
                logger.error(cls._last_error)
                return None
            except Exception as e:
                cls._last_error = f"Unexpected Docker error: {str(e)}"
                logger.error(cls._last_error)
                return None
    
    @classmethod
    def get_last_error(cls) -> Optional[str]:
        """Get the last error message if Docker is unavailable."""
        return cls._last_error
    
    @classmethod
    def reset(cls) -> None:
        """Reset the client (useful for testing or reconnection)."""
        with cls._lock:
            if cls._instance:
                try:
                    cls._instance.close()
                except Exception:
                    pass
                cls._instance = None
            cls._last_error = None


def require_docker(func):
    """
    Decorator that ensures Docker client is available before executing.
    Raises appropriate HTTP exceptions if Docker is unavailable.
    """
    @wraps(func)
    def wrapper(*args, **kwargs):
        client = DockerClientManager.get_client()
        if not client:
            from fastapi import HTTPException
            raise HTTPException(
                status_code=503,
                detail=DockerClientManager.get_last_error() or "Docker Engine not available"
            )
        return func(*args, client=client, **kwargs)
    return wrapper


# Convenience function for backward compatibility
def get_docker_client() -> Optional[DockerClient]:
    """Get Docker client instance (convenience wrapper)."""
    return DockerClientManager.get_client()


# Export commonly used exceptions for easy importing
__all__ = [
    'DockerClientManager',
    'get_docker_client',
    'require_docker',
    'DockerException',
    'APIError', 
    'NotFound',
    'ImageNotFound',
]
