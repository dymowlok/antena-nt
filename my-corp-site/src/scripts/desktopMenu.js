import { gsap } from "gsap";
import { menuData } from "../data/menu";
import lenis from "./utils/lenis.js";
import { headerDesktopMenu, headerBgOverlay, headerWrap, body, navItems, isDesktopMenuOpen, headerState, HeaderStateManager } from "./header.js";
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


export { setupDesktopMenu, showDesktopMenu, hideDesktopMenu };
