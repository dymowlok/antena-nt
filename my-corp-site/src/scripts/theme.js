// theme.js – UPDATED VERSION (header management removed, only theme interpolation)

import { gsap } from 'gsap';
import ScrollTrigger from 'gsap/ScrollTrigger';
import { debugLog, debugWarn, debugError } from './utils/debug.js';

gsap.registerPlugin(ScrollTrigger);

// Theme interpolation functionality only
// Header management moved to unifiedHeaderManager.js

export function setupThemeInterpolation() {
    debugLog('🎨 Setting up theme interpolation...');

    // Theme interpolation logic can be added here if needed
    // Currently handled by themeManager.js
}

// Export for compatibility
export { setupThemeInterpolation as initializeHeader };