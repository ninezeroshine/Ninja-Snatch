# 🥷 Ninja Snatch v2.0

> **Pixel-Perfect, Offline-First** — Chrome Extension для извлечения HTML/CSS с веб-сайтов

[![Version](https://img.shields.io/badge/version-2.0.0--beta-blue)](package.json)
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
| Нет ZIP экспорта | JSZip с полными ассетами |

### Новая Архитектура

```
┌────────────────────────────────────────────────┐
│              WXT (Build System)                 │
├────────────────────────────────────────────────┤
│  Content Script    │  Background    │  Popup   │
│  ┌──────────────┐  │  ┌──────────┐  │  ┌─────┐ │
│  │ Shadow DOM   │  │  │ CORS     │  │  │React│ │
│  │ NinjaPanel   │  │  │ Bypass   │  │  │ 19  │ │
│  │ StyleExtract │  │  │ Download │  │  │     │ │
│  └──────────────┘  │  └──────────┘  │  └─────┘ │
└────────────────────────────────────────────────┘
```

---

## 📦 Установка для разработчика

### Требования

- **Node.js 18+** — [скачать](https://nodejs.org/)
- **Git** — [скачать](https://git-scm.com/)
- Браузер Chrome или Edge

### Шаг 1: Клонирование репозитория

```bash
git clone https://github.com/ninezeroshine/Ninja-Snatch.git
cd Ninja-Snatch
```

### Шаг 2: Установка зависимостей

```bash
npm install
```

### Шаг 3: Сборка расширения

```bash
npm run build
```

После успешной сборки расширение будет в папке `.output/chrome-mv3/`

### Шаг 4: Загрузка в Chrome

1. Откройте `chrome://extensions/` в браузере
2. Включите **Режим разработчика** (переключатель справа вверху)
3. Нажмите **Загрузить распакованное расширение**
4. Выберите папку `.output/chrome-mv3` в директории проекта
5. Готово! Иконка 🥷 появится в панели расширений

### Режим разработки (с HMR)

Для разработки с автоматической перезагрузкой:

```bash
npm run dev
```

Расширение будет автоматически обновляться при изменении кода.

---

## 🎯 Features

### Phase 1 ✅ Foundation

- [x] **Visual Sniper** — Click to select any element
- [x] **Element Highlighter** — Real-time hover preview
- [x] **Shadow DOM Isolation** — UI protected from host page styles
- [x] **Premium UI** — Framer Motion animations, gradient buttons
- [x] **Mode Selection** — Clean / Styled / Smart Extract
- [x] **Copy/Download Toggle** — Choose output action

### Phase 2 ✅ Asset Manager

- [x] **Full Page Capture** — Download entire page as ZIP
- [x] **Asset Bundling** — Images, fonts, videos in one archive
- [x] **Font Path Resolution** — Correct @font-face URL handling
- [x] **Gradient Text Support** — webkit-prefixed CSS properties
- [x] **Responsive CSS** — @media queries extracted
- [x] **MIME Validation** — Reject invalid asset responses

### Planned (Phase 3+)

- [ ] **Computed Truth** — `data-truth` attributes for AI
- [ ] **Tailwind Mapping** — CSS → Tailwind class conversion
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
│   └── background.ts      # Service worker (CORS bypass)
├── components/            # React components
│   ├── NinjaPanel.tsx     # Control panel
│   ├── ElementHighlighter.tsx
│   └── ui/Toast.tsx
├── modules/               # Core logic
│   ├── AssetScanner.ts    # Find assets in DOM
│   ├── ZipBuilder.ts      # ZIP archive builder
│   ├── StyleExtractor.ts  # Computed styles
│   └── StylesheetExtractor.ts # CSSOM rules
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

### Phase 2 ✅ Asset Manager (Complete)

- JSZip integration for offline archives
- Background script asset fetching with CORS bypass
- ZIP bundle generation with path rewriting
- StyleExtractor and StylesheetExtractor modules
- Support for fonts, images, videos, CSS

### Phase 3 🔜 Computed Truth (Next)

- StyleHydrator module
- `data-truth` attribute injection
- Tailwind class mapping
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
- [Roadmap](./ROADMAP.md) — Development plan
- [V1 Technical Report](./reference/v1_technical_report.md) — Legacy analysis
