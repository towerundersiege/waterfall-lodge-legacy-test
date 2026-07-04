# Waterfall Lodge Legacy Test

A static Hugo rebuild of the old Waterfall Lodge WordPress site, isolated for
test deployments and a separate Cloudflare Pages project.

This repository exists to preserve the legacy WordPress-era website as a
hostable static site. It contains no database, no WordPress runtime, no Docker
runtime, and no dynamic application code.

## Technology

- Hugo static site generator
- Plain HTML templates and CSS
- Copied WordPress uploads and theme assets under `static/wp-content/`
- Cloudflare Pages hosting for the test site

## Local Development

Install Hugo Extended, then run:

```sh
hugo server -D
```

The site will be available at:

```txt
http://localhost:1313/
```

## Build

```sh
hugo --minify
```

The generated site is written to `public/`.

## Cloudflare Pages

Use the Hugo framework preset with:

- Build command: `hugo --minify`
- Build output directory: `public`
- Environment variable: `HUGO_VERSION=0.160.0`

`wrangler.toml` also declares the Pages build output directory for local
Cloudflare tooling.

## Join Form

The join enquiry form posts to a Cloudflare Pages Function at `/api/join`.
Set these environment variables in Cloudflare Pages:

- `HUGO_TURNSTILE_SITE_KEY`
- `TURNSTILE_SECRET_KEY`
- `JOIN_TO_EMAIL` defaults to `membership@waterfall-lodge.org`
- `JOIN_FROM_EMAIL`
- `JOIN_FROM_NAME` is optional

The function verifies Turnstile server-side and sends the enquiry via the
configured email relay.

## Structure

- `content/`: generated Hugo content converted from the WordPress export
- `layouts/`: Hugo templates and partials for the preserved site chrome
- `static/`: copied CSS, WordPress uploads, theme assets, and block-library CSS
