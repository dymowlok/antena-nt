import Lenis from 'lenis';
import { gsap } from 'gsap';
import ScrollTrigger from 'gsap/ScrollTrigger';
import { menuData } from '../data/menu';

gsap.registerPlugin(ScrollTrigger);

// Enhanced State management
let headerState = 'loading';
let currentActiveSection = 'hero';
let isHeaderHovered = false;
let isScrollingUp = false;
let scrollUpTimer = null;

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
        return !this.shouldShowFullHeader() && !isScrollingUp && !isHeaderHovered;
    }
};

// Smooth scroll setup
const lenis = new Lenis({
    duration: 1.2,
    smooth: true
});

function raf(time) {
    lenis.raf(time);
    requestAnimationFrame(raf);
}
requestAnimationFrame(raf);

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
let currentButtonTheme = 'white';
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
gsap.set(header, { top: '-100%', opacity: 0 });

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
    gsap.to(header, {
        top: '0',
        opacity: 1,
        duration: 0.3,
        delay: 0.1,
        ease: 'power2.out',
        onComplete: () => {
            headerState = HeaderStateManager.states.HERO;
            updateNavHighlight();
            // POPRAWKA: Inicjalizuj button theme od razu
            setTimeout(() => {
                updateButtonTheme();
            }, 100);
        }
    });
}

initializeHeader();

// Scroll position helpers
function isAtTop() {
    return window.scrollY <= 50;
}

function isAtBottom() {
    return window.scrollY >= document.body.scrollHeight - window.innerHeight - 100;
}

function shouldShowFullHeader() {
    return HeaderStateManager.shouldShowFullHeader();
}

function shouldShowCompactHeader() {
    return HeaderStateManager.shouldShowCompactHeader();
}

// Background color transitions
const sections = document.querySelectorAll('main > section, main > section > .about-section, footer');
gsap.set(body, { backgroundColor: themeColors.white });

function getScrollDistance() {
    return window.matchMedia('(max-width: 899px)').matches ? 120 : 240;
}

document.querySelectorAll('[data-theme]').forEach((section, index, arr) => {
    const currentTheme = section.dataset.theme;
    const nextSection = arr[index + 1];
    const nextTheme = nextSection?.dataset.theme;
    if (!currentTheme || !nextTheme) return;

    ScrollTrigger.create({
        trigger: section,
        start: 'bottom center',
        end: `+=${getScrollDistance()}`,
        scrub: true,
        onUpdate: (self) => {
            const progress = self.progress;
            const fromRGB = gsap.utils.splitColor(themeColors[currentTheme]);
            const toRGB = gsap.utils.splitColor(themeColors[nextTheme]);
            const interpolated = fromRGB.map((c, i) =>
                Math.round(gsap.utils.interpolate(c, toRGB[i], progress))
            );
            gsap.set(body, { backgroundColor: `rgb(${interpolated.join(',')})` });

            const grayThemes = ['hero', 'kontakt'];
            const isCurrentGray = grayThemes.includes(section.id);
            const isNextGray = nextSection && grayThemes.includes(nextSection.id);
            const blend = gsap.utils.interpolate(isCurrentGray ? 1 : 0, isNextGray ? 1 : 0, progress);

            const newBgColor = blend > 0.5 ? themeColors.gray : themeColors.white;
            gsap.to(headerWrap, {
                backgroundColor: newBgColor,
                duration: 0.15,
                overwrite: 'auto',
                onUpdate: () => {
                    updateActiveNavStyling(newBgColor);
                },
                onComplete: () => {
                    updateActiveNavStyling(newBgColor);
                }
            });
        }
    });
});

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
    });
}

// Scroll handling
let lastScroll = window.scrollY;

function handleScrollDirection() {
    const currentScroll = window.scrollY;
    const scrollingDown = currentScroll > lastScroll + 1;
    const scrollingUp = currentScroll < lastScroll - 1;

    // POPRAWKA: Najpierw update header UI, potem nav highlight
    updateHeaderUI();
    updateNavHighlight();

    if (scrollingUp && !isAtTop()) {
        isScrollingUp = true;

        if (HeaderStateManager.shouldShowCompactHeader()) {
            showAllNavItemsOnScrollUp();
        }

        clearTimeout(scrollUpTimer);
        scrollUpTimer = setTimeout(() => {
            isScrollingUp = false;
            if (HeaderStateManager.shouldShowCompactHeader()) {
                hideInactiveNavItems();
            }
        }, 200);
    }

    lastScroll = currentScroll;

    // POPRAWKA: Zaktualizuj button theme po każdym scrollu
    updateButtonTheme();
}

// Desktop menu functionality
function setupDesktopMenu() {
    renderDesktopMenu();

    navItems.forEach(li => {
        const a = li.querySelector('a');
        if (!a) return;

        const href = a.getAttribute('href');
        const menuItem = menuData.find(item => item.url === href);

        if (menuItem && menuItem.submenu) {
            hasSubmenuItems = true;

            // Mouse enter na li z submenu
            li.addEventListener('mouseenter', () => {
                // KRYTYCZNE: Sprawdź czy można pokazać menu
                if (!HeaderStateManager.canShowDesktopMenu()) {
                    console.log('❌ Desktop menu blocked - not all nav items visible or wrong state');
                    return;
                }

                console.log('✅ Can show desktop menu - all nav items visible');
                showDesktopMenu(menuItem);
            });

            // Mouse leave z li z submenu
            li.addEventListener('mouseleave', (e) => {
                if (!HeaderStateManager.canShowDesktopMenu()) {
                    return;
                }

                const rect = headerDesktopMenu.getBoundingClientRect();
                const mouseY = e.clientY;
                const mouseX = e.clientX;

                // Jeśli mysz nie idzie w kierunku desktop menu, ukryj
                if (!(mouseY > rect.top - 10 && mouseY < rect.bottom + 10 &&
                    mouseX > rect.left - 10 && mouseX < rect.right + 10)) {
                    hideDesktopMenu();
                }
            });
        } else {
            // Mouse enter na li BEZ submenu - ukryj desktop menu
            li.addEventListener('mouseenter', () => {
                if (isDesktopMenuOpen) {
                    console.log('🚫 Hiding desktop menu - hovered li without submenu');
                    hideDesktopMenu();
                }
            });
        }
    });

    // Desktop menu hover handlers
    headerDesktopMenu.addEventListener('mouseenter', () => {
        clearTimeout(desktopMenuTimeout);
        console.log('🖱️ Desktop menu hovered - keeping open');
    });

    headerDesktopMenu.addEventListener('mouseleave', () => {
        console.log('🖱️ Left desktop menu - hiding');
        hideDesktopMenu();
    });

    // Header wrap hover handlers
    headerWrap.addEventListener('mouseenter', () => {
        if (isDesktopMenuOpen) {
            clearTimeout(desktopMenuTimeout);
        }
    });

    headerWrap.addEventListener('mouseleave', () => {
        if (isDesktopMenuOpen) {
            console.log('🖱️ Left header wrap - hiding desktop menu');
            hideDesktopMenu();
        }
    });

    // Scroll handler for strong scroll down
    let lastScrollForMenu = window.scrollY;
    window.addEventListener('scroll', () => {
        if (isDesktopMenuOpen) {
            const currentScroll = window.scrollY;
            const scrollDelta = currentScroll - lastScrollForMenu;

            if (scrollDelta > 100) {
                console.log('📜 Strong scroll down - hiding desktop menu');
                hideDesktopMenu();
            }

            lastScrollForMenu = currentScroll;
        }
    });
}

function renderDesktopMenu() {
    headerDesktopMenu.innerHTML = '';

    const content = document.createElement('div');
    content.className = 'header-desktop-menu-content';

    headerDesktopMenu.appendChild(content);
}

function showDesktopMenu(menuItem) {
    if (!menuItem || !menuItem.submenu || window.matchMedia('(max-width: 899px)').matches) {
        console.log('❌ Cannot show desktop menu:', !menuItem ? 'no menuItem' : !menuItem.submenu ? 'no submenu' : 'mobile device');
        return;
    }

    if (!HeaderStateManager.canShowDesktopMenu()) {
        console.log('❌ Desktop menu blocked - header not in allowed state');
        return;
    }

    console.log('🎯 Showing desktop menu for:', menuItem.label, 'with', menuItem.submenu.length, 'items');

    clearTimeout(desktopMenuTimeout);

    const content = headerDesktopMenu.querySelector('.header-desktop-menu-content');
    if (!content) {
        console.error('❌ Desktop menu content container not found!');
        return;
    }

    content.innerHTML = '';

    const itemsPerColumn = Math.ceil(menuItem.submenu.length / 2);
    console.log('📊 Items per column:', itemsPerColumn);

    for (let i = 0; i < 2; i++) {
        const column = document.createElement('div');
        column.className = 'header-desktop-menu-column';

        const start = i * itemsPerColumn;
        const end = start + itemsPerColumn;
        const columnItems = menuItem.submenu.slice(start, end);

        console.log(`📋 Column ${i + 1}:`, columnItems.map(item => item.label));

        columnItems.forEach(item => {
            const link = document.createElement('a');
            link.href = item.url;
            link.textContent = item.label;

            if (item.url.startsWith('#')) {
                link.addEventListener('click', (e) => {
                    e.preventDefault();
                    const targetId = item.url.substring(1);
                    const targetElement = document.getElementById(targetId);

                    if (targetElement) {
                        hideDesktopMenu();
                        lenis.scrollTo(targetElement, {
                            duration: 1.2,
                            easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t))
                        });
                    }
                });
            }

            column.appendChild(link);
        });

        content.appendChild(column);
    }

    console.log('✅ Desktop menu content rendered');

    // Blur zawartości strony
    const mainContent = document.querySelector('main');
    const footerContent = document.querySelector('footer');

    if (mainContent) {
        gsap.to(mainContent, {
            filter: 'blur(8px)',
            duration: 0.4,
            ease: 'power2.out'
        });
    }

    if (footerContent) {
        gsap.to(footerContent, {
            filter: 'blur(8px)',
            duration: 0.4,
            ease: 'power2.out'
        });
    }

    setTimeout(() => {
        console.log('🎬 Starting desktop menu animation');
        headerBgOverlay.classList.add('active');
        headerDesktopMenu.classList.add('active');
        isDesktopMenuOpen = true;

        setTimeout(() => {
            body.classList.add('scroll-locked');
            console.log('🔒 Scroll locked');
        }, 300);

    }, 100);
}

function hideDesktopMenu() {
    clearTimeout(desktopMenuTimeout);

    // Usuń blur z zawartości strony
    const mainContent = document.querySelector('main');
    const footerContent = document.querySelector('footer');

    if (mainContent) {
        gsap.to(mainContent, {
            filter: 'blur(0px)',
            duration: 0.4,
            ease: 'power2.out'
        });
    }

    if (footerContent) {
        gsap.to(footerContent, {
            filter: 'blur(0px)',
            duration: 0.4,
            ease: 'power2.out'
        });
    }

    headerBgOverlay.classList.remove('active');
    headerDesktopMenu.classList.remove('active');
    body.classList.remove('scroll-locked');
    isDesktopMenuOpen = false;
}

function startCloseTimer() {
    clearTimeout(desktopMenuTimeout);
    desktopMenuTimeout = setTimeout(() => {
        console.log('⏰ Timer expired - hiding desktop menu');
        hideDesktopMenu();
    }, 2000); // Skrócone do 2 sekund dla lepszego UX
}

function updateActiveNavStyling(headerBgColor = null) {
    if (!headerBgColor) {
        const computedStyle = window.getComputedStyle(headerWrap);
        headerBgColor = computedStyle.backgroundColor;
    }

    const isGrayBackground = headerBgColor === themeColors.gray ||
        headerBgColor === 'rgb(242, 242, 242)' ||
        headerBgColor.includes('242');

    navItems.forEach(li => {
        const a = li.querySelector('a');
        if (!a) return;

        li.classList.remove('active-white-bg', 'active-gray-bg');

        if (a.classList.contains('active')) {
            if (isGrayBackground) {
                li.classList.add('active-white-bg');
            } else {
                li.classList.add('active-gray-bg');
            }
        }
    });
}

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

// POPRAWKA: Uproszczona i niezawodna funkcja button theme z zarządzaniem dot
function updateButtonTheme() {
    if (!headerButton || !heroSection) return;

    const heroRect = heroSection.getBoundingClientRect();
    const heroVisible = heroRect.bottom > 0 && heroRect.top < window.innerHeight;

    // Jeśli sekcja hero jest widoczna w viewporcie
    if (heroVisible) {
        if (currentButtonTheme !== 'white') {
            animateButtonThemeChange('white');
        }
        // Pokaż dot gdy hero jest widoczne
        if (headerDot) {
            gsap.to(headerDot, {
                display: 'block',
                opacity: 1,
                duration: 0.3,
                ease: 'power2.out'
            });
        }
    } else {
        // Hero nie jest widoczne - button ma być black
        if (currentButtonTheme !== 'black') {
            animateButtonThemeChange('black');
        }
        // Ukryj dot gdy hero nie jest widoczne
        if (headerDot) {
            gsap.to(headerDot, {
                opacity: 0,
                duration: 0.2,
                ease: 'power2.in',
                onComplete: () => {
                    gsap.set(headerDot, { display: 'none' });
                }
            });
        }
    }
}

function animateButtonThemeChange(newTheme) {
    const oldTheme = currentButtonTheme;

    // Nie zmieniaj jeśli to ten sam theme
    if (oldTheme === newTheme) return;

    console.log(`🎨 Button theme change: ${oldTheme} → ${newTheme}`);

    const tl = gsap.timeline();

    tl.to(headerButton, {
        scale: 0.96,
        duration: 0.12,
        ease: 'power2.inOut',
        onComplete: () => {
            headerButton.classList.remove(oldTheme);
            headerButton.classList.add(newTheme);
            currentButtonTheme = newTheme;
        }
    })
        .to(headerButton, {
            scale: 1,
            duration: 0.15,
            ease: 'back.out(1.3)'
        });
}

// Event listeners
window.addEventListener('scroll', handleScrollDirection);
window.addEventListener('resize', () => {
    updateNavHighlight();
    updateButtonTheme();
});
ScrollTrigger.addEventListener('refresh', updateNavHighlight);

ScrollTrigger.refresh();

// POPRAWKA: Inicjalizacja button theme z dot management
setTimeout(() => {
    if (heroSection && headerButton) {
        // Ustaw początkowy theme based na aktualnej pozycji
        const heroRect = heroSection.getBoundingClientRect();
        const heroVisible = heroRect.bottom > 0 && heroRect.top < window.innerHeight;

        if (heroVisible) {
            currentButtonTheme = 'white';
            headerButton.classList.remove('light', 'black', 'gray');
            headerButton.classList.add('white');
            // Pokaż dot
            if (headerDot) {
                gsap.set(headerDot, { display: 'block', opacity: 1 });
            }
        } else {
            currentButtonTheme = 'black';
            headerButton.classList.remove('white', 'light', 'gray');
            headerButton.classList.add('black');
            // Ukryj dot
            if (headerDot) {
                gsap.set(headerDot, { display: 'none', opacity: 0 });
            }
        }

        console.log('✅ Button theme handler initialized with theme:', currentButtonTheme);
    }
}, 300);