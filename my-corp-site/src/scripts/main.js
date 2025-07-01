// main.js – ORIGINAL VERSION (bez dodatkowych stylowań)

import '../styles/main.scss';
import './theme.js';

import { loadHeroLottie } from './lottie.js';
loadHeroLottie();

import { setupAboutSection } from './about.js';
setupAboutSection();

// import { setupTextReveal } from './textReveal.js';
// setupTextReveal();


import {
    setupIntegratedTextReveal,
    reinitializeTextReveal,
    debugTriggerPoints
} from './integratedTextReveal.js';

// Na końcu pliku, po innych inicjalizacjach:
setupIntegratedTextReveal();

// Debug funkcja (możesz usunąć później)
window.debugTriggers = debugTriggerPoints;

// Dodaj obsługę resize
let resizeTimeout;
window.addEventListener('resize', () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
        reinitializeTextReveal();
    }, 300);
});

import { setupServicesSection } from './servicesSection.js';
setupServicesSection();
