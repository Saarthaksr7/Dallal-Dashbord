import csv
import json
import io
from typing import List, Any
from datetime import datetime
from sqlmodel import Session, select
from app.models.service import Service
from app.models.audit import AuditLog
from app.core.database import engine

class ReportingService:
    def _to_csv(self, data: List[dict], fieldnames: List[str]) -> str:
        output = io.StringIO()
        writer = csv.DictWriter(output, fieldnames=fieldnames)
        writer.writeheader()
        for row in data:
            # Filter row to only include fieldnames
            filtered = {k: row.get(k) for k in fieldnames}
            writer.writerow(filtered)
        return output.getvalue()

    def _to_json(self, data: List[dict]) -> str:
        # Custom serializer for datetime if needed, but Pydantic .dict() usually handles it or we stringify
        return json.dumps(data, default=str, indent=2)

    def generate_services_report(self, format: str = 'csv') -> tuple[str, str]:
        """
        Returns (content, filename)
        """
        with Session(engine) as session:
            services = session.exec(select(Service)).all()
            # Convert to dicts
            data = [s.dict() for s in services]
            
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            filename = f"services_report_{timestamp}"

            if format.lower() == 'json':
                return self._to_json(data), f"{filename}.json"
            else:
                # flattening tags or vendor objects? For now simple dump
                # Let's ensure fields are strings for CSV
                fieldnames = ["id", "name", "ip", "port", "is_active", "status", "vendor", "tags", "last_checked"]
                return self._to_csv(data, fieldnames), f"{filename}.csv"

    def generate_audit_report(self, format: str = 'csv') -> tuple[str, str]:
        with Session(engine) as session:
            logs = session.exec(select(AuditLog).order_by(AuditLog.timestamp.desc()).limit(1000)).all()
            data = [l.dict() for l in logs]

            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            filename = f"audit_report_{timestamp}"

            if format.lower() == 'json':
                return self._to_json(data), f"{filename}.json"
            else:
                fieldnames = ["id", "timestamp", "username", "action", "details"]
                return self._to_csv(data, fieldnames), f"{filename}.csv"

reporting_service = ReportingService()
