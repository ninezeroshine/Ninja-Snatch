# 🗺 Ninja Snatch V2.0 — Roadmap

> Detailed development plan for completing the V2.0 migration

---

## Phase 1 ✅ Foundation (Stable)

**Duration:** 1 session  
**Status:** ✅ Complete — Production Ready

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

## Phase 2 ✅ Asset Manager (Beta)

**Duration:** 1 week  
**Status:** ✅ Complete — Beta Testing (26.12.2024)

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

### Known Issues (Beta)

- Large CSS files (100K+ lines) from complex sites — optimization planned for Phase 5
- Some CSS variables may not resolve correctly

---

## Phase 3 ✅ Computed Truth / StyleHydrator (Beta)

**Duration:** 2 weeks  
**Priority:** P1  
**Status:** ✅ Complete — Beta Testing (27.12.2024)

### Goal

Extract computed styles and inject `data-truth` attributes for AI-readable output.

### Completed Tasks

```markdown
- [x] Implement `StyleHydrator` class
  - [x] Traverse DOM tree (TreeWalker)
  - [x] Generate compact `data-truth` string format
  - [x] Filter default browser values (enhancement)
  - [x] Normalize colors (RGB → Hex)
  
- [x] Create Tailwind mapping utility
  - [x] `gap:24px` → `gap-6`
  - [x] `padding:20px 40px` → `py-5 px-10`
  - [x] `#0a0a0a` → `bg-[#0a0a0a]`
  
- [x] Integrate with extraction flow
  - [x] Add "Include Truth" mode toggle (🧬)
  - [x] Updated Copy HTML and Download ZIP actions
```

### Created Files

| File | Purpose |
|------|---------|
| `modules/StyleHydrator.ts` | Computed style extraction & data-truth injection |
| `utils/tailwindMapper.ts` | CSS → Tailwind mapping |
| `utils/colorNormalizer.ts` | RGB/RGBA/HSL → Hex conversion |

### Output Example

```html
<div data-truth="display:flex; gap:24px; w:1280px; bg:#0a0a0b; radius:16px">
```

### Known Issues (Beta)

- Some computed values need better rounding
- Transform matrix values included raw

---

## Phase 4 ✅ Animation Telemetry / MotionSampler (Beta)

**Duration:** 2-3 weeks  
**Priority:** P2  
**Status:** ✅ Complete — Beta Testing (27.12.2024)

### Goal

Record animations via `requestAnimationFrame` and generate Framer Motion code.

### Completed Tasks

```markdown
- [x] Implement `MotionSampler` class
  - [x] Start/stop recording
  - [x] Capture transform matrix per frame
  - [x] Parse `matrix()` and `matrix3d()`
  - [x] Calculate velocity between frames
  - [x] Auto-stop when animation settles
  - [x] Frame deduplication and optimization
  
- [x] Implement easing detection
  - [x] Detect overshoot (spring-like)
  - [x] Detect linear motion
  - [x] Detect ease-in/ease-out
  - [x] Estimate spring parameters (stiffness, damping, mass)
  
- [x] Create trigger detection
  - [x] Hover detection (mouseenter/mouseleave)
  - [x] Scroll detection (IntersectionObserver)
  - [x] Click/focus detection
  - [x] Custom cursor detection
  - [x] Find animated elements in DOM
  
- [x] Output Framer Motion JSON
  - [x] Generate `initial`, `animate`, `transition` props
  - [x] Include spring physics parameters
  - [x] Generate whileHover/whileInView props
  - [x] Generate TSX component code
  - [x] Create compact JSON for data-motion attribute
  
- [x] UI Integration
  - [x] Include Motion toggle in popup (🎬)
  - [x] Pass includeMotion to content script
  - [x] Add motion.json to ZIP
  - [x] Add data-motion attributes to HTML
```

### Created Files

| File | Purpose |
|------|---------|
| `modules/MotionSampler.ts` | Animation recording engine |
| `utils/matrixParser.ts` | Transform matrix parsing |
| `utils/easingDetector.ts` | Easing curve analysis |
| `utils/triggerDetector.ts` | Animation trigger detection |
| `utils/framerMotionGenerator.ts` | Framer Motion code generation |

### Output Example

**motion.json:**
```json
{
  "version": "1.0",
  "animations": {
    "div:nth-of-type(2)": {
      "trigger": "load",
      "easing": "spring",
      "duration": 815,
      "props": {
        "initial": { "x": 837, "y": 484 },
        "animate": { "x": 883, "y": 472 },
        "transition": { "type": "spring", "stiffness": 50, "damping": 5 }
      },
      "code": "export function AnimatedDiv() { ... }"
    }
  }
}
```

### Known Issues (Beta)

- **Scroll-triggered animations**: Must manually scroll to trigger before capture
- **Load animations**: Captures only what's animating at capture moment
- Limited to 10 elements per capture (performance limit)

---

## Phase 5 🔜 AI Integration (Planned)

**Duration:** 1 week  
**Priority:** P2  
**Status:** Next

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
  
- [ ] CSS Optimization
  - [ ] Deduplicate CSS rules
  - [ ] Remove unused styles
  - [ ] Minify output
```

### Files to Create

| File | Purpose |
|------|---------|
| `modules/AIClient.ts` | OpenRouter API wrapper |
| `utils/promptBuilder.ts` | Template generation |
| `utils/cssOptimizer.ts` | CSS deduplication/minification |
| `entrypoints/options/` | Settings page |

---

## Summary

| Phase | Focus | Priority | Status |
|-------|-------|----------|--------|
| 1 | Foundation | P0 | ✅ Stable |
| 2 | Asset Manager | P0 | ✅ Beta |
| 3 | StyleHydrator | P1 | ✅ Beta |
| 4 | MotionSampler | P2 | ✅ Beta |
| 5 | AI Integration | P2 | 🔜 Next |

**Total estimated time:** 6-8 weeks

---

## Current Status

📍 **You are here:** Phases 1-4 complete, Phases 2-4 in Beta Testing

**Next immediate action:** Manual testing on various websites, then Phase 5 AI integration

---

## Beta Testing Checklist

Before releasing Phases 2-4 as stable:

- [ ] Test on 10+ different website types (Framer, Webflow, Next.js, vanilla)
- [ ] Verify font path resolution on CDN fonts
- [ ] Test motion capture on sites with Framer Motion, GSAP, CSS animations
- [ ] Validate data-truth output with AI models
- [ ] Performance testing on large pages (1000+ elements)
