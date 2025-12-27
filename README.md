# 🥷 Ninja Snatch v2.0

> **Pixel-Perfect, Offline-First** — Chrome Extension для извлечения HTML/CSS с веб-сайтов

[![Version](https://img.shields.io/badge/version-2.0.0--beta-blue)](package.json)
[![WXT](https://img.shields.io/badge/WXT-0.20-green)](https://wxt.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue)](https://typescriptlang.org)
[![React](https://img.shields.io/badge/React-19-61dafb)](https://react.dev)

---

## 🚀 What's New in V2.0

V2.0 — это полная переработка расширения с новым технологическим стеком:

| Было (v1.0) | Стало (v2.0) |
|-------------|--------------|
| Vanilla JavaScript | TypeScript 5.7 (strict) |
| Manifest V3 напрямую | WXT Framework |
| DOM manipulation | React 19 + Shadow DOM |
| Нет модулей | ES Modules + NPM |
| Нет ZIP экспорта | JSZip с полными ассетами |
| Нет AI-интеграции | `data-truth` + `data-motion` атрибуты |

### Новая Архитектура

```
┌─────────────────────────────────────────────────────────────┐
│                    WXT (Build System)                        │
├─────────────────────────────────────────────────────────────┤
│  Content Script      │  Background     │  Popup             │
│  ┌────────────────┐  │  ┌───────────┐  │  ┌──────────────┐  │
│  │ Shadow DOM     │  │  │ CORS      │  │  │ React 19     │  │
│  │ NinjaPanel     │  │  │ Bypass    │  │  │ Include Truth│  │
│  │ StyleHydrator  │  │  │ Asset     │  │  │ Include Motion│ │
│  │ MotionSampler  │  │  │ Download  │  │  │ Mode Select  │  │
│  └────────────────┘  │  └───────────┘  │  └──────────────┘  │
└─────────────────────────────────────────────────────────────┘
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

### Phase 1 ✅ Foundation (Stable)

- [x] **Visual Sniper** — Click to select any element
- [x] **Element Highlighter** — Real-time hover preview
- [x] **Shadow DOM Isolation** — UI protected from host page styles
- [x] **Premium UI** — Framer Motion animations, gradient buttons
- [x] **Mode Selection** — Clean / Styled / Smart Extract
- [x] **Copy/Download Toggle** — Choose output action

### Phase 2 ✅ Asset Manager (Beta)

- [x] **Full Page Capture** — Download entire page as ZIP
- [x] **Asset Bundling** — Images, fonts, videos in one archive
- [x] **Font Path Resolution** — Correct @font-face URL handling
- [x] **Gradient Text Support** — webkit-prefixed CSS properties
- [x] **Responsive CSS** — @media queries extracted
- [x] **MIME Validation** — Reject invalid asset responses

### Phase 3 ✅ Computed Truth (Beta)

- [x] **StyleHydrator** — Extract computed styles from DOM
- [x] **`data-truth` attributes** — AI-readable style data
- [x] **Tailwind Mapping** — CSS → Tailwind-like notation
- [x] **Color Normalization** — RGB/HSL → Hex conversion
- [x] **Include Truth Toggle** — Enable/disable in UI

### Phase 4 ✅ Animation Telemetry (Beta)

- [x] **MotionSampler** — Record animations via `requestAnimationFrame`
- [x] **Matrix Parser** — Decompose `matrix()` and `matrix3d()` transforms
- [x] **Easing Detection** — Identify spring, linear, ease-in/out
- [x] **Trigger Detection** — Hover, scroll, click, focus, load
- [x] **Framer Motion Generator** — Generate ready-to-use TSX code
- [x] **`motion.json` Export** — Animation telemetry in ZIP
- [x] **Include Motion Toggle** — Enable/disable in UI

> ⚠️ **Beta Note:** Phases 2-4 are functional but may have edge cases. Animation capture works for animations active at capture time. Scroll-triggered animations need manual scrolling before capture.

### Phase 5 🔜 AI Integration (Planned)

- [ ] **OpenRouter API** — Multi-model AI connection
- [ ] **Smart HTML Cleanup** — Remove noise, simplify structure
- [ ] **Tailwind Generation** — Convert computed styles to Tailwind classes

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
│   ├── popup/             # Extension popup (React)
│   │   ├── App.tsx        # Main component with toggles
│   │   ├── main.tsx       # Entry point
│   │   └── index.html     # HTML shell
│   ├── content.tsx        # Content script (Visual Sniper)
│   └── background.ts      # Service worker (CORS bypass)
├── components/            # React components
│   ├── NinjaPanel.tsx     # Control panel in Shadow DOM
│   ├── ElementHighlighter.tsx
│   └── ui/Toast.tsx
├── modules/               # Core logic
│   ├── AssetScanner.ts    # Find assets in DOM
│   ├── ZipBuilder.ts      # ZIP archive builder
│   ├── StyleExtractor.ts  # Computed styles per element
│   ├── StylesheetExtractor.ts # CSSOM @rules
│   ├── StyleHydrator.ts   # data-truth injection
│   ├── MotionSampler.ts   # Animation recording
│   └── index.ts           # Module exports
├── utils/                 # Utility functions
│   ├── tailwindMapper.ts  # CSS → Tailwind notation
│   ├── colorNormalizer.ts # Color format conversion
│   ├── matrixParser.ts    # Transform matrix decomposition
│   ├── easingDetector.ts  # Easing/spring detection
│   ├── triggerDetector.ts # Animation trigger detection
│   └── framerMotionGenerator.ts # Code generation
├── types/                 # TypeScript definitions
│   ├── styles.ts          # ComputedTruth, TruthData
│   ├── animation.ts       # Telemetry types
│   └── assets.ts          # Asset management
├── constants/             # Configuration
│   ├── cssProperties.ts   # Property lists and defaults
│   └── cleanup.ts         # Extension selectors
├── public/                # Static assets (icons)
├── reference/             # V1 code for reference
├── wxt.config.ts          # WXT configuration
├── ROADMAP.md             # Development roadmap
└── V2_BLUEPRINT.md        # Technical specification
```

---

## 🎮 Usage

### Full Page Capture

1. Click the 🥷 extension icon
2. Enable toggles as needed:
   - **Include Truth** (🧬) — Add `data-truth` attributes with computed styles
   - **Include Motion** (🎬) — Record animations and generate `motion.json`
3. Click **📄 Вся страница** (Full Page)
4. ZIP file downloads with:
   - `index.html` — Full page with data attributes
   - `style.css` — All extracted CSS
   - `assets/` — Images, fonts, videos
   - `motion.json` — Animation telemetry (if Include Motion enabled)

### Visual Sniper

1. Click the 🥷 extension icon
2. Click **🎯 Выбор элемента** (Select Element)
3. Hover over elements to highlight
4. Click to capture
5. Use panel actions: Copy HTML, Copy CSS, Download ZIP

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

## 🐛 Known Issues (Beta)

1. **Large CSS files** — Full page capture can produce 100K+ line CSS files. This will be optimized in Phase 5.
2. **Scroll animations** — Animations triggered by scroll need manual scrolling before capture to be recorded.
3. **CSS variables** — Some Tailwind v4 CSS variables may not resolve correctly.

---

## 📄 License

MIT © [NineZeroShine](https://github.com/ninezeroshine)

---

## 🔗 Links

- [V2 Blueprint](./V2_BLUEPRINT.md) — Technical specification
- [Roadmap](./ROADMAP.md) — Development plan
- [V1 Technical Report](./reference/v1_technical_report.md) — Legacy analysis
