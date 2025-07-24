import { gsap } from 'gsap';
import ScrollTrigger from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

// Theme system is now handled by themeManager.js
// This prevents conflicts with the centralized theme management
export function setupThemeObserver() {
    // Disabled - theme management is now handled by themeManager.js
}
