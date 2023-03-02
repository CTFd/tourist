# Go to https://example.com and take a screenshot asynchronously (by checking job status)
import base64
import time
import requests

url = "http://localhost:3000/api/v1/async-job"
token = "<visit-token>"

headers = {
  "Authorization": f"Bearer {token}"
}

data = {
  "steps": [
    {"url": "https://example.com"}
  ],
  # You can create a video and a pdf the same way by using additional options: "RECORD" and "PDF"
  "options": ["SCREENSHOT"]
}

response = requests.post(url, json=data, headers=headers).json()

if response["status"] == "scheduled":
  job_id = response["id"]
  print(f"Job ID: {job_id}")

# you probably want to do a better job at awaiting the job completion than this...
while True:
  time.sleep(1)
  job_response = requests.get(f"http://localhost:3000/api/v1/job-status?id={job_id}", headers=headers)

  if job_response.status_code == 200:
    job_response_data = job_response.json()

    if job_response_data["status"] == "success":
        screenshot_b64 = job_response_data["result"]["screenshot"]
        screenshot = base64.b64decode(screenshot_b64)

        with open("screenshot.png", "wb+") as screenshot_file:
          screenshot_file.write(screenshot)

        break
