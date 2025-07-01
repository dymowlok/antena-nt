import { initializeHeader } from './header.js';
import { setupDesktopMenu } from './desktopMenu.js';
import { updateButtonTheme } from './buttonTheme.js';
import { handleScrollDirection } from './scrollHelpers.js';

initializeHeader();
setupDesktopMenu();

window.addEventListener('scroll', handleScrollDirection);
window.addEventListener('resize', () => {
  handleScrollDirection();
});

// initialize button theme once DOM is ready
setTimeout(() => {
  updateButtonTheme();
}, 300);
