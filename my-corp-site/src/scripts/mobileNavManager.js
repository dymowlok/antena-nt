import { gsap } from 'gsap';
import { menuData } from '../data/menu.js';
import { debugLog, debugWarn } from './utils/debug.js';

class MobileNavManager {
    constructor() {
        this.isOpen = false;
        this.openButton = null;
        this.mobileNav = null;
        this.mobileNavList = null;
        this.body = document.body;
        this.expandedAccordions = new Set();

        this.init();
    }

    init() {
        this.mobileNav = document.querySelector('.mobile-nav');
        this.mobileNavList = document.querySelector('.mobile-nav-list');
        this.openButton = document.querySelector('#openNav');

        if (!this.mobileNav || !this.mobileNavList || !this.openButton) {
            debugWarn('Mobile navigation elements not found');
            return;
        }

        this.expandedAccordions = new Set();
        this.renderMobileMenu();
        this.addEventListeners();
        this.updateColors();
        this.observeHeaderThemeChanges();
    }

    addEventListeners() {
        // Open/close button
        this.openButton.addEventListener('click', () => {
            if (this.isMobileNavOpen()) {
                this.closeMobileNav();
            } else {
                this.openMobileNav();
            }
        });

        // Close mobile nav when clicking on the background area
        this.mobileNav.addEventListener('click', (e) => {
            // Only close if clicking directly on nav.mobile-nav (background)
            // Don't close if clicking on mobile-nav-list or any child elements
            if (e.target === this.mobileNav) {
                this.closeMobileNav();
            }
        });

        // Close on escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isMobileNavOpen()) {
                this.closeMobileNav();
            }
        });

        // Close on outside click (optional, for extra safety)
        document.addEventListener('click', (e) => {
            if (this.isMobileNavOpen() &&
                !this.mobileNav.contains(e.target) &&
                !this.openButton.contains(e.target)) {
                this.closeMobileNav();
            }
        });
    }

    observeHeaderThemeChanges() {
        // Create a MutationObserver to watch for changes in the header-wrap
        const headerWrap = document.querySelector('.header-wrap');
        if (headerWrap) {
            const observer = new MutationObserver(() => {
                this.updateColors();
            });

            observer.observe(headerWrap, {
                attributes: true,
                attributeFilter: ['style']
            });
        }
    }

    updateColors() {
        const headerWrap = document.querySelector('.header-wrap');
        if (!headerWrap) return;

        const headerBgColor = window.getComputedStyle(headerWrap).backgroundColor;
        debugLog('Header background color:', headerBgColor);

        // Check if header has light background (rgb(242, 242, 242))
        if (headerBgColor === 'rgb(242, 242, 242)') {
            // Light header theme
            this.mobileNavList.style.backgroundColor = '#fff';
            this.updateSubmenuColors('rgb(242, 242, 242)');
            this.updateOpenButtonColor('#fff');
            this.updateChevronColors('rgb(242, 242, 242)');
        } else if (headerBgColor === 'rgb(255, 255, 255)') {
            // White header theme
            this.mobileNavList.style.backgroundColor = 'rgb(242, 242, 242)';
            this.updateSubmenuColors('rgb(255, 255, 255)');
            this.updateOpenButtonColor('rgb(242, 242, 242)');
            this.updateChevronColors('#fff');
        }
    }

    updateSubmenuColors(bgColor) {
        const submenuLists = document.querySelectorAll('.mobile-nav-submenu-list');
        submenuLists.forEach(submenuList => {
            submenuList.style.backgroundColor = bgColor;
        });
    }

    updateOpenButtonColor(bgColor) {
        if (this.openButton) {
            // Force immediate color update to prevent delays
            this.openButton.style.setProperty('background-color', bgColor, 'important');
        }
    }

    updateChevronColors(bgColor) {
        const chevrons = document.querySelectorAll('.mobile-nav-chevron');
        chevrons.forEach(chevron => {
            chevron.style.backgroundColor = bgColor;
        });
    }

    renderMobileMenu() {
        if (!this.mobileNavList) return;

        this.mobileNavList.innerHTML = '';

        menuData.forEach(menuItem => {
            const listItem = document.createElement('li');
            listItem.className = 'mobile-nav-item';

            if (menuItem.submenu) {
                // Item with submenu - create accordion
                this.createAccordionItem(listItem, menuItem);
            } else {
                // Simple item - create direct link
                this.createSimpleItem(listItem, menuItem);
            }

            this.mobileNavList.appendChild(listItem);
        });
    }

    createAccordionItem(listItem, menuItem) {
        // Create a container div for the link and chevron
        const itemContainer = document.createElement('div');
        itemContainer.className = 'mobile-nav-item-container';

        const link = document.createElement('a');
        link.href = menuItem.url;
        link.className = 'mobile-nav-link';
        link.addEventListener('click', (e) => {
            e.preventDefault();
            this.navigateToSection(menuItem.url);
        });

        const textSpan = document.createElement('span');
        textSpan.className = 'mobile-nav-text';
        textSpan.textContent = menuItem.label;

        // Add text span to the link (this was missing!)
        link.appendChild(textSpan);

        const chevron = document.createElement('span');
        chevron.className = 'mobile-nav-chevron';
        chevron.innerHTML = `
           <svg width="9" height="6" viewBox="0 0 9 6" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M7.75684 0.757324L4.25684 4.75732L0.756836 0.757324" stroke="black" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
</svg>

        `;

        // Add click handler for chevron (accordion toggle)
        chevron.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.toggleAccordion(listItem, chevron);
        });

        // Add link and chevron to container (not nested)
        itemContainer.appendChild(link);
        itemContainer.appendChild(chevron);

        // Create submenu
        const submenu = document.createElement('div');
        submenu.className = 'mobile-nav-submenu';

        const submenuList = document.createElement('ul');
        submenuList.className = 'mobile-nav-submenu-list';

        menuItem.submenu.forEach(subItem => {
            const subListItem = document.createElement('li');
            subListItem.className = 'mobile-nav-submenu-item';

            const subLink = document.createElement('a');
            subLink.href = subItem.url;
            subLink.className = 'mobile-nav-submenu-link';
            subLink.textContent = subItem.label;
            subLink.addEventListener('click', (e) => {
                e.preventDefault();
                this.navigateToSection(subItem.url);
            });

            subListItem.appendChild(subLink);
            submenuList.appendChild(subListItem);
        });

        submenu.appendChild(submenuList);
        listItem.appendChild(itemContainer);
        listItem.appendChild(submenu);
    }

    createSimpleItem(listItem, menuItem) {
        const link = document.createElement('a');
        link.href = menuItem.url;
        link.className = 'mobile-nav-link';
        link.addEventListener('click', (e) => {
            e.preventDefault();
            this.navigateToSection(menuItem.url);
        });

        const textSpan = document.createElement('span');
        textSpan.className = 'mobile-nav-text';
        textSpan.textContent = menuItem.label;

        link.appendChild(textSpan);
        listItem.appendChild(link);
    }

    toggleAccordion(listItem, chevron) {
        const submenu = listItem.querySelector('.mobile-nav-submenu');
        const isExpanded = submenu.classList.contains('expanded');

        debugLog('Toggle accordion called, isExpanded:', isExpanded);

        if (isExpanded) {
            // Collapse accordion
            debugLog('Collapsing accordion');
            this.collapseAccordion(submenu, chevron);
            this.expandedAccordions.delete(listItem);
        } else {
            // Collapse any previously expanded accordion first
            if (this.expandedAccordions.size > 0) {
                debugLog('Collapsing previously expanded accordion');
                const previousExpanded = Array.from(this.expandedAccordions)[0];
                const previousSubmenu = previousExpanded.querySelector('.mobile-nav-submenu');
                const previousChevron = previousExpanded.querySelector('.mobile-nav-chevron');
                if (previousSubmenu && previousChevron) {
                    this.collapseAccordion(previousSubmenu, previousChevron);
                    this.expandedAccordions.delete(previousExpanded);
                }
            }

            // Expand accordion
            debugLog('Expanding accordion');
            this.expandAccordion(submenu, chevron);
            this.expandedAccordions.add(listItem);
        }
    }

    expandAccordion(submenu, chevron) {
        debugLog('Expanding accordion, submenu:', submenu, 'chevron:', chevron);

        // Add expanded class for CSS animation (chevron rotation is handled by CSS)
        submenu.classList.add('expanded');
        chevron.classList.add('expanded');

        // Add expanded class to the parent mobile-nav-item
        const listItem = submenu.closest('.mobile-nav-item');
        if (listItem) {
            listItem.classList.add('expanded');
        }

        // Animate submenu height using GSAP
        gsap.fromTo(submenu,
            { maxHeight: 0 },
            {
                maxHeight: '50rem', // Match the CSS max-height value
                duration: 0.3,
                ease: 'power2.out',
                onComplete: () => {
                    debugLog('Accordion expansion animation completed');
                }
            }
        );
    }

    collapseAccordion(submenu, chevron) {
        debugLog('Collapsing accordion, submenu:', submenu, 'chevron:', chevron);

        // Animate submenu height back to 0
        gsap.to(submenu, {
            maxHeight: 0,
            duration: 0.3,
            ease: 'power2.out',
            onComplete: () => {
                submenu.classList.remove('expanded');
                chevron.classList.remove('expanded');

                // Remove expanded class from the parent mobile-nav-item
                const listItem = submenu.closest('.mobile-nav-item');
                if (listItem) {
                    listItem.classList.remove('expanded');
                }

                debugLog('Accordion collapse animation completed');
            }
        });
    }

    toggleMobileNav() {
        if (this.isOpen) {
            this.closeMobileNav();
        } else {
            this.openMobileNav();
        }
    }

    openMobileNav() {
        if (this.isOpen) return;

        this.isOpen = true;
        document.documentElement.classList.add('mobile-nav-open');
        this.body.classList.add('mobile-nav-open');
        this.mobileNav.classList.add('active');

        // Update button text
        this.openButton.textContent = 'Zamknij menu';

        // Update colors based on current header theme
        this.updateColors();

        // Animate in with GSAP
        gsap.fromTo(this.mobileNav,
            {
                opacity: 0
            },
            {
                opacity: 1,
                scale: 1,
                duration: 0.3,
                ease: 'power2.out'
            }
        );

        debugLog('Mobile navigation opened');
    }

    closeMobileNav() {
        if (!this.isOpen) return;

        this.isOpen = false;
        document.documentElement.classList.remove('mobile-nav-open');
        this.body.classList.remove('mobile-nav-open');

        // Update button text
        this.openButton.textContent = 'Menu';

        // Animate out with GSAP
        gsap.to(this.mobileNav, {
            opacity: 0,
            duration: 0.3,
            ease: 'power2.in',
            onComplete: () => {
                this.mobileNav.classList.remove('active');

                // Collapse all expanded accordions
                this.expandedAccordions.forEach(listItem => {
                    const submenu = listItem.querySelector('.mobile-nav-submenu');
                    const chevron = listItem.querySelector('.mobile-nav-chevron');
                    if (submenu && chevron) {
                        this.collapseAccordion(submenu, chevron);
                    }
                });
                this.expandedAccordions.clear();
            }
        });

        debugLog('Mobile navigation closed');
    }

    navigateToSection(url) {
        if (url.startsWith('#')) {
            const targetId = url.substring(1);
            const targetElement = document.getElementById(targetId);

            if (targetElement) {
                // Set flags to prevent services section interference
                window.mobileNavNavigating = true;
                window.hashNavigating = true;

                // Close mobile nav first
                this.closeMobileNav();

                // Use precise scrolling to align section at top: 0
                setTimeout(() => {
                    if (window.lenis) {
                        const targetY = targetElement.offsetTop; // No offset - align at top: 0
                        window.lenis.scrollTo(targetY, {
                            duration: 1.2,
                            easing: (t) => 1 - Math.pow(1 - t, 3)
                        });
                    } else {
                        // Fallback to native scroll with precise positioning
                        targetElement.scrollIntoView({
                            behavior: 'smooth',
                            block: 'start' // This ensures top: 0 alignment
                        });
                    }

                    // Clear the flags after navigation
                    setTimeout(() => {
                        window.mobileNavNavigating = false;
                        window.hashNavigating = false;
                    }, 2000);
                }, 300); // Wait for mobile nav to close
            }
        } else {
            // External link or page navigation
            this.closeMobileNav();
            setTimeout(() => {
                window.location.href = url;
            }, 300);
        }
    }

    // Public method to check if mobile nav is open
    isMobileNavOpen() {
        return this.isOpen;
    }

    // Public method to close mobile nav (useful for other components)
    forceClose() {
        if (this.isOpen) {
            this.closeMobileNav();
        }
    }
}

// Create and export instance
const mobileNavManager = new MobileNavManager();
export default mobileNavManager; 