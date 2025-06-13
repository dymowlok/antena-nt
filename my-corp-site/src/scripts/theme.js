import Lenis from 'lenis';
import { gsap } from 'gsap';
import ScrollTrigger from 'gsap/ScrollTrigger';
import { menuData } from '../data/menu';

gsap.registerPlugin(ScrollTrigger);

// Smooth scroll
const lenis = new Lenis({ duration: 1.2, smooth: true });
function raf(time) {
    lenis.raf(time);
    requestAnimationFrame(raf);
}
requestAnimationFrame(raf);

// Theme color mapping
const themeColors = {
    white: '#ffffff',
    light: '#f7f7f7',
    indigo: '#7c7cf8',
    sky: '#afd9fa',
    blue: '#3d76f7',
    orange: '#ff603c',
    black: '#000000',
    gray: '#f2f2f2'
};

const body = document.body;
const header = document.querySelector('#header');
const headerWrap = header.querySelector('.header-wrap');
const headerLogoText = header.querySelector('.header-logo-text');
const headerButton = header.querySelector('a.button[href="#kontakt"]');
const headerDot = headerButton.querySelector('.dot');
const headerNav = header.querySelector('.header-nav ul');

// Insert menu items
menuData.forEach(({ label, url }) => {
    const li = document.createElement('li');
    const a = document.createElement('a');
    a.href = url;
    a.textContent = label;
    li.appendChild(a);
    headerNav.appendChild(li);
});

const navItems = headerNav.querySelectorAll('li');

// Initial header animation
headerWrap.style.gap = '2rem';
gsap.set(header, { top: '-100%', opacity: 0 });
gsap.to(header, {
    top: '2.5rem',
    opacity: 1,
    duration: 0.5,
    delay: 0.3,
    ease: 'power2.out',
    onComplete: () => {
        updateNavHighlight();
    }
});

// Scroll-triggered theme transitions
const sections = document.querySelectorAll('[data-theme]');
gsap.set(body, { backgroundColor: themeColors.white });

function getScrollDistance() {
    const isPocket = window.matchMedia('(max-width: 899px)').matches;
    return isPocket ? 7.5 * 16 : 15 * 16;
}

sections.forEach((section, index) => {
    const currentTheme = section.dataset.theme;
    const nextSection = sections[index + 1];
    const nextTheme = nextSection?.dataset.theme;
    if (!currentTheme || !nextTheme) return;

    const scrollDistance = getScrollDistance();

    ScrollTrigger.create({
        trigger: section,
        start: 'bottom center',
        end: `+=${scrollDistance}`,
        scrub: true,
        onUpdate: (self) => {
            const progress = self.progress;
            const fromRGB = gsap.utils.splitColor(themeColors[currentTheme]);
            const toRGB = gsap.utils.splitColor(themeColors[nextTheme]);
            const interpolated = fromRGB.map((c, i) => Math.round(gsap.utils.interpolate(c, toRGB[i], progress)));
            gsap.set(body, { backgroundColor: `rgb(${interpolated.join(',')})` });

            const grayThemes = ['hero', 'kontakt'];
            const isCurrentGray = grayThemes.includes(section.id);
            const isNextGray = nextSection && grayThemes.includes(nextSection.id);
            const blend = gsap.utils.interpolate(isCurrentGray ? 1 : 0, isNextGray ? 1 : 0, progress);

            gsap.to(headerWrap, {
                backgroundColor: blend > 0.5 ? themeColors.gray : themeColors.white,
                duration: 0.2,
                overwrite: 'auto'
            });
            gsap.to(headerButton, {
                backgroundColor: blend > 0.5 ? themeColors.white : themeColors.gray,
                duration: 0.2,
                overwrite: 'auto'
            });
        }
    });
});

// Scroll direction state
let lastScroll = window.scrollY;
let hasScrolled = false;

function updateHeaderUI(toDefaultState) {
    gsap.killTweensOf([headerLogoText, headerDot]);

    if (toDefaultState) {
        gsap.set([headerLogoText, headerDot], {
            position: 'relative',
            visibility: 'visible',
            zIndex: 1,
            scaleX: 0.7,
            x: -5,
            opacity: 0
        });
        gsap.to([headerLogoText, headerDot], {
            opacity: 1,
            scaleX: 1,
            x: 0,
            duration: 0.25,
            ease: 'power2.out'
        });
        gsap.to(headerWrap, {
            gap: '2rem',
            duration: 0.2,
            overwrite: 'auto'
        });
    } else {
        gsap.to([headerLogoText, headerDot], {
            opacity: 0,
            scaleX: 0.7,
            x: -5,
            duration: 0.25,
            ease: 'power2.in',
            onComplete: () => {
                gsap.set([headerLogoText, headerDot], {
                    visibility: 'hidden',
                    position: 'absolute',
                    zIndex: -1
                });
            }
        });
        gsap.to(headerWrap, {
            gap: '1rem',
            duration: 0.2,
            overwrite: 'auto'
        });
    }
}

function handleScrollDirection() {
    const currentScroll = window.scrollY;
    const scrollingDown = currentScroll > lastScroll + 2;
    const atTop = currentScroll <= 10;
    lastScroll = currentScroll;

    if (!hasScrolled && scrollingDown) {
        hasScrolled = true;
        updateHeaderUI(false);
    }

    if (hasScrolled && atTop) {
        hasScrolled = false;
        updateHeaderUI(true);
    }
}

window.addEventListener('scroll', handleScrollDirection);

// Scroll-linked nav logic
const sectionMap = Array.from(sections).map(section => ({ id: section.id, el: section }));

function updateNavHighlight() {
    const viewportHeight = window.innerHeight;
    let active = null;
    let maxVisible = 0;

    sectionMap.forEach(({ id, el }) => {
        const rect = el.getBoundingClientRect();
        const visibleHeight = Math.min(rect.bottom, viewportHeight) - Math.max(rect.top, 0);
        if (visibleHeight > maxVisible) {
            maxVisible = visibleHeight;
            active = id;
        }
    });

    navItems.forEach(li => {
        const a = li.querySelector('a');
        const isActive = active && a.hash === `#${active}`;
        li.classList.toggle('visible', isActive);
        a.classList.toggle('active', isActive);
    });
}

ScrollTrigger.addEventListener('refresh', updateNavHighlight);
window.addEventListener('scroll', updateNavHighlight);
window.addEventListener('resize', updateNavHighlight);

header.addEventListener('mouseenter', () => {
    navItems.forEach(li => li.classList.add('visible'));
});

header.addEventListener('mouseleave', updateNavHighlight);

ScrollTrigger.refresh();
