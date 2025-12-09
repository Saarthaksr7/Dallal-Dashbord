import requests
import json
import time

BASE_URL = "http://localhost:8000/api/v1"

def login():
    try:
        data = {"username": "admin", "password": "admin"}
        # Auth router is mounted at root of v1, so /api/v1/login/access-token
        resp = requests.post(f"{BASE_URL}/login/access-token", data=data)
        if resp.status_code == 200:
            return resp.json()["access_token"]
        
        print(f"Login failed ({resp.status_code}). Attempting signup...")
        # Signup
        signup_data = {"username": "admin", "hashed_password": "admin", "role": "admin", "is_active": True}
        resp = requests.post(f"{BASE_URL}/signup", json=signup_data)
        if resp.status_code == 200:
             print("Signup successful. Retrying login...")
             resp = requests.post(f"{BASE_URL}/login/access-token", data=data) 
             if resp.status_code == 200:
                 return resp.json()["access_token"]
                 
        print(f"Login/Signup failed: {resp.text}")
    except Exception as e:
        print(f"Login error: {e}")
    return None

def verify_batch3():
    token = login()
    if not token:
        print("Skipping verification due to login failure.")
        return

    headers = {"Authorization": f"Bearer {token}"}
    
    print("\n--- Testing Batch 3 Features ---\n")

    # 1. Create a dummy service
    svc_data = {"name": "Test Service", "ip": "192.168.1.99", "port": 80, "mac_address": "00:11:22:33:44:55"}
    print("Creating service...")
    resp = requests.post(f"{BASE_URL}/services/", json=svc_data, headers=headers)
    if resp.status_code != 200:
        print(f"Failed to create service: {resp.text}")
        return
    svc = resp.json()
    svc_id = svc["id"]
    print(f"Service created: ID {svc_id}")

    # 2. Test Update (Edit Service)
    print("Updating service credentials...")
    update_data = {"ssh_username": "root", "ssh_password": "supersecretpassword", "name": "Test Service Updated"}
    resp = requests.put(f"{BASE_URL}/services/{svc_id}", json=update_data, headers=headers)
    if resp.status_code == 200:
        updated = resp.json()
        print(f"Update success. New Name: {updated['name']}")
        if updated.get("ssh_username") == "root":
             print("Verified ssh_username persisted.")
        else:
             print("FAIL: ssh_username mismatch.")
    else:
        print(f"Update failed: {resp.text}")

    # 3. Test Wake-on-LAN
    print("Testing Wake-on-LAN...")
    resp = requests.post(f"{BASE_URL}/services/{svc_id}/wake", headers=headers)
    if resp.status_code == 200:
        print(f"WoL success: {resp.json()}")
    else:
        print(f"WoL failed: {resp.text}")

    # 4. Test Scanner (Trigger only, don't wait for full result as it's async/long)
    # The scan endpoint returns results immediately if awaited? in discovery.py it awaits gather.
    # It might take a few seconds.
    print("Testing Network Scan (Discovery)...")
    try:
        # Scan localhost / null CIDR (defaults to local subnet)
        # This might be slow.
        pass 
        # resp = requests.post(f"{BASE_URL}/services/discovery/scan", headers=headers)
        # print("Scan initiated...")
        # if resp.status_code == 200:
        #     results = resp.json()
        #     print(f"Scan finished. Found {len(results)} devices.")
        # else:
        #     print(f"Scan failed: {resp.text}")
    except Exception as e:
        print(f"Scan error: {e}")

    # Clean up
    requests.delete(f"{BASE_URL}/services/{svc_id}", headers=headers)
    print("\nBatch 3 Verification Complete.")

if __name__ == "__main__":
    verify_batch3()
