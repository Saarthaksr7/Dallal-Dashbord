import requests

BASE_URL = "http://127.0.0.1:8000/api/v1"

def test_resolve():
    try:
        # Login
        res = requests.post(f"{BASE_URL}/login/access-token", data={"username":"admin", "password":"admin"})
        if res.status_code != 200:
            print("Login failed")
            return
        token = res.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}
        
        # Test Public DNS (Google)
        ip = "8.8.8.8"
        print(f"Resolving {ip}...")
        res = requests.post(f"{BASE_URL}/services/resolve", params={"ip": ip}, headers=headers)
        print(f"Result: {res.json()}")
        
        # Test Localhost
        ip_local = "127.0.0.1"
        print(f"Resolving {ip_local}...")
         # Pass as query param
        res = requests.post(f"{BASE_URL}/services/resolve", params={"ip": ip_local}, headers=headers)
        print(f"Result: {res.json()}")

    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    test_resolve()
