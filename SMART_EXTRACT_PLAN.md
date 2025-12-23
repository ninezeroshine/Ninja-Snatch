# 🚀 Smart Extraction Pipeline — Финальный План Реализации

> **Версия:** 10.0  
> **Дата:** 2025-12-23  
> **Проект:** Ninja Snatch Chrome Extension  
> **Цель:** НОВЫЙ режим "Smart Extract ✨" для генерации чистого React/Tailwind кода

---

## 📋 Содержание

1. [Общая Концепция](#общая-концепция)
2. [Технический Стек](#технический-стек)
3. [Архитектура Pipeline](#архитектура-pipeline)
4. [Детали Реализации](#детали-реализации)
5. [UI Изменения](#ui-изменения)
6. [План Тестирования](#план-тестирования)
7. [Порядок Реализации](#порядок-реализации)

---

## 🎯 Общая Концепция

### Что это?

**Smart Extract** — это НОВЫЙ режим извлечения (дополнительная кнопка), который:
- Анализирует структуру DOM
- Находит повторяющиеся паттерны (карточки, списки)
- Конвертирует стили в Tailwind классы
- Опционально улучшает код через AI

### Чем отличается от существующих режимов?

| Режим | Что делает | Для кого |
|-------|------------|----------|
| **Чистый HTML** | Сырой HTML без стилей | Разработчики, нужна только структура |
| **Со стилями** | HTML + все CSS (1:1 копия) | Нужна точная визуальная копия |
| **Compact** | Очищенный HTML для AI | Работа с LLM |
| **Smart Extract ✨** | Чистый React + Tailwind | Нужен редактируемый код |

### Ключевой принцип

```
Существующие режимы НЕ МЕНЯЮТСЯ.
Smart Extract — это опциональная новая кнопка.
Анимации (GSAP, Framer Motion) сохраняются как есть.
```

---

## 🛠 Технический Стек

### Core (без зависимостей)

| Инструмент | Назначение | Источник |
|------------|------------|----------|
| `getComputedStyle()` | Получение финальных CSS значений | [MDN/JavaScript.info](https://javascript.info/styles-and-classes#computed-styles-getcomputedstyle) |
| Fuzzy DOM Matching | Сравнение структур элементов | Собственная реализация |
| Tailwind Token Map | Computed px → Tailwind классы | Статический JSON |

### AI Integration

| Параметр | Значение |
|----------|----------|
| **Provider** | OpenRouter |
| **API Endpoint** | `https://openrouter.ai/api/v1/chat/completions` |
| **Модель** | `z-ai/glm-4.7` |
| **Аутентификация** | Bearer token (API ключ вводится в расширении) |
| **Хранение ключа** | `chrome.storage.local` (зашифровано браузером) |

### OpenRouter API — Формат запроса

```javascript
const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${apiKey}`,
    'Content-Type': 'application/json',
    'HTTP-Referer': 'https://ninja-snatch.extension',
    'X-Title': 'Ninja Snatch'
  },
  body: JSON.stringify({
    model: 'z-ai/glm-4.7',
    messages: [
      { role: 'user', content: prompt }
    ],
    max_tokens: 2000
  })
});

const data = await response.json();
const result = data.choices[0].message.content;
```

---

## 🏗 Архитектура Pipeline

```
┌──────────────────────────────────────────────────────────────────┐
│                      ЛЮБОЙ САЙТ НА ВХОДЕ                         │
│    (Webflow, Framer, React, Vue, Bootstrap, Legacy CSS...)       │
└──────────────────────────────────────────────────────────────────┘
                               │
                               ▼
┌──────────────────────────────────────────────────────────────────┐
│  STAGE 1: FRAMEWORK DETECTOR                                      │
│  Файл: src/smartExtract/frameworkDetector.js                     │
├──────────────────────────────────────────────────────────────────┤
│  • Определяет CSS систему (Tailwind/Bootstrap/Modules/Custom)   │
│  • Определяет платформу (Webflow/Framer/Custom)                  │
│  • Выбирает оптимальную стратегию очистки                        │
│                                                                   │
│  Output: { cssSystem, platform, confidence }                      │
└──────────────────────────────────────────────────────────────────┘
                               │
                               ▼
┌──────────────────────────────────────────────────────────────────┐
│  STAGE 2: PATTERN RECOGNIZER (КРИТИЧЕСКОЕ ЯДРО)                  │
│  Файл: src/smartExtract/patternRecognizer.js                     │
├──────────────────────────────────────────────────────────────────┤
│  • Fuzzy DOM Matching (порог 70%)                                 │
│  • Находит повторяющиеся элементы → кандидаты для .map()         │
│  • Определяет границы компонентов                                 │
│                                                                   │
│  Алгоритм сравнения:                                              │
│  - Tag match: 30%                                                 │
│  - Structure match: 40%                                           │
│  - Static classes match: 20%                                      │
│  - Attribute keys match: 10%                                      │
│                                                                   │
│  Output: [{ elements: [...], type: 'repeating' | 'single' }]     │
└──────────────────────────────────────────────────────────────────┘
                               │
                               ▼
┌──────────────────────────────────────────────────────────────────┐
│  STAGE 3: STYLE NORMALIZER                                        │
│  Файлы: src/smartExtract/styleNormalizer.js, tailwindMap.js      │
├──────────────────────────────────────────────────────────────────┤
│  • getComputedStyle() → Design Tokens                             │
│  • Design Tokens → Tailwind классы                                │
│  • Округление к ближайшему значению сетки                         │
│                                                                   │
│  Примеры:                                                         │
│  - margin-top: 17px → mt-4 (округление к 16px)                   │
│  - display: flex; gap: 16px → flex gap-4                         │
│  - color: rgb(239, 68, 68) → text-red-500                        │
│                                                                   │
│  Output: { className: 'flex gap-4 mt-4 text-red-500', ... }      │
└──────────────────────────────────────────────────────────────────┘
                               │
                               ▼
┌──────────────────────────────────────────────────────────────────┐
│  STAGE 4: AI ENHANCER (ОПЦИОНАЛЬНО)                              │
│  Файл: src/smartExtract/aiEnhancer.js                            │
├──────────────────────────────────────────────────────────────────┤
│  • Только если включён + есть API ключ                           │
│  • Получает УЖЕ ОЧИЩЕННЫЙ код (500-2000 токенов)                 │
│  • Задачи:                                                        │
│    - Семантические имена (div → <BuyButton>)                      │
│    - Пропы для динамических данных                                │
│    - TypeScript интерфейсы                                        │
│                                                                   │
│  Промпт:                                                          │
│  "Улучши этот React компонент:                                    │
│   1. Дай семантические имена на основе контента                   │
│   2. Замени hardcoded данные на пропы                             │
│   3. Добавь TypeScript интерфейс"                                 │
│                                                                   │
│  Если API ключа нет → этап пропускается                          │
└──────────────────────────────────────────────────────────────────┘
                               │
                               ▼
┌──────────────────────────────────────────────────────────────────┐
│                      ФИНАЛЬНЫЙ OUTPUT                             │
│  Формат: React JSX + Tailwind (по умолчанию)                     │
│  Альтернатива: HTML + Tailwind                                    │
└──────────────────────────────────────────────────────────────────┘
```

---

## 📁 Детали Реализации

### Структура новых файлов

```
src/smartExtract/
├── index.js              # Главный экспорт
├── frameworkDetector.js  # Stage 1
├── patternRecognizer.js  # Stage 2 (КРИТИЧНО)
├── styleNormalizer.js    # Stage 3
├── tailwindMap.js        # Mapping computed → tailwind
├── aiEnhancer.js         # Stage 4 (optional)
└── utils.js              # Fuzzy matching helpers
```

### Stage 1: Framework Detector

```javascript
// src/smartExtract/frameworkDetector.js

export function detectFramework() {
  return {
    platform: detectPlatform(),
    cssSystem: detectCSSSystem(),
    confidence: calculateConfidence()
  };
}

function detectCSSSystem() {
  // Tailwind: tw-, text-, bg-, flex, grid patterns
  const tailwindPatterns = /\b(tw-|text-|bg-|flex|grid|gap-|p-|m-)\b/;
  const bodyClasses = document.body.className;
  if (tailwindPatterns.test(bodyClasses)) return 'tailwind';
  
  // Bootstrap: btn, col-, row, container
  const bootstrapPatterns = /\b(btn|col-|row|container|d-flex)\b/;
  if (bootstrapPatterns.test(bodyClasses)) return 'bootstrap';
  
  // CSS Modules: _className_hash_123
  const modulesPattern = /_\w+_[a-z0-9]{5,}_\d+/i;
  if (modulesPattern.test(bodyClasses)) return 'css-modules';
  
  return 'custom';
}

function detectPlatform() {
  if (window.Webflow) return 'webflow';
  if (document.querySelector('[data-framer-component-type]')) return 'framer';
  if (window.__NEXT_DATA__) return 'nextjs';
  return 'custom';
}
```

### Stage 2: Pattern Recognizer (КРИТИЧНО)

```javascript
// src/smartExtract/patternRecognizer.js

const SIMILARITY_THRESHOLD = 70;

export function calculateSimilarity(el1, el2) {
  let score = 0;
  
  // Tag match (30%)
  if (el1.tagName === el2.tagName) score += 30;
  
  // Structure match (40%) — сравниваем дерево потомков
  const struct1 = getStructureSignature(el1);
  const struct2 = getStructureSignature(el2);
  const structureMatch = compareSignatures(struct1, struct2);
  score += structureMatch * 40 / 100;
  
  // Static classes match (20%) — игнорируем динамические классы
  const classes1 = getStaticClasses(el1);
  const classes2 = getStaticClasses(el2);
  const classOverlap = calculateOverlap(classes1, classes2);
  score += classOverlap * 20;
  
  // Attribute keys match (10%)
  const attrs1 = getAttributeKeys(el1);
  const attrs2 = getAttributeKeys(el2);
  const attrOverlap = calculateOverlap(attrs1, attrs2);
  score += attrOverlap * 10;
  
  return score;
}

function getStructureSignature(el) {
  // Рекурсивно строим "подпись" структуры
  const children = [...el.children];
  if (children.length === 0) return el.tagName;
  return el.tagName + '>' + children.map(getStructureSignature).join(',');
}

function getStaticClasses(el) {
  // Фильтруем динамические классы (хэши, состояния)
  const dynamicPatterns = [
    /_[a-z0-9]{5,}_\d+$/i,  // CSS Modules
    /^(hover|focus|active):/,  // Tailwind states
    /^is-/,  // State classes
  ];
  
  return [...el.classList].filter(cls => 
    !dynamicPatterns.some(p => p.test(cls))
  );
}

export function findRepeatingPatterns(parent) {
  const children = [...parent.children];
  if (children.length < 2) return [];
  
  const groups = [];
  let currentGroup = [children[0]];
  
  for (let i = 1; i < children.length; i++) {
    const similarity = calculateSimilarity(children[i], currentGroup[0]);
    
    if (similarity >= SIMILARITY_THRESHOLD) {
      currentGroup.push(children[i]);
    } else {
      if (currentGroup.length >= 2) {
        groups.push({ elements: currentGroup, type: 'repeating' });
      }
      currentGroup = [children[i]];
    }
  }
  
  if (currentGroup.length >= 2) {
    groups.push({ elements: currentGroup, type: 'repeating' });
  }
  
  return groups;
}
```

### Stage 3: Style Normalizer

```javascript
// src/smartExtract/tailwindMap.js

export const TAILWIND_SPACING = {
  0: '0', 1: 'px', 2: '0.5', 4: '1', 6: '1.5', 8: '2', 
  10: '2.5', 12: '3', 14: '3.5', 16: '4', 20: '5', 24: '6',
  28: '7', 32: '8', 36: '9', 40: '10', 44: '11', 48: '12'
};

export const TAILWIND_COLORS = {
  '#ef4444': 'red-500',
  '#f97316': 'orange-500',
  '#eab308': 'yellow-500',
  '#22c55e': 'green-500',
  '#3b82f6': 'blue-500',
  '#6366f1': 'indigo-500',
  '#a855f7': 'purple-500',
  '#000000': 'black',
  '#ffffff': 'white',
  // ... полный mapping
};

// src/smartExtract/styleNormalizer.js

import { TAILWIND_SPACING, TAILWIND_COLORS } from './tailwindMap.js';

export function computedToTailwind(element) {
  const styles = getComputedStyle(element);
  const classes = [];
  
  // Display
  if (styles.display === 'flex') classes.push('flex');
  if (styles.display === 'grid') classes.push('grid');
  if (styles.display === 'none') classes.push('hidden');
  
  // Flex direction
  if (styles.flexDirection === 'column') classes.push('flex-col');
  
  // Gap
  const gap = parseInt(styles.gap);
  if (!isNaN(gap)) classes.push(`gap-${findNearestSpacing(gap)}`);
  
  // Margin
  const mt = parseInt(styles.marginTop);
  if (!isNaN(mt) && mt > 0) classes.push(`mt-${findNearestSpacing(mt)}`);
  
  // Padding
  const p = parseInt(styles.padding);
  if (!isNaN(p) && p > 0) classes.push(`p-${findNearestSpacing(p)}`);
  
  // Colors
  const textColor = rgbToHex(styles.color);
  if (TAILWIND_COLORS[textColor]) {
    classes.push(`text-${TAILWIND_COLORS[textColor]}`);
  }
  
  // ... остальные свойства
  
  return classes.join(' ');
}

function findNearestSpacing(px) {
  const available = Object.keys(TAILWIND_SPACING).map(Number);
  const nearest = available.reduce((a, b) => 
    Math.abs(b - px) < Math.abs(a - px) ? b : a
  );
  return TAILWIND_SPACING[nearest];
}
```

### Stage 4: AI Enhancer

```javascript
// src/smartExtract/aiEnhancer.js

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';
const MODEL = 'z-ai/glm-4.7';

const ENHANCE_PROMPT = `Улучши этот React компонент:
1. Дай семантические имена компонентам на основе их содержимого
2. Замени hardcoded текст и данные на пропы
3. Добавь TypeScript интерфейс Props
4. Сохрани все CSS классы без изменений

Код:
\`\`\`jsx
{CODE}
\`\`\`

Верни ТОЛЬКО улучшенный код, без объяснений.`;

export async function enhanceWithAI(code, apiKey) {
  if (!apiKey) {
    console.log('[SmartExtract] No API key, skipping AI enhancement');
    return code;
  }
  
  try {
    const response = await fetch(OPENROUTER_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://ninja-snatch.extension',
        'X-Title': 'Ninja Snatch'
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          { role: 'user', content: ENHANCE_PROMPT.replace('{CODE}', code) }
        ],
        max_tokens: 2000
      })
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'API request failed');
    }
    
    const data = await response.json();
    return extractCodeFromResponse(data.choices[0].message.content);
  } catch (error) {
    console.error('[SmartExtract] AI enhancement failed:', error);
    return code; // Fallback to original
  }
}

function extractCodeFromResponse(text) {
  // Извлекаем код из markdown code blocks
  const match = text.match(/```(?:jsx?|tsx?)?\n([\s\S]*?)\n```/);
  return match ? match[1].trim() : text.trim();
}
```

---

## 🎨 UI Изменения

### popup.html — Новый режим

```html
<!-- Добавить в секцию Extract Mode -->
<label class="radio-label">
  <input type="radio" name="extractMode" value="smart">
  <span class="radio-indicator"></span>
  Smart Extract ✨
</label>

<!-- Новая секция настроек (показывается когда smart выбран) -->
<div id="smartSettings" class="card hidden">
  <h4>Smart Extract Settings</h4>
  
  <!-- Target Format -->
  <div class="setting-row">
    <label for="targetFormat">Output Format</label>
    <select id="targetFormat" class="select-field">
      <option value="react-tailwind">React + Tailwind</option>
      <option value="html-tailwind">HTML + Tailwind</option>
    </select>
  </div>
  
  <!-- AI Enhancement Toggle -->
  <div class="setting-row">
    <label class="checkbox-label">
      <input type="checkbox" id="enableAI">
      <span>AI Enhancement</span>
    </label>
  </div>
  
  <!-- API Key Input (показывается когда AI включён) -->
  <div id="apiKeySection" class="setting-row hidden">
    <label for="apiKey">OpenRouter API Key</label>
    <input type="password" id="apiKey" class="input-field" 
           placeholder="sk-or-v1-...">
    <small class="hint">Ключ сохраняется локально</small>
  </div>
</div>
```

### popup.js — Логика

```javascript
// Показать/скрыть настройки Smart Extract
const extractModeInputs = document.querySelectorAll('input[name="extractMode"]');
const smartSettings = document.getElementById('smartSettings');

extractModeInputs.forEach(input => {
  input.addEventListener('change', () => {
    smartSettings.classList.toggle('hidden', input.value !== 'smart');
  });
});

// Показать/скрыть поле API ключа
const enableAI = document.getElementById('enableAI');
const apiKeySection = document.getElementById('apiKeySection');

enableAI.addEventListener('change', () => {
  apiKeySection.classList.toggle('hidden', !enableAI.checked);
});

// Сохранение API ключа
const apiKeyInput = document.getElementById('apiKey');
apiKeyInput.addEventListener('change', () => {
  chrome.storage.local.set({ openrouterApiKey: apiKeyInput.value });
});

// Загрузка сохранённого ключа
chrome.storage.local.get(['openrouterApiKey'], (result) => {
  if (result.openrouterApiKey) {
    apiKeyInput.value = result.openrouterApiKey;
  }
});
```

---

## 🧪 План Тестирования

### Unit Tests — Pattern Recognizer (КРИТИЧНО)

**Файл:** `tests/patternRecognizer.test.js`

```javascript
describe('PatternRecognizer', () => {
  describe('calculateSimilarity', () => {
    test('identical elements → 100%', () => {
      const html = '<div class="card"><h3>Title</h3><p>Text</p></div>';
      document.body.innerHTML = html + html;
      const cards = document.querySelectorAll('.card');
      expect(calculateSimilarity(cards[0], cards[1])).toBe(100);
    });
    
    test('same structure, different text → >90%', () => {
      document.body.innerHTML = `
        <div class="card"><h3>Title 1</h3><p>Text 1</p></div>
        <div class="card"><h3>Title 2</h3><p>Text 2</p></div>
      `;
      const cards = document.querySelectorAll('.card');
      expect(calculateSimilarity(cards[0], cards[1])).toBeGreaterThan(90);
    });
    
    test('one has badge, one doesnt → >70%', () => {
      document.body.innerHTML = `
        <div class="card"><h3>Title</h3><p>Text</p></div>
        <div class="card"><span class="badge">SALE</span><h3>Title</h3><p>Text</p></div>
      `;
      const cards = document.querySelectorAll('.card');
      expect(calculateSimilarity(cards[0], cards[1])).toBeGreaterThan(70);
    });
    
    test('completely different → <30%', () => {
      document.body.innerHTML = `
        <div class="card"><h3>Title</h3></div>
        <nav class="menu"><ul><li>Item</li></ul></nav>
      `;
      const card = document.querySelector('.card');
      const nav = document.querySelector('.menu');
      expect(calculateSimilarity(card, nav)).toBeLessThan(30);
    });
  });
  
  describe('findRepeatingPatterns', () => {
    test('simple list → 1 group', () => {
      document.body.innerHTML = `
        <ul class="list">
          <li>Item 1</li>
          <li>Item 2</li>
          <li>Item 3</li>
        </ul>
      `;
      const list = document.querySelector('.list');
      const groups = findRepeatingPatterns(list);
      expect(groups).toHaveLength(1);
      expect(groups[0].elements).toHaveLength(3);
    });
    
    test('grid of cards → 1 group', () => {
      document.body.innerHTML = `
        <div class="grid">
          <div class="card"><img><h3>Card 1</h3></div>
          <div class="card"><img><h3>Card 2</h3></div>
          <div class="card"><img><h3>Card 3</h3></div>
        </div>
      `;
      const grid = document.querySelector('.grid');
      const groups = findRepeatingPatterns(grid);
      expect(groups).toHaveLength(1);
    });
    
    test('mixed content → separate groups', () => {
      document.body.innerHTML = `
        <section>
          <div class="card"><h3>Card 1</h3></div>
          <div class="card"><h3>Card 2</h3></div>
          <p class="text">Paragraph</p>
          <nav class="menu"><ul></ul></nav>
        </section>
      `;
      const section = document.querySelector('section');
      const groups = findRepeatingPatterns(section);
      expect(groups).toHaveLength(1); // Только cards
      expect(groups[0].elements).toHaveLength(2);
    });
  });
});
```

### Unit Tests — Style Normalizer

**Файл:** `tests/styleNormalizer.test.js`

```javascript
describe('StyleNormalizer', () => {
  test('margin-top: 16px → mt-4', () => {
    // Setup element with inline style
    document.body.innerHTML = '<div id="test" style="margin-top: 16px"></div>';
    const el = document.getElementById('test');
    const classes = computedToTailwind(el);
    expect(classes).toContain('mt-4');
  });
  
  test('17px rounds to 16px → mt-4', () => {
    document.body.innerHTML = '<div id="test" style="margin-top: 17px"></div>';
    const el = document.getElementById('test');
    const classes = computedToTailwind(el);
    expect(classes).toContain('mt-4');
  });
  
  test('display: flex + gap: 16px → flex gap-4', () => {
    document.body.innerHTML = '<div id="test" style="display: flex; gap: 16px"></div>';
    const el = document.getElementById('test');
    const classes = computedToTailwind(el);
    expect(classes).toContain('flex');
    expect(classes).toContain('gap-4');
  });
});
```

### Запуск тестов

```bash
# Все тесты
npm test

# Только Pattern Recognizer
npm test -- tests/patternRecognizer.test.js

# Только Style Normalizer  
npm test -- tests/styleNormalizer.test.js
```

---

## 📅 Порядок Реализации

```
┌─────────────────────────────────────────────────────────────────┐
│  PHASE 1: Stage 2 — Pattern Recognizer (ПЕРВЫМ!)               │
│                                                                  │
│  • Это ядро системы                                              │
│  • Если он не работает — всё бесполезно                         │
│  • Fuzzy matching + tests                                        │
│  Оценка: 3-4 дня                                                 │
└─────────────────────────────────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│  PHASE 2: Stage 3 — Style Normalizer                            │
│                                                                  │
│  • getComputedStyle → Tailwind                                   │
│  • tailwindMap.js с полным маппингом                            │
│  • Округление к ближайшим значениям                              │
│  Оценка: 2-3 дня                                                 │
└─────────────────────────────────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│  PHASE 3: Stage 1 — Framework Detector                          │
│                                                                  │
│  • Детекция Tailwind/Bootstrap/Modules                           │
│  • Оптимизация маппинга (col-6 → w-1/2)                         │
│  Оценка: 1-2 дня                                                 │
└─────────────────────────────────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│  PHASE 4: Integration                                            │
│                                                                  │
│  • Сборка pipeline в index.js                                    │
│  • Интеграция в selector.js                                      │
│  • UI изменения в popup                                          │
│  Оценка: 2 дня                                                   │
└─────────────────────────────────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│  PHASE 5: Stage 4 — AI Enhancer (последним)                     │
│                                                                  │
│  • OpenRouter интеграция                                         │
│  • API key UI                                                    │
│  • Prompt engineering                                            │
│  Оценка: 1-2 дня                                                 │
└─────────────────────────────────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│  PHASE 6: End-to-End Testing                                     │
│                                                                  │
│  • Тест на реальных сайтах (Webflow, Bootstrap, React)          │
│  • Финальная полировка                                           │
│  Оценка: 1-2 дня                                                 │
└─────────────────────────────────────────────────────────────────┘

ИТОГО: 10-15 дней разработки
```

---

## ✅ Success Criteria

- [ ] Pattern Recognizer проходит все 5 тестовых сценариев
- [ ] Style Normalizer корректно маппит 90% Tailwind классов
- [ ] Framework Detector определяет тип с точностью >80%
- [ ] Smart Extract работает **без AI** (детерминистический baseline)
- [ ] С AI включенным — результат семантически улучшен
- [ ] Существующие режимы (clean/styled/compact) **НЕ СЛОМАНЫ**
- [ ] Анимации (GSAP, Framer Motion, @keyframes) сохраняются

---

*План создан: 2025-12-23*
