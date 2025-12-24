# 🥷 Ninja Snatch

> **Chrome Extension** для извлечения HTML/CSS с веб-сайтов с сохранением стилей.

![Chrome Extension](https://img.shields.io/badge/Chrome-Extension-4285F4?logo=googlechrome&logoColor=white)
![Manifest V3](https://img.shields.io/badge/Manifest-V3-green)
![Version](https://img.shields.io/badge/Version-10.0-blue)
![Vanilla JS](https://img.shields.io/badge/Vanilla-JS-F7DF1E?logo=javascript&logoColor=black)

---

## ✨ Возможности

### 🎯 Visual Sniper
Интерактивный режим выбора — наведите на любой элемент и кликните для копирования.

### 📄 Full Page Capture
Захват всей страницы со всеми стилями.

### 🎨 Smart Style Extraction
- **External CSS** — автоматический захват Webflow, Framer, и других CDN-стилей
- **Google Fonts** — сохранение подключённых шрифтов
- **CSS Variables** — поддержка переменных из `:root`
- **@keyframes** — все CSS-анимации сохраняются
- **Shadow DOM** — рекурсивный обход и сбор стилей
- **Native Matching** — точный матчинг через `element.matches()`

### 🚀 Animation Fallback
- CSS reveal-анимации (`snatch-fade-up`, `snatch-marquee`)
- Motion.dev инъекция для динамических эффектов
- Детекция и восстановление кастомных курсоров

### ✨ Smart Extract (NEW v10.0)
- **Автодетекция фреймворка** — React, Vue, Tailwind, Webflow, Framer
- **Оптимизация стилей** — замена inline-стилей на классы, очистка CSS-module хешей
- **Форматы вывода** — React + Tailwind, HTML + Tailwind
- **AI Enhancement** — улучшение кода с помощью LLM (OpenRouter API)

### 📦 Режимы экспорта
| Режим | Описание |
|-------|----------|
| **Чистый HTML** | Сырой HTML без стилей |
| **Со стилями** | HTML + все CSS в `<style>` блоке |
| **Compact** | Минифицированный вывод (Tailwind/Webflow) |
| **Smart Extract** ✨ | Умное извлечение с распознаванием паттернов |

---

## 📥 Установка

```bash
git clone https://github.com/youruser/ninja-snatch.git
```

1. Откройте `chrome://extensions/`
2. Включите **"Режим разработчика"**
3. Нажмите **"Загрузить распакованное расширение"**
4. Выберите папку `Ninja-Snatch`

---

## 🏗️ Архитектура

```
Ninja-Snatch/
├── manifest.json          # Manifest V3 конфигурация
├── popup.html/js/css      # UI расширения
├── styleInjector.js       # Ядро — сбор CSS, обработка HTML
├── smartStyleInjector.js  # Smart Extract CSS модуль
├── smartExtract.js        # Smart Extract v2 — AI pipeline
├── selector.js            # Visual Sniper
├── config.js              # Централизованные паттерны
├── background.js          # Service worker для downloads
├── utils.js               # Вспомогательные функции
└── tests/                 # Jest тесты
```

### Ключевые методы (`styleInjector.js`)

| Метод | Назначение |
|-------|-----------|
| `collectAllCSS()` | Сбор всех CSS правил со страницы |
| `collectShadowCSS()` | Рекурсивный обход Shadow DOM |
| `getMatchedCSSRules()` | Native matching через `element.matches()` |
| `cleanHTML()` | Удаление трекеров и browser extensions |
| `fixHTMLUrls()` | Конвертация относительных URL |
| `generateRevealAnimationsCSS()` | CSS fallback анимации |

---

## ⚙️ Конфигурация (`config.js`)

Расширение автоматически:
- Сохраняет настройки между сессиями (`chrome.storage.local`)
- Определяет Tailwind и подключает CDN
- Конвертирует относительные URL в абсолютные
- Удаляет трекеры (analytics, GTM, Facebook pixel)
- Удаляет browser extensions (Grammarly, LastPass)
- Сохраняет animation libraries (GSAP, Webflow.js, jQuery)

---

## 🔧 Разработка

```bash
# Установка зависимостей (для тестов)
npm install

# Запуск тестов
npm test

# После изменений — перезагрузите расширение
# chrome://extensions/ → 🔄 Update
```

### Тестирование

| Файл | Покрытие |
|------|----------|
| `styleInjector.js` | ✅ Основные методы |
| `popup.js` | ❌ Не покрыт |
| `selector.js` | ❌ Не покрыт |

---

## 🚧 Известные ограничения

| Ограничение | Описание |
|-------------|----------|
| **React Hydration** | Не восстанавливается в статическом HTML |
| **GSAP/Framer Motion** | Требуют оригинальный runtime |
| **Cross-origin CSS** | Сохраняется только ссылка при ошибке доступа |
| **Closed Shadow DOM** | Недоступен по дизайну браузера |
| **Compact Export** | Работает только для Tailwind/Webflow |

---

## 📝 Changelog

### v10.0 (2025-12-24)
- ✨ **Smart Extract** — новый режим извлечения с AI-улучшением
- 🧠 Автодетекция фреймворка (React, Vue, Tailwind, Webflow, Framer)
- 🔄 Замена inline-стилей на классы
- 🧹 Очистка CSS-module хешей
- 🤖 Опциональное AI Enhancement через OpenRouter API
- 📦 Новые форматы: React + Tailwind, HTML + Tailwind

### v9.0 (2025-12-23)
- 🆕 Scroll-trigger детекция (AOS, Locomotive, Webflow)
- 🆕 Counter animations
- 🆕 Custom cursor support
- 🆕 Shadow DOM collection
- 🆕 Native `element.matches()` для CSS matching
- 📝 Обновлена документация и системный промпт

### v7.6
- External CSS capture (Webflow CDN, Framer)
- Improved CSS matching (tags, IDs, data-*)

### v7.5
- Universal reveal animations
- Script preservation for animation libraries

---

## 📄 Лицензия

MIT © 2024

---

<div align="center">
  <strong>🥷 Ninja Snatch — Copy Anything, Style Everything</strong>
</div>
