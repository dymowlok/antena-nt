import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { menuData } from '../data/menu';
import { debugLog, debugWarn } from './utils/debug.js';
import lenis from './utils/lenis.js';

gsap.registerPlugin(ScrollTrigger);

// Unified Header State Management
class UnifiedHeaderManager {
    constructor() {
        this.headerState = 'loading';
        this.currentActiveSection = 'hero';
        this.isHeaderHovered = false;
        this.isScrollingUp = false;
        this.scrollUpTimer = null;
        this.currentButtonTheme = 'white';
        this.isDesktopMenuOpen = false;
        this.desktopMenuTimeout = null;
        this.hasSubmenuItems = false;

        // DOM elements
        this.header = document.querySelector('.header');
        this.headerWrap = document.querySelector('.header-wrap');
        this.headerNav = document.querySelector('.header-nav');
        this.headerDesktopMenu = document.querySelector('.header-desktop-menu');
        this.headerBgOverlay = document.querySelector('.header-bg-overlay');
        this.headerButton = document.querySelector('.header a.button');
        this.headerDot = document.querySelector('.header-dot');
        this.heroSection = document.querySelector('#hero');
        this.body = document.body;

        this.navItems = [];
        this.sectionMap = [
            { id: 'hero', el: document.querySelector('#hero') },
            { id: 'uslugi', el: document.querySelector('#uslugi') },
            { id: 'o-firmie', el: document.querySelector('#o-firmie') },
            { id: 'opinie', el: document.querySelector('#opinie') },
            { id: 'lokalizacje', el: document.querySelector('#lokalizacje') },
            { id: 'kontakt', el: document.querySelector('#kontakt') }
        ].filter(section => section.el);

        this.init();
    }

    init() {
        this.initializeNavItems();
        this.setupEventListeners();
        this.setupDesktopMenu();
        this.updateButtonTheme();
        this.updateHeaderBackground();
    }

    // Header State Management
    canShowDesktopMenu() {
        const allowedSections = ['hero', 'kontakt'];
        const isAtTopOrBottom = this.shouldShowFullHeader();
        const isFullHeaderState = this.headerState === 'hero';
        const allNavItemsVisible = this.areAllNavItemsVisible();

        return isAtTopOrBottom && isFullHeaderState &&
            allowedSections.includes(this.currentActiveSection) &&
            allNavItemsVisible;
    }

    areAllNavItemsVisible() {
        const navItems = document.querySelectorAll('.header-nav li');
        if (navItems.length === 0) return false;

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

        return visibleCount === navItems.length && visibleCount > 1;
    }

    shouldShowFullHeader() {
        const firstSection = document.querySelector('#hero');
        if (firstSection) {
            const rect = firstSection.getBoundingClientRect();
            const visibleHeight = Math.max(0, Math.min(window.innerHeight, rect.bottom) - Math.max(0, rect.top));
            const visibilityRatio = visibleHeight / window.innerHeight;

            if (visibilityRatio >= 0.5) {
                return true;
            }
        }

        const lastSection = document.querySelector('main > section:last-child, footer');
        if (lastSection) {
            const rect = lastSection.getBoundingClientRect();
            const visibleHeight = Math.max(0, Math.min(window.innerHeight, rect.bottom) - Math.max(0, rect.top));
            const visibilityRatio = visibleHeight / window.innerHeight;

            if (visibilityRatio >= 0.5) {
                return true;
            }
        }

        const kontaktSection = document.querySelector('#kontakt');
        if (kontaktSection) {
            const rect = kontaktSection.getBoundingClientRect();
            const visibleHeight = Math.max(0, Math.min(window.innerHeight, rect.bottom) - Math.max(0, rect.top));
            const visibilityRatio = visibleHeight / window.innerHeight;

            if (visibilityRatio >= 0.5) {
                return true;
            }
        }

        return this.isAtTop() || this.isAtBottom();
    }

    shouldShowCompactHeader() {
        return !this.shouldShowFullHeader() && !this.isScrollingUp && !this.isHeaderHovered;
    }

    isAtTop() {
        return window.scrollY <= 50;
    }

    isAtBottom() {
        return window.scrollY >= document.body.scrollHeight - window.innerHeight - 100;
    }

    // Navigation Management
    initializeNavItems() {
        this.navItems = Array.from(document.querySelectorAll('.header-nav li'));
        this.updateNavHighlight();
    }

    updateNavHighlight() {
        this.sectionMap.forEach(section => {
            if (!section.el) return;

            const rect = section.el.getBoundingClientRect();
            const isVisible = rect.top <= window.innerHeight / 2 && rect.bottom >= window.innerHeight / 2;

            if (isVisible) {
                this.currentActiveSection = section.id;
                this.updateActiveNavItem(section.id);
            }
        });
    }

    updateActiveNavItem(sectionId) {
        this.navItems.forEach(li => {
            const a = li.querySelector('a');
            if (!a) return;

            const href = a.getAttribute('href');
            const isActive = href === `#${sectionId}`;

            a.classList.toggle('active', isActive);
        });
    }

    // Button Theme Management
    updateButtonTheme() {
        if (!this.headerButton || !this.heroSection) return;

        const heroRect = this.heroSection.getBoundingClientRect();
        const heroVisible = heroRect.bottom > 0 && heroRect.top < window.innerHeight;

        if (heroVisible) {
            if (this.currentButtonTheme !== 'white') {
                this.animateButtonThemeChange('white');
            }
            this.showDot();
        } else {
            if (this.currentButtonTheme !== 'black') {
                this.animateButtonThemeChange('black');
            }
            this.hideDot();
        }
    }

    animateButtonThemeChange(newTheme) {
        const oldTheme = this.currentButtonTheme;
        if (oldTheme === newTheme) return;

        if (!this.headerButton) return;

        const tl = gsap.timeline();

        tl.to(this.headerButton, {
            scale: 0.96,
            duration: 0.12,
            ease: 'power2.inOut',
            onComplete: () => {
                if (this.headerButton) {
                    this.headerButton.classList.remove(oldTheme);
                    this.headerButton.classList.add(newTheme);
                    this.currentButtonTheme = newTheme;
                }
            }
        })
            .to(this.headerButton, {
                scale: 1,
                duration: 0.15,
                ease: 'back.out(1.3)'
            });
    }

    showDot() {
        if (this.headerDot) {
            gsap.to(this.headerDot, {
                display: 'block',
                opacity: 1,
                duration: 0.3,
                ease: 'power2.out'
            });
        }
    }

    hideDot() {
        if (this.headerDot) {
            gsap.to(this.headerDot, {
                opacity: 0,
                duration: 0.2,
                ease: 'power2.in',
                onComplete: () => {
                    gsap.set(this.headerDot, { display: 'none' });
                }
            });
        }
    }

    // Header Background Management
    updateHeaderBackground() {
        if (!this.headerWrap) return;

        const sections = document.querySelectorAll('[data-theme]');
        let currentTheme = 'white';

        for (const section of sections) {
            const rect = section.getBoundingClientRect();
            const visibleHeight = Math.min(rect.bottom, window.innerHeight) - Math.max(rect.top, 0);

            if (visibleHeight > 0 && rect.top <= window.innerHeight / 2 && rect.bottom >= window.innerHeight / 2) {
                currentTheme = section.getAttribute('data-theme') || 'white';
                break;
            }
        }

        if (currentTheme === 'white') {
            this.headerWrap.style.setProperty('background-color', '#f7f7f7', 'important');
        } else {
            this.headerWrap.style.setProperty('background-color', '#fff', 'important');
        }
    }

    // Desktop Menu Management
    setupDesktopMenu() {
        this.renderDesktopMenu();

        this.navItems.forEach(li => {
            const a = li.querySelector('a');
            if (!a) return;

            const href = a.getAttribute('href');
            const menuItem = menuData.find(item => item.url === href);

            if (menuItem && menuItem.submenu) {
                this.hasSubmenuItems = true;

                li.addEventListener('mouseenter', () => {
                    if (!this.canShowDesktopMenu()) return;
                    this.showDesktopMenu(menuItem);
                });

                li.addEventListener('mouseleave', (e) => {
                    if (!this.canShowDesktopMenu()) return;

                    if (this.headerDesktopMenu) {
                        const rect = this.headerDesktopMenu.getBoundingClientRect();
                        const mouseY = e.clientY;
                        const mouseX = e.clientX;

                        if (!(mouseY > rect.top - 10 && mouseY < rect.bottom + 10 &&
                            mouseX > rect.left - 10 && mouseX < rect.right + 10)) {
                            this.hideDesktopMenu();
                        }
                    }
                });
            } else {
                li.addEventListener('mouseenter', () => {
                    if (this.isDesktopMenuOpen) {
                        this.hideDesktopMenu();
                    }
                });
            }
        });

        // Desktop menu hover handlers
        if (this.headerDesktopMenu) {
            this.headerDesktopMenu.addEventListener('mouseenter', () => {
                if (this.desktopMenuTimeout) {
                    clearTimeout(this.desktopMenuTimeout);
                }
            });

            this.headerDesktopMenu.addEventListener('mouseleave', () => {
                this.hideDesktopMenu();
            });
        }

        // Header wrap hover handlers
        if (this.headerWrap) {
            this.headerWrap.addEventListener('mouseenter', () => {
                if (this.isDesktopMenuOpen && this.desktopMenuTimeout) {
                    clearTimeout(this.desktopMenuTimeout);
                }
            });

            this.headerWrap.addEventListener('mouseleave', () => {
                if (this.isDesktopMenuOpen) {
                    this.hideDesktopMenu();
                }
            });
        }
    }

    renderDesktopMenu() {
        if (!this.headerDesktopMenu) return;

        this.headerDesktopMenu.innerHTML = '';

        // menuData.forEach(item => {
        //     if (item.submenu) {
        //         const menuItem = document.createElement('div');
        //         menuItem.className = 'desktop-menu-item';
        //         menuItem.innerHTML = `
        //             <h3>${item.title}</h3>
        //             <ul>
        //                 ${item.submenu.map(subItem => `
        //                     <li><a href="${subItem.url}">${subItem.title}</a></li>
        //                 `).join('')}
        //             </ul>
        //         `;
        //         this.headerDesktopMenu.appendChild(menuItem);
        //     }
        // });
    }

    showDesktopMenu(menuItem) {
        if (!this.headerDesktopMenu || this.isDesktopMenuOpen) return;

        this.isDesktopMenuOpen = true;
        this.headerDesktopMenu.classList.add('active');
        if (this.headerBgOverlay) {
            this.headerBgOverlay.classList.add('active');
        }
        if (this.body) {
            this.body.classList.add('scroll-locked');
        }

        // Blur main content
        const mainContent = document.querySelector('main');
        const footerContent = document.querySelector('footer');

        if (mainContent) {
            gsap.to(mainContent, {
                filter: 'blur(4px)',
                duration: 0.4,
                ease: 'power2.out'
            });
        }

        if (footerContent) {
            gsap.to(footerContent, {
                filter: 'blur(4px)',
                duration: 0.4,
                ease: 'power2.out'
            });
        }

        this.startCloseTimer();
    }

    hideDesktopMenu() {
        if (!this.isDesktopMenuOpen) return;

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

        if (this.headerBgOverlay) {
            this.headerBgOverlay.classList.remove('active');
        }
        if (this.headerDesktopMenu) {
            this.headerDesktopMenu.classList.remove('active');
        }
        if (this.body) {
            this.body.classList.remove('scroll-locked');
        }
        this.isDesktopMenuOpen = false;
    }

    startCloseTimer() {
        if (this.desktopMenuTimeout) {
            clearTimeout(this.desktopMenuTimeout);
        }
        this.desktopMenuTimeout = setTimeout(() => {
            this.hideDesktopMenu();
        }, 2000);
    }

    // Event Listeners
    setupEventListeners() {
        // Scroll direction detection
        let lastScroll = window.scrollY;

        const handleScroll = () => {
            const currentScroll = window.scrollY;
            const scrollingUp = currentScroll < lastScroll - 1;

            this.updateHeaderUI();
            this.updateNavHighlight();

            if (scrollingUp && !this.isAtTop()) {
                this.isScrollingUp = true;
                if (this.shouldShowCompactHeader()) {
                    this.showAllNavItemsOnScrollUp();
                }
                if (this.scrollUpTimer) {
                    clearTimeout(this.scrollUpTimer);
                }
                this.scrollUpTimer = setTimeout(() => {
                    this.isScrollingUp = false;
                    if (this.shouldShowCompactHeader()) {
                        this.hideInactiveNavItems();
                    }
                }, 200);
            }

            lastScroll = currentScroll;
            this.updateButtonTheme();
        };

        window.addEventListener('scroll', handleScroll);

        // Resize handler
        window.addEventListener('resize', () => {
            this.updateButtonTheme();
            this.updateHeaderBackground();
        });

        // Initialize on load
        document.addEventListener('DOMContentLoaded', () => {
            this.updateHeaderBackground();
        });

        window.addEventListener('load', () => {
            this.updateHeaderBackground();
        });
    }

    // Header UI Updates
    updateHeaderUI() {
        if (this.shouldShowFullHeader()) {
            this.showAllNavItems();
            this.headerState = 'hero';
        } else if (this.shouldShowCompactHeader()) {
            this.hideInactiveNavItems();
            this.headerState = 'scrolling';
        }
    }

    showAllNavItems() {
        this.navItems.forEach(li => {
            // Reset hidden state first
            li.style.display = '';
            li.style.visibility = '';
            li.style.position = '';
            li.style.pointerEvents = '';

            gsap.to(li, {
                opacity: 1,
                duration: 0.3,
                ease: 'power2.out'
            });
        });
    }

    hideInactiveNavItems() {
        this.navItems.forEach((li, index) => {
            if (index > 0) { // Keep first item visible
                gsap.to(li, {
                    opacity: 0,
                    duration: 0.3,
                    ease: 'power2.in',
                    onComplete: () => {
                        // Completely hide the element after animation
                        li.style.display = 'none';
                        li.style.visibility = 'hidden';
                        li.style.position = 'absolute';
                        li.style.pointerEvents = 'none';
                    }
                });
            }
        });
    }

    showAllNavItemsOnScrollUp() {
        this.navItems.forEach(li => {
            // Reset hidden state first
            li.style.display = '';
            li.style.visibility = '';
            li.style.position = '';
            li.style.pointerEvents = '';

            gsap.to(li, {
                opacity: 1,
                duration: 0.2,
                ease: 'power2.out'
            });
        });
    }
}

// Create and export instance
const headerManager = new UnifiedHeaderManager();
export default headerManager; 