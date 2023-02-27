# Tourist

![release](https://github.com/ctfd/tourist/actions/workflows/docker-release.yml/badge.svg)
![next](https://github.com/ctfd/tourist/actions/workflows/docker-next.yml/badge.svg)
![test](https://github.com/ctfd/tourist/actions/workflows/test.yml/badge.svg)

## What is Tourist?

Simply put - Tourist is an agent that will visit web applications and perform given actions.
It was designed for use with CTF challenges that require visiting by a real browser to trigger vulnerabilities.

Instead of packaging a headless browser inside all of your challenges via puppeteer/playwright/selenium - you can
deploy a single instance of Tourist somewhere and have all your challenges talk with it to schedule visits.

It can also perform additional actions, for example if your challenge requires generating PDF files from HTML
you can also outsource this task to Tourist.

## Getting Started

1. First you need to deploy Tourist. 
  * We recommend using our docker image from `ghcr.io/ctfd/tourist`
  * You can also reference the `docker-compose.yml` file.
2. With authentication enabled, you need to copy the issuer token generated for you during the application start up.
3. Next, using that token, you need to create a token for your application to schedule jobs:
```python
# Issue a non-strict, visit token for visiting example.com valid for 1 hour.
import requests

url = "http://localhost:3000/api/v1/issue-token"
token = "<issuer-token>"

headers = {
  "Authorization": f"Bearer {token}"
}

data = {
  "scope": "https://example.com",
}

response = requests.post(url, json=data, headers=headers)
print(response.json()["token"])
```

4. In response to that request, you will receive a visit token (by default valid for 7 days), which you can use to schedule jobs:

```python
# Go to https://example.com and take a screenshot synchronously
import base64
import requests

url = "http://localhost:3000/api/v1/sync-job"
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


if response["status"] == "success":
  screenshot_b64 = response["result"]["screenshot"]
  screenshot = base64.b64decode(screenshot_b64)

  with open("screenshot.png", "wb+") as screenshot_file:
    screenshot_file.write(screenshot)
```


For reference, be sure to check:

- The [examples directory](https://github.com/CTFd/tourist/tree/main/examples)
- OpenAPI docs (by navigating to a deployed tourist endpoint)
- Unit tests: `runner.test.ts`, `async-job.test.ts` and `sync-job.test.ts`

## Configuring Tourist

We recommend using tourist in Docker, and configuring it with environmental variables. Example (default) config can be
seen in the `.env.example` file which is self-explanatory.

The only required setting is the `REDIS_URL`. It's also recommend to provide a securely random `SECRET` - tourist will
generate a random secret key on startup, however if you happen to restart the application your old tokens will become
invalid.

## Using actions

You can specify actions to be performed during each step. Actions are an array of strings to be passed to playwright.
There are a few guidelines for you to follow:

- Each action has to reference the `page` variable - you can execute methods off of it, for the full list please reference the [playwright docs](https://playwright.dev/docs/api/class-page)
- Use camelCased methods - as in the playwright docs.
- Use JavaScript syntax - TypeScript will not be precompiled.
- You can register event handlers by using `page.on()` - make sure to treat each action as a single line of code, use arrow functions and if necessary chain lines with semicolons.
- Do not use `async`/`await` - Tourist will automatically wait for each step to complete
- Do not use `waitForNavigation` - Tourist will automatically wait for the navigation to complete upon clicking buttons
- Do not use `screenshot`/`record` in actions - instead specify this in tourist options when dispatching the request

### Authentication

Token authentication is enabled by default. It can be disabled with env variables. Tourist expects the `Authorization` header with a value of `Bearer <token>`.

- Issuer / Master token - is provided for you when you start the application. You can use this token to issue visit tokens that will allow scheduling jobs.
  - You can also generate a new issuer token at any time with `yarn cmd:get-issuer-token`.
- Visit token - is obtained by making an authenticated (with issuer token) POST request to `/api/v1/issue-token`, where you can set:
  - `scope` - (string) the URL against which the token will be valid. For example if you issue a token that allows tourist to visit `example.com` it will not allow for scheduling jobs against `google.com`.
  - `validity` - (number) time in seconds, for how long the token should be valid (by default: 168h / 7days).
  - `strict` - (boolean) whether the scope should be strictly equal to the visited url. For example a non-strict token will allow visiting all paths on `example.com`, but a strict token has to be strictly equal - including the scheme, path, and query parameters (by default: false).

### Legacy API

We have been using a previous version of Tourist internally at CTFd for some time. The legacy API matches our previous
simpler specification - most notably it **does not support authentication**, and does not allow choosing between
synchronous and asynchronous jobs. It's provided as a compatibility layer for us and should be considered deprecated.

### Sentry

Tourist can capture exceptions to Sentry by configuring the `SENTRY_DSN` environment variable.
