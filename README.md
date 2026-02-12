# Cyberpunk Personal Blog (DSL Edition)

> "Wake up, User..."

A high-performance, cyberpunk-themed personal blog built with React, Vite, and Node.js. Designed for the Vibe Coding era.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Status](https://img.shields.io/badge/system-ONLINE-green.svg)

## ⚡ Features

### 🎨 Cyberpunk Aesthetic
- **Immersive UI**: CRT scanlines, glitch effects, neon glows, and glassmorphism.
- **Dynamic Animations**: Matrix rain background, scroll reveals, typewriter text.
- **Sound Effects (SFX)**: High-tech UI sounds for hover, click, and system events (Web Audio API).

### 🛠️ Tech Stack
- **Frontend**: React 18, TypeScript, Vite
- **Styling**: Vanilla CSS (Variables & Grid), Bento Grid Layout
- **Backend**: Node.js, Express, Prisma (SQLite)
- **Localization**: Full Chinese Support (EN fallback for tech terms)

### 🧩 Components
- **Terminal Navbar**: Command-line style navigation.
- **Holographic Toasts**: Custom notification system replacing browser alerts.
- **Markdown Editor**: Integrated block editor for writing posts.

## 🚀 Getting Started

### Prerequisites
- Node.js > 18
- NPM

### Installation

1. **Clone & Install**
   ```bash
   git clone <repo-url>
   cd dsl-blog
   
   # Install Client
   cd client
   npm install
   
   # Install Server
   cd ../server
   npm install
   ```

2. **Initialize Database**
   ```bash
   cd server
   npm run db:generate
   npm run db:push
   npm run db:seed
   ```

3. **Run Development Mode**
   ```bash
   # Terminal 1 (Server)
   cd server
   npm run dev
   
   # Terminal 2 (Client)
   cd client
   npm run dev
   ```

## 📂 Project Structure

```
/dsl-blog
  ├── client/          # React Frontend
  │   ├── src/components/  # UI Components (CRT, Glitch, etc.)
  │   ├── src/hooks/       # Custom Hooks (useSound, useToast)
  │   └── ...
  └── server/          # Express Backend
      ├── prisma/          # Database Schema & Seed
      └── ...
```

## 📝 License

MIT
