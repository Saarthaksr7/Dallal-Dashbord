from cryptography.fernet import Fernet
import base64
import hashlib
from app.core.config import settings

class CryptoService:
    def __init__(self):
        # Ensure we have a valid 32-byte base64 key for Fernet
        # We derive it from the SECRET_KEY to ensure persistence
        key_material = settings.SECRET_KEY.encode()
        # Use SHA256 to get 32 bytes
        sha256_hash = hashlib.sha256(key_material).digest()
        # Base64 encode to match Fernet format
        self.key = base64.urlsafe_b64encode(sha256_hash)
        self.cipher = Fernet(self.key)

    def encrypt(self, plain_text: str) -> str:
        if not plain_text:
            return ""
        return self.cipher.encrypt(plain_text.encode()).decode()

    def decrypt(self, cipher_text: str) -> str:
        if not cipher_text:
            return ""
        try:
            return self.cipher.decrypt(cipher_text.encode()).decode()
        except Exception:
            return "[Decryption Failed]"

crypto_service = CryptoService()
