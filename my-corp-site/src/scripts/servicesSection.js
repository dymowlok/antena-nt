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
            updateServicesSectionHeight();
        }
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
                        // Item is transitioning from collapsed to expanded
                        gsap.delayedCall(0.25, () => {
                            gsap.to(smallText, {
                                opacity: 1,
                                duration: 0.25,
                                ease: 'power2.out'
                            });
                        });
                    } else if (!isFullyExpanded && !wasCollapsed) {
                        // Item is transitioning from expanded to collapsed
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
    const items = gsap.utils.toArray('.services-item');
    const cardRotations = items.map(() => (Math.random() - 0.5) * 8);
    const GAP = 15;
    const STICKY_TOP = 115;

    if (items.length === 0) return;

    items.forEach((item, index) => {
        const prev = items[index - 1];

        gsap.set(item, {
            rotation: 0,
            filter: 'brightness(1)',
            scale: 1,
            y: 0
        });

        if (prev) {
            ScrollTrigger.create({
                trigger: item,
                start: `top center+=50%`,
                end: `bottom center-=25%`,
                scrub: true,
                onUpdate: (self) => {
                    const progress = self.progress;
                    const rotate = cardRotations[index - 1] * progress;
                    const scale = 1 - progress * 0.05;
                    const brightness = 1 - progress * 0.3;

                    gsap.to(prev, {
                        rotation: rotate,
                        scale: scale,
                        filter: `brightness(${brightness})`,
                        overwrite: true,
                        duration: 0.01,
                        ease: 'none'
                    });

                    gsap.to(item, {
                        rotation: 0,
                        scale: 1,
                        filter: 'brightness(1)',
                        overwrite: true,
                        duration: 0.01,
                        ease: 'none'
                    });
                }
            });
        }

        // 💥 Manualny snap scroll do top: 11.5rem gdy karta dojdzie do środka
        ScrollTrigger.create({
            trigger: item,
            start: 'center center',
            end: 'bottom top',
            onEnter: () => {
                // Don't interfere with any hash navigation or mobile navigation
                if (window.mobileNavNavigating || window.hashNavigating || window.location.hash) return;

                const targetY = window.scrollY + item.getBoundingClientRect().top - STICKY_TOP;
                lenis.scrollTo(targetY, {
                    duration: 0.4,
                    easing: (t) => 1 - Math.pow(1 - t, 3)
                });
            }
        });
    });

    // MOBILE PINNING DISABLED - Comment out the pinning functionality for mobile
    /*
    ScrollTrigger.create({
        trigger: '.services-slider',
        start: 'top top',
        end: 'bottom bottom',
        onEnter: () => themeManager.setServicesPinned(true),
        onEnterBack: () => themeManager.setServicesPinned(true),
        onLeave: () => themeManager.setServicesPinned(false),
        onLeaveBack: () => themeManager.setServicesPinned(false)
    });
    */
}

function applyDepthEffects(items, currentIndex, rotations) {
    items.forEach((item, i) => {
        if (i < currentIndex) {
            const depth = currentIndex - i;
            gsap.to(item, {
                scale: 1 - (depth * 0.05),
                y: -depth * 0.5,
                rotation: rotations[i],
                filter: `brightness(${1 - (depth * 0.1)})`,
                duration: 0.25,
                ease: 'power2.out'
            });
        } else {
            gsap.to(item, {
                scale: 1,
                y: 0,
                rotation: 0,
                filter: 'brightness(1)',
                duration: 0.25,
                ease: 'power2.out'
            });
        }
    });
}

// Export the pinned state for other scripts to check
export function isServicesSectionPinned() {
    return themeManager.isServicesPinned;
}  
