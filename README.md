# Foreal Solutions

Static website built with HTML, CSS, and vanilla JavaScript.

## Run locally

Open `index.html` in a browser, or serve this folder with a local web server.

To test generated trivia locally, set `GEMINI_API_KEY` in `.env` and run this from the project folder with Node.js 22 or later:

```sh
node --env-file-if-exists=.env tools/preview.mjs
```

Open [Behind the Build](http://127.0.0.1:4173/#process) in your browser. The preview runs the trivia API on your computer and reads the key server-side.

## Deploy with Vercel

Import this repository in Vercel and deploy it as a static site. No build command or output directory is required; the site entry point is `index.html`.

## Vercel API configuration

The inquiry form posts to `/api/inquiries`. Set `INQUIRY_WEBHOOK_URL` in Vercel to the private webhook that should receive inquiry JSON.

The live viewer count posts presence to `/api/viewers`. Set `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` for a shared Upstash Redis database. Without these variables the UI reports that live presence is unavailable instead of showing a fabricated count.
