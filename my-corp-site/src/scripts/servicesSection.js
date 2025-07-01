import { gsap } from 'gsap';
import ScrollTrigger from 'gsap/ScrollTrigger';

// REGISTER

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
            initMobileExitTrigger();
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
    section.style.height = `${items.length * itemHeight}px`;
}

function initMobileStackedCards() {
    const items = gsap.utils.toArray('.services-item');
    const total = items.length;
    let activeIndex = 0;

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

    const st = ScrollTrigger.create({
        trigger: '.services-slider',
        start: 'top top',
        end: `+=${window.innerHeight * (total - 1)}`,
        scrub: true,
        snap: 1 / (total - 1),
        pin: true,
        anticipatePin: 1,
        onUpdate: (self) => {
            const newIndex = Math.round(self.progress * (total - 1));
            if (newIndex !== activeIndex) {
                activeIndex = newIndex;
                items.forEach((item, index) => {
                    if (index < newIndex) {
                        gsap.to(item, {
                            rotate: -3,
                            scale: 0.9,
                            filter: 'brightness(0.4)',
                            yPercent: -5,
                            duration: 0.3
                        });
                    } else if (index === newIndex) {
                        gsap.to(item, {
                            rotate: 0,
                            scale: 1,
                            filter: 'brightness(1)',
                            yPercent: 0,
                            duration: 0.3
                        });
                    } else {
                        gsap.to(item, {
                            rotate: index * -1.5,
                            scale: 1 - index * 0.03,
                            filter: `brightness(${1 - index * 0.1})`,
                            yPercent: -index * 5,
                            duration: 0.3
                        });
                    }
                });
            }
        },
        onEnter: () => {
            document.body.setAttribute('data-theme', 'light');
        },
        onEnterBack: () => {
            document.body.setAttribute('data-theme', 'light');
        },
        onLeave: () => {
            const next = document.querySelector('#o-firmie');
            const nextTheme = next?.getAttribute('data-theme') || 'white';
            document.body.setAttribute('data-theme', nextTheme);
        },
        onLeaveBack: () => {
            const prev = document.querySelector('[data-theme][id]:not(#uslugi)');
            const prevTheme = prev?.getAttribute('data-theme') || 'white';
            document.body.setAttribute('data-theme', prevTheme);
        }
    });
}

function initMobileExitTrigger() {
    ScrollTrigger.create({
        trigger: '#o-firmie',
        start: 'top center',
        once: true,
        onEnter: () => {
            document.body.setAttribute('data-theme', 'indigo');
        }
    });
}

function initDesktopSliderCollapse() {
    const section = document.querySelector('#uslugi');
    const wrap = section.querySelector('.services-wrap');
    const slider = wrap.querySelector('.services-slider');
    const items = gsap.utils.toArray('.services-item');
    let collapsedClass = 'collapsed';

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
                if (i < index) {
                    item.classList.add(collapsedClass);
                } else {
                    item.classList.remove(collapsedClass);
                }

                const isFullyExpanded = !item.classList.contains(collapsedClass);
                const smallText = item.querySelector('p.small');
                if (smallText) {
                    smallText.style.opacity = isFullyExpanded ? '1' : '0';
                    smallText.style.transition = 'opacity 0.5s ease';
                }
            });

            document.body.setAttribute('data-theme', 'light');
        },
        onEnter: () => {
            document.body.setAttribute('data-theme', 'light');
        },
        onEnterBack: () => {
            document.body.setAttribute('data-theme', 'light');
        },
        onLeave: () => {
            const next = document.querySelector('#o-firmie');
            const nextTheme = next?.getAttribute('data-theme') || 'white';
            document.body.setAttribute('data-theme', nextTheme);
        },
        onLeaveBack: () => {
            const prev = document.querySelector('[data-theme][id]:not(#uslugi)');
            const prevTheme = prev?.getAttribute('data-theme') || 'white';
            document.body.setAttribute('data-theme', prevTheme);
        }
    });
}
