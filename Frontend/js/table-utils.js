// TableUtils - utilidades comunes para tablas en el frontend ACOSA.
//
// Esta IIFE (función auto‑ejecutable) encapsula un objeto `TU` con
// helpers para:
//  - (opcional) hacer columnas redimensionables.
//  - (opcional) permitir reordenar columnas.
//  - añadir eventos de ordenamiento al header.
//
// Nota importante:
//  - En esta versión, las funciones de resize/reorder están "apagadas"
//    (no hacen nada) para evitar desincronizar header y filas del cuerpo.
//  - La única funcionalidad activa es la de agregar manejadores de sort.
(function(window){
    // Objeto contenedor de todas las utilidades de tabla.
    const TU = {};

    /**
     * TU.makeResizable(headerRowSelector, manager, options)
     * ----------------------------------------------------
     * Pensada para hacer redimensionables las columnas del header.
     * Actualmente está como NO-OP (no hace nada) porque no se
     * requiere ese comportamiento, pero se deja el hook preparado
     * por si en el futuro quieres implementarlo.
     */
    TU.makeResizable = function(headerRowSelector, manager, options = {}) {
        // Implementación opcional: actualmente no se necesita comportamiento de resize.
        return; // NO-OP intencional.
    };

    /**
     * TU.makeReorderable(headerRowSelector, manager, options)
     * -------------------------------------------------------
     * Punto de extensión para permitir arrastrar/reordenar
     * columnas en el header.
     * Por ahora está deshabilitado para evitar problemas de
     * desincronización entre las columnas del header y las
     * columnas de cada fila del body.
     */
    TU.makeReorderable = function(headerRowSelector, manager, options = {}) {
        // Reordenamiento desactivado intencionalmente.
        return; // NO-OP intencional.
    };

    /**
     * TU.addHeaderSorting(headerRowSelector, onSort)
     * ----------------------------------------------
     * Añade manejadores de clic a las celdas de header que
     * tengan el atributo data-sort.
     *
     * Parámetros:
     *  - headerRowSelector: selector CSS o nodo DOM del header.
     *  - onSort: callback que se llama con la "key" de ordenamiento
     *    (lo que venga en data-sort) cuando el usuario hace clic.
     */
    TU.addHeaderSorting = function(headerRowSelector, onSort) {
        try {
            // Si nos pasan un string, lo resolvemos con querySelector.
            const header = typeof headerRowSelector === 'string' ? document.querySelector(headerRowSelector) : headerRowSelector;
            if (!header) return; // Si no hay header, no hacemos nada.

            // Tomamos solo las celdas que declaran data-sort.
            const cells = header.querySelectorAll('[data-sort]');
            cells.forEach(cell => {
                // Indicamos visualmente que son "clicables".
                cell.style.cursor = 'pointer';
                // Al hacer clic, obtenemos la key y llamamos el callback.
                cell.addEventListener('click', () => {
                    const key = cell.getAttribute('data-sort');
                    if (typeof onSort === 'function') onSort(key);
                });
            });
        } catch (e) {
            // Cualquier error aquí simplemente se ignora para no romper la UI.
        }
    };

    /**
     * TU.makeInteractive(headerRowSelector, manager, options)
     * ------------------------------------------------------
     * Función de conveniencia para aplicar, en un solo paso,
     * las capacidades de resize + reorder (cuando estén
     * implementadas/activadas).
     */
    TU.makeInteractive = function(headerRowSelector, manager, options = {}) {
        TU.makeResizable(headerRowSelector, manager, options);
        TU.makeReorderable(headerRowSelector, manager, options);
    };

    /**
     * TU.updateHeaderOrder(headerRowSelector, manager, mapping)
     * ---------------------------------------------------------
     * Reordena los elementos del header DOM según `manager.columnOrder`
     * y, opcionalmente, renombra keys de datos usando `mapping`.
     *
     * IMPORTANTE: por compatibilidad y para no romper pantallas,
     * `enabled` está a false, por lo que esta función retorna
     * inmediatamente y no cambia nada.
     *
     * Si en algún momento quieres habilitarla, basta con poner
     * `enabled = true` y adaptar el layout del body.
     */
    TU.updateHeaderOrder = function(headerRowSelector, manager, mapping = []) {
        // Flag global para prender/apagar el reordenamiento dinámico.
        const enabled = false;
        if (!enabled) return; // Salida temprana: hoy NO se reordena nada.

        // Resolvemos el nodo DOM real del header.
        const headerRow = typeof headerRowSelector === 'string' ? document.querySelector(headerRowSelector) : headerRowSelector;
        if (!headerRow || !manager || !Array.isArray(manager.columnOrder)) return;

        // Índice por clase CSS (col-*) para localizar cada columna del header.
        const elemsByClass = {};
        const originalChildren = Array.from(headerRow.children);
        originalChildren.forEach(el => {
            const cls = Array.from(el.classList).find(c => c.startsWith('col-'));
            if (cls) elemsByClass[cls] = el;
        });

        // Traduce una "key" de datos a la clase CSS de columna.
        function keyToClass(key) {
            if (!key) return null;
            const map = {
                'acciones': 'col-acciones', 'estatus': 'col-estatus',
                'id': 'col-id', 'proveedor': 'col-proveedor', 'fecha_servicio': 'col-fecha', 'tipo_movimiento': 'col-tipo', 'ubicacion_inicial': 'col-ubicacion',
                'codigo': 'col-codigo', 'nombre': 'col-nombre', 'contacto': 'col-contacto', 'telefono': 'col-telefono', 'email': 'col-email', 'activo': 'col-activo'
            };
            // Si no está mapeado explícitamente, generamos una clase col-<key>.
            return map[key] || ('col-' + key.replace(/_/g,'-'));
        }

        // Estructuras auxiliares para construir el nuevo orden.
        const added = new Set();      // Rastrear qué columnas ya se agregaron.
        const resultOrder = [];       // Orden final de nodos de header.

        // Forzamos que ACCIONES y ESTATUS (si existen) vayan al inicio.
        if (elemsByClass['col-acciones']) { resultOrder.push(elemsByClass['col-acciones']); added.add('col-acciones'); }
        if (elemsByClass['col-estatus'])  { resultOrder.push(elemsByClass['col-estatus']);  added.add('col-estatus');  }

        // Recorremos el orden de columnas definido por el manager.
        for (let pos = 0; pos < manager.columnOrder.length; pos++) {
            const idx = manager.columnOrder[pos];
            const key = mapping && mapping[idx] ? mapping[idx] : null;
            const cls = keyToClass(key);
            // Ignoramos columnas sin clase o las especiales ya agregadas.
            if (!cls || cls === 'col-acciones' || cls === 'col-estatus') continue;
            const el = elemsByClass[cls];
            if (el && !added.has(cls)) { resultOrder.push(el); added.add(cls); }
        }

        // Añadimos cualquier columna sobrante que no haya entrado en el bucle.
        originalChildren.forEach(el => {
            const cls = Array.from(el.classList).find(c => c.startsWith('col-'));
            if (cls && !added.has(cls)) { resultOrder.push(el); added.add(cls); }
        });

        // Sustituimos el contenido del header con el nuevo orden calculado.
        headerRow.innerHTML = '';
        resultOrder.forEach(el => headerRow.appendChild(el));

        // Reordenar también las celdas del cuerpo para que coincidan con el header.
        try {
            const bodyRows = document.querySelectorAll('.table-body .table-row');
            // Lista de clases col-* en el nuevo orden.
            const headerClasses = resultOrder
                .map(h => Array.from(h.classList).find(c => c && c.startsWith && c.startsWith('col-')))
                .filter(Boolean);

            bodyRows.forEach(row => {
                const cellsByClass = {};
                // Indexamos cada celda del body por su clase col-*.
                Array.from(row.children).forEach(cell => {
                    const cls = Array.from(cell.classList).find(c => c && c.startsWith && c.startsWith('col-'));
                    if (cls) cellsByClass[cls] = cell;
                });

                const hasClasses = Object.keys(cellsByClass).length > 0;
                if (hasClasses) {
                    // Limpiamos la fila y la volvemos a poblar en el nuevo orden.
                    row.innerHTML = '';
                    headerClasses.forEach(cls => {
                        // Si falta alguna clase en esta fila, se inserta un div vacío.
                        row.appendChild(cellsByClass[cls] || document.createElement('div'));
                    });
                    // Añadimos cualquier celda "extra" que no esté en headerClasses.
                    Object.keys(cellsByClass).forEach(cls => {
                        if (!headerClasses.includes(cls)) row.appendChild(cellsByClass[cls]);
                    });
                }
            });
        } catch (e) {
            console.warn('TableUtils.updateHeaderOrder: no se pudo reordenar filas del cuerpo', e);
        }
    };

    // Exponemos el objeto de utilidades en el scope global del navegador.
    window.TableUtils = TU;
})(window);