# Dispatching Jobs

Tourist operates in Jobs. At the core of its functionality is a queue that accepts requests to visit a website and runs
playwright to perform that visit as well as requested actions.

Jobs can be either **Synchronous** or **Asynchronous**.
Depending on whether your dispatching application needs to know the results directly (or you need to block it until the
request happens), or on the contrary - the requests can happen at some point in the future, and you do not want to block
your application.

### Authentication

If you're running Tourist with authentication enabled, you will need to obtain a visit token to schedule requests.
This is covered in the [authentication](02-authentication.md) section.

### Job Requests

You can dispatch a synchronous jobs by submitting a `POST` request to `/api/v1/sync-job`, and in a similar fashion, you
can schedule an asynchronous job by submitting a `POST` request to `/api/v1/async-job`.

The payload for both types of jobs is exactly the same:

```json5
{
  // either "CHROMIUM" or "FIREFOX". Can be omitted and defaults to "CHROMIUM".
  "browser": "CHROMIUM",
  // an array of job steps
  "steps": [ 
    {
      // url to visit - if authentication is enabled it will be checked against the scope of the token
      "url": "https://example.com",
      // actions - can be omitted if you just want to visit the page and wait for it to load
      "actions": [ 
        // await is not necessary, more on that in 04-using-actions.md
        "page.click('#my-button-1')",
        "page.click('#my-button-2')"
      ]
    }
  ],
  // cookies attached to the request - can be omitted if you don't want to attach any
  "cookies": [
    {
      // cookie name
      "name": "test",
      // cookie value
      "value": "test",
      // domain of the target for which the cookie should be attached
      "domain": "example.com",
      // path on the target for which the cookie should be attached - can be omitted and defaults to "/"
      "path": "/",
      // date of expiration of the cookie - in unix time (in seconds) - can be omitted and defaults to session duration
      "expires": 1735775999,
      // cookie HttpOnly attribute (not accessible from javascript) - can be omitted and defaults to false 
      "httpOnly": false,
      // cookie Secure attribute (only available on https connections) - can be omitted and defaults to false
      "secure": false,
      // cookie sameSite attribute (only available to same-site contexts) - can be omitted and defaults to nothing 
      // - leaving the behaviour up to the browser 
      // either "None", "Lax" or "Strict"
      // keep in mind that setting this value to "None" will require the secure attribute to be true
      // https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Set-Cookie/SameSite#none
      "sameSite": "Lax"
    }
  ],
  // additional Tourist options - can be omitted 
  "options": [
    // record the job (webm format)
    "RECORD",
    // take a screenshot after the actions are finished (png format)
    "SCREENSHOT",
    // render a pdf after the actions are finished
    "PDF"
  ]
}
```

The only difference between them is that a sync job request will not return until the job has been completed (which can
take several seconds), and will return any results in the response after it's finished. Whereas an async job will return
an `id` _(of the job)_, as soon as it's been scheduled (in most cases within milliseconds).

A response with an HTTP 4xx code will be returned if the job couldn't be dispatched. It will have an `error` and a
`message` in the response body. Otherwise, an HTTP 200 response will be returned.

#### Synchronous job output

Result of a synchronous job will be returned in the response to the dispatch request:

```json5
{
  "status": "success",
  // result will be empty if no options have been provided
  "result": {
    // base64 encoded files - depending on the options selected - will be omitted if a given option wasn't selected
    "screenshot": "<base64 png screenshot>",
    "video": "<base64 webm video>",
    "pdf": "<base64 pdf document>"
  }
}
```

#### Asynchronous job output

Result of an asynchronous job can be obtained by making a `GET` request to `/api/v1/job-status` with the job `id` in the
query parameters. With authentication enabled you will also need the visit token with scope matching the job target.

Tourist will respond with a `404` error if the job wasn't found. Otherwise, it will return a `200` response with the
body like presented below - regardless of whether the job itself has been completed successfully or not.

```json5
{
  // status of the job - can be:
  // - "success" - job has completed successfully, and results can be obtained
  // - "pending" - job has not yet completed, but also hasn't failed - it might be currently running or just queued
  // - "failed"  - job has failed to complete, errors are not returned here - check the validity of your actions with 
  //               a synchronous job or in the tourist logs.
  "status": "success",
  // result will be empty if no options have been provided
  "result": {
    // base64 encoded files - depending on the options selected - will be omitted if a given option wasn't selected
    "screenshot": "<base64 png screenshot>",
    "video": "<base64 webm video>",
    "pdf": "<base64 pdf document>"
  }
}
```

#### Examples

For examples in python check the [examples](examples) directory.
