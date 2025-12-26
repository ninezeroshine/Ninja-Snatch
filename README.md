# 🥷 Ninja Snatch v2.0

> **Pixel-Perfect, Offline-First** — Chrome Extension для извлечения HTML/CSS с веб-сайтов

[![Version](https://img.shields.io/badge/version-2.0.0--alpha-blue)](package.json)
[![WXT](https://img.shields.io/badge/WXT-0.20-green)](https://wxt.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue)](https://typescriptlang.org)
[![React](https://img.shields.io/badge/React-19-61dafb)](https://react.dev)

---

## 🚀 What's New in V2.0

V2.0 — это полная переработка расширения с новым технологическим стеком:

| Было (v10.0) | Стало (v2.0) |
|--------------|--------------|
| Vanilla JavaScript | TypeScript 5.7 (strict) |
| Manifest V3 напрямую | WXT Framework |
| DOM manipulation | React 19 + Shadow DOM |
| Нет модулей | ES Modules + NPM |
| Нет типизации | Строгие интерфейсы |

### Новая Архитектура

```
┌────────────────────────────────────────────────┐
│              WXT (Build System)                 │
├────────────────────────────────────────────────┤
│  Content Script    │  Background    │  Popup   │
│  ┌──────────────┐  │  ┌──────────┐  │  ┌─────┐ │
│  │ Shadow DOM   │  │  │ CORS     │  │  │React│ │
│  │ NinjaPanel   │  │  │ Bypass   │  │  │ 19  │ │
│  │ Highlighter  │  │  │ Download │  │  │     │ │
│  └──────────────┘  │  └──────────┘  │  └─────┘ │
└────────────────────────────────────────────────┘
```

---

## 📦 Installation (Development)

### Prerequisites

- Node.js 18+
- npm or pnpm

### Setup

```bash
# Clone repository
git clone https://github.com/ninezeroshine/Ninja-Snatch.git
cd Ninja-Snatch

# Switch to v2 branch
git checkout feature/v2-wxt-migration

# Install dependencies
npm install

# Development mode (with HMR)
npm run dev

# Production build
npm run build
```

### Load in Chrome

1. Navigate to `chrome://extensions/`
2. Enable **Developer mode** (top right)
3. Click **Load unpacked**
4. Select `.output/chrome-mv3` folder

---

## 🎯 Features

### Implemented (Phase 1)

- [x] **Visual Sniper** — Click to select any element
- [x] **Element Highlighter** — Real-time hover preview
- [x] **Shadow DOM Isolation** — UI protected from host page styles
- [x] **Premium UI** — Framer Motion animations, gradient buttons
- [x] **Mode Selection** — Clean / Styled / Smart Extract
- [x] **Copy/Download Toggle** — Choose output action

### Planned (Phase 2+)

- [ ] **Asset Bundle** — Download images, fonts, CSS as ZIP
- [ ] **Computed Truth** — `getComputedStyle()` → Tailwind classes
- [ ] **Animation Telemetry** — Record and reproduce animations
- [ ] **AI Enhancement** — Smart HTML cleanup via OpenRouter

---

## 🛠 Tech Stack

| Technology | Version | Purpose |
|------------|---------|---------|
| [WXT](https://wxt.dev) | 0.20 | Extension framework |
| [TypeScript](https://typescriptlang.org) | 5.7 | Type safety |
| [React](https://react.dev) | 19 | UI components |
| [Tailwind CSS](https://tailwindcss.com) | 4.0 | Styling |
| [Framer Motion](https://motion.dev) | 11 | Animations |
| [JSZip](https://stuk.github.io/jszip/) | 3.10 | Asset bundling |

---

## 📁 Project Structure

```
Ninja-Snatch/
├── entrypoints/           # WXT entry points
│   ├── popup/             # Extension popup
│   │   ├── App.tsx        # Main React component
│   │   ├── main.tsx       # Entry point
│   │   └── index.html     # HTML shell
│   ├── content.tsx        # Content script (Visual Sniper)
│   └── background.ts      # Service worker
├── components/            # React components
│   ├── NinjaPanel.tsx     # Control panel
│   ├── ElementHighlighter.tsx
│   └── ui/Toast.tsx
├── types/                 # TypeScript definitions
│   ├── styles.ts          # ComputedTruth interfaces
│   ├── animation.ts       # Telemetry types
│   └── assets.ts          # Asset management
├── constants/             # Configuration
│   ├── cssProperties.ts   # Style → Tailwind mapping
│   └── cleanup.ts         # Extension selectors
├── public/                # Static assets (icons)
├── reference/             # V1 code for reference
└── wxt.config.ts          # WXT configuration
```

---

## 🗺 Roadmap

### Phase 1 ✅ Foundation (Complete)

- WXT + React + TypeScript setup
- Shadow DOM content script
- Visual Sniper with element highlighting
- Popup UI with mode selection

### Phase 2 🔜 Asset Manager

- JSZip integration
- Background script asset fetching
- ZIP bundle generation
- Path rewriting

### Phase 3 📝 Computed Truth

- StyleHydrator module
- `getComputedStyle()` extraction
- `data-truth` attribute injection
- AI prompt optimization

### Phase 4 🎬 Animation Telemetry

- MotionSampler module
- `requestAnimationFrame` recording
- Easing detection
- Framer Motion code generation

### Phase 5 🤖 AI Integration

- OpenRouter API connection
- Multi-model support (GPT-4o, Claude, Gemini)
- Smart HTML cleanup
- Tailwind class generation

---

## 📜 Scripts

```bash
npm run dev          # Start dev server with HMR
npm run build        # Production build for Chrome
npm run build:firefox # Production build for Firefox
npm run zip          # Create extension package
npm run typecheck    # TypeScript validation
```

---

## 📄 License

MIT © [NineZeroShine](https://github.com/ninezeroshine)

---

## 🔗 Links

- [V2 Blueprint](./V2_BLUEPRINT.md) — Technical specification
- [V1 Technical Report](./reference/v1_technical_report.md) — Legacy analysis
