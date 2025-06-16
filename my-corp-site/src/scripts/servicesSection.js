import { gsap } from 'gsap';
import ScrollTrigger from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export function setupServicesSection() {
    const mm = gsap.matchMedia();

    mm.add({
        isMobile: '(max-width: 899px)',
        isDesktop: '(min-width: 900px)'
    }, (context) => {
        const { isMobile, isDesktop } = context.conditions;

        if (isMobile) {
            initMobileStackedCards();
        }

        if (isDesktop) {
            initDesktopSliderCollapse();
        }
    });
}

function initMobileStackedCards() {
    const items = gsap.utils.toArray('.services-item');
    const total = items.length;

    items.forEach((item, index) => {
        const depth = total - index;
        item.style.zIndex = depth;
        gsap.set(item, {
            rotate: index * -1.5,
            scale: 1 - index * 0.03,
            filter: `brightness(${1 - index * 0.1})`,
            yPercent: -index * 5,
        });
    });

    items.forEach((item, index) => {
        ScrollTrigger.create({
            trigger: item,
            start: 'top center',
            end: 'bottom top',
            scrub: 0.5,
            onEnter: () => {
                gsap.to(item, {
                    rotate: 0,
                    scale: 1,
                    filter: 'brightness(1)',
                    yPercent: 0,
                    duration: 0.5,
                });
            },
            onLeaveBack: () => {
                gsap.to(item, {
                    rotate: index * -1.5,
                    scale: 1 - index * 0.03,
                    filter: `brightness(${1 - index * 0.1})`,
                    yPercent: -index * 5,
                    duration: 0.5,
                });
            }
        });
    });
}

function initDesktopSliderCollapse() {
    const slider = document.querySelector('.services-slider');
    const items = gsap.utils.toArray('.services-item');

    gsap.to(items, {
        scrollTrigger: {
            trigger: slider,
            start: 'top top',
            end: () => `+=${slider.scrollWidth - window.innerWidth}`,
            scrub: 1,
            pin: true,
            anticipatePin: 1,
            onUpdate: (self) => {
                const progress = self.progress;
                const index = Math.floor(progress * (items.length - 1));
                items.forEach((item, i) => {
                    if (i < index) {
                        item.classList.add('collapsed');
                    } else {
                        item.classList.remove('collapsed');
                    }
                });
            },
            onLeave: () => {
                document.body.setAttribute('data-theme', 'light');
            },
            onEnterBack: () => {
                document.body.setAttribute('data-theme', 'light');
            }
        }
    });
}
