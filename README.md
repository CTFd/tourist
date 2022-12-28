# Tourist

![build](https://github.com/ctfd/tourist/actions/workflows/docker.yml/badge.svg)
![test](https://github.com/ctfd/tourist/actions/workflows/test.yml/badge.svg)


### What it tourist?

Simply put - tourist is an agent that will visit web applications and perform given actions.
It was designed for use with CTF challenges, that require visiting by a real browser to trigger vulnerabilities.
Instead of packaging a headless chrome inside all of your challenges via puppeteer / playwright / phantom - you can
deploy a single instance of tourist somewhere and have all your challenges talk with it to schedule visits.

It can also perform additional actions, for example if your challenge requires generating PDF files from HTML
you can also outsource this task to tourist.


### Getting started

1. First you need to deploy tourist. We recommend using our docker image, you can also reference the `docker-compose.yml` file.
2. With authentication enabled, you need to copy the issuer token generated for you during the application start up.
3. Next, using that token, you need to create a token for your application to schedule jobs.
4. In response to that request, you will receive a visit token (by default valid for 7 days), which you can use to schedule jobs.

For reference, be sure to check:
- examples directory
- OpenAPI docs (by navigating to a deployed tourist endpoint)
- unit tests: `runner.test.ts`, `async-job.test.ts` and `sync-job.test.ts`


### Configuring tourist

We recommend using tourist in Docker, and configuring it with environmental variables. Example (default) config can be
seen in the `.env.example` file which is self-explanatory.

The only required setting is the `REDIS_URL`. It's also recommend to provide a securely random `SECRET` - tourist will
generate a random secret key on startup, however if you happen to restart the application your old tokens will become
invalid.


### Using actions

You can specify actions to be performed during each step. Actions are an array of strings to be passed to playwright.
There are a few guidelines for you to follow:

- Each action has to reference the `page` variable - you can execute methods off of it, for the full list please reference the [playwright docs](https://playwright.dev/docs/api/class-page)
- Use camelCased methods - as in the playwright docs.
- Use javascript syntax - typescript will not be precompiled.
- You can register event handlers by using `page.on()` - make sure to treat each action as a single line of code, use arrow functions and if necessary chain lines with semicolons. 
- Do not use async / await - tourist will automatically wait for each step to complete
- Do not use waitForNavigation - tourist will automatically wait for the navigation to complete upon clicking buttons
- Do not use screenshot / record in the actions - instead specify this in tourist options when dispatching the request


#### Authentication

Token authentication is enabled by default. It can be disabled with env variables. Tourist expects the `Authorization` header with a value of `Bearer <token>`.

- Issuer / Master token - is provided for you when you start the application. You can use this token to issue visit tokens that will allow scheduling jobs.
  - You can also generate a new issuer token at any time with `yarn cmd:get-issuer-token`.
- Visit token - is obtained by making an authenticated (with issuer token) POST request to `/api/v1/issue-token`, where you can set:
  - `scope` - (string) the URL against which the token will be valid. For example if you issue a token that allows tourist to visit `example.com` it will not allow for scheduling jobs against `google.com`.
  - `validity` - (number) time in seconds, for how long the token should be valid (by default: 168h / 7days).
  - `strict` - (boolean) whether the scope should be strictly equal to the visited url. For example a non-strict token will allow visiting all paths on `example.com`, but a strict token has to be strictly equal - including the scheme, path, and query parameters (by default: false).

#### Legacy API

We have been using a previous version of tourist internally at CTFd for some time. We found this to be worth to make
available for our customers and that's how this version of tourist was born. Legacy API matches our previous
specification which is simpler - most notably it **does not support authentication**, and does not allow choosing between
synchronous and asynchronous jobs. It's provided as a compatibility layer for us and should be considered deprecated.


#### Sentry

Tourist can capture exceptions to sentry, to enable that - configure the `SENTRY_DSN` env variable.


### Contributing

Contributions are the most welcome!

Please use GitHub issues to submit both issues and feature requests, and feel free to submit pull requests!

When working with the codebase please adhere to the prettier code style, you can format your code with `yarn format`.

When adding new functionality please make sure to cover it with unit tests as well!

#### Note about testing:

Running the tests concurrently, with `yarn test` causes some false negatives. The CI workflow uses the `yarn test:ci`
command to run tests serially, which rarely causes false negatives, but can be a hassle during development.

It is recommended to use `yarn test` for development, and just ignore the false negatives, or even only run tests
selectively with `yarn ava -m "pattern"` - as described in the [ava docs](https://github.com/avajs/ava/blob/main/docs/05-command-line.md#running-tests-with-matching-titles)

With that said, there are some false negatives - if the tests fail, the best first step is just to run them again.
If the failure is persistent then it might be a real problem.
