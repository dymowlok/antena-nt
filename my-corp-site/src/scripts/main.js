import './lenis.js';
import './gsap.js';
import './lottie.js';
import "./theme.js";


// src/scripts/main.js
import { menuData } from '../data/menu.js';

function renderMenu(menu) {
    const nav = document.querySelector('.header-nav ul');
    const desktopMenu = document.querySelector('.header-desktop-menu');

    nav.innerHTML = '';
    desktopMenu.innerHTML = '';

    menu.forEach((item) => {
        // Główna nawigacja
        const li = document.createElement('li');
        li.innerHTML = `<a href="${item.url}">${item.label}</a>`;
        nav.appendChild(li);

        // Submenu
        if (item.submenu) {
            const submenuList = document.createElement('ul');
            submenuList.className = 'header-desktop-list';
            submenuList.id = `menu-${item.label.toLowerCase().replace(/\s/g, '-')}`;

            item.submenu.forEach((subitem) => {
                const subLi = document.createElement('li');
                subLi.innerHTML = `<a href="${subitem.url}">${subitem.label}</a>`;
                submenuList.appendChild(subLi);
            });

            desktopMenu.appendChild(submenuList);
        }
    });
}

renderMenu(menuData);


import { setupButtonEffects } from './buttonEffects.js';

document.addEventListener('DOMContentLoaded', () => {
    setupButtonEffects();
});
