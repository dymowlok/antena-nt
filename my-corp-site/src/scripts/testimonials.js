import { gsap } from 'gsap';
import ScrollTrigger from 'gsap/ScrollTrigger';
import { debugLog } from './utils/debug.js';

gsap.registerPlugin(ScrollTrigger);

// Animation configuration
const TESTIMONIALS_CONFIG = {
    // Mobile order (pocket) - only second row is visible
    pocket: {
        order: [1, 2, 3, 4], // 4 items from the second row
        stagger: 0.1, // Much faster stagger
        duration: 0.4, // Faster animation
        y: 8, // Much smaller fade-up movement
        opacity: 0
    },
    // Desktop order (lap-and-up) - all rows visible
    desktop: {
        order: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10], // All 10 items across 3 rows
        stagger: 0.08, // Much faster stagger
        duration: 0.3, // Faster animation
        y: 10, // Much smaller fade-up movement
        opacity: 0
    }
};

// Footer animation configuration
const FOOTER_CONFIG = {
    delay: 0.05, // Very short delay after last testimonial item starts
    duration: 0.4, // Faster footer animation
    y: 20,
    opacity: 0
};

// Get current breakpoint
function getCurrentBreakpoint() {
    const width = window.innerWidth;
    if (width <= 899) {
        return 'pocket';
    } else {
        return 'desktop';
    }
}

// Get testimonial items in the correct order
function getTestimonialItems() {
    const breakpoint = getCurrentBreakpoint();
    const config = TESTIMONIALS_CONFIG[breakpoint];

    const allItems = document.querySelectorAll('.testimonials-item');
    const orderedItems = [];

    if (breakpoint === 'pocket') {
        // On mobile, only get items from the second row (index 3-6)
        const secondRowItems = Array.from(allItems).slice(3, 7);
        config.order.forEach(index => {
            if (secondRowItems[index - 1]) {
                orderedItems.push(secondRowItems[index - 1]);
            }
        });
    } else {
        // On desktop, get all items individually in the specified order
        config.order.forEach(index => {
            if (allItems[index - 1]) {
                orderedItems.push(allItems[index - 1]);
            }
        });
    }

    return orderedItems;
}

// Create testimonial item animation
function createTestimonialAnimation(item, index, config) {
    // Set initial state
    gsap.set(item, {
        opacity: config.opacity,
        y: config.y,
        pointerEvents: 'none'
    });

    // Create animation without scroll trigger - will be controlled by main timeline
    const tl = gsap.timeline();

    // Add callback to the timeline
    tl.eventCallback("onStart", () => {
        debugLog(`🎯 Testimonial item ${index + 1} animating`);
    });

    // Fade in with slight movement - focus on opacity
    tl.to(item, {
        opacity: 1,
        y: 0,
        pointerEvents: 'auto',
        duration: config.duration,
        ease: 'power1.out', // Smoother ease for better opacity transition
        overwrite: 'auto'
    });

    return tl;
}

// Setup footer animation
function setupFooterAnimation(mainTl, itemCount, config, breakpoint) {
    const footer = document.querySelector('.testimonials-footer');
    if (!footer) {
        debugLog('❌ Testimonials footer not found');
        return;
    }

    // Set initial state
    gsap.set(footer, {
        opacity: FOOTER_CONFIG.opacity,
        y: FOOTER_CONFIG.y,
        pointerEvents: 'none'
    });

    // Calculate when footer should appear (right after last item starts animating)
    // For mobile: after the 4th item starts (index 3)
    // For desktop: after the 10th item starts (index 9)
    const lastItemIndex = breakpoint === 'pocket' ? 3 : 9;
    const footerDelay = lastItemIndex * config.stagger + FOOTER_CONFIG.delay;

    // Add footer animation to main timeline
    mainTl.to(footer, {
        opacity: 1,
        y: 0,
        pointerEvents: 'auto',
        duration: FOOTER_CONFIG.duration,
        ease: 'power2.out'
    }, footerDelay);

    // Setup fade out when leaving testimonials section
    // setupFooterFadeOut(footer); // COMMENTED OUT FOR TESTING

    // Setup footer background gradient animation
    setupFooterBackgroundAnimation(footer);

    // Set initial gradient to orange - ONLY TWO POINTS
    gsap.set(footer, { background: 'linear-gradient(0deg, rgba(255, 96, 60, 1) 50%, rgba(255, 96, 60, 0) 100%)' });

    // Reset footer elements opacity to 1 initially
    const footerElements = footer.querySelectorAll('*');
    footerElements.forEach(element => {
        gsap.set(element, { opacity: 1 });
    });

    // Reset testimonial items opacity to 1 initially
    const testimonialItems = document.querySelectorAll('.testimonials-item');
    testimonialItems.forEach(item => {
        gsap.set(item, { opacity: 1 });
    });
}

// Setup footer fade out when leaving testimonials section
function setupFooterFadeOut(footer) {
    const testimonialsSection = document.querySelector('.testimonials');
    if (!testimonialsSection) return;

    // Create fade out animation - faster and more responsive
    const fadeOutTl = gsap.timeline({
        scrollTrigger: {
            trigger: testimonialsSection,
            start: "bottom 70%", // Start fading out even earlier
            end: "bottom 20%",    // End fading out sooner
            toggleActions: "play reverse play reverse",
            onEnter: () => {
                debugLog('🎯 Testimonials footer fading out');
            },
            onEnterBack: () => {
                debugLog('🎯 Testimonials footer fading in');
            }
        }
    });

    // Fade out when leaving section - faster animation
    fadeOutTl.to(footer, {
        opacity: 0,
        y: -20,
        duration: 0.15, // Even faster fade out
        ease: 'power2.in'
    });
}

// Setup footer background gradient animation based on data-theme
function setupFooterBackgroundAnimation(footer) {
    const testimonialsSection = document.querySelector('.testimonials');
    if (!testimonialsSection || !footer) {
        debugLog('❌ Testimonials section or footer not found');
        return;
    }

    // Get all sections with data-theme
    const sections = document.querySelectorAll('[data-theme]');
    debugLog('📋 Found sections with data-theme:', sections.length);

    // Find testimonials section index
    let testimonialsIndex = -1;
    sections.forEach((section, index) => {
        if (section === testimonialsSection) {
            testimonialsIndex = index;
        }
    });

    if (testimonialsIndex === -1) {
        debugLog('❌ Testimonials section not found in data-theme sections');
        return;
    }

    // Get current and next themes
    const currentTheme = 'orange'; // Always start with orange
    const nextSection = sections[testimonialsIndex + 1];
    const nextTheme = nextSection?.getAttribute('data-theme') || 'white'; // Default to white if no next section

    debugLog('🔍 Section analysis:', {
        testimonialsIndex,
        currentTheme,
        nextSection: nextSection?.id || 'none',
        nextTheme
    });

    if (!currentTheme || !nextTheme) {
        debugLog('❌ Missing themes for footer gradient animation');
        return;
    }

    debugLog('🎨 Footer gradient animation setup for themes:', currentTheme, '→', nextTheme);

    // Create gradient animation trigger - sync with body background changes
    const gradientTrigger = ScrollTrigger.create({
        trigger: testimonialsSection,
        start: 'bottom 90%', // Start very early to catch the transition
        end: 'bottom 10%',   // End very late to ensure smooth transition
        scrub: 1, // Smooth scrubbing
        onUpdate: (self) => {
            console.log('🎯 ScrollTrigger onUpdate fired! Progress:', self.progress.toFixed(3)); // Debug log
            // Sync with body background color changes
            const bodyBgColor = window.getComputedStyle(document.body).backgroundColor;
            const progress = calculateProgressFromBodyColor(bodyBgColor, currentTheme, nextTheme);

            debugLog(`🔄 Footer sync - Body: ${bodyBgColor}, Progress: ${progress.toFixed(3)}`);

            // Always animate the gradient - never let it disappear
            animateFooterGradient(currentTheme, nextTheme, progress, footer);
            animateFooterElementsOpacity(progress, footer);
            animateTestimonialItemsOpacity(progress);
        },
        onEnter: () => {
            debugLog('🎯 Footer gradient animation started');
        },
        onLeave: () => {
            debugLog('🎯 Footer gradient animation completed');
        }
    });

    // Also setup direct body background monitoring for immediate sync
    setupDirectBodyMonitoring(footer, currentTheme, nextTheme);

    // Setup gradient persistence check to ensure gradient never disappears
    setupGradientPersistenceCheck(footer, currentTheme, nextTheme);
}

// Animate footer background gradient
function animateFooterGradient(fromTheme, toTheme, progress, footer) {
    // Define gradient colors for each theme (matching actual SCSS colors)
    const gradientColors = {
        white: { from: 'rgba(255, 255, 255, 1)', to: 'rgba(255, 255, 255, 0)' },
        light: { from: 'rgba(242, 242, 242, 1)', to: 'rgba(242, 242, 242, 0)' }, // #f2f2f2
        indigo: { from: 'rgba(124, 124, 248, 1)', to: 'rgba(124, 124, 248, 0)' }, // #7c7cf8
        sky: { from: 'rgba(175, 217, 250, 1)', to: 'rgba(175, 217, 250, 0)' }, // #afd9fa
        blue: { from: 'rgba(61, 118, 247, 1)', to: 'rgba(61, 118, 247, 0)' }, // #3d76f7
        orange: { from: 'rgba(255, 96, 60, 1)', to: 'rgba(255, 96, 60, 0)' }, // #ff603c
        black: { from: 'rgba(0, 0, 0, 1)', to: 'rgba(0, 0, 0, 0)' },
        gray: { from: 'rgba(102, 102, 102, 1)', to: 'rgba(102, 102, 102, 0)' } // #666
    };

    const fromColors = gradientColors[fromTheme] || gradientColors.orange;
    const toColors = gradientColors[toTheme] || gradientColors.white;

    debugLog(`🎨 Animating footer gradient: ${fromTheme} → ${toTheme}, progress: ${progress.toFixed(2)}`);

    // Interpolate colors
    const fromRGB = gsap.utils.splitColor(fromColors.from);
    const toRGB = gsap.utils.splitColor(toColors.from);
    const fromToRGB = gsap.utils.splitColor(fromColors.to);
    const toToRGB = gsap.utils.splitColor(toColors.to);

    const interpolatedFrom = fromRGB.map((c, i) =>
        Math.round(gsap.utils.interpolate(c, toRGB[i], progress))
    );
    const interpolatedTo = fromToRGB.map((c, i) =>
        Math.round(gsap.utils.interpolate(c, toToRGB[i], progress))
    );

    const fromColor = `rgba(${interpolatedFrom.join(',')})`;
    const toColor = `rgba(${interpolatedTo.join(',')})`;

    // Update footer background gradient - ONLY TWO POINTS: bottom (full color) and top (transparent)
    footer.style.background = `linear-gradient(0deg, ${fromColor} 50%, ${toColor} 100%)`;

    debugLog(`🎨 Footer gradient updated: ${fromColor} → ${toColor}`);

    // Force a repaint to ensure the gradient updates
    footer.style.transform = 'translateZ(0)';
}

// Calculate progress based on body background color changes
function calculateProgressFromBodyColor(bodyBgColor, fromTheme, toTheme) {
    // Extract RGB values from body background color
    const rgbMatch = bodyBgColor.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
    if (!rgbMatch) return 0;

    const r = parseInt(rgbMatch[1]);
    const g = parseInt(rgbMatch[2]);
    const b = parseInt(rgbMatch[3]);

    // Theme colors from themeManager.js
    const themeColors = {
        white: [255, 255, 255],
        light: [242, 242, 242],
        indigo: [124, 124, 248],
        sky: [175, 217, 250],
        blue: [61, 118, 247],
        orange: [255, 96, 60],
        black: [0, 0, 0],
        gray: [242, 242, 242]
    };

    const fromRGB = themeColors[fromTheme] || themeColors.orange;
    const toRGB = themeColors[toTheme] || themeColors.white;

    // Calculate progress based on color interpolation
    // For orange to white transition, use red channel as primary indicator
    const redDiff = Math.abs(fromRGB[0] - toRGB[0]);
    const greenDiff = Math.abs(fromRGB[1] - toRGB[1]);
    const blueDiff = Math.abs(fromRGB[2] - toRGB[2]);

    let progress = 0;

    // For orange (255, 96, 60) to white (255, 255, 255) transition
    if (fromRGB[0] === 255 && toRGB[0] === 255) {
        // Red stays the same, use green channel (96 -> 255)
        progress = Math.abs(fromRGB[1] - g) / Math.abs(fromRGB[1] - toRGB[1]);
    } else {
        // Fallback to biggest difference
        if (redDiff >= greenDiff && redDiff >= blueDiff) {
            progress = Math.abs(fromRGB[0] - r) / redDiff;
        } else if (greenDiff >= blueDiff) {
            progress = Math.abs(fromRGB[1] - g) / greenDiff;
        } else {
            progress = Math.abs(fromRGB[2] - b) / blueDiff;
        }
    }

    // Clamp progress between 0 and 1
    progress = Math.max(0, Math.min(1, progress));

    debugLog(`🎨 Body color progress: ${progress.toFixed(3)} (RGB: ${r}, ${g}, ${b})`);

    return progress;
}

// Setup direct body background monitoring for immediate sync
function setupDirectBodyMonitoring(footer, fromTheme, toTheme) {
    // Create a MutationObserver to watch for body background color changes
    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            if (mutation.type === 'attributes' && mutation.attributeName === 'style') {
                const body = document.body;
                const bodyBgColor = window.getComputedStyle(body).backgroundColor;

                // Only react to changes that are part of the theme transition
                if (bodyBgColor.includes('255, 255, 255') || bodyBgColor.includes('rgb(255, 255, 255)')) {
                    debugLog('🎨 Direct body monitoring - background changed to white');

                    // Calculate progress based on body color
                    const progress = calculateProgressFromBodyColor(bodyBgColor, fromTheme, toTheme);

                    // Update footer immediately
                    animateFooterGradient(fromTheme, toTheme, progress, footer);
                    animateFooterElementsOpacity(progress, footer);
                    animateTestimonialItemsOpacity(progress);
                }
            }
        });
    });

    // Start observing body style changes
    observer.observe(document.body, {
        attributes: true,
        attributeFilter: ['style']
    });

    debugLog('🔍 Setup direct body background monitoring');
}

// Setup gradient persistence check to ensure gradient never disappears
function setupGradientPersistenceCheck(footer, fromTheme, toTheme) {
    // Check every 100ms to ensure gradient is always present
    const checkInterval = setInterval(() => {
        const currentBg = footer.style.background;

        // If gradient is missing or empty, restore it
        if (!currentBg || !currentBg.includes('linear-gradient')) {
            debugLog('🛡️ Gradient missing - restoring...');

            // Get current body background to calculate progress
            const bodyBgColor = window.getComputedStyle(document.body).backgroundColor;
            const progress = calculateProgressFromBodyColor(bodyBgColor, fromTheme, toTheme);

            // Restore gradient with current progress
            animateFooterGradient(fromTheme, toTheme, progress, footer);
        }
    }, 100);

    // Store interval ID for cleanup
    footer.setAttribute('data-gradient-interval', checkInterval.toString());

    debugLog('🛡️ Setup gradient persistence check');
}

// Animate footer elements opacity based on scroll progress
function animateFooterElementsOpacity(progress, footer) {
    const footerElements = footer.querySelectorAll('*');

    if (footerElements.length === 0) {
        debugLog('❌ No footer elements found for opacity animation');
        return;
    }

    // Calculate opacity: starts at 1, goes to 0 as progress reaches 1
    // Use a more aggressive curve for faster fade-out
    const opacity = Math.max(0, 1 - (progress * progress * progress * progress)); // Quartic curve for even faster fade

    footerElements.forEach(element => {
        gsap.set(element, { opacity: opacity });
    });

    debugLog(`🎭 Footer elements opacity: ${opacity.toFixed(3)} (progress: ${progress.toFixed(3)}) - Elements: ${footerElements.length}`);
}

// Animate testimonial items opacity based on scroll progress
function animateTestimonialItemsOpacity(progress) {
    const testimonialItems = document.querySelectorAll('.testimonials-item');

    if (testimonialItems.length === 0) {
        debugLog('❌ No testimonial items found for opacity animation');
        return;
    }

    // Calculate opacity: starts at 1, goes to 0 as progress reaches 1
    // Use a more aggressive curve for faster fade-out
    const opacity = Math.max(0, 1 - (progress * progress * progress * progress)); // Quartic curve for even faster fade

    testimonialItems.forEach(item => {
        gsap.set(item, { opacity: opacity });
    });

    debugLog(`🎭 Testimonial items opacity: ${opacity.toFixed(3)} (progress: ${progress.toFixed(3)}) - Items: ${testimonialItems.length}`);
}

// Get scroll distance based on screen size
function getScrollDistance() {
    return window.matchMedia('(max-width: 899px)').matches ? 120 : 240;
}

// Setup testimonials animations
export function setupTestimonialsAnimations() {
    debugLog('🎨 Setting up testimonials animations...');

    const breakpoint = getCurrentBreakpoint();
    const config = TESTIMONIALS_CONFIG[breakpoint];
    const items = getTestimonialItems();

    if (items.length === 0) {
        debugLog('❌ No testimonial items found');
        return;
    }

    debugLog(`📱 Breakpoint: ${breakpoint}, Items: ${items.length}`);

    // Create main timeline for testimonials section
    const testimonialsSection = document.querySelector('.testimonials');
    if (!testimonialsSection) {
        debugLog('❌ Testimonials section not found');
        return;
    }

    // Create main timeline with scroll trigger
    const mainTl = gsap.timeline({
        scrollTrigger: {
            trigger: testimonialsSection,
            start: "top 85%",
            once: true,
            toggleActions: "play none none none"
        }
    });

    // Add testimonial items to main timeline with stagger
    items.forEach((item, index) => {
        const tl = createTestimonialAnimation(item, index, config);
        mainTl.add(tl, index * config.stagger);
    });

    // Setup footer animation
    setupFooterAnimation(mainTl, items.length, config, breakpoint);

    debugLog(`✅ Setup testimonials animations for ${items.length} items`);
}

// Reinitialize testimonials animations (for responsive changes)
export function reinitializeTestimonialsAnimations() {
    debugLog('🔄 Reinitializing testimonials animations...');

    // Kill existing ScrollTriggers for testimonials and footer
    ScrollTrigger.getAll().forEach(trigger => {
        const triggerElement = trigger.vars.trigger;
        if (triggerElement && typeof triggerElement === 'object' && 'classList' in triggerElement) {
            if (triggerElement.classList.contains('testimonials-item') ||
                triggerElement.classList.contains('testimonials-footer') ||
                triggerElement.classList.contains('testimonials')) {
                trigger.kill();
            }
        }

        // Kill gradient animation triggers
        if (trigger.vars.onUpdate && trigger.vars.onUpdate.toString().includes('animateFooterGradient')) {
            trigger.kill();
        }

        // Kill opacity animation triggers
        if (trigger.vars.onUpdate && trigger.vars.onUpdate.toString().includes('animateFooterElementsOpacity')) {
            trigger.kill();
        }

        // Kill testimonial items opacity animation triggers
        if (trigger.vars.onUpdate && trigger.vars.onUpdate.toString().includes('animateTestimonialItemsOpacity')) {
            trigger.kill();
        }
    });

    // Reset opacity of testimonial items and footer elements
    const testimonialItems = document.querySelectorAll('.testimonials-item');
    const footer = document.querySelector('.testimonials-footer');

    testimonialItems.forEach(item => {
        gsap.set(item, { opacity: 1 });
    });

    if (footer) {
        const footerElements = footer.querySelectorAll('*');
        footerElements.forEach(element => {
            gsap.set(element, { opacity: 1 });
        });

        // Clean up gradient persistence check interval
        const intervalId = footer.getAttribute('data-gradient-interval');
        if (intervalId) {
            clearInterval(parseInt(intervalId));
            footer.removeAttribute('data-gradient-interval');
        }
    }

    // Setup again
    setupTestimonialsAnimations();
}

// Debug function
export function debugTestimonials() {
    const breakpoint = getCurrentBreakpoint();
    const config = TESTIMONIALS_CONFIG[breakpoint];
    const items = getTestimonialItems();
    const footer = document.querySelector('.testimonials-footer');

    debugLog('🎨 Testimonials debug:', {
        breakpoint,
        config,
        totalItems: items.length,
        footerExists: !!footer,
        items: Array.from(items).map((item, index) => ({
            index: index + 1,
            text: item.querySelector('.testimonials-item-content p')?.textContent?.substring(0, 50) + '...'
        }))
    });
}

// Debug function is available for import 