# 🚀 NINJA SNATCH V2.0: Технический Blueprint

> **Дата создания:** 2025-12-25  
> **Статус:** Планирование  
> **Ветка разработки:** `feature/v2-wxt-migration`

---

## 📋 Содержание

1. [Предисловие: Почему V2.0](#1-предисловие-почему-v20)
2. [Утверждённый Стек](#2-утверждённый-стек)
3. [Модуль 1: Computed Truth Injection](#3-модуль-1-computed-truth-injection)
4. [Модуль 2: Digital Telemetry](#4-модуль-2-digital-telemetry)
5. [Модуль 3: Asset Downloader](#5-модуль-3-asset-downloader)
6. [Техническая Оценка и Комментарии](#6-техническая-оценка-и-комментарии)
7. [Roadmap Реализации](#7-roadmap-реализации)
8. [Риски и Митигации](#8-риски-и-митигации)

---

## 1. Предисловие: Почему V2.0

### Текущие Ограничения v10.0

Проект Ninja Snatch v10.0 достиг **технологического потолка** текущей архитектуры:

| Ограничение | Влияние |
|-------------|---------|
| Vanilla JS без модульной системы | Невозможно подключить NPM-пакеты (JSZip, etc.) |
| Отсутствие типизации | Сложность поддержки ~4200 строк кода |
| HTML-as-is в AI prompt | Избыточное потребление токенов, галлюцинации модели |
| Только URL ссылки на ассеты | Копии "умирают" при удалении оригиналов |
| CSS Animation API | Не покрывает JS-анимации (GSAP, Framer Motion) |

### Цель V2.0

> **Детерминизм**: Перестать надеяться, что AI "поймёт" контекст. Давать ему точные числа.

- **Стиль** = `getComputedStyle()` → `data-truth` атрибут
- **Анимация** = `requestAnimationFrame` лог → JSON телеметрия
- **Ассеты** = Локальный ZIP-архив

---

## 2. Утверждённый Стек

### 2.1 Core Framework: WXT (Web Extension Tools)

```
┌─────────────────────────────────────────────────────────────┐
│                         WXT                                  │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │   Vite      │  │  TypeScript │  │  Auto-imports       │  │
│  │   (Build)   │  │  (Strict)   │  │  (Components, APIs) │  │
│  └─────────────┘  └─────────────┘  └─────────────────────┘  │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │   HMR       │  │  NPM        │  │  Cross-browser      │  │
│  │   (Dev)     │  │  (JSZip!)   │  │  (Chrome/Firefox)   │  │
│  └─────────────┘  └─────────────┘  └─────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

**Почему WXT, а не Plasmo:**

| Критерий | WXT | Plasmo |
|----------|-----|--------|
| NPM пакеты | ✅ Полная поддержка | ✅ Полная поддержка |
| HMR | ✅ Vite-based | ✅ Parcel-based |
| TypeScript | ✅ Native | ✅ Native |
| Документация | ✅ Отличная | ⚠️ Средняя |
| Community | ✅ Активное | ✅ Активное |
| Bundle Size | ✅ Меньше | ⚠️ Больше |

**Вердикт:** WXT предпочтительнее из-за Vite (быстрее сборка) и лучшей документации.

---

### 2.2 Language: TypeScript 5.7+ (Strict Mode)

```typescript
// tsconfig.json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true
  }
}
```

**Критические типы для проекта:**

```typescript
// types/styles.ts
interface ComputedTruth {
  layout: {
    display: string;
    flexDirection?: string;
    justifyContent?: string;
    alignItems?: string;
    gap?: string;
    position?: string;
  };
  box: {
    width: string;
    height: string;
    padding: string;
    margin: string;
  };
  decor: {
    background?: string;
    borderRadius?: string;
    boxShadow?: string;
    opacity?: string;
  };
  typography: {
    fontFamily?: string;
    fontSize?: string;
    fontWeight?: string;
    lineHeight?: string;
    color?: string;
  };
}

// types/animation.ts
interface AnimationFrame {
  time: number;
  transform?: string;
  opacity?: number;
  backgroundColor?: string;
  color?: string;
}

interface AnimationTelemetry {
  elementSelector: string;
  triggerType: 'hover' | 'scroll' | 'load' | 'click';
  totalDuration: number;
  frames: AnimationFrame[];
}
```

---

### 2.3 UI Panel: React 19 + Tailwind CSS v4

**Архитектура Shadow DOM изоляции:**

```
┌─────────────────────────────────────────────────────────────┐
│                    Сайт-донор (Host Page)                    │
│  ┌─────────────────────────────────────────────────────────┐│
│  │ * { margin: 0 !important; }  ← Агрессивный CSS reset    ││
│  │ .btn { display: none !important; }                       ││
│  └─────────────────────────────────────────────────────────┘│
│                                                              │
│  ┌─ Shadow DOM Boundary ───────────────────────────────────┐│
│  │ ┌─────────────────────────────────────────────────────┐ ││
│  │ │           Ninja Snatch Panel (React 19)              │ ││
│  │ │   ┌─────────┐ ┌─────────┐ ┌─────────────────────┐   │ ││
│  │ │   │ Button  │ │ Toggle  │ │ Element Info        │   │ ││
│  │ │   │ (Works!)│ │ (Works!)│ │ (Isolated styles)   │   │ ││
│  │ │   └─────────┘ └─────────┘ └─────────────────────┘   │ ││
│  │ └─────────────────────────────────────────────────────┘ ││
│  └─────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────┘
```

**Реализация в WXT:**

```typescript
// entrypoints/content/index.tsx
import { createRoot } from 'react-dom/client';
import { NinjaPanel } from '@/components/NinjaPanel';

export default defineContentScript({
  matches: ['<all_urls>'],
  cssInjectionMode: 'ui',
  
  async main(ctx) {
    const ui = await createShadowRootUi(ctx, {
      name: 'ninja-snatch-panel',
      position: 'inline',
      anchor: 'body',
      onMount: (container) => {
        const root = createRoot(container);
        root.render(<NinjaPanel />);
        return root;
      },
      onRemove: (root) => {
        root?.unmount();
      },
    });
    
    ui.mount();
  },
});
```

---

### 2.4 AI Backend: Multi-Model Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    AI Pipeline                               │
│                                                              │
│  ┌─────────────────┐      ┌─────────────────────────────┐   │
│  │  GPT-5.2 Codex  │      │   Gemini 3 Pro              │   │
│  │  (Логика)       │      │   (Контекст)                │   │
│  │                 │      │                             │   │
│  │  • Транспайлинг │      │  • Понимание структуры      │   │
│  │  • data-truth   │      │  • Анализ телеметрии        │   │
│  │    → Tailwind   │      │  • Framer Motion генерация  │   │
│  └────────┬────────┘      └──────────────┬──────────────┘   │
│           │                              │                   │
│           └──────────────┬───────────────┘                   │
│                          ▼                                   │
│              ┌─────────────────────┐                        │
│              │   OpenRouter API    │                        │
│              │   (Unified Gateway) │                        │
│              └─────────────────────┘                        │
└─────────────────────────────────────────────────────────────┘
```

**Примечание:** GPT-5.2 Codex и Gemini 3 Pro — модели конца 2025 года.

---

## 3. Модуль 1: Computed Truth Injection

### Концепция

> Вместо отправки сырого HTML с классами `.wf-section-xyz`, мы инжектируем **вычисленные значения** в `data-truth` атрибут.

### Алгоритм StyleHydrator

```typescript
// src/modules/StyleHydrator.ts

interface TruthData {
  display?: string;
  flexDir?: string;
  justify?: string;
  align?: string;
  gap?: string;
  w?: string;
  h?: string;
  maxW?: string;
  pad?: string;
  margin?: string;
  bg?: string;
  radius?: string;
  shadow?: string;
  opacity?: string;
  font?: string;
  size?: string;
  weight?: string;
  lh?: string;
  color?: string;
}

// Фильтр "генетического кода" дизайна
const TRUTH_PROPERTIES = {
  // Layout
  display: 'display',
  flexDirection: 'flexDir',
  justifyContent: 'justify',
  alignItems: 'align',
  gap: 'gap',
  position: 'pos',
  
  // Box Model
  width: 'w',
  height: 'h',
  maxWidth: 'maxW',
  padding: 'pad',
  margin: 'margin',
  
  // Decoration
  background: 'bg',
  backgroundColor: 'bg',
  borderRadius: 'radius',
  boxShadow: 'shadow',
  opacity: 'opacity',
  cursor: 'cursor',
  
  // Typography
  fontFamily: 'font',
  fontSize: 'size',
  fontWeight: 'weight',
  lineHeight: 'lh',
  color: 'color',
};

export function hydrateElement(element: Element): void {
  const computed = window.getComputedStyle(element);
  const truth: string[] = [];
  
  for (const [cssProperty, shorthand] of Object.entries(TRUTH_PROPERTIES)) {
    const value = computed.getPropertyValue(cssProperty);
    
    // Фильтрация дефолтных значений
    if (value && !isDefaultValue(cssProperty, value)) {
      truth.push(`${shorthand}:${normalizeValue(value)}`);
    }
  }
  
  if (truth.length > 0) {
    element.setAttribute('data-truth', truth.join('; '));
  }
}

export function hydrateTree(root: Element): void {
  // Рекурсивный проход
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT);
  
  let node: Element | null = walker.currentNode as Element;
  while (node) {
    hydrateElement(node);
    node = walker.nextNode() as Element | null;
  }
}
```

### Пример Трансформации

**До (исходный HTML):**
```html
<div class="wf-section-hero-xyz css-module__hash-a1b2c3">
  <h1 class="heading-primary wf-font-bold">Welcome</h1>
</div>
```

**После (с data-truth):**
```html
<div 
  data-truth="display:flex; flexDir:column; justify:center; align:center; gap:24px; w:100%; maxW:1200px; pad:80px 40px; bg:#0a0a0a"
>
  <h1 data-truth="font:'Inter'; size:64px; weight:700; lh:1.1; color:#ffffff">
    Welcome
  </h1>
</div>
```

### AI Prompt Template

```
Ты — детерминированный компилятор. Твоя задача — транспиляция HTML в React + Tailwind.

ПРАВИЛА:
1. ИГНОРИРУЙ все className в исходном коде
2. СМОТРИ ТОЛЬКО в атрибут data-truth
3. КОНВЕРТИРУЙ значения в Tailwind классы:
   - gap:24px → gap-6
   - maxW:1200px → max-w-7xl
   - pad:80px 40px → py-20 px-10
   - bg:#0a0a0a → bg-[#0a0a0a]
4. УПРОЩАЙ структуру HTML если есть избыточные div-обёртки
5. НЕ ПРИДУМЫВАЙ стили, которых нет в data-truth

ВХОДНЫЕ ДАННЫЕ:
{html_with_data_truth}

ВЫХОДНОЙ ФОРМАТ:
```tsx
export function Component() {
  return (
    // Tailwind классы из data-truth
  );
}
```
```

---

## 4. Модуль 2: Digital Telemetry

### Концепция

> Анимация — это изменение чисел во времени. Мы записываем эти числа через `requestAnimationFrame` и передаём AI математическую модель.

### Алгоритм MotionSampler

```typescript
// src/modules/MotionSampler.ts

interface AnimationFrame {
  time: number;           // ms от начала записи
  x: number;              // translateX
  y: number;              // translateY
  scale: number;          // scale
  rotation: number;       // rotate (degrees)
  opacity: number;        // opacity
  backgroundColor?: string;
}

interface TelemetryData {
  elementSelector: string;
  triggerType: 'hover' | 'scroll' | 'load' | 'click';
  totalDuration: number;
  easing: string;         // Детектированный easing
  frames: AnimationFrame[];
}

export class MotionSampler {
  private frames: AnimationFrame[] = [];
  private startTime: number = 0;
  private element: Element;
  private isRecording: boolean = false;
  
  constructor(element: Element) {
    this.element = element;
  }
  
  startRecording(): void {
    this.frames = [];
    this.startTime = performance.now();
    this.isRecording = true;
    this.captureFrame();
  }
  
  stopRecording(): TelemetryData {
    this.isRecording = false;
    
    return {
      elementSelector: this.getSelector(this.element),
      triggerType: this.detectTriggerType(),
      totalDuration: this.frames[this.frames.length - 1]?.time || 0,
      easing: this.detectEasing(),
      frames: this.optimizeFrames(this.frames),
    };
  }
  
  private captureFrame(): void {
    if (!this.isRecording) return;
    
    const computed = window.getComputedStyle(this.element);
    const transform = computed.transform;
    const matrix = this.parseMatrix(transform);
    
    this.frames.push({
      time: Math.round(performance.now() - this.startTime),
      x: matrix.translateX,
      y: matrix.translateY,
      scale: matrix.scale,
      rotation: matrix.rotation,
      opacity: parseFloat(computed.opacity),
      backgroundColor: computed.backgroundColor,
    });
    
    requestAnimationFrame(() => this.captureFrame());
  }
  
  private parseMatrix(transform: string): {
    translateX: number;
    translateY: number;
    scale: number;
    rotation: number;
  } {
    if (transform === 'none') {
      return { translateX: 0, translateY: 0, scale: 1, rotation: 0 };
    }
    
    // Parse matrix() or matrix3d()
    const values = transform.match(/matrix.*\(([^)]+)\)/)?.[1]
      .split(',')
      .map(Number) || [];
    
    if (values.length === 6) {
      // 2D matrix
      return {
        translateX: values[4],
        translateY: values[5],
        scale: Math.sqrt(values[0] * values[0] + values[1] * values[1]),
        rotation: Math.atan2(values[1], values[0]) * (180 / Math.PI),
      };
    }
    
    // 3D matrix - simplified extraction
    return {
      translateX: values[12] || 0,
      translateY: values[13] || 0,
      scale: values[0] || 1,
      rotation: 0,
    };
  }
  
  private optimizeFrames(frames: AnimationFrame[]): AnimationFrame[] {
    // Удаляем дублирующиеся кадры (без изменений)
    return frames.filter((frame, index) => {
      if (index === 0) return true;
      const prev = frames[index - 1];
      return (
        frame.x !== prev.x ||
        frame.y !== prev.y ||
        frame.scale !== prev.scale ||
        frame.opacity !== prev.opacity
      );
    });
  }
  
  private detectEasing(): string {
    // Анализ кривой движения для определения easing
    const velocities = this.calculateVelocities();
    
    if (this.hasOvershoot(velocities)) return 'spring';
    if (this.isLinear(velocities)) return 'linear';
    if (this.hasSlowStart(velocities)) return 'ease-in';
    if (this.hasSlowEnd(velocities)) return 'ease-out';
    
    return 'ease-in-out';
  }
}
```

### Пример Телеметрии

**Записанные данные:**
```json
{
  "elementSelector": ".hero-card",
  "triggerType": "scroll",
  "totalDuration": 600,
  "easing": "spring",
  "frames": [
    { "time": 0,   "y": 50,  "opacity": 0, "scale": 0.95 },
    { "time": 100, "y": 30,  "opacity": 0.4, "scale": 0.97 },
    { "time": 200, "y": 10,  "opacity": 0.7, "scale": 0.99 },
    { "time": 300, "y": -5,  "opacity": 0.9, "scale": 1.01 },
    { "time": 400, "y": 2,   "opacity": 0.95, "scale": 1.005 },
    { "time": 500, "y": -1,  "opacity": 0.98, "scale": 1.002 },
    { "time": 600, "y": 0,   "opacity": 1.0, "scale": 1.0 }
  ]
}
```

### AI Prompt для анимаций

```
Проанализируй эту телеметрию движения элемента:

{telemetry_json}

НАБЛЮДЕНИЯ:
- Элемент движется по Y от 50 до 0 с overshoott (значения -5, 2, -1)
- Opacity: 0 → 1
- Scale: 0.95 → 1.0
- Easing похож на spring (пружину)

ЗАДАЧА:
Напиши компонент React с Framer Motion, который математически воспроизводит эту анимацию.
Используй useInView для trigger: scroll.
Настрой spring параметры (stiffness, damping) для точного воспроизведения overshoot.

ФОРМАТ ОТВЕТА:
```tsx
import { motion, useInView } from 'framer-motion';

export function AnimatedCard({ children }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });
  
  return (
    <motion.div
      ref={ref}
      initial={{ y: 50, opacity: 0, scale: 0.95 }}
      animate={isInView ? { y: 0, opacity: 1, scale: 1 } : {}}
      transition={{ 
        type: 'spring',
        stiffness: ?,  // Рассчитай
        damping: ?,    // Рассчитай
      }}
    >
      {children}
    </motion.div>
  );
}
```
```

---

## 5. Модуль 3: Asset Downloader

### Концепция

> Локализация всех внешних ресурсов в ZIP-архив для offline-использования.

### Архитектура

```
┌─────────────────────────────────────────────────────────────┐
│                   Content Script                             │
│  ┌─────────────────────────────────────────────────────────┐│
│  │ AssetScanner                                             ││
│  │ • Поиск <img>, <video>, <source>                        ││
│  │ • Парсинг CSS url()                                      ││
│  │ • Поиск @font-face src                                   ││
│  │ • Сбор SVG inline/external                               ││
│  └───────────────────────┬─────────────────────────────────┘│
└──────────────────────────┼──────────────────────────────────┘
                           │ chrome.runtime.sendMessage()
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                   Background Script                          │
│  ┌─────────────────────────────────────────────────────────┐│
│  │ AssetFetcher                                             ││
│  │ • fetch() с подменой headers (Referer, User-Agent)       ││
│  │ • Обход CORS через background context                    ││
│  │ • Retry logic для failed downloads                       ││
│  └───────────────────────┬─────────────────────────────────┘│
│  ┌─────────────────────────────────────────────────────────┐│
│  │ ZipBuilder (JSZip)                                       ││
│  │ • Создание структуры: index.html, style.css, /assets    ││
│  │ • Path rewriting: external → ./assets/                   ││
│  │ • Финальный blob → download                              ││
│  └─────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────┘
```

### Реализация AssetManager

```typescript
// src/modules/AssetManager.ts

import JSZip from 'jszip';

interface Asset {
  originalUrl: string;
  localPath: string;
  type: 'image' | 'font' | 'video' | 'css' | 'svg';
  blob?: Blob;
}

export class AssetManager {
  private assets: Map<string, Asset> = new Map();
  private zip: JSZip;
  
  constructor() {
    this.zip = new JSZip();
  }
  
  async scanDocument(doc: Document): Promise<Asset[]> {
    const assets: Asset[] = [];
    
    // Images
    doc.querySelectorAll('img[src], source[src]').forEach((el) => {
      const src = el.getAttribute('src');
      if (src && this.isExternal(src)) {
        assets.push(this.createAsset(src, 'image'));
      }
    });
    
    // Background images in inline styles
    doc.querySelectorAll('[style*="url("]').forEach((el) => {
      const urls = this.extractUrlsFromStyle(el.getAttribute('style') || '');
      urls.forEach(url => {
        if (this.isExternal(url)) {
          assets.push(this.createAsset(url, 'image'));
        }
      });
    });
    
    // CSS files
    doc.querySelectorAll('link[rel="stylesheet"]').forEach((el) => {
      const href = el.getAttribute('href');
      if (href && this.isExternal(href)) {
        assets.push(this.createAsset(href, 'css'));
      }
    });
    
    // Fonts from @font-face (requires parsing stylesheets)
    await this.scanStylesheets(doc, assets);
    
    return assets;
  }
  
  async downloadAssets(assets: Asset[]): Promise<void> {
    // Отправляем запросы в background script для обхода CORS
    const downloadPromises = assets.map(async (asset) => {
      try {
        const blob = await chrome.runtime.sendMessage({
          type: 'FETCH_ASSET',
          url: asset.originalUrl,
          referer: window.location.origin,
        });
        
        asset.blob = blob;
        this.assets.set(asset.originalUrl, asset);
      } catch (error) {
        console.warn(`Failed to download: ${asset.originalUrl}`, error);
      }
    });
    
    await Promise.allSettled(downloadPromises);
  }
  
  async createZipBundle(html: string, css: string): Promise<Blob> {
    // Rewrite paths in HTML and CSS
    let processedHtml = html;
    let processedCss = css;
    
    this.assets.forEach((asset) => {
      if (asset.blob) {
        // Add to zip
        this.zip.file(asset.localPath, asset.blob);
        
        // Rewrite references
        processedHtml = processedHtml.replaceAll(
          asset.originalUrl,
          `./${asset.localPath}`
        );
        processedCss = processedCss.replaceAll(
          asset.originalUrl,
          `./${asset.localPath}`
        );
      }
    });
    
    // Add main files
    this.zip.file('index.html', processedHtml);
    this.zip.file('style.css', processedCss);
    
    return this.zip.generateAsync({ type: 'blob' });
  }
  
  private createAsset(url: string, type: Asset['type']): Asset {
    const filename = this.generateSafeFilename(url);
    return {
      originalUrl: url,
      localPath: `assets/${filename}`,
      type,
    };
  }
  
  private generateSafeFilename(url: string): string {
    const urlObj = new URL(url, window.location.origin);
    const pathname = urlObj.pathname;
    const ext = pathname.split('.').pop() || 'bin';
    const hash = this.hashString(url).slice(0, 8);
    const name = pathname.split('/').pop()?.split('.')[0] || 'asset';
    
    return `${this.sanitize(name)}_${hash}.${ext}`;
  }
  
  private hashString(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(16);
  }
}
```

### Background Script для обхода CORS

```typescript
// entrypoints/background.ts

export default defineBackground(() => {
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'FETCH_ASSET') {
      fetchAsset(message.url, message.referer)
        .then(sendResponse)
        .catch((error) => sendResponse({ error: error.message }));
      
      return true; // Async response
    }
  });
});

async function fetchAsset(url: string, referer: string): Promise<Blob> {
  const response = await fetch(url, {
    headers: {
      'Referer': referer,
      'User-Agent': navigator.userAgent,
      'Accept': '*/*',
    },
    mode: 'cors',
    credentials: 'omit',
  });
  
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }
  
  return response.blob();
}
```

---

## 6. Техническая Оценка и Комментарии

### 6.1 Оценка Предложенного Стека

| Компонент | Оценка | Комментарий |
|-----------|--------|-------------|
| WXT | ✅ Отлично | Идеальный выбор для NPM-интеграции и HMR |
| TypeScript strict | ✅ Отлично | Критично для сложной логики парсинга |
| React 19 + Shadow DOM | ✅ Отлично | Изоляция от стилей сайта-донора |
| Tailwind v4 | ✅ Отлично | Lightning CSS, быстрая компиляция |
| JSZip | ✅ Отлично | Проверенная библиотека, ~100KB |

### 6.2 Оценка Модулей

| Модуль | Сложность | Ценность | Приоритет |
|--------|-----------|----------|-----------|
| Asset Downloader | Средняя | 🔥 Критическая | P0 |
| Computed Truth | Средняя | 🔥 Высокая | P1 |
| Motion Telemetry | Высокая | ⚡ Высокая | P2 |

### 6.3 Потенциальные Проблемы и Решения

#### Проблема 1: CORS при скачивании ассетов
**Риск:** Некоторые CDN блокируют запросы без правильного Referer/Origin.  
**Решение:** Background script с подменой заголовков. Fallback: Base64 inline для мелких ассетов.

#### Проблема 2: Размер ZIP-архива
**Риск:** Сайты с большим количеством изображений → огромный ZIP.  
**Решение:** 
- Опциональное сжатие изображений (canvas → webp)
- Лимит размера с предупреждением
- Lazy download (только видимые ассеты)

#### Проблема 3: Сложные анимации
**Риск:** GSAP Timeline с несколькими элементами, синхронизация.  
**Решение:** Начать с single-element анимаций. Timeline — в v2.1.

#### Проблема 4: Computed styles в responsive
**Риск:** `width: 960px` вместо `width: 50%`.  
**Решение:** Добавить viewport context в prompt. AI должен понимать, что 960px при 1920px viewport = 50%.

### 6.4 Что сохранить из V1.0

| Компонент V1.0 | Сохранить? | Причина |
|----------------|------------|---------|
| `collectAllCSS()` | ⚠️ Частично | Логика сбора полезна, переписать на TS |
| `Web Animations API` | ✅ Да | Для CSS-анимаций работает отлично |
| `Framework Detection` | ✅ Да | Tailwind/Webflow детекция полезна |
| `config.js` patterns | ✅ Да | Паттерны для cleanup универсальны |
| Visual Sniper UI | 🔄 Переписать | Логика та же, на React + Shadow DOM |

---

## 7. Roadmap Реализации

### Этап 1: Миграция и База (1-2 недели)

```
[ ] Создать ветку feature/v2-wxt-migration
[ ] Инициализировать WXT + React + TypeScript
    - npx wxt@latest init ninja-snatch-v2 --template react
[ ] Настроить tsconfig.json (strict: true)
[ ] Настроить Tailwind CSS v4
[ ] Перенести Visual Sniper в Shadow DOM
    - Создать NinjaPanel компонент
    - Реализовать element highlighting
[ ] Настроить CI/CD для тестирования
```

### Этап 2: Asset Downloader (1 неделя) — P0

```
[ ] Реализовать AssetScanner
    - Сканирование img, video, source
    - Парсинг CSS url()
    - Сбор @font-face
[ ] Реализовать background fetcher
    - Подмена headers для CORS
    - Retry logic
[ ] Интегрировать JSZip
[ ] Реализовать path rewriting
[ ] Тестирование на 5+ сайтах
```

### Этап 3: Computed Truth (2 недели) — P1

```
[ ] Реализовать StyleHydrator
    - getComputedStyle traversal
    - Smart filtering (только "генетический код")
    - data-truth injection
[ ] Создать AI prompt templates
[ ] Интегрировать с OpenRouter API
[ ] UI для настройки AI (model selection, API key)
[ ] Тестирование конвертации на 10+ элементах
```

### Этап 4: Motion Telemetry (2-3 недели) — P2

```
[ ] Реализовать MotionSampler
    - requestAnimationFrame recording
    - Matrix parsing
    - Easing detection
[ ] UI для записи анимаций
    - Start/Stop recording
    - Trigger type selection
[ ] AI prompts для Framer Motion генерации
[ ] Тестирование на hover/scroll анимациях
```

### Этап 5: Polish & Release (1 неделя)

```
[ ] Полное тестирование
[ ] Документация
[ ] Chrome Web Store submission
[ ] Merge в main
```

---

## 8. Риски и Митигации

| Риск | Вероятность | Влияние | Митигация |
|------|-------------|---------|-----------|
| WXT breaking changes | Низкая | Высокое | Зафиксировать версию, следить за changelog |
| AI галлюцинации | Средняя | Среднее | Детерминированные prompts, валидация output |
| CORS блокировки | Высокая | Среднее | Background fetch, fallback to inline |
| Большой scope | Высокая | Высокое | Строгая приоритизация, MVP first |
| Время разработки | Средняя | Среднее | 6-8 недель реалистичная оценка |

---

## 9. Заключение

Предложенная архитектура V2.0 решает ключевые ограничения текущей версии:

1. **NPM-пакеты** → JSZip для offline-бандлов
2. **Типизация** → TypeScript strict для надёжности
3. **AI точность** → data-truth вместо сырого HTML
4. **Анимации** → Телеметрия вместо надежды на "понимание"
5. **Ассеты** → Локальный ZIP вместо внешних ссылок

**Оценка времени:** 6-8 недель при полной занятости одного разработчика.

**Рекомендация:** Начать с Этапа 1-2 (WXT + Asset Downloader) — это даёт максимальную ценность при минимальных рисках.

---

*Документ создан: 2025-12-25*  
*Версия: 1.0*  
*Автор: Ninja Snatch Development Team*
