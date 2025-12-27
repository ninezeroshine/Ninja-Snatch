/**
 * Style Types for Ninja Snatch
 * 
 * Type definitions for computed styles and data-truth injection.
 */

/**
 * Computed truth data structure
 * Represents the "genetic code" of an element's design
 */
export interface ComputedTruth {
    layout: LayoutProperties;
    box: BoxModelProperties;
    decor: DecorationProperties;
    typography: TypographyProperties;
}

export interface LayoutProperties {
    display: string;
    flexDirection?: string;
    justifyContent?: string;
    alignItems?: string;
    gap?: string;
    position?: string;
    gridTemplateColumns?: string;
    gridTemplateRows?: string;
}

export interface BoxModelProperties {
    width: string;
    height: string;
    minWidth?: string;
    maxWidth?: string;
    minHeight?: string;
    maxHeight?: string;
    padding: string;
    margin: string;
}

export interface DecorationProperties {
    background?: string;
    backgroundColor?: string;
    backgroundImage?: string;
    borderRadius?: string;
    boxShadow?: string;
    opacity?: string;
    cursor?: string;
    overflow?: string;
}

export interface TypographyProperties {
    fontFamily?: string;
    fontSize?: string;
    fontWeight?: string;
    lineHeight?: string;
    letterSpacing?: string;
    textAlign?: string;
    color?: string;
    textDecoration?: string;
}

/**
 * Shorthand mapping for data-truth attribute
 * Maps CSS property names to compact shorthand versions
 */
export interface TruthShorthandMap {
    [cssProperty: string]: string;
}

/**
 * CSS property value with computed and original reference
 */
export interface CSSPropertyValue {
    computed: string;
    isDefault: boolean;
    shorthand: string;
}

/**
 * data-truth attribute structure
 * Compact representation of computed styles
 */
export interface TruthData {
    display?: string;
    flexDir?: string;
    justify?: string;
    align?: string;
    gap?: string;
    pos?: string;
    w?: string;
    h?: string;
    minW?: string;
    maxW?: string;
    minH?: string;
    maxH?: string;
    pad?: string;
    pt?: string;
    pr?: string;
    pb?: string;
    pl?: string;
    margin?: string;
    mt?: string;
    mr?: string;
    mb?: string;
    ml?: string;
    bg?: string;
    bgColor?: string;
    bgImg?: string;
    radius?: string;
    shadow?: string;
    opacity?: string;
    font?: string;
    size?: string;
    weight?: string;
    lh?: string;
    tracking?: string;
    textAlign?: string;
    color?: string;
    border?: string;
    overflow?: string;
    z?: string;
    tf?: string;
    transition?: string;
    cursor?: string;
}

/**
 * Tailwind mapping result
 */
export interface TailwindMapping {
    property: string;
    cssValue: string;
    tailwindClass: string;
    isArbitrary: boolean;
}
