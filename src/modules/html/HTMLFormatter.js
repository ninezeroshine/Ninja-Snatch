/**
 * Ninja-Snatch HTML Formatter
 * Pretty-print HTML for readability
 * @module html/HTMLFormatter
 */

/**
 * Format HTML with proper indentation
 * Lightweight alternative to js-beautify
 * 
 * @param {string} html - Raw HTML string
 * @param {number} indentSize - Spaces per indent level (default: 2)
 * @returns {string} Formatted HTML
 */
export function prettifyHTML(html, indentSize = 2) {
    if (!html) return '';

    // Self-closing tags
    const selfClosing = new Set([
        'area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input',
        'link', 'meta', 'param', 'source', 'track', 'wbr'
    ]);

    // Tags that should have their own line
    const blockTags = new Set([
        'html', 'head', 'body', 'header', 'footer', 'main', 'nav',
        'section', 'article', 'aside', 'div', 'p', 'h1', 'h2', 'h3',
        'h4', 'h5', 'h6', 'ul', 'ol', 'li', 'table', 'tr', 'td', 'th',
        'form', 'fieldset', 'script', 'style', 'link', 'meta', 'title'
    ]);

    // Preserve content tags (don't add newlines inside)
    const preserveTags = new Set(['script', 'style', 'pre', 'code', 'textarea']);

    let result = '';
    let indent = 0;
    let inPreserve = false;
    let preserveTag = '';

    // Simple tokenizer
    const tokens = html.match(/<[^>]+>|[^<]+/g) || [];

    for (const token of tokens) {
        // Check for tag
        if (token.startsWith('<')) {
            const isClosing = token.startsWith('</');
            const isSelfClosing = token.endsWith('/>') || selfClosing.has(getTagName(token));
            const tagName = getTagName(token);

            // Handle preserve tags
            if (preserveTags.has(tagName)) {
                if (isClosing) {
                    inPreserve = false;
                    preserveTag = '';
                } else if (!isSelfClosing) {
                    inPreserve = true;
                    preserveTag = tagName;
                }
            }

            if (inPreserve && !token.includes(`<${preserveTag}`) && !token.includes(`</${preserveTag}`)) {
                result += token;
                continue;
            }

            // Closing tag - decrease indent first
            if (isClosing) {
                indent = Math.max(0, indent - 1);
            }

            // Add newline and indent for block tags
            if (blockTags.has(tagName)) {
                result += '\n' + ' '.repeat(indent * indentSize) + token;
            } else {
                result += token;
            }

            // Opening tag - increase indent after
            if (!isClosing && !isSelfClosing && blockTags.has(tagName)) {
                indent++;
            }
        } else {
            // Text content
            const trimmed = token.trim();
            if (trimmed) {
                if (inPreserve) {
                    result += token;
                } else {
                    result += trimmed;
                }
            }
        }
    }

    // Clean up excessive newlines
    result = result.replace(/\n{3,}/g, '\n\n');

    return result.trim();
}

/**
 * Extract tag name from tag string
 * @param {string} tag - Tag like "<div class="foo">"
 * @returns {string} Tag name like "div"
 */
function getTagName(tag) {
    const match = tag.match(/<\/?([a-zA-Z0-9]+)/);
    return match ? match[1].toLowerCase() : '';
}

/**
 * Minify HTML (remove unnecessary whitespace)
 * @param {string} html 
 * @returns {string}
 */
export function minifyHTML(html) {
    return html
        .replace(/\s+/g, ' ')
        .replace(/>\s+</g, '><')
        .replace(/\s+>/g, '>')
        .replace(/<\s+/g, '<')
        .trim();
}
