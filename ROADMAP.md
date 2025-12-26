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

## Phase 2 ✅ Asset Manager (Complete)

**Duration:** 1 week  
**Status:** Done (26.12.2024)

### Goal

Download all external assets and bundle them into an offline ZIP archive.

### Completed Tasks

```markdown
- [x] Implement `AssetScanner` class
  - [x] Scan for `<img>`, `<video>`, `<source>` elements
  - [x] Extract `url()` from inline styles
  - [x] Parse `@font-face` from stylesheets (with correct base URL)
  
- [x] Implement `AssetFetcher` in background script
  - [x] Fetch with custom Referer/Origin headers
  - [x] Handle CORS errors gracefully
  - [x] MIME validation (reject HTML responses)
  - [x] Asset-type-specific Accept headers
  
- [x] Implement `ZipBuilder` with JSZip
  - [x] Create folder structure: `/assets/images/`, `/assets/fonts/`
  - [x] Rewrite URLs in HTML and CSS
  - [x] Generate final `index.html` and `style.css`
  
- [x] Implement `StyleExtractor` module
  - [x] Extract computed styles via getComputedStyle()
  - [x] Support gradient text (-webkit-background-clip)
  - [x] Base CSS reset rules
  
- [x] Implement `StylesheetExtractor` module
  - [x] @media rules for responsive layouts
  - [x] @keyframes for CSS animations
  - [x] @font-face URL rewriting
  - [x] :hover/:focus states
  - [x] CSS variables extraction
  
- [x] Connect to UI
  - [x] "Download ZIP" action
  - [x] Progress overlay with status
```

### Created Files

| File | Purpose |
|------|---------|
| `modules/AssetScanner.ts` | Find assets in DOM |
| `modules/ZipBuilder.ts` | JSZip wrapper |
| `modules/StyleExtractor.ts` | Computed style extraction |
| `modules/StylesheetExtractor.ts` | CSSOM rule extraction |

---

## Phase 3 🔜 Computed Truth (StyleHydrator)

**Duration:** 2 weeks  
**Priority:** P1  
**Status:** Next

### Goal

Extract computed styles and inject `data-truth` attributes for AI-readable output.

### Tasks

```markdown
- [ ] Implement `StyleHydrator` class
  - [ ] Traverse DOM tree
  - [ ] Generate compact `data-truth` string format
  - [ ] Filter default browser values (enhancement)
  - [ ] Normalize colors (RGB → Hex)
  
- [ ] Create Tailwind mapping utility
  - [ ] `gap:24px` → `gap-6`
  - [ ] `padding:20px 40px` → `py-5 px-10`
  - [ ] `#0a0a0a` → `bg-[#0a0a0a]`
  
- [ ] Integrate with extraction flow
  - [ ] Add "With Truth" mode toggle
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

| Phase | Focus | Priority | Status |
|-------|-------|----------|--------|
| 1 | Foundation | P0 | ✅ Complete |
| 2 | Asset Manager | P0 | ✅ Complete |
| 3 | StyleHydrator | P1 | 🔜 Next |
| 4 | MotionSampler | P2 | Planned |
| 5 | AI Integration | P2 | Planned |

**Total estimated time:** 6-8 weeks

---

## Current Status

📍 **You are here:** Phase 2 complete, ready for Phase 3

**Next immediate action:** Implement `StyleHydrator` class in `modules/StyleHydrator.ts`
