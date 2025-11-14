// custodias.js - Lógica SOLO para la lista de Custodias

// ⚡ SOLUCIÓN EXPRÉS - Ocultar loading inmediatamente
(function() {
    const loading = document.getElementById('loading');
    if (loading) {
        loading.style.display = 'none';
    }
})();

class CustodiasManager {
    constructor() {
        this.custodias = [];
        this.currentPage = 1;
        this.itemsPerPage = 10;
        this.currentFilter = '';
        this.currentEstatusFilter = '';
        this.columnOrder = [0, 1, 2, 3, 4, 5, 6]; // 🔥 NUEVO: Orden de columnas
        this.columnWidths = [100, 200, 140, 110, 180, 130, 140]; // 🔥 NUEVO: Anchos de columnas
        
        // ✅ OCULTAR LOADING AL INICIAR
        this.hideLoading();
        this.init();
    }

    async init() {
        this.hideLoading();
        this.loadColumnPreferences(); // 🔥 CARGAR PREFERENCIAS
        await this.loadCustodias();
        this.setupEventListeners();
        this.renderCustodias();
        this.updateStats();
        this.initColumnResize(); // 🔥 Redimensionamiento
        this.initColumnReorder(); // 🔥 NUEVO: Reordenamiento
        this.hideLoading();
        console.log('✅ Lista de Custodias inicializada con redimensionamiento y reordenamiento');
    }

    // ================================
    // 🔥 REDIMENSIONAMIENTO DE COLUMNAS
    // ================================

    initColumnResize() {
        const headerCells = document.querySelectorAll('.header-row > div');
        let isResizing = false;
        let currentCell = null;
        let startX = 0;
        let startWidth = 0;
        let columnIndex = 0;

        headerCells.forEach((cell, index) => {
            cell.addEventListener('mousedown', (e) => {
                if (e.offsetX > cell.offsetWidth - 8) {
                    isResizing = true;
                    currentCell = cell;
                    startX = e.pageX;
                    startWidth = this.columnWidths[this.columnOrder[index]];
                    columnIndex = this.columnOrder[index];
                    
                    cell.classList.add('resizing');
                    e.preventDefault();
                }
            });
        });

        document.addEventListener('mousemove', (e) => {
            if (!isResizing || !currentCell) return;

            const newWidth = Math.max(60, Math.min(400, startWidth + (e.pageX - startX)));
            this.columnWidths[columnIndex] = newWidth;
            this.applyColumnSizes();
        });

        document.addEventListener('mouseup', () => {
            if (isResizing && currentCell) {
                currentCell.classList.remove('resizing');
                isResizing = false;
                currentCell = null;
                this.saveColumnPreferences();
            }
        });
    }

    // ================================
    // 🔥 REORDENAMIENTO DE COLUMNAS (DRAG & DROP)
    // ================================

    initColumnReorder() {
        const headerCells = document.querySelectorAll('.header-row > div');
        let dragSrcEl = null;
        let isDragging = false;

        headerCells.forEach((cell, index) => {
            // Hacer columnas arrastrables (excepto el handle de redimensionamiento)
            cell.setAttribute('draggable', 'true');
            
            cell.addEventListener('dragstart', (e) => {
                // Solo arrastrar si no es el área de redimensionamiento
                if (e.offsetX <= cell.offsetWidth - 10) {
                    dragSrcEl = cell;
                    isDragging = true;
                    cell.classList.add('dragging');
                    e.dataTransfer.effectAllowed = 'move';
                    e.dataTransfer.setData('text/plain', index.toString());
                    setTimeout(() => cell.style.opacity = '0.4', 0);
                } else {
                    e.preventDefault(); // Evitar arrastre en área de redimensionamiento
                }
            });

            cell.addEventListener('dragend', (e) => {
                isDragging = false;
                cell.classList.remove('dragging');
                cell.style.opacity = '1';
                document.querySelectorAll('.header-row > div').forEach(c => {
                    c.classList.remove('drop-zone');
                });
            });

            cell.addEventListener('dragover', (e) => {
                if (isDragging && dragSrcEl !== cell) {
                    e.preventDefault();
                    e.dataTransfer.dropEffect = 'move';
                    cell.classList.add('drop-zone');
                }
            });

            cell.addEventListener('dragenter', (e) => {
                if (isDragging && dragSrcEl !== cell) {
                    cell.classList.add('drop-zone');
                }
            });

            cell.addEventListener('dragleave', (e) => {
                cell.classList.remove('drop-zone');
            });

            cell.addEventListener('drop', (e) => {
                e.preventDefault();
                if (isDragging && dragSrcEl !== cell) {
                    const fromIndex = parseInt(e.dataTransfer.getData('text/plain'));
                    const toIndex = index;
                    
                    this.reorderColumns(fromIndex, toIndex);
                    cell.classList.remove('drop-zone');
                }
            });
        });
    }

    reorderColumns(fromIndex, toIndex) {
        // Reordenar el array de columnOrder
        const actualFromIndex = this.columnOrder[fromIndex];
        const actualToIndex = this.columnOrder[toIndex];
        
        // Intercambiar posiciones
        this.columnOrder[fromIndex] = actualToIndex;
        this.columnOrder[toIndex] = actualFromIndex;
        
        this.applyColumnOrder();
        this.saveColumnPreferences();
        this.showNotification('Columnas reordenadas', 'success');
    }

    applyColumnSizes() {
        const headerCells = document.querySelectorAll('.header-row > div');
        const bodyRows = document.querySelectorAll('.table-body .table-row');
        
        headerCells.forEach((cell, index) => {
            const actualIndex = this.columnOrder[index];
            const width = this.columnWidths[actualIndex];
            cell.style.minWidth = width + 'px';
            cell.style.maxWidth = width + 'px';
            cell.style.width = width + 'px';
        });

        bodyRows.forEach(row => {
            Array.from(row.children).forEach((cell, index) => {
                const actualIndex = this.columnOrder[index];
                const width = this.columnWidths[actualIndex];
                cell.style.minWidth = width + 'px';
                cell.style.maxWidth = width + 'px';
                cell.style.width = width + 'px';
            });
        });
    }

    applyColumnOrder() {
        // Re-renderizar la tabla con el nuevo orden
        this.renderCustodias();
        // Re-inicializar eventos
        setTimeout(() => {
            this.initColumnResize();
            this.initColumnReorder();
        }, 100);
    }

    saveColumnPreferences() {
        const preferences = {
            columnOrder: this.columnOrder,
            columnWidths: this.columnWidths,
            savedAt: new Date().toISOString()
        };
        localStorage.setItem('acosa_table_preferences', JSON.stringify(preferences));
    }

    loadColumnPreferences() {
        const saved = localStorage.getItem('acosa_table_preferences');
        if (saved) {
            const preferences = JSON.parse(saved);
            this.columnOrder = preferences.columnOrder || this.columnOrder;
            this.columnWidths = preferences.columnWidths || this.columnWidths;
        }
    }

    // ================================
    // CARGA DE DATOS
    // ================================

    async loadCustodias() {
        try {
            this.showLoading();
            
            // Simular un pequeño delay para ver el loading (opcional)
            await new Promise(resolve => setTimeout(resolve, 100));
            
            // Cargar desde localStorage
            const storedData = localStorage.getItem('acosa_custodias');
            if (storedData) {
                const data = JSON.parse(storedData);
                this.custodias = data.custodias || [];
                console.log('📂 Custodias cargadas:', this.custodias.length);
            } else {
                this.custodias = [];
                console.log('📂 No hay custodias registradas');
            }
            
        } catch (error) {
            console.error('Error cargando custodias:', error);
            this.custodias = [];
        } finally {
            // ✅ GARANTIZAR que se oculte el loading
            this.hideLoading();
        }
    }

    // ================================
    // CONFIGURACIÓN DE EVENTOS
    // ================================

    setupEventListeners() {
        this.setupNavigationEvents();
        this.setupListEvents();
    }

    setupNavigationEvents() {
        const btnVolverMenu = document.getElementById('btnVolverMenu');
        
        if (btnVolverMenu) {
            btnVolverMenu.addEventListener('click', () => {
                // ✅ Cerrar esta ventana (sistema SAP)
                window.close();
            });
        }
    }

    setupListEvents() {
        const btnNuevaCustodia = document.getElementById('btnNuevaCustodia');
        const btnRecargar = document.getElementById('btnRecargar');
        const buscarCustodias = document.getElementById('buscarCustodias');
        const filtroEstatus = document.getElementById('filtroEstatus');
        const btnExportar = document.getElementById('btnExportar');
        const btnAnterior = document.getElementById('btnAnterior');
        const btnSiguiente = document.getElementById('btnSiguiente');

        // ✅ Navegación al formulario
        if (btnNuevaCustodia) {
            btnNuevaCustodia.addEventListener('click', () => {
                console.log('🔄 Navegando a formulario de nueva custodia');
                window.location.href = 'custodias-form.html';
            });
        }

        // ✅ Recargar datos
        if (btnRecargar) {
            btnRecargar.addEventListener('click', () => {
                this.showLoading();
                this.loadCustodias().then(() => {
                    this.renderCustodias();
                    this.updateStats();
                    this.hideLoading(); // ✅ Ocultar después de recargar
                    this.showNotification('Datos actualizados', 'success');
                });
            });
        }

        // ✅ Búsqueda y filtros
        if (buscarCustodias) {
            buscarCustodias.addEventListener('input', (e) => {
                this.currentFilter = e.target.value.toLowerCase();
                this.currentPage = 1;
                this.renderCustodias();
            });
        }

        if (filtroEstatus) {
            filtroEstatus.addEventListener('change', (e) => {
                this.currentEstatusFilter = e.target.value;
                this.currentPage = 1;
                this.renderCustodias();
            });
        }

        // ✅ Exportación
        if (btnExportar) {
            btnExportar.addEventListener('click', () => {
                this.exportToExcel();
            });
        }

        // ✅ Paginación
        if (btnAnterior) {
            btnAnterior.addEventListener('click', () => {
                if (this.currentPage > 1) {
                    this.currentPage--;
                    this.renderCustodias();
                }
            });
        }

        if (btnSiguiente) {
            btnSiguiente.addEventListener('click', () => {
                const totalPages = Math.ceil(this.getFilteredCustodias().length / this.itemsPerPage);
                if (this.currentPage < totalPages) {
                    this.currentPage++;
                    this.renderCustodias();
                }
            });
        }
    }

    // ================================
    // LÓGICA DE LISTA
    // ================================

    getFilteredCustodias() {
        let filtered = this.custodias;

        // Filtrar por búsqueda
        if (this.currentFilter) {
            filtered = filtered.filter(custodia => 
                custodia.id.toLowerCase().includes(this.currentFilter) ||
                (custodia.proveedor && custodia.proveedor.nombre.toLowerCase().includes(this.currentFilter)) ||
                (custodia.tipo_movimiento && custodia.tipo_movimiento.toLowerCase().includes(this.currentFilter))
            );
        }

        // Filtrar por estatus
        if (this.currentEstatusFilter) {
            if (this.currentEstatusFilter === 'completado') {
                filtered = filtered.filter(custodia => custodia.estatus === 4);
            } else {
                filtered = filtered.filter(custodia => custodia.estatus == this.currentEstatusFilter);
            }
        }

        return filtered;
    }

    getPaginatedCustodias() {
        const filtered = this.getFilteredCustodias();
        const startIndex = (this.currentPage - 1) * this.itemsPerPage;
        const endIndex = startIndex + this.itemsPerPage;
        return filtered.slice(startIndex, endIndex);
    }

    renderCustodias() {
        const container = document.getElementById('listaCustodias');
        if (!container) return;

        const paginatedCustodias = this.getPaginatedCustodias();
        const filteredCustodias = this.getFilteredCustodias();

        if (paginatedCustodias.length === 0) {
            container.innerHTML = this.getEmptyState();
            this.updatePagination(0);
            return;
        }

        // 🔥 APLICAR TAMAÑOS DE COLUMNA ANTES DE RENDERIZAR
        this.applyColumnSizes();

        let html = '';
        paginatedCustodias.forEach(custodia => {
            html += this.getCustodiaRowHTML(custodia);
        });

        container.innerHTML = html;
        this.attachRowEvents();
        this.updatePagination(filteredCustodias.length);
    }

    getCustodiaRowHTML(custodia) {
        const estatusText = this.getEstatusText(custodia.estatus);
        const estatusClass = this.getEstatusClass(custodia.estatus);
        const proveedorNombre = custodia.proveedor ? custodia.proveedor.nombre : 'N/A';
        
        // 🔥 ORDENAR LAS COLUMNAS SEGÚN columnOrder
        const columns = [
            `<div class="col-id">${custodia.id}</div>`,
            `<div class="col-proveedor">${proveedorNombre}</div>`,
            `<div class="col-fecha">${this.formatDate(custodia.fecha_servicio)}<br><small>${custodia.hora_servicio}</small></div>`,
            `<div class="col-tipo">${this.formatTipoMovimiento(custodia.tipo_movimiento)}</div>`,
            `<div class="col-ubicacion"><small><strong>De:</strong> ${custodia.ubicacion_inicial.municipio}, ${custodia.ubicacion_inicial.estado}<br><strong>A:</strong> ${custodia.ubicacion_destino.municipio}, ${custodia.ubicacion_destino.estado}</small></div>`,
            `<div class="col-estatus"><span class="status-badge ${estatusClass}">${estatusText}</span></div>`,
            `<div class="col-acciones">
                <button class="btn btn-action view" data-action="view" title="Ver detalles">👁️ Ver</button>
                <button class="btn btn-action edit" data-action="edit" title="Editar">✏️ Editar</button>
                <button class="btn btn-action delete" data-action="delete" title="Eliminar">🗑️ Eliminar</button>
            </div>`
        ];

        // Aplicar el orden personalizado
        const orderedColumns = this.columnOrder.map(index => columns[index]);
        
        return `
            <div class="table-row" data-custodia-id="${custodia.id}">
                ${orderedColumns.join('')}
            </div>
        `;
    }

    getEmptyState() {
        return `
            <div class="empty-state">
                <div>📭 No hay custodias registradas</div>
                <p>Comienza creando tu primera custodia usando el botón "➕ Nueva Custodia"</p>
            </div>
        `;
    }

    attachRowEvents() {
        // Ver detalles
        document.querySelectorAll('[data-action="view"]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const custodiaId = e.target.closest('.table-row').dataset.custodiaId;
                this.viewCustodia(custodiaId);
            });
        });

        // Editar
        document.querySelectorAll('[data-action="edit"]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const custodiaId = e.target.closest('.table-row').dataset.custodiaId;
                this.editCustodia(custodiaId);
            });
        });

        // Eliminar
        document.querySelectorAll('[data-action="delete"]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const custodiaId = e.target.closest('.table-row').dataset.custodiaId;
                this.deleteCustodia(custodiaId);
            });
        });
    }

    // ================================
    // ACCIONES DE CUSTODIAS
    // ================================

    viewCustodia(custodiaId) {
        const custodia = this.custodias.find(c => c.id === custodiaId);
        if (custodia) {
            alert(`Detalles de ${custodia.id}\nProveedor: ${custodia.proveedor.nombre}\nEstatus: ${this.getEstatusText(custodia.estatus)}`);
        }
    }

    editCustodia(custodiaId) {
        // Redirigir al formulario con parámetro de edición
        window.location.href = `custodias-form.html?edit=${custodiaId}`;
    }

    deleteCustodia(custodiaId) {
        if (confirm(`¿Estás seguro de que deseas eliminar la custodia ${custodiaId}?`)) {
            this.custodias = this.custodias.filter(c => c.id !== custodiaId);
            this.saveCustodiasToFile().then(() => {
                this.renderCustodias();
                this.updateStats();
                this.showNotification('Custodia eliminada correctamente', 'success');
            });
        }
    }

    async saveCustodiasToFile() {
        const data = {
            custodias: this.custodias,
            metadata: {
                total_registros: this.custodias.length,
                ultima_actualizacion: new Date().toISOString()
            }
        };
        
        localStorage.setItem('acosa_custodias', JSON.stringify(data));
        return data;
    }

    // ================================
    // ESTADÍSTICAS Y PAGINACIÓN
    // ================================

    updateStats() {
        const enPendientes = document.getElementById('enPendientes');
        const enSolicitadas = document.getElementById('enSolicitadas');
        const enFacturacion = document.getElementById('enFacturacion');
        const enPago = document.getElementById('enPago');

        if (enPendientes) enPendientes.textContent = this.custodias.filter(c => c.estatus === 1).length;
        if (enSolicitadas) enSolicitadas.textContent = this.custodias.filter(c => c.estatus === 2).length;
        if (enFacturacion) enFacturacion.textContent = this.custodias.filter(c => c.estatus === 3).length;
        if (enPago) enPago.textContent = this.custodias.filter(c => c.estatus === 4).length;
    }

    updatePagination(totalItems) {
        const btnAnterior = document.getElementById('btnAnterior');
        const btnSiguiente = document.getElementById('btnSiguiente');
        const infoPagina = document.getElementById('infoPagina');
        const contadorRegistros = document.getElementById('mostrandoRegistros');

        const totalPages = Math.ceil(totalItems / this.itemsPerPage);

        if (btnAnterior) btnAnterior.disabled = this.currentPage === 1;
        if (btnSiguiente) btnSiguiente.disabled = this.currentPage === totalPages || totalPages === 0;
        
        if (infoPagina) {
            infoPagina.textContent = `Página ${this.currentPage} de ${totalPages || 1}`;
        }
        
        if (contadorRegistros) {
            const start = ((this.currentPage - 1) * this.itemsPerPage) + 1;
            const end = Math.min(this.currentPage * this.itemsPerPage, totalItems);
            contadorRegistros.textContent = `Mostrando ${start}-${end} de ${totalItems} registros`;
        }
    }

    // ================================
    // UTILIDADES
    // ================================

    getEstatusText(estatus) {
        const estatusMap = {
            1: 'Pendiente',
            2: 'Pendiente Custodia',
            3: 'Pendiente Factura',
            4: 'Pendiente Pago'
        };
        return estatusMap[estatus] || 'Desconocido';
    }

    getEstatusClass(estatus) {
        return estatus === 4 ? 'completado' : 'pendiente';
    }

    formatDate(dateString) {
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString('es-MX');
        } catch (e) {
            return 'Fecha inválida';
        }
    }

    formatTipoMovimiento(tipo) {
        const tipos = {
            'entrada': 'Entrada',
            'salida': 'Salida',
            'traslado': 'Traslado'
        };
        return tipos[tipo] || tipo;
    }

    // ================================
    // UI HELPERS
    // ================================

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 15px 20px;
            background: ${type === 'error' ? '#dc3545' : type === 'success' ? '#28a745' : '#17a2b8'};
            color: white;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            z-index: 10000;
            font-weight: 600;
        `;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 5000);
    }

    showLoading() {
        const loading = document.getElementById('loading');
        if (loading) {
            loading.style.display = 'flex';
        }
    }

    hideLoading() {
        const loading = document.getElementById('loading');
        if (loading) {
            loading.style.display = 'none';
        }
    }

    exportToExcel() {
        this.showNotification('Función de exportación en desarrollo', 'info');
    }
}

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    window.custodiasManager = new CustodiasManager();
});

// ✅ BACKUP - Forzar ocultar loading después de 3 segundos por si acaso
setTimeout(() => {
    const loading = document.getElementById('loading');
    if (loading) {
        loading.style.display = 'none';
        console.log('🛡️ Backup: Loading forzado a ocultarse');
    }
}, 3000);