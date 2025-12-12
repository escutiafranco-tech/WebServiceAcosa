// Utilidades de tabla desactivadas temporalmente mientras se reconstruye la UI.
(function(window){
    window.TableUtils = {
        makeResizable: function(){},
        makeReorderable: function(){},
        addHeaderSorting: function(){}
    };
})(window);
    };

    TU.makeReorderable = function(headerRowSelector, manager, options = {}) {
        // Reorder feature disabled: keep header order fixed to HTML declaration.
        // This is intentionally a no-op to avoid data/header desync issues.
        return;
    };

    // Conveniencia para aplicar resize+reorder
    TU.makeInteractive = function(headerRowSelector, manager, options = {}) {
        TU.makeResizable(headerRowSelector, manager, options);
        TU.makeReorderable(headerRowSelector, manager, options);
    };

    // Reordena los elementos del header DOM según el columnOrder del manager
    // mapping: array de claves lógicas por índice (ej. ['acciones','id','proveedor',...])
    TU.updateHeaderOrder = function(headerRowSelector, manager, mapping = []) {
        // No-op: disabling header DOM reordering to keep DOM order stable with declared HTML
        return;
        // Construir mapa de clase -> elemento para los hijos actuales
        const elemsByClass = {};
        const originalChildren = Array.from(headerRow.children);
        originalChildren.forEach(el => {
            const cls = Array.from(el.classList).find(c => c.startsWith('col-'));
            if (cls) elemsByClass[cls] = el;
        });

        function keyToClass(key) {
            if (!key) return null;
            const map = {
                'acciones': 'col-acciones', 'estatus': 'col-estatus',
                'id': 'col-id', 'proveedor': 'col-proveedor', 'fecha_servicio': 'col-fecha', 'tipo_movimiento': 'col-tipo', 'ubicacion_inicial': 'col-ubicacion',
                'codigo': 'col-codigo', 'nombre': 'col-nombre', 'contacto': 'col-contacto', 'telefono': 'col-telefono', 'email': 'col-email', 'activo': 'col-activo'
            };
            return map[key] || ('col-' + key.replace(/_/g,'-'));
        }

        const added = new Set();
        const resultOrder = [];


        // Siempre colocar Acciones primero
        if (elemsByClass['col-acciones']) {
            resultOrder.push(elemsByClass['col-acciones']);
            added.add('col-acciones');
        }

        // Si existe Estatus, colocarlo ahora como segunda columna
        if (elemsByClass['col-estatus']) {
            resultOrder.push(elemsByClass['col-estatus']);
            added.add('col-estatus');
        }

        // Añadir según manager.columnOrder (omitimos acciones/estatus aquí)
        for (let pos = 0; pos < manager.columnOrder.length; pos++) {
            const idx = manager.columnOrder[pos];
            const key = mapping && mapping[idx] ? mapping[idx] : null;
            const cls = keyToClass(key);
            if (!cls || cls === 'col-acciones' || cls === 'col-estatus') continue;
            const el = elemsByClass[cls];
            if (el && !added.has(cls)) {
                resultOrder.push(el);
                added.add(cls);
            }
        }

        // Añadir cualquier elemento restante que no se haya añadido (seguridad)
        originalChildren.forEach(el => {
            const cls = Array.from(el.classList).find(c => c.startsWith('col-'));
            if (cls && !added.has(cls)) {
                resultOrder.push(el);
                added.add(cls);
            }
        });

        // Vaciar y reappend en nuevo orden
        headerRow.innerHTML = '';
        resultOrder.forEach(el => headerRow.appendChild(el));

        // Reordenar también las celdas de cada fila del cuerpo para mantener alineación
        try {
            const bodyRows = document.querySelectorAll('.table-body .table-row');
            // Obtener la secuencia de clases de columna definida en el header (p.e. ['col-acciones','col-estatus',...])
            const headerClasses = resultOrder.map(h => Array.from(h.classList).find(c => c && c.startsWith && c.startsWith('col-'))).filter(Boolean);

            bodyRows.forEach(row => {
                const cellsByClass = {};
                Array.from(row.children).forEach(cell => {
                    const cls = Array.from(cell.classList).find(c => c && c.startsWith && c.startsWith('col-'));
                    if (cls) cellsByClass[cls] = cell;
                });

                // Si no tenemos clases en las celdas (legacy), intentar mapear por posición
                const hasClasses = Object.keys(cellsByClass).length > 0;
                if (hasClasses) {
                    row.innerHTML = '';
                    headerClasses.forEach(cls => {
                        const el = cellsByClass[cls] || document.createElement('div');
                        row.appendChild(el);
                    });
                    // añadir cualquier celda restante que no haya sido appendeda
                    Object.keys(cellsByClass).forEach(cls => {
                        if (!headerClasses.includes(cls)) row.appendChild(cellsByClass[cls]);
                    });
                } else {
                    // Fallback: si no hay clases, no hacemos nada
                }
            });
        } catch (e) {
            console.warn('TableUtils.updateHeaderOrder: no se pudo reordenar filas del cuerpo', e);
        }
    };

})(window);

