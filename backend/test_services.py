import requests
import time

BASE_URL = "http://127.0.0.1:8000/api/v1"

def test_services():
    try:
        # 1. Login
        print("Logging in...")
        res = requests.post(f"{BASE_URL}/login/access-token", data={"username":"admin", "password":"admin"})
        if res.status_code != 200:
            print(f"Login failed: {res.text}")
            return
        
        token = res.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}
        print("Logged in.")

        # 2. Create Service
        print("Creating Service (Google HTTP)...")
        service_data = {
            "name": "Google",
            "ip": "google.com",
            "check_type": "http",
            "check_target": "https://google.com"
        }
        res = requests.post(f"{BASE_URL}/services/", json=service_data, headers=headers)
        if res.status_code != 200:
             print(f"Create failed: {res.text}")
             return
        
        service = res.json()
        service_id = service["id"]
        print(f"Service created: ID {service_id}")
        
        # 3. Wait for Background Check
        print("Waiting for background health check...")
        time.sleep(3)
        
        # 4. Get Services
        res = requests.get(f"{BASE_URL}/services/", headers=headers)
        services = res.json()
        
        my_service = next((s for s in services if s["id"] == service_id), None)
        if my_service:
            print(f"Service Status: Is Active? {my_service['is_active']}")
            print(f"Response Time: {my_service['response_time_ms']}ms")
        else:
            print("Service not found in list.")
            
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    test_services()
