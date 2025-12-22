/**
 * Ninja-Snatch CSS Reveal Animations
 * CSS fallback for no-JS environments
 * @module animation/RevealAnimations
 */

import { VERSION, DEFAULTS } from '../config/defaults.js';

/**
 * Generates CSS reveal animations (no-JS fallback)
 * Works with Webflow, Next.js, Framer Motion, GSAP
 * 
 * @returns {string} CSS rules as string
 */
export function generateRevealAnimationsCSS() {
    const marqueeDuration = `${DEFAULTS.durations.marquee / 1000}s`;

    return `
/* Ninja-Snatch v${VERSION} Reveal Animations */
/* Motion.dev handles primary animation, CSS provides no-JS fallback */

/* Entrance animations with staggered delays */
@keyframes snatch-fade-up {
    from { 
        opacity: 0; 
        transform: translateY(20px); 
    }
    to { 
        opacity: 1; 
        transform: translateY(0); 
    }
}

@keyframes snatch-fade-in {
    from { opacity: 0; }
    to { opacity: 1; }
}

/* Apply to common section patterns - CSS fallback for no-JS */
section,
main > div,
header,
.section,
.hero,
.hero-content,
.container-wide > div,
article {
    animation: snatch-fade-up 0.6s ease-out forwards;
}

/* Staggered cascade effect */
section:nth-of-type(1) { animation-delay: 0s; }
section:nth-of-type(2) { animation-delay: 0.1s; }
section:nth-of-type(3) { animation-delay: 0.2s; }
section:nth-of-type(4) { animation-delay: 0.3s; }
section:nth-of-type(5) { animation-delay: 0.4s; }
section:nth-of-type(n+6) { animation-delay: 0.5s; }

/* Grid children animation */
.grid > * {
    animation: snatch-fade-up 0.5s ease-out forwards;
}

.grid > *:nth-child(1) { animation-delay: 0s; }
.grid > *:nth-child(2) { animation-delay: 0.05s; }
.grid > *:nth-child(3) { animation-delay: 0.1s; }
.grid > *:nth-child(4) { animation-delay: 0.15s; }
.grid > *:nth-child(5) { animation-delay: 0.2s; }
.grid > *:nth-child(n+6) { animation-delay: 0.25s; }

/* Marquee animations */
.marquee-track, [class*="marquee"] > div {
    animation: snatch-marquee ${marqueeDuration} linear infinite;
}

.marquee-reverse-track {
    animation: snatch-marquee ${marqueeDuration} linear infinite reverse;
}

@keyframes snatch-marquee {
    from { transform: translateX(0); }
    to { transform: translateX(-50%); }
}

/* Hover effects */
a:hover img,
.group:hover img {
    transform: scale(1.02) !important;
    transition: transform 0.4s ease;
}

button:hover,
a[class*="btn"]:hover {
    transform: translateY(-2px) !important;
    transition: transform 0.2s ease;
}

/* Ensure images are visible */
img {
    opacity: 1 !important;
}
`;
}
