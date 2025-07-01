import { HeaderStateManager, updateHeaderUI, updateNavHighlight, showAllNavItemsOnScrollUp, hideInactiveNavItems, isScrollingUp, scrollUpTimer } from './header.js';
import { updateButtonTheme } from './buttonTheme.js';

export function isAtTop() {
    return window.scrollY <= 50;
}

export function isAtBottom() {
    return window.scrollY >= document.body.scrollHeight - window.innerHeight - 100;
}

let lastScroll = window.scrollY;

export function handleScrollDirection() {
    const currentScroll = window.scrollY;
    const scrollingUp = currentScroll < lastScroll - 1;

    updateHeaderUI();
    updateNavHighlight();

    if (scrollingUp && !isAtTop()) {
        isScrollingUp.value = true;
        if (HeaderStateManager.shouldShowCompactHeader()) {
            showAllNavItemsOnScrollUp();
        }
        clearTimeout(scrollUpTimer.value);
        scrollUpTimer.value = setTimeout(() => {
            isScrollingUp.value = false;
            if (HeaderStateManager.shouldShowCompactHeader()) {
                hideInactiveNavItems();
            }
        }, 200);
    }

    lastScroll = currentScroll;
    updateButtonTheme();
}
