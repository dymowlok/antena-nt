import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export function setupAboutSection() {
    const aboutSection = document.querySelector('#o-firmie');
    if (!aboutSection) return;

    const scrollContainer = aboutSection.querySelector('.about-sections-scroll');
    if (!scrollContainer) return;

    const assets = {
        experience: aboutSection.querySelector('#about-asset-experience'),
        quarantee: aboutSection.querySelector('#about-asset-quarantee'),
        service: aboutSection.querySelector('#about-asset-service')
    };

    const sections = scrollContainer.querySelectorAll('.about-section');
    let lastActiveSection = null;

    // Helper function to show asset
    function showAsset(key) {
        Object.entries(assets).forEach(([id, el]) => {
            if (!el) return;
            if (id === key) {
                el.classList.add('active');
            } else {
                el.classList.remove('active');
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

    // On scroll, find the section snapped to the top and update asset/theme
    function handleScroll() {
        let minDistance = Infinity;
        let activeSection = null;
        const containerRect = scrollContainer.getBoundingClientRect();

        sections.forEach(section => {
            const rect = section.getBoundingClientRect();
            // Distance from section top to container top
            const distance = Math.abs(rect.top - containerRect.top);
            if (distance < minDistance) {
                minDistance = distance;
                activeSection = section;
            }
        });

        if (activeSection && activeSection !== lastActiveSection) {
            lastActiveSection = activeSection;
            const sectionId = activeSection.id;
            const theme = activeSection.getAttribute('data-theme');
            showAsset(sectionId);
            if (theme) setThemeInstantly(theme);
        }
    }

    // Initial state
    handleScroll();

    // Listen to scroll events on the scroll container
    scrollContainer.addEventListener('scroll', handleScroll, { passive: true });

    // Also update on resize (in case of layout changes)
    window.addEventListener('resize', handleScroll);
}
