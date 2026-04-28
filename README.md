# Netlify Proxy

A minimal, robust proxy server built with Netlify Functions.

[![Deploy to Netlify](https://www.netlify.com/img/deploy/button.svg)](https://app.netlify.com/start/deploy?repository=https://github.com/kaungkhantjc/netlify-proxy#NETLIFY_PROXY_API_KEY=)

## Features

- **Simple API**: Just pass the `url` query parameter.
- **Secure**: Protected by an API key header.
- **Robust**: Handles headers, binary data, and standard HTTP status codes.

## Usage

### 1. Deployment

Click the button above to deploy your own instance. You will be prompted to set the `NETLIFY_PROXY_API_KEY` environment variable.

### 2. Making Requests

Send a request to your Netlify function endpoint (default: `/v1`) with the `url` parameter and the required header.

**Endpoint:** `https://your-site.netlify.app/v1?url=https://httpbin.org/get`

**Headers:**

- `NETLIFY_PROXY_API_KEY`: Your secret API key.

**Example with curl:**

```bash
curl -H "NETLIFY_PROXY_API_KEY: your_secret_key" "https://your-site.netlify.app/v1?url=https://httpbin.org/get"
```

## Environment Variables

- `NETLIFY_PROXY_API_KEY`: (Required) The secret key used to authorize requests to the proxy.
