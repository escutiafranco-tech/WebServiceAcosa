function renderMenus(menus) {
    menusDiv.innerHTML = '';
    menus.forEach(menu => {
        const menuItem = document.createElement('div');
        menuItem.classList.add('menu-item');

        if (menu.image) {
            const img = document.createElement('img');
            img.src = menu.image;
            menuItem.appendChild(img);
        }

        const text = document.createElement('span');
        text.textContent = menu.name;
        menuItem.appendChild(text);

        menusDiv.appendChild(menuItem);

        // Submenus
        if (menu.submenus && menu.submenus.length) {
            const submenuDiv = document.createElement('div');
            submenuDiv.classList.add('submenu');

            menu.submenus.forEach(sub => {
                if (typeof sub === 'string') {
                    const subItem = document.createElement('div');
                    subItem.classList.add('submenu-item');
                    subItem.textContent = sub;
                    submenuDiv.appendChild(subItem);
                } else {
                    const subItemDiv = document.createElement('div');
                    subItemDiv.classList.add('submenu-item');

                    if (sub.image) {
                        const subImg = document.createElement('img');
                        subImg.src = sub.image;
                        subImg.style.width = '20px';
                        subImg.style.marginRight = '5px';
                        subItemDiv.appendChild(subImg);
                    }

                    const subText = document.createElement('span');
                    subText.textContent = sub.name;
                    subItemDiv.appendChild(subText);

                    if (sub.submenus) {
                        const subSubDiv = document.createElement('div');
                        subSubDiv.classList.add('submenu');
                        sub.submenus.forEach(ss => {
                            const ssItem = document.createElement('div');
                            ssItem.classList.add('submenu-item');
                            ssItem.textContent = ss;
                            subSubDiv.appendChild(ssItem);
                        });
                        subItemDiv.appendChild(subSubDiv);

                        // Toggle sub-submenu
                        subItemDiv.addEventListener('click', (e) => {
                            e.stopPropagation();
                            subSubDiv.classList.toggle('expanded');
                        });
                    }

                    submenuDiv.appendChild(subItemDiv);
                }
            });

            menusDiv.appendChild(submenuDiv);

            // Toggle submenu
            menuItem.addEventListener('click', () => {
                submenuDiv.classList.toggle('expanded');
            });
        }
    });
}