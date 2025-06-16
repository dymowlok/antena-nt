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

    // z-indexy w odwrotnej kolejności – by default
    items.forEach((item, index) => {
        const depth = total - index;
        item.style.zIndex = depth;
    });

    // animacja tylko dla poprzednich
    items.forEach((item, index) => {
        const prevItems = items.slice(0, index);

        ScrollTrigger.create({
            trigger: item,
            start: 'top 80%',
            end: 'top top',
            scrub: 0.5,
            onUpdate: (self) => {
                const p = self.progress;

                prevItems.forEach((el, i) => {
                    const depth = index - i;
                    const rotate = -6 * depth * p;
                    const scale = 1 - 0.03 * depth * p;
                    const bright = 1 - 0.2 * depth * p;

                    gsap.to(el, {
                        rotateX: rotate,
                        scale,
                        filter: `brightness(${bright})`,
                        duration: 0.3,
                        overwrite: true,
                    });
                });
            }
        });
    });
}

function initDesktopSliderCollapse() {
    const container = document.querySelector('.services-slider');
    const items = gsap.utils.toArray('.services-item');

    const paddingLeft = 80; // 5rem w px
    const spacing = 32; // approx gap
    const fullItemWidth = items[0].offsetWidth + spacing;
    const visibleWidth = window.innerWidth - paddingLeft * 2;
    const totalScrollLength = fullItemWidth * (items.length - 1);

    const tl = gsap.timeline({
        scrollTrigger: {
            trigger: '.services',
            start: 'top top',
            end: `+=${totalScrollLength}`,
            scrub: true,
            pin: true,
            anticipatePin: 1,
            onLeave: () => {
                document.body.setAttribute('data-theme', 'light');
            },
            onEnterBack: () => {
                document.body.setAttribute('data-theme', 'light');
            }
        }
    });

    items.forEach((item, i) => {
        const isLast = i === items.length - 1;

        if (!isLast) {
            tl.to(item, {
                duration: 0.01,
                onStart: () => {
                    item.classList.add('collapsed');
                    gsap.fromTo(item, {
                        opacity: 0.8,
                        scale: 0.98,
                    }, {
                        opacity: 1,
                        scale: 1,
                        duration: 0.25,
                        overwrite: true,
                    });
                },
                onReverseComplete: () => item.classList.remove('collapsed')
            }, i * 0.15); // snapy czasowe
        }
    });

    // przesunięcie zawartości na koniec
    tl.to(container, {
        x: () => `-${(items.length - 1) * fullItemWidth}`,
        ease: 'power1.out'
    }, 0);
}
