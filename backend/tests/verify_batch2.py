import httpx
import asyncio
import sys

BASE_URL = "http://localhost:8000/api/v1"

async def run_verification():
    print("Starting Batch 2 Backend Verification...")
    async with httpx.AsyncClient(timeout=10.0) as client:
        # 1. Authenticate
        print("\n[1] Authenticating...")
        # Try default admin credentials or signup if needed
        # Assuming admin/admin or similar. If not, we might need to create a test user.
        # Let's try to signup a temp user to be safe.
        temp_user = "verify_bot"
        temp_pass = "verify_pass_123"
        
        # Try Login
        login_data = {"username": temp_user, "password": temp_pass}
        resp = await client.post(f"{BASE_URL}/auth/login/access-token", data=login_data)
        
        if resp.status_code == 400:
             # Try Signup
             print("User not found, signing up...")
             signup_data = {
                 "username": temp_user, 
                 "email": "bot@example.com", 
                 "hashed_password": temp_pass,
                 "role": "admin",
                 "is_active": True
             }
             resp = await client.post(f"{BASE_URL}/auth/signup", json=signup_data)
             if resp.status_code not in [200, 201]:
                 print(f"Signup failed: {resp.text}")
                 return
             
             # Login again
             resp = await client.post(f"{BASE_URL}/auth/login/access-token", data=login_data)

        if resp.status_code != 200:
            print(f"Login failed: {resp.text}")
            return
            
        token = resp.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}
        print("Authentication Successful.")

        # 2. Key Management
        print("\n[2] Testing Key Management...")
        key_data = {
            "name": "test_ssh_key",
            "type": "ssh_password",
            "value": "secret_password",
            "description": "Test Key"
        }
        resp = await client.post(f"{BASE_URL}/keys/", json=key_data, headers=headers)
        if resp.status_code != 200:
            print(f"Create Key Failed: {resp.text}")
        else:
            key_id = resp.json()["id"]
            print(f"Key Created: ID {key_id}")
            
            # List Keys
            resp = await client.get(f"{BASE_URL}/keys/", headers=headers)
            keys = resp.json()
            found = any(k['id'] == key_id for k in keys)
            print(f"Key found in list: {found}")
            
            # Delete Key
            resp = await client.delete(f"{BASE_URL}/keys/{key_id}", headers=headers)
            print(f"Key Deleted: {resp.status_code == 200}")

        # 3. Webhooks
        print("\n[3] Testing Webhooks...")
        webhook_data = {
            "name": "Test Webhook",
            "url": "http://example.com/hook",
            "events": ["status_change"],
            "active": True
        }
        resp = await client.post(f"{BASE_URL}/webhooks/", json=webhook_data, headers=headers)
        if resp.status_code != 200:
            print(f"Create Webhook Failed: {resp.text}")
        else:
            wh_id = resp.json()["id"]
            print(f"Webhook Created: ID {wh_id}")
            
            # Delete Webhook
            resp = await client.delete(f"{BASE_URL}/webhooks/{wh_id}", headers=headers)
            print(f"Webhook Deleted: {resp.status_code == 200}")

        # 4. Audit Logs
        print("\n[4] Testing Audit Logs...")
        # access log should have 'LOGIN' action from step 1
        resp = await client.get(f"{BASE_URL}/audit/?limit=10", headers=headers)
        if resp.status_code != 200:
             print(f"Fetch Audit Logs Failed: {resp.text}")
        else:
             logs = resp.json()
             print(f"Fetched {len(logs)} audit logs.")
             has_login = any(l['action'] == 'LOGIN' for l in logs)
             print(f"Found LOGIN action: {has_login}")

        # 5. Backup (Export)
        print("\n[5] Testing Backup Export...")
        resp = await client.get(f"{BASE_URL}/backup/export", headers=headers)
        if resp.status_code != 200:
            print(f"Export Failed: {resp.text}")
        else:
            data = resp.json()
            print(f"Export Success. Keys count: {len(data.get('keys', []))}")
            print(f"Services count: {len(data.get('services', []))}")

    print("\nVerification Complete.")

if __name__ == "__main__":
    asyncio.run(run_verification())
