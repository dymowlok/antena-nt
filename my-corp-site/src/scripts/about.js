import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export function setupAboutSection() {
    const aboutSection = document.querySelector('#o-firmie');
    const scroller = document.querySelector('[data-lenis-scroller]') || window;
    if (!aboutSection) return;

    const sections = aboutSection.querySelectorAll('.about-section');
    const assets = {
        experience: aboutSection.querySelector('#about-asset-experience'),
        quarantee: aboutSection.querySelector('#about-asset-quarantee'),
        service: aboutSection.querySelector('#about-asset-service')
    };

    const showAsset = (key) => {
        Object.entries(assets).forEach(([id, el]) => {
            if (!el) return;
            el.style.display = id === key ? 'flex' : 'none';
        });
    };

    sections.forEach((section) => {
        const id = section.id;
        if (!id || !assets[id]) return;

        ScrollTrigger.create({
            trigger: section,
            start: 'top center',
            end: 'bottom center',
            onEnter: () => showAsset(id),
            onEnterBack: () => showAsset(id),
            scroller: scroller
        });
    });
}
