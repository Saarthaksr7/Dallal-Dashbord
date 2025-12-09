from sqlmodel import Session
from app.core.database import engine
from app.models.audit import AuditLog

def log_audit(username: str, action: str, details: str = None, ip: str = None):
    try:
        with Session(engine) as session:
            log = AuditLog(username=username, action=action, details=details, ip_address=ip)
            session.add(log)
            session.commit()
    except Exception as e:
        print(f"Audit Log Failed: {e}")
