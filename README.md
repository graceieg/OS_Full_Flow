# CatMayOS — Katmai Computing

**Live demo:** [catmayos.vercel.app](https://catmayos.vercel.app)

Web app for booking and operating the Katmai 01 NMR spectrometer.

## Setup

```bash
npm install
```

Create a `.env.local` file in the project root:
```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

Get these values from Supabase → Settings → API.

```bash
npm run dev
```

## Demo Login

| Email | testkatmaios@gmail.com |
|-------|------------------------|
| Password | testtest |

## Stack

React 19 · TypeScript · Vite · Supabase
