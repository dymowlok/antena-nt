import { gsap } from 'gsap';
import ScrollTrigger from 'gsap/ScrollTrigger';
import themeManager from './themeManager.js';
import lenis from './utils/lenis.js';

// REGISTER

gsap.registerPlugin(ScrollTrigger);

export function setupServicesSection() {
    const mm = gsap.matchMedia();

    mm.add({
        isMobile: '(max-width: 899px)',
        isDesktop: '(min-width: 900px)'
    }, (context) => {
        const { isMobile, isDesktop } = context.conditions || {};

        if (isMobile) {
            initMobileStackedCards();
        }

        if (isDesktop) {
            initDesktopSliderCollapse();
        }

        updateServicesSectionHeight();
    });
}

function updateServicesSectionHeight() {
    const slider = document.querySelector('.services-slider');
    const section = document.querySelector('.services');

    if (!slider || !section) return;

    const items = slider.querySelectorAll('.services-item');
    const itemHeight = window.innerHeight - 140; // approx based on 14rem top spacing
    if (section instanceof HTMLElement) {
        section.style.height = `${items.length * itemHeight}px`;
    }
}

function initDesktopSliderCollapse() {
    const section = document.querySelector('#uslugi');
    const wrap = section?.querySelector('.services-wrap');
    const slider = wrap?.querySelector('.services-slider');
    const items = gsap.utils.toArray('.services-item');
    let collapsedClass = 'collapsed';

    if (!section || !wrap || !slider) return;

    const totalScroll = slider.scrollWidth - window.innerWidth;

    ScrollTrigger.create({
        trigger: section,
        start: 'top top',
        end: () => `+=${totalScroll}`,
        scrub: true,
        pin: true,
        anticipatePin: 1,
        onUpdate: (self) => {
            const progress = self.progress;
            const index = Math.floor(progress * (items.length - 1));

            items.forEach((item, i) => {
                const wasCollapsed = item.classList.contains(collapsedClass);

                if (i < index) {
                    item.classList.add(collapsedClass);
                } else {
                    item.classList.remove(collapsedClass);
                }

                const isFullyExpanded = !item.classList.contains(collapsedClass);
                const smallText = item.querySelector('p.small');

                if (smallText) {
                    if (isFullyExpanded && wasCollapsed) {
                        // Item is transitioning from collapsed to expanded - wait for width transition, then show paragraph
                        gsap.delayedCall(0.25, () => {
                            gsap.to(smallText, {
                                opacity: 1,
                                duration: 0.25,
                                ease: 'power2.out'
                            });
                        });
                    } else if (!isFullyExpanded && !wasCollapsed) {
                        // Item is transitioning from expanded to collapsed - hide immediately
                        gsap.to(smallText, {
                            opacity: 0,
                            duration: 0.1,
                            ease: 'power2.in'
                        });
                    }
                }
            });
        },
        onEnter: () => {
            themeManager.setServicesPinned(true);
        },
        onEnterBack: () => {
            themeManager.setServicesPinned(true);
        },
        onLeave: () => {
            themeManager.setServicesPinned(false);
        },
        onLeaveBack: () => {
            themeManager.setServicesPinned(false);
        }
    });
}

function initMobileStackedCards() {
    const section = document.querySelector('#uslugi');
    const items = gsap.utils.toArray('.services-item');

    if (!section || items.length === 0) return;

    // Generate random rotations for each card (-8deg to 8deg)
    const cardRotations = items.map(() => (Math.random() - 0.5) * 16); // -8 to 8 degrees

    // Set initial states for all items
    items.forEach((item, index) => {
        gsap.set(item, {
            zIndex: items.length - index,
            opacity: 1, // All cards always have full opacity
            scale: 1,
            y: 0,
            rotation: 0,
            filter: 'brightness(1)'
        });
    });

    // Create discrete scroll triggers for each card transition
    items.forEach((item, index) => {
        const isLast = index === items.length - 1;

        // Calculate the scroll position where this card should become active
        const cardHeight = window.innerHeight - 140; // Approx card height
        const triggerStart = index * cardHeight;
        const triggerEnd = (index + 1) * cardHeight;

        ScrollTrigger.create({
            trigger: section,
            start: `top+=${triggerStart} top`,
            end: `top+=${triggerEnd} top`,
            scrub: false, // No scrubbing for discrete behavior
            onEnter: () => {
                // This card becomes active - reset to normal state
                gsap.to(item, {
                    scale: 1,
                    y: 0,
                    rotation: 0,
                    filter: 'brightness(1)',
                    duration: 0.2,
                    ease: 'power2.out'
                });

                // Apply depth effects to all previous cards
                for (let i = 0; i < index; i++) {
                    const depthLevel = index - i;
                    const prevItem = items[i];

                    gsap.to(prevItem, {
                        scale: 1 - (depthLevel * 0.05), // 0.95, 0.90, 0.85, etc.
                        y: -depthLevel * 0.5, // -0.5rem, -1rem, -1.5rem, etc.
                        rotation: cardRotations[i], // Use pre-generated random rotation
                        filter: `brightness(${1 - (depthLevel * 0.1)})`, // 0.9, 0.8, 0.7, etc.
                        duration: 0.2,
                        ease: 'power2.out'
                    });
                }
            },
            onEnterBack: () => {
                // When scrolling back up, this card becomes active again
                gsap.to(item, {
                    scale: 1,
                    y: 0,
                    rotation: 0,
                    filter: 'brightness(1)',
                    duration: 0.2,
                    ease: 'power2.out'
                });

                // Recalculate depth effects for cards below this one
                for (let i = 0; i < index; i++) {
                    const depthLevel = index - i;
                    const prevItem = items[i];

                    gsap.to(prevItem, {
                        scale: 1 - (depthLevel * 0.05),
                        y: -depthLevel * 0.5,
                        rotation: cardRotations[i],
                        filter: `brightness(${1 - (depthLevel * 0.1)})`,
                        duration: 0.2,
                        ease: 'power2.out'
                    });
                }
            },
            onLeave: () => {
                // When scrolling down past this card, apply depth effect
                const depthLevel = 1;
                gsap.to(item, {
                    scale: 1 - (depthLevel * 0.05),
                    y: -depthLevel * 0.5,
                    rotation: cardRotations[index],
                    filter: `brightness(${1 - (depthLevel * 0.1)})`,
                    duration: 0.2,
                    ease: 'power2.out'
                });
            },
            onLeaveBack: () => {
                // When scrolling back up past this card, apply depth effect
                const depthLevel = 1;
                gsap.to(item, {
                    scale: 1 - (depthLevel * 0.05),
                    y: -depthLevel * 0.5,
                    rotation: cardRotations[index],
                    filter: `brightness(${1 - (depthLevel * 0.1)})`,
                    duration: 0.2,
                    ease: 'power2.out'
                });
            }
        });
    });

    // Add smooth scroll behavior for the section
    ScrollTrigger.create({
        trigger: section,
        start: 'top top',
        end: 'bottom bottom',
        onEnter: () => {
            themeManager.setServicesPinned(true);
        },
        onEnterBack: () => {
            themeManager.setServicesPinned(true);
        },
        onLeave: () => {
            themeManager.setServicesPinned(false);
        },
        onLeaveBack: () => {
            themeManager.setServicesPinned(false);
        }
    });
}

// Export the pinned state for other scripts to check
export function isServicesSectionPinned() {
    return themeManager.isServicesPinned;
}
