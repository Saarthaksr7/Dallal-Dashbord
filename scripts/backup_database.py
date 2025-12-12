"""
Automated Database Backup Script
Supports SQLite and PostgreSQL with compression and retention
"""
import os
import sys
import shutil
import gzip
from datetime import datetime, timedelta
from pathlib import Path
import subprocess
import logging

# Configuration
BACKUP_DIR = Path("./backups")
DB_PATH = Path("./dallal.db")  # SQLite
RETENTION_DAYS = 30
COMPRESSION = True

# PostgreSQL config (if using PostgreSQL)
PG_HOST = os.getenv("POSTGRES_HOST", "localhost")
PG_PORT = os.getenv("POSTGRES_PORT", "5432")
PG_USER = os.getenv("POSTGRES_USER", "dallal")
PG_DB = os.getenv("POSTGRES_DB", "dallal")

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('backup.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

def ensure_backup_dir():
    """Create backup directory if it doesn't exist"""
    BACKUP_DIR.mkdir(exist_ok=True)
    logger.info(f"Backup directory: {BACKUP_DIR.absolute()}")

def backup_sqlite():
    """Backup SQLite database"""
    if not DB_PATH.exists():
        logger.error(f"Database not found: {DB_PATH}")
        return False
    
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    backup_name = f"dallal_backup_{timestamp}.db"
    backup_path = BACKUP_DIR / backup_name
    
    try:
        # Copy database file
        shutil.copy2(DB_PATH, backup_path)
        logger.info(f"SQLite backup created: {backup_path}")
        
        # Compress if enabled
        if COMPRESSION:
            with open(backup_path, 'rb') as f_in:
                with gzip.open(f"{backup_path}.gz", 'wb') as f_out:
                    shutil.copyfileobj(f_in, f_out)
            
            # Remove uncompressed file
            backup_path.unlink()
            logger.info(f"Backup compressed: {backup_path}.gz")
            backup_path = Path(f"{backup_path}.gz")
        
        return backup_path
    
    except Exception as e:
        logger.error(f"Backup failed: {e}")
        return False

def backup_postgresql():
    """Backup PostgreSQL database using pg_dump"""
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    backup_name = f"dallal_pg_backup_{timestamp}.sql"
    backup_path = BACKUP_DIR / backup_name
    
    try:
        # Run pg_dump
        cmd = [
            "pg_dump",
            "-h", PG_HOST,
            "-p", PG_PORT,
            "-U", PG_USER,
            "-d", PG_DB,
            "-f", str(backup_path)
        ]
        
        subprocess.run(cmd, check=True, capture_output=True)
        logger.info(f"PostgreSQL backup created: {backup_path}")
        
        # Compress
        if COMPRESSION:
            with open(backup_path, 'rb') as f_in:
                with gzip.open(f"{backup_path}.gz", 'wb') as f_out:
                    shutil.copyfileobj(f_in, f_out)
            
            backup_path.unlink()
            logger.info(f"Backup compressed: {backup_path}.gz")
            backup_path = Path(f"{backup_path}.gz")
        
        return backup_path
    
    except subprocess.CalledProcessError as e:
        logger.error(f"pg_dump failed: {e.stderr.decode()}")
        return False
    except Exception as e:
        logger.error(f"Backup failed: {e}")
        return False

def cleanup_old_backups():
    """Remove backups older than RETENTION_DAYS"""
    cutoff_date = datetime.now() - timedelta(days=RETENTION_DAYS)
    removed_count = 0
    
    for backup_file in BACKUP_DIR.glob("dallal_*"):
        if backup_file.stat().st_mtime < cutoff_date.timestamp():
            backup_file.unlink()
            logger.info(f"Removed old backup: {backup_file.name}")
            removed_count += 1
    
    if removed_count > 0:
        logger.info(f"Cleanup complete: {removed_count} old backups removed")
    else:
        logger.info("No old backups to remove")

def get_backup_stats():
    """Display backup statistics"""
    backups = list(BACKUP_DIR.glob("dallal_*"))
    total_size = sum(f.stat().st_size for f in backups)
    
    logger.info(f"Total backups: {len(backups)}")
    logger.info(f"Total size: {total_size / 1024 / 1024:.2f} MB")
    
    if backups:
        latest = max(backups, key=lambda f: f.stat().st_mtime)
        logger.info(f"Latest backup: {latest.name}")

def main():
    """Main backup routine"""
    logger.info("=" * 60)
    logger.info("Starting database backup")
    logger.info("=" * 60)
    
    ensure_backup_dir()
    
    # Detect database type
    db_type = os.getenv("DATABASE_TYPE", "sqlite")
    
    if db_type == "postgresql":
        backup_path = backup_postgresql()
    else:
        backup_path = backup_sqlite()
    
    if backup_path:
        logger.info(f"✅ Backup successful: {backup_path.name}")
        
        # Cleanup old backups
        cleanup_old_backups()
        
        # Show stats
        get_backup_stats()
        
        logger.info("=" * 60)
        logger.info("Backup completed successfully")
        logger.info("=" * 60)
        return 0
    else:
        logger.error("❌ Backup failed")
        return 1

if __name__ == "__main__":
    sys.exit(main())
