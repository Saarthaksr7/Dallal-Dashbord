from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from app.services.wol import wol_service
from app.api.deps import get_current_user

router = APIRouter()

class WOLRequest(BaseModel):
    mac_address: str
    broadcast_ip: str = "255.255.255.255"
    port: int = 9

@router.post("/wake")
def send_wol_packet(
    wol_req: WOLRequest,
    current_user = Depends(get_current_user)
):
    try:
        wol_service.wake_device(wol_req.mac_address, wol_req.broadcast_ip, wol_req.port)
        return {"status": "success", "message": f"WOL packet sent to {wol_req.mac_address}"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
