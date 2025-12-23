# 🥷 Ninja Snatch — Технический Обзор

> **Версия в manifest.json:** 9.0  
> **Платформа:** Chrome Extension (Manifest V3)  
> **Назначение:** Извлечение HTML/CSS с веб-сайтов

---

## 🛠 Технологический Стек

### Платформа
- **Chrome Extension Manifest V3** — современный стандарт расширений
- **Service Worker** (`background.js`) — фоновый процесс для downloads
- **Content Scripts** — инжекция кода в веб-страницы через `chrome.scripting.executeScript()`

### Используемые Chrome APIs
```javascript
chrome.tabs           // Получение активной вкладки
chrome.scripting      // Программная инжекция скриптов и CSS
chrome.downloads      // Скачивание файлов
chrome.storage.local  // Сохранение настроек между сессиями
chrome.runtime        // Messaging между popup/content/background
```

### Внешние CDN (подключаются динамически)
```javascript
// Из styleInjector.js:
motionDevCdn: 'https://cdn.jsdelivr.net/npm/motion@11.13.5/+esm'  // Motion.dev для анимаций
tailwindCdn: 'https://cdn.tailwindcss.com'                        // Tailwind (при обнаружении)
```

### Тестирование
- **Jest 29.7.0** + **jest-environment-jsdom 29.7.0**
- Тесты в `tests/styleInjector.test.js` (250 строк)

---

## 🏗 Архитектура

### Файловая структура с реальным размером

| Файл | Строк кода | Назначение |
|------|------------|------------|
| `styleInjector.js` | **1040** | Ядро — сбор CSS, обработка HTML, генерация анимаций |
| `popup.js` | **280** | UI логика popup меню |
| `popup.css` | **241** | Стили popup |
| `config.js` | **252** | Централизованная конфигурация паттернов |
| `selector.js` | **209** | Visual Sniper — интерактивный выбор элементов |
| `utils.js` | **84** | Вспомогательные функции |
| `background.js` | **58** | Service worker для downloads |
| `selector.css` | **50** | Стили overlay для Visual Sniper |
| `popup.html` | **66** | HTML интерфейса |
| `manifest.json` | **30** | Конфигурация расширения |
| **Итого** | **~2,300** | — |

### Модульная структура (src/)
```
src/
├── index.js           # Entry point с re-exports
├── core/              # Ядро StyleInjector
├── modules/
│   ├── css/           # CSS collection/matching
│   ├── html/          # HTML processing
│   └── animation/     # Animation generation
└── utils/             # Утилиты
```

---

## 📊 Data Flow (из кода)

```
┌─────────────────────────────────────────────────────────────────┐
│                        POPUP.JS                                 │
│                                                                 │
│  chrome.storage.local.get(['outputMode', 'extractMode'])        │
│                              │                                  │
│  Режимы: copy/download  +  clean/styled/llm                     │
└─────────────────────────────┬───────────────────────────────────┘
                              │
                              ▼
    chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ['config.js', 'styleInjector.js', 'selector.js']
    })
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                 STYLEINJECTOR.JS — Методы                       │
│                                                                 │
│  init()                                                         │
│  └─ pageOrigin = window.location.origin                         │
│  └─ collectAllCSS()                                             │
│       ├─ document.styleSheets → processRule()                   │
│       └─ collectShadowCSS(document.body)                        │
│                                                                 │
│  _prepareExport(element)                                        │
│  └─ clone = element.cloneNode(true)                             │
│  └─ cloneShadowContent(clone, element)                          │
│  └─ cleanHTML(clone)                                            │
│  └─ cleanupAttributes(clone)                                    │
│  └─ fixAnimationStates(clone)                                   │
│  └─ fixHTMLUrls(clone)                                          │
│  └─ collectUsedClasses(clone)                                   │
│  └─ return { clone, cssData }                                   │
│                                                                 │
│  cssData содержит:                                              │
│  ├─ externalLinks: collectExternalLinks()                       │
│  ├─ googleFonts: collectGoogleFonts()                           │
│  ├─ fontFaces: allFontFaces                                     │
│  ├─ variables: generateCSSVariables()                           │
│  ├─ keyframes: allKeyframes                                     │
│  ├─ matchedCSS: getMatchedCSSRules(usedClasses, clone)          │
│  ├─ revealAnimations: generateRevealAnimationsCSS()             │
│  └─ hasTailwind: hasTailwind()                                  │
│                                                                 │
│  injectStyles(element) → HTML со <style> блоком                 │
│  createStyledDocument(element, title) → Полный HTML документ    │
│  createLLMExport(element) → Компактный вывод для AI             │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                     ВЫВОД                                       │
│                                                                 │
│  copy: navigator.clipboard.writeText(content)                   │
│  download: chrome.runtime.sendMessage({ action: 'download' })   │
│            → background.js → chrome.downloads.download()        │
└─────────────────────────────────────────────────────────────────┘
```

---

## ✨ Реализованные Возможности (из кода)

### 1. Visual Sniper (`selector.js`)

**Класс `SniperSelector`:**
```javascript
class SniperSelector {
    constructor() {
        this.overlay = document.createElement('div');
        this.overlay.className = 'snatcher-overlay';
        // ...
    }
    
    onMouseMove(e)    // Отслеживание hover
    updatePosition()  // Обновление overlay
    onClick(e)        // Захват элемента
    snatch(el)        // Основная логика извлечения
    showToast(msg)    // Уведомления
    destroy()         // Очистка
}
```

**Режимы работы (из `snatch()`):**
- `clean` — сырой HTML с prettify
- `styled` — HTML + все CSS стили
- `llm` — компактный вывод для AI

### 2. CSS Collection (`styleInjector.js`)

**processRule()** — обработка CSS правил:
```javascript
// Поддерживаемые типы:
CSSRule.STYLE_RULE      // Обычные стили
CSSRule.KEYFRAMES_RULE  // @keyframes анимации
CSSRule.FONT_FACE_RULE  // @font-face шрифты
CSSRule.MEDIA_RULE      // @media queries
CSSRule.IMPORT_RULE     // @import
```

**collectShadowCSS()** — рекурсивный обход Shadow DOM:
```javascript
// Собирает стили из:
el.shadowRoot.querySelectorAll('style')    // <style> теги
el.shadowRoot.adoptedStyleSheets           // Adopted stylesheets
```

**getMatchedCSSRules()** — нативный матчинг через `element.matches()`:
```javascript
// Вместо regex парсинга селекторов
for (const el of elements) {
    if (el.matches && el.matches(baseSelector)) {
        return true;
    }
}
```

### 3. HTML Processing

**cleanHTML()** — удаление мусора:
```javascript
// Удаляет по паттернам из config.js:
PATTERNS.extensionSelectors  // Grammarly, LastPass, etc.
PATTERNS.removeScripts       // Analytics, GTM, Facebook pixel
// Также: tracking pixels, empty iframes, noscript
```

**fixHTMLUrls()** — конвертация URL:
```javascript
// Обрабатывает атрибуты:
[src], [href], [srcset]
// Относительные → абсолютные через pageOrigin
```

**fixAnimationStates()** — очистка inline стилей:
```javascript
// Удаляет:
will-change, transform-style: preserve-3d
// Очищает пустые стили
```

### 4. Animation Generation

**generateRevealAnimationsCSS()** — CSS fallback:
```javascript
@keyframes snatch-fade-up {
    from { opacity: 0; transform: translateY(20px); }
    to { opacity: 1; transform: translateY(0); }
}
@keyframes snatch-marquee {
    from { transform: translateX(0); }
    to { transform: translateX(-50%); }
}
// Применяется к: section, .hero, article, .grid > *
```

**generateAnimationScript()** — Motion.dev инъекция:
```javascript
// Динамический import Motion.dev
const { animate, inView } = await import('motion CDN');

// Reveal скрытых элементов
document.querySelectorAll('[style*="opacity:0"]').forEach(el => {
    animate(el, { opacity: 1 }, { duration: 0.6 });
});

// Counter анимация через inView
inView(container, () => { /* animate counter */ });

// Marquee детекция и запуск
```

**generateCursorScript()** — кастомные курсоры:
```javascript
// Селекторы для поиска курсоров:
'.custom-cursor', '.cursor-dot', '.cursor-follower',
'[data-cursor]', '[data-cursor-follower]'

// Fallback: структурная детекция
// position: fixed, pointer-events: none, z-index > 9000, size < 80px
```

### 5. LLM Export (`createLLMExport()`)

**Что удаляется:**
```javascript
const noisePatterns = [
    /^transition/, /^duration-/, /^ease-/, /^delay-/,
    /^animate-/, /^hover:/, /^focus:/, /^active:/,
    /^group-hover:/, /^motion-/, /^will-change/,
    /^cursor-/, /^select-/, /^pointer-events/,
    /^outline-/, /^ring-/, /^sr-only/, /^scroll-/, /^snap-/
];
```

**CSS Module хэши очищаются:**
```javascript
// _metadataGrid_payqq_223 → metadataGrid
const match = cls.match(/^_+(.+?)_[a-z0-9]{4,}_\d+$/i);
```

**Дедупликация повторяющихся элементов** (marquee pattern)

**Упрощение структуры** — разворот одиночных вложенных `<div>`

---

## 🔧 Конфигурация (`config.js`)

### External CSS Patterns
```javascript
externalCSSPatterns: [
    'website-files.com',  // Webflow
    'webflow.com',
    'framer.com',
    'squarespace.com', 'wix.com', 'shopify.com', 'cargo.site',
    'assets.', 'cdn.', 'static.',
    '.css'
]
```

### Preserve Script Patterns
```javascript
preserveScriptPatterns: [
    'webflow', 'gsap', 'framer', 'motion', 'anime', 'lottie',
    'scroll', 'animation', 'locomotive', 'aos',
    'swiper', 'splide', 'glide', 'barba',
    'jquery', 'w-', 'Webflow'
]
```

### Remove Script Patterns
```javascript
removeScriptPatterns: [
    'chrome-extension://', 'moz-extension://',
    'analytics', 'gtag', 'gtm', 'google-analytics', 'googletagmanager',
    'facebook', 'fbevents', 'pixel', 'twitter', 'linkedin', 'tiktok',
    'hotjar', 'mixpanel', 'segment', 'amplitude', 'heap', 'fullstory',
    'clarity', 'mouseflow', 'luckyorange', 'crazyegg',
    'crisp', 'intercom', 'zendesk', 'hubspot', 'drift', 'freshdesk'
]
```

### Extension Selectors (для удаления)
```javascript
extensionSelectors: [
    '[id="moat-moat"]', '[class^="float-moat"]',
    '[id*="grammarly"]', '[class*="grammarly"]',
    '[data-grammarly-shadow-root]', 'grammarly-extension',
    '[id*="lastpass"]', '[data-dashlane"]', '[id*="1password"]',
    '[class*="bitwarden"]', '[data-protonpass]',
    'next-route-announcer',
    '[src^="chrome-extension://"]', '[src^="moz-extension://"]'
]
```

### Keep Data Attributes (сохраняются для анимаций)
```javascript
keepDataAttributes: [
    'data-w-id', 'data-wf-',           // Webflow
    'data-animation', 'data-aos',       // AOS
    'data-scroll', 'data-scroll-speed', // Locomotive
    'data-target', 'data-count',        // Counters
    'data-src', 'data-srcset',          // Lazy loading
    'data-swiper-', 'data-splide-'      // Sliders
]
```

---

## 🎨 UI Реализация

### Popup (`popup.html` + `popup.css`)

**Цветовая схема (CSS Variables):**
```css
--primary: #6366f1;      /* Индиго */
--primary-hover: #4f46e5;
--accent: #10b981;       /* Эмеральд */
--warning: #f59e0b;      /* Янтарь */
--bg: #0f172a;           /* Тёмный */
--card-bg: rgba(30, 41, 59, 0.7);  /* Glassmorphism */
--text: #f8fafc;
--text-muted: #94a3b8;
--border: rgba(255, 255, 255, 0.1);
```

**Элементы интерфейса:**
- Mode Toggle: Скопировать / Скачать
- Extraction Mode: Чистый HTML / Со стилями / Для LLM
- Секция Iframe (для aura.build)
- Visual Sniper кнопка
- Всю страницу кнопка
- Status область

### Visual Sniper Overlay (`selector.css`)
```css
.snatcher-overlay {
    z-index: 2147483647;  /* Максимальный */
    background: rgba(99, 102, 241, 0.2);
    border: 2px solid #6366f1;
}
.snatcher-toast {
    /* Spring анимация */
    transition: transform 0.4s cubic-bezier(0.18, 0.89, 0.32, 1.28);
}
```

---

## 🔑 Public API (`StyleInjector`)

```javascript
// Инициализация (вызывается автоматически)
StyleInjector.init()

// Основные методы экспорта
StyleInjector.injectStyles(element)              // → HTML со <style>
StyleInjector.createStyledDocument(element, title)  // → Полный документ
StyleInjector.createLLMExport(element)           // → Компактный для AI

// Утилиты
StyleInjector.prettifyHTML(html)
StyleInjector.collectAllCSS()
StyleInjector.collectUsedClasses(element)
StyleInjector.collectExternalLinks()
StyleInjector.collectGoogleFonts()
StyleInjector.generateCSSVariables()
StyleInjector.cleanHTML(clone)
StyleInjector.fixAnimationStates(clone)
StyleInjector.fixHTMLUrls(clone)
StyleInjector.cleanupAttributes(clone)
StyleInjector.fixRelativeURLs(cssText)
StyleInjector.generateRevealAnimations(element)

// Свойства (legacy)
StyleInjector.version          // '9.0.0'
StyleInjector.pageOrigin
StyleInjector.allKeyframes
StyleInjector.allFontFaces
StyleInjector.allCSSRules
StyleInjector.cssVariables
StyleInjector.externalStylesheets
```

---

## 🧪 Тесты (`tests/styleInjector.test.js`)

**Покрытые функции:**
```javascript
describe('Module Loading')        // Проверка загрузки
describe('fixRelativeURLs')       // ../path → absolute
describe('collectUsedClasses')    // Сбор классов из DOM
describe('cleanHTML')             // Удаление grammarly и др.
describe('fixAnimationStates')    // Сброс opacity/transform
describe('prettifyHTML')          // Форматирование
describe('generateCSSVariables')  // :root переменные
describe('collectGoogleFonts')    // @import url()
describe('generateRevealAnimations') // @keyframes
describe('collectExternalLinks')  // External stylesheets
```

---

## 🔐 Permissions (`manifest.json`)

```json
"permissions": [
    "activeTab",   // Доступ к активной вкладке
    "scripting",   // Инжекция скриптов
    "downloads",   // Скачивание файлов
    "storage"      // Сохранение настроек
]
```

---

## 🚧 Технические ограничения (из кода)

1. **Cross-origin stylesheets** — при ошибке доступа к `sheet.cssRules` сохраняется только ссылка `sheet.href`

2. **Closed Shadow DOM** — `collectShadowCSS()` работает только с открытыми shadow roots

3. **JS-зависимые анимации** — Motion.dev CDN подгружается динамически, требует интернет

4. **Restricted pages** — не работает на:
   ```javascript
   url.startsWith('chrome://') ||
   url.startsWith('https://chrome.google.com/webstore') ||
   url.startsWith('edge://')
   ```

---

*Документ создан: 2025-12-23 на основе анализа исходного кода*
