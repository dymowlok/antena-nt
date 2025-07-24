import { gsap } from 'gsap';
import ScrollTrigger from 'gsap/ScrollTrigger';
import { menuData } from '../data/menu';
import { isAtTop, isAtBottom } from "./scrollHelpers.js";
import { updateButtonTheme } from "./buttonTheme.js";
import { setupDesktopMenu } from "./desktopMenu.js";
import lenis from './utils/lenis.js';

gsap.registerPlugin(ScrollTrigger);

// Enhanced State management
let headerState = 'loading';
let currentActiveSection = 'hero';
let isHeaderHovered = false;
export const isScrollingUp = { value: false };
export const scrollUpTimer = { value: null };

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

// DOM elements
const body = document.body;
const header = document.querySelector('#header');
const headerWrap = header.querySelector('.header-wrap');
const headerButton = header.querySelector('a.button[href="#kontakt"]');
const headerDot = headerButton.querySelector('.dot');
const headerNav = header.querySelector('.header-nav ul');
const headerDesktopMenu = header.querySelector('.header-desktop-menu');
const headerBgOverlay = header.querySelector('.header-bg-overlay');
const heroSection = document.querySelector('#hero') || document.querySelector('main > section:first-child');
export const currentButtonTheme = { value: "white" };
let navItems = [];
let desktopMenuTimeout = null;
let isDesktopMenuOpen = false;
let hasSubmenuItems = false;

// Initialize navigation
function initializeNavItems() {
    console.log('🔧 Initializing nav items...');

    headerNav.innerHTML = '';
    menuData.forEach(({ label, url }) => {
        if (url === '#kontakt') return;

        const li = document.createElement('li');
        const a = document.createElement('a');
        a.href = url;
        a.textContent = label;
        li.appendChild(a);
        headerNav.appendChild(li);
    });
    navItems = headerNav.querySelectorAll('li');

    console.log('✅ Created', navItems.length, 'nav items');
    setupDesktopMenu();
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

// Initialize - POPRAWKA: ustaw gap na stałe 1rem
initializeNavItems();
headerWrap.style.gap = '1rem';

// ONLY essential CSS fixes - NO UI styling changes + REMOVED backdrop-filter
const essentialStyles = document.createElement('style');
essentialStyles.textContent = `
    .header-nav li.active-white-bg a.active {
        background-color: #ffffff !important;
        border-radius: 2.5rem;
        color: #000;
        transition: background-color 0.2s ease;
    }
    
    .header-nav li.active-gray-bg a.active {
        background-color: #f2f2f2 !important;
        border-radius: 2.5rem;
        color: #000;
        transition: background-color 0.2s ease;
    }
    
    .header-bg-overlay {
        position: fixed !important;
        top: 0 !important;
        left: 0 !important;
        right: 0 !important;
        bottom: 0 !important;
        width: 100vw !important;
        height: 100vh !important;
        background-color: rgba(0, 0, 0, 0);
        opacity: 0;
        visibility: hidden;
        z-index: 998 !important;
        transition: opacity 0.4s ease, 
                   background-color 0.4s ease,
                   visibility 0.4s ease;
        pointer-events: none;
        will-change: opacity, background-color;
        transform: translate3d(0, 0, 0);
    }
    
    .header-bg-overlay.active {
        opacity: 1 !important;
        visibility: visible !important;
        background-color: rgba(0, 0, 0, 0.5) !important;
        pointer-events: auto !important;
    }
    
    .header-desktop-menu {
        position: fixed !important;
        top: 1.25rem !important;
        left: 50% !important;
        transform: translateX(-50%) translateY(-10px) !important;
        width: auto;
        min-width: 600px;
        max-width: 800px;
        background-color: #ffffff;
        border-radius: 1.5rem;
        padding: 1.25rem;
        padding-top: calc(1.25rem + 60px + 1.25rem);
        opacity: 0;
        visibility: hidden;
        z-index: 999 !important;
        transition: opacity 0.3s ease, 
                   visibility 0.3s ease, 
                   transform 0.3s ease;
        box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
        pointer-events: none;
        will-change: transform, opacity;
    }
    
    .header-desktop-menu.active {
        opacity: 1 !important;
        visibility: visible !important;
        transform: translateX(-50%) translateY(0) !important;
        pointer-events: auto !important;
    }
    
    .header-desktop-menu-content {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 3rem;
        align-items: start;
    }
    
    .header-desktop-menu-column {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
    }
    
    .header-desktop-menu-column a {
        padding: 1rem 1.5rem;
        border-radius: 1rem;
        color: #000;
        text-decoration: none;
        font-size: 1.4rem;
        font-weight: 500;
        transition: background-color 0.2s ease, transform 0.2s ease;
        will-change: background-color, transform;
    }
    
    .header-desktop-menu-column a:hover {
        background-color: #f2f2f2;
        transform: translateX(4px);
    }
    
    .header-wrap {
        z-index: 1000 !important;
    }
    
    body.scroll-locked {
        overflow: hidden !important;
    }
`;
document.head.appendChild(essentialStyles);

// Header initialization
async function initializeHeader() {
    await waitForNavItems();

    if (!header) return;

    // Start with header hidden
    gsap.set(header, {
        top: '-100%',
        opacity: 0
    });

    // Show header after a short delay to ensure it appears
    setTimeout(() => {
        if (header && header.style.opacity === '0') {
            gsap.to(header, {
                top: '0',
                opacity: 1,
                duration: 0.5,
                ease: 'power2.out',
                onComplete: () => {
                    headerState = HeaderStateManager.states.HERO;
                    updateNavHighlight();
                    setTimeout(() => {
                        updateButtonTheme();
                    }, 100);
                }
            });
        }
    }, 1000); // Show header after 1 second

    // Also create ScrollTriggers as backup for hero elements
    const heroElements = [
        { selector: '.hero-content-text h1', delay: 0.2 },
        { selector: '.hero-content-text p', delay: 0.4 },
        { selector: '.hero-buttons', delay: 0.6 },
        { selector: '.hero-badge', delay: 0.8 }
    ];

    let headerShown = false;

    heroElements.forEach(({ selector, delay }) => {
        const element = document.querySelector(selector);
        if (!element) return;

        ScrollTrigger.create({
            trigger: element,
            start: 'top 85%',
            once: true,
            onEnter: () => {
                if (!headerShown && header && header.style.opacity === '0') {
                    headerShown = true;
                    gsap.to(header, {
                        top: '0',
                        opacity: 1,
                        duration: 0.5,
                        delay: delay,
                        ease: 'power2.out',
                        onComplete: () => {
                            headerState = HeaderStateManager.states.HERO;
                            updateNavHighlight();
                            setTimeout(() => {
                                updateButtonTheme();
                            }, 100);
                        }
                    });
                }
            }
        });
    });
}

initializeHeader();

// Scroll position helpers
// Navigation highlighting
const sectionMap = [
    { id: 'hero', el: document.querySelector('#hero') },
    { id: 'uslugi', el: document.querySelector('#uslugi') },
    { id: 'o-firmie', el: document.querySelector('#o-firmie') },
    { id: 'opinie', el: document.querySelector('#opinie') },
    { id: 'lokalizacje', el: document.querySelector('#lokalizacje') },
    { id: 'kontakt', el: document.querySelector('#kontakt') }
].filter(section => section.el);

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
        console.log('📍 Active section changed to:', activeSection);

        if (isDesktopMenuOpen && !HeaderStateManager.canShowDesktopMenu()) {
            hideDesktopMenu();
        }

        // POPRAWKA: Nie nadpisuj nav items jeśli header powinien być pełny
        // Sprawdź czy aktualizować wyświetlanie nav items
        const shouldShowFull = shouldShowFullHeader();
        console.log('🔍 Should show full header?', shouldShowFull);

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
    const shouldBeFullHeader = shouldShowFullHeader();
    const currentlyFullHeader = headerState === HeaderStateManager.states.HERO;

    if (shouldBeFullHeader === currentlyFullHeader) return;

    if (isHeaderHovered && !shouldBeFullHeader) return;

    gsap.killTweensOf([headerDot, headerWrap, ...navItems]);

    if (shouldBeFullHeader) {
        console.log('🔄 Switching to FULL header');
        headerState = HeaderStateManager.states.HERO;

        // Zawsze pokaż wszystkie nav items przy full header
        showAllNavItems();

    } else {
        console.log('🔄 Switching to COMPACT header');
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
    console.log('👥 Showing ALL nav items');
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
    if (isHeaderHovered || shouldShowFullHeader()) {
        console.log('❌ Cannot hide nav items - header should be full or hovered');
        return;
    }

    console.log('👤 Hiding inactive nav items, showing only:', currentActiveSection);

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
    if (headerState !== HeaderStateManager.states.SCROLLING || isHeaderHovered || shouldShowFullHeader()) return;

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
    }
}

export { HeaderStateManager, initializeHeader, updateHeaderUI, hideInactiveNavItems, showAllNavItemsOnScrollUp, showAllNavItems, updateNavHighlight, headerWrap, headerNav, headerDesktopMenu, headerBgOverlay, navItems, isDesktopMenuOpen, body, headerButton, headerDot, heroSection, currentActiveSection, headerState, currentButtonTheme, isScrollingUp, scrollUpTimer };
