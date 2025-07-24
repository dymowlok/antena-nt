import { gsap } from 'gsap';
import ScrollTrigger from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

// Theme colors mapping
const themeColors = {
    white: '#FFFFFF',
    light: '#F8F9FA',
    indigo: '#6366F1',
    sky: '#0EA5E9',
    blue: '#3B82F6',
    orange: '#F97316',
    black: '#000000',
    gray: '#6B7280'
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
        console.log('Found sections with data-theme:', sections.length);

        sections.forEach((section, index) => {
            const theme = section.getAttribute('data-theme');
            const nextSection = sections[index + 1];
            const nextTheme = nextSection?.getAttribute('data-theme');

            console.log(`Section ${section.id}: theme=${theme}, nextTheme=${nextTheme}`);

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
                            console.log('Services section pinned, skipping theme interpolation');
                            return;
                        }

                        console.log(`Interpolating from ${theme} to ${nextTheme}, progress: ${self.progress}`);
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
            console.log('Services pin state changed:', this.isServicesPinned);

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
            console.warn('Invalid theme colors:', fromTheme, toTheme);
            return;
        }

        const fromRGB = gsap.utils.splitColor(themeColors[fromTheme]);
        const toRGB = gsap.utils.splitColor(themeColors[toTheme]);

        const interpolated = fromRGB.map((c, i) =>
            Math.round(gsap.utils.interpolate(c, toRGB[i], progress))
        );

        const color = `rgb(${interpolated.join(',')})`;
        console.log(`Setting background color: ${color}`);
        gsap.set(this.body, { backgroundColor: color });

        // Don't set data-theme attribute - let CSS handle text colors based on section data-theme
        this.currentTheme = fromTheme;

        // Handle header styling
        if (this.headerWrap) {
            const grayThemes = ['hero', 'kontakt'];
            const isFromGray = grayThemes.includes(fromTheme);
            const isToGray = grayThemes.includes(toTheme);
            const blend = gsap.utils.interpolate(isFromGray ? 1 : 0, isToGray ? 1 : 0, progress);

            const newBgColor = blend > 0.5 ? themeColors.gray : themeColors.white;
            gsap.to(this.headerWrap, {
                backgroundColor: newBgColor,
                duration: 0.15,
                overwrite: 'auto'
            });
        }
    }

    setTheme(theme) {
        if (!themeColors[theme]) {
            console.warn('Invalid theme:', theme);
            return;
        }

        console.log(`Setting theme: ${theme}`);
        this.currentTheme = theme;

        // Set background color directly
        gsap.set(this.body, { backgroundColor: themeColors[theme] });

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
            console.log(`Refreshing theme to: ${theme} for section: ${currentSection.id}`);
            this.setTheme(theme);
        }
    }

    getScrollDistance() {
        return window.matchMedia('(max-width: 899px)').matches ? 120 : 240;
    }

    // Public methods for services section
    setServicesPinned(isPinned) {
        console.log(`Setting services pinned: ${isPinned}`);
        this.isServicesPinned = isPinned;

        // Dispatch event for other components
        window.dispatchEvent(new CustomEvent('servicesPinStateChanged', {
            detail: { isPinned }
        }));

        if (isPinned) {
            this.setTheme('light');
        }
    }
}

// Create global instance
const themeManager = new ThemeManager();

// Export for use in other files
export default themeManager;
export { ThemeManager }; 