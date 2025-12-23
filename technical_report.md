# Технический Отчёт: Ninja-Snatch v9.0

> **Дата:** 2025-12-23  
> **Версия:** 9.0  
> **Платформа:** Chrome Extension (Manifest V3)

---

## 1. Обзор Проекта

**Ninja Snatch** — Chrome расширение для извлечения HTML/CSS с веб-сайтов. Позволяет скопировать или скачать фрагменты страниц с сохранением стилей и анимаций.

### Технологический стек
- **Chrome Extension Manifest V3**
- **Vanilla JavaScript (ES6+)** — без фреймворков и сборщиков
- **Chrome APIs:** `tabs`, `scripting`, `downloads`, `storage`
- **Jest + jsdom** — тестирование

### Метрики кодовой базы

| Файл | Строк кода | Назначение |
|------|------------|------------|
| `styleInjector.js` | 1040 | Ядро — сбор CSS, обработка HTML, генерация анимаций |
| `popup.js` | 280 | UI логика popup меню |
| `config.js` | 252 | Централизованная конфигурация паттернов |
| `popup.css` | 241 | Стили popup |
| `selector.js` | 209 | Visual Sniper — интерактивный выбор элементов |
| `utils.js` | 84 | Вспомогательные функции |
| `background.js` | 58 | Service worker для downloads |
| `selector.css` | 50 | Стили overlay |
| **Итого** | ~2,300 | — |

---

## 2. Архитектура

### Структура проекта
```
Ninja-Snatch/
├── manifest.json           # Manifest V3 конфигурация
├── popup.html/js/css       # UI расширения
├── styleInjector.js        # Ядро извлечения
├── selector.js             # Visual Sniper
├── config.js               # Паттерны и настройки
├── background.js           # Service worker
├── utils.js                # Утилиты
├── tests/                  # Jest тесты
└── src/                    # Модульная структура (в разработке)
```

### Data Flow
```
popup.js → chrome.scripting.executeScript()
              ↓
         [config.js + styleInjector.js + selector.js]
              ↓
         styleInjector._prepareExport(element)
         ├── collectAllCSS()
         ├── cleanHTML()
         ├── fixHTMLUrls()
         ├── getMatchedCSSRules()
         └── generateRevealAnimationsCSS()
              ↓
         [Clipboard / Download via background.js]
```

### Принцип работы
1. Пользователь нажимает кнопку в popup
2. `popup.js` инжектирует скрипты на страницу через `chrome.scripting`
3. `styleInjector.js` собирает все CSS правила со страницы
4. При выборе элемента — матчатся только релевантные стили через `element.matches()`
5. Результат копируется в буфер или скачивается через `background.js`

---

## 3. Реализованный Функционал

### Visual Sniper (`selector.js`)
- Overlay с подсветкой элемента при hover
- Метка с именем тега и ID
- Три режима: `clean` / `styled` / `llm`
- Toast-уведомления с spring-анимацией
- Выход по Escape

### CSS Collection (`styleInjector.js`)
- **Типы правил:** `STYLE_RULE`, `KEYFRAMES_RULE`, `FONT_FACE_RULE`, `MEDIA_RULE`, `IMPORT_RULE`
- **Shadow DOM:** рекурсивный обход через `collectShadowCSS()`
- **Native matching:** `element.matches()` вместо regex парсинга селекторов
- **URL fixing:** конвертация относительных путей в абсолютные

### HTML Processing
- `cleanHTML()` — удаление браузерных расширений (Grammarly, LastPass) и трекеров
- `fixAnimationStates()` — очистка `will-change`, `transform-style`
- `cleanupAttributes()` — удаление framework-специфичных data-атрибутов
- `prettifyHTML()` — форматирование вывода

### Animation Generation
- **CSS fallback:** `@keyframes snatch-fade-up`, `snatch-marquee`
- **Motion.dev инъекция:** reveal скрытых элементов, counter анимации
- **Custom cursor:** детекция и инициализация

### Compact Export (ранее "LLM Export")
> ⚠️ **Ограничение:** Работает корректно только для Tailwind/Webflow. Не универсален.

- Удаление utility-классов (transition-, hover:, animate-)
- Очистка CSS-module хэшей
- Дедупликация повторяющихся элементов
- Упрощение вложенных `<div>` структур

---

## 4. Конфигурация (`config.js`)

### External CSS Patterns
```javascript
['website-files.com', 'webflow.com', 'framer.com', 
 'squarespace.com', 'wix.com', 'shopify.com', 
 'assets.', 'cdn.', 'static.', '.css']
```

### Preserve Script Patterns
```javascript
['webflow', 'gsap', 'framer', 'motion', 'anime', 
 'lottie', 'locomotive', 'aos', 'swiper', 'jquery']
```

### Remove Script Patterns
```javascript
['analytics', 'gtag', 'facebook', 'pixel', 
 'hotjar', 'intercom', 'crisp', 'zendesk']
```

### Extension Selectors (для удаления)
```javascript
['[class*="grammarly"]', '[id*="lastpass"]', 
 '[data-dashlane]', 'next-route-announcer']
```

---

## 5. Тестирование

### Текущее покрытие
- **styleInjector.test.js** (250 строк) — покрыты основные методы

### Протестированные функции
- `fixRelativeURLs()` — конвертация URL
- `collectUsedClasses()` — сбор классов
- `cleanHTML()` — удаление расширений
- `fixAnimationStates()` — сброс анимаций
- `prettifyHTML()` — форматирование
- `generateCSSVariables()` — :root переменные
- `collectGoogleFonts()` — @import url()
- `collectExternalLinks()` — external stylesheets

### Непокрытые области
- `popup.js` — UI логика
- `selector.js` — Visual Sniper
- Интеграционные тесты

---

## 6. Идентифицированные Проблемы

### Архитектурные
| Проблема | Риск | Приоритет |
|----------|------|-----------|
| `styleInjector.js` — 1040 строк в одном файле | Средний | Низкий |
| Глобальные переменные (`window.StyleInjector`) | Коллизия с сайтом | Средний |
| Инжекция 3 файлов последовательно | Усложняет отладку | Низкий |

### Функциональные
| Проблема | Описание |
|----------|----------|
| Compact Export | Работает только для Tailwind/Webflow классов |
| Cross-origin CSS | При ошибке доступа сохраняется только ссылка |
| Closed Shadow DOM | Недоступен по дизайну браузера |
| JS-зависимые анимации | Motion.dev CDN требует интернет |

### Ограничения платформы
- Не работает на `chrome://`, `chrome.google.com/webstore`, `edge://`
- React hydration не восстанавливается
- GSAP/Framer Motion требуют оригинальный runtime

---

## 7. Рекомендации по Улучшению

### Высокий приоритет
1. **Namespace для глобалов** — заменить `window.StyleInjector` на `window.__NINJA_SNATCH__.StyleInjector`
2. **Добавить тесты** для `selector.js` и интеграции
3. **Честное название** — переименовать "LLM Export" в "Compact Export" или "Tailwind Cleaner"

### Средний приоритет
4. **JSDoc комментарии** — документировать входящие/исходящие типы
5. **Error logging** — добавить debug режим с verbose логами
6. **Guard improvements** — проверка на существующие глобальные переменные перед инжекцией

### Низкий приоритет (при масштабировании)
7. **Модуляризация** — разбиение `styleInjector.js` на модули (css-parser, html-cleaner, animation-gen)
8. **Cross-browser** — подготовка к Firefox/Safari (если потребуется)

---

## 8. Roadmap

### Фаза 3: Стабильность
- [ ] Namespace `window.__NINJA_SNATCH__`
- [ ] Тесты для `selector.js`
- [ ] Переименование LLM → Compact Export
- [ ] Debug mode toggle

### Фаза 4: Улучшения (опционально)
- [ ] Fonts base64 encoding (offline mode)
- [ ] Asset Downloader (ZIP с картинками)
- [ ] Расширенная детекция CSS-in-JS

---

## 9. Permissions

```json
{
  "permissions": [
    "activeTab",   // Доступ к активной вкладке
    "scripting",   // Инжекция скриптов
    "downloads",   // Скачивание файлов
    "storage"      // Сохранение настроек
  ]
}
```

---

## 10. Заключение

Ninja Snatch v9.0 — рабочий инструмент с типичным техническим долгом. Основной функционал реализован и работает. Приоритетные улучшения:
1. Изоляция глобальных переменных
2. Расширение тестового покрытия
3. Честное название функций

---

*Документ обновлён: 2025-12-23*
