import os
import subprocess
import json
import logging
from datetime import datetime
from sqlmodel import Session, select
from app.core.database import engine
from app.models.service import Service
from app.models.history import ServiceHistory
from app.models.user import User
from app.models.api_key import ApiKey
from app.core.config import settings

logger = logging.getLogger(__name__)

class VcsService:
    def __init__(self):
        self.repo_path = os.path.join(os.getcwd(), "data_vcs")
        self.export_path = os.path.join(self.repo_path, "exports")
        
        # Ensure directories exist
        if not os.path.exists(self.export_path):
            os.makedirs(self.export_path)
            
        # Check if git init needed
        if not os.path.exists(os.path.join(self.repo_path, ".git")):
            self._run_git(["init"])
            # Initial config? 
            # We might need to set user.name and user.email locally if not set global
            self._run_git(["config", "user.email", "dallal-dashboard@local"])
            self._run_git(["config", "user.name", "Dallal Dashboard"])

    def _run_git(self, args: list, cwd=None):
        if cwd is None:
            cwd = self.repo_path
        try:
            # On Windows, git might be in path
            cmd = ["git"] + args
            result = subprocess.run(
                cmd, 
                cwd=cwd, 
                capture_output=True, 
                text=True, 
                check=True,
                encoding='utf-8' # Force utf-8
            )
            return result.stdout.strip()
        except subprocess.CalledProcessError as e:
            logger.error(f"Git Error: {e.stderr}")
            raise Exception(f"Git command failed: {e.stderr}")
        except Exception as e:
            logger.error(f"Execution Error: {e}")
            raise Exception(f"Execution failed: {e}")

    def export_data(self):
        """Exports DB tables to JSON files in the repo"""
        try:
            with Session(engine) as session:
                # Services
                services = session.exec(select(Service)).all()
                valid_services = [s.dict(exclude={"last_checked", "response_time_ms", "sys_uptime"}) for s in services]
                # Sort by ID for stable diffs
                valid_services.sort(key=lambda x: x.get('id') or 0)
                
                with open(os.path.join(self.export_path, "services.json"), "w") as f:
                    json.dump(valid_services, f, indent=2, default=str)
                
                # Users (exclude hashed_password for safety? Maybe optional?)
                # For backup purposes we DO want passwords, but maybe we should warn user.
                # Let's include everything for now as it's a backup.
                users = session.exec(select(User)).all()
                valid_users = [u.dict(exclude={"hashed_password"}) for u in users] # Safety first: Exclude password hashes by default unless requested. 
                # Actually, if we exclude passwords, we can't restore users fully. 
                # But creating a public repo with password hashes is improved but still risky.
                # Let's keep them out for VCS and rely on 'backup' zip for full restore. VCS is more for Config/Services.
                with open(os.path.join(self.export_path, "users.json"), "w") as f:
                    json.dump(valid_users, f, indent=2, default=str)
                
                # API Keys (exclude hashes?)
                # Similar logic, just metadata
                keys = session.exec(select(ApiKey)).all()
                valid_keys = [k.dict(exclude={"key_hash"}) for k in keys]
                with open(os.path.join(self.export_path, "api_keys.json"), "w") as f:
                    json.dump(valid_keys, f, indent=2, default=str)

            return True
        except Exception as e:
            logger.error(f"Export failed: {e}")
            raise

    def get_status(self):
        """Returns git status"""
        try:
            branch = self._run_git(["rev-parse", "--abbrev-ref", "HEAD"])
            status = self._run_git(["status", "--porcelain"])
            
            # Get last commit
            try:
                last_commit = self._run_git(["log", "-1", "--pretty=format:%h - %s (%cr)"])
            except:
                last_commit = "None"

            return {
                "branch": branch,
                "is_clean": len(status) == 0,
                "status_raw": status,
                "last_commit": last_commit,
                "repo_path": self.repo_path
            }
        except Exception as e:
             return {"error": str(e)}

    def commit(self, message: str):
        self._run_git(["add", "."])
        # Check if anything to commit
        status = self._run_git(["status", "--porcelain"])
        if not status:
            return "Nothing to commit"
        return self._run_git(["commit", "-m", message])

    def set_remote(self, url: str):
        # Remove existing if any
        try:
            self._run_git(["remote", "remove", "origin"])
        except:
            pass
        self._run_git(["remote", "add", "origin", url])

    def push(self):
        # Assume upstream branch is same as current 
        branch = self._run_git(["rev-parse", "--abbrev-ref", "HEAD"])
        return self._run_git(["push", "-u", "origin", branch])

vcs_service = VcsService()
