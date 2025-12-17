import requests

# Get all routes from the FastAPI app
response = requests.get('http://localhost:8000/api/v1/openapi.json')
data = response.json()

# Print all WebSocket routes
print("All routes containing 'ws' or 'ssh':")
for path, methods in data.get('paths', {}).items():
    if 'ws' in path.lower() or 'ssh' in path.lower():
        print(f"  {path}: {list(methods.keys())}")
