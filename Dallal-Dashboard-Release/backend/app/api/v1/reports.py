from fastapi import APIRouter, Depends, Query
from fastapi.responses import Response
from typing import Any
from app.api import deps
from app.models.user import User
from app.services.reporting import reporting_service

router = APIRouter()

@router.get("/services")
def download_services_report(
    format: str = Query("csv", regex="^(csv|json)$"),
    current_user: User = Depends(deps.get_current_active_superuser) # Restrict to admins? Or just users? Let's say superuser for now as it dumps all.
) -> Any:
    """
    Download Services Report (CSV/JSON)
    """
    content, filename = reporting_service.generate_services_report(format)
    
    media_type = "application/json" if format == "json" else "text/csv"
    
    return Response(
        content=content,
        media_type=media_type,
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )

@router.get("/audit")
def download_audit_report(
    format: str = Query("csv", regex="^(csv|json)$"),
    current_user: User = Depends(deps.get_current_active_superuser)
) -> Any:
    """
    Download Audit Logs Report (CSV/JSON)
    """
    content, filename = reporting_service.generate_audit_report(format)
    
    media_type = "application/json" if format == "json" else "text/csv"
    
    return Response(
        content=content,
        media_type=media_type,
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )
