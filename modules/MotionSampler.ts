/**
 * Motion Sampler - Animation Recording Engine
 *
 * Records element animations via requestAnimationFrame and
 * generates structured telemetry data for Framer Motion output.
 *
 * Supports all animation frameworks: Framer, Webflow, GSAP, CSS, etc.
 *
 * @module modules/MotionSampler
 */

import type {
    AnimationFrame,
    AnimationTelemetry,
    AnimationTrigger,
    AnimationMetadata,
} from '../types/animation';
import { parseTransform, type MatrixComponents } from '../utils/matrixParser';
import {
    analyzeEasing,
} from '../utils/easingDetector';
import { inferTriggerType } from '../utils/triggerDetector';

/**
 * Recording options
 */
export interface RecordingOptions {
    /** Maximum recording duration in ms (default: 5000) */
    maxDuration?: number;
    /** Minimum velocity to consider "settled" (default: 0.01) */
    velocityThreshold?: number;
    /** Manual trigger type override */
    triggerType?: AnimationTrigger;
    /** Whether to include color changes */
    includeColors?: boolean;
    /** Whether to capture cursor styles */
    includeCursor?: boolean;
    /** Minimum frames to record (default: 10) */
    minFrames?: number;
    /** Auto-stop when animation settles */
    autoStop?: boolean;
}

/**
 * Recording state
 */
export interface RecordingState {
    /** Whether currently recording */
    isRecording: boolean;
    /** Element being recorded */
    element: Element | null;
    /** Number of frames captured */
    frameCount: number;
    /** Recording duration in ms */
    duration: number;
    /** Detected trigger type */
    trigger: AnimationTrigger | null;
}

/**
 * Default recording options
 */
const DEFAULT_OPTIONS: Required<RecordingOptions> = {
    maxDuration: 5000,
    velocityThreshold: 0.1,
    triggerType: 'load',
    includeColors: true,
    includeCursor: true,
    minFrames: 10,
    autoStop: true,
};

/**
 * Motion Sampler Class
 *
 * Records animations on a single element using requestAnimationFrame.
 * Captures transform, opacity, colors, and cursor at each frame.
 */
export class MotionSampler {
    private element: Element;
    private frames: AnimationFrame[] = [];
    private isRecording = false;
    private startTime = 0;
    private rafId: number | null = null;
    private options: Required<RecordingOptions>;
    private lastMatrix: MatrixComponents | null = null;
    private lastOpacity: number | null = null;
    private settledFrames = 0;

    constructor(element: Element, options?: RecordingOptions) {
        this.element = element;
        this.options = { ...DEFAULT_OPTIONS, ...options };
    }

    /**
     * Start recording animation frames
     */
    startRecording(): void {
        if (this.isRecording) {
            console.warn('[MotionSampler] Already recording');
            return;
        }

        this.frames = [];
        this.startTime = performance.now();
        this.isRecording = true;
        this.lastMatrix = null;
        this.lastOpacity = null;
        this.settledFrames = 0;

        // Note: cursor info can be captured via detectCursor(this.element) if needed

        // Capture first frame immediately
        this.captureFrame();

        console.log('[MotionSampler] Recording started');
    }

    /**
     * Stop recording and return telemetry data
     */
    stopRecording(): AnimationTelemetry {
        this.isRecording = false;

        if (this.rafId !== null) {
            cancelAnimationFrame(this.rafId);
            this.rafId = null;
        }

        const telemetry = this.generateTelemetry();
        console.log(
            `[MotionSampler] Recording stopped: ${this.frames.length} frames, ${telemetry.totalDuration}ms`
        );

        return telemetry;
    }

    /**
     * Check if currently recording
     */
    get recording(): boolean {
        return this.isRecording;
    }

    /**
     * Get current recording state
     */
    getState(): RecordingState {
        return {
            isRecording: this.isRecording,
            element: this.element,
            frameCount: this.frames.length,
            duration: this.frames.length > 0
                ? this.frames[this.frames.length - 1].time
                : 0,
            trigger: this.options.triggerType || null,
        };
    }

    /**
     * Capture a single frame
     */
    private captureFrame(): void {
        if (!this.isRecording) return;

        const currentTime = performance.now();
        const elapsed = currentTime - this.startTime;

        // Check max duration
        if (elapsed > this.options.maxDuration) {
            console.log('[MotionSampler] Max duration reached');
            this.stopRecording();
            return;
        }

        const computed = window.getComputedStyle(this.element);

        // Parse transform matrix
        const transform = computed.transform;
        const matrix = parseTransform(transform);

        // Get opacity
        const opacity = parseFloat(computed.opacity) || 1;

        // Check if frame has changes (dedupe)
        const hasChanges = this.hasSignificantChanges(matrix, opacity);

        if (hasChanges || this.frames.length === 0) {
            // Create frame
            const frame: AnimationFrame = {
                time: Math.round(elapsed),
                x: matrix.translateX,
                y: matrix.translateY,
                scale: (matrix.scaleX + matrix.scaleY) / 2, // Average scale
                rotation: matrix.rotateZ,
                opacity,
            };

            // Add colors if enabled
            if (this.options.includeColors) {
                const bgColor = computed.backgroundColor;
                const textColor = computed.color;

                if (bgColor && bgColor !== 'transparent' && bgColor !== 'rgba(0, 0, 0, 0)') {
                    frame.backgroundColor = bgColor;
                }
                if (textColor) {
                    frame.color = textColor;
                }
            }

            this.frames.push(frame);
            this.lastMatrix = matrix;
            this.lastOpacity = opacity;
            this.settledFrames = 0;
        } else {
            this.settledFrames++;
        }

        // Auto-stop when settled
        if (
            this.options.autoStop &&
            this.settledFrames > 10 &&
            this.frames.length >= this.options.minFrames
        ) {
            console.log('[MotionSampler] Animation settled');
            this.stopRecording();
            return;
        }

        // Schedule next frame
        this.rafId = requestAnimationFrame(() => this.captureFrame());
    }

    /**
     * Check if current values differ significantly from last frame
     */
    private hasSignificantChanges(
        matrix: MatrixComponents,
        opacity: number
    ): boolean {
        if (!this.lastMatrix) return true;

        const threshold = this.options.velocityThreshold;

        return (
            Math.abs(matrix.translateX - this.lastMatrix.translateX) > threshold ||
            Math.abs(matrix.translateY - this.lastMatrix.translateY) > threshold ||
            Math.abs(matrix.translateZ - this.lastMatrix.translateZ) > threshold ||
            Math.abs(matrix.scaleX - this.lastMatrix.scaleX) > threshold * 0.01 ||
            Math.abs(matrix.scaleY - this.lastMatrix.scaleY) > threshold * 0.01 ||
            Math.abs(matrix.rotateZ - this.lastMatrix.rotateZ) > threshold ||
            Math.abs(opacity - (this.lastOpacity ?? 1)) > threshold * 0.01
        );
    }

    /**
     * Generate telemetry data from recorded frames
     */
    private generateTelemetry(): AnimationTelemetry {
        const optimizedFrames = this.optimizeFrames();

        // Analyze easing
        const easingAnalysis = analyzeEasing(optimizedFrames);

        // Calculate deltas
        const firstFrame = optimizedFrames[0] || this.createEmptyFrame();
        const lastFrame = optimizedFrames[optimizedFrames.length - 1] || this.createEmptyFrame();

        // Generate unique selector
        const selector = this.generateSelector();

        // Infer trigger if not set
        const triggerType =
            this.options.triggerType || inferTriggerType(this.element);

        const metadata: AnimationMetadata = {
            frameCount: optimizedFrames.length,
            averageFps: this.calculateFps(),
            hasOvershoot: easingAnalysis.metadata.hasOvershoot,
            deltas: {
                x: [firstFrame.x, lastFrame.x],
                y: [firstFrame.y, lastFrame.y],
                scale: [firstFrame.scale, lastFrame.scale],
                opacity: [firstFrame.opacity, lastFrame.opacity],
                rotation: [firstFrame.rotation, lastFrame.rotation],
            },
        };

        return {
            elementSelector: selector,
            triggerType,
            totalDuration: lastFrame.time - firstFrame.time,
            easing: easingAnalysis.type,
            frames: optimizedFrames,
            metadata,
        };
    }

    /**
     * Optimize frames by removing duplicates and redundant keypoints
     */
    private optimizeFrames(): AnimationFrame[] {
        if (this.frames.length < 3) return [...this.frames];

        const optimized: AnimationFrame[] = [this.frames[0]];

        for (let i = 1; i < this.frames.length - 1; i++) {
            const prev = optimized[optimized.length - 1];
            const curr = this.frames[i];
            const next = this.frames[i + 1];

            // Keep frame if it's a keypoint (direction change, significant velocity change)
            const isKeypoint =
                this.isDirectionChange(prev, curr, next) ||
                this.isVelocityChange(prev, curr, next) ||
                i % 5 === 0; // Keep every 5th frame for context

            if (isKeypoint) {
                optimized.push(curr);
            }
        }

        // Always keep last frame
        optimized.push(this.frames[this.frames.length - 1]);

        return optimized;
    }

    /**
     * Check if frame represents a direction change
     */
    private isDirectionChange(
        prev: AnimationFrame,
        curr: AnimationFrame,
        next: AnimationFrame
    ): boolean {
        // Check Y direction change
        const yDir1 = Math.sign(curr.y - prev.y);
        const yDir2 = Math.sign(next.y - curr.y);
        if (yDir1 !== 0 && yDir2 !== 0 && yDir1 !== yDir2) return true;

        // Check X direction change
        const xDir1 = Math.sign(curr.x - prev.x);
        const xDir2 = Math.sign(next.x - curr.x);
        if (xDir1 !== 0 && xDir2 !== 0 && xDir1 !== xDir2) return true;

        // Check scale direction change
        const sDir1 = Math.sign(curr.scale - prev.scale);
        const sDir2 = Math.sign(next.scale - curr.scale);
        if (sDir1 !== 0 && sDir2 !== 0 && sDir1 !== sDir2) return true;

        return false;
    }

    /**
     * Check if frame has significant velocity change
     */
    private isVelocityChange(
        prev: AnimationFrame,
        curr: AnimationFrame,
        next: AnimationFrame
    ): boolean {
        const dt1 = (curr.time - prev.time) || 1;
        const dt2 = (next.time - curr.time) || 1;

        const vel1 = (curr.y - prev.y) / dt1;
        const vel2 = (next.y - curr.y) / dt2;

        // Check for significant velocity change
        return Math.abs(vel2 - vel1) > 0.5;
    }

    /**
     * Create an empty frame for edge cases
     */
    private createEmptyFrame(): AnimationFrame {
        return {
            time: 0,
            x: 0,
            y: 0,
            scale: 1,
            rotation: 0,
            opacity: 1,
        };
    }

    /**
     * Generate a unique CSS selector for the element
     */
    private generateSelector(): string {
        const element = this.element;

        // Try ID first
        if (element.id) {
            return `#${element.id}`;
        }

        // Try class combination
        const classes = Array.from(element.classList);
        if (classes.length > 0) {
            const selector = '.' + classes.slice(0, 3).join('.');
            try {
                if (document.querySelectorAll(selector).length === 1) {
                    return selector;
                }
            } catch {
                // Invalid selector, continue
            }
        }

        // Build path to element
        const path: string[] = [];
        let current: Element | null = element;

        while (current && current !== document.body && path.length < 5) {
            let part = current.tagName.toLowerCase();

            if (current.id) {
                part = `#${current.id}`;
                path.unshift(part);
                break;
            }

            const parent: Element | null = current.parentElement;
            if (parent) {
                const sameTag = Array.from(parent.children).filter(
                    (c: Element) => c.tagName === current!.tagName
                );
                if (sameTag.length > 1) {
                    const index = sameTag.indexOf(current) + 1;
                    part += `:nth-of-type(${index})`;
                }
            }

            path.unshift(part);
            current = parent;
        }

        return path.join(' > ');
    }

    /**
     * Calculate average FPS from recorded frames
     */
    private calculateFps(): number {
        if (this.frames.length < 2) return 0;

        const totalDuration =
            this.frames[this.frames.length - 1].time - this.frames[0].time;

        if (totalDuration === 0) return 0;

        return Math.round((this.frames.length / totalDuration) * 1000);
    }
}

/**
 * Create a new MotionSampler for an element
 */
export function createSampler(
    element: Element,
    options?: RecordingOptions
): MotionSampler {
    return new MotionSampler(element, options);
}

/**
 * Record an animation with auto start/stop
 *
 * @param element - Element to record
 * @param trigger - Animation trigger type
 * @param duration - Max recording duration in ms
 * @returns Promise resolving to telemetry data
 *
 * @example
 * const telemetry = await recordAnimation(element, 'hover', 2000);
 * console.log(telemetry.easing); // 'spring'
 */
export async function recordAnimation(
    element: Element,
    trigger: AnimationTrigger = 'load',
    duration: number = 2000
): Promise<AnimationTelemetry> {
    return new Promise((resolve) => {
        const sampler = new MotionSampler(element, {
            triggerType: trigger,
            maxDuration: duration,
            autoStop: true,
        });

        sampler.startRecording();

        // Fallback timeout
        setTimeout(() => {
            if (sampler.recording) {
                resolve(sampler.stopRecording());
            }
        }, duration + 100);

        // Watch for auto-stop completion
        const checkInterval = setInterval(() => {
            if (!sampler.recording) {
                clearInterval(checkInterval);
                resolve(sampler.stopRecording());
            }
        }, 50);
    });
}

/**
 * Record multiple elements simultaneously
 */
export async function recordMultiple(
    elements: Element[],
    trigger: AnimationTrigger = 'load',
    duration: number = 2000
): Promise<Map<string, AnimationTelemetry>> {
    const results = new Map<string, AnimationTelemetry>();

    const promises = elements.map(async (element) => {
        const telemetry = await recordAnimation(element, trigger, duration);
        results.set(telemetry.elementSelector, telemetry);
    });

    await Promise.all(promises);
    return results;
}

/**
 * Quick snapshot of current element state (no recording)
 */
export function snapshotState(element: Element): AnimationFrame {
    const computed = window.getComputedStyle(element);
    const matrix = parseTransform(computed.transform);

    return {
        time: 0,
        x: matrix.translateX,
        y: matrix.translateY,
        scale: (matrix.scaleX + matrix.scaleY) / 2,
        rotation: matrix.rotateZ,
        opacity: parseFloat(computed.opacity) || 1,
        backgroundColor: computed.backgroundColor,
        color: computed.color,
    };
}
