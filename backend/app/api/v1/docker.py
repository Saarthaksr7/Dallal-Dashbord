"""
Docker Management API
Provides endpoints for container management, system info, logs, and real-time streaming.
"""

from fastapi import APIRouter, HTTPException, Query, WebSocket, WebSocketDisconnect
from typing import List, Optional, Literal, Dict, Any
from pydantic import BaseModel, Field
from datetime import datetime
import asyncio
import json
import logging

from app.utils.docker_client import (
    DockerClientManager,
    get_docker_client,
    NotFound,
    APIError,
)

logger = logging.getLogger(__name__)

router = APIRouter()


# ============================================================================
# SCHEMAS
# ============================================================================

class ContainerInfo(BaseModel):
    """Container information schema with full details."""
    id: str = Field(..., description="Full container ID")
    short_id: str = Field(..., description="Short container ID (12 chars)")
    name: str = Field(..., description="Container name")
    status: str = Field(..., description="Container status (running, exited, paused, etc.)")
    image: str = Field(..., description="Image name with tag")
    ports: Dict[str, Optional[str]] = Field(
        default_factory=dict,
        description="Port mappings: container_port -> host_port"
    )
    created: str = Field(..., description="Creation timestamp (ISO format)")
    
    class Config:
        json_schema_extra = {
            "example": {
                "id": "abc123def456...",
                "short_id": "abc123def456",
                "name": "my-nginx",
                "status": "running",
                "image": "nginx:latest",
                "ports": {"80/tcp": "8080", "443/tcp": None},
                "created": "2024-01-15T10:30:00"
            }
        }


class ContainerAction(BaseModel):
    """Action payload for container control."""
    action: Literal["start", "stop", "restart"] = Field(
        ..., description="Action to perform"
    )
    timeout: Optional[int] = Field(
        default=10,
        ge=1,
        le=300,
        description="Timeout in seconds (for stop action)"
    )


class DockerSystemInfo(BaseModel):
    """Docker daemon system information."""
    containers_running: int
    containers_total: int
    containers_paused: int
    containers_stopped: int
    images: int
    server_version: str
    cpus: int
    memory_total: int
    os: str
    architecture: str
    kernel_version: str


class ActionResponse(BaseModel):
    """Response for container actions."""
    status: str
    action: str
    container: str
    message: Optional[str] = None


class LogsResponse(BaseModel):
    """Response for container logs."""
    logs: str
    container: str
    lines: int


class ContainerRunRequest(BaseModel):
    """Request payload for running a new container."""
    image: str = Field(..., description="Docker image name (e.g., 'nginx:latest')")
    name: Optional[str] = Field(None, description="Container name (auto-generated if not provided)")
    ports: Optional[Dict[str, str]] = Field(
        None,
        description="Port mappings: {'container_port/protocol': 'host_port'}, e.g., {'80/tcp': '8080'}"
    )
    environment: Optional[Dict[str, str]] = Field(
        None,
        description="Environment variables"
    )
    command: Optional[str] = Field(None, description="Command to run in container")
    detach: bool = Field(True, description="Run container in background")

    class Config:
        json_schema_extra = {
            "example": {
                "image": "nginx:latest",
                "name": "my-nginx",
                "ports": {"80/tcp": "8080"},
                "environment": {"NGINX_HOST": "localhost"},
                "detach": True
            }
        }


class ContainerRunResponse(BaseModel):
    """Response for container run operation."""
    status: str
    container_id: str
    container_name: str
    image: str
    message: str


class PruneResponse(BaseModel):
    """Response for system prune operation."""
    status: str
    containers_removed: int
    images_removed: int
    networks_removed: int
    space_reclaimed: int  # bytes
    message: str


# ============================================================================
# HELPER FUNCTIONS
# ============================================================================

def _parse_ports(container) -> Dict[str, Optional[str]]:
    """
    Parse container port bindings to a clean dictionary.
    Returns: {"80/tcp": "8080", "443/tcp": None}
    """
    ports = {}
    try:
        port_bindings = container.attrs.get('NetworkSettings', {}).get('Ports', {})
        for container_port, host_bindings in port_bindings.items():
            if host_bindings:
                # Take the first binding's host port
                ports[container_port] = host_bindings[0].get('HostPort')
            else:
                ports[container_port] = None
    except Exception:
        pass
    return ports


def _parse_created(container) -> str:
    """Parse container creation time to ISO format string."""
    try:
        created = container.attrs.get('Created', '')
        # Docker returns ISO format with nanoseconds, truncate to seconds
        if 'T' in created:
            return created.split('.')[0]
        return created
    except Exception:
        return ""


def _get_image_name(container) -> str:
    """Get image name with fallback for untagged images."""
    try:
        if container.image.tags:
            return container.image.tags[0]
        # Fallback to image ID if no tags
        return container.image.short_id.replace('sha256:', '')
    except Exception:
        return "<none>"


def _container_to_info(container) -> ContainerInfo:
    """Convert Docker container object to ContainerInfo schema."""
    return ContainerInfo(
        id=container.id,
        short_id=container.short_id,
        name=container.name.lstrip('/'),
        status=container.status,
        image=_get_image_name(container),
        ports=_parse_ports(container),
        created=_parse_created(container),
    )


# ============================================================================
# ENDPOINTS
# ============================================================================

@router.get("/info", response_model=DockerSystemInfo)
def get_docker_info():
    """
    Get Docker daemon information.
    
    Returns system-level information about the Docker installation including
    container counts, version, and resource availability.
    """
    client = get_docker_client()
    if not client:
        raise HTTPException(status_code=503, detail="Docker Engine not available")
    
    try:
        info = client.info()
        return DockerSystemInfo(
            containers_running=info.get("ContainersRunning", 0),
            containers_total=info.get("Containers", 0),
            containers_paused=info.get("ContainersPaused", 0),
            containers_stopped=info.get("ContainersStopped", 0),
            images=info.get("Images", 0),
            server_version=info.get("ServerVersion", "unknown"),
            cpus=info.get("NCPU", 0),
            memory_total=info.get("MemTotal", 0),
            os=info.get("OperatingSystem", "unknown"),
            architecture=info.get("Architecture", "unknown"),
            kernel_version=info.get("KernelVersion", "unknown"),
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get Docker info: {str(e)}")


@router.get("/containers", response_model=List[ContainerInfo])
def list_containers(
    all_containers: bool = Query(True, alias="all", description="Include stopped containers"),
):
    """
    List all Docker containers.
    
    Returns a list of containers with their current status, ports, and metadata.
    By default includes both running and stopped containers.
    """
    client = get_docker_client()
    if not client:
        raise HTTPException(status_code=503, detail="Docker Engine not available")
    
    try:
        containers = client.containers.list(all=all_containers)
        return [_container_to_info(c) for c in containers]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to list containers: {str(e)}")


@router.get("/containers/{container_id}", response_model=ContainerInfo)
def get_container(container_id: str):
    """
    Get details for a specific container.
    
    Args:
        container_id: Container ID or name
    """
    client = get_docker_client()
    if not client:
        raise HTTPException(status_code=503, detail="Docker Engine not available")
    
    try:
        container = client.containers.get(container_id)
        return _container_to_info(container)
    except NotFound:
        raise HTTPException(status_code=404, detail=f"Container not found: {container_id}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/containers/{container_id}/logs", response_model=LogsResponse)
def get_container_logs(
    container_id: str,
    tail: int = Query(100, ge=1, le=5000, description="Number of lines to return"),
    timestamps: bool = Query(True, description="Include timestamps"),
):
    """
    Get logs for a specific container.
    
    Args:
        container_id: Container ID or name
        tail: Number of log lines to return (default: 100, max: 5000)
        timestamps: Whether to include timestamps in log output
    """
    client = get_docker_client()
    if not client:
        raise HTTPException(status_code=503, detail="Docker Engine not available")
    
    try:
        container = client.containers.get(container_id)
        logs = container.logs(
            tail=tail,
            timestamps=timestamps,
            stdout=True,
            stderr=True,
        ).decode('utf-8', errors='replace')
        
        return LogsResponse(
            logs=logs,
            container=container.name.lstrip('/'),
            lines=len(logs.splitlines()) if logs else 0,
        )
    except NotFound:
        raise HTTPException(status_code=404, detail=f"Container not found: {container_id}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get logs: {str(e)}")


@router.post("/containers/{container_id}/{action}", response_model=ActionResponse)
def container_action(container_id: str, action: str, timeout: int = Query(10, ge=1, le=300)):
    """
    Perform an action on a container.
    
    Args:
        container_id: Container ID or name
        action: Action to perform (start, stop, restart)
        timeout: Timeout in seconds for stop action (default: 10)
    
    Note: The action is also available in the URL path for simpler API calls.
    """
    client = get_docker_client()
    if not client:
        raise HTTPException(status_code=503, detail="Docker Engine not available")
    
    if action not in ("start", "stop", "restart"):
        raise HTTPException(status_code=400, detail=f"Invalid action: {action}. Must be start, stop, or restart")
    
    try:
        container = client.containers.get(container_id)
        container_name = container.name.lstrip('/')
        
        if action == "start":
            container.start()
            message = f"Container {container_name} started successfully"
        elif action == "stop":
            container.stop(timeout=timeout)
            message = f"Container {container_name} stopped (timeout: {timeout}s)"
        elif action == "restart":
            container.restart(timeout=timeout)
            message = f"Container {container_name} restarted"
        
        return ActionResponse(
            status="success",
            action=action,
            container=container_name,
            message=message,
        )
        
    except NotFound:
        raise HTTPException(status_code=404, detail=f"Container not found: {container_id}")
    except APIError as e:
        raise HTTPException(status_code=500, detail=f"Docker API error: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Action failed: {str(e)}")


@router.post("/containers/{container_id}/action", response_model=ActionResponse)
def container_action_with_body(container_id: str, payload: ContainerAction):
    """
    Perform an action on a container using request body.
    
    Alternative endpoint that accepts action details in the request body
    instead of URL path. Useful for clients that prefer POST body payloads.
    """
    return container_action(
        container_id=container_id,
        action=payload.action,
        timeout=payload.timeout or 10,
    )


@router.post("/run", response_model=ContainerRunResponse)
def run_container(request: ContainerRunRequest):
    """
    Run a new container from an image.
    
    Creates and starts a new container. If the image doesn't exist locally,
    it will be pulled from Docker Hub.
    
    Args:
        request: Container configuration including image, name, ports, and environment
    """
    client = get_docker_client()
    if not client:
        raise HTTPException(status_code=503, detail="Docker Engine not available")
    
    try:
        # Check if image exists locally, pull if not
        try:
            client.images.get(request.image)
            logger.info(f"Image {request.image} found locally")
        except NotFound:
            logger.info(f"Pulling image {request.image}...")
            try:
                client.images.pull(request.image)
                logger.info(f"Image {request.image} pulled successfully")
            except Exception as pull_error:
                raise HTTPException(
                    status_code=400,
                    detail=f"Failed to pull image '{request.image}': {str(pull_error)}"
                )
        
        # Prepare port bindings
        port_bindings = None
        ports_to_expose = None
        if request.ports:
            port_bindings = {}
            ports_to_expose = []
            for container_port, host_port in request.ports.items():
                port_bindings[container_port] = host_port
                ports_to_expose.append(container_port)
        
        # Run container
        container = client.containers.run(
            image=request.image,
            name=request.name,
            ports=port_bindings,
            environment=request.environment,
            command=request.command,
            detach=request.detach,
        )
        
        container_name = container.name.lstrip('/') if container.name else container.short_id
        
        logger.info(f"Container {container_name} created and started")
        
        return ContainerRunResponse(
            status="success",
            container_id=container.short_id,
            container_name=container_name,
            image=request.image,
            message=f"Container '{container_name}' created and started successfully"
        )
        
    except HTTPException:
        raise
    except APIError as e:
        logger.error(f"Docker API error while running container: {e}")
        raise HTTPException(status_code=500, detail=f"Docker API error: {str(e)}")
    except Exception as e:
        logger.error(f"Failed to run container: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to run container: {str(e)}")


@router.post("/prune", response_model=PruneResponse)
def prune_system():
    """
    Clean up unused Docker resources.
    
    Removes:
    - Stopped containers
    - Unused networks
    - Dangling images
    
    This is equivalent to running `docker system prune -f`.
    
    Warning: This action is irreversible!
    """
    client = get_docker_client()
    if not client:
        raise HTTPException(status_code=503, detail="Docker Engine not available")
    
    try:
        space_reclaimed = 0
        containers_removed = 0
        images_removed = 0
        networks_removed = 0
        
        # Prune containers
        try:
            container_result = client.containers.prune()
            containers_removed = len(container_result.get('ContainersDeleted', []) or [])
            space_reclaimed += container_result.get('SpaceReclaimed', 0)
            logger.info(f"Pruned {containers_removed} containers")
        except Exception as e:
            logger.warning(f"Container prune failed: {e}")
        
        # Prune networks
        try:
            network_result = client.networks.prune()
            networks_removed = len(network_result.get('NetworksDeleted', []) or [])
            logger.info(f"Pruned {networks_removed} networks")
        except Exception as e:
            logger.warning(f"Network prune failed: {e}")
        
        # Prune dangling images
        try:
            image_result = client.images.prune(filters={'dangling': True})
            images_removed = len(image_result.get('ImagesDeleted', []) or [])
            space_reclaimed += image_result.get('SpaceReclaimed', 0)
            logger.info(f"Pruned {images_removed} images")
        except Exception as e:
            logger.warning(f"Image prune failed: {e}")
        
        # Format space reclaimed
        def format_bytes(bytes_val):
            if bytes_val < 1024:
                return f"{bytes_val}B"
            elif bytes_val < 1024 * 1024:
                return f"{bytes_val / 1024:.1f}KB"
            elif bytes_val < 1024 * 1024 * 1024:
                return f"{bytes_val / (1024 * 1024):.1f}MB"
            else:
                return f"{bytes_val / (1024 * 1024 * 1024):.2f}GB"
        
        message_parts = []
        if containers_removed > 0:
            message_parts.append(f"{containers_removed} containers")
        if networks_removed > 0:
            message_parts.append(f"{networks_removed} networks")
        if images_removed > 0:
            message_parts.append(f"{images_removed} images")
        
        if message_parts:
            message = f"Removed {', '.join(message_parts)}. Reclaimed {format_bytes(space_reclaimed)}."
        else:
            message = "No unused resources to clean up."
        
        return PruneResponse(
            status="success",
            containers_removed=containers_removed,
            images_removed=images_removed,
            networks_removed=networks_removed,
            space_reclaimed=space_reclaimed,
            message=message
        )
        
    except Exception as e:
        logger.error(f"System prune failed: {e}")
        raise HTTPException(status_code=500, detail=f"System prune failed: {str(e)}")


# ============================================================================
# WEBSOCKET ENDPOINTS
# ============================================================================

@router.websocket("/ws/logs/{container_id}")
async def stream_container_logs(websocket: WebSocket, container_id: str):
    """
    WebSocket endpoint for real-time container log streaming.
    
    Streams logs from the specified container in real-time.
    Client can send JSON commands:
    - {"command": "clear"} - Clear log buffer (frontend handles)
    - {"command": "ping"} - Keep-alive ping
    
    Server sends:
    - {"type": "log", "data": "log line..."} - Log data
    - {"type": "status", "status": "connected|disconnected", "container": "name"}
    - {"type": "error", "message": "error description"}
    """
    await websocket.accept()
    logger.info(f"WebSocket connection opened for container logs: {container_id}")
    
    client = get_docker_client()
    if not client:
        await websocket.send_json({
            "type": "error",
            "message": "Docker Engine not available"
        })
        await websocket.close(code=4503)
        return
    
    try:
        container = client.containers.get(container_id)
        container_name = container.name.lstrip('/')
        
        # Send connection status
        await websocket.send_json({
            "type": "status",
            "status": "connected",
            "container": container_name
        })
        
        # Stream logs in a background task
        async def stream_logs():
            """Stream logs from container to WebSocket."""
            try:
                # Get log stream - follow=True enables streaming
                log_stream = container.logs(
                    stream=True,
                    follow=True,
                    tail=100,  # Start with last 100 lines
                    timestamps=True,
                    stdout=True,
                    stderr=True,
                )
                
                for log_chunk in log_stream:
                    if log_chunk:
                        log_text = log_chunk.decode('utf-8', errors='replace')
                        await websocket.send_json({
                            "type": "log",
                            "data": log_text
                        })
                        # Small delay to prevent overwhelming the client
                        await asyncio.sleep(0.01)
                        
            except Exception as e:
                logger.error(f"Log streaming error for {container_id}: {e}")
                await websocket.send_json({
                    "type": "error",
                    "message": f"Log stream error: {str(e)}"
                })
        
        # Start log streaming task
        log_task = asyncio.create_task(stream_logs())
        
        try:
            # Handle incoming messages (commands from client)
            while True:
                try:
                    message = await asyncio.wait_for(
                        websocket.receive_text(),
                        timeout=30.0  # 30 second timeout for keep-alive
                    )
                    
                    try:
                        data = json.loads(message)
                        command = data.get("command")
                        
                        if command == "ping":
                            await websocket.send_json({"type": "pong"})
                        elif command == "clear":
                            # Acknowledge clear command (frontend handles buffer)
                            await websocket.send_json({"type": "cleared"})
                            
                    except json.JSONDecodeError:
                        pass  # Ignore non-JSON messages
                        
                except asyncio.TimeoutError:
                    # Send keep-alive ping
                    await websocket.send_json({"type": "ping"})
                    
        except WebSocketDisconnect:
            logger.info(f"WebSocket disconnected for container logs: {container_id}")
        finally:
            log_task.cancel()
            try:
                await log_task
            except asyncio.CancelledError:
                pass
                
    except NotFound:
        await websocket.send_json({
            "type": "error",
            "message": f"Container not found: {container_id}"
        })
        await websocket.close(code=4404)
    except Exception as e:
        logger.error(f"WebSocket error for container {container_id}: {e}")
        await websocket.send_json({
            "type": "error",
            "message": str(e)
        })
        await websocket.close(code=4500)


@router.websocket("/ws/stats")
async def stream_container_stats(websocket: WebSocket):
    """
    WebSocket endpoint for real-time container stats streaming.
    
    Streams CPU and memory usage for all running containers.
    Updates every 2 seconds.
    
    Server sends:
    - {"type": "stats", "containers": [{...}, {...}]}
    - {"type": "error", "message": "..."}
    """
    await websocket.accept()
    logger.info("WebSocket connection opened for container stats")
    
    client = get_docker_client()
    if not client:
        await websocket.send_json({
            "type": "error",
            "message": "Docker Engine not available"
        })
        await websocket.close(code=4503)
        return
    
    try:
        # Send initial connection status
        await websocket.send_json({
            "type": "status",
            "status": "connected"
        })
        
        while True:
            try:
                # Get stats for all running containers
                containers = client.containers.list(all=False)  # Only running
                stats_list = []
                
                for container in containers:
                    try:
                        # Get stats snapshot (stream=False for single read)
                        stats = container.stats(stream=False)
                        
                        # Calculate CPU percentage
                        cpu_percent = 0.0
                        try:
                            cpu_delta = stats["cpu_stats"]["cpu_usage"]["total_usage"] - \
                                       stats["precpu_stats"]["cpu_usage"]["total_usage"]
                            system_delta = stats["cpu_stats"]["system_cpu_usage"] - \
                                          stats["precpu_stats"]["system_cpu_usage"]
                            num_cpus = stats["cpu_stats"].get("online_cpus", 1)
                            
                            if system_delta > 0:
                                cpu_percent = (cpu_delta / system_delta) * num_cpus * 100.0
                        except (KeyError, ZeroDivisionError):
                            pass
                        
                        # Calculate memory usage
                        memory_usage = stats.get("memory_stats", {}).get("usage", 0)
                        memory_limit = stats.get("memory_stats", {}).get("limit", 1)
                        memory_percent = (memory_usage / memory_limit) * 100 if memory_limit > 0 else 0
                        
                        stats_list.append({
                            "id": container.short_id,
                            "name": container.name.lstrip('/'),
                            "cpu_percent": round(cpu_percent, 2),
                            "memory_usage": memory_usage,
                            "memory_limit": memory_limit,
                            "memory_percent": round(memory_percent, 2),
                        })
                        
                    except Exception as e:
                        logger.warning(f"Failed to get stats for {container.name}: {e}")
                        continue
                
                # Send stats update
                await websocket.send_json({
                    "type": "stats",
                    "containers": stats_list,
                    "timestamp": datetime.utcnow().isoformat()
                })
                
                # Wait before next update
                await asyncio.sleep(2.0)
                
            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error(f"Stats collection error: {e}")
                await websocket.send_json({
                    "type": "error",
                    "message": f"Stats error: {str(e)}"
                })
                await asyncio.sleep(5.0)  # Back off on error
                
    except WebSocketDisconnect:
        logger.info("WebSocket disconnected for container stats")
    except Exception as e:
        logger.error(f"WebSocket stats error: {e}")
        await websocket.close(code=4500)
