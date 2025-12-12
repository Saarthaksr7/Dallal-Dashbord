"""
Database Restoration Script
Restores SQLite or PostgreSQL from backup files
"""
import os
import sys
import shutil
import gzip
from pathlib import Path
import subprocess
import logging
from datetime import datetime

# Configuration
BACKUP_DIR = Path("./backups")
DB_PATH = Path("./dallal.db")
RESTORE_CONFIRMATION = True

# PostgreSQL config
PG_HOST = os.getenv("POSTGRES_HOST", "localhost")
PG_PORT = os.getenv("POSTGRES_PORT", "5432")
PG_USER = os.getenv("POSTGRES_USER", "dallal")
PG_DB = os.getenv("POSTGRES_DB", "dallal")

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

def list_available_backups():
    """List all available backups"""
    backups = sorted(BACKUP_DIR.glob("dallal_*"), key=lambda f: f.stat().st_mtime, reverse=True)
    
    if not backups:
        logger.warning("No backups found!")
        return []
    
    logger.info("\nAvailable Backups:")
    logger.info("-" * 80)
    
    for idx, backup in enumerate(backups, 1):
        size_mb = backup.stat().st_size / 1024 / 1024
        mtime = datetime.fromtimestamp(backup.stat().st_mtime)
        logger.info(f"{idx}. {backup.name}")
        logger.info(f"   Size: {size_mb:.2f} MB | Created: {mtime.strftime('%Y-%m-%d %H:%M:%S')}")
    
    logger.info("-" * 80)
    return backups

def decompress_if_needed(backup_path):
    """Decompress .gz file if needed"""
    if backup_path.suffix == '.gz':
        logger.info(f"Decompressing {backup_path.name}...")
        decompressed = backup_path.with_suffix('')
        
        with gzip.open(backup_path, 'rb') as f_in:
            with open(decompressed, 'wb') as f_out:
                shutil.copyfileobj(f_in, f_out)
        
        logger.info(f"Decompressed to: {decompressed.name}")
        return decompressed
    
    return backup_path

def restore_sqlite(backup_path):
    """Restore SQLite database"""
    try:
        # Backup current database
        if DB_PATH.exists():
            backup_current = DB_PATH.with_suffix('.db.before_restore')
            shutil.copy2(DB_PATH, backup_current)
            logger.info(f"Current database backed up to: {backup_current.name}")
        
        # Decompress if needed
        restore_file = decompress_if_needed(backup_path)
        
        # Restore
        shutil.copy2(restore_file, DB_PATH)
        logger.info(f"✅ Database restored from: {backup_path.name}")
        
        # Cleanup temp decompressed file
        if restore_file != backup_path:
            restore_file.unlink()
        
        return True
    
    except Exception as e:
        logger.error(f"Restoration failed: {e}")
        return False

def restore_postgresql(backup_path):
    """Restore PostgreSQL database"""
    try:
        # Decompress if needed
        restore_file = decompress_if_needed(backup_path)
        
        # Drop and recreate database (WARNING: destructive)
        logger.warning("This will DROP the existing database!")
        
        # Run psql to restore
        cmd = [
            "psql",
            "-h", PG_HOST,
            "-p", PG_PORT,
            "-U", PG_USER,
            "-d", PG_DB,
            "-f", str(restore_file)
        ]
        
        subprocess.run(cmd, check=True, capture_output=True)
        logger.info(f"✅ Database restored from: {backup_path.name}")
        
        # Cleanup
        if restore_file != backup_path:
            restore_file.unlink()
        
        return True
    
    except subprocess.CalledProcessError as e:
        logger.error(f"psql failed: {e.stderr.decode()}")
        return False
    except Exception as e:
        logger.error(f"Restoration failed: {e}")
        return False

def verify_restoration():
    """Verify database integrity after restoration"""
    # For SQLite
    if DB_PATH.exists():
        try:
            import sqlite3
            conn = sqlite3.connect(DB_PATH)
            conn.execute("PRAGMA integrity_check")
            conn.close()
            logger.info("✅ Database integrity verified")
            return True
        except Exception as e:
            logger.error(f"❌ Integrity check failed: {e}")
            return False
    return True

def main():
    """Main restoration routine"""
    logger.info("=" * 80)
    logger.info("DATABASE RESTORATION TOOL")
    logger.info("=" * 80)
    
    # List backups
    backups = list_available_backups()
    
    if not backups:
        return 1
    
    # Select backup
    if len(sys.argv) > 1:
        # Backup specified via command line
        try:
            selection = int(sys.argv[1])
            if 1 <= selection <= len(backups):
                backup_to_restore = backups[selection - 1]
            else:
                logger.error("Invalid backup number")
                return 1
        except ValueError:
            # Maybe a filename was provided
            backup_to_restore = Path(sys.argv[1])
            if not backup_to_restore.exists():
                logger.error(f"Backup not found: {backup_to_restore}")
                return 1
    else:
        # Interactive mode
        print("\nEnter backup number to restore (default: 1 - latest): ", end='')
        selection_input = input().strip() or "1"
        
        try:
            selection = int(selection_input)
            if 1 <= selection <= len(backups):
                backup_to_restore = backups[selection - 1]
            else:
                logger.error("Invalid selection")
                return 1
        except ValueError:
            logger.error("Invalid input")
            return 1
    
    logger.info(f"\nSelected: {backup_to_restore.name}")
    
    # Confirmation
    if RESTORE_CONFIRMATION:
        print("\n⚠️  WARNING: This will OVERWRITE the current database!")
        print("Type 'YES' to confirm restoration: ", end='')
        confirm = input().strip()
        
        if confirm != "YES":
            logger.info("Restoration cancelled")
            return 0
    
    # Detect database type
    db_type = "postgresql" if "pg_backup" in backup_to_restore.name else "sqlite"
    
    logger.info(f"\nRestoring {db_type} database...")
    
    if db_type == "postgresql":
        success = restore_postgresql(backup_to_restore)
    else:
        success = restore_sqlite(backup_to_restore)
    
    if success:
        verify_restoration()
        logger.info("=" * 80)
        logger.info("✅ RESTORATION COMPLETED SUCCESSFULLY")
        logger.info("=" * 80)
        logger.info("\n🔄 Please restart the backend server")
        return 0
    else:
        logger.error("=" * 80)
        logger.error("❌ RESTORATION FAILED")
        logger.error("=" * 80)
        return 1

if __name__ == "__main__":
    sys.exit(main())
