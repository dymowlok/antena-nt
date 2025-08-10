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
        this.lastDominantSection = 'hero';
        this.isHeaderHovered = false;
        this.isScrollingUp = false;
        this.scrollUpTimer = null;
        this.currentButtonTheme = 'white';
        this.isDesktopMenuOpen = false;
        this.desktopMenuTimeout = null;
        this.hasSubmenuItems = false;
        this.isInitialized = false;
        this.mobileNavManager = null;

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

        // Navigation state management
        this.navItemMap = new Map(); // sectionId -> navLi
        this.intersectionObserver = null;
        this.sectionIntersections = new Map(); // sectionId -> intersectionRatio
        this.updatePending = false;
        this.scrollThrottleTimer = null;
        this.isShowingAllItems = false; // Track when we're showing all navigation items

        this.init();
    }

    // Set mobile nav manager reference (called from main.js after initialization)
    setMobileNavManager(mobileNavManager) {
        this.mobileNavManager = mobileNavManager;
        debugLog('Mobile nav manager reference set in header manager');
    }

    async init() {
        // Wait for DOM to be fully ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.initializeAfterDOM());
        } else {
            this.initializeAfterDOM();
        }
    }

    async initializeAfterDOM() {
        // Wait for nav items to be available
        await this.waitForNavItems();

        this.initializeNavItems();
        this.setupIntersectionObserver();
        this.setupEventListeners();
        this.setupDesktopMenu();
        this.updateButtonTheme();
        this.updateHeaderBackground();

        // Set initial button theme to white
        this.setInitialButtonTheme();

        this.isInitialized = true;
        debugLog('Header manager fully initialized');
    }

    // Wait for navigation items to be available
    /**
     * @returns {Promise<void>}
     */
    waitForNavItems() {
        return new Promise((resolve) => {
            const checkNavItems = () => {
                const navUl = this.headerNav?.querySelector('ul');
                if (navUl && navUl.children.length > 0) {
                    resolve();
                } else {
                    setTimeout(checkNavItems, 50);
                }
            };
            checkNavItems();
        });
    }

    // Set initial button theme to white
    setInitialButtonTheme() {
        if (this.headerButton) {
            this.headerButton.classList.remove('black');
            this.headerButton.classList.add('white');
            this.currentButtonTheme = 'white';
            debugLog('Initial button theme set to white');
        }
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
                /** @type {HTMLElement} */ (li).offsetWidth > 0 &&
                /** @type {HTMLElement} */ (li).offsetHeight > 0;
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
        this.buildNavItemMap();

        // Ensure all nav items are initially visible
        this.navItems.forEach(li => {
            li.classList.add('is-visible');
            li.style.display = '';
            li.style.visibility = '';
            li.style.position = '';
            li.style.pointerEvents = '';
            li.style.opacity = '1';
        });
    }

    // Build navigation item mapping
    buildNavItemMap() {
        this.navItemMap.clear();

        this.navItems.forEach(li => {
            const a = li.querySelector('a');
            if (!a) return;

            const href = a.getAttribute('href');
            const sectionId = href.replace('#', '');

            this.navItemMap.set(sectionId, li);
        });

        debugLog('Built nav item map:', Array.from(this.navItemMap.keys()));
    }

    // Setup IntersectionObserver for robust section detection
    setupIntersectionObserver() {
        if (!window.IntersectionObserver) {
            debugWarn('IntersectionObserver not supported, falling back to scroll-based detection');
            return;
        }

        this.intersectionObserver = new IntersectionObserver(
            (entries) => {
                entries.forEach(entry => {
                    const sectionId = entry.target.id;
                    this.sectionIntersections.set(sectionId, entry.intersectionRatio);
                });

                // Debounce updates to prevent thrashing
                if (!this.updatePending) {
                    this.updatePending = true;
                    requestAnimationFrame(() => {
                        this.updateDominantSection();
                        this.updatePending = false;
                    });
                }
            },
            {
                threshold: [0, 0.1, 0.25, 0.4, 0.5, 0.6, 0.75, 0.9, 1.0],
                rootMargin: '-5% 0px -5% 0px' // More sensitive detection with smaller margins
            }
        );

        // Observe all sections
        this.sectionMap.forEach(section => {
            if (section.el) {
                this.intersectionObserver.observe(section.el);
            }
        });

        // Special handling for services section pin state
        this.setupServicesSectionHandler();

        debugLog('IntersectionObserver setup complete');
    }

    // Special handler for services section pin state
    setupServicesSectionHandler() {
        // Listen for services section pin state changes
        window.addEventListener('servicesPinStateChanged', (event) => {
            const customEvent = /** @type {CustomEvent} */ (event);
            const isPinned = customEvent.detail?.isPinned || false;
            debugLog('Services section pin state changed:', isPinned);

            if (isPinned) {
                // When services section is pinned, ensure proper navigation state
                this.ensureServicesSectionNavigation();
            }
        });
    }

    // Ensure proper navigation state when services section is pinned
    ensureServicesSectionNavigation() {
        // Force a navigation update after a brief delay to ensure proper state
        setTimeout(() => {
            this.updateNavigationVisibility();
        }, 100);
    }

    // Update dominant section based on intersection ratios
    updateDominantSection() {
        let dominantSection = null;
        let maxRatio = 0;

        // Find section with highest intersection ratio ≥ 0.6 (increased threshold for more stability)
        this.sectionIntersections.forEach((ratio, sectionId) => {
            if (ratio >= 0.6 && ratio > maxRatio) {
                dominantSection = sectionId;
                maxRatio = ratio;
            }
        });

        // If no section meets 0.6 threshold, use the one with highest ratio ≥ 0.4
        if (!dominantSection) {
            this.sectionIntersections.forEach((ratio, sectionId) => {
                if (ratio >= 0.4 && ratio > maxRatio) {
                    dominantSection = sectionId;
                    maxRatio = ratio;
                }
            });
        }

        // If still no dominant section, use the one with highest ratio
        if (!dominantSection) {
            this.sectionIntersections.forEach((ratio, sectionId) => {
                if (ratio > maxRatio) {
                    dominantSection = sectionId;
                    maxRatio = ratio;
                }
            });
        }

        // Fallback: if still no dominant section, use last known
        if (!dominantSection && this.lastDominantSection) {
            dominantSection = this.lastDominantSection;
            debugLog('Using fallback dominant section:', dominantSection);
        }

        // Only update if dominant section actually changed and we have a valid section
        if (dominantSection && dominantSection !== this.lastDominantSection) {
            // Additional check: ensure the section is actually visible in viewport
            const sectionElement = this.sectionMap.find(s => s.id === dominantSection)?.el;
            if (sectionElement) {
                const rect = sectionElement.getBoundingClientRect();
                const isVisible = rect.top < window.innerHeight && rect.bottom > 0;

                if (isVisible) {
                    this.lastDominantSection = dominantSection;
                    this.currentActiveSection = dominantSection;

                    debugLog('Dominant section changed to:', dominantSection, 'with ratio:', maxRatio);

                    // Hide mega-menu when section changes to prevent it from staying open
                    if (this.isDesktopMenuOpen) {
                        debugLog('Section changed, hiding mega-menu');
                        this.hideDesktopMenu();
                    }

                    this.updateNavigationVisibility();
                } else {
                    debugLog('Section not visible in viewport, keeping current:', this.currentActiveSection);
                }
            }
        }
    }

    // Update navigation visibility based on current section
    updateNavigationVisibility() {
        // Remove debouncing for faster response
        this.performNavigationUpdate();
    }

    // Perform the actual navigation update
    performNavigationUpdate() {
        const isExcludedSection = ['hero', 'kontakt'].includes(this.currentActiveSection);

        // Find the target nav item
        const targetNavItem = this.navItemMap.get(this.currentActiveSection);

        // Check if current section has a corresponding navigation link
        const hasNavLink = targetNavItem !== undefined;

        // If no nav link exists for current section, show ALL navigation items
        if (!hasNavLink && !isExcludedSection) {
            debugLog('Current section has no nav link, showing all navigation items');
            debugLog('- Current section:', this.currentActiveSection);
            debugLog('- Available nav sections:', this.getAvailableNavigationSections());
            this.showAllNavItems();
            return;
        }

        // Reset the flag since we're now showing specific items
        this.isShowingAllItems = false;

        if (!targetNavItem && !isExcludedSection) {
            debugWarn('No nav item found for section:', this.currentActiveSection);
            return;
        }

        // Add temporary lock to prevent FOUC
        this.headerNav.classList.add('nav-locked');

        // Apply changes immediately without requestAnimationFrame for faster response
        this.navItems.forEach(li => {
            const a = li.querySelector('a');
            if (!a) return;

            const href = a.getAttribute('href');
            const sectionId = href.replace('#', '');
            const isActive = sectionId === this.currentActiveSection;

            // Determine new state
            const shouldBeVisible = isExcludedSection || isActive;
            const shouldBeActive = isActive;

            // Apply changes immediately
            li.classList.toggle('is-visible', shouldBeVisible);
            li.classList.toggle('is-active', shouldBeActive);

            // Update active state
            if (a) {
                a.classList.toggle('active', shouldBeActive);
                a.setAttribute('aria-current', shouldBeActive ? 'true' : 'false');
            }

            debugLog(`Nav item ${sectionId}: visible=${shouldBeVisible}, active=${shouldBeActive}`);
        });

        // Remove lock immediately
        this.headerNav.classList.remove('nav-locked');

        // Ensure only one navigation item is visible for sections with nav links
        this.ensureSingleNavigationItem();

        // Special handling for services section to ensure stability
        if (this.currentActiveSection === 'uslugi') {
            // Force a re-check after a brief delay to ensure proper state
            setTimeout(() => {
                this.forceNavigationStability();
            }, 50); // Reduced delay for faster response
        }

        // Hide mega-menu when navigation changes to prevent it from staying open
        if (this.isDesktopMenuOpen) {
            debugLog('Navigation changed, hiding mega-menu');
            this.hideDesktopMenu();
        }

        // Periodic validation to catch any state inconsistencies
        setTimeout(() => {
            this.validateNavigationState();
        }, 200);
    }

    // Force navigation stability for services section
    forceNavigationStability() {
        const servicesNavItem = this.navItemMap.get('uslugi');
        if (!servicesNavItem) return;

        // Ensure services nav item is properly visible and active
        if (!servicesNavItem.classList.contains('is-visible')) {
            servicesNavItem.classList.add('is-visible');
            const a = servicesNavItem.querySelector('a');
            if (a) {
                a.classList.add('active');
                a.setAttribute('aria-current', 'true');
            }
            debugLog('Forced services nav item visibility');
        }

        // Hide other nav items to maintain single-item visibility
        this.navItems.forEach(li => {
            if (li !== servicesNavItem) {
                li.classList.remove('is-visible', 'is-active');
                const a = li.querySelector('a');
                if (a) {
                    a.classList.remove('active');
                    a.setAttribute('aria-current', 'false');
                }
            }
        });
    }

    // Ensure only one navigation item is visible (for sections with nav links)
    ensureSingleNavigationItem() {
        const hasNavLink = this.hasNavigationLinkForCurrentSection();
        const isExcludedSection = ['hero', 'kontakt'].includes(this.currentActiveSection);

        // Only enforce single item for sections with nav links
        if (hasNavLink && !isExcludedSection) {
            const targetNavItem = this.navItemMap.get(this.currentActiveSection);
            if (!targetNavItem) return;

            // Hide all other nav items completely using CSS classes
            this.navItems.forEach(li => {
                if (li !== targetNavItem) {
                    li.classList.remove('is-visible', 'is-active');
                    const a = li.querySelector('a');
                    if (a) {
                        a.classList.remove('active');
                        a.setAttribute('aria-current', 'false');
                    }
                }
            });

            // Ensure target item is visible and active
            targetNavItem.classList.add('is-visible', 'is-active');
            const a = targetNavItem.querySelector('a');
            if (a) {
                a.classList.add('active');
                a.setAttribute('aria-current', 'true');
            }

            debugLog('Enforced single navigation item for section:', this.currentActiveSection);
        }
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
                debugLog('Current theme detected:', currentTheme, 'from section:', section.id || section.className);
                break;
            }
        }

        const bgColor = currentTheme === 'white' ? '#f2f2f2' : '#ffffff';
        debugLog('Setting header background to:', bgColor, 'for theme:', currentTheme);

        if (currentTheme === 'white') {
            this.headerWrap.style.setProperty('background-color', '#f2f2f2', 'important'); // $light color
        } else {
            this.headerWrap.style.setProperty('background-color', '#ffffff', 'important'); // $white color
        }

        // Update mega-menu background color based on header background
        this.updateMegaMenuBackground();

        // Update navigation visibility when header background changes
        this.updateNavigationVisibility();
    }

    // Update mega-menu background color based on header background
    updateMegaMenuBackground() {
        if (!this.headerDesktopMenu || !this.headerWrap) return;

        const headerBgColor = this.headerWrap.style.backgroundColor || getComputedStyle(this.headerWrap).backgroundColor;
        const isLightBackground = headerBgColor.includes('247, 247, 247') || headerBgColor.includes('#f7f7f7') || headerBgColor.includes('rgb(247, 247, 247)');

        const menuContent = this.headerDesktopMenu.querySelector('.header-desktop-menu-content');
        if (menuContent) {
            const menuElement = /** @type {HTMLElement} */ (menuContent);
            if (isLightBackground) {
                // If header has light background, mega-menu should have white background
                menuElement.style.backgroundColor = '#f7f7f7';
            } else {
                // If header has white background, mega-menu should have light background
                menuElement.style.backgroundColor = '#ffffff';
            }
        }
    }

    // Desktop Menu Management
    setupDesktopMenu() {
        this.renderDesktopMenu();

        // Track hover state
        this.isHoveringMenu = false;
        this.currentMenuHoverTarget = null;

        // Wait for nav items to be ready
        if (this.navItems.length === 0) {
            setTimeout(() => this.setupDesktopMenu(), 100);
            return;
        }

        this.navItems.forEach(li => {
            const a = li.querySelector('a');
            if (!a) return;

            const href = a.getAttribute('href');
            const menuItem = menuData.find(item => item.url === href);

            debugLog('Setting up desktop menu for:', href, menuItem);

            if (menuItem && menuItem.submenu) {
                this.hasSubmenuItems = true;

                li.addEventListener('mouseenter', () => {
                    debugLog('Mouse enter on nav item:', href);
                    this.isHoveringMenu = true;

                    // Check if we're switching to a different menu item
                    const isSwitchingMenu = this.currentMenuHoverTarget && this.currentMenuHoverTarget.url !== menuItem.url;
                    this.currentMenuHoverTarget = menuItem;

                    if (!this.canShowDesktopMenu()) {
                        debugLog('Cannot show desktop menu');
                        return;
                    }

                    // Clear any existing timeout
                    if (this.desktopMenuTimeout) {
                        clearTimeout(this.desktopMenuTimeout);
                    }

                    // Always show/update the desktop menu to ensure correct content
                    this.showDesktopMenu(menuItem);

                    // Add hover state to parent nav item <a> element
                    const navLink = li.querySelector('a');
                    if (navLink) {
                        navLink.classList.add('hover');
                    }
                });

                /**
                 * @param {MouseEvent} e
                 */
                li.addEventListener('mouseleave', (e) => {
                    debugLog('Mouse leave on nav item:', href);

                    // Check if mouse is moving to the mega-menu content
                    const relatedTarget = e.relatedTarget;
                    if (relatedTarget && this.headerDesktopMenu && this.headerDesktopMenu.contains(relatedTarget)) {
                        debugLog('Mouse moving to mega-menu content, keeping it open');
                        return;
                    }

                    // Remove hover state from parent nav item <a> element
                    const navLink = li.querySelector('a');
                    if (navLink) {
                        navLink.classList.remove('hover');
                    }

                    // Use a small delay to prevent flickering when moving between nav and menu
                    this.scheduleHideMenu();
                });
            } else {
                li.addEventListener('mouseenter', () => {
                    if (this.isDesktopMenuOpen) {
                        this.hideDesktopMenu();
                    }
                });
            }
        });

        // Desktop menu hover handlers - only for the content area
        if (this.headerDesktopMenu) {
            const menuContent = this.headerDesktopMenu.querySelector('.header-desktop-menu-content');

            if (menuContent) {
                menuContent.addEventListener('mouseenter', () => {
                    debugLog('Mouse enter on mega-menu content');
                    this.isHoveringMenu = true;

                    // Clear any existing timeout
                    if (this.desktopMenuTimeout) {
                        clearTimeout(this.desktopMenuTimeout);
                    }

                    // Ensure parent nav item <a> maintains hover state
                    if (this.currentMenuHoverTarget?.url) {
                        const parentNavItem = Array.from(this.navItems).find(li => {
                            const a = li.querySelector('a');
                            return a && a.getAttribute('href') === this.currentMenuHoverTarget.url;
                        });
                        if (parentNavItem) {
                            const navLink = parentNavItem.querySelector('a');
                            if (navLink) {
                                navLink.classList.add('hover');
                            }
                        }
                    }
                });

                /**
                 * @param {MouseEvent} e
                 */
                menuContent.addEventListener('mouseleave', (e) => {
                    debugLog('Mouse leave on mega-menu content');
                    this.isHoveringMenu = false;

                    // Check if mouse is moving back to the nav item
                    const relatedTarget = e.relatedTarget;
                    if (relatedTarget && relatedTarget instanceof Element && relatedTarget.closest('.header-nav li')) {
                        debugLog('Mouse moving back to nav item, keeping menu open');
                        return;
                    }

                    // Remove hover state from all parent nav items <a> elements
                    this.navItems.forEach(li => {
                        const navLink = li.querySelector('a');
                        if (navLink) {
                            navLink.classList.remove('hover');
                        }
                    });

                    // Use a small delay to prevent flickering when moving between menu and nav
                    this.scheduleHideMenu();
                });
            }
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
                    this.scheduleHideMenu();
                }

                // Remove hover state from all parent nav items
                this.navItems.forEach(li => li.classList.remove('mega-menu-hover'));
            });
        }
    }

    // Schedule menu hiding with delay to prevent flickering
    scheduleHideMenu() {
        if (this.desktopMenuTimeout) {
            clearTimeout(this.desktopMenuTimeout);
        }

        this.desktopMenuTimeout = setTimeout(() => {
            // Check if mouse is still within the combined hover area
            if (!this.isHoveringMenu && !this.isMouseInCombinedHoverArea()) {
                this.hideDesktopMenu();
            }
        }, 150); // 150ms delay to prevent flickering
    }

    // Check if mouse is within the combined hover area (nav item + mega menu content)
    isMouseInCombinedHoverArea() {
        if (!this.currentMenuHoverTarget) return false;

        // Check if mouse is over the current nav item
        const currentNavItem = Array.from(this.navItems).find(li => {
            const a = li.querySelector('a');
            return a && a.getAttribute('href') === this.currentMenuHoverTarget.url;
        });

        if (currentNavItem && currentNavItem.matches(':hover')) {
            return true;
        }

        // Check if mouse is over the mega menu content
        if (this.headerDesktopMenu && this.headerDesktopMenu.querySelector('.header-desktop-menu-content')?.matches(':hover')) {
            return true;
        }

        return false;
    }

    renderDesktopMenu() {
        if (!this.headerDesktopMenu) return;

        this.headerDesktopMenu.innerHTML = '';

        const content = document.createElement('div');
        content.className = 'header-desktop-menu-content';

        this.headerDesktopMenu.appendChild(content);
    }

    showDesktopMenu(menuItem) {
        debugLog('showDesktopMenu called with:', menuItem);
        if (!this.headerDesktopMenu) {
            debugLog('No headerDesktopMenu found');
            return;
        }
        if (!menuItem || !menuItem.submenu) {
            debugLog('No menuItem or submenu found');
            return;
        }

        // Close mobile nav if it's open
        if (this.mobileNavManager && this.mobileNavManager.isMobileNavOpen()) {
            debugLog('Closing mobile nav before opening desktop menu');
            this.mobileNavManager.forceClose();
        }

        // If menu is already open, just update the content
        if (this.isDesktopMenuOpen) {
            debugLog('Menu already open, updating content');
            this.updateDesktopMenuContent(menuItem);
            return;
        }

        this.isDesktopMenuOpen = true;
        debugLog('Setting isDesktopMenuOpen to true');
        this.headerDesktopMenu.classList.add('active');
        if (this.headerBgOverlay) {
            this.headerBgOverlay.classList.add('active');
        }
        if (this.body) {
            this.body.classList.add('scroll-locked');
            this.body.style.overflow = 'hidden';
            debugLog('Set body overflow to hidden');
        }

        // Render menu content
        const content = this.headerDesktopMenu.querySelector('.header-desktop-menu-content');
        if (content) {
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
                                this.hideDesktopMenu();
                                // Use lenis for smooth scrolling if available
                                if (typeof window !== 'undefined' && window.lenis) {
                                    /** @type {any} */ (window.lenis).scrollTo(targetElement, {
                                    duration: 1.2,
                                    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t))
                                });
                                } else {
                                    targetElement.scrollIntoView({ behavior: 'smooth' });
                                }
                            }
                        });
                    }

                    column.appendChild(link);
                });

                content.appendChild(column);
            }
        }

        // Update mega-menu background color
        this.updateMegaMenuBackground();

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

    updateDesktopMenuContent(menuItem) {
        if (!this.headerDesktopMenu || !menuItem || !menuItem.submenu) return;

        // Update the current menu target
        this.currentMenuHoverTarget = menuItem;

        // Render updated menu content
        const content = this.headerDesktopMenu.querySelector('.header-desktop-menu-content');
        if (content) {
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
                                this.hideDesktopMenu();
                                // Use lenis for smooth scrolling if available
                                if (typeof window !== 'undefined' && window.lenis) {
                                    /** @type {any} */ (window.lenis).scrollTo(targetElement, {
                                    duration: 1.2,
                                    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t))
                                });
                                } else {
                                    targetElement.scrollIntoView({ behavior: 'smooth' });
                                }
                            }
                        });
                    }

                    column.appendChild(link);
                });

                content.appendChild(column);
            }
        }

        // Update mega-menu background color
        this.updateMegaMenuBackground();

        // Update hover state for the correct navigation item
        this.navItems.forEach(li => {
            const navLink = li.querySelector('a');
            if (navLink) {
                navLink.classList.remove('hover');
            }
        });

        // Add hover state to the current navigation item
        const currentNavItem = Array.from(this.navItems).find(li => {
            const a = li.querySelector('a');
            return a && a.getAttribute('href') === menuItem.url;
        });
        if (currentNavItem) {
            const navLink = currentNavItem.querySelector('a');
            if (navLink) {
                navLink.classList.add('hover');
            }
        }
    }

    hideDesktopMenu() {
        debugLog('hideDesktopMenu called, isDesktopMenuOpen:', this.isDesktopMenuOpen);
        if (!this.isDesktopMenuOpen) return;

        debugLog('Hiding desktop menu');

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
            this.body.style.overflow = '';
        }

        this.isDesktopMenuOpen = false;
        this.isHoveringMenu = false;
        this.currentMenuHoverTarget = null;

        // Remove hover state from all parent nav items <a> elements
        this.navItems.forEach(li => {
            const navLink = li.querySelector('a');
            if (navLink) {
                navLink.classList.remove('hover');
            }
        });
    }

    startCloseTimer() {
        if (this.desktopMenuTimeout) {
            clearTimeout(this.desktopMenuTimeout);
        }
        this.desktopMenuTimeout = setTimeout(() => {
            if (!this.isHoveringMenu) {
                this.hideDesktopMenu();
            }
        }, 2000);
    }

    // Event Listeners
    setupEventListeners() {
        // Scroll direction detection with improved throttling
        let lastScroll = window.scrollY;
        let scrollDirection = 'down';
        let scrollDirectionChangeTime = 0;

        const handleScroll = () => {
            // Throttle scroll events to prevent excessive updates
            if (this.scrollThrottleTimer) return;

            this.scrollThrottleTimer = requestAnimationFrame(() => {
                const currentScroll = window.scrollY;
                const currentTime = Date.now();
                const scrollingUp = currentScroll < lastScroll - 2; // Increased threshold for more stable detection

                // Update scroll direction with debouncing
                if (scrollingUp !== (scrollDirection === 'up')) {
                    scrollDirection = scrollingUp ? 'up' : 'down';
                    scrollDirectionChangeTime = currentTime;
                }

                // Only update scroll direction state after a brief delay to prevent flickering
                const timeSinceDirectionChange = currentTime - scrollDirectionChangeTime;
                if (timeSinceDirectionChange > 100) {
                    this.isScrollingUp = scrollDirection === 'up';
                }

                this.updateHeaderUI();
                this.updateHeaderBackground(); // Update header background on scroll
                // Mega-menu background will be updated automatically by updateHeaderBackground

                // Hide mega-menu when scrolling to prevent it from staying open
                if (this.isDesktopMenuOpen && !this.isHoveringMenu) {
                    this.hideDesktopMenu();
                }

                if (this.isScrollingUp && !this.isAtTop()) {
                    // Check if we're over a section without a nav link
                    const hasNavLink = this.hasNavigationLinkForCurrentSection();
                    const isExcludedSection = ['hero', 'kontakt'].includes(this.currentActiveSection);

                    if (this.shouldShowCompactHeader()) {
                        // If no nav link exists, show all items
                        if (!hasNavLink && !isExcludedSection) {
                            this.showAllNavItems();
                        } else {
                            this.showAllNavItemsOnScrollUp();
                        }
                    }
                    if (this.scrollUpTimer) {
                        clearTimeout(this.scrollUpTimer);
                    }
                    this.scrollUpTimer = setTimeout(() => {
                        this.isScrollingUp = false;
                        if (this.shouldShowCompactHeader()) {
                            // If no nav link exists, keep all items visible
                            if (!hasNavLink && !isExcludedSection) {
                                this.showAllNavItems();
                            } else {
                                // Force immediate navigation update to prevent multiple visible items
                                this.updateNavigationVisibility();
                            }
                        }
                    }, 100); // Reduced delay for faster response
                }

                lastScroll = currentScroll;
                this.updateButtonTheme();

                this.scrollThrottleTimer = null;
            });
        };

        window.addEventListener('scroll', handleScroll, { passive: true });

        // Resize handler
        window.addEventListener('resize', () => {
            this.updateButtonTheme();
            this.updateHeaderBackground();
            // Mega-menu background will be updated automatically by updateHeaderBackground

            // Hide mega-menu on resize to prevent layout issues
            if (this.isDesktopMenuOpen) {
                debugLog('Window resized, hiding mega-menu');
                this.hideDesktopMenu();
            }
        });

        // Initialize on load
        document.addEventListener('DOMContentLoaded', () => {
            this.updateHeaderBackground();
            this.updateNavigationVisibility(); // Ensure initial state
        });

        window.addEventListener('load', () => {
            this.updateHeaderBackground();
            this.updateNavigationVisibility(); // Ensure initial state after all content loaded
        });

        // Ensure contact button hover handler is set up
        this.setupContactButtonHandler();

        // Add document click handler to hide mega-menu when clicking outside
        document.addEventListener('click', (e) => {
            if (this.isDesktopMenuOpen) {
                const target = e.target;
                const isInMegaMenu = this.headerDesktopMenu && this.headerDesktopMenu.contains(target);
                const isInNavItem = target.closest('.header-nav li');

                if (!isInMegaMenu && !isInNavItem) {
                    debugLog('Click outside mega-menu system, hiding mega-menu');
                    this.hideDesktopMenu();
                }
            }
        });

        // Add keyboard handler to hide mega-menu on Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isDesktopMenuOpen) {
                debugLog('Escape key pressed, hiding mega-menu');
                this.hideDesktopMenu();
            }
        });

        // Add general mouseover handler to hide mega-menu when hovering over non-mega-menu elements
        document.addEventListener('mouseover', (e) => {
            if (this.isDesktopMenuOpen) {
                const target = e.target;
                const isInMegaMenu = this.headerDesktopMenu && this.headerDesktopMenu.contains(target);
                const isInNavItem = target.closest('.header-nav li');
                const isInHeaderButtons = target.closest('.header-buttons');
                const isInHeaderLogo = target.closest('.header-logo');

                // If hovering over elements that should hide the mega-menu
                if (!isInMegaMenu && !isInNavItem && (isInHeaderButtons || isInHeaderLogo)) {
                    debugLog('Hovering over non-mega-menu element, hiding mega-menu');
                    this.hideDesktopMenu();
                }
            }
        });
    }

    // Setup contact button hover handler
    setupContactButtonHandler() {
        const contactButton = document.querySelector('.header-button--contact');
        debugLog('Setting up contact button handler, found:', contactButton);
        if (contactButton) {
            debugLog('Adding mouseenter event listener to contact button');
            contactButton.addEventListener('mouseenter', () => {
                debugLog('Contact button mouseenter event triggered, isDesktopMenuOpen:', this.isDesktopMenuOpen);
                if (this.isDesktopMenuOpen) {
                    debugLog('Contact button hovered, hiding mega-menu');
                    this.hideDesktopMenu();
                } else {
                    debugLog('Mega-menu not open, nothing to hide');
                }
            });

            // Also hide mega-menu when contact button is clicked
            contactButton.addEventListener('click', () => {
                if (this.isDesktopMenuOpen) {
                    debugLog('Contact button clicked, hiding mega-menu');
                    this.hideDesktopMenu();
                }
            });
        }

        // Also handle menu button to hide mega-menu
        const menuButton = document.querySelector('.header-button--menu');
        if (menuButton) {
            menuButton.addEventListener('mouseenter', () => {
                if (this.isDesktopMenuOpen) {
                    debugLog('Menu button hovered, hiding mega-menu');
                    this.hideDesktopMenu();
                }
            });
        }

        // Add general handler for header buttons container to hide mega-menu
        const headerButtons = document.querySelector('.header-buttons');
        if (headerButtons) {
            headerButtons.addEventListener('mouseenter', () => {
                if (this.isDesktopMenuOpen) {
                    debugLog('Header buttons container hovered, hiding mega-menu');
                    this.hideDesktopMenu();
                }
            });
        }

        // Add handler for header logo to hide mega-menu
        const headerLogo = document.querySelector('.header-logo');
        if (headerLogo) {
            headerLogo.addEventListener('mouseenter', () => {
                if (this.isDesktopMenuOpen) {
                    debugLog('Header logo hovered, hiding mega-menu');
                    this.hideDesktopMenu();
                }
            });
        }
    }

    // Check if current section has a navigation link
    hasNavigationLinkForCurrentSection() {
        return this.navItemMap.has(this.currentActiveSection);
    }

    // Get all available navigation sections
    getAvailableNavigationSections() {
        return Array.from(this.navItemMap.keys());
    }

    // Validate and fix navigation state
    validateNavigationState() {
        const hasNavLink = this.hasNavigationLinkForCurrentSection();
        const isExcludedSection = ['hero', 'kontakt'].includes(this.currentActiveSection);

        if (isExcludedSection) {
            // For excluded sections, all items should be visible
            this.showAllNavItems();
            return;
        }

        if (!hasNavLink) {
            // For sections without nav links, all items should be visible
            this.showAllNavItems();
            return;
        }

        // For sections with nav links, ensure only one item is visible
        this.ensureSingleNavigationItem();
    }



    // Debug current navigation state
    debugNavigationState() {
        debugLog('Current navigation state:');
        debugLog('- Current active section:', this.currentActiveSection);
        debugLog('- Has nav link:', this.hasNavigationLinkForCurrentSection());
        debugLog('- Available nav sections:', this.getAvailableNavigationSections());
        debugLog('- Excluded sections:', ['hero', 'kontakt']);

        // Count visible items
        const visibleItems = Array.from(this.navItems).filter(li =>
            li.classList.contains('is-visible')
        );
        debugLog('- Currently visible items:', visibleItems.length);

        if (visibleItems.length > 1) {
            debugWarn('Multiple visible items detected!');
            visibleItems.forEach(li => {
                const a = li.querySelector('a');
                const href = a?.getAttribute('href');
                debugWarn('  - Visible item:', href);
            });
        }
    }

    // Header UI Updates
    updateHeaderUI() {
        // Check if we're over a section without a nav link
        const hasNavLink = this.hasNavigationLinkForCurrentSection();
        const isExcludedSection = ['hero', 'kontakt'].includes(this.currentActiveSection);

        if (this.shouldShowFullHeader()) {
            this.showAllNavItems();
            this.headerState = 'hero';
        } else if (this.shouldShowCompactHeader()) {
            // If no nav link exists for current section, show all items
            if (!hasNavLink && !isExcludedSection) {
                this.showAllNavItems();
                this.headerState = 'scrolling';
            } else {
                this.hideInactiveNavItems();
                this.headerState = 'scrolling';
            }
        }
    }

    showAllNavItems() {
        this.isShowingAllItems = true;

        this.navItems.forEach(li => {
            // Show all items for full header state using CSS classes
            li.classList.add('is-visible');
            li.classList.remove('is-active');

            // Reset active states
            const a = li.querySelector('a');
            if (a) {
                a.classList.remove('active');
                a.setAttribute('aria-current', 'false');
            }
        });

        debugLog('All navigation items are now visible');
    }

    hideInactiveNavItems() {
        // Don't hide items if we're currently showing all items
        if (this.isShowingAllItems) {
            debugLog('Skipping hideInactiveNavItems because all items are currently visible');
            return;
        }

        // Find the active nav item based on current section
        let activeNavItem = null;

        this.navItems.forEach(li => {
            const a = li.querySelector('a');
            if (!a) return;

            const href = a.getAttribute('href');
            const sectionId = href.replace('#', '');

            if (sectionId === this.currentActiveSection) {
                activeNavItem = li;
            }
        });

        debugLog('Hiding inactive nav items. Current active section:', this.currentActiveSection, 'Active nav item:', activeNavItem);

        // Hide all nav items except the active one using CSS classes
        this.navItems.forEach(li => {
            const isActive = li === activeNavItem;

            if (!isActive) {
                li.classList.remove('is-visible', 'is-active');
                const a = li.querySelector('a');
                if (a) {
                    a.classList.remove('active');
                    a.setAttribute('aria-current', 'false');
                }
            } else {
                li.classList.add('is-visible', 'is-active');
                const a = li.querySelector('a');
                if (a) {
                    a.classList.add('active');
                    a.setAttribute('aria-current', 'true');
                }
            }
        });

        // Reset the flag since we're now showing only one item
        this.isShowingAllItems = false;
    }

    showAllNavItemsOnScrollUp() {
        this.navItems.forEach(li => {
            // Show all items for scroll up responsiveness using CSS classes
            li.classList.add('is-visible');
        });

        // Force navigation update after showing all items to ensure proper state
        setTimeout(() => {
            this.updateNavigationVisibility();
        }, 10); // Minimal delay for immediate response
    }
}

// Create and export instance
const headerManager = new UnifiedHeaderManager();
export default headerManager; 