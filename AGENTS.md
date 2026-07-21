# AGENTS.md

## Purpose

This repository is a static Hugo rebuild of the legacy Waterfall Lodge WordPress
site for test and preview deployments. There is no database, no PHP runtime,
and no application server. Content is rendered at build time into `public/`.

## Core Stack

- Hugo static site generator
- Plain Hugo templates in `layouts/`
- Static assets in `static/`
- Structured site data in `data/lodge.yaml`
- Cloudflare Pages deployment

## Build And Deploy

### Local

- Dev server: `npm run dev` or `hugo server -D`
- Production build: `npm run build` or `hugo --minify`
- Output directory: `public/`

### Cloudflare Pages

- Config file: [`wrangler.toml`](/Users/ryan/Projects/waterfall-lodge-legacy-test/wrangler.toml)
- Build output directory: `public`
- Cloudflare Pages currently builds with an older Hugo version than local
  development unless `HUGO_VERSION` is pinned in Pages settings.

## Important Compatibility Note

Cloudflare Pages has already failed on `hugo.Data` because its Hugo version was
older than local (`0.147.7` in the build log). For compatibility, templates in
this repo currently use `site.Data` rather than `hugo.Data`.

If Pages is upgraded and pinned to a newer Hugo release, this can be revisited.

## Repository Layout

- `content/`: page content and section content
- `layouts/`: Hugo templates, shortcodes, and base layouts
- `static/`: copied legacy assets, CSS, images, WordPress uploads
- `data/`: canonical structured data used by templates
- `public/`: generated output from Hugo builds
- `hugo.yaml`: site configuration
- `package.json`: convenience scripts for local dev/build

## Canonical Data Source

The main structured content source is:

- [`data/lodge.yaml`](/Users/ryan/Projects/waterfall-lodge-legacy-test/data/lodge.yaml)

This file currently drives:

- `current_members`
- `events`
- `charity`

When possible, prefer updating `data/lodge.yaml` instead of hard-coding dated
content into Markdown pages.

## Events Page

### Canonical Source

The events page is driven from:

- [`data/lodge.yaml`](/Users/ryan/Projects/waterfall-lodge-legacy-test/data/lodge.yaml) under `events`
- [`layouts/shortcodes/events_table.html`](/Users/ryan/Projects/waterfall-lodge-legacy-test/layouts/shortcodes/events_table.html)
- [`content/events/_index.md`](/Users/ryan/Projects/waterfall-lodge-legacy-test/content/events/_index.md)
- [`static/css/site.css`](/Users/ryan/Projects/waterfall-lodge-legacy-test/static/css/site.css)

### Current Behavior

The events page is intentionally split into two coordinated parts:

1. A month-based calendar navigator
2. An expandable event list

Implemented behavior:

- Calendar shows the current month by default
- Left and right arrows navigate month-by-month
- Clicking a calendar day focuses matching events in the list
- Event rows show:
  - left: weekday, day, month, year
  - middle: event type and title
  - right: time
- Event rows expand to show details including location and description
- Default list state shows:
  - upcoming events
  - events from the last 7 days, greyed out
- Older events are hidden by default but can be revealed by:
  - browsing older months
  - using the "Show earlier events" control

### Event Data Rules

Each event entry in `data/lodge.yaml` should use this shape:

- `type`
- `name`
- `datetime`
- `location`
- `description`

Current `datetime` format is:

- `"YYYY-MM-DD HH:MM"`

Example:

```yaml
- type: meeting
  name: "Lodge Meeting: Installation"
  datetime: "2026-03-11 18:00"
  location: Chertsey Masonic Hall, Chertsey, Surrey
  description: Installation lodge meeting.
```

### Event Content Guidance

- Add new events to `data/lodge.yaml`, not to prose schedules in Markdown.
- Avoid duplicating schedules across multiple pages.
- If a legacy page references old event dates, prefer linking back to `/events/`
  rather than maintaining a second schedule.
- If two sources disagree on date or time, confirm the authoritative source
  before changing existing structured data.

## Known Historical Decisions

- The legacy LOI page used to contain its own hard-coded schedule. It was
  replaced with a short page that points users to the main events page.
- Missing historic and early-2026 events were merged into `data/lodge.yaml`
  where the dates were unambiguous.
- One ambiguous 2025 legacy LOI line was intentionally not migrated because the
  date text was internally inconsistent.

## Editing Guidance

- Prefer updating data-driven templates over adding more hard-coded page prose.
- Preserve the legacy visual language unless a change is intentionally scoped to
  a page redesign.
- Be careful with Hugo version compatibility between local and Cloudflare Pages.
- Before pushing template changes, run `hugo --minify`.
