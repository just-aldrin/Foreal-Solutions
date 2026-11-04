# Foreal Solutions

Static website built with HTML, CSS, and vanilla JavaScript.

## Run locally

Open `index.html` in a browser, or serve this folder with a local web server.

## Deploy with Vercel

Import this repository in Vercel and deploy it as a static site. No build command or output directory is required; the site entry point is `index.html`.

## Vercel API configuration

The inquiry form posts to `/api/inquiries`. Set `INQUIRY_WEBHOOK_URL` in Vercel to the private webhook that should receive inquiry JSON.

The live viewer count posts presence to `/api/viewers`. Set `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` for a shared Upstash Redis database. Without these variables the UI reports that live presence is unavailable instead of showing a fabricated count.
