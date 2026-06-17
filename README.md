# Productive

A desktop productivity dashboard that lives on your wallpaper. Built with Electron, it sits behind your desktop icons as a transparent overlay, letting you track tasks, notes, wins, and daily progress without switching windows.

## Features

- **Transparent overlay** — sits behind desktop icons, always visible
- **Task checklist** — track daily tasks with completion status
- **Notes & wins** — journal your progress each day
- **Calendar** — view monthly productivity with color-coded dots
- **Weekly heatmap** — visual grid of your productivity streaks
- **Focus score** — daily and monthly average task completion
- **Productivity streak** — track consecutive productive days
- **System tray** — show/hide, lock interaction, refresh
- **Persistent data** — all history saved to localStorage

## Screenshots

![Dashboard](screenshot.png)

## Download

Download the latest `Productive-portable.exe` from [Releases](../../releases). No installation needed — just run it.

## Development

### Prerequisites

- [Node.js](https://nodejs.org/) (v18+)
- [Python](https://python.org/) (for window pinning helper)

### Setup

```bash
npm install
```

### Run (dev mode)

```bash
npm run dev
```

This starts the Vite dev server and Electron together.

### Build portable .exe

```bash
npm run build:renderer
npm run build:win
```

Output: `dist/Productive-portable.exe`

## Tech Stack

- [Electron](https://electronjs.org/) — desktop shell
- [Vite](https://vitejs.dev/) — build tool
- [React](https://react.dev/) — UI (renderer/src)
- Vanilla JS — dashboard logic (renderer.js)

## License

MIT
