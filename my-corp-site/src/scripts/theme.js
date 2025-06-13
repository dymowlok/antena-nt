import Lenis from 'lenis';
import { gsap } from 'gsap';
import ScrollTrigger from 'gsap/ScrollTrigger';
import { menuData } from '../data/menu';

gsap.registerPlugin(ScrollTrigger);

// State management
let headerState = 'loading';
let currentActiveSection = 'hero';
let isHeaderHovered = false;
let isScrollingUp = false;
let scrollUpTimer = null;

// Smooth scroll setup
const lenis = new Lenis({ duration: 1.2, smooth: true });
function raf(time) {
    lenis.raf(time);
    requestAnimationFrame(raf);
}
requestAnimationFrame(raf);

// Theme colors
const themeColors = {
    white: '#ffffff',
    light: '#f2f2f2', // Updated to match your specification
    indigo: '#7c7cf8',
    sky: '#afd9fa',
    blue: '#3d76f7',
    orange: '#ff603c',
    black: '#000000',
    gray: '#f2f2f2' // Updated to match your specification
};

// DOM elements
const body = document.body;
const header = document.querySelector('#header');
const headerWrap = header.querySelector('.header-wrap');
const headerLogoText = header.querySelector('.header-logo-text');
const headerButton = header.querySelector('a.button[href="#kontakt"]');
const headerDot = headerButton.querySelector('.dot');
const headerNav = header.querySelector('.header-nav ul');
const headerDesktopMenu = header.querySelector('.header-desktop-menu');
const headerBgOverlay = header.querySelector('.header-bg-overlay');

let navItems = [];
let desktopMenuTimeout = null;
let isDesktopMenuOpen = false;
let hasSubmenuItems = false;

// Initialize navigation
function initializeNavItems() {
    console.log('🔧 Initializing nav items...'); // Debug

    headerNav.innerHTML = '';
    menuData.forEach(({ label, url }) => {
        // Skip kontakt link - it has dedicated button
        if (url === '#kontakt') return;

        const li = document.createElement('li');
        const a = document.createElement('a');
        a.href = url;
        a.textContent = label;
        li.appendChild(a);
        headerNav.appendChild(li);
    });
    navItems = headerNav.querySelectorAll('li');

    console.log('✅ Created', navItems.length, 'nav items'); // Debug
    console.log('📋 MenuData:', menuData); // Debug

    // Setup desktop menu immediately after nav items are created
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
        if (!isHeaderHovered && shouldShowCompactHeader()) {
            hideInactiveNavItems();
        }
    }, 100);
});

// Initialize
initializeNavItems();
headerWrap.style.gap = '2rem';
gsap.set(header, { top: '-100%', opacity: 0 });

// Setup desktop menu and overlay
setupDesktopMenu();

// Add CSS for active nav styling and desktop menu
const activeNavStyles = document.createElement('style');
activeNavStyles.textContent = `
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
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        background-color: rgba(0, 0, 0, 0.5);
        backdrop-filter: blur(0px);
        opacity: 0;
        visibility: hidden;
        z-index: 998;
        transition: opacity 0.4s ease, backdrop-filter 0.4s ease, visibility 0.4s ease;
        pointer-events: none;
    }
    
    .header-bg-overlay.active {
        opacity: 1;
        visibility: visible;
        backdrop-filter: blur(15px);
        pointer-events: auto;
    }
    
    .header-desktop-menu {
        position: fixed;
        top: 1.25rem;
        left: 50%;
        transform: translateX(-50%);
        width: auto;
        min-width: 600px;
        background-color: #ffffff;
        border-radius: 1.5rem;
        padding: 1.25rem;
        padding-top: calc(1.25rem + 60px + 1.25rem);
        opacity: 0;
        visibility: hidden;
        z-index: 999;
        transition: opacity 0.3s ease, visibility 0.3s ease, transform 0.3s ease;
        transform: translateX(-50%) translateY(-10px);
        box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
        pointer-events: none;
    }
    
    .header-desktop-menu.active {
        opacity: 1;
        visibility: visible;
        transform: translateX(-50%) translateY(0);
        pointer-events: auto;
    }
    
    .header-desktop-menu-content {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 3rem;
    }
    
    .header-desktop-menu-column {
        display: flex;
        flex-direction: column;
        gap: 1rem;
    }
    
    .header-desktop-menu-column a {
        padding: 1rem 1.5rem;
        border-radius: 1rem;
        color: #000;
        text-decoration: none;
        font-size: 1.4rem;
        font-weight: 500;
        transition: background-color 0.2s ease;
    }
    
    .header-desktop-menu-column a:hover {
        background-color: #f2f2f2;
    }
    
    .header-wrap {
        z-index: 1000 !important;
    }
    
    body.scroll-locked {
        overflow: hidden;
    }
`;
document.head.appendChild(activeNavStyles);

// Header initialization
async function initializeHeader() {
    await waitForNavItems();
    gsap.to(header, {
        top: '2.5rem',
        opacity: 1,
        duration: 0.3,
        delay: 0.1,
        ease: 'power2.out',
        onComplete: () => {
            headerState = 'hero';
            updateNavHighlight();
        }
    });
}

initializeHeader();

// Scroll position helpers
function isAtTop() {
    return window.scrollY <= 50; // Increased threshold for better UX
}

function isAtBottom() {
    return window.scrollY >= document.body.scrollHeight - window.innerHeight - 100;
}

function shouldShowFullHeader() {
    return isAtTop() || isAtBottom() || currentActiveSection === 'kontakt';
}

function shouldShowCompactHeader() {
    return !shouldShowFullHeader() && !isScrollingUp && !isHeaderHovered;
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

            // Header background
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

// Header state management
function updateHeaderUI() {
    const shouldBeFullHeader = shouldShowFullHeader();
    const currentlyFullHeader = headerState === 'hero';

    // Only update if state actually changes
    if (shouldBeFullHeader === currentlyFullHeader) return;

    // Don't animate during hover (except for top/bottom)
    if (isHeaderHovered && !shouldBeFullHeader) return;

    gsap.killTweensOf([headerLogoText, headerDot, headerWrap, ...navItems]);

    if (shouldBeFullHeader) {
        // FULL HEADER STATE (top or bottom or kontakt)
        headerState = 'hero';

        // Logo text and dot logic - ONLY show at very top
        if (isAtTop()) {
            // FULL HEADER WITH LOGO TEXT (only at very top)
            gsap.set([headerLogoText, headerDot], {
                clearProps: "all",
                position: 'relative',
                visibility: 'visible',
                display: 'block',
                zIndex: 1,
                pointerEvents: 'auto',
                opacity: 0,
                scaleX: 0.6,
                x: -8
            });
        } else {
            // FULL HEADER WITHOUT LOGO TEXT (kontakt, footer)
            gsap.set([headerLogoText, headerDot], {
                visibility: 'hidden',
                position: 'absolute',
                display: 'none',
                zIndex: -1,
                pointerEvents: 'none',
                opacity: 0
            });
        }

        const tl = gsap.timeline();

        tl.to(headerWrap, {
            gap: '2rem',
            duration: 0.3,
            ease: 'power2.out'
        });

        // Only animate logo text if at very top
        if (isAtTop()) {
            tl.to([headerLogoText, headerDot], {
                opacity: 1,
                scaleX: 1,
                x: 0,
                duration: 0.25,
                ease: 'back.out(1.4)',
                onComplete: () => {
                    gsap.set([headerLogoText, headerDot], {
                        position: 'relative',
                        visibility: 'visible',
                        display: 'block',
                        zIndex: 1,
                        pointerEvents: 'auto',
                        opacity: 1,
                        scaleX: 1,
                        x: 0
                    });
                }
            }, "<0.1");
        }

        tl.call(() => {
            showAllNavItems();
        }, null, 0.1);

        // Button styling - white ONLY at very top, black everywhere else
        headerButton.classList.remove('black', 'gray', 'white');
        if (isAtTop()) {
            headerButton.classList.add('white');
        } else {
            headerButton.classList.add('black');
        }

    } else {
        // COMPACT HEADER STATE
        headerState = 'scrolling';

        const tl = gsap.timeline();

        tl.to(headerWrap, {
            gap: '1rem',
            duration: 0.25,
            ease: 'power2.out'
        })
            .to([headerLogoText, headerDot], {
                opacity: 0,
                scaleX: 0.5,
                x: -12,
                duration: 0.2,
                ease: 'power2.in',
                onComplete: () => {
                    gsap.set([headerLogoText, headerDot], {
                        visibility: 'hidden',
                        position: 'absolute',
                        display: 'none',
                        zIndex: -1,
                        pointerEvents: 'none'
                    });
                }
            }, "<")
            .call(() => {
                if (!isHeaderHovered) {
                    hideInactiveNavItems();
                }
            }, null, "<");

        // Button styling - always black in compact mode
        headerButton.classList.remove('white', 'gray');
        headerButton.classList.add('black');
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
            opacity: 0,
            scale: 0.85,
            y: -8
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
    // Don't hide during hover, but ALWAYS update during scroll for correct active item
    if (isHeaderHovered && !shouldShowCompactHeader()) return;

    navItems = headerNav.querySelectorAll('li');
    if (navItems.length === 0) {
        setTimeout(hideInactiveNavItems, 50);
        return;
    }

    // Hide all items instantly
    navItems.forEach(li => {
        li.classList.remove('is-active');
        gsap.set(li, {
            opacity: 0,
            scale: 0.75,
            position: 'absolute',
            overflow: 'hidden',
            width: 0,
            height: 0,
            pointerEvents: 'none'
        });
    });

    // Find the nav item that corresponds to current active section
    let activeNavItem = null;

    navItems.forEach(li => {
        const a = li.querySelector('a');
        if (!a) return;

        const sectionId = a.getAttribute('href').replace('#', '');

        // Match current active section
        if (sectionId === currentActiveSection) {
            activeNavItem = li;
        }
    });

    // Show the active nav item immediately
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
            duration: 0.1, // Much faster transition
            ease: 'power2.out'
        });
    }
}

function showAllNavItemsOnScrollUp() {
    if (headerState !== 'scrolling' || isHeaderHovered || shouldShowFullHeader()) return;

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

    // CRITICAL: Always update active section first, before any other logic
    updateNavHighlight();

    // Handle scroll up behavior
    if (scrollingUp && !isAtTop()) {
        isScrollingUp = true;

        if (shouldShowCompactHeader()) {
            showAllNavItemsOnScrollUp();
        }

        clearTimeout(scrollUpTimer);
        scrollUpTimer = setTimeout(() => {
            isScrollingUp = false;
            if (shouldShowCompactHeader()) {
                hideInactiveNavItems();
            }
        }, 200); // Even shorter - 200ms
    }

    lastScroll = currentScroll;

    // Update header state
    updateHeaderUI();
}

// Setup desktop menu functionality
function setupDesktopMenu() {
    // Create desktop menu content from menuData
    renderDesktopMenu();

    // Add hover listeners to nav items with submenus
    navItems.forEach(li => {
        const a = li.querySelector('a');
        if (!a) return;

        const href = a.getAttribute('href');
        const menuItem = menuData.find(item => item.url === href);

        if (menuItem && menuItem.submenu) {
            hasSubmenuItems = true;

            // Mouse enter - show desktop menu
            li.addEventListener('mouseenter', () => {
                showDesktopMenu(menuItem);
            });

            // Mouse leave - start close timer
            li.addEventListener('mouseleave', (e) => {
                // Check if mouse is moving to desktop menu
                const rect = headerDesktopMenu.getBoundingClientRect();
                const mouseY = e.clientY;
                const mouseX = e.clientX;

                if (mouseY > rect.top - 10 && mouseY < rect.bottom + 10 &&
                    mouseX > rect.left - 10 && mouseX < rect.right + 10) {
                    // Mouse is moving towards desktop menu, don't close
                    return;
                }

                startCloseTimer();
            });
        }
    });

    // Desktop menu hover handlers
    headerDesktopMenu.addEventListener('mouseenter', () => {
        clearTimeout(desktopMenuTimeout);
    });

    headerDesktopMenu.addEventListener('mouseleave', () => {
        hideDesktopMenu();
    });

    // Header wrap hover to maintain menu
    headerWrap.addEventListener('mouseenter', () => {
        if (isDesktopMenuOpen) {
            clearTimeout(desktopMenuTimeout);
        }
    });

    headerWrap.addEventListener('mouseleave', () => {
        if (isDesktopMenuOpen) {
            startCloseTimer();
        }
    });

    // Scroll handler for strong scroll down
    let lastScrollForMenu = window.scrollY;
    window.addEventListener('scroll', () => {
        if (isDesktopMenuOpen) {
            const currentScroll = window.scrollY;
            const scrollDelta = currentScroll - lastScrollForMenu;

            // Strong scroll down (more than 100px)
            if (scrollDelta > 100) {
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

    console.log('🎯 Showing desktop menu for:', menuItem.label, 'with', menuItem.submenu.length, 'items'); // Debug

    clearTimeout(desktopMenuTimeout);

    // Render submenu content
    const content = headerDesktopMenu.querySelector('.header-desktop-menu-content');
    if (!content) {
        console.error('❌ Desktop menu content container not found!');
        return;
    }

    content.innerHTML = '';

    // Split submenu items into two columns
    const itemsPerColumn = Math.ceil(menuItem.submenu.length / 2);
    console.log('📊 Items per column:', itemsPerColumn); // Debug

    for (let i = 0; i < 2; i++) {
        const column = document.createElement('div');
        column.className = 'header-desktop-menu-column';

        const start = i * itemsPerColumn;
        const end = start + itemsPerColumn;
        const columnItems = menuItem.submenu.slice(start, end);

        console.log(`📋 Column ${i + 1}:`, columnItems.map(item => item.label)); // Debug

        columnItems.forEach(item => {
            const link = document.createElement('a');
            link.href = item.url;
            link.textContent = item.label;

            // Add smooth scroll to submenu links if they're internal
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

    console.log('✅ Desktop menu content rendered'); // Debug

    // Show with animation (0.1s delay + 0.3s animation)
    setTimeout(() => {
        console.log('🎬 Starting desktop menu animation'); // Debug
        headerBgOverlay.classList.add('active');
        headerDesktopMenu.classList.add('active');
        isDesktopMenuOpen = true;

        // Lock scroll after menu is fully visible
        setTimeout(() => {
            body.classList.add('scroll-locked');
            console.log('🔒 Scroll locked'); // Debug
        }, 300);

    }, 100);
}

function hideDesktopMenu() {
    clearTimeout(desktopMenuTimeout);

    headerBgOverlay.classList.remove('active');
    headerDesktopMenu.classList.remove('active');
    body.classList.remove('scroll-locked');
    isDesktopMenuOpen = false;
}

function startCloseTimer() {
    clearTimeout(desktopMenuTimeout);
    desktopMenuTimeout = setTimeout(() => {
        hideDesktopMenu();
    }, 15000); // 15 seconds
}
function updateActiveNavStyling(headerBgColor = null) {
    // Get current header background color if not provided
    if (!headerBgColor) {
        const computedStyle = window.getComputedStyle(headerWrap);
        headerBgColor = computedStyle.backgroundColor;
    }

    // Simple two-color logic: white (#fff) vs gray (#f2f2f2)
    const isGrayBackground = headerBgColor === themeColors.gray ||
        headerBgColor === 'rgb(242, 242, 242)' ||
        headerBgColor.includes('242');

    navItems.forEach(li => {
        const a = li.querySelector('a');
        if (!a) return;

        // Remove existing background classes first
        li.classList.remove('active-white-bg', 'active-gray-bg');

        if (a.classList.contains('active')) {
            if (isGrayBackground) {
                // Header is gray (#f2f2f2) -> active link gets white background (#fff)
                li.classList.add('active-white-bg');
            } else {
                // Header is white (#fff) -> active link gets gray background (#f2f2f2)
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
].filter(section => section.el); // Remove null elements

function updateNavHighlight() {
    const viewportHeight = window.innerHeight;
    const viewportCenter = viewportHeight / 2;
    let activeSection = null;
    let bestScore = -1;

    sectionMap.forEach(({ id, el }) => {
        if (!el) return;

        const rect = el.getBoundingClientRect();

        // Calculate visibility percentage
        const visibleTop = Math.max(0, rect.top);
        const visibleBottom = Math.min(viewportHeight, rect.bottom);
        const visibleHeight = Math.max(0, visibleBottom - visibleTop);
        const sectionHeight = rect.height;
        const visibilityPercent = sectionHeight > 0 ? visibleHeight / sectionHeight : 0;

        // Calculate distance from center (closer to center = higher priority)
        const sectionCenter = rect.top + rect.height / 2;
        const distanceFromCenter = Math.abs(sectionCenter - viewportCenter);
        const maxDistance = viewportHeight;
        const centerScore = 1 - (distanceFromCenter / maxDistance);

        // Combined score: visibility + center proximity
        const combinedScore = (visibilityPercent * 0.7) + (centerScore * 0.3);

        // Section must be at least 20% visible to be considered
        if (visibilityPercent >= 0.2 && combinedScore > bestScore) {
            bestScore = combinedScore;
            activeSection = id;
        }
    });

    // Fallback: if no section is active, find the one closest to viewport center
    if (!activeSection) {
        let closestSection = null;
        let minDistance = Infinity;

        sectionMap.forEach(({ id, el }) => {
            if (!el) return;

            const rect = el.getBoundingClientRect();
            const sectionCenter = rect.top + rect.height / 2;
            const distance = Math.abs(sectionCenter - viewportCenter);

            if (distance < minDistance) {
                minDistance = distance;
                closestSection = id;
            }
        });

        activeSection = closestSection;
    }

    // Update current active section - ALWAYS update immediately
    if (activeSection && activeSection !== currentActiveSection) {
        currentActiveSection = activeSection;

        // Update compact header immediately, regardless of scroll direction
        if (shouldShowCompactHeader()) {
            // Force immediate update even during scroll up
            hideInactiveNavItems();
        }
    }

    // Update nav item classes
    navItems.forEach(li => {
        const a = li.querySelector('a');
        if (!a) return;

        const isActive = activeSection && a.hash === `#${activeSection}`;
        li.classList.toggle('visible', isActive);
        a.classList.toggle('active', isActive);
    });

    // Update active nav styling after class changes
    updateActiveNavStyling();
}

// Event listeners
window.addEventListener('scroll', handleScrollDirection);
window.addEventListener('scroll', updateNavHighlight);
window.addEventListener('resize', updateNavHighlight);
ScrollTrigger.addEventListener('refresh', updateNavHighlight);

ScrollTrigger.refresh();