# Issue a non-strict, visit token for visiting example.com valid for 1 hour.
import requests

url = "http://localhost:3000/api/v1/issue-token"
token = "<issuer-token>"

headers = {
  "Authorization": f"Bearer {token}"
}

data = {
  "scope": "https://example.com",
  "validity": 3600,
  "strict": False
}

response = requests.post(url, json=data, headers=headers)
print(response.json()["token"])
