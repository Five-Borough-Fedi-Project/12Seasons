# 12Seasons Cloudflare Worker

A Cloudflare Worker that serves dynamic CSS to [masto.nyc](https://masto.nyc), adding real-time weather effects to the website based on actual weather conditions in New York City.

See: https://12seasons.nyc/

## How It Works

The worker fetches current weather data from the [Open-Meteo API](https://open-meteo.com/) for NYC (latitude 40.7128, longitude -74.006) and returns CSS that creates visual weather effects:

- **Snow** ❄️ — Snowflakes overlay when there's snowfall
- **Rain** 🌧️ — Rain when it's raining or showering
- **Wind** 💨 — Subtle page shake and wind streaks when gusts exceed 45 km/h
- **Clear** ☀️ — No effects when the weather is calm

The CSS is cached for 15 minutes and includes CORS headers so it can be loaded from masto.nyc.

### Priority

When multiple weather conditions occur simultaneously:
1. Snow takes priority
2. Rain is shown if no snow
3. Wind effects only appear when it's dry but gusty

## Prerequisites

- [Node.js](https://nodejs.org/) (v18 or later)
- [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/)

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Log in to Cloudflare (if not already):
   ```bash
   npx wrangler login
   ```

## Development

Run the worker locally:
```bash
npm run dev
```

This starts a local development server at `http://localhost:8787`.

## Deployment

Deploy to Cloudflare:
```bash
npm run deploy
```

## Configuration

Edit `wrangler.toml` to configure:
- Worker name and routes
- Environment variables
- KV namespace bindings
- D1 database bindings
- Other Cloudflare bindings

## Resources

- [Cloudflare Workers Documentation](https://developers.cloudflare.com/workers/)
- [Wrangler CLI Documentation](https://developers.cloudflare.com/workers/wrangler/)
