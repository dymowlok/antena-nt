import { gsap } from 'gsap';
import ScrollTrigger from 'gsap/ScrollTrigger';
import { debugLog } from './utils/debug.js';

gsap.registerPlugin(ScrollTrigger);

// Section-level blur/fade-in animation
function createSectionBlurFadeIn(section) {
    // Skip if already animated
    if (section.dataset.animated === 'true') return;

    // Mark section as animated
    section.dataset.animated = 'true';

    // Set initial state (hidden with blur)
    gsap.set(section, {
        opacity: 0,
        filter: 'blur(8px)',
        y: 50,
        pointerEvents: 'none'
    });

    // Create animation - ONCE ONLY
    const tl = gsap.timeline({
        scrollTrigger: {
            trigger: section,
            start: "top 85%",
            once: true, // ONCE ONLY
            toggleActions: "play none none none",
            onStart: () => {
                debugLog('🎯 Section blur fade-in animating:', section.id || section.className);
            }
        }
    });

    // Fade in and remove blur
    tl.to(section, {
        opacity: 1,
        filter: 'blur(0px)',
        y: 0,
        pointerEvents: 'auto',
        duration: 0.8,
        ease: 'power2.out'
    });

    return tl;
}

// Setup section blur fade-in
export function setupBlurFadeIn() {
    debugLog('🎨 Setting up section blur fade-in animations...');

    // Get all main sections
    const sections = document.querySelectorAll('main > section, footer');

    sections.forEach(section => {
        createSectionBlurFadeIn(section);
    });

    debugLog(`✅ Setup section blur fade-in for ${sections.length} sections`);
}

// Reinitialize section blur fade-in (for dynamic content)
export function reinitializeBlurFadeIn() {
    debugLog('🔄 Reinitializing section blur fade-in...');

    // Kill existing ScrollTriggers
    ScrollTrigger.getAll().forEach(trigger => {
        if (trigger.vars.onStart && trigger.vars.onStart.toString().includes('Section blur fade-in animating')) {
            trigger.kill();
        }
    });

    // Reset animated state
    document.querySelectorAll('[data-animated="true"]').forEach(element => {
        delete element.dataset.animated;
    });

    // Setup again
    setupBlurFadeIn();
}

// Animate specific section
export function animateSpecificSection(selector, config = {}) {
    const section = document.querySelector(selector);
    if (!section) {
        debugLog('❌ Section not found:', selector);
        return;
    }

    // Reset section state
    delete section.dataset.animated;

    // Create animation
    createSectionBlurFadeIn(section);
}

// Debug function
export function debugBlurFadeIn() {
    const animatedSections = document.querySelectorAll('[data-animated="true"]');
    debugLog('🎨 Section blur fade-in debug:', {
        totalAnimated: animatedSections.length,
        sections: Array.from(animatedSections).map(section => ({
            id: section.id,
            className: section.className
        }))
    });
}

// Export debug function to window
window.debugBlurFadeIn = debugBlurFadeIn; 