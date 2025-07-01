import lottie from 'lottie-web';
import { gsap } from 'gsap';
import ScrollTrigger from 'gsap/ScrollTrigger';
import lenis from './utils/lenis.js';
import heroJson from '../assets/lottie/hero.json' assert { type: 'json' };
import { debugLog, debugWarn, debugError } from './utils/debug.js';

gsap.registerPlugin(ScrollTrigger);

let anim = null;
let isInitialized = false;

export function loadHeroLottie() {
    // Zapobiegnij wielokrotnemu ładowaniu
    if (isInitialized) {
        debugLog('⚠️ Lottie already initialized');
        return;
    }

    const container = document.querySelector('.hero-lottie');
    if (!container) {
        debugWarn('❌ Hero Lottie container not found');
        return;
    }

    // Sprawdź czy kontener nie jest już zajęty
    if (container.children.length > 0) {
        debugLog('⚠️ Container already has content, clearing...');
        container.innerHTML = '';
    }

    debugLog('🎬 Loading Lottie animation...');
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
        debugLog('✅ Lottie loaded, total frames:', anim.totalFrames);

        // 1. Automatyczne odtwarzanie pierwszych 56 ramek
        anim.playSegments([0, 56], true);

        // 2. Setup scroll po zakończeniu autoplay
        anim.addEventListener('complete', handleAutoplayComplete);
    });
}

function handleAutoplayComplete() {
    debugLog('✅ Autoplay completed, setting up scroll animation...');

    // Usuń event listener żeby nie wywołać wielokrotnie
    anim.removeEventListener('complete', handleAutoplayComplete);

    // Krótkie opóźnienie przed setup scroll
    setTimeout(setupScrollAnimation, 100);
}

function setupScrollAnimation() {
    const container = document.querySelector('.hero-lottie');
    if (!container || !anim) {
        debugError('❌ Cannot setup scroll - missing container or animation');
        return;
    }

    const totalFrames = anim.totalFrames; // 271
    const startFrame = 57;
    const endFrame = Math.floor(totalFrames) - 1; // POPRAWKA: Math.floor na totalFrames, nie na wynik
    const frameRange = endFrame - startFrame;

    // Debug sprawdzenie
    debugLog('📊 Frame calculation:', {
        totalFrames,
        startFrame,
        endFrame,
        frameRange,
        'Range valid': frameRange > 0
    });

    // WAŻNE: Sprawdź czy range jest poprawny
    if (frameRange <= 0) {
        debugError('❌ Invalid frame range:', { startFrame, endFrame, frameRange });
        return;
    }

    debugLog(`🎯 Setting up scroll: frames ${startFrame}-${endFrame}`);

    // Ustaw na końcu autoplay
    anim.goToAndStop(56, true);

    // Usuń poprzednie ScrollTriggery dla tego elementu
    ScrollTrigger.getAll().forEach(trigger => {
        if (trigger.trigger === container) {
            trigger.kill();
        }
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
                debugLog(`🎬 Progress: ${progress.toFixed(3)} | Start: ${startFrame} | Target: ${targetFrame.toFixed(1)} | Clamped: ${clampedFrame.toFixed(1)} | Current: ${anim.currentFrame.toFixed(1)}`);
            }
        },

        onLeave: (self) => {
            debugLog('🚪 ScrollTrigger onLeave, direction:', self.direction);
            if (anim && self.direction === 1) {
                anim.goToAndStop(endFrame, true);
            }
        },

        onEnter: (self) => {
            debugLog('🚪 ScrollTrigger onEnter, direction:', self.direction);
            if (anim && self.direction === -1) {
                anim.goToAndStop(startFrame, true);
            }
        },

        onToggle: (self) => {
            debugLog('🔄 ScrollTrigger toggle, isActive:', self.isActive);
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



    debugLog('✅ Scroll animation ready');
}

// Debug functions
export function debugLottieFrames() {
    if (!anim) {
        debugLog('❌ No animation loaded');
        return;
    }

    debugLog('=== LOTTIE DEBUG ===');
    debugLog('Total frames:', anim.totalFrames);
    debugLog('Current frame:', anim.currentFrame);
    debugLog('Is loaded:', anim.isLoaded);
    debugLog('Container children:', document.querySelector('.hero-lottie')?.children.length);
}

export function goToFrame(frameNumber) {
    if (!anim) {
        debugLog('❌ No animation loaded');
        return;
    }

    const clampedFrame = Math.max(0, Math.min(frameNumber, anim.totalFrames - 1));
    anim.goToAndStop(clampedFrame, true);
    debugLog(`🎯 Jumped to frame: ${clampedFrame}`);
}

// Restart function w przypadku problemów
export function restartLottieAnimation() {
    debugLog('🔄 Restarting Lottie...');

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