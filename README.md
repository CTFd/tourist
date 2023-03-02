# Tourist

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
   * You can also reference the `docker-compose.yml` file
2. With authentication enabled, you need to copy the issuer token generated for you during the application start up.
3. Next, using that token, you need to create a token for your application to schedule jobs:

    ```python
    # Issue a non-strict, visit token for visiting example.com valid for 7 days.
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

4. In response to that request, you will receive a visit token (by default valid for 7 days), which you can use to
   schedule jobs:

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

For additional guidance, be sure to check:

* The [docs](./docs)
* The [examples directory](./docs/examples)
* OpenAPI docs (by navigating to a deployed Tourist endpoint)
* Unit tests: [`runner.test.ts`](./tests/runner.test.ts), [`async-job.test.ts`](./tests/async-job.test.ts) and
  [`sync-job.test.ts`](./tests/sync-job.test.ts)

## Configuring Tourist

We recommend using Tourist in Docker, and configuring it with environmental variables. Example (default) config can be
seen in the `.env.example` file which is self-explanatory.

The only required setting is the `REDIS_URL`. It's also recommend to provide a securely random `SECRET` - Tourist will
generate a random secret key on startup, however if you happen to restart the application your old tokens will become
invalid.

For full reference please check our guide on [installing Tourist](./docs/01-installing-tourist.md#configuration-reference)

### Authentication

Token authentication is enabled by default. It can be disabled with environmental variables.

Tourist expects the `Authorization` header with a value of `Bearer <token>`.

For full reference please check our guide on [Tourist authentication](./docs/02-authentication.md)

## Using actions

You can specify actions to be performed during each step. Actions are an array of strings (code) to be passed to
playwright inside an isolated sandbox. There are a few guidelines for you to follow:

* You will want to execute methods off of the provided `page` variable - which will be a playwright
  [`Page`](https://playwright.dev/docs/api/class-page) object - already after navigation to the specified url.
  * You can register event handlers by using [`page.on()`](https://playwright.dev/docs/api/class-page#events) -
    which will be registered before the page loads.
  * Use camelCased methods - as in the playwright docs.
  * Use JavaScript syntax - TypeScript will not be precompiled.
  * Do not use `screenshot`/`record` in actions - instead specify this in Tourist options when dispatching the request.
* Treat actions as top-level synchronous code. They may return either a concrete value, or a Promise - which will be
awaited, however it's not an async context, so if you need to use `async`/`await` wrap your action in an
[IIFE](https://developer.mozilla.org/en-US/docs/Glossary/IIFE#execute_an_async_function) expression.
  * As actions can return a Promise - it's completely fine to execute simple playwright calls which return a Promise,
    without the added complexity - for example `page.click('a')` is a valid action (although
    [depreciated](https://playwright.dev/docs/api/class-page#page-click), which will be awaited.
  * Multi-line statements are allowed inside an IIFE expression, so follow the same pattern if you need to use for
    example, a for loop.

For full reference please check our guide on [Tourist actions](./docs/04-using-actions.md).

### Legacy API

We have been using a previous version of Tourist internally at CTFd for some time. The legacy API matches our previous
simpler specification - most notably it **does not support authentication**, and does not allow choosing between
synchronous and asynchronous jobs. It's provided as a compatibility layer for us and should be considered deprecated.

### Sentry

Tourist can capture exceptions to Sentry by configuring the `SENTRY_DSN` environment variable.
