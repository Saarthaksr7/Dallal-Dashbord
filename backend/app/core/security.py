from cryptography.fernet import Fernet
import os
from passlib.context import CryptContext
from datetime import datetime, timedelta
from typing import Any, Union
from jose import jwt

KEY_FILE = "secret.key"

def load_key():
    env_key = os.environ.get("DALLAL_SECRET_KEY")
    if env_key:
        return env_key.encode() if isinstance(env_key, str) else env_key
        
    if not os.path.exists(KEY_FILE):
        key = Fernet.generate_key()
        with open(KEY_FILE, "wb") as key_file:
            key_file.write(key)
    return open(KEY_FILE, "rb").read()

key = load_key()
cipher_suite = Fernet(key)

def encrypt_password(password: str) -> str:
    if not password: return None
    return cipher_suite.encrypt(password.encode()).decode()

def decrypt_password(encrypted_password: str) -> str:
    if not encrypted_password: return None
    try:
        return cipher_suite.decrypt(encrypted_password.encode()).decode()
    except:
        return None

import secrets
import hashlib

def generate_api_key(prefix: str = "sk_live_") -> str:
    """Generates a secure random API key."""
    return f"{prefix}{secrets.token_urlsafe(32)}"

def hash_api_key(key: str) -> str:
    """Hashes the API key for storage."""
    return hashlib.sha256(key.encode()).hexdigest()

def verify_api_key(plain_key: str, hashed_key: str) -> bool:
    """Verifies a plain key against the stored hash."""
    return hash_api_key(plain_key) == hashed_key

# Password hashing using argon2 (more modern, no 72-byte limit)
pwd_context = CryptContext(
    schemes=["argon2"],
    deprecated="auto"
)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against its hash."""
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    """Hash a password for storing."""
    return pwd_context.hash(password)

# JWT token settings
SECRET_KEY = os.environ.get("JWT_SECRET_KEY", "YOUR_SECRET_KEY_CHANGE_IN_PRODUCTION")
ALGORITHM = "HS256"

def create_access_token(subject: Union[str, Any], expires_delta: timedelta = None) -> str:
    """Create a JWT access token."""
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    
    to_encode = {"exp": expire, "sub": str(subject)}
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

# ==========================================
# Password Validation & Account Lockout
# ==========================================
import re
from typing import Optional

# In-memory store for login attempts (use Redis in production)
login_attempts = {}
locked_accounts = {}

class PasswordValidator:
    """Password strength validation"""
    
    @staticmethod
    def validate_password(password: str, min_length: int = 8, require_strong: bool = True) -> tuple[bool, Optional[str]]:
        """
        Validate password strength
        
        Returns:
            (is_valid, error_message)
        """
        # Check minimum length
        if len(password) < min_length:
            return False, f"Password must be at least {min_length} characters long"
        
        if require_strong:
            # Check for uppercase
            if not re.search(r'[A-Z]', password):
                return False, "Password must contain at least one uppercase letter"
            
            # Check for lowercase
            if not re.search(r'[a-z]', password):
                return False, "Password must contain at least one lowercase letter"
            
            # Check for digit
            if not re.search(r'\d', password):
                return False, "Password must contain at least one number"
            
            # Check for special character
            if not re.search(r'[!@#$%^&*(),.?":{}|<>]', password):
                return False, "Password must contain at least one special character"
        
        # Check for common weak passwords
        weak_passwords = [
            'password', 'password123', '12345678', 'qwerty', 
            'abc123', 'letmein', 'admin', 'welcome', '123456789'
        ]
        
        if password.lower() in weak_passwords:
            return False, "Password is too common, please choose a stronger password"
        
        return True, None


class AccountLockout:
    """Account lockout after failed login attempts"""
    
    @staticmethod
    def record_failed_attempt(username: str, max_attempts: int = 5, lockout_minutes: int = 15) -> None:
        """Record a failed login attempt"""
        if username not in login_attempts:
            login_attempts[username] = []
        
        login_attempts[username].append(datetime.now())
        
        # Clean old attempts (older than lockout duration)
        lockout_duration = timedelta(minutes=lockout_minutes)
        login_attempts[username] = [
            attempt for attempt in login_attempts[username]
            if datetime.now() - attempt < lockout_duration
        ]
        
        # Lock account if max attempts exceeded
        if len(login_attempts[username]) >= max_attempts:
            locked_accounts[username] = datetime.now()
    
    @staticmethod
    def clear_failed_attempts(username: str) -> None:
        """Clear failed attempts after successful login"""
        if username in login_attempts:
            del login_attempts[username]
        
        if username in locked_accounts:
            del locked_accounts[username]
    
    @staticmethod
    def is_account_locked(username: str, lockout_minutes: int = 15) -> tuple[bool, Optional[int]]:
        """
        Check if account is locked
        
        Returns:
            (is_locked, minutes_until_unlock)
        """
        if username not in locked_accounts:
            return False, None
        
        locked_time = locked_accounts[username]
        lockout_duration = timedelta(minutes=lockout_minutes)
        unlock_time = locked_time + lockout_duration
        
        if datetime.now() >= unlock_time:
            # Lockout expired, clear it
            del locked_accounts[username]
            if username in login_attempts:
                del login_attempts[username]
            return False, None
        
        # Still locked
        minutes_remaining = int((unlock_time - datetime.now()).total_seconds() / 60) + 1
        return True, minutes_remaining
    
    @staticmethod
    def get_remaining_attempts(username: str, max_attempts: int = 5) -> int:
        """Get number of remaining login attempts"""
        attempts = len(login_attempts.get(username, []))
        return max(0, max_attempts - attempts)
