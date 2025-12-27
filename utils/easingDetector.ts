/**
 * Easing Detector - Animation Curve Analysis
 *
 * Analyzes velocity curves from recorded animation frames
 * to detect easing types and spring parameters.
 *
 * @module utils/easingDetector
 */

import type { AnimationFrame, EasingType } from '../types/animation';

/**
 * Spring physics parameters for Framer Motion
 */
export interface SpringParameters {
    /** Spring stiffness (default: 100) */
    stiffness: number;
    /** Damping coefficient (default: 10) */
    damping: number;
    /** Mass of the object (default: 1) */
    mass: number;
    /** Initial velocity */
    velocity: number;
    /** Bounce factor (0-1) for Framer Motion 11+ */
    bounce: number;
}

/**
 * Complete easing analysis result
 */
export interface EasingAnalysis {
    /** Detected easing type */
    type: EasingType;
    /** Spring parameters if type is 'spring' */
    spring?: SpringParameters;
    /** CSS timing function if applicable */
    cssTimingFunction?: string;
    /** Confidence score (0-1) */
    confidence: number;
    /** Analysis metadata */
    metadata: {
        /** Whether animation has overshoot */
        hasOvershoot: boolean;
        /** Number of oscillations */
        oscillationCount: number;
        /** Peak velocity */
        peakVelocity: number;
        /** Decay rate if spring */
        decayRate: number;
    };
}

/**
 * Velocity data point for analysis
 */
interface VelocityPoint {
    time: number;
    velocity: number;
    acceleration: number;
    position: number;
}

/**
 * Analyze animation frames to detect easing type
 *
 * @param frames - Recorded animation frames
 * @param property - Which property to analyze ('x', 'y', 'scale', 'opacity')
 * @returns Complete easing analysis
 *
 * @example
 * const analysis = analyzeEasing(frames, 'y');
 * if (analysis.type === 'spring') {
 *   console.log('Spring params:', analysis.spring);
 * }
 */
export function analyzeEasing(
    frames: AnimationFrame[],
    property: 'x' | 'y' | 'scale' | 'opacity' | 'rotation' = 'y'
): EasingAnalysis {
    if (frames.length < 3) {
        return createDefaultAnalysis();
    }

    // Extract position values for the specified property
    const positions = extractPositions(frames, property);

    // Calculate velocities
    const velocities = calculateVelocities(positions, frames);

    // Detect characteristics
    const hasOvershoot = detectOvershoot(positions);
    const oscillationCount = countOscillations(positions);
    const peakVelocity = Math.max(...velocities.map((v) => Math.abs(v.velocity)));

    // Determine easing type
    let type: EasingType;
    let spring: SpringParameters | undefined;
    let confidence: number;
    let decayRate = 0;

    if (hasOvershoot || oscillationCount > 0) {
        // Spring animation
        type = 'spring';
        spring = estimateSpringParameters(positions, velocities, frames);
        decayRate = calculateDecayRate(positions);
        confidence = Math.min(0.95, 0.6 + oscillationCount * 0.1);
    } else if (isLinear(velocities)) {
        type = 'linear';
        confidence = calculateLinearConfidence(velocities);
    } else if (hasSlowStart(velocities)) {
        if (hasSlowEnd(velocities)) {
            type = 'ease-in-out';
            confidence = 0.75;
        } else {
            type = 'ease-in';
            confidence = 0.7;
        }
    } else if (hasSlowEnd(velocities)) {
        type = 'ease-out';
        confidence = 0.7;
    } else {
        type = 'custom';
        confidence = 0.5;
    }

    return {
        type,
        spring,
        cssTimingFunction: getCssTimingFunction(type),
        confidence,
        metadata: {
            hasOvershoot,
            oscillationCount,
            peakVelocity,
            decayRate,
        },
    };
}

/**
 * Extract position values for a specific property
 */
function extractPositions(
    frames: AnimationFrame[],
    property: 'x' | 'y' | 'scale' | 'opacity' | 'rotation'
): number[] {
    return frames.map((frame) => {
        switch (property) {
            case 'x':
                return frame.x;
            case 'y':
                return frame.y;
            case 'scale':
                return frame.scale;
            case 'opacity':
                return frame.opacity;
            case 'rotation':
                return frame.rotation;
            default:
                return frame.y;
        }
    });
}

/**
 * Calculate velocities between frames
 */
function calculateVelocities(
    positions: number[],
    frames: AnimationFrame[]
): VelocityPoint[] {
    const velocities: VelocityPoint[] = [];

    for (let i = 1; i < positions.length; i++) {
        const dt = frames[i].time - frames[i - 1].time;
        if (dt === 0) continue;

        const velocity = (positions[i] - positions[i - 1]) / dt;
        const prevVelocity = velocities[velocities.length - 1]?.velocity ?? velocity;
        const acceleration = (velocity - prevVelocity) / dt;

        velocities.push({
            time: frames[i].time,
            velocity,
            acceleration,
            position: positions[i],
        });
    }

    return velocities;
}

/**
 * Detect if animation has overshoot (spring-like behavior)
 */
export function detectOvershoot(positions: number[]): boolean {
    if (positions.length < 3) return false;

    const start = positions[0];
    const end = positions[positions.length - 1];
    const direction = end - start;

    if (Math.abs(direction) < 0.01) return false;

    // Check if any position goes past the end value
    for (let i = 1; i < positions.length - 1; i++) {
        const overshoot = direction > 0
            ? positions[i] > end
            : positions[i] < end;

        if (overshoot) return true;
    }

    return false;
}

/**
 * Count the number of oscillations in the animation
 */
function countOscillations(positions: number[]): number {
    if (positions.length < 4) return 0;

    const end = positions[positions.length - 1];
    let crossings = 0;
    let prevSide = positions[0] > end ? 1 : -1;

    for (let i = 1; i < positions.length; i++) {
        const currentSide = positions[i] > end ? 1 : -1;
        if (currentSide !== prevSide && currentSide !== 0) {
            crossings++;
            prevSide = currentSide;
        }
    }

    return Math.floor(crossings / 2);
}

/**
 * Calculate decay rate for spring animations
 */
function calculateDecayRate(positions: number[]): number {
    if (positions.length < 10) return 0;

    const end = positions[positions.length - 1];

    // Find peaks (local maxima/minima)
    const peaks: number[] = [];
    for (let i = 1; i < positions.length - 1; i++) {
        const prev = positions[i - 1];
        const curr = positions[i];
        const next = positions[i + 1];

        const isMax = curr > prev && curr > next;
        const isMin = curr < prev && curr < next;

        if (isMax || isMin) {
            peaks.push(Math.abs(curr - end));
        }
    }

    if (peaks.length < 2) return 0;

    // Calculate average decay between consecutive peaks
    let totalDecay = 0;
    for (let i = 1; i < peaks.length; i++) {
        if (peaks[i - 1] > 0.001) {
            totalDecay += peaks[i] / peaks[i - 1];
        }
    }

    return peaks.length > 1 ? totalDecay / (peaks.length - 1) : 0;
}

/**
 * Check if animation has approximately linear velocity
 */
export function isLinear(velocities: VelocityPoint[]): boolean {
    if (velocities.length < 3) return false;

    // Check if velocity is relatively constant
    const avgVelocity =
        velocities.reduce((sum, v) => sum + v.velocity, 0) / velocities.length;

    if (Math.abs(avgVelocity) < 0.001) return false;

    const variance =
        velocities.reduce((sum, v) => sum + Math.pow(v.velocity - avgVelocity, 2), 0) /
        velocities.length;

    const stdDev = Math.sqrt(variance);
    const coeffOfVariation = stdDev / Math.abs(avgVelocity);

    // Linear if coefficient of variation is low
    return coeffOfVariation < 0.2;
}

/**
 * Check if animation starts slowly (ease-in)
 */
function hasSlowStart(velocities: VelocityPoint[]): boolean {
    if (velocities.length < 4) return false;

    const quarter = Math.floor(velocities.length / 4);
    const firstQuarter = velocities.slice(0, quarter);
    const lastQuarter = velocities.slice(-quarter);

    const avgFirst =
        firstQuarter.reduce((sum, v) => sum + Math.abs(v.velocity), 0) /
        firstQuarter.length;
    const avgLast =
        lastQuarter.reduce((sum, v) => sum + Math.abs(v.velocity), 0) /
        lastQuarter.length;

    return avgFirst < avgLast * 0.5;
}

/**
 * Check if animation ends slowly (ease-out)
 */
function hasSlowEnd(velocities: VelocityPoint[]): boolean {
    if (velocities.length < 4) return false;

    const quarter = Math.floor(velocities.length / 4);
    const firstQuarter = velocities.slice(0, quarter);
    const lastQuarter = velocities.slice(-quarter);

    const avgFirst =
        firstQuarter.reduce((sum, v) => sum + Math.abs(v.velocity), 0) /
        firstQuarter.length;
    const avgLast =
        lastQuarter.reduce((sum, v) => sum + Math.abs(v.velocity), 0) /
        lastQuarter.length;

    return avgLast < avgFirst * 0.5;
}

/**
 * Estimate spring parameters from recorded animation
 *
 * Uses damped harmonic oscillator model:
 * x(t) = A * e^(-ζωₙt) * cos(ωd*t + φ)
 *
 * Where:
 * - ζ = damping ratio
 * - ωₙ = natural frequency
 * - ωd = damped frequency
 * - ζ = c / (2 * sqrt(k * m))
 * - ωₙ = sqrt(k / m)
 */
export function estimateSpringParameters(
    positions: number[],
    velocities: VelocityPoint[],
    frames: AnimationFrame[]
): SpringParameters {
    const defaults: SpringParameters = {
        stiffness: 100,
        damping: 10,
        mass: 1,
        velocity: 0,
        bounce: 0.25,
    };

    if (positions.length < 10 || velocities.length < 5) {
        return defaults;
    }

    const end = positions[positions.length - 1];

    // Find oscillation period
    const period = estimatePeriod(positions, frames);

    // Estimate damping from decay rate
    const decayRate = calculateDecayRate(positions);

    // Calculate spring parameters
    // Natural frequency: ωₙ = 2π / period
    const naturalFrequency = period > 0 ? (2 * Math.PI) / period : 10;

    // For under-damped system: ωd = ωₙ * sqrt(1 - ζ²)
    // Damping ratio: ζ = -ln(decay) / (2π)
    const dampingRatio = decayRate > 0 && decayRate < 1
        ? -Math.log(decayRate) / (2 * Math.PI)
        : 0.3;

    // mass is assumed 1
    const mass = 1;

    // stiffness from natural frequency: k = ωₙ² * m
    const stiffness = Math.pow(naturalFrequency, 2) * mass;

    // damping coefficient: c = 2 * ζ * sqrt(k * m)
    const damping = 2 * dampingRatio * Math.sqrt(stiffness * mass);

    // Initial velocity from first frames
    const initialVelocity = velocities.length > 0
        ? velocities[0].velocity * 1000 // Convert to px/s
        : 0;

    // Bounce = 1 - damping ratio (clamped)
    const bounce = Math.max(0, Math.min(1, 1 - dampingRatio));

    return {
        stiffness: clampSpringValue(stiffness, 50, 500),
        damping: clampSpringValue(damping, 5, 40),
        mass: clampSpringValue(mass, 0.5, 5),
        velocity: initialVelocity,
        bounce: Math.round(bounce * 100) / 100,
    };
}

/**
 * Estimate oscillation period from positions
 */
function estimatePeriod(positions: number[], frames: AnimationFrame[]): number {
    if (positions.length < 10) return 0;

    const end = positions[positions.length - 1];
    const crossings: number[] = [];

    for (let i = 1; i < positions.length; i++) {
        const prev = positions[i - 1] - end;
        const curr = positions[i] - end;

        // Detect zero crossing (position crossing the end value)
        if ((prev > 0 && curr <= 0) || (prev < 0 && curr >= 0)) {
            crossings.push(frames[i].time);
        }
    }

    if (crossings.length < 2) return 0;

    // Calculate average half-period
    let totalHalfPeriod = 0;
    for (let i = 1; i < crossings.length; i++) {
        totalHalfPeriod += crossings[i] - crossings[i - 1];
    }

    const avgHalfPeriod = totalHalfPeriod / (crossings.length - 1);
    return avgHalfPeriod * 2; // Full period in ms
}

/**
 * Calculate confidence for linear detection
 */
function calculateLinearConfidence(velocities: VelocityPoint[]): number {
    if (velocities.length < 3) return 0.5;

    const avgVelocity =
        velocities.reduce((sum, v) => sum + v.velocity, 0) / velocities.length;

    const variance =
        velocities.reduce((sum, v) => sum + Math.pow(v.velocity - avgVelocity, 2), 0) /
        velocities.length;

    const coeffOfVariation = Math.sqrt(variance) / (Math.abs(avgVelocity) + 0.001);

    // Higher confidence for lower variance
    return Math.max(0.5, Math.min(0.95, 1 - coeffOfVariation));
}

/**
 * Get CSS timing function for easing type
 */
function getCssTimingFunction(type: EasingType): string {
    switch (type) {
        case 'linear':
            return 'linear';
        case 'ease-in':
            return 'cubic-bezier(0.4, 0, 1, 1)';
        case 'ease-out':
            return 'cubic-bezier(0, 0, 0.2, 1)';
        case 'ease-in-out':
            return 'cubic-bezier(0.4, 0, 0.2, 1)';
        case 'spring':
            return 'cubic-bezier(0.175, 0.885, 0.32, 1.275)'; // Approximate
        default:
            return 'ease';
    }
}

/**
 * Clamp spring parameter to reasonable range
 */
function clampSpringValue(value: number, min: number, max: number): number {
    const clamped = Math.max(min, Math.min(max, value));
    return Math.round(clamped * 10) / 10;
}

/**
 * Create default analysis for insufficient data
 */
function createDefaultAnalysis(): EasingAnalysis {
    return {
        type: 'ease-out',
        confidence: 0.3,
        metadata: {
            hasOvershoot: false,
            oscillationCount: 0,
            peakVelocity: 0,
            decayRate: 0,
        },
    };
}

/**
 * Calculate duration recommendation for Framer Motion
 */
export function estimateDuration(frames: AnimationFrame[]): number {
    if (frames.length < 2) return 0.3;

    const totalDuration = frames[frames.length - 1].time - frames[0].time;
    return Math.max(0.1, Math.min(2, totalDuration / 1000));
}
