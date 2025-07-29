// main.js – UPDATED VERSION (unified header management, removed text reveal)

import '../styles/main.scss';
import './theme.js';
import './themeManager.js'; // Initialize theme manager
import { debugLog, debugWarn } from './utils/debug.js';

import { loadHeroLottie } from './lottie.js';
loadHeroLottie();

import { setupAboutSection } from './about.js';
setupAboutSection();

// Import unified header manager
import headerManager from './unifiedHeaderManager.js';

// Blur fade-in functionality
import { setupBlurFadeIn, reinitializeBlurFadeIn } from './blurFadeIn.js';

// Setup blur fade-in animations
setupBlurFadeIn();

// Add resize handler for blur fade-in and testimonials - DESKTOP ONLY
let resizeTimeout;
window.addEventListener('resize', () => {
    // Only reinitialize on desktop (≥900px)
    if (window.innerWidth >= 900) {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
            reinitializeBlurFadeIn();
            reinitializeTestimonialsAnimations();
        }, 300);
    }
});

import { setupServicesSection } from './servicesSection.js';
setupServicesSection();

// Testimonials animations
import { setupTestimonialsAnimations, reinitializeTestimonialsAnimations } from './testimonials.js';
setupTestimonialsAnimations();
