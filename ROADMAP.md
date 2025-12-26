# 🗺 Ninja Snatch V2.0 — Roadmap

> Detailed development plan for completing the V2.0 migration

---

## Phase 1 ✅ Foundation (Complete)

**Duration:** 1 session  
**Status:** Done

### Deliverables

| Item | Status | File |
|------|--------|------|
| WXT project structure | ✅ | `wxt.config.ts`, `package.json` |
| TypeScript strict config | ✅ | `tsconfig.json` |
| Tailwind CSS v4 integration | ✅ | `assets/styles.css` |
| Popup UI (React 19) | ✅ | `entrypoints/popup/App.tsx` |
| Content script (Shadow DOM) | ✅ | `entrypoints/content.tsx` |
| Element highlighter | ✅ | `components/ElementHighlighter.tsx` |
| Control panel | ✅ | `components/NinjaPanel.tsx` |
| Toast notifications | ✅ | `components/ui/Toast.tsx` |
| Background service worker | ✅ | `entrypoints/background.ts` |
| Type definitions | ✅ | `types/*.ts` |
| Constants (ported from v1) | ✅ | `constants/*.ts` |

---

## Phase 2 🔜 Asset Manager

**Duration:** 1 week  
**Priority:** P0 (Critical)

### Goal

Download all external assets and bundle them into an offline ZIP archive.

### Tasks

```markdown
- [ ] Implement `AssetScanner` class
  - [ ] Scan for `<img>`, `<video>`, `<source>` elements
  - [ ] Extract `url()` from inline styles
  - [ ] Parse `@font-face` from stylesheets
  
- [ ] Implement `AssetFetcher` in background script
  - [ ] Fetch with custom Referer/Origin headers
  - [ ] Handle CORS errors gracefully
  - [ ] Return ArrayBuffer to content script
  
- [ ] Implement `ZipBuilder` with JSZip
  - [ ] Create folder structure: `/assets/images/`, `/assets/fonts/`
  - [ ] Rewrite URLs in HTML and CSS
  - [ ] Generate final `index.html` and `style.css`
  
- [ ] Connect to popup UI
  - [ ] Add "Download ZIP" action
  - [ ] Show download progress
```

### Files to Create

| File | Purpose |
|------|---------|
| `modules/AssetScanner.ts` | Find assets in DOM |
| `modules/AssetFetcher.ts` | Background fetch helper |
| `modules/ZipBuilder.ts` | JSZip wrapper |

---

## Phase 3 📝 Computed Truth (StyleHydrator)

**Duration:** 2 weeks  
**Priority:** P1

### Goal

Extract computed styles and inject `data-truth` attributes for AI-readable output.

### Tasks

```markdown
- [ ] Implement `StyleHydrator` class
  - [ ] Traverse DOM tree
  - [ ] Call `getComputedStyle()` on each element
  - [ ] Filter default browser values
  - [ ] Normalize colors (RGB → Hex)
  - [ ] Generate compact `data-truth` string
  
- [ ] Create Tailwind mapping utility
  - [ ] `gap:24px` → `gap-6`
  - [ ] `padding:20px 40px` → `py-5 px-10`
  - [ ] `#0a0a0a` → `bg-[#0a0a0a]`
  
- [ ] Integrate with extraction flow
  - [ ] Add "With Truth" mode
  - [ ] Show data-truth preview in panel
```

### Files to Create

| File | Purpose |
|------|---------|
| `modules/StyleHydrator.ts` | Computed style extraction |
| `utils/tailwindMapper.ts` | CSS → Tailwind mapping |
| `utils/colorNormalizer.ts` | RGB → Hex conversion |

---

## Phase 4 🎬 Animation Telemetry (MotionSampler)

**Duration:** 2-3 weeks  
**Priority:** P2

### Goal

Record animations via `requestAnimationFrame` and generate Framer Motion code.

### Tasks

```markdown
- [ ] Implement `MotionSampler` class
  - [ ] Start/stop recording
  - [ ] Capture transform matrix per frame
  - [ ] Parse `matrix()` and `matrix3d()`
  - [ ] Calculate velocity between frames
  
- [ ] Implement easing detection
  - [ ] Detect overshoot (spring-like)
  - [ ] Detect linear motion
  - [ ] Detect ease-in/ease-out
  
- [ ] Create trigger detection
  - [ ] Hover detection (mouseenter/mouseleave)
  - [ ] Scroll detection (IntersectionObserver)
  - [ ] Click detection
  
- [ ] Output Framer Motion JSON
  - [ ] Generate `initial`, `animate`, `transition` props
  - [ ] Include spring physics parameters
```

### Files to Create

| File | Purpose |
|------|---------|
| `modules/MotionSampler.ts` | Animation recording |
| `utils/matrixParser.ts` | Transform matrix parsing |
| `utils/easingDetector.ts` | Easing curve analysis |

---

## Phase 5 🤖 AI Integration

**Duration:** 1 week  
**Priority:** P2

### Goal

Connect to OpenRouter API for smart HTML cleanup and Tailwind generation.

### Tasks

```markdown
- [ ] Create AI prompt templates
  - [ ] data-truth → Tailwind conversion
  - [ ] Animation telemetry → Framer Motion
  - [ ] Structure simplification
  
- [ ] Implement OpenRouter integration
  - [ ] API key management (chrome.storage)
  - [ ] Model selection (GPT-4o, Claude, Gemini)
  - [ ] Streaming response handling
  
- [ ] Create settings UI
  - [ ] API key input
  - [ ] Model selection dropdown
  - [ ] Temperature/token controls
```

### Files to Create

| File | Purpose |
|------|---------|
| `modules/AIClient.ts` | OpenRouter API wrapper |
| `utils/promptBuilder.ts` | Template generation |
| `entrypoints/options/` | Settings page |

---

## Summary

| Phase | Focus | Priority | Duration |
|-------|-------|----------|----------|
| 1 | Foundation | P0 | ✅ Complete |
| 2 | Asset Manager | P0 | 1 week |
| 3 | StyleHydrator | P1 | 2 weeks |
| 4 | MotionSampler | P2 | 2-3 weeks |
| 5 | AI Integration | P2 | 1 week |

**Total estimated time:** 6-8 weeks

---

## Current Status

📍 **You are here:** Phase 1 complete, ready for Phase 2

**Next immediate action:** Implement `AssetScanner` class in `modules/AssetScanner.ts`
