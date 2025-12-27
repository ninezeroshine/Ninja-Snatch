/**
 * Matrix Parser - Transform Matrix Decomposition
 *
 * Parses CSS transform strings into individual components.
 * Handles: matrix(), matrix3d(), and individual transform functions.
 *
 * @module utils/matrixParser
 */

/**
 * Decomposed transform matrix components
 */
export interface MatrixComponents {
    /** Horizontal translation in pixels */
    translateX: number;
    /** Vertical translation in pixels */
    translateY: number;
    /** Depth translation in pixels (3D only) */
    translateZ: number;
    /** Horizontal scale factor */
    scaleX: number;
    /** Vertical scale factor */
    scaleY: number;
    /** Depth scale factor (3D only) */
    scaleZ: number;
    /** X-axis rotation in degrees */
    rotateX: number;
    /** Y-axis rotation in degrees */
    rotateY: number;
    /** Z-axis rotation in degrees (2D rotation) */
    rotateZ: number;
    /** Horizontal skew in degrees */
    skewX: number;
    /** Vertical skew in degrees */
    skewY: number;
}

/**
 * Default identity matrix components
 */
const IDENTITY_MATRIX: MatrixComponents = {
    translateX: 0,
    translateY: 0,
    translateZ: 0,
    scaleX: 1,
    scaleY: 1,
    scaleZ: 1,
    rotateX: 0,
    rotateY: 0,
    rotateZ: 0,
    skewX: 0,
    skewY: 0,
};

/**
 * Parse CSS transform string into decomposed components
 *
 * @param transformString - CSS transform value (e.g., "matrix(1, 0, 0, 1, 100, 50)")
 * @returns Decomposed matrix components
 *
 * @example
 * parseTransform("matrix(1, 0, 0, 1, 100, 50)")
 * // => { translateX: 100, translateY: 50, scaleX: 1, ... }
 *
 * parseTransform("translateX(50px) rotate(45deg) scale(1.5)")
 * // => { translateX: 50, rotateZ: 45, scaleX: 1.5, scaleY: 1.5, ... }
 */
export function parseTransform(transformString: string): MatrixComponents {
    if (!transformString || transformString === 'none') {
        return { ...IDENTITY_MATRIX };
    }

    const trimmed = transformString.trim();

    // Check for matrix() or matrix3d()
    if (trimmed.startsWith('matrix3d(')) {
        return parseMatrix3D(trimmed);
    }

    if (trimmed.startsWith('matrix(')) {
        return parseMatrix2D(trimmed);
    }

    // Parse individual transform functions
    return parseIndividualTransforms(trimmed);
}

/**
 * Parse 2D matrix: matrix(a, b, c, d, tx, ty)
 *
 * Matrix layout:
 * | a  c  tx |
 * | b  d  ty |
 * | 0  0  1  |
 *
 * Where:
 * - a = scaleX * cos(angle)
 * - b = scaleX * sin(angle)
 * - c = -scaleY * sin(angle + skewY)
 * - d = scaleY * cos(angle + skewY)
 * - tx = translateX
 * - ty = translateY
 */
export function parseMatrix2D(matrixString: string): MatrixComponents {
    const match = matrixString.match(/matrix\(\s*([^)]+)\s*\)/);
    if (!match) {
        return { ...IDENTITY_MATRIX };
    }

    const values = match[1].split(',').map((v) => parseFloat(v.trim()));

    if (values.length !== 6) {
        return { ...IDENTITY_MATRIX };
    }

    const [a, b, c, d, tx, ty] = values;

    // Decompose the matrix
    // scaleX = sqrt(a² + b²)
    const scaleX = Math.sqrt(a * a + b * b);

    // scaleY = sqrt(c² + d²)
    const scaleY = Math.sqrt(c * c + d * d);

    // Determine the sign of scaleX
    const signX = Math.sign(a) || 1;

    // Determine the sign of scaleY based on determinant
    const determinant = a * d - b * c;
    const signY = determinant >= 0 ? 1 : -1;

    // Rotation angle in radians
    const rotation = Math.atan2(b, a);

    // Skew
    const skewX = Math.atan2(a * c + b * d, scaleX * scaleX);

    return {
        translateX: tx,
        translateY: ty,
        translateZ: 0,
        scaleX: scaleX * signX,
        scaleY: scaleY * signY,
        scaleZ: 1,
        rotateX: 0,
        rotateY: 0,
        rotateZ: radiansToDegrees(rotation),
        skewX: radiansToDegrees(skewX),
        skewY: 0,
    };
}

/**
 * Parse 3D matrix: matrix3d(16 values)
 *
 * Matrix layout (column-major):
 * | m11 m21 m31 m41 |
 * | m12 m22 m32 m42 |
 * | m13 m23 m33 m43 |
 * | m14 m24 m34 m44 |
 *
 * Values: m11, m12, m13, m14, m21, m22, m23, m24, m31, m32, m33, m34, m41, m42, m43, m44
 */
export function parseMatrix3D(matrixString: string): MatrixComponents {
    const match = matrixString.match(/matrix3d\(\s*([^)]+)\s*\)/);
    if (!match) {
        return { ...IDENTITY_MATRIX };
    }

    const values = match[1].split(',').map((v) => parseFloat(v.trim()));

    if (values.length !== 16) {
        return { ...IDENTITY_MATRIX };
    }

    // Extract values (column-major order)
    const [
        m11,
        m12,
        m13,
        m14,
        m21,
        m22,
        m23,
        m24,
        m31,
        m32,
        m33,
        m34,
        m41,
        m42,
        m43,
        _m44,
    ] = values;

    // Translation is in the last column
    const translateX = m41;
    const translateY = m42;
    const translateZ = m43;

    // Scale extraction
    const scaleX = Math.sqrt(m11 * m11 + m12 * m12 + m13 * m13);
    const scaleY = Math.sqrt(m21 * m21 + m22 * m22 + m23 * m23);
    const scaleZ = Math.sqrt(m31 * m31 + m32 * m32 + m33 * m33);

    // Rotation extraction (simplified - assumes no skew)
    // Normalize the rotation matrix
    const r11 = m11 / scaleX;
    const r12 = m12 / scaleX;
    const r13 = m13 / scaleX;
    const r21 = m21 / scaleY;
    const r22 = m22 / scaleY;
    const r31 = m31 / scaleZ;
    const r32 = m32 / scaleZ;
    const r33 = m33 / scaleZ;

    // Extract Euler angles (XYZ order)
    let rotateX: number, rotateY: number, rotateZ: number;

    if (Math.abs(r13) < 0.9999) {
        rotateY = Math.asin(-clamp(r13, -1, 1));
        rotateX = Math.atan2(r23 ?? (r12 * r31 - r11 * r32), r33);
        rotateZ = Math.atan2(r12, r11);
    } else {
        // Gimbal lock
        rotateY = r13 < 0 ? Math.PI / 2 : -Math.PI / 2;
        rotateX = Math.atan2(-r31, r22);
        rotateZ = 0;
    }

    return {
        translateX,
        translateY,
        translateZ,
        scaleX,
        scaleY,
        scaleZ,
        rotateX: radiansToDegrees(rotateX),
        rotateY: radiansToDegrees(rotateY),
        rotateZ: radiansToDegrees(rotateZ),
        skewX: 0,
        skewY: 0,
    };
}

/**
 * Parse individual transform functions
 * e.g., "translateX(50px) rotate(45deg) scale(1.5)"
 */
function parseIndividualTransforms(transformString: string): MatrixComponents {
    const result = { ...IDENTITY_MATRIX };

    // Match transform functions
    const functionRegex = /(\w+)\(([^)]+)\)/g;
    let match: RegExpExecArray | null;

    while ((match = functionRegex.exec(transformString)) !== null) {
        const [, func, args] = match;
        const values = args.split(',').map((v) => parseValue(v.trim()));

        switch (func.toLowerCase()) {
            case 'translate':
                result.translateX = values[0] ?? 0;
                result.translateY = values[1] ?? 0;
                break;

            case 'translatex':
                result.translateX = values[0] ?? 0;
                break;

            case 'translatey':
                result.translateY = values[0] ?? 0;
                break;

            case 'translatez':
                result.translateZ = values[0] ?? 0;
                break;

            case 'translate3d':
                result.translateX = values[0] ?? 0;
                result.translateY = values[1] ?? 0;
                result.translateZ = values[2] ?? 0;
                break;

            case 'scale':
                result.scaleX = values[0] ?? 1;
                result.scaleY = values[1] ?? values[0] ?? 1;
                break;

            case 'scalex':
                result.scaleX = values[0] ?? 1;
                break;

            case 'scaley':
                result.scaleY = values[0] ?? 1;
                break;

            case 'scalez':
                result.scaleZ = values[0] ?? 1;
                break;

            case 'scale3d':
                result.scaleX = values[0] ?? 1;
                result.scaleY = values[1] ?? 1;
                result.scaleZ = values[2] ?? 1;
                break;

            case 'rotate':
                result.rotateZ = parseAngle(args.trim());
                break;

            case 'rotatex':
                result.rotateX = parseAngle(args.trim());
                break;

            case 'rotatey':
                result.rotateY = parseAngle(args.trim());
                break;

            case 'rotatez':
                result.rotateZ = parseAngle(args.trim());
                break;

            case 'rotate3d':
                // rotate3d(x, y, z, angle) - simplified handling
                if (values.length >= 4) {
                    const angle = parseAngle(args.split(',')[3]?.trim() ?? '0');
                    // Approximate: apply to dominant axis
                    if (Math.abs(values[0]) > Math.abs(values[1]) && Math.abs(values[0]) > Math.abs(values[2])) {
                        result.rotateX = angle * Math.sign(values[0]);
                    } else if (Math.abs(values[1]) > Math.abs(values[2])) {
                        result.rotateY = angle * Math.sign(values[1]);
                    } else {
                        result.rotateZ = angle * Math.sign(values[2]);
                    }
                }
                break;

            case 'skew':
                result.skewX = parseAngle(args.split(',')[0]?.trim() ?? '0');
                result.skewY = parseAngle(args.split(',')[1]?.trim() ?? '0');
                break;

            case 'skewx':
                result.skewX = parseAngle(args.trim());
                break;

            case 'skewy':
                result.skewY = parseAngle(args.trim());
                break;

            case 'perspective':
                // Perspective doesn't decompose into our components directly
                // Just skip it
                break;
        }
    }

    return result;
}

/**
 * Parse a numeric value with optional unit
 */
function parseValue(valueString: string): number {
    const num = parseFloat(valueString);
    return isNaN(num) ? 0 : num;
}

/**
 * Parse an angle with unit (deg, rad, turn, grad)
 */
function parseAngle(angleString: string): number {
    const match = angleString.match(/^(-?[\d.]+)(deg|rad|turn|grad)?$/i);
    if (!match) return 0;

    const value = parseFloat(match[1]);
    const unit = (match[2] || 'deg').toLowerCase();

    switch (unit) {
        case 'rad':
            return radiansToDegrees(value);
        case 'turn':
            return value * 360;
        case 'grad':
            return value * 0.9; // 400 grads = 360 degrees
        case 'deg':
        default:
            return value;
    }
}

/**
 * Convert radians to degrees
 */
function radiansToDegrees(radians: number): number {
    return radians * (180 / Math.PI);
}

/**
 * Clamp a value between min and max
 */
function clamp(value: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, value));
}

/**
 * Check if two matrix components are approximately equal
 */
export function matricesEqual(
    a: MatrixComponents,
    b: MatrixComponents,
    tolerance: number = 0.001
): boolean {
    return (
        Math.abs(a.translateX - b.translateX) < tolerance &&
        Math.abs(a.translateY - b.translateY) < tolerance &&
        Math.abs(a.translateZ - b.translateZ) < tolerance &&
        Math.abs(a.scaleX - b.scaleX) < tolerance &&
        Math.abs(a.scaleY - b.scaleY) < tolerance &&
        Math.abs(a.scaleZ - b.scaleZ) < tolerance &&
        Math.abs(a.rotateX - b.rotateX) < tolerance &&
        Math.abs(a.rotateY - b.rotateY) < tolerance &&
        Math.abs(a.rotateZ - b.rotateZ) < tolerance &&
        Math.abs(a.skewX - b.skewX) < tolerance &&
        Math.abs(a.skewY - b.skewY) < tolerance
    );
}

/**
 * Get the primary animation axis (largest change)
 */
export function getPrimaryAxis(
    from: MatrixComponents,
    to: MatrixComponents
): 'x' | 'y' | 'z' | 'scale' | 'rotate' | 'none' {
    const changes = {
        x: Math.abs(to.translateX - from.translateX),
        y: Math.abs(to.translateY - from.translateY),
        z: Math.abs(to.translateZ - from.translateZ),
        scale:
            Math.abs(to.scaleX - from.scaleX) +
            Math.abs(to.scaleY - from.scaleY) +
            Math.abs(to.scaleZ - from.scaleZ),
        rotate:
            Math.abs(to.rotateX - from.rotateX) +
            Math.abs(to.rotateY - from.rotateY) +
            Math.abs(to.rotateZ - from.rotateZ),
    };

    const max = Math.max(...Object.values(changes));
    if (max < 0.01) return 'none';

    const entries = Object.entries(changes) as [keyof typeof changes, number][];
    const [axis] = entries.find(([, v]) => v === max) ?? ['none'];
    return axis;
}
