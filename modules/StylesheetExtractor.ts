/**
 * Stylesheet Extractor Module
 *
 * Extracts CSS rules from document stylesheets using CSSOM API.
 * Captures responsive rules, animations, and interactive states
 * that getComputedStyle cannot provide.
 *
 * Features:
 * - @media rules for responsive layouts
 * - @keyframes for CSS animations
 * - :hover/:focus/:active for interactivity
 * - @font-face for font definitions
 * - CSS custom properties (variables)
 *
 * @module StylesheetExtractor
 */

/**
 * Result of stylesheet extraction
 */
export interface ExtractedStylesheet {
    /** @media rules with all nested content */
    mediaRules: string[];
    /** @keyframes definitions */
    keyframes: string[];
    /** :hover, :focus, :active rules */
    hoverRules: string[];
    /** @font-face declarations */
    fontFaces: string[];
    /** CSS custom properties from :root */
    cssVariables: string[];
    /** Count of stylesheets that couldn't be read (CORS) */
    corsBlockedCount: number;
}

/**
 * Extract all relevant CSS rules from document stylesheets
 */
export function extractStylesheets(): ExtractedStylesheet {
    const result: ExtractedStylesheet = {
        mediaRules: [],
        keyframes: [],
        hoverRules: [],
        fontFaces: [],
        cssVariables: [],
        corsBlockedCount: 0,
    };

    // Iterate through all stylesheets
    for (const sheet of document.styleSheets) {
        try {
            // Skip if no rules (CORS will throw here)
            if (!sheet.cssRules) continue;

            processStyleSheet(sheet, result);
        } catch (e) {
            // CORS-protected stylesheet - this is expected for external stylesheets
            result.corsBlockedCount++;
            // Use debug to avoid cluttering console (this is normal behavior)
            console.debug(
                '[StylesheetExtractor] Skipped CORS-protected:',
                sheet.href?.slice(0, 60)
            );
        }
    }

    // Also extract from <style> tags
    document.querySelectorAll('style').forEach((styleEl) => {
        try {
            const sheet = styleEl.sheet;
            if (sheet?.cssRules) {
                processStyleSheet(sheet, result);
            }
        } catch (e) {
            // Ignore errors
        }
    });

    console.log(
        `[StylesheetExtractor] Extracted: ${result.mediaRules.length} media, ` +
        `${result.keyframes.length} keyframes, ${result.hoverRules.length} hover, ` +
        `${result.fontFaces.length} fonts, ${result.cssVariables.length} vars`
    );

    return result;
}

/**
 * Process a single stylesheet and extract relevant rules
 */
function processStyleSheet(sheet: CSSStyleSheet, result: ExtractedStylesheet): void {
    for (const rule of sheet.cssRules) {
        // @media rules (responsive)
        if (rule instanceof CSSMediaRule) {
            const mediaText = extractMediaRule(rule);
            if (mediaText) {
                result.mediaRules.push(mediaText);
            }
        }

        // @keyframes (animations)
        else if (rule instanceof CSSKeyframesRule) {
            const keyframesText = extractKeyframesRule(rule);
            if (keyframesText) {
                result.keyframes.push(keyframesText);
            }
        }

        // @font-face
        else if (rule instanceof CSSFontFaceRule) {
            result.fontFaces.push(rule.cssText);
        }

        // Regular style rules
        else if (rule instanceof CSSStyleRule) {
            // :root CSS variables
            if (rule.selectorText === ':root') {
                result.cssVariables.push(rule.cssText);
            }

            // Interactive pseudo-classes
            if (isInteractiveSelector(rule.selectorText)) {
                result.hoverRules.push(rule.cssText);
            }
        }

        // @supports rules (include as-is)
        else if (rule instanceof CSSSupportsRule) {
            // Recursively check for media/keyframes inside
            processNestedRules(rule.cssRules, result);
        }
    }
}

/**
 * Extract @media rule with all its content
 */
function extractMediaRule(rule: CSSMediaRule): string | null {
    const mediaCondition = rule.conditionText || rule.media.mediaText;

    // Skip print media
    if (mediaCondition.includes('print')) {
        return null;
    }

    // Collect all nested rules
    const nestedRules: string[] = [];
    for (const nestedRule of rule.cssRules) {
        nestedRules.push(nestedRule.cssText);
    }

    if (nestedRules.length === 0) {
        return null;
    }

    return `@media ${mediaCondition} {\n  ${nestedRules.join('\n  ')}\n}`;
}

/**
 * Extract @keyframes rule
 */
function extractKeyframesRule(rule: CSSKeyframesRule): string {
    const frames: string[] = [];

    for (const frame of rule.cssRules) {
        if (frame instanceof CSSKeyframeRule) {
            frames.push(`  ${frame.keyText} { ${frame.style.cssText} }`);
        }
    }

    return `@keyframes ${rule.name} {\n${frames.join('\n')}\n}`;
}

/**
 * Process nested rules (e.g., inside @supports)
 */
function processNestedRules(rules: CSSRuleList, result: ExtractedStylesheet): void {
    for (const rule of rules) {
        if (rule instanceof CSSMediaRule) {
            const mediaText = extractMediaRule(rule);
            if (mediaText) result.mediaRules.push(mediaText);
        } else if (rule instanceof CSSKeyframesRule) {
            result.keyframes.push(extractKeyframesRule(rule));
        }
    }
}

/**
 * Check if selector contains interactive pseudo-classes
 */
function isInteractiveSelector(selector: string): boolean {
    const interactivePatterns = [
        ':hover',
        ':focus',
        ':focus-visible',
        ':focus-within',
        ':active',
        ':visited',
        ':target',
        ':checked',
        ':disabled',
        ':enabled',
        ':invalid',
        ':valid',
        ':placeholder-shown',
    ];

    return interactivePatterns.some((pattern) => selector.includes(pattern));
}

/**
 * Get a combined CSS string from extracted stylesheet
 * @param extracted - The extracted stylesheet data
 * @param assetMap - Map of original URLs to local paths for rewriting
 */
export function buildExtractedCSS(
    extracted: ExtractedStylesheet,
    assetMap?: Map<string, string>
): string {
    const sections: string[] = [];

    // CSS Variables first (they need to be defined before use)
    if (extracted.cssVariables.length > 0) {
        sections.push('/* ========== CSS Variables ========== */');
        sections.push(...extracted.cssVariables);
        sections.push('');
    }

    // Font faces - need URL rewriting
    if (extracted.fontFaces.length > 0) {
        sections.push('/* ========== Font Faces ========== */');
        const rewrittenFontFaces = extracted.fontFaces.map((fontFace) =>
            rewriteFontFaceUrls(fontFace, assetMap)
        );
        sections.push(...rewrittenFontFaces);
        sections.push('');
    }

    // Keyframes
    if (extracted.keyframes.length > 0) {
        sections.push('/* ========== Keyframes (Animations) ========== */');
        sections.push(...extracted.keyframes);
        sections.push('');
    }

    // Hover/Focus states
    if (extracted.hoverRules.length > 0) {
        sections.push('/* ========== Interactive States ========== */');
        sections.push(...extracted.hoverRules);
        sections.push('');
    }

    // Media queries last (they override base styles)
    if (extracted.mediaRules.length > 0) {
        sections.push('/* ========== Media Queries (Responsive) ========== */');
        sections.push(...extracted.mediaRules);
        sections.push('');
    }

    return sections.join('\n');
}

/**
 * Rewrite URLs in @font-face declarations to local paths
 */
function rewriteFontFaceUrls(
    fontFace: string,
    assetMap?: Map<string, string>
): string {
    if (!assetMap || assetMap.size === 0) {
        return fontFace;
    }

    // Pattern to match url() in CSS
    const urlPattern = /url\(['"]?([^'")]+)['"]?\)/gi;

    return fontFace.replace(urlPattern, (match, url) => {
        // Try to find matching asset by resolving the URL
        const absoluteUrl = resolveUrlToAbsolute(url);

        if (absoluteUrl && assetMap.has(absoluteUrl)) {
            const localPath = assetMap.get(absoluteUrl);
            return `url("${localPath}")`;
        }

        // Try partial match by filename
        const filename = url.split('/').pop()?.split('?')[0];
        if (filename) {
            for (const [originalUrl, localPath] of assetMap) {
                if (originalUrl.includes(filename)) {
                    return `url("${localPath}")`;
                }
            }
        }

        // No match found, keep original
        return match;
    });
}

/**
 * Resolve a URL to absolute using current page origin
 */
function resolveUrlToAbsolute(url: string): string | null {
    try {
        if (url.startsWith('data:') || url.startsWith('blob:')) {
            return null;
        }
        return new URL(url, window.location.href).href;
    } catch {
        return null;
    }
}

/**
 * Extract CSS variables as a map for reference
 */
export function extractCSSVariablesMap(): Map<string, string> {
    const varsMap = new Map<string, string>();

    try {
        const rootStyles = getComputedStyle(document.documentElement);

        // Get all custom properties
        for (const prop of rootStyles) {
            if (prop.startsWith('--')) {
                const value = rootStyles.getPropertyValue(prop).trim();
                if (value) {
                    varsMap.set(prop, value);
                }
            }
        }
    } catch (e) {
        console.warn('[StylesheetExtractor] Failed to extract CSS variables:', e);
    }

    return varsMap;
}
