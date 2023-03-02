# Authentication

Tourist has two separate types of tokens utilized for authentication purposes:

1. **Issuer Token** - is generated during application startup (or alternatively, by running:
   `yarn cmd:get-issuer-token`) and logged to the console, and it used to generate the next type of token:
2. **Visit Token** - a specific _per target_ token generated from the API, by authenticating with the issuer token.
   You can obtain this token by making a `POST` request to `/api/v1/issue-token` with your Issuer Token.
   This token can be additionally configured, you can set:
   - `scope`_(string)_ - the URL against which the token will be valid. For example if you issue a token that allows
     Tourist to visit example.com it will not allow for scheduling jobs against google.com _(required)_.
   - `validity`_(number)_ - time in seconds, for how long the token should be valid _(by default: 168h / 7days)_.
   - `strict`_(boolean)_ - whether the scope should be strictly equal to the visited url. For example a non-strict
     token will allow visiting all paths on example.com, but a strict token has to be strictly equal - including the
     scheme, path, and query parameters _(by default: false)_.

_Issuer Tokens_ **do not work** as sort of _Master Tokens_ - they will only allow you to create new _Visit Tokens_, but
will not work to schedule jobs.

Tourist expects the token in the `Authorization` header, in a `Bearer <token>` format.

### Examples

#### Non-strict token with default validity (python/requests)

```python
# Issue a non-strict, visit token for visiting example.com valid for 7 days.
import requests

url = "http://localhost:3000/api/v1/issue-token" # adjust
token = "<issuer-token>" # adjust

headers = {
  "Authorization": f"Bearer {token}"
}

data = {
  "scope": "https://example.com",
}

response = requests.post(url, json=data, headers=headers)
print(response.json()["token"])
```

#### Strict token with default validity (python/requests)

```python
# Issue a non-strict, visit token for visiting example.com valid for 1 hour.
import requests

url = "http://localhost:3000/api/v1/issue-token" # adjust
token = "<issuer-token>" # adjust

headers = {
  "Authorization": f"Bearer {token}"
}

data = {
  "scope": "https://example.com",
  "strict": True,
  "validity": 3600
}

response = requests.post(url, json=data, headers=headers)
print(response.json()["token"])
```

### Why two types of tokens?

Once a challenge is completed a participant may have access to the challenge source code as well as the Tourist token.
Having the token restricted to a specific target ensures that even after the token is leaked it cannot be used to
schedule jobs against any other targets.

The issuer token is just to generate visit tokens via the API instead of logging into the Tourist server directly.
If your deployment of Tourist isn't publicly available you can always disable authentication entirely.

### Note about the `SECRET` variable

The secret is necessary to generate both types of tokens. If you change the secret your old tokens will become invalid.
Tourist generates a securely random secret on startup - so if you restart the application a new secret will be generated
and previous tokens will become invalid.

It's recommended to provide your own, securely random, secret - the automatic generation is provided purely as
a convenience, so that Tourist can be stared without any additional configuration if you just want to test it out.
