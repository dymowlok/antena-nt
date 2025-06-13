import { gsap } from 'gsap';
import ScrollTrigger from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export function setupTextReveal() {
    const containers = document.querySelectorAll('section, footer');

    containers.forEach((container) => {
        const targets = container.querySelectorAll('*');

        targets.forEach((el) => {
            // Pomijamy niewidoczne elementy (np. display: none)
            if (!(el instanceof HTMLElement)) return;
            if (el.offsetParent === null) return;

            gsap.fromTo(
                el,
                {
                    opacity: 0,
                    filter: 'blur(6px)',
                    pointerEvents: 'none',
                },
                {
                    opacity: 1,
                    filter: 'blur(0px)',
                    pointerEvents: 'auto',
                    duration: 0.5,
                    ease: 'power1.out',
                    scrollTrigger: {
                        trigger: el,
                        start: 'top 90%',
                        once: true,
                        toggleActions: 'play none none none',
                    },
                }
            );
        });
    });
}
