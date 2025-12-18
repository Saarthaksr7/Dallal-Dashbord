"""
File upload validation and security
"""
import os
import mimetypes
from typing import List, Optional
from fastapi import UploadFile, HTTPException, status
from app.core.config import settings

class FileUploadValidator:
    """Validate file uploads for security"""
    
    # Allowed MIME types by category
    ALLOWED_MIMES = {
        'images': ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
        'documents': ['application/pdf', 'text/plain', 'application/msword', 
                     'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
        'archives': ['application/zip', 'application/x-tar', 'application/gzip', 
                    'application/x-7z-compressed'],
        'configs': ['application/json', 'text/yaml', 'application/xml'],
    }
    
    # Dangerous file extensions (never allow)
    DANGEROUS_EXTENSIONS = [
        '.exe', '.bat', '.cmd', '.com', '.pif', '.scr', '.vbs', '.js',
        '.jar', '.msi', '.app', '.deb', '.rpm', '.dmg', '.pkg', '.sh',
        '.ps1', '.psm1', '.dll', '.so', '.dylib'
    ]
    
    @staticmethod
    def validate_file(
        file: UploadFile,
        max_size_mb: Optional[int] = None,
        allowed_extensions: Optional[List[str]] = None,
        allowed_mimes: Optional[List[str]] = None
    ) -> tuple[bool, Optional[str]]:
        """
        Validate uploaded file
        
        Args:
            file: UploadFile object
            max_size_mb: Maximum file size in MB (from settings if None)
            allowed_extensions: List of allowed extensions (from settings if None)
            allowed_mimes: List of allowed MIME types
        
        Returns:
            (is_valid, error_message)
        """
        if not file or not file.filename:
            return False, "No file provided"
        
        # Get file extension
        _, ext = os.path.splitext(file.filename)
        ext = ext.lower()
        
        # Check for dangerous extensions
        if ext in FileUploadValidator.DANGEROUS_EXTENSIONS:
            return False, f"File type {ext} is not allowed for security reasons"
        
        # Check allowed extensions
        if allowed_extensions is None:
            allowed_extensions = settings.allowed_extensions_list
        
        if allowed_extensions and ext not in allowed_extensions:
            return False, f"File extension {ext} is not allowed. Allowed: {', '.join(allowed_extensions)}"
        
        # Check MIME type
        if allowed_mimes:
            if file.content_type not in allowed_mimes:
                return False, f"File type {file.content_type} is not allowed"
        
        # Check file size
        max_size = max_size_mb or settings.MAX_UPLOAD_SIZE_MB
        max_bytes = max_size * 1024 * 1024
        
        # Read file to check size (in chunks to avoid memory issues)
        file_size = 0
        chunk_size = 8192
        
        try:
            file.file.seek(0)  # Reset file pointer
            while True:
                chunk = file.file.read(chunk_size)
                if not chunk:
                    break
                file_size += len(chunk)
                
                if file_size > max_bytes:
                    return False, f"File size exceeds maximum allowed size of {max_size}MB"
            
            # Reset file pointer after reading
            file.file.seek(0)
        
        except Exception as e:
            return False, f"Error reading file: {str(e)}"
        
        # Additional security checks
        
        # 1. Check filename for path traversal attempts
        if '..' in file.filename or '/' in file.filename or '\\' in file.filename:
            return False, "Invalid filename: path traversal detected"
        
        # 2. Sanitize filename
        safe_filename = FileUploadValidator.sanitize_filename(file.filename)
        if safe_filename != file.filename:
            return False, "Invalid characters in filename"
        
        return True, None
    
    @staticmethod
    def sanitize_filename(filename: str) -> str:
        """
        Sanitize filename to prevent security issues
        
        - Remove path components
        - Remove special characters
        - Limit length
        """
        # Get just the filename (no path)
        filename = os.path.basename(filename)
        
        # Remove or replace dangerous characters
        # Allow: letters, numbers, dash, underscore, period
        import re
        filename = re.sub(r'[^a-zA-Z0-9._-]', '_', filename)
        
        # Limit filename length
        max_length = 255
        if len(filename) > max_length:
            name, ext = os.path.splitext(filename)
            filename = name[:max_length - len(ext)] + ext
        
        return filename
    
    @staticmethod
    def get_safe_filepath(filename: str, upload_dir: str = './uploads') -> str:
        """
        Get a safe filepath for uploaded file
        
        - Ensures unique filename (adds timestamp if exists)
        - Creates upload directory if needed
        - Returns absolute path
        """
        import time
        from pathlib import Path
        
        # Sanitize filename
        safe_filename = FileUploadValidator.sanitize_filename(filename)
        
        # Create upload directory
        upload_path = Path(upload_dir)
        upload_path.mkdir(parents=True, exist_ok=True)
        
        # Check if file exists, add timestamp if it does
        filepath = upload_path / safe_filename
        if filepath.exists():
            name, ext = os.path.splitext(safe_filename)
            timestamp = int(time.time())
            safe_filename = f"{name}_{timestamp}{ext}"
            filepath = upload_path / safe_filename
        
        return str(filepath.absolute())
    
    @staticmethod
    async def save_upload_file(
        file: UploadFile,
        upload_dir: str = './uploads',
        max_size_mb: Optional[int] = None,
        allowed_extensions: Optional[List[str]] = None
    ) -> tuple[bool, str]:
        """
        Validate and save uploaded file
        
        Returns:
            (success, filepath_or_error)
        """
        # Validate file
        is_valid, error = FileUploadValidator.validate_file(
            file,
            max_size_mb=max_size_mb,
            allowed_extensions=allowed_extensions
        )
        
        if not is_valid:
            return False, error
        
        # Get safe filepath
        filepath = FileUploadValidator.get_safe_filepath(file.filename, upload_dir)
        
        # Save file
        try:
            with open(filepath, 'wb') as f:
                file.file.seek(0)
                content = await file.read()
                f.write(content)
            
            return True, filepath
        
        except Exception as e:
            return False, f"Error saving file: {str(e)}"


# Helper function for FastAPI  endpoints
async def validate_and_save_file(
    file: UploadFile,
    upload_dir: str = './uploads',
    max_size_mb: int = None,
    allowed_extensions: List[str] = None
) -> str:
    """
    Validate and save file, raise HTTPException on error
    
    Returns:
        filepath on success
    """
    success, result = await FileUploadValidator.save_upload_file(
        file,
        upload_dir=upload_dir,
        max_size_mb=max_size_mb,
        allowed_extensions=allowed_extensions
    )
    
    if not success:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=result
        )
    
    return result


# Example usage in FastAPI endpoint:
"""
from fastapi import APIRouter, File, UploadFile
from app.core.file_validation import validate_and_save_file

router = APIRouter()

@router.post("/upload/config")
async def upload_config(file: UploadFile = File(...)):
    # Validate and save
    filepath = await validate_and_save_file(
        file,
        upload_dir='./uploads/configs',
        allowed_extensions=['.json', '.yaml', '.yml']
    )
    
    return {"filename": os.path.basename(filepath), "path": filepath}

@router.post("/upload/backup")
async def upload_backup(file: UploadFile = File(...)):
    filepath = await validate_and_save_file(
        file,
        upload_dir='./uploads/backups',
        max_size_mb=500,  # 500MB limit for backups
        allowed_extensions=['.zip', '.tar', '.gz']
    )
    
    return {"message": "Backup uploaded successfully", "path": filepath}
"""
