/**
 * Ninja-Snatch Animation Script Generator
 * Motion.dev based reveal animations
 * @module animation/AnimationScript
 */

import { VERSION, DEFAULTS } from '../config/defaults.js';
import { EASING } from '../config/easing.js';
import { MARQUEE_PATTERNS, SKIP_ANIMATION_SELECTORS } from '../config/patterns.js';

/**
 * Generates the Motion.dev animation script for exported HTML
 * This script runs on page load to animate revealed elements
 * 
 * @returns {string} JavaScript code as string (for injection into HTML)
 */
export function generateAnimationScript() {
  // Convert easing array to string for template
  const expoOut = JSON.stringify(EASING.EXPO_OUT);

  return `
// Ninja-Snatch v${VERSION} - Universal Animation Detection
(async () => {
  try {
    const { animate, inView } = await import('${DEFAULTS.motionDev.cdnUrl}');
    
    // Helper: Check if element should be skipped
    const shouldSkip = (el) => {
      if (el.closest('[aria-hidden]') || el.closest('.modal')) return true;
      if (el.classList.contains('pointer-events-none')) return true;
      if (el.closest('.pointer-events-none')) return true;
      return false;
    };
    
    // 1. Reveal elements with opacity:0 (Framer Motion, GSAP, etc.)
    document.querySelectorAll('[style*="opacity:0"], [style*="opacity: 0"]').forEach((el, i) => {
      if (shouldSkip(el)) return;
      
      animate(el, { opacity: 1 }, { 
        duration: ${DEFAULTS.durations.reveal / 1000}, 
        delay: Math.min(i * ${DEFAULTS.delays.stagger}, ${DEFAULTS.delays.maxReveal / 1000}),
        easing: ${expoOut}
      });
    });
    
    // 2. Animate transforms back to normal (skip cursor and marquee)
    document.querySelectorAll('[style*="translateY"], [style*="translateX"]').forEach((el, i) => {
      if (shouldSkip(el)) return;
      // Skip marquee elements
      if (el.closest('[class*="marquee"]')) return;
      if (el.parentElement?.querySelector('[class*="whitespace-nowrap"]')) return;
      if (el.classList.contains('whitespace-nowrap') && el.children.length > ${MARQUEE_PATTERNS.minChildren}) return;
      
      animate(el, { transform: 'translateY(0) translateX(0)' }, { 
        duration: ${DEFAULTS.durations.transform / 1000}, 
        delay: Math.min(i * 0.06, ${DEFAULTS.delays.maxTransform / 1000}),
        easing: ${expoOut}
      });
    });
    
    // 3. UNIVERSAL Counter Animation Detection
    // Uses data-* attributes first, then suffix heuristics
    const counterAttrs = ['data-target', 'data-count', 'data-value', 'data-end', 'data-number'];
    const suffixDefaults = { '+': 50, '%': 98, 'k': 10, 'K': 10, 'M': 1 };
    
    document.querySelectorAll('span, [class*="counter"], [class*="stat"], [class*="number"]').forEach(el => {
      const text = el.textContent.trim();
      
      // Skip if not a starting number (0, or small number that will animate up)
      if (!/^[0-9]{1,2}$/.test(text) && text !== '0') return;
      
      // Look for target in data attributes (most reliable)
      let target = null;
      for (const attr of counterAttrs) {
        const val = el.getAttribute(attr) || el.closest('[' + attr + ']')?.getAttribute(attr);
        if (val) { target = parseInt(val); break; }
      }
      
      // If no data attribute, check sibling for suffix clues
      if (!target) {
        const sibling = el.nextElementSibling;
        const suffix = sibling?.textContent?.trim()?.charAt(0);
        if (suffix && suffixDefaults[suffix]) {
          target = suffixDefaults[suffix];
          // Try to get smarter default based on position in grid
          if (suffix === '+') {
            const parent = el.closest('[class*="grid"]');
            if (parent) {
              const items = parent.querySelectorAll('[class*="text-center"], [class*="stat"]');
              const idx = Array.from(items).indexOf(el.closest('[class*="text-center"], [class*="stat"]'));
              target = [50, 5, 100, 150, 200, 250, 300][idx] || 50;
            }
          }
        }
      }
      
      if (!target || target <= 0) return;
      
      const container = el.closest('[class*="counter"], [class*="stat"], [class*="text-center"]') || el.parentElement;
      if (!container) return;
      
      inView(container, () => {
        let current = parseInt(text) || 0;
        const startVal = current;
        const duration = ${DEFAULTS.durations.counter};
        const startTime = Date.now();
        
        function updateCounter() {
          const elapsed = Date.now() - startTime;
          const progress = Math.min(elapsed / duration, 1);
          const eased = 1 - Math.pow(1 - progress, 3); // Cubic ease-out
          current = Math.round(startVal + eased * (target - startVal));
          el.textContent = current;
          
          if (progress < 1) requestAnimationFrame(updateCounter);
        }
        updateCounter();
      }, { margin: '-50px' });
    });
    
    // 4. Universal Marquee Animation Detection
    // 4a. Webflow marquee-track pattern
    document.querySelectorAll('.marquee-track, [class*="marquee-track"]').forEach(el => {
      el.style.transform = 'translateX(0)';
      el.style.animation = 'snatch-marquee ${DEFAULTS.durations.marquee / 1000}s linear infinite';
    });
    
    document.querySelectorAll('.marquee-reverse-track, [class*="marquee-reverse-track"]').forEach(el => {
      el.style.transform = 'translateX(0)';
      el.style.animation = 'snatch-marquee ${DEFAULTS.durations.marquee / 1000}s linear infinite reverse';
    });
    
    // 4b. Generic marquee detection (React/Next.js style)
    document.querySelectorAll('[class*="whitespace-nowrap"], [class*="scroll"]').forEach(el => {
      if (getComputedStyle(el).animationName !== 'none') return;
      if (el.closest('.pointer-events-none')) return;
      if (el.style.animation) return;
      
      const children = el.children;
      if (children.length >= ${MARQUEE_PATTERNS.minChildren}) {
        const firstText = children[0]?.textContent?.trim();
        const midText = children[Math.floor(children.length / 2)]?.textContent?.trim();
        
        if (firstText && firstText === midText) {
          el.style.animation = 'snatch-marquee ${DEFAULTS.durations.marquee / 1000}s linear infinite';
        }
      }
    });
    
    console.log('[Snatch] v${VERSION} animations applied');
  } catch (e) {
    // Fallback: just reveal everything
    document.querySelectorAll('[style*="opacity:0"], [style*="opacity: 0"]').forEach(el => {
      el.style.opacity = '1';
    });
    console.log('[Snatch] Fallback: revealed hidden elements');
  }
})();
`;
}

/**
 * Generates the custom cursor fix script
 * UNIVERSAL: Handles React, Vue, Framer, Webflow, vanilla cursors
 * 
 * @returns {string} JavaScript code as string
 */
export function generateCursorScript() {
  return `
// UNIVERSAL Custom Cursor Fix
(function() {
  // Multiple detection patterns for various frameworks
  const cursorSelectors = [
    '[class*="z-[9999]"]',
    '[class*="z-[999]"]',
    '[class*="cursor"]',
    '[class*="Cursor"]',
    '.custom-cursor',
    '.cursor-dot',
    '.cursor-outline',
    '.cursor-follower',
    '.mouse-follower'
  ];
  
  // Find cursors using all patterns
  let cursors = [];
  for (const sel of cursorSelectors) {
    try {
      document.querySelectorAll(sel).forEach(el => {
        if (!cursors.includes(el)) cursors.push(el);
      });
    } catch(e) {}
  }
  
  // Structural detection: fixed elements with pointer-events:none that are small
  if (cursors.length === 0) {
    document.querySelectorAll('*').forEach(el => {
      const style = getComputedStyle(el);
      if (
        style.position === 'fixed' &&
        style.pointerEvents === 'none' &&
        el.offsetWidth < 100 &&
        el.offsetHeight < 100 &&
        parseInt(style.zIndex) > 9000
      ) {
        cursors.push(el);
      }
    });
  }
  
  if (cursors.length === 0) return;
  
  let mouseX = 0, mouseY = 0;
  
  document.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
  });
  
  function tick() {
    cursors.forEach(cursor => {
      cursor.style.transform = 'translate(' + mouseX + 'px, ' + mouseY + 'px) translate(-50%, -50%)';
    });
    requestAnimationFrame(tick);
  }
  tick();
  console.log('[Snatch] Cursor activated (' + cursors.length + ' elements)');
})();
`;
}

/**
 * Combines all animation scripts into one
 * @returns {string} Complete animation script block
 */
export function generateFullAnimationBlock() {
  return `
<script type="module">
${generateAnimationScript()}

${generateCursorScript()}
</script>
`;
}
