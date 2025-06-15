import lottie from 'lottie-web';
import { gsap } from 'gsap';
import ScrollTrigger from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

let anim = null;

export function loadHeroLottie() {
    const container = document.querySelector('.hero-lottie');
    if (!container) return;

    anim = lottie.loadAnimation({
        container,
        renderer: 'svg',
        loop: false,
        autoplay: false,
        path: '/src/assets/lottie/hero.json',
        rendererSettings: {
            preserveAspectRatio: 'xMidYMid slice'
        }
    });

    anim.addEventListener('DOMLoaded', () => {
        const totalFrames = anim.totalFrames; // 272.8 ramek
        console.log('Total frames:', totalFrames);

        // 1. Automatycznie odtwórz pierwsze 56 ramek
        anim.playSegments([0, 56], true);

        // Poczekaj aż się skończy automatyczne odtwarzanie
        setTimeout(() => {
            setupScrollAnimation();
        }, (56 / 60) * 1000); // Oblicz czas trwania pierwszych 56 ramek (przy 60fps)
    });
}

function setupScrollAnimation() {
    const container = document.querySelector('.hero-lottie');
    const totalFrames = anim.totalFrames; // 272.8
    const startFrame = 57; // Zaczynamy od ramki 57
    const endFrame = totalFrames - 1; // Kończymy na ostatniej ramce
    const scrollFrameRange = endFrame - startFrame; // Ile ramek do odtworzenia na scroll

    console.log(`Scroll animation: ramki ${startFrame} - ${endFrame} (${scrollFrameRange} ramek)`);

    // Ustaw animację na ramce 56 (ostatnia z automatycznego odtwarzania)
    anim.goToAndStop(56, true);

    ScrollTrigger.create({
        trigger: container,
        start: 'top bottom', // Zaczyna gdy top kontenera dotknie bottom viewport
        end: 'bottom top',   // Kończy gdy bottom kontenera dotknie top viewport
        scrub: 1.2,
        onUpdate: (self) => {
            // Mapuj progress scrolla (0-1) na ramki (57 - totalFrames)
            const scrollProgress = self.progress;
            const targetFrame = startFrame + (scrollProgress * scrollFrameRange);

            // Upewnij się, że nie przekraczamy granic
            const clampedFrame = Math.min(Math.max(targetFrame, startFrame), endFrame);

            console.log(`Scroll progress: ${scrollProgress.toFixed(3)}, Frame: ${clampedFrame.toFixed(1)}`);

            anim.goToAndStop(clampedFrame, true);
        },
        onLeave: () => {
            // Gdy użytkownik przewinął poza element, ustaw na ostatniej ramce
            anim.goToAndStop(endFrame, true);
        },
        onEnterBack: () => {
            // Gdy użytkownik wraca do elementu, kontynuuj normalną animację scroll
            // ScrollTrigger automatycznie wywoła onUpdate
        }
    });
}

// Opcjonalna funkcja do debugowania
export function debugLottieFrames() {
    if (!anim) {
        console.log('Animacja nie została załadowana');
        return;
    }

    console.log('Informacje o animacji Lottie:');
    console.log('- Całkowita liczba ramek:', anim.totalFrames);
    console.log('- Aktualna ramka:', anim.currentFrame);
    console.log('- FPS:', anim.frameRate || 60);
    console.log('- Czas trwania (sekundy):', anim.totalFrames / (anim.frameRate || 60));
}

// Funkcja do ręcznego przejścia do konkretnej ramki (do testowania)
export function goToFrame(frameNumber) {
    if (!anim) {
        console.log('Animacja nie została załadowana');
        return;
    }

    const clampedFrame = Math.min(Math.max(frameNumber, 0), anim.totalFrames - 1);
    anim.goToAndStop(clampedFrame, true);
    console.log(`Przeszedł do ramki: ${clampedFrame}`);
}