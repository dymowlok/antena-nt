import Lenis from 'lenis';
import { gsap } from 'gsap';
import ScrollTrigger from 'gsap/ScrollTrigger';
import { menuData } from '../data/menu';

gsap.registerPlugin(ScrollTrigger);

let headerState = 'loading';
let currentActiveSection = 'hero';
let hasScrolledFromTop = false;

const lenis = new Lenis({ duration: 1.2, smooth: true });
function raf(time) {
    lenis.raf(time);
    requestAnimationFrame(raf);
}
requestAnimationFrame(raf);

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

let navItems = [];
let isScrollingUp = false;
let scrollUpTimer = null;

function initializeNavItems() {
    headerNav.innerHTML = '';

    menuData.forEach(({ label, url }) => {
        const li = document.createElement('li');
        const a = document.createElement('a');
        a.href = url;
        a.textContent = label;
        li.appendChild(a);
        headerNav.appendChild(li);
    });

    navItems = headerNav.querySelectorAll('li');
    console.log(`✅ Initialized ${navItems.length} nav items`);
}

function waitForNavItems() {
    return new Promise((resolve) => {
        const checkNavItems = () => {
            if (headerNav && headerNav.children.length > 0) {
                navItems = headerNav.querySelectorAll('li');
                resolve();
            } else {
                setTimeout(checkNavItems, 50);
            }
        };
        checkNavItems();
    });
}

initializeNavItems();

headerWrap.style.gap = '2rem';
gsap.set(header, { top: '-100%', opacity: 0 });

async function initializeHeader() {
    await waitForNavItems();

    gsap.to(header, {
        top: '2.5rem',
        opacity: 1,
        duration: 0.4,
        delay: 0.1, // Zmniejszone z 0.3 na 0.1
        ease: 'power2.out',
        onComplete: () => {
            headerState = 'hero';
            updateNavHighlight();
        }
    });
}

initializeHeader();

const sections = document.querySelectorAll('main > section[data-theme], main > section[id]');
gsap.set(body, { backgroundColor: themeColors.white });

function getScrollDistance() {
    const isPocket = window.matchMedia('(max-width: 899px)').matches;
    return isPocket ? 7.5 * 16 : 15 * 16;
}

document.querySelectorAll('[data-theme]').forEach((section, index, arr) => {
    const currentTheme = section.dataset.theme;
    const nextSection = arr[index + 1];
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

            // Zmiana koloru header-wrap
            const newHeaderBg = blend > 0.5 ? themeColors.gray : themeColors.white;
            gsap.to(headerWrap, {
                backgroundColor: newHeaderBg,
                duration: 0.2,
                overwrite: 'auto'
            });

            // TRIGGER: Jeśli header-wrap zmienia kolor z gray na white (opuszczamy hero)
            if (section.id === 'hero' && progress > 0.1) {
                // Natychmiast przełącz na scrolling mode
                if (headerState === 'hero') {
                    updateHeaderUI(false);
                }
            }
        }
    });
});

let lastScroll = window.scrollY;
let hasScrolled = false;

function updateHeaderUI(toDefaultState) {
    // Kill wszystkie animacje na raz
    gsap.killTweensOf([headerLogoText, headerDot, headerWrap, ...navItems]);

    if (toDefaultState) {
        headerState = 'hero';
        hasScrolledFromTop = false;

        // Synchroniczna animacja wszystkich elementów - wejście
        const tl = gsap.timeline();

        // Przygotuj elementy
        gsap.set([headerLogoText, headerDot], {
            position: 'relative',
            visibility: 'visible',
            zIndex: 1,
            scaleX: 0.7,
            x: -5,
            opacity: 0
        });

        tl.to(headerWrap, {
            gap: '2rem',
            duration: 0.4,
            ease: 'power2.out'
        })
            .to([headerLogoText, headerDot], {
                opacity: 1,
                scaleX: 1,
                x: 0,
                duration: 0.4,
                ease: 'back.out(1.7)'
            }, "<")
            .call(() => {
                showAllNavItems();
            }, null, 0.2);

        // Button white
        headerButton.classList.remove('black', 'gray');
        headerButton.classList.add('white');

    } else {
        headerState = 'scrolling';
        hasScrolledFromTop = true;

        // Synchroniczna animacja wszystkich elementów - ukrywanie
        const tl = gsap.timeline();

        tl.to(headerWrap, {
            gap: '1rem',
            duration: 0.4,
            ease: 'power2.out'
        })
            .to([headerLogoText, headerDot], {
                opacity: 0,
                scaleX: 0.7,
                x: -10,
                duration: 0.4,
                ease: 'power2.in',
                onComplete: () => {
                    gsap.set([headerLogoText, headerDot], {
                        visibility: 'hidden',
                        position: 'absolute',
                        zIndex: -1
                    });
                }
            }, "<")
            .call(() => {
                hideInactiveNavItems();
            }, null, "<");

        // Button black
        headerButton.classList.remove('white', 'gray');
        headerButton.classList.add('black');
    }
}

function showAllNavItems() {
    navItems = headerNav.querySelectorAll('li');

    // Smoother staggered animation
    navItems.forEach((li, index) => {
        li.classList.remove('is-active');

        gsap.set(li, {
            position: 'relative',
            overflow: 'visible',
            width: 'auto',
            height: 'auto',
            pointerEvents: 'auto',
            opacity: 0,
            scale: 0.9,
            y: -10
        });

        gsap.to(li, {
            opacity: 1,
            scale: 1,
            y: 0,
            duration: 0.5,
            delay: index * 0.08,
            ease: 'back.out(1.7)'
        });
    });
}

function hideInactiveNavItems() {
    navItems = headerNav.querySelectorAll('li');

    if (navItems.length === 0) {
        setTimeout(hideInactiveNavItems, 50);
        return;
    }

    // INSTANT: Ukryj WSZYSTKIE elementy natychmiast bez animacji
    navItems.forEach(li => {
        li.classList.remove('is-active');
        gsap.set(li, {
            opacity: 0,
            scale: 0.8,
            position: 'absolute',
            overflow: 'hidden',
            width: 0,
            height: 0,
            pointerEvents: 'none'
        });
    });

    // STRICT: Znajdź TYLKO JEDEN najbardziej widoczny element
    let mostVisibleItem = null;
    let highestVisibility = 0;

    navItems.forEach(li => {
        const a = li.querySelector('a');
        if (!a) return;

        const href = a.getAttribute('href');
        const sectionId = href.replace('#', '');
        const section = document.getElementById(sectionId);

        if (!section) return;

        // Oblicz dokładną widoczność tej sekcji
        const rect = section.getBoundingClientRect();
        const viewportHeight = window.innerHeight;
        const sectionHeight = rect.height;

        const visibleTop = Math.max(0, rect.top);
        const visibleBottom = Math.min(viewportHeight, rect.bottom);
        const visibleHeight = Math.max(0, visibleBottom - visibleTop);
        const visibilityPercent = sectionHeight > 0 ? visibleHeight / sectionHeight : 0;

        // Znajdź element z najwyższą widocznością
        if (visibilityPercent > highestVisibility) {
            highestVisibility = visibilityPercent;
            mostVisibleItem = li;
        }
    });

    // Pokaż TYLKO jeden najbardziej widoczny element (bez fallback)
    if (mostVisibleItem && highestVisibility > 0.2) {
        mostVisibleItem.classList.add('is-active');

        gsap.set(mostVisibleItem, {
            position: 'relative',
            overflow: 'visible',
            width: 'auto',
            height: 'auto',
            pointerEvents: 'auto'
        });

        gsap.to(mostVisibleItem, {
            opacity: 1,
            scale: 1,
            y: 0,
            duration: 0.2, // Szybsza animacja
            ease: 'power2.out'
        });
    }
}

function showAllNavItemsOnScrollUp() {
    if (headerState !== 'scrolling') return;

    navItems = headerNav.querySelectorAll('li');

    // Szybka reveal animation bez opóźnień
    navItems.forEach((li, index) => {
        li.classList.remove('is-active');

        gsap.set(li, {
            position: 'relative',
            overflow: 'visible',
            width: 'auto',
            height: 'auto',
            pointerEvents: 'auto'
        });

        gsap.to(li, {
            opacity: 1,
            scale: 1,
            y: 0,
            duration: 0.2, // Szybsza animacja
            delay: index * 0.02, // Krótsze opóźnienia
            ease: 'power2.out'
        });
    });
}

function handleScrollDirection() {
    const currentScroll = window.scrollY;
    const scrollingDown = currentScroll > lastScroll + 1; // Zmniejszone z +2 na +1
    const scrollingUp = currentScroll < lastScroll - 1; // Zmniejszone z -2 na -1
    const atTop = currentScroll <= 10;

    const heroSection = document.querySelector('#hero');
    const heroRect = heroSection?.getBoundingClientRect();
    const heroVisible80 = heroRect && heroRect.bottom > window.innerHeight * 0.2;

    // Szybka reakcja na scroll up
    if (scrollingUp && !atTop) {
        isScrollingUp = true;

        // Natychmiast pokaż wszystkie nav items na scroll up
        if (headerState === 'scrolling') {
            showAllNavItemsOnScrollUp();
        }

        // Krótszy timer - ukryj po 1 sekundzie
        clearTimeout(scrollUpTimer);
        scrollUpTimer = setTimeout(() => {
            isScrollingUp = false;
            if (headerState === 'scrolling') {
                hideInactiveNavItems();
            }
        }, 1000); // Zmniejszone z 2000 na 1000
    }

    lastScroll = currentScroll;

    // Logika zmiany stanu headera
    if (!hasScrolled && !heroVisible80) {
        hasScrolled = true;
        updateHeaderUI(false);
    }

    if (hasScrolled && heroVisible80) {
        hasScrolled = false;
        isScrollingUp = false;
        clearTimeout(scrollUpTimer);
        updateHeaderUI(true);
    }
}

window.addEventListener('scroll', handleScrollDirection);

const sectionMap = Array.from(sections).map(section => ({
    id: section.id,
    el: section
}));

function updateNavHighlight() {
    const viewportHeight = window.innerHeight;
    let active = null;
    let maxVisible = 0;
    let newActiveSection = null;
    let maxVisibility = 0;

    sectionMap.forEach(({ id, el }) => {
        const rect = el.getBoundingClientRect();
        const visibleHeight = Math.min(rect.bottom, viewportHeight) - Math.max(rect.top, 0);

        const sectionHeight = rect.height;
        const visibilityPercent = sectionHeight > 0 ? visibleHeight / sectionHeight : 0;

        if (visibilityPercent > 0.51 && visibilityPercent > maxVisibility) {
            maxVisibility = visibilityPercent;
            newActiveSection = id;
        }

        if (visibleHeight > maxVisible) {
            maxVisible = visibleHeight;
            active = id;
        }
    });

    const targetActiveSection = newActiveSection || active;

    if (targetActiveSection && targetActiveSection !== currentActiveSection) {
        currentActiveSection = targetActiveSection;

        if (headerState === 'scrolling' && !isScrollingUp) {
            hideInactiveNavItems();
        }
    }

    navItems = headerNav.querySelectorAll('li');
    navItems.forEach(li => {
        const a = li.querySelector('a');
        if (!a) return;

        const isActive = active && a.hash === `#${active}`;
        li.classList.toggle('visible', isActive);
        a.classList.toggle('active', isActive);
    });
}

ScrollTrigger.addEventListener('refresh', updateNavHighlight);
window.addEventListener('scroll', updateNavHighlight);
window.addEventListener('resize', updateNavHighlight);

ScrollTrigger.refresh();