# Just Ship - A batteries included Svelte 5 SaaS Boilerplate

### Comes With

- 💻 **Svelte 5 and SvelteKit 2**
- 🚪 **Auth** (both social and magic link, using Lucia)
- 📧 **Sending Emails** (using Postmark)
- 🎨 **Styling** (using tailwindcss and daisyUI )
- 📦 **Database** (using turso and drizzle as ORM)
- ☁️ **Serverless hosting** using vercel

### Getting Started 🚀

#### Local Development

- Run `npm install --legacy-peer-deps` or `pnpm install`
- Rename the `.env.example` file to `.env` and __populate it with your own values__
- Run `npm run generate && npm run migrate` to create a local database
- Install mailpit to receive emails locally https://mailpit.axllent.org/docs/install/
- run `npm run dev`

#### Production 🌐

- 🌍 Get a domain name
- 📬 Create a **postmark** account and get the server api key
- 💾 Set up a database with **Turso**: [Turso Setup](https://turso.tech/)
- 🔑 Create an OAuth credential in **Google Cloud**
- 🏗️ Set up a project from this repo on **Vercel**: [vercel](https://vercel.com)
- 🎯 Point your main domain name to your project on Vercel
- 🔐 fill out the environment variables in `.env`
- ⚙️ Add those environment variables to your project in Vercel

Feel free to contribute or suggest improvements! 🤝

### How to setup Just Ship the youtube tutorial

[![How to use Just Ship](https://img.youtube.com/vi/sJZOXUhkvMc/0.jpg)](https://www.youtube.com/watch?v=sJZOXUhkvMc)

# Leo added

## Getting started

```bash
npm run triplit
make clean
make dev
```

## Interesting tools

### Data Storage

- [Faster S3](https://tebi.io/)

### Video Streaming

https://skippybla.medium.com/streaming-services-in-2023-504be51eebaa

- [Bunny](https://bunny.net/stream/cdn-player/)
- [Mux](https://www.mux.com/)




https://animation-svelte.vercel.app/examples/5


# Media

## Videos

```sh
# 1440p
ffmpeg -i attendee-view.mp4 \
  -preset fast -g 48 -sc_threshold 0 -hls_time 6 -hls_playlist_type vod \
  -vf "scale=trunc(iw*sar*1440/ih/2)*2:1440" -b:v 8000k -maxrate 8500k -bufsize 12000k \
  -hls_segment_filename "1440p_%03d.ts" 1440p.m3u8

# 1080p
ffmpeg -i attendee-view.mp4 \
  -preset fast -g 48 -sc_threshold 0 -hls_time 6 -hls_playlist_type vod \
  -vf "scale=trunc(iw/2)*2:trunc(ih/2)*2" -b:v 5000k -maxrate 5350k -bufsize 7500k -hls_segment_filename "1080p_%03d.ts" 1080p.m3u8

# 720p
ffmpeg -i attendee-view.mp4 \
  -preset fast -g 48 -sc_threshold 0 -hls_time 6 -hls_playlist_type vod \
  -vf "scale=trunc(iw*sar*720/ih/2)*2:720" -b:v 2800k -maxrate 3000k -bufsize 4200k \
  -hls_segment_filename "720p_%03d.ts" 720p.m3u8

# 360p
ffmpeg -i attendee-view.mp4 \
  -preset fast -g 48 -sc_threshold 0 -hls_time 6 -hls_playlist_type vod \
  -vf "scale=trunc(iw*sar*360/ih/2)*2:360" -b:v 800k -maxrate 1000k -bufsize 1500k \
  -hls_segment_filename "360p_%03d.ts" 360p.m3u8
```

Create the master playlist `master.m3u8` file:
```
#EXTM3U
#EXT-X-VERSION:3

# 1440p Stream
#EXT-X-STREAM-INF:BANDWIDTH=8500000,RESOLUTION=2560x1440
1440p.m3u8

# 1080p Stream
#EXT-X-STREAM-INF:BANDWIDTH=5350000,RESOLUTION=1920x1080
1080p.m3u8

# 720p Stream
#EXT-X-STREAM-INF:BANDWIDTH=3000000,RESOLUTION=1280x720
720p.m3u8

# 360p Stream
#EXT-X-STREAM-INF:BANDWIDTH=1000000,RESOLUTION=640x360
360p.m3u8
```

# Marketing

## Subreddits
- r/EventProduction: https://www.reddit.com/r/EventProduction/
- 
- https://www.reddit.com/r/EventProduction/comments/1c1o2hd/ticketing_platform_alternative_to_eventbrite/