import lottie from 'lottie-web';
import { gsap } from 'gsap';
import ScrollTrigger from 'gsap/ScrollTrigger';
import heroJson from '../assets/lottie/hero.json' assert { type: 'json' };

gsap.registerPlugin(ScrollTrigger);

let anim = null;
let isInitialized = false;

export function loadHeroLottie() {
    // Zapobiegnij wielokrotnemu ładowaniu
    if (isInitialized) {
        console.log('⚠️ Lottie already initialized');
        return;
    }

    const container = document.querySelector('.hero-lottie');
    if (!container) {
        console.warn('❌ Hero Lottie container not found');
        return;
    }

    // Sprawdź czy kontener nie jest już zajęty
    if (container.children.length > 0) {
        console.log('⚠️ Container already has content, clearing...');
        container.innerHTML = '';
    }

    console.log('🎬 Loading Lottie animation...');
    isInitialized = true;

    anim = lottie.loadAnimation({
        container,
        renderer: 'svg',
        loop: false,
        autoplay: false,
        animationData: heroJson,
        rendererSettings: {
            preserveAspectRatio: 'xMidYMid slice'
        }
    });

    anim.addEventListener('DOMLoaded', () => {
        console.log('✅ Lottie loaded, total frames:', anim.totalFrames);

        // 1. Automatyczne odtwarzanie pierwszych 56 ramek
        anim.playSegments([0, 56], true);

        // 2. Setup scroll po zakończeniu autoplay
        anim.addEventListener('complete', handleAutoplayComplete);
    });
}

function handleAutoplayComplete() {
    console.log('✅ Autoplay completed, setting up scroll animation...');

    // Usuń event listener żeby nie wywołać wielokrotnie
    anim.removeEventListener('complete', handleAutoplayComplete);

    // Krótkie opóźnienie przed setup scroll
    setTimeout(setupScrollAnimation, 100);
}

function setupScrollAnimation() {
    const container = document.querySelector('.hero-lottie');
    if (!container || !anim) {
        console.error('❌ Cannot setup scroll - missing container or animation');
        return;
    }

    const totalFrames = anim.totalFrames; // 271
    const startFrame = 57;
    const endFrame = Math.floor(totalFrames) - 1; // POPRAWKA: Math.floor na totalFrames, nie na wynik
    const frameRange = endFrame - startFrame;

    // Debug sprawdzenie
    console.log('📊 Frame calculation:', {
        totalFrames,
        startFrame,
        endFrame,
        frameRange,
        'Range valid': frameRange > 0
    });

    // WAŻNE: Sprawdź czy range jest poprawny
    if (frameRange <= 0) {
        console.error('❌ Invalid frame range:', { startFrame, endFrame, frameRange });
        return;
    }

    console.log(`🎯 Setting up scroll: frames ${startFrame}-${endFrame}`);

    // Ustaw na końcu autoplay
    anim.goToAndStop(56, true);

    // Usuń poprzednie ScrollTriggery dla tego elementu
    ScrollTrigger.getAll().forEach(trigger => {
        if (trigger.trigger === container) {
            trigger.kill();
        }
    });

    // POPRAWKA: Sprawdź czy Lenis jest aktywny - różne metody
    let isLenisActive = false;

    // Metoda 1: sprawdź window.lenis
    if (window.lenis && typeof window.lenis.scroll === 'number') {
        isLenisActive = true;
    }

    // Metoda 2: sprawdź czy istnieje w module
    if (!isLenisActive) {
        try {
            const lenisModule = document.querySelector('[data-lenis-scroller]');
            if (lenisModule) isLenisActive = true;
        } catch (e) { }
    }

    // Metoda 3: sprawdź czy body ma Lenis właściwości
    if (!isLenisActive) {
        const bodyStyle = getComputedStyle(document.body);
        if (bodyStyle.transform && bodyStyle.transform !== 'none') {
            isLenisActive = true;
        }
    }

    console.log('🌊 Lenis check:', {
        'window.lenis exists': !!window.lenis,
        'lenis.scroll type': typeof window.lenis?.scroll,
        'final isActive': isLenisActive
    });

    ScrollTrigger.create({
        trigger: container,
        start: 'top bottom',
        end: 'bottom top',
        scrub: 1, // Użyj stałą wartość dla testów
        refreshPriority: -1,

        onUpdate: (self) => {
            if (!anim) return;

            const progress = self.progress;
            const targetFrame = startFrame + (progress * frameRange);
            const clampedFrame = Math.max(startFrame, Math.min(endFrame, targetFrame));

            // ZAWSZE aktualizuj - debug version
            anim.goToAndStop(clampedFrame, true);

            // Debug log co 10 updates
            if (Math.random() < 0.1) {
                console.log(`🎬 Progress: ${progress.toFixed(3)} | Start: ${startFrame} | Target: ${targetFrame.toFixed(1)} | Clamped: ${clampedFrame.toFixed(1)} | Current: ${anim.currentFrame.toFixed(1)}`);
            }
        },

        onLeave: (self) => {
            console.log('🚪 ScrollTrigger onLeave, direction:', self.direction);
            if (anim && self.direction === 1) {
                anim.goToAndStop(endFrame, true);
            }
        },

        onEnter: (self) => {
            console.log('🚪 ScrollTrigger onEnter, direction:', self.direction);
            if (anim && self.direction === -1) {
                anim.goToAndStop(startFrame, true);
            }
        },

        onToggle: (self) => {
            console.log('🔄 ScrollTrigger toggle, isActive:', self.isActive);
        }
    });

    // Zawsze dodaj sync z ScrollTrigger - niezależnie od Lenis
    let lastScrollY = window.scrollY;

    const handleScroll = () => {
        const currentScrollY = window.scrollY;
        if (Math.abs(currentScrollY - lastScrollY) > 1) {
            ScrollTrigger.update();
            lastScrollY = currentScrollY;
        }
    };

    // Dodaj scroll listener
    window.addEventListener('scroll', handleScroll, { passive: true });

    // Jeśli Lenis jest aktywny, dodaj także jego sync
    if (isLenisActive && window.lenis) {
        console.log('🔄 Adding Lenis sync...');
        window.lenis.on('scroll', () => {
            ScrollTrigger.update();
        });
    }

    console.log('✅ Scroll animation ready');
}

// Debug functions
export function debugLottieFrames() {
    if (!anim) {
        console.log('❌ No animation loaded');
        return;
    }

    console.log('=== LOTTIE DEBUG ===');
    console.log('Total frames:', anim.totalFrames);
    console.log('Current frame:', anim.currentFrame);
    console.log('Is loaded:', anim.isLoaded);
    console.log('Container children:', document.querySelector('.hero-lottie')?.children.length);
}

export function goToFrame(frameNumber) {
    if (!anim) {
        console.log('❌ No animation loaded');
        return;
    }

    const clampedFrame = Math.max(0, Math.min(frameNumber, anim.totalFrames - 1));
    anim.goToAndStop(clampedFrame, true);
    console.log(`🎯 Jumped to frame: ${clampedFrame}`);
}

// Restart function w przypadku problemów
export function restartLottieAnimation() {
    console.log('🔄 Restarting Lottie...');

    // Zniszcz poprzednią animację
    if (anim) {
        anim.destroy();
        anim = null;
    }

    // Reset flag
    isInitialized = false;

    // Wyczyść kontener
    const container = document.querySelector('.hero-lottie');
    if (container) {
        container.innerHTML = '';
    }

    // Usuń ScrollTriggery
    ScrollTrigger.getAll().forEach(trigger => {
        if (trigger.trigger === container) {
            trigger.kill();
        }
    });

    // Załaduj ponownie po krótkiej przerwie
    setTimeout(() => {
        loadHeroLottie();
    }, 100);
}