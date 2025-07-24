// main.js – NAPRAWIONA WERSJA (po rozwiązaniu konfliktu merge)

import '../styles/main.scss';
import './theme.js';
import './themeManager.js'; // Initialize theme manager
import { debugLog, debugWarn } from './utils/debug.js';

import { loadHeroLottie } from './lottie.js';
loadHeroLottie();

import { setupAboutSection } from './about.js';
setupAboutSection();

// ButtonThemeSwitcher - zachowuję z gałęzi codex/decide-and-clean-up-text-reveal-module
export class ButtonThemeSwitcher {
    constructor() {
        this.button = document.querySelector('.header a.button.light');
        this.firstSection = document.querySelector('main > section:first-child');
        this.currentClass = 'light';

        if (!this.button || !this.firstSection) {
            debugWarn('ButtonThemeSwitcher: Brak wymaganych elementów');
            return;
        }

        debugLog('✅ ButtonThemeSwitcher zainicjalizowany');
        this.update();
    }

    /**
     * POPRAWIONA LOGIKA - bez konfliktów
     * 
     * Zasady:
     * 1. Jeśli dolna krawędź sekcji jest ≤ 30vh od góry viewportu → BLACK
     * 2. Jeśli dolna krawędź sekcji jest ≥ 50vh od dołu viewportu → LIGHT  
     * 3. W strefie między 30vh a (100vh-50vh=50vh) → zachowaj obecny stan
     */
    update() {
        if (!this.button || !this.firstSection) return;

        const vh = window.innerHeight / 100; // 1vh w pikselach
        const sectionRect = this.firstSection.getBoundingClientRect();
        const sectionBottom = sectionRect.bottom;

        // Strefy decyzyjne (w pikselach)
        const blackZone = 30 * vh;  // 30vh od góry
        const lightZone = 50 * vh;  // 50vh od dołu (czyli do pozycji window.innerHeight - 50vh)
        const lightZonePosition = window.innerHeight - lightZone;

        let newClass = this.currentClass; // domyślnie zachowaj obecny

        // REGUŁA 1: Strefa BLACK (sekcja jest bardzo wysoko)
        if (sectionBottom <= blackZone) {
            newClass = 'black';
        }

        // REGUŁA 2: Strefa LIGHT (sekcja jest nisko, daleko od dołu)
        if (sectionBottom <= lightZonePosition) {
            newClass = 'light';
        }

        // Zmień klasę jeśli potrzeba
        if (this.currentClass !== newClass) {
            this.switchButtonClass(newClass);
        }

        // Debug
        this.logDebugInfo(sectionBottom, blackZone, lightZonePosition, newClass);
    }

    /**
     * ALTERNATYWNA LOGIKA z trzema strefami
     * 
     * Strefy:
     * - Góra (0 do 30vh): BLACK
     * - Środek (30vh do 50vh): bez zmian (hystereza)  
     * - Dół (50vh do 100vh): LIGHT
     */
    updateWithZones() {
        if (!this.button || !this.firstSection) return;

        const vh = window.innerHeight / 100;
        const sectionRect = this.firstSection.getBoundingClientRect();
        const sectionBottom = sectionRect.bottom;

        // Definicja stref
        const zones = {
            black: { start: 0, end: 30 * vh },           // 0-30vh
            neutral: { start: 30 * vh, end: 50 * vh },   // 30-50vh (hystereza)
            light: { start: 50 * vh, end: window.innerHeight } // 50vh-100vh
        };

        let newClass = this.currentClass;

        // Sprawdź w której strefie jest dolna krawędź sekcji
        if (sectionBottom >= zones.black.start && sectionBottom <= zones.black.end) {
            newClass = 'black';
        } else if (sectionBottom >= zones.light.start && sectionBottom <= zones.light.end) {
            newClass = 'light';
        }
        // W strefie neutral - nie zmieniaj klasy (hystereza)

        if (this.currentClass !== newClass) {
            this.switchButtonClass(newClass);
        }
    }

    /**
     * NAJPROSTSZA LOGIKA - priorytet dla BLACK
     */
    updateSimple() {
        if (!this.button || !this.firstSection) return;

        const vh = window.innerHeight / 100;
        const sectionRect = this.firstSection.getBoundingClientRect();
        const sectionBottom = sectionRect.bottom;

        // Prosta logika priorytetowa
        let newClass;

        if (sectionBottom <= 30 * vh) {
            // Bardzo blisko góry - BLACK ma priorytet
            newClass = 'black';
        } else if (sectionBottom <= window.innerHeight - 50 * vh) {
            // Daleko od dołu - LIGHT
            newClass = 'light';
        } else {
            // Środkowa strefa - zachowaj obecny
            newClass = this.currentClass;
        }

        if (this.currentClass !== newClass) {
            this.switchButtonClass(newClass);
        }
    }

    switchButtonClass(newClass) {
        const oldClass = this.currentClass;

        this.button.classList.remove(oldClass);
        this.button.classList.add(newClass);
        this.currentClass = newClass;

        debugLog(`🎨 Button: ${oldClass} → ${newClass}`);

        // Smooth transition
        this.button.style.transition = 'all 0.3s ease';
    }

    logDebugInfo(sectionBottom, blackZone, lightZonePosition, targetClass) {
        if (window.DEBUG_BUTTON_SWITCHER) {
            const vh = window.innerHeight / 100;
            debugLog('🔍 ButtonSwitcher:', {
                'Section bottom': `${Math.round(sectionBottom)}px (${Math.round(sectionBottom / vh)}vh)`,
                'Black zone': `≤ ${Math.round(blackZone)}px (≤ 30vh)`,
                'Light zone': `≤ ${Math.round(lightZonePosition)}px (≤ ${Math.round((window.innerHeight - lightZonePosition) / vh)}vh from bottom)`,
                'Current': this.currentClass,
                'Target': targetClass,
                'Will change': this.currentClass !== targetClass
            });
        }
    }

    enableDebug() {
        window.DEBUG_BUTTON_SWITCHER = true;
        debugLog('🐛 ButtonSwitcher debug ON');
    }

    disableDebug() {
        window.DEBUG_BUTTON_SWITCHER = false;
    }
}

// Blur fade-in functionality
import { setupBlurFadeIn, reinitializeBlurFadeIn } from './blurFadeIn.js';

// Setup blur fade-in animations
setupBlurFadeIn();

// Add resize handler for blur fade-in
let resizeTimeout;
window.addEventListener('resize', () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
        reinitializeBlurFadeIn();
    }, 300);
});

import { setupServicesSection } from './servicesSection.js';
setupServicesSection();