// scrollHelpers.js – UPDATED VERSION (functionality moved to unifiedHeaderManager.js)

// Scroll helper functions moved to unifiedHeaderManager.js
// This file is now deprecated

console.warn('scrollHelpers.js is deprecated - functionality moved to unifiedHeaderManager.js');

// Export empty functions for compatibility
export function isAtTop() {
    return window.scrollY <= 50;
}

export function isAtBottom() {
    return window.scrollY >= document.body.scrollHeight - window.innerHeight - 100;
}

export function handleScrollDirection() {
    // Functionality moved to unifiedHeaderManager.js
}
