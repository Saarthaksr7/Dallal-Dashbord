import requests

try:
    print("Testing Login Endpoint...")
    url = "http://127.0.0.1:8000/api/v1/login/access-token"
    res = requests.post(url, data={"username":"admin", "password":"admin"})
    
    print(f"Status Code: {res.status_code}")
    if res.status_code == 200:
        print("Success! Token received.")
        print(f"Token: {res.json().get('access_token')[:20]}...")
    else:
        print(f"Failed: {res.text}")

except Exception as e:
    print(f"Error: {e}")
