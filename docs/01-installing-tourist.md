# Installing Tourist

Tourist can be started directly, or inside docker. The only additional service required is redis.

If you're just getting started, and don't have a specific reason not to use docker, the following is likely quicker.

### Tourist inside docker

To start Tourist you can use our `docker-compose.yml` file:

```yaml
version: "3"

services:
  tourist:
    image: ghcr.io/ctfd/tourist:latest
    ports:
      - "3000:3000"
    environment:
      REDIS_URL: redis://redis:6379

  redis:
    image: redis:alpine
```

Simply save this as `docker-compose.yml` and execute `docker compose up`. Tourist should start on port `3000`.

You can pass other configuration options via the environmental variables under the `environment` key.
For example if you wanted to set the `SECRET` you should modify the compose file as follows:

```yaml
version: "3"

services:
  tourist:
    image: ghcr.io/ctfd/tourist:latest
    ports:
      - "3000:3000"
    environment:
      REDIS_URL: redis://redis:6379
      SECRET: my-secret

  redis:
    image: redis:alpine
```

Check out the [Configuration Reference](#configuration-reference) for a full breakdown.

#### Docker releases

Tourist `:latest` as well as versioned tags are build with each Tourist release.
If you want to use the current version from the GitHub repository you can use the `:next` tag.

### Starting Tourist directly

If you prefer to deploy Tourist directly on your server you should pull this repository and start a redis server.

Next you should build the project and start the app, which can be done with a single command:

`yarn start:build`

or alternatively, by running:

`yarn build`

followed by:

`yarn start:serve`

You can configure Tourist by using a `.env` file inside the root of the project.
If you're not running Redis on `127.0.0.1:6379` you will want to configure the `REDIS_URL` to point to your Redis
server.

Please check the `.env.example` as well as the [Configuration Reference](#configuration-reference) for a full breakdown.

In a production environment, you will likely want to run Tourist via a process manager
like [pm2](https://pm2.keymetrics.io/) or with a systemd service.

### Configuration Reference

| Option                | Default                 | Description                                                                      |
|-----------------------|-------------------------|----------------------------------------------------------------------------------|
| SECRET                | (dynamically generated) | Secret value for token authentication purposes.                                  |
| NODE_ENV              | production              | Environment Tourist is running in.                                               |
| REDIS_URL             | redis://127.0.0.1:6379  | URL of the redis server.                                                         |
| CONCURRENCY           | (number of CPU threads) | Maximum number of jobs processed concurrently.                                   |
| HOST                  | 127.0.0.1               | Host address that Tourist will listen on.                                        |
| PORT                  | 3000                    | Port on the host address that tourist will listen on.                            |
| BODY_SIZE_LIMIT       | 26214400 (25MB)         | Maximum allowed body size                                                        |
| ENABLE_LEGACY_API     | false                   | Whether to enable legacy portion of the API (not recommended).                   |
| ENABLE_AUTHENTICATION | true                    | Whether to enable authentication with tokens (recommended).                      |
| ENABLE_CORS           | false                   | Whether to enable [CORS](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS) |
| SENTRY_DSN            | undefined (disabled)    | <https://docs.sentry.io/product/sentry-basics/dsn-explainer/>                    |
| SENTRY_TRACES_SAMPLE  | 0.0                     | <https://develop.sentry.dev/sdk/performance/#tracessamplerate>                   |

#### Note on concurrency

Concurrency value defaults to the number of threads present on the system. It is not recommend to go above this value,
as a headless browser can consume a full thread even for simple operations. You should also account for the RAM
available on your system, as each additional browser can consume somewhere around 100/200MB of RAM.


#### Note on body size

The body size limit is set to 25MB by default. The value is increased because when rendering HTML page the images might 
have to be inlined with base64 - and thus the documents end up being very large. If you are not using this feature, you 
can safely decrease this value. On the other hand, if your documents are still larger, you might want to increase this.
