import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { headerButton, headerDot, heroSection, currentButtonTheme } from "./header.js";
import { handleScrollDirection } from "./scrollHelpers.js";
// import { updateNavHighlight } from "./header.js"; // Removed to break circular dependency

gsap.registerPlugin(ScrollTrigger);

function updateButtonTheme() {
    if (!headerButton || !heroSection) return;

    const heroRect = heroSection.getBoundingClientRect();
    const heroVisible = heroRect.bottom > 0 && heroRect.top < window.innerHeight;

    // Jeśli sekcja hero jest widoczna w viewporcie
    if (heroVisible) {
        if (currentButtonTheme.value !== 'white') {
            animateButtonThemeChange('white');
        }
        // Pokaż dot gdy hero jest widoczne
        if (headerDot) {
            gsap.to(headerDot, {
                display: 'block',
                opacity: 1,
                duration: 0.3,
                ease: 'power2.out'
            });
        }
    } else {
        // Hero nie jest widoczne - button ma być black
        if (currentButtonTheme.value !== 'black') {
            animateButtonThemeChange('black');
        }
        // Ukryj dot gdy hero nie jest widoczne
        if (headerDot) {
            gsap.to(headerDot, {
                opacity: 0,
                duration: 0.2,
                ease: 'power2.in',
                onComplete: () => {
                    gsap.set(headerDot, { display: 'none' });
                }
            });
        }
    }
}

function animateButtonThemeChange(newTheme) {
    const oldTheme = currentButtonTheme.value;

    // Nie zmieniaj jeśli to ten sam theme
    if (oldTheme === newTheme) return;

    if (!headerButton) return;

    const tl = gsap.timeline();

    tl.to(headerButton, {
        scale: 0.96,
        duration: 0.12,
        ease: 'power2.inOut',
        onComplete: () => {
            if (headerButton) {
                headerButton.classList.remove(oldTheme);
                headerButton.classList.add(newTheme);
                currentButtonTheme.value = newTheme;
            }
        }
    })
        .to(headerButton, {
            scale: 1,
            duration: 0.15,
            ease: 'back.out(1.3)'
        });
}

// Event listeners
window.addEventListener('scroll', handleScrollDirection);
window.addEventListener('resize', () => {
    updateButtonTheme();
});

// POPRAWKA: Inicjalizacja button theme z dot management
setTimeout(() => {
    if (heroSection && headerButton) {
        // Ustaw początkowy theme based na aktualnej pozycji
        const heroRect = heroSection.getBoundingClientRect();
        const heroVisible = heroRect.bottom > 0 && heroRect.top < window.innerHeight;

        if (heroVisible) {
            currentButtonTheme.value = 'white';
            headerButton.classList.remove('light', 'black', 'gray');
            headerButton.classList.add('white');
            // Pokaż dot
            if (headerDot) {
                gsap.set(headerDot, { display: 'block', opacity: 1 });
            }
        } else {
            currentButtonTheme.value = 'black';
            headerButton.classList.remove('white', 'light', 'gray');
            headerButton.classList.add('black');
            // Ukryj dot
            if (headerDot) {
                gsap.set(headerDot, { display: 'none', opacity: 0 });
            }
        }
    }
}, 300);

export { updateButtonTheme, animateButtonThemeChange };
