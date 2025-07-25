import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export function setupAboutSection() {
    const aboutSection = document.querySelector('#o-firmie');
    if (!aboutSection) return;

    const assets = {
        experience: aboutSection.querySelector('#about-asset-experience'),
        quarantee: aboutSection.querySelector('#about-asset-quarantee'),
        service: aboutSection.querySelector('#about-asset-service')
    };

    const sections = aboutSection.querySelectorAll('.about-section');
    const contents = aboutSection.querySelectorAll('.about-content');
    let lastActiveSection = null;

    // Helper function to show asset with smooth transition
    function showAsset(key) {
        Object.entries(assets).forEach(([id, el]) => {
            if (!el) return;
            if (id === key) {
                gsap.to(el, { opacity: 1, duration: 0.6, ease: 'power2.out' });
            } else {
                gsap.to(el, { opacity: 0, duration: 0.6, ease: 'power2.out' });
            }
        });
    }

    // Helper function to show content with smooth transition
    function showContent(index) {
        contents.forEach((content, i) => {
            if (i === index) {
                gsap.to(content, { opacity: 1, duration: 0.6, ease: 'power2.out' });
            } else {
                gsap.to(content, { opacity: 0, duration: 0.6, ease: 'power2.out' });
            }
        });
    }

    // Helper function to get theme color
    function getThemeColor(theme) {
        const themeColors = {
            'indigo': '#6366f1',
            'sky': '#0ea5e9',
            'blue': '#3b82f6',
            'orange': '#f97316',
            'light': '#f8fafc',
            'white': '#ffffff',
            'black': '#000000'
        };
        return themeColors[theme] || '#ffffff';
    }

    // Set theme instantly for about sections
    function setThemeInstantly(theme) {
        document.body.style.backgroundColor = getThemeColor(theme);
        document.body.setAttribute('data-theme', theme);
    }

    // Function to update assets and content based on body background color
    function updateAssetsAndContent() {
        const bodyBgColor = document.body.style.backgroundColor;

        if (bodyBgColor === 'rgb(124, 124, 248)' || bodyBgColor === 'rgb(99, 102, 241)') {
            // Indigo - first section
            showAsset('experience');
            showContent(0);
        } else if (bodyBgColor === 'rgb(175, 217, 250)' || bodyBgColor === 'rgb(14, 165, 233)') {
            // Sky - second section
            showAsset('quarantee');
            showContent(1);
        } else if (bodyBgColor === 'rgb(61, 118, 247)' || bodyBgColor === 'rgb(59, 130, 246)') {
            // Blue - third section
            showAsset('service');
            showContent(2);
        }
    }

    // On scroll, find the section that's most visible and update theme
    function handleScroll() {
        let mostVisibleSection = null;
        let maxVisibility = 0;

        sections.forEach(section => {
            const rect = section.getBoundingClientRect();
            const visibleHeight = Math.min(rect.bottom, window.innerHeight) - Math.max(rect.top, 0);

            if (visibleHeight > maxVisibility) {
                maxVisibility = visibleHeight;
                mostVisibleSection = section;
            }
        });

        if (mostVisibleSection && mostVisibleSection !== lastActiveSection) {
            lastActiveSection = mostVisibleSection;
            const theme = mostVisibleSection.getAttribute('data-theme');
            if (theme) setThemeInstantly(theme);
        }
    }

    // Initial state
    handleScroll();

    // Listen to scroll events
    window.addEventListener('scroll', handleScroll, { passive: true });

    // Also update on resize (in case of layout changes)
    window.addEventListener('resize', handleScroll);

    // Monitor body background color changes
    const observer = new MutationObserver(() => {
        updateAssetsAndContent();
    });

    observer.observe(document.body, {
        attributes: true,
        attributeFilter: ['style']
    });

    // Initial update
    updateAssetsAndContent();
}
