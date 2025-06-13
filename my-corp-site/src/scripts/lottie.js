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
        // 1. Automatycznie odtwórz 0–57
        anim.playSegments([0, 57], true);

        let scrollTriggerActivated = false;

        ScrollTrigger.create({
            trigger: container,
            start: 'top center',
            end: 'bottom bottom',
            scrub: 1.2,
            onUpdate: (self) => {
                if (!scrollTriggerActivated && self.progress === 0) return;
                scrollTriggerActivated = true;

                const scrollProgress = self.progress;
                if (scrollProgress <= 0.5) {
                    const t = scrollProgress / 0.5;
                    const frame = 58 + t * (192 - 58);
                    anim.goToAndStop(frame, true);
                } else {
                    const t = (scrollProgress - 0.5) / 0.5;
                    const frame = 193 + t * (anim.totalFrames - 193);
                    anim.goToAndStop(frame, true);
                }
            }
        });
    });
}
