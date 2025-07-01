import { gsap } from "gsap";
import { headerButton, headerDot, heroSection, currentButtonTheme } from "./header.js";
function updateButtonTheme() {
    if (!headerButton || !heroSection) return;

    const heroRect = heroSection.getBoundingClientRect();
    const heroVisible = heroRect.bottom > 0 && heroRect.top < window.innerHeight;

    // Jeśli sekcja hero jest widoczna w viewporcie
    if (heroVisible) {
        if (currentButtonTheme !== 'white') {
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
        if (currentButtonTheme !== 'black') {
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
    const oldTheme = currentButtonTheme;

    // Nie zmieniaj jeśli to ten sam theme
    if (oldTheme === newTheme) return;

    console.log(`🎨 Button theme change: ${oldTheme} → ${newTheme}`);

    const tl = gsap.timeline();

    tl.to(headerButton, {
        scale: 0.96,
        duration: 0.12,
        ease: 'power2.inOut',
        onComplete: () => {
            headerButton.classList.remove(oldTheme);
            headerButton.classList.add(newTheme);
            currentButtonTheme = newTheme;
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
    updateNavHighlight();
    updateButtonTheme();
});
ScrollTrigger.addEventListener('refresh', updateNavHighlight);

ScrollTrigger.refresh();

// POPRAWKA: Inicjalizacja button theme z dot management
setTimeout(() => {
    if (heroSection && headerButton) {
        // Ustaw początkowy theme based na aktualnej pozycji
        const heroRect = heroSection.getBoundingClientRect();
        const heroVisible = heroRect.bottom > 0 && heroRect.top < window.innerHeight;

        if (heroVisible) {
            currentButtonTheme = 'white';
            headerButton.classList.remove('light', 'black', 'gray');
            headerButton.classList.add('white');
            // Pokaż dot
            if (headerDot) {
                gsap.set(headerDot, { display: 'block', opacity: 1 });
            }
        } else {
            currentButtonTheme = 'black';
            headerButton.classList.remove('white', 'light', 'gray');
            headerButton.classList.add('black');
            // Ukryj dot
            if (headerDot) {
                gsap.set(headerDot, { display: 'none', opacity: 0 });
            }
        }

        console.log('✅ Button theme handler initialized with theme:', currentButtonTheme);
    }
}, 300);
export { updateButtonTheme, animateButtonThemeChange };
