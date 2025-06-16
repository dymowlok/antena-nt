import { gsap } from 'gsap';
import { SplitText } from 'gsap/SplitText';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(SplitText, ScrollTrigger);

export function setupIntegratedTextReveal() {
    console.log('🎬 Initializing Integrated Text Reveal...');

    const containers = document.querySelectorAll('section, footer');

    containers.forEach((container) => {
        const allElements = container.querySelectorAll('*');

        allElements.forEach((element) => {
            // Sprawdź czy element nadaje się do animacji
            if (!shouldAnimateElement(element)) return;

            // Zdecyduj czy użyć SplitText czy standardowej animacji
            if (shouldUseSplitText(element)) {
                console.log('📝 SplitText animation for:', element.tagName, element.textContent.substring(0, 30) + '...');
                createSplitTextReveal(element);
            } else {
                console.log('✨ Standard reveal for:', element.tagName);
                createStandardReveal(element);
            }
        });
    });
}

// Sprawdź czy element powinien być animowany
function shouldAnimateElement(element) {
    // Musi być HTML elementem
    if (!(element instanceof HTMLElement)) return false;

    // Musi być widoczny
    if (element.offsetParent === null) return false;

    // Pomijaj elementy, które już mają animację
    if (element.dataset.animated === 'true') return false;

    // Pomijaj elementy z określonymi klasami
    const excludeClasses = ['no-animation', 'no-reveal', 'split-line', 'split-line-wrapper'];
    if (excludeClasses.some(cls => element.classList.contains(cls))) return false;

    return true;
}

// Sprawdź czy element powinien używać SplitText
function shouldUseSplitText(element) {
    // Tylko elementy tekstowe
    const textTags = ['H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'P'];
    if (!textTags.includes(element.tagName)) return false;

    // Pomijaj elementy z klasą no-split
    if (element.classList.contains('no-split')) return false;

    // Musi mieć wystarczająco tekstu
    const textContent = element.textContent.trim();
    if (textContent.length < 5) return false;

    // Pomijaj elementy w kontenerach, które nie powinny mieć SplitText
    const excludeContainers = ['.button', '.badge', '.header-nav', '.small-text'];
    if (excludeContainers.some(selector => element.closest(selector))) return false;

    return true;
}

// Animacja SplitText z blur/opacity - ONCE ONLY
function createSplitTextReveal(element) {
    // Oznacz element jako animowany
    element.dataset.animated = 'true';

    // Określ typ animacji na podstawie tagu
    const animationConfig = getAnimationConfig(element.tagName);

    // Podziel tekst na linie
    const split = new SplitText(element, {
        type: "lines",
        linesClass: "reveal-line"
    });

    const lines = split.lines;

    // Stwórz wrappery z clip-path (nie wpływa na spacing)
    lines.forEach((line, index) => {
        const wrapper = document.createElement('div');
        wrapper.className = 'reveal-line-wrapper';
        wrapper.style.lineHeight = 'inherit';
        wrapper.style.position = 'relative';

        // Użyj clip-path - eleganckie rozwiązanie bez wpływu na layout
        wrapper.style.clipPath = 'polygon(0 0, 100% 0, 100% 100%, 0 100%)';

        // Alternatywnie: overflow z pseudo-elementem
        wrapper.style.overflow = 'hidden';

        // Dodaj minimalną wysokość żeby pomieścić descenders
        const lineHeight = parseFloat(getComputedStyle(line).lineHeight) ||
            parseFloat(getComputedStyle(line).fontSize) * 1.2;
        wrapper.style.minHeight = `${lineHeight * 1.1}px`;

        line.parentNode.insertBefore(wrapper, line);
        wrapper.appendChild(line);
    });

    // USTAW POCZĄTKOWY STAN (ukryty)
    gsap.set(element, {
        opacity: 0,
        filter: 'blur(6px)',
        pointerEvents: 'none'
    });

    gsap.set(lines, {
        yPercent: animationConfig.yPercent,
        opacity: 0
    });

    // STWÓRZ ANIMACJĘ - JEDNORAZOWĄ
    const tl = gsap.timeline({
        scrollTrigger: {
            trigger: element,
            start: "top 90%",
            once: true, // JEDNORAZOWO
            toggleActions: "play none none none",
            onStart: () => {
                console.log('🎯 Animating once:', element.tagName, element.textContent.substring(0, 20));
            }
        }
    });

    // FAZA 1: Usuń blur z całego elementu
    tl.to(element, {
        opacity: 1,
        filter: 'blur(0px)',
        pointerEvents: 'auto',
        duration: 0.25,
        ease: 'power1.out'
    });

    // FAZA 2: Animuj linie jedna po drugiej
    tl.to(lines, {
        yPercent: 0,
        opacity: 1,
        duration: animationConfig.duration,
        stagger: animationConfig.stagger,
        ease: animationConfig.ease
    }, 0.1);

    // Zapisz referencję do SplitText dla cleanup
    element._splitText = split;

    return tl;
}

// Funkcja animacji wejścia
function animateIn(element, lines, config) {
    // Zabij poprzednie animacje na tym elemencie
    gsap.killTweensOf([element, lines]);

    const tl = gsap.timeline();

    // FAZA 1: Usuń blur z całego elementu
    tl.to(element, {
        opacity: 1,
        filter: 'blur(0px)',
        pointerEvents: 'auto',
        duration: 0.25,
        ease: 'power1.out'
    });

    // FAZA 2: Animuj linie jedna po drugiej
    tl.to(lines, {
        yPercent: 0,
        opacity: 1,
        duration: config.duration,
        stagger: config.stagger,
        ease: config.ease
    }, 0.1);

    return tl;
}

// Funkcja animacji wyjścia
function animateOut(element, lines, config) {
    // Zabij poprzednie animacje na tym elemencie
    gsap.killTweensOf([element, lines]);

    const tl = gsap.timeline();

    // FAZA 1: Ukryj linie (szybko, w odwrotnej kolejności)
    tl.to(lines, {
        yPercent: config.yPercent * 0.5, // Mniej dramatyczne wyjście
        opacity: 0,
        duration: config.duration * 0.6, // Szybsze wyjście
        stagger: -config.stagger * 0.5, // Odwrotna kolejność, szybciej
        ease: "power2.in"
    });

    // FAZA 2: Dodaj blur do całego elementu
    tl.to(element, {
        opacity: 0,
        filter: 'blur(6px)',
        pointerEvents: 'none',
        duration: 0.2,
        ease: 'power1.in'
    }, 0.1); // Rozpocznij wcześnie

    return tl;
}

// Standardowa animacja blur/opacity - ONCE ONLY
function createStandardReveal(element) {
    // Oznacz element jako animowany
    element.dataset.animated = 'true';

    // Animacja jednorazowa
    gsap.fromTo(element, {
        opacity: 0,
        filter: 'blur(6px)',
        pointerEvents: 'none'
    }, {
        opacity: 1,
        filter: 'blur(0px)',
        pointerEvents: 'auto',
        duration: 0.5,
        ease: 'power1.out',
        scrollTrigger: {
            trigger: element,
            start: 'top 90%',
            once: true, // JEDNORAZOWO
            toggleActions: 'play none none none'
        }
    });
}

// Funkcja animacji wejścia dla standardowych elementów
function animateStandardIn(element) {
    gsap.killTweensOf(element);

    gsap.to(element, {
        opacity: 1,
        filter: 'blur(0px)',
        pointerEvents: 'auto',
        duration: 0.5,
        ease: 'power1.out'
    });
}

// Funkcja animacji wyjścia dla standardowych elementów
function animateStandardOut(element) {
    gsap.killTweensOf(element);

    gsap.to(element, {
        opacity: 0,
        filter: 'blur(6px)',
        pointerEvents: 'none',
        duration: 0.3,
        ease: 'power1.in'
    });
}

// Konfiguracja animacji dla różnych typów elementów
function getAnimationConfig(tagName) {
    const configs = {
        'H1': {
            duration: 1.2,
            stagger: 0.15,
            ease: "power3.out",
            yPercent: 100
        },
        'H2': {
            duration: 1.0,
            stagger: 0.12,
            ease: "power3.out",
            yPercent: 90
        },
        'H3': {
            duration: 0.8,
            stagger: 0.1,
            ease: "power2.out",
            yPercent: 80
        },
        'H4': {
            duration: 0.8,
            stagger: 0.1,
            ease: "power2.out",
            yPercent: 80
        },
        'H5': {
            duration: 0.8,
            stagger: 0.1,
            ease: "power2.out",
            yPercent: 80
        },
        'H6': {
            duration: 0.8,
            stagger: 0.1,
            ease: "power2.out",
            yPercent: 80
        },
        'P': {
            duration: 0.7,
            stagger: 0.08,
            ease: "power2.out",
            yPercent: 70
        }
    };

    return configs[tagName] || configs['P'];
}

// Funkcja cleanup
export function cleanupTextReveal() {
    // Usuń wszystkie SplitText instancje
    const elementsWithSplit = document.querySelectorAll('[data-animated="true"]');
    elementsWithSplit.forEach(element => {
        if (element._splitText) {
            element._splitText.revert();
            delete element._splitText;
        }
        element.removeAttribute('data-animated');
    });

    // Zabij wszystkie ScrollTriggery
    ScrollTrigger.getAll().forEach(trigger => {
        if (trigger.vars.onStart && trigger.vars.onStart.toString().includes('Animating:')) {
            trigger.kill();
        }
    });
}

// Funkcja reinicjalizacji (dla resize)
export function reinitializeTextReveal() {
    console.log('🔄 Reinitializing text reveal...');

    cleanupTextReveal();

    setTimeout(() => {
        setupIntegratedTextReveal();
        ScrollTrigger.refresh();
    }, 100);
}

// Funkcje dla konkretnych przypadków
export function animateSpecificElement(selector, config = {}) {
    const element = document.querySelector(selector);
    if (!element) return;

    if (shouldUseSplitText(element)) {
        // Tymczasowo nadpisz konfigurację
        const originalGetConfig = getAnimationConfig;
        window.getAnimationConfig = () => ({ ...getAnimationConfig(element.tagName), ...config });

        createSplitTextReveal(element);

        // Przywróć oryginalną funkcję
        window.getAnimationConfig = originalGetConfig;
    } else {
        createStandardReveal(element);
    }
}

// Konfiguracja trigger points (można dostosować)
export function setRevealTriggerPoints(startPoint = "top 90%", endPoint = "bottom 10%") {
    window.REVEAL_START = startPoint;
    window.REVEAL_END = endPoint;
}

// Funkcja do testowania konkretnej sekcji
export function testSectionReveal(sectionSelector) {
    const section = document.querySelector(sectionSelector);
    if (!section) {
        console.log('❌ Section not found:', sectionSelector);
        return;
    }

    console.log('🧪 Testing section:', sectionSelector);

    const elements = section.querySelectorAll('*');
    let splitTextCount = 0;
    let standardCount = 0;

    elements.forEach(el => {
        if (shouldAnimateElement(el)) {
            if (shouldUseSplitText(el)) {
                splitTextCount++;
            } else {
                standardCount++;
            }
        }
    });

    console.log('📊 Results:', {
        'SplitText elements': splitTextCount,
        'Standard elements': standardCount,
        'Total animated': splitTextCount + standardCount
    });
}

// Debug funkcja do sprawdzenia wszystkich trigger points
export function debugTriggerPoints() {
    const triggers = ScrollTrigger.getAll();
    console.log('🎯 Active ScrollTriggers:', triggers.length);

    triggers.forEach((trigger, index) => {
        console.log(`Trigger ${index + 1}:`, {
            element: trigger.trigger.tagName,
            start: trigger.start,
            end: trigger.end,
            toggleActions: trigger.vars.toggleActions
        });
    });
}