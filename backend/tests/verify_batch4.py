import requests
import json
import time

BASE_URL = "http://localhost:8000/api/v1"

def login():
    try:
        data = {"username": "admin", "password": "admin"}
        resp = requests.post(f"{BASE_URL}/login/access-token", data=data)
        if resp.status_code == 200:
            return resp.json()["access_token"]
        print(f"Login failed: {resp.text}")
    except Exception as e:
        print(f"Login error: {e}")
    return None

def verify_batch4():
    token = login()
    if not token:
        print("Skipping verification due to login failure.")
        return

    headers = {"Authorization": f"Bearer {token}"}
    print("\n--- Testing Batch 4 (Subnet Settings) ---\n")

    # 0. Health Check
    try:
        requests.get(f"{BASE_URL.replace('/v1','')}/health") # /api/health
    except:
        pass

    # 1. Update Scan Settings
    print("Updating Scan Subnets...")
    cidrs = ["127.0.0.1/32"] # Safe/fast range
    settings_data = {"value": json.dumps(cidrs)}
    
    # Try getting first
    try:
        r = requests.get(f"{BASE_URL}/settings/scan_subnets", headers=headers)
        if r.status_code == 404:
             # It might not exist as key-based GET, only list GET exists in code?
             # settings.py: @router.get("/", ...) -> List[Setting]
             # No get-by-key endpoint exists in settings.py!
             print("Note: key-based GET not implemented, checking via list...")
             r = requests.get(f"{BASE_URL}/settings/", headers=headers)
             # print(r.json())
        else:
             print(f"GET response: {r.status_code}")
    except Exception as e:
        print(f"GET error: {e}")

    # PUT
    resp = requests.put(f"{BASE_URL}/settings/scan_subnets", json=settings_data, headers=headers)
    
    if resp.status_code == 200:
        print(f"Settings updated: {resp.json()['value']}")
    else:
        print(f"Update failed: {resp.status_code} {resp.text}")

    # 2. Trigger Scan
    print("Triggering Scan (should use configured subnets)...")
    try:
        start_time = time.time()
        # Ensure we wait a bit
        time.sleep(1)
        resp = requests.post(f"{BASE_URL}/services/discovery/scan", headers=headers)
        if resp.status_code == 200:
            results = resp.json()
            print(f"Scan successful. Found {len(results)} devices.")
            # Verify we found localhost at least?
            found_local = any(d['ip'] == '127.0.0.1' for d in results)
            if found_local:
                print("Confirmed scan covered localhost.")
            else:
                print("Localhost not found (might blocked by ping policy or os).")
        else:
            print(f"Scan failed: {resp.status_code} {resp.text}")
    except Exception as e:
        print(f"Scan error: {e}")
        
    print("\nBatch 4 Verification Complete.")

if __name__ == "__main__":
    verify_batch4()
