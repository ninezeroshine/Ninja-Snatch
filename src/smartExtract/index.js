/**
 * Smart Extract Pipeline - Main Entry Point
 * 
 * Modular, extensible architecture for clean code extraction.
 * Each stage can optionally be enhanced with AI capabilities.
 * 
 * @module smartExtract
 * @version 1.0.0
 */

// ═══════════════════════════════════════════════════════════════════════════
// IMPORTS
// ═══════════════════════════════════════════════════════════════════════════

import { FrameworkDetector } from './frameworkDetector.js';
import { PatternRecognizer } from './patternRecognizer.js';
import { StyleNormalizer } from './styleNormalizer.js';
import { AIEnhancer } from './aiEnhancer.js';
import { CodeGenerator } from './codeGenerator.js';

// ═══════════════════════════════════════════════════════════════════════════
// MAIN PIPELINE CLASS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Smart Extract Pipeline - Orchestrates all stages
 * 
 * Architecture allows each stage to:
 * 1. Work independently (testable)
 * 2. Be enhanced with AI (extensible)
 * 3. Be replaced/upgraded (modular)
 */
export class SmartExtractPipeline {
    /**
     * @param {Object} options - Pipeline configuration
     * @param {string} [options.targetFormat='react-tailwind'] - Output format
     * @param {string} [options.apiKey] - OpenRouter API key for AI enhancement
     * @param {boolean} [options.enableAI=false] - Enable AI enhancement
     */
    constructor(options = {}) {
        this.options = {
            targetFormat: options.targetFormat || 'react-tailwind',
            apiKey: options.apiKey || null,
            enableAI: options.enableAI || false
        };

        // Initialize stages (each is independently injectable/replaceable)
        this.stages = {
            detector: new FrameworkDetector(),
            recognizer: new PatternRecognizer(),
            normalizer: new StyleNormalizer(),
            enhancer: new AIEnhancer(this.options.apiKey),
            generator: new CodeGenerator(this.options.targetFormat)
        };
    }

    /**
     * Process an element through the entire pipeline
     * 
     * @param {HTMLElement} element - Element to extract
     * @returns {Promise<{code: string, metadata: Object}>}
     */
    async process(element) {
        const metadata = {
            startTime: Date.now(),
            stages: {}
        };

        try {
            // Stage 1: Framework Detection
            const frameworkInfo = this.stages.detector.detect(document);
            metadata.stages.detector = frameworkInfo;

            // Stage 2: Pattern Recognition
            const patterns = this.stages.recognizer.analyze(element, frameworkInfo);
            metadata.stages.recognizer = {
                patternsFound: patterns.length,
                types: patterns.map(p => p.type)
            };

            // Stage 3: Style Normalization
            const normalizedTree = this.stages.normalizer.normalize(element, patterns, frameworkInfo);
            metadata.stages.normalizer = {
                classesGenerated: normalizedTree.totalClasses
            };

            // Stage 4: Code Generation (deterministic)
            let code = this.stages.generator.generate(normalizedTree);

            // Stage 5: AI Enhancement (optional)
            if (this.options.enableAI && this.options.apiKey) {
                const enhanced = await this.stages.enhancer.enhance(code);
                if (enhanced.success) {
                    code = enhanced.code;
                    metadata.stages.enhancer = { applied: true };
                } else {
                    metadata.stages.enhancer = { applied: false, error: enhanced.error };
                }
            }

            metadata.endTime = Date.now();
            metadata.duration = metadata.endTime - metadata.startTime;

            return { code, metadata };
        } catch (error) {
            metadata.error = error.message;
            throw error;
        }
    }

    /**
     * Replace a stage with a custom implementation
     * Useful for adding AI to individual stages in the future
     * 
     * @param {string} stageName - Name of stage to replace
     * @param {Object} implementation - Custom stage implementation
     */
    replaceStage(stageName, implementation) {
        if (!this.stages[stageName]) {
            throw new Error(`Unknown stage: ${stageName}`);
        }
        this.stages[stageName] = implementation;
    }
}

// ═══════════════════════════════════════════════════════════════════════════
// EXPORTS FOR INDIVIDUAL STAGE USAGE
// ═══════════════════════════════════════════════════════════════════════════

export { FrameworkDetector } from './frameworkDetector.js';
export { PatternRecognizer } from './patternRecognizer.js';
export { StyleNormalizer } from './styleNormalizer.js';
export { AIEnhancer } from './aiEnhancer.js';
export { CodeGenerator } from './codeGenerator.js';

// Default export for easy usage
export default SmartExtractPipeline;
