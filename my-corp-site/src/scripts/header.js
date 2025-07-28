import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { menuData } from '../data/menu';
import { isAtTop, isAtBottom } from "./scrollHelpers.js";
import lenis from './utils/lenis.js';

gsap.registerPlugin(ScrollTrigger);

// Enhanced State management
let headerState = 'loading';
let currentActiveSection = 'hero';
let isHeaderHovered = false;
export const isScrollingUp = { value: false };
export const scrollUpTimer = { value: null };

// DOM elements - defined early to avoid initialization issues
const header = document.querySelector('.header');
const headerWrap = document.querySelector('.header-wrap');
const headerNav = document.querySelector('.header-nav');
const headerDesktopMenu = document.querySelector('.header-desktop-menu');
const headerBgOverlay = document.querySelector('.header-bg-overlay');
const headerButton = document.querySelector('.header a.button');
const headerDot = document.querySelector('.header-dot');
const heroSection = document.querySelector('#hero');
const body = document.body;

let navItems = [];
let isDesktopMenuOpen = false;
let desktopMenuTimeout = null;
let hasSubmenuItems = false;

// Export currentButtonTheme for buttonTheme.js
export const currentButtonTheme = { value: "white" };

// Navigation highlighting - moved to top to avoid initialization issues
const sectionMap = [
    { id: 'hero', el: document.querySelector('#hero') },
    { id: 'uslugi', el: document.querySelector('#uslugi') },
    { id: 'o-firmie', el: document.querySelector('#o-firmie') },
    { id: 'opinie', el: document.querySelector('#opinie') },
    { id: 'lokalizacje', el: document.querySelector('#lokalizacje') },
    { id: 'kontakt', el: document.querySelector('#kontakt') }
].filter(section => section.el);

// NEW: Centralized header state manager
const HeaderStateManager = {
    states: {
        LOADING: 'loading',
        HERO: 'hero',
        SCROLLING: 'scrolling'
    },

    canShowDesktopMenu() {
        const allowedSections = ['hero', 'kontakt'];
        const isAtTopOrBottom = this.shouldShowFullHeader();
        const isFullHeaderState = headerState === this.states.HERO;

        // KRYTYCZNE: Sprawdź czy wszystkie li są widoczne
        const allNavItemsVisible = this.areAllNavItemsVisible();

        return isAtTopOrBottom && isFullHeaderState && allowedSections.includes(currentActiveSection) && allNavItemsVisible;
    },

    areAllNavItemsVisible() {
        const navItems = document.querySelectorAll('.header-nav li');
        if (navItems.length === 0) return false;

        // Sprawdź czy wszystkie li są widoczne (nie ukryte)
        let visibleCount = 0;
        navItems.forEach(li => {
            const computedStyle = window.getComputedStyle(li);
            const isVisible = computedStyle.opacity !== '0' &&
                computedStyle.visibility !== 'hidden' &&
                computedStyle.display !== 'none' &&
                li.offsetWidth > 0 &&
                li.offsetHeight > 0;
            if (isVisible) visibleCount++;
        });

        // Wszystkie li muszą być widoczne (nie może być tylko jeden!)
        return visibleCount === navItems.length && visibleCount > 1;
    },

    // POPRAWKA: Nowa logika sprawdzania czy pokazać full header
    shouldShowFullHeader() {
        // Sprawdź widoczność pierwszej sekcji (hero)
        const firstSection = document.querySelector('#hero');
        if (firstSection) {
            const rect = firstSection.getBoundingClientRect();
            const visibleHeight = Math.max(0, Math.min(window.innerHeight, rect.bottom) - Math.max(0, rect.top));
            const visibilityRatio = visibleHeight / window.innerHeight;

            if (visibilityRatio >= 0.5) {
                return true;
            }
        }

        // Sprawdź widoczność ostatniej sekcji
        const lastSection = document.querySelector('main > section:last-child, footer');
        if (lastSection) {
            const rect = lastSection.getBoundingClientRect();
            const visibleHeight = Math.max(0, Math.min(window.innerHeight, rect.bottom) - Math.max(0, rect.top));
            const visibilityRatio = visibleHeight / window.innerHeight;

            if (visibilityRatio >= 0.5) {
                return true;
            }
        }

        // Sprawdź widoczność sekcji kontakt
        const kontaktSection = document.querySelector('#kontakt');
        if (kontaktSection) {
            const rect = kontaktSection.getBoundingClientRect();
            const visibleHeight = Math.max(0, Math.min(window.innerHeight, rect.bottom) - Math.max(0, rect.top));
            const visibilityRatio = visibleHeight / window.innerHeight;

            if (visibilityRatio >= 0.5) {
                return true;
            }
        }

        // Fallback - sprawdź czy jesteśmy na samej górze lub dole
        return isAtTop() || isAtBottom();
    },

    shouldShowCompactHeader() {
        return !this.shouldShowFullHeader() && !isScrollingUp.value && !isHeaderHovered;
    }
};


// Theme colors
const themeColors = {
    white: '#ffffff',
    light: '#f2f2f2',
    indigo: '#7c7cf8',
    sky: '#afd9fa',
    blue: '#3d76f7',
    orange: '#ff603c',
    black: '#000000',
    gray: '#f2f2f2'
};

// Initialize navigation
function initializeNavItems() {
    const navUl = headerNav?.querySelector('ul');
    if (!navUl) return;

    navUl.innerHTML = '';
    menuData.forEach(({ label, url }) => {
        if (url === '#kontakt') return;

        const li = document.createElement('li');
        const a = document.createElement('a');
        a.href = url;
        a.textContent = label;
        li.appendChild(a);
        navUl.appendChild(li);
    });
    navItems = headerNav.querySelectorAll('li');

    // setupDesktopMenu(); // Temporarily disabled to break circular dependency
}

// Wait for nav items to be ready
function waitForNavItems() {
    return new Promise((resolve) => {
        const checkNavItems = () => {
            if (headerNav?.children.length > 0) {
                navItems = headerNav.querySelectorAll('li');
                resolve();
            } else {
                setTimeout(checkNavItems, 50);
            }
        };
        checkNavItems();
    });
}

// Hover detection
headerWrap.addEventListener('mouseenter', () => {
    isHeaderHovered = true;
});

headerWrap.addEventListener('mouseleave', () => {
    isHeaderHovered = false;
    setTimeout(() => {
        if (!isHeaderHovered && HeaderStateManager.shouldShowCompactHeader()) {
            hideInactiveNavItems();
        }
    }, 100);
});

// Function to handle gap styling based on screen size
function updateHeaderGap() {
    if (window.innerWidth >= 900) {
        headerWrap.style.gap = '1rem';
    } else {
        headerWrap.style.gap = '';
    }
}

// Initialize - POPRAWKA: ustaw gap na stałe 1rem tylko na desktop (lap-and-up breakpoint: 900px)
initializeNavItems();
updateHeaderGap();

// Listen for window resize to update gap styling
window.addEventListener('resize', updateHeaderGap);



// Header initialization - SINGLE ANIMATION ONLY
let headerAnimationTriggered = false;

async function initializeHeader() {
    await waitForNavItems();

    if (!header || headerAnimationTriggered) return;

    // Mark as triggered to prevent multiple animations
    headerAnimationTriggered = true;

    // Start with header hidden
    gsap.set(header, {
        top: '-100%',
        opacity: 0,
        transform: 'translateX(-50%) translateY(-100%)',
        visibility: 'hidden'
    });

    // Single header animation
    setTimeout(() => {
        if (header) {
            gsap.fromTo(header,
                {
                    opacity: 0,
                    top: '-100%',
                    transform: 'translateX(-50%) translateY(-100%)',
                    visibility: 'hidden'
                },
                {
                    opacity: 1,
                    top: '0',
                    transform: 'translateX(-50%) translateY(0)',
                    visibility: 'visible',
                    duration: 0.3,
                    ease: 'power2.out',
                    onComplete: () => {
                        headerState = HeaderStateManager.states.HERO;
                        updateNavHighlight();
                    }
                }
            );
        }
    }, 200); // Show header after 1 second
}

initializeHeader();

// Scroll position helpers
// Navigation highlighting
function updateNavHighlight() {
    const viewportHeight = window.innerHeight;
    const triggerLine = viewportHeight * 0.3;
    let activeSection = null;

    const hero = document.getElementById('hero');
    if (!activeSection && hero) {
        const rect = hero.getBoundingClientRect();
        const visibleTop = Math.max(0, rect.top);
        const visibleBottom = Math.min(window.innerHeight, rect.bottom);
        const visibleHeight = Math.max(0, visibleBottom - visibleTop);
        const heroVisibleRatio = visibleHeight / rect.height;

        if (heroVisibleRatio >= 0.5) {
            activeSection = 'hero';
        }
    }

    sectionMap.forEach(({ id, el }) => {
        if (!el) return;

        const rect = el.getBoundingClientRect();
        const topBelowTrigger = rect.top <= triggerLine;
        const bottomAboveTrigger = rect.bottom >= triggerLine;

        if (topBelowTrigger && bottomAboveTrigger) {
            activeSection = id;
        }
    });

    if (!activeSection) {
        // fallback - najbliższa sekcja do środka viewportu
        let closestSection = null;
        let minDistance = Infinity;

        sectionMap.forEach(({ id, el }) => {
            if (!el) return;

            const rect = el.getBoundingClientRect();
            const sectionCenter = rect.top + rect.height / 2;
            const distance = Math.abs(sectionCenter - (viewportHeight / 2));

            if (distance < minDistance) {
                minDistance = distance;
                closestSection = id;
            }
        });

        activeSection = closestSection;
    }

    if (activeSection && activeSection !== currentActiveSection) {
        currentActiveSection = activeSection;


        if (isDesktopMenuOpen && !HeaderStateManager.canShowDesktopMenu()) {
            hideDesktopMenu();
        }

        // POPRAWKA: Nie nadpisuj nav items jeśli header powinien być pełny
        // Sprawdź czy aktualizować wyświetlanie nav items
        const shouldShowFull = HeaderStateManager.shouldShowFullHeader();


        if (!shouldShowFull && headerState === HeaderStateManager.states.SCROLLING) {
            hideInactiveNavItems();
        } else if (shouldShowFull && headerState === HeaderStateManager.states.HERO) {
            // Upewnij się, że wszystkie nav items są widoczne
            showAllNavItems();
        }
    }

    navItems.forEach(li => {
        const a = li.querySelector('a');
        if (!a) return;

        const isActive = activeSection && a.hash === `#${activeSection}`;
        li.classList.toggle('visible', isActive);
        a.classList.toggle('active', isActive);
    });

    updateActiveNavStyling();
}


// POPRAWKA: Uproszczona funkcja updateHeaderUI - bez gap i logo
function updateHeaderUI() {
    const shouldBeFullHeader = HeaderStateManager.shouldShowFullHeader();
    const currentlyFullHeader = headerState === HeaderStateManager.states.HERO;

    if (shouldBeFullHeader === currentlyFullHeader) return;

    if (isHeaderHovered && !shouldBeFullHeader) return;

    gsap.killTweensOf([headerDot, headerWrap, ...navItems]);

    if (shouldBeFullHeader) {

        headerState = HeaderStateManager.states.HERO;

        // Zawsze pokaż wszystkie nav items przy full header
        showAllNavItems();

    } else {

        headerState = HeaderStateManager.states.SCROLLING;

        if (isDesktopMenuOpen) {
            hideDesktopMenu();
        }

        if (!isHeaderHovered) {
            hideInactiveNavItems();
        }
    }
}

// Navigation item management
function showAllNavItems() {

    navItems = headerNav.querySelectorAll('li');

    navItems.forEach((li, index) => {
        li.classList.remove('is-active');
        gsap.set(li, {
            position: 'relative',
            overflow: 'visible',
            width: 'auto',
            height: 'auto',
            pointerEvents: 'auto',
            display: 'block',
            opacity: 1
        });

        gsap.to(li, {
            opacity: 1,
            scale: 1,
            y: 0,
            duration: 0.35,
            delay: index * 0.06,
            ease: 'back.out(1.4)'
        });
    });
}

function hideInactiveNavItems() {
    // POPRAWKA: Nie ukrywaj nav items jeśli header powinien być pełny
    if (isHeaderHovered || HeaderStateManager.shouldShowFullHeader()) {

        return;
    }



    navItems = headerNav.querySelectorAll('li');
    if (navItems.length === 0) {
        setTimeout(hideInactiveNavItems, 50);
        return;
    }

    navItems.forEach(li => {
        li.classList.remove('is-active');
        gsap.set(li, {
            opacity: 0,
            position: 'absolute',
            overflow: 'hidden',
            width: 0,
            height: 0,
            pointerEvents: 'none'
        });
    });

    let activeNavItem = null;

    navItems.forEach(li => {
        const a = li.querySelector('a');
        if (!a) return;

        const sectionId = a.getAttribute('href').replace('#', '');

        if (sectionId === currentActiveSection) {
            activeNavItem = li;
        }
    });

    if (activeNavItem) {
        activeNavItem.classList.add('is-active');
        gsap.set(activeNavItem, {
            position: 'relative',
            overflow: 'visible',
            width: 'auto',
            height: 'auto',
            pointerEvents: 'auto'
        });

        gsap.to(activeNavItem, {
            opacity: 1,
            scale: 1,
            y: 0,
            duration: 0.1,
            ease: 'power2.out'
        });
    }
}

function showAllNavItemsOnScrollUp() {
    if (headerState !== HeaderStateManager.states.SCROLLING || isHeaderHovered || HeaderStateManager.shouldShowFullHeader()) return;

    navItems = headerNav.querySelectorAll('li');
    navItems.forEach((li, index) => {
        li.classList.remove('is-active');
        gsap.set(li, {
            position: 'relative',
            overflow: 'visible',
            width: 'auto',
            height: 'auto',
            pointerEvents: 'auto',
            display: 'block'
        });

        gsap.to(li, {
            opacity: 1,
            scale: 1,
            y: 0,
            duration: 0.15,
            delay: index * 0.01,
            ease: 'power2.out'
        });
    });
}

export { HeaderStateManager, initializeHeader, updateHeaderUI, hideInactiveNavItems, showAllNavItemsOnScrollUp, showAllNavItems, updateNavHighlight, headerWrap, headerNav, headerDesktopMenu, headerBgOverlay, navItems, isDesktopMenuOpen, body, headerButton, headerDot, heroSection, currentActiveSection, headerState };
