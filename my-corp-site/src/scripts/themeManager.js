import { gsap } from 'gsap';
import ScrollTrigger from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

// Theme colors mapping
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

class ThemeManager {
    constructor() {
        this.isServicesPinned = false;
        this.currentTheme = 'white';
        this.themeTriggers = [];
        this.body = document.body;
        this.header = document.querySelector('header');
        this.headerWrap = document.querySelector('.header-wrap');

        // Kill any existing theme-related tweens
        this.killExistingThemeTweens();

        this.init();
    }

    killExistingThemeTweens() {
        // Kill any existing background color tweens
        gsap.killTweensOf(this.body);

        // Kill any existing ScrollTrigger instances that might interfere
        ScrollTrigger.getAll().forEach(trigger => {
            if (trigger.vars.onUpdate && trigger.vars.onUpdate.toString().includes('backgroundColor')) {
                trigger.kill();
            }
        });
    }

    init() {
        // Set initial theme
        this.setTheme('white');

        // Wait a bit for DOM to be ready
        setTimeout(() => {
            this.setupThemeTriggers();
            this.setupServicesSectionHandler();
        }, 100);
    }

    setupThemeTriggers() {
        // Get all sections with data-theme
        const sections = document.querySelectorAll('[data-theme]');


        sections.forEach((section, index) => {
            const theme = section.getAttribute('data-theme');
            const nextSection = sections[index + 1];
            const nextTheme = nextSection?.getAttribute('data-theme');



            if (!theme) return;

            // Create interpolation trigger only if there's a next section
            if (nextTheme) {
                const interpolationTrigger = ScrollTrigger.create({
                    trigger: section,
                    start: 'bottom center',
                    end: `+=${this.getScrollDistance()}`,
                    scrub: true,
                    onUpdate: (self) => {
                        // Don't interpolate if services section is pinned
                        if (this.isServicesPinned && section.id === 'uslugi') {

                            return;
                        }


                        this.interpolateTheme(theme, nextTheme, self.progress);
                    }
                });

                this.themeTriggers.push(interpolationTrigger);
            }
        });
    }

    setupServicesSectionHandler() {
        // Listen for services section pin state changes
        window.addEventListener('servicesPinStateChanged', (event) => {
            this.isServicesPinned = event.detail?.isPinned || false;


            if (this.isServicesPinned) {
                this.setTheme('light');
            } else {
                // Force refresh of current theme
                setTimeout(() => {
                    this.refreshCurrentTheme();
                }, 50);
            }
        });
    }

    interpolateTheme(fromTheme, toTheme, progress) {
        if (!themeColors[fromTheme] || !themeColors[toTheme]) {

            return;
        }

        const fromRGB = gsap.utils.splitColor(themeColors[fromTheme]);
        const toRGB = gsap.utils.splitColor(themeColors[toTheme]);

        const interpolated = fromRGB.map((c, i) =>
            Math.round(gsap.utils.interpolate(c, toRGB[i], progress))
        );

        const color = `rgb(${interpolated.join(',')})`;

        gsap.set(this.body, { backgroundColor: color });

        // Don't set data-theme attribute - let CSS handle text colors based on section data-theme
        this.currentTheme = fromTheme;

        // Header-wrap background color is now handled by desktopMenu.js
        // to avoid conflicts between multiple theme systems

        // Trigger header-wrap update when theme changes
        if (window.updateActiveNavStyling) {
            window.updateActiveNavStyling();
        }
    }

    setTheme(theme) {
        if (!themeColors[theme]) {

            return;
        }


        this.currentTheme = theme;

        // Set background color directly
        gsap.set(this.body, { backgroundColor: themeColors[theme] });

        // Header-wrap background color is now handled by desktopMenu.js
        // to avoid conflicts between multiple theme systems

        // Trigger header-wrap update when theme changes
        if (window.updateActiveNavStyling) {
            window.updateActiveNavStyling();
        }

        if (this.header) {
            this.header.classList.remove('white', 'light', 'indigo', 'sky', 'blue', 'orange', 'black');
            this.header.classList.add(theme);
        }
    }

    refreshCurrentTheme() {
        // Find the currently visible section and set its theme
        const sections = document.querySelectorAll('[data-theme]');
        let currentSection = null;

        for (const section of sections) {
            const rect = section.getBoundingClientRect();
            if (rect.top <= window.innerHeight / 2 && rect.bottom >= window.innerHeight / 2) {
                currentSection = section;
                break;
            }
        }

        if (currentSection) {
            const theme = currentSection.getAttribute('data-theme');

            this.setTheme(theme);
        }
    }

    getScrollDistance() {
        return window.matchMedia('(max-width: 899px)').matches ? 120 : 240;
    }

    // Public methods for services section
    setServicesPinned(isPinned) {

        this.isServicesPinned = isPinned;

        // Dispatch event for other components
        window.dispatchEvent(new CustomEvent('servicesPinStateChanged', {
            detail: { isPinned }
        }));

        if (isPinned) {
            this.setTheme('light');
        }

        // Trigger header-wrap update when services pin state changes
        if (window.updateActiveNavStyling) {
            window.updateActiveNavStyling();
        }
    }
}

// Create global instance
const themeManager = new ThemeManager();

// Export for use in other files
export default themeManager;
export { ThemeManager }; 