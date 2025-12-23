/**
 * AI Enhancer - Optional AI-powered code improvement
 * 
 * Uses OpenRouter API to enhance extracted code with:
 * - Semantic component names
 * - Dynamic props instead of hardcoded values
 * - TypeScript interfaces
 * 
 * @module smartExtract/aiEnhancer
 * @version 1.0.0
 */

// ═══════════════════════════════════════════════════════════════════════════
// CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';
const DEFAULT_MODEL = 'z-ai/glm-4.7';

/**
 * Prompt template for code enhancement
 */
const ENHANCE_PROMPT = `Улучши этот React компонент:

1. Дай семантические имена компонентам на основе их содержимого (например, если есть текст "Купить" → назови <BuyButton>)
2. Замени hardcoded текст и данные на пропы
3. Добавь TypeScript интерфейс Props в начале
4. Сохрани ВСЕ CSS классы без изменений
5. Если есть повторяющиеся элементы, используй .map()

Код:
\`\`\`jsx
{CODE}
\`\`\`

Верни ТОЛЬКО улучшенный код без объяснений. Код должен быть в формате:
\`\`\`tsx
// улучшенный код
\`\`\``;

// ═══════════════════════════════════════════════════════════════════════════
// MAIN CLASS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * AIEnhancer - Improves code using LLM
 * 
 * @example
 * const enhancer = new AIEnhancer('sk-or-v1-...');
 * const result = await enhancer.enhance(code);
 */
export class AIEnhancer {
    /**
     * @param {string} apiKey - OpenRouter API key
     * @param {Object} options
     * @param {string} [options.model] - Model to use
     */
    constructor(apiKey, options = {}) {
        this.apiKey = apiKey;
        this.options = {
            model: options.model || DEFAULT_MODEL,
            maxTokens: options.maxTokens || 2000,
            temperature: options.temperature || 0.3
        };
    }

    /**
     * Check if enhancer is properly configured
     * 
     * @returns {boolean}
     */
    isConfigured() {
        return Boolean(this.apiKey && this.apiKey.length > 10);
    }

    /**
     * Enhance code using AI
     * 
     * @param {string} code - Code to enhance
     * @returns {Promise<{success: boolean, code: string, error?: string}>}
     */
    async enhance(code) {
        if (!this.isConfigured()) {
            return {
                success: false,
                code: code,
                error: 'API key not configured'
            };
        }

        try {
            const prompt = ENHANCE_PROMPT.replace('{CODE}', code);

            const response = await fetch(OPENROUTER_URL, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                    'Content-Type': 'application/json',
                    'HTTP-Referer': 'https://ninja-snatch.extension',
                    'X-Title': 'Ninja Snatch'
                },
                body: JSON.stringify({
                    model: this.options.model,
                    messages: [
                        { role: 'user', content: prompt }
                    ],
                    max_tokens: this.options.maxTokens,
                    temperature: this.options.temperature
                })
            });

            if (!response.ok) {
                const error = await response.json().catch(() => ({}));
                return {
                    success: false,
                    code: code,
                    error: error.error?.message || `API error: ${response.status}`
                };
            }

            const data = await response.json();
            const enhancedCode = this._extractCodeFromResponse(data);

            if (!enhancedCode) {
                return {
                    success: false,
                    code: code,
                    error: 'Failed to extract code from response'
                };
            }

            return {
                success: true,
                code: enhancedCode
            };

        } catch (error) {
            console.error('[AIEnhancer] Error:', error);
            return {
                success: false,
                code: code,
                error: error.message || 'Network error'
            };
        }
    }

    /**
     * Validate API key by making a test request
     * 
     * @returns {Promise<{valid: boolean, error?: string}>}
     */
    async validateApiKey() {
        if (!this.apiKey) {
            return { valid: false, error: 'No API key provided' };
        }

        try {
            const response = await fetch(OPENROUTER_URL, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    model: this.options.model,
                    messages: [{ role: 'user', content: 'Hi' }],
                    max_tokens: 5
                })
            });

            if (response.ok) {
                return { valid: true };
            }

            const error = await response.json().catch(() => ({}));
            return {
                valid: false,
                error: error.error?.message || `Invalid key: ${response.status}`
            };

        } catch (error) {
            return { valid: false, error: error.message };
        }
    }

    // ═══════════════════════════════════════════════════════════════════════
    // UTILITIES
    // ═══════════════════════════════════════════════════════════════════════

    /**
     * Extract code from API response
     * @private
     */
    _extractCodeFromResponse(data) {
        try {
            const content = data.choices?.[0]?.message?.content;
            if (!content) return null;

            // Try to extract code from markdown code blocks
            const codeBlockMatch = content.match(/```(?:tsx?|jsx?)?\n([\s\S]*?)\n```/);
            if (codeBlockMatch) {
                return codeBlockMatch[1].trim();
            }

            // If no code block, return cleaned content
            return content.trim();

        } catch (error) {
            console.error('[AIEnhancer] Failed to extract code:', error);
            return null;
        }
    }

    /**
     * Update API key
     * 
     * @param {string} newApiKey 
     */
    setApiKey(newApiKey) {
        this.apiKey = newApiKey;
    }
}

// ═══════════════════════════════════════════════════════════════════════════
// STANDALONE FUNCTION
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Enhance code with AI
 * Standalone function for direct usage
 * 
 * @param {string} code 
 * @param {string} apiKey 
 * @param {Object} options 
 * @returns {Promise<{success: boolean, code: string}>}
 */
export async function enhanceWithAI(code, apiKey, options = {}) {
    const enhancer = new AIEnhancer(apiKey, options);
    return enhancer.enhance(code);
}

// Default export
export default AIEnhancer;
