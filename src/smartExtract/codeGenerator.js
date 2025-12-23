/**
 * Code Generator - Generates React/HTML code from normalized tree
 * 
 * Takes the normalized element tree from StyleNormalizer and
 * generates clean, readable output code.
 * 
 * @module smartExtract/codeGenerator
 * @version 1.0.0
 */

// ═══════════════════════════════════════════════════════════════════════════
// CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Self-closing HTML tags
 */
const SELF_CLOSING_TAGS = new Set([
    'img', 'br', 'hr', 'input', 'meta', 'link', 'area', 'base',
    'col', 'embed', 'param', 'source', 'track', 'wbr'
]);

/**
 * Indent string (2 spaces)
 */
const INDENT = '  ';

// ═══════════════════════════════════════════════════════════════════════════
// MAIN CLASS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * CodeGenerator - Creates output code from normalized tree
 * 
 * @example
 * const generator = new CodeGenerator('react-tailwind');
 * const code = generator.generate(normalizedTree);
 */
export class CodeGenerator {
    /**
     * @param {string} format - Output format ('react-tailwind' | 'html-tailwind')
     */
    constructor(format = 'react-tailwind') {
        this.format = format;
    }

    /**
     * Generate code from normalized tree
     * 
     * @param {Object} tree - Normalized tree from StyleNormalizer
     * @returns {string} Generated code
     */
    generate(tree) {
        if (this.format === 'react-tailwind') {
            return this._generateReact(tree);
        } else {
            return this._generateHTML(tree);
        }
    }

    // ═══════════════════════════════════════════════════════════════════════
    // REACT GENERATION
    // ═══════════════════════════════════════════════════════════════════════

    /**
     * Generate React component
     * @private
     */
    _generateReact(tree) {
        const componentName = this._inferComponentName(tree);
        const jsxContent = this._nodeToJSX(tree, 0);

        // Check if there are repeating patterns
        const hasPatterns = tree.patterns && tree.patterns.length > 0;

        let code = '';

        // Add comment with extraction info
        code += `// Extracted with Ninja Snatch - Smart Extract\n`;
        code += `// Source: ${typeof window !== 'undefined' ? window.location.hostname : 'unknown'}\n\n`;

        if (hasPatterns) {
            code += `// Note: ${tree.patterns.length} repeating pattern(s) detected\n`;
            code += `// Consider extracting into separate components\n\n`;
        }

        // Component wrapper
        code += `const ${componentName} = () => {\n`;
        code += `  return (\n`;
        code += jsxContent;
        code += `  );\n`;
        code += `};\n\n`;
        code += `export default ${componentName};\n`;

        return code;
    }

    /**
     * Convert node to JSX string
     * @private
     */
    _nodeToJSX(node, depth) {
        const indent = INDENT.repeat(depth + 2);
        const childIndent = INDENT.repeat(depth + 3);

        // Build props
        const props = [];

        // className
        if (node.className) {
            props.push(`className="${node.className}"`);
        }

        // Other attributes
        for (const [key, value] of Object.entries(node.attributes || {})) {
            // Convert common HTML attributes to React equivalents
            const reactKey = this._toReactAttr(key);
            props.push(`${reactKey}="${value}"`);
        }

        const propsString = props.length > 0 ? ' ' + props.join(' ') : '';
        const tagName = node.tagName;

        // Self-closing tags
        if (SELF_CLOSING_TAGS.has(tagName) && !node.children?.length) {
            return `${indent}<${tagName}${propsString} />\n`;
        }

        // Tag with children
        let result = `${indent}<${tagName}${propsString}>\n`;

        // Text content
        if (node.textContent) {
            result += `${childIndent}${this._escapeJSX(node.textContent)}\n`;
        }

        // Children
        for (const child of (node.children || [])) {
            result += this._nodeToJSX(child, depth + 1);
        }

        result += `${indent}</${tagName}>\n`;

        return result;
    }

    /**
     * Infer component name from content
     * @private
     */
    _inferComponentName(tree) {
        // Try to find meaningful name from content
        const text = this._extractTextContent(tree).toLowerCase();

        // Common patterns
        if (text.includes('hero') || text.includes('welcome')) return 'HeroSection';
        if (text.includes('footer') || text.includes('copyright')) return 'Footer';
        if (text.includes('nav') || text.includes('menu')) return 'Navigation';
        if (text.includes('header')) return 'Header';
        if (text.includes('card') || text.includes('item')) return 'Card';
        if (text.includes('button') || text.includes('click')) return 'Button';
        if (text.includes('form') || text.includes('submit')) return 'Form';

        // Default based on tag
        const tagMap = {
            'section': 'Section',
            'article': 'Article',
            'nav': 'Navigation',
            'header': 'Header',
            'footer': 'Footer',
            'aside': 'Sidebar',
            'main': 'MainContent',
            'div': 'Component',
        };

        return tagMap[tree.tagName] || 'ExtractedComponent';
    }

    /**
     * Extract all text from tree
     * @private
     */
    _extractTextContent(node) {
        let text = node.textContent || '';
        for (const child of (node.children || [])) {
            text += ' ' + this._extractTextContent(child);
        }
        return text.trim();
    }

    /**
     * Convert HTML attribute to React equivalent
     * @private
     */
    _toReactAttr(attr) {
        const map = {
            'class': 'className',
            'for': 'htmlFor',
            'tabindex': 'tabIndex',
            'readonly': 'readOnly',
            'maxlength': 'maxLength',
            'cellspacing': 'cellSpacing',
            'cellpadding': 'cellPadding',
            'rowspan': 'rowSpan',
            'colspan': 'colSpan',
            'enctype': 'encType',
            'contenteditable': 'contentEditable',
            'autocomplete': 'autoComplete',
            'autofocus': 'autoFocus',
            'srcset': 'srcSet',
        };
        return map[attr.toLowerCase()] || attr;
    }

    /**
     * Escape special JSX characters
     * @private
     */
    _escapeJSX(text) {
        return text
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/{/g, '&#123;')
            .replace(/}/g, '&#125;');
    }

    // ═══════════════════════════════════════════════════════════════════════
    // HTML GENERATION
    // ═══════════════════════════════════════════════════════════════════════

    /**
     * Generate HTML with Tailwind
     * @private
     */
    _generateHTML(tree) {
        let html = '';

        html += `<!-- Extracted with Ninja Snatch - Smart Extract -->\n`;
        html += `<!-- Source: ${typeof window !== 'undefined' ? window.location.hostname : 'unknown'} -->\n\n`;

        html += this._nodeToHTML(tree, 0);

        return html;
    }

    /**
     * Convert node to HTML string
     * @private
     */
    _nodeToHTML(node, depth) {
        const indent = INDENT.repeat(depth);
        const childIndent = INDENT.repeat(depth + 1);

        // Build attributes
        const attrs = [];

        if (node.className) {
            attrs.push(`class="${node.className}"`);
        }

        for (const [key, value] of Object.entries(node.attributes || {})) {
            attrs.push(`${key}="${value}"`);
        }

        const attrsString = attrs.length > 0 ? ' ' + attrs.join(' ') : '';
        const tagName = node.tagName;

        // Self-closing tags
        if (SELF_CLOSING_TAGS.has(tagName) && !node.children?.length) {
            return `${indent}<${tagName}${attrsString}>\n`;
        }

        // Tag with children
        let result = `${indent}<${tagName}${attrsString}>\n`;

        // Text content
        if (node.textContent) {
            result += `${childIndent}${node.textContent}\n`;
        }

        // Children
        for (const child of (node.children || [])) {
            result += this._nodeToHTML(child, depth + 1);
        }

        result += `${indent}</${tagName}>\n`;

        return result;
    }
}

// ═══════════════════════════════════════════════════════════════════════════
// STANDALONE FUNCTION
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Generate code from normalized tree
 * Standalone function for direct usage
 * 
 * @param {Object} tree 
 * @param {string} format 
 * @returns {string}
 */
export function generateCode(tree, format = 'react-tailwind') {
    const generator = new CodeGenerator(format);
    return generator.generate(tree);
}

// Default export
export default CodeGenerator;
