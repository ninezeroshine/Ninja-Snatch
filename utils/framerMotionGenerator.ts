/**
 * Framer Motion Generator - Animation Code Output
 *
 * Generates Framer Motion compatible code from telemetry data.
 * Outputs JSX components with proper spring parameters.
 *
 * @module utils/framerMotionGenerator
 */

import type {
    AnimationTelemetry,
    AnimationFrame,
    AnimationTrigger,
    EasingType,
} from '../types/animation';
import {
    analyzeEasing,
    type SpringParameters,
} from './easingDetector';

/**
 * Framer Motion animation props
 */
export interface FramerMotionProps {
    /** Initial state */
    initial: Record<string, number | string>;
    /** Target state */
    animate: Record<string, number | string>;
    /** Transition configuration */
    transition: {
        type?: 'spring' | 'tween' | 'inertia';
        duration?: number;
        ease?: string | number[];
        stiffness?: number;
        damping?: number;
        mass?: number;
        bounce?: number;
        delay?: number;
    };
    /** Hover state (if trigger is hover) */
    whileHover?: Record<string, number | string>;
    /** In-view state (if trigger is scroll) */
    whileInView?: Record<string, number | string>;
    /** Viewport configuration for scroll triggers */
    viewport?: {
        once?: boolean;
        margin?: string;
        amount?: number | 'some' | 'all';
    };
    /** Tap/press state */
    whileTap?: Record<string, number | string>;
    /** Focus state */
    whileFocus?: Record<string, number | string>;
}

/**
 * Complete Framer Motion output
 */
export interface FramerMotionOutput {
    /** Ready-to-use React component code */
    code: string;
    /** Just the motion props */
    props: FramerMotionProps;
    /** Compact JSON for data-motion attribute */
    json: string;
    /** CSS for cursor if custom */
    cursorCss?: string;
}

/**
 * Generate Framer Motion code from telemetry
 *
 * @param telemetry - Recorded animation telemetry
 * @returns Complete Framer Motion output with code, props, and JSON
 *
 * @example
 * const output = generateFramerMotion(telemetry);
 * console.log(output.code);
 * // export function AnimatedComponent({ children }) { ... }
 */
export function generateFramerMotion(
    telemetry: AnimationTelemetry
): FramerMotionOutput {
    const { frames, triggerType, easing } = telemetry;

    if (frames.length < 2) {
        return createEmptyOutput();
    }

    const firstFrame = frames[0];
    const lastFrame = frames[frames.length - 1];

    // Build initial and animate states
    const initial = buildState(firstFrame);
    const animate = buildState(lastFrame);

    // Analyze easing for transition config
    const easingAnalysis = analyzeEasing(frames);

    // Build transition
    const transition = buildTransition(easing, easingAnalysis.spring, telemetry.totalDuration);

    // Build props based on trigger type
    const props = buildProps(initial, animate, transition, triggerType);

    // Generate code
    const code = generateComponentCode(props, telemetry);

    // Generate compact JSON
    const json = generateCompactJson(props);

    return {
        code,
        props,
        json,
    };
}

/**
 * Build state object from animation frame
 */
function buildState(frame: AnimationFrame): Record<string, number | string> {
    const state: Record<string, number | string> = {};

    // Only include non-default values
    if (Math.abs(frame.x) > 0.1) {
        state.x = roundValue(frame.x);
    }

    if (Math.abs(frame.y) > 0.1) {
        state.y = roundValue(frame.y);
    }

    if (Math.abs(frame.scale - 1) > 0.01) {
        state.scale = roundValue(frame.scale, 3);
    }

    if (Math.abs(frame.rotation) > 0.1) {
        state.rotate = roundValue(frame.rotation);
    }

    if (Math.abs(frame.opacity - 1) > 0.01) {
        state.opacity = roundValue(frame.opacity, 2);
    }

    if (frame.backgroundColor && frame.backgroundColor !== 'transparent') {
        state.backgroundColor = frame.backgroundColor;
    }

    if (frame.color) {
        state.color = frame.color;
    }

    return state;
}

/**
 * Build transition configuration
 */
function buildTransition(
    easing: EasingType,
    spring: SpringParameters | undefined,
    durationMs: number
): FramerMotionProps['transition'] {
    const durationSec = Math.max(0.1, Math.min(2, durationMs / 1000));

    if (easing === 'spring' && spring) {
        return {
            type: 'spring',
            stiffness: spring.stiffness,
            damping: spring.damping,
            mass: spring.mass,
            bounce: spring.bounce,
        };
    }

    // Map easing to Framer Motion format
    const transition: FramerMotionProps['transition'] = {
        type: 'tween',
        duration: roundValue(durationSec, 2),
    };

    switch (easing) {
        case 'linear':
            transition.ease = 'linear';
            break;
        case 'ease-in':
            transition.ease = 'easeIn';
            break;
        case 'ease-out':
            transition.ease = 'easeOut';
            break;
        case 'ease-in-out':
            transition.ease = 'easeInOut';
            break;
        default:
            transition.ease = 'easeOut';
    }

    return transition;
}

/**
 * Build complete props based on trigger type
 */
function buildProps(
    initial: Record<string, number | string>,
    animate: Record<string, number | string>,
    transition: FramerMotionProps['transition'],
    trigger: AnimationTrigger
): FramerMotionProps {
    const props: FramerMotionProps = {
        initial,
        animate: {},
        transition,
    };

    switch (trigger) {
        case 'hover':
            // For hover, initial is the rest state, animate is empty
            // whileHover is the target state
            props.animate = {};
            props.whileHover = animate;
            props.initial = initial;
            break;

        case 'scroll':
        case 'intersection':
            // For scroll, use whileInView
            props.animate = {};
            props.whileInView = animate;
            props.viewport = {
                once: true,
                margin: '-100px',
                amount: 0.3,
            };
            break;

        case 'click':
            // For click, use whileTap
            props.animate = {};
            props.whileTap = animate;
            break;

        case 'focus':
            // For focus, use whileFocus
            props.animate = {};
            props.whileFocus = animate;
            break;

        case 'load':
        default:
            // For load, use animate directly
            props.animate = animate;
            break;
    }

    return props;
}

/**
 * Generate React component code
 */
function generateComponentCode(
    props: FramerMotionProps,
    telemetry: AnimationTelemetry
): string {
    const componentName = generateComponentName(telemetry.elementSelector);
    const propsString = formatPropsForCode(props);

    // Determine imports
    const imports = ['motion'];
    if (props.whileInView || props.viewport) {
        // No additional imports needed for whileInView
    }

    // Check if we need useRef for scroll detection
    let useRefImport = '';
    let refDeclaration = '';
    let refProp = '';

    if (props.whileInView) {
        // For modern Framer Motion, whileInView doesn't need ref
    }

    const code = `import { ${imports.join(', ')} } from 'framer-motion';
${useRefImport}
/**
 * Generated animation component
 * Trigger: ${telemetry.triggerType}
 * Easing: ${telemetry.easing}
 * Duration: ${telemetry.totalDuration}ms
 */
export function ${componentName}({ children, className }: { children?: React.ReactNode; className?: string }) {
${refDeclaration}
  return (
    <motion.div
${refProp}      className={className}
${propsString}
    >
      {children}
    </motion.div>
  );
}
`;

    return code.trim();
}

/**
 * Format props for code output
 */
function formatPropsForCode(props: FramerMotionProps): string {
    const lines: string[] = [];
    const indent = '      ';

    // Initial
    if (Object.keys(props.initial).length > 0) {
        lines.push(`${indent}initial={${formatObject(props.initial)}}`);
    }

    // Animate (only if has values)
    if (Object.keys(props.animate).length > 0) {
        lines.push(`${indent}animate={${formatObject(props.animate)}}`);
    }

    // whileHover
    if (props.whileHover && Object.keys(props.whileHover).length > 0) {
        lines.push(`${indent}whileHover={${formatObject(props.whileHover)}}`);
    }

    // whileInView
    if (props.whileInView && Object.keys(props.whileInView).length > 0) {
        lines.push(`${indent}whileInView={${formatObject(props.whileInView)}}`);
    }

    // whileTap
    if (props.whileTap && Object.keys(props.whileTap).length > 0) {
        lines.push(`${indent}whileTap={${formatObject(props.whileTap)}}`);
    }

    // whileFocus
    if (props.whileFocus && Object.keys(props.whileFocus).length > 0) {
        lines.push(`${indent}whileFocus={${formatObject(props.whileFocus)}}`);
    }

    // Viewport
    if (props.viewport) {
        lines.push(`${indent}viewport={${formatObject(props.viewport)}}`);
    }

    // Transition
    lines.push(`${indent}transition={${formatObject(props.transition)}}`);

    return lines.join('\n');
}

/**
 * Format object for code output
 */
function formatObject(obj: unknown): string {
    if (typeof obj !== 'object' || obj === null) {
        return String(obj);
    }

    const entries = Object.entries(obj as Record<string, unknown>)
        .filter(([, v]) => v !== undefined && v !== null)
        .map(([k, v]) => {
            if (typeof v === 'string') {
                return `${k}: "${v}"`;
            }
            if (typeof v === 'object') {
                return `${k}: ${formatObject(v)}`;
            }
            return `${k}: ${v}`;
        });

    return `{ ${entries.join(', ')} }`;
}

/**
 * Generate component name from selector
 */
function generateComponentName(selector: string): string {
    // Extract meaningful part from selector
    let name = selector
        .replace(/[#.:\[\]>~+]/g, ' ')
        .split(' ')
        .filter(Boolean)
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join('');

    // Ensure starts with letter
    if (!/^[A-Z]/.test(name)) {
        name = 'Animated' + name;
    }

    // Add suffix if needed
    if (!name.includes('Animated')) {
        name = 'Animated' + name;
    }

    // Limit length
    if (name.length > 30) {
        name = name.slice(0, 30);
    }

    return name || 'AnimatedComponent';
}

/**
 * Generate compact JSON for data-motion attribute
 */
function generateCompactJson(props: FramerMotionProps): string {
    const compact: Record<string, unknown> = {};

    if (Object.keys(props.initial).length > 0) {
        compact.i = props.initial; // i = initial
    }

    if (Object.keys(props.animate).length > 0) {
        compact.a = props.animate; // a = animate
    }

    if (props.whileHover && Object.keys(props.whileHover).length > 0) {
        compact.h = props.whileHover; // h = hover
    }

    if (props.whileInView && Object.keys(props.whileInView).length > 0) {
        compact.v = props.whileInView; // v = view (scroll)
    }

    if (props.whileTap && Object.keys(props.whileTap).length > 0) {
        compact.t = props.whileTap; // t = tap
    }

    if (props.transition) {
        compact.tr = props.transition; // tr = transition
    }

    return JSON.stringify(compact);
}

/**
 * Generate motion.json file contents for ZIP export
 */
export function generateMotionJson(
    telemetryMap: Map<string, AnimationTelemetry>
): string {
    const output: Record<string, unknown> = {
        version: '1.0',
        generator: 'Ninja Snatch v2.0',
        timestamp: new Date().toISOString(),
        animations: {},
    };

    for (const [selector, telemetry] of telemetryMap) {
        const framer = generateFramerMotion(telemetry);
        (output.animations as Record<string, unknown>)[selector] = {
            trigger: telemetry.triggerType,
            easing: telemetry.easing,
            duration: telemetry.totalDuration,
            frames: telemetry.frames.length,
            props: framer.props,
            code: framer.code,
        };
    }

    return JSON.stringify(output, null, 2);
}

/**
 * Round value to specified precision
 */
function roundValue(value: number, decimals: number = 1): number {
    const factor = Math.pow(10, decimals);
    return Math.round(value * factor) / factor;
}

/**
 * Create empty output for edge cases
 */
function createEmptyOutput(): FramerMotionOutput {
    return {
        code: '// No animation detected',
        props: {
            initial: {},
            animate: {},
            transition: { type: 'tween', duration: 0.3 },
        },
        json: '{}',
    };
}

/**
 * Generate CSS for custom cursor
 */
export function generateCursorCss(
    selector: string,
    cursorUrl: string,
    hotspot?: { x: number; y: number }
): string {
    const hotspotStr = hotspot ? `${hotspot.x} ${hotspot.y}` : '0 0';
    return `${selector} {\n  cursor: url('${cursorUrl}') ${hotspotStr}, auto;\n}`;
}

/**
 * Convert telemetry to data-motion attribute value
 */
export function telemetryToDataMotion(telemetry: AnimationTelemetry): string {
    const output = generateFramerMotion(telemetry);
    return output.json;
}
