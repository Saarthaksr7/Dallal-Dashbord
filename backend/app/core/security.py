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
