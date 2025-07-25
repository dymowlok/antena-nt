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

    // Helper function to show asset
    function showAsset(key) {
        console.log('🖼️ Showing asset:', key);
        Object.entries(assets).forEach(([id, el]) => {
            if (!el) return;
            if (id === key) {
                el.classList.add('active');
            } else {
                el.classList.remove('active');
            }
        });
    }

    // Function to determine which section is most visible within the about section
    function updateActiveAsset() {
        if (!aboutSection) return;

        const aboutRect = aboutSection.getBoundingClientRect();

        // Only proceed if the about section is actually visible
        if (aboutRect.top > window.innerHeight || aboutRect.bottom < 0) {
            return;
        }

        // Find which section has its center closest to the viewport center
        let activeSection = null;
        const viewportCenter = window.innerHeight / 2;

        sections.forEach((section, index) => {
            const rect = section.getBoundingClientRect();
            const sectionCenter = rect.top + rect.height / 2;
            const distanceFromCenter = Math.abs(sectionCenter - viewportCenter);

            console.log(`Section ${index + 1} (${section.id}):`, {
                top: Math.round(rect.top),
                bottom: Math.round(rect.bottom),
                center: Math.round(sectionCenter),
                distanceFromCenter: Math.round(distanceFromCenter),
                isInViewport: rect.top <= viewportCenter && rect.bottom >= viewportCenter
            });

            // If this section is the closest to viewport center and is visible
            if (rect.top <= viewportCenter && rect.bottom >= viewportCenter) {
                if (!activeSection || distanceFromCenter < Math.abs(activeSection.getBoundingClientRect().top + activeSection.getBoundingClientRect().height / 2 - viewportCenter)) {
                    activeSection = section;
                }
            }
        });

        console.log('🎯 Active section:', activeSection ? activeSection.id : 'none');

        if (activeSection) {
            showAsset(activeSection.id);
        }
    }

    // Create a single ScrollTrigger for the entire about section
    ScrollTrigger.create({
        trigger: aboutSection,
        start: 'top bottom',
        end: 'bottom top',
        onUpdate: updateActiveAsset,
        onEnter: updateActiveAsset,
        onLeave: updateActiveAsset,
        onEnterBack: updateActiveAsset,
        onLeaveBack: updateActiveAsset
    });
}
