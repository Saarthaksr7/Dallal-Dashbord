import requests
import time

BASE_URL = "http://127.0.0.1:8000/api/v1"

def test_discovery():
    try:
        # Login
        res = requests.post(f"{BASE_URL}/login/access-token", data={"username":"admin", "password":"admin"})
        if res.status_code != 200:
            print("Login failed")
            return
        token = res.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}
        
        print("Starting Network Scan (this may take a few seconds)...")
        start = time.time()
        res = requests.post(f"{BASE_URL}/services/discovery/scan", headers=headers)
        duration = time.time() - start
        
        if res.status_code == 200:
            devices = res.json()
            print(f"Scan complete in {duration:.2f}s.")
            print(f"Found {len(devices)} devices.")
            for d in devices:
                ssh = "SSH" if d.get('has_ssh') else ""
                rdp = "RDP" if d.get('has_rdp') else ""
                print(f" - {d['ip']} | {d.get('hostname')} | {d.get('vendor')} | {ssh} {rdp}")
        else:
            print(f"Scan failed: {res.status_code} {res.text}")

    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    test_discovery()
