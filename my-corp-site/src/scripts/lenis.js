import Lenis from 'lenis';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const lenis = new Lenis({
    smooth: true,
    lerp: 0.1,
});

function raf(time) {
    lenis.raf(time);
    requestAnimationFrame(raf);
}
requestAnimationFrame(raf);

// Powiadamiaj GSAP o scrollu
lenis.on('scroll', ScrollTrigger.update);

// Domyślne ustawienia dla ScrollTrigger
ScrollTrigger.defaults({
    scroller: lenis.target,
    pinType: 'transform',
});

export default lenis;
