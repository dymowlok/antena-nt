// main.js – ORIGINAL VERSION (bez dodatkowych stylowań)

import '../styles/main.scss';
import './theme.js';
import { menuData } from '../data/menu.js';

function renderMenu(data) {
    const nav = document.querySelector('.header-nav ul');
    nav.innerHTML = '';

    data.forEach(item => {
        if (item.url === '#kontakt') return;

        const li = document.createElement('li');
        const a = document.createElement('a');
        a.href = item.url;
        a.textContent = item.label;
        li.appendChild(a);

        if (item.submenu && item.submenu.length > 0) {
            const submenuId = `menu-${item.label.toLowerCase().replace(/\s/g, '-')}`;
            li.dataset.menuTarget = submenuId;
        }

        nav.appendChild(li);
    });
}

function setupMenuHover() {
    const headerDesktopMenu = document.querySelector('.header-desktop-menu');
    const headerBgOverlay = document.querySelector('.header-bg-overlay');
    const body = document.body;
    const navItems = document.querySelectorAll('.header-nav li');

    let isDesktopMenuOpen = false;
    let desktopMenuTimeout = null;

    function showDesktopMenu(targetId) {
        clearTimeout(desktopMenuTimeout);

        document.querySelectorAll('.header-desktop-list').forEach(list => {
            list.classList.remove('active');
            list.style.display = 'none';
        });

        const targetList = document.getElementById(targetId);
        if (targetList) {
            targetList.classList.add('active');
            targetList.style.display = 'grid';
        }

        headerDesktopMenu.classList.add('active');
        headerBgOverlay.classList.add('active');
        body.classList.add('scroll-locked');
        isDesktopMenuOpen = true;
    }

    function hideDesktopMenu() {
        clearTimeout(desktopMenuTimeout);
        headerDesktopMenu.classList.remove('active');
        headerBgOverlay.classList.remove('active');
        body.classList.remove('scroll-locked');
        isDesktopMenuOpen = false;
    }

    function startCloseTimer() {
        clearTimeout(desktopMenuTimeout);
        desktopMenuTimeout = setTimeout(() => {
            hideDesktopMenu();
        }, 15000);
    }

    navItems.forEach(li => {
        const targetId = li.dataset.menuTarget;
        if (!targetId) return;

        li.addEventListener('mouseenter', () => showDesktopMenu(targetId));
        li.addEventListener('mouseleave', e => {
            const rect = headerDesktopMenu.getBoundingClientRect();
            const { clientX: x, clientY: y } = e;
            if (y > rect.top - 10 && y < rect.bottom + 10 && x > rect.left - 10 && x < rect.right + 10) return;
            startCloseTimer();
        });
    });

    headerDesktopMenu.addEventListener('mouseenter', () => clearTimeout(desktopMenuTimeout));
    headerDesktopMenu.addEventListener('mouseleave', () => hideDesktopMenu());
}

renderMenu(menuData);
setupMenuHover();