
import os
import sys
import importlib
from cryptography.fernet import Fernet

# 1. Generate a valid temporary key
temp_key = Fernet.generate_key().decode()
print(f"Generated Temporary Key: {temp_key}")

# 2. Set the environment variable
os.environ["DALLAL_SECRET_KEY"] = temp_key
print("Set DALLAL_SECRET_KEY environment variable.")

# 3. Simulate application startup / import
# We need to make sure we import app.core.security AFTER setting the env var
# requires adding project root to path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

try:
    from app.core import security
    # Force reload in case it was already imported by some other mechanism (unlikely in fresh script but good practice)
    importlib.reload(security)
    
    print(f"Loaded Key from Security Module: {security.key.decode()}")
    
    # 4. Verify Match
    if security.key.decode() == temp_key:
        print("SUCCESS: Security module loaded the key from environment variable.")
    else:
        print("FAILURE: Key mismatch.")
        print(f"Expected: {temp_key}")
        print(f"Got: {security.key.decode()}")
        sys.exit(1)

    # 5. Verify Encryption/Decryption works
    cipher = Fernet(security.key)
    original_text = "DallalDashboardSecret"
    encrypted = cipher.encrypt(original_text.encode())
    decrypted = cipher.decrypt(encrypted).decode()
    
    if decrypted == original_text:
        print("SUCCESS: Encryption/Decryption cycle passed with new key.")
    else:
        print("FAILURE: Decryption failed.")
        sys.exit(1)

except Exception as e:
    print(f"ERROR: An exception occurred: {e}")
    sys.exit(1)
