import { gsap } from 'gsap';
import ScrollTrigger from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export function setupThemeObserver() {
    const sections = gsap.utils.toArray('[data-theme][id]');
    const header = document.querySelector('header');

    if (!sections.length) return;

    sections.forEach((section) => {
        const theme = section.getAttribute('data-theme');

        ScrollTrigger.create({
            trigger: section,
            start: 'top center',
            end: 'bottom center',
            onEnter: () => setTheme(theme),
            onEnterBack: () => setTheme(theme),
        });
    });

    function setTheme(theme) {
        document.body.setAttribute('data-theme', theme);
        if (header) {
            header.classList.remove('white', 'light', 'indigo', 'sky', 'blue', 'orange', 'black');
            header.classList.add(theme);
        }
    }
}
