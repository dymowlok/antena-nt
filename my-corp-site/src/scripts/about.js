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
