# Go to https://httpbin.org/cookies and take a screenshot synchronously
import base64
import requests

url = "http://localhost:3000/api/v1/sync-job"
token = "<visit-token>"

headers = {
  "Authorization": f"Bearer {token}"
}

data = {
  "steps": [
    {"url": "https://httpbin.org/cookies"}
  ],
  # You can create a video and a pdf the same way by using additional options: "RECORD" and "PDF"
  "options": ["SCREENSHOT"],
  "cookies": [
    { "name": "test", "value": "test", "domain": "httpbin.org", "path": "/" }
  ],
}

response = requests.post(url, json=data, headers=headers).json()

if response["status"] == "success":
  screenshot_b64 = response["result"]["screenshot"]
  screenshot = base64.b64decode(screenshot_b64)

  with open("screenshot.png", "wb+") as screenshot_file:
    screenshot_file.write(screenshot)

