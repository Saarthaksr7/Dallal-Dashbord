from fastapi import APIRouter, HTTPException
from typing import List, Optional
from pydantic import BaseModel
import docker
from docker.errors import DockerException, NotFound

router = APIRouter()

class ContainerInfo(BaseModel):
    id: str
    name: str
    status: str
    image: str
    short_id: str

def get_docker_client():
    try:
        # Try to connect to default socket
        client = docker.from_env()
        client.ping() # Validate connection
        return client
    except Exception as e:
        return None

@router.get("/containers", response_model=List[ContainerInfo])
def list_containers():
    client = get_docker_client()
    if not client:
        # Return empty list or 503?
        # Let's return empty and maybe a header or just rely on empty list for now.
        # Ideally, we should signal that Docker is offline.
        # Let's throw 503 so frontend handles specific "Docker Down" state.
        raise HTTPException(status_code=503, detail="Docker Engine not available")
        
    containers = client.containers.list(all=True)
    results = []
    for c in containers:
        results.append(ContainerInfo(
            id=c.id,
            name=c.name,
            status=c.status,
            image=c.image.tags[0] if c.image.tags else "none",
            short_id=c.short_id
        ))
    return results

@router.post("/containers/{container_id}/{action}")
def container_action(container_id: str, action: str):
    client = get_docker_client()
    if not client:
        raise HTTPException(status_code=503, detail="Docker Engine not available")
    
    try:
        container = client.containers.get(container_id)
        
        if action == "start":
            container.start()
        elif action == "stop":
            container.stop()
        elif action == "restart":
            container.restart()
        else:
            raise HTTPException(status_code=400, detail="Invalid action")
            
        return {"status": "success", "action": action, "container": container.name}
        
    except NotFound:
        raise HTTPException(status_code=404, detail="Container not found")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
