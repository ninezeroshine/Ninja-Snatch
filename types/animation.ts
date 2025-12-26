/**
 * Animation Types for Ninja Snatch
 * 
 * Type definitions for motion telemetry and animation recording.
 */

/**
 * Single animation frame captured via requestAnimationFrame
 */
export interface AnimationFrame {
    /** Milliseconds from recording start */
    time: number;
    /** translateX value in pixels */
    x: number;
    /** translateY value in pixels */
    y: number;
    /** Scale factor (1 = 100%) */
    scale: number;
    /** Rotation in degrees */
    rotation: number;
    /** Opacity value (0-1) */
    opacity: number;
    /** Background color if changed */
    backgroundColor?: string;
    /** Text color if changed */
    color?: string;
}

/**
 * Complete animation telemetry data
 */
export interface AnimationTelemetry {
    /** CSS selector for the animated element */
    elementSelector: string;
    /** What triggered the animation */
    triggerType: AnimationTrigger;
    /** Total duration in milliseconds */
    totalDuration: number;
    /** Detected easing type */
    easing: EasingType;
    /** Recorded animation frames */
    frames: AnimationFrame[];
    /** Additional metadata */
    metadata: AnimationMetadata;
}

/**
 * Animation trigger types
 */
export type AnimationTrigger =
    | 'hover'
    | 'scroll'
    | 'load'
    | 'click'
    | 'focus'
    | 'intersection';

/**
 * Detected easing types
 */
export type EasingType =
    | 'linear'
    | 'ease-in'
    | 'ease-out'
    | 'ease-in-out'
    | 'spring'
    | 'custom';

/**
 * Additional animation metadata
 */
export interface AnimationMetadata {
    /** Number of frames captured */
    frameCount: number;
    /** Average FPS during recording */
    averageFps: number;
    /** Whether animation has overshoot (spring-like) */
    hasOvershoot: boolean;
    /** Start and end values for each property */
    deltas: {
        x: [number, number];
        y: [number, number];
        scale: [number, number];
        opacity: [number, number];
        rotation: [number, number];
    };
}

/**
 * Parsed transform matrix values
 */
export interface TransformMatrix {
    translateX: number;
    translateY: number;
    translateZ: number;
    scaleX: number;
    scaleY: number;
    scaleZ: number;
    rotateX: number;
    rotateY: number;
    rotateZ: number;
}
