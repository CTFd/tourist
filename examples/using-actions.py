# Go to https://ctfd.io/, click on features, click on check-out demo
import base64
import requests

url = "http://localhost:3000/api/v1/sync-job"
token = "<visit-token>"

headers = {
  "Authorization": f"Bearer {token}"
}

data = {
  "steps": [
    {
      "url": "https://ctfd.io",
      "actions": [
        "page.click('#navbarResponsive > ul > li:nth-child(1) > a')",
        # DO NOT use page.waitForNavigation(), tourist will automatically await each step's completion
        "page.click('body > div.content > div.container.mb-5 > div:nth-child(2) > div > h5 > a')",
      ]
    }
  ],
  # You can create a video and a pdf the same way by using additional options: "RECORD" and "PDF"
  "options": ["RECORD"]
}

response = requests.post(url, json=data, headers=headers).json()


if response["status"] == "success":
  video_b64 = response["result"]["video"]
  video = base64.b64decode(video_b64)

  with open("video.webm", "wb+") as video_file:
    video_file.write(video)

