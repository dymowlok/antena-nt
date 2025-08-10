// Navigation interceptor to prevent services section interference
// This script intercepts all hash navigation and sets flags to prevent
// the services section ScrollTrigger from interfering with navigation

class NavigationInterceptor {
    constructor() {
        this.init();
    }

    init() {
        // Intercept all hash navigation
        this.interceptHashNavigation();

        // Intercept browser back/forward navigation
        this.interceptBrowserNavigation();

        console.log('Navigation interceptor initialized');
    }

    interceptHashNavigation() {
        // Intercept clicks on all hash links (including empty hash for logo)
        document.addEventListener('click', (e) => {
            const target = e.target.closest('a[href*="#"]');
            if (target) {
                const href = target.getAttribute('href');
                if (href) {
                    // Handle both empty hash (#) and actual hash navigation
                    if (href === '#' || href.startsWith('#')) {
                        e.preventDefault(); // Prevent default hash navigation
                        const targetHash = href === '#' ? '#hero' : href;

                        console.log('🚀 Navigation interceptor: Click detected on:', target);
                        console.log('🚀 Navigation interceptor: Target href:', href);
                        console.log('🚀 Navigation interceptor: Resolved hash:', targetHash);

                        this.handleHashNavigation(targetHash);
                        this.scrollToSection(targetHash);
                    }
                }
            }
        });

        // Also intercept any dynamically added hash links
        this.observeDynamicHashLinks();

        // Intercept programmatic hash changes
        const originalPushState = history.pushState;
        const originalReplaceState = history.replaceState;

        history.pushState = (...args) => {
            if (args[2] && (args[2] === '#' || args[2].startsWith('#'))) {
                const targetHash = args[2] === '#' ? '#hero' : args[2];
                this.handleHashNavigation(targetHash);
                this.scrollToSection(targetHash);
            }
            return originalPushState.apply(history, args);
        };

        history.replaceState = (...args) => {
            if (args[2] && (args[2] === '#' || args[2].startsWith('#'))) {
                const targetHash = args[2] === '#' ? '#hero' : args[2];
                this.handleHashNavigation(targetHash);
                this.scrollToSection(targetHash);
            }
            return originalReplaceState.apply(history, args);
        };

        // Also intercept hashchange events
        window.addEventListener('hashchange', (e) => {
            if (window.location.hash) {
                this.handleHashNavigation(window.location.hash);
                this.scrollToSection(window.location.hash);
            }
        });

        console.log('🚀 Navigation interceptor: All hash navigation methods intercepted');
    }

    observeDynamicHashLinks() {
        // Use MutationObserver to watch for dynamically added hash links
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.type === 'childList') {
                    mutation.addedNodes.forEach((node) => {
                        if (node.nodeType === Node.ELEMENT_NODE) {
                            // Check if the added node is a hash link
                            if (node.matches && node.matches('a[href*="#"]')) {
                                console.log('🚀 Navigation interceptor: Dynamic hash link detected:', node);
                            }
                            // Check if the added node contains hash links
                            const hashLinks = node.querySelectorAll && node.querySelectorAll('a[href*="#"]');
                            if (hashLinks && hashLinks.length > 0) {
                                console.log('🚀 Navigation interceptor: Dynamic hash links found:', hashLinks.length);
                            }
                        }
                    });
                }
            });
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });

        console.log('🚀 Navigation interceptor: Dynamic hash link observer initialized');
    }

    interceptBrowserNavigation() {
        // Intercept browser back/forward navigation
        window.addEventListener('popstate', (e) => {
            if (window.location.hash) {
                this.handleHashNavigation(window.location.hash);
            }
        });
    }

    handleHashNavigation(hash) {
        // Set flag to prevent services section interference
        window.hashNavigating = true;

        console.log('🚀 Navigation interceptor: Hash navigation detected:', hash);
        console.log('🚀 Setting hashNavigating flag to prevent services section interference');

        // Clear the flag after navigation completes
        setTimeout(() => {
            window.hashNavigating = false;
            console.log('🚀 Navigation interceptor: Hash navigation flag cleared');
        }, 2000); // Give enough time for smooth scrolling to complete
    }

    scrollToSection(hash) {
        const targetId = hash.substring(1);
        const targetElement = document.getElementById(targetId);

        if (targetElement) {
            console.log('🚀 Scrolling to section:', targetId);

            // Use lenis for smooth scrolling if available
            if (window.lenis) {
                const targetY = targetElement.offsetTop;
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
        }
    }
}

// Initialize the interceptor
const navigationInterceptor = new NavigationInterceptor();
export default navigationInterceptor; 