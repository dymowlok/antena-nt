import { gsap } from "gsap";
import { menuData } from "../data/menu";
import lenis from "./utils/lenis.js";
import { headerDesktopMenu, headerBgOverlay, headerWrap, body, navItems, isDesktopMenuOpen, headerState, HeaderStateManager } from "./header.js";

// Local variables to avoid import issues
let desktopMenuTimeout = null;
let hasSubmenuItems = false;

console.log('📦 desktopMenu.js is loading...');
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

                    return;
                }


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

                    hideDesktopMenu();
                }
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

    // Header wrap hover handlers
    headerWrap.addEventListener('mouseenter', () => {
        if (isDesktopMenuOpen) {
            clearTimeout(desktopMenuTimeout);
        }
    });

    headerWrap.addEventListener('mouseleave', () => {
        if (isDesktopMenuOpen) {

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

        return;
    }

    if (!HeaderStateManager.canShowDesktopMenu()) {

        return;
    }



    clearTimeout(desktopMenuTimeout);

    const content = headerDesktopMenu.querySelector('.header-desktop-menu-content');
    if (!content) {

        return;
    }

    content.innerHTML = '';

    const itemsPerColumn = Math.ceil(menuItem.submenu.length / 2);


    for (let i = 0; i < 2; i++) {
        const column = document.createElement('div');
        column.className = 'header-desktop-menu-column';

        const start = i * itemsPerColumn;
        const end = start + itemsPerColumn;
        const columnItems = menuItem.submenu.slice(start, end);



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

        headerBgOverlay.classList.add('active');
        headerDesktopMenu.classList.add('active');
        isDesktopMenuOpen = true;

        setTimeout(() => {
            body.classList.add('scroll-locked');

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

        hideDesktopMenu();
    }, 2000); // Skrócone do 2 sekund dla lepszego UX
}

function updateActiveNavStyling(headerBgColor = null) {
    // Add debounce to prevent infinite loops
    if (updateActiveNavStyling.isRunning) {
        return;
    }
    updateActiveNavStyling.isRunning = true;

    setTimeout(() => {
        updateActiveNavStyling.isRunning = false;
    }, 100);

    console.log('🔄 updateActiveNavStyling called');

    // Use the imported headerWrap or find it if not available
    let headerWrapElement = headerWrap || document.querySelector('.header-wrap');
    console.log('🔍 headerWrap element (imported):', headerWrap);
    console.log('🔍 headerWrap element (queried):', document.querySelector('.header-wrap'));
    console.log('🔍 Using headerWrap element:', headerWrapElement);

    if (!headerWrapElement) {
        console.log('❌ headerWrap not found!');
        return;
    }

    // Find the currently visible section/div with data-theme
    const sections = document.querySelectorAll('[data-theme]');
    let currentTheme = 'white'; // default

    console.log('📋 Found elements with data-theme:', sections.length);

    for (const section of sections) {
        const rect = section.getBoundingClientRect();
        console.log('📍 Element:', section.tagName, section.id || section.className, 'data-theme:', section.getAttribute('data-theme'), 'rect:', rect.top, rect.bottom);
        if (rect.top <= window.innerHeight / 2 && rect.bottom >= window.innerHeight / 2) {
            currentTheme = section.getAttribute('data-theme');
            console.log('🎯 Current theme:', currentTheme, 'from element:', section.tagName, section.id || section.className);
            break;
        }
    }

    console.log('🎨 Setting header-wrap background for theme:', currentTheme);

    // REMOVED: Header background color logic - now handled in main.js
    // This prevents conflicts between multiple scripts setting the same property

    // Get the current background color from the element
    const computedStyle = window.getComputedStyle(headerWrapElement);
    headerBgColor = computedStyle.backgroundColor;
    console.log('✅ Final header-wrap background-color:', headerBgColor);

    const isGrayBackground = headerBgColor === '#f7f7f7' ||
        headerBgColor === 'rgb(247, 247, 247)';

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

// Initialize the debounce flag
updateActiveNavStyling.isRunning = false;


// Make function globally available
window.updateActiveNavStyling = updateActiveNavStyling;

console.log('✅ desktopMenu.js finished loading');
console.log('🔧 updateActiveNavStyling function available globally');

export { setupDesktopMenu, showDesktopMenu, hideDesktopMenu };
