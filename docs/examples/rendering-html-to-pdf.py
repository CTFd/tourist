import base64
import requests

url = "http://localhost:3000/api/v1/render"
token = "<any-valid-tourist-token>"

headers = {
  "Authorization": f"Bearer {token}"
}

data = {
  "html": "<h1>Hello World</h1>",
  # optional parameters
  "format": "A1", # defaults to A4
  "landscape": True, # defaults to False
  "background": False, # defaults to True
  "margin": { # defaults to empty object (no margins)
    "top": "10cm",
    "right": "10cm",
    "bottom": "10cm",
    "left": "10cm",
  },
  # format takes precedence over size
  # "size": {"width": "10cm", "height": "10cm"},
  "js": True, # defaults to True
  "delay": 300, # (ms) defaults to 0
  "scale": 2.0, # defaults to 1.0
}

# remove headers= if not using authentication
response = requests.post(url, json=data, headers=headers).json()

if response["status"] == "success":
  pdf_b64 = response["pdf"]
  pdf = base64.b64decode(pdf_b64)

  with open("example.pdf", "wb+") as pdf_file:
    pdf_file.write(pdf)

