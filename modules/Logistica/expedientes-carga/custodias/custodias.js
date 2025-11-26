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

        // ✅ Abrir modal de nueva custodia
        if (btnNuevaCustodia) {
            btnNuevaCustodia.addEventListener('click', () => {
                console.log('📝 Abriendo modal de nueva custodia');
                this.openModal();
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

    // ================================
    // 🔥 FUNCIONES DEL MODAL
    // ================================

    openModal(custodiaData = null) {
        const modal = document.getElementById('modalCustodia');
        const modalTitle = document.getElementById('modalTitle');
        
        // Configurar modo: crear o editar
        if (custodiaData) {
            modalTitle.textContent = 'Editar Custodia';
            this.fillModalForm(custodiaData);
        } else {
            modalTitle.textContent = 'SOLICITUD DE CUSTODIA';
            this.resetModalForm();
            this.generateNewId();
        }

        // Cargar proveedores
        this.loadProveedoresModal();

        // Configurar eventos del modal
        this.setupModalEvents();

        // Mostrar modal
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden'; // Bloquear scroll del body
    }

    closeModal() {
        const modal = document.getElementById('modalCustodia');
        modal.style.display = 'none';
        document.body.style.overflow = ''; // Restaurar scroll
    }

    resetModalForm() {
        document.getElementById('formCustodia').reset();
        
        // Establecer fecha actual con formato dd/mm/aaaa hh:mm
        const now = new Date();
        const day = now.getDate().toString().padStart(2, '0');
        const month = (now.getMonth() + 1).toString().padStart(2, '0');
        const year = now.getFullYear();
        const hours = now.getHours().toString().padStart(2, '0');
        const minutes = now.getMinutes().toString().padStart(2, '0');
        
        document.getElementById('modalFechaSolicitud').value = `${day}/${month}/${year} ${hours}:${minutes}`;
        
        // Fecha mínima para servicio
        const today = now.toISOString().split('T')[0];
        document.getElementById('modalFechaServicio').min = today;
        
        // Valores por defecto
        document.getElementById('modalInicialPais').value = 'México';
        document.getElementById('modalDestinoPais').value = 'México';
        
        // Reset contador
        document.getElementById('modalCharCount').textContent = '0';
        
        // Expandir todas las secciones
        document.querySelectorAll('.section-header-collapse').forEach(header => {
            header.classList.remove('collapsed');
        });
    }

    generateNewId() {
        const now = new Date();
        const year = now.getFullYear();
        const nextId = this.custodias.length + 1;
        document.getElementById('modalIdCustodia').value = `CUST-${year}-${nextId.toString().padStart(4, '0')}`;
    }

    fillModalForm(custodia) {
        document.getElementById('modalIdCustodia').value = custodia.id;
        document.getElementById('modalFechaSolicitud').value = custodia.fechaSolicitud;
        document.getElementById('modalProveedor').value = custodia.proveedor;
        document.getElementById('modalFechaServicio').value = custodia.fechaServicio;
        document.getElementById('modalHoraServicio').value = custodia.horaServicio;
        document.getElementById('modalTipoMovimiento').value = custodia.tipoMovimiento;
        
        // Ubicación inicial
        document.getElementById('modalInicialCP').value = custodia.ubicacionInicial.cp;
        document.getElementById('modalInicialPais').value = custodia.ubicacionInicial.pais;
        document.getElementById('modalInicialEstado').value = custodia.ubicacionInicial.estado;
        document.getElementById('modalInicialMunicipio').value = custodia.ubicacionInicial.municipio;
        document.getElementById('modalInicialColonia').value = custodia.ubicacionInicial.colonia;
        document.getElementById('modalInicialCalle').value = custodia.ubicacionInicial.calle;
        
        // Ubicación destino
        document.getElementById('modalDestinoCP').value = custodia.ubicacionDestino.cp;
        document.getElementById('modalDestinoPais').value = custodia.ubicacionDestino.pais;
        document.getElementById('modalDestinoEstado').value = custodia.ubicacionDestino.estado;
        document.getElementById('modalDestinoMunicipio').value = custodia.ubicacionDestino.municipio;
        document.getElementById('modalDestinoColonia').value = custodia.ubicacionDestino.colonia;
        document.getElementById('modalDestinoCalle').value = custodia.ubicacionDestino.calle;
        
        // Observaciones
        document.getElementById('modalObservaciones').value = custodia.observaciones || '';
        document.getElementById('modalCharCount').textContent = (custodia.observaciones || '').length;
    }

    async loadProveedoresModal() {
        try {
            const response = await fetch('/data/catalogos/proveedores.json');
            const data = await response.json();
            const select = document.getElementById('modalProveedor');
            
            // Limpiar opciones excepto la primera
            while (select.options.length > 1) {
                select.remove(1);
            }
            
            // Agregar proveedores
            data.proveedores.forEach(proveedor => {
                const option = document.createElement('option');
                option.value = proveedor.id;
                option.textContent = `${proveedor.nombre} - ${proveedor.rfc}`;
                select.appendChild(option);
            });
        } catch (error) {
            console.error('Error cargando proveedores:', error);
        }
    }

    setupModalEvents() {
        // Cerrar modal con X
        document.getElementById('btnCloseModal').onclick = () => this.closeModal();
        
        // Guardar custodia
        document.getElementById('btnGuardarModal').onclick = () => this.saveFromModal();
        
        // Imprimir
        document.getElementById('btnImprimirCustodia').onclick = () => this.printCustodia();
        
        // Contador de caracteres
        document.getElementById('modalObservaciones').oninput = (e) => {
            document.getElementById('modalCharCount').textContent = e.target.value.length;
        };
        
        // Tabs
        document.querySelectorAll('.tab-button').forEach(btn => {
            btn.onclick = () => this.switchTab(btn.dataset.tab);
        });
        
        // Secciones colapsables
        document.querySelectorAll('.section-header-collapse').forEach(header => {
            header.onclick = () => this.toggleSection(header);
        });
        
        // Cerrar con ESC
        document.onkeydown = (e) => {
            if (e.key === 'Escape' && document.getElementById('modalCustodia').style.display === 'flex') {
                this.closeModal();
            }
        };
    }

    switchTab(tabName) {
        // Ocultar todos los tabs
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
        });
        document.querySelectorAll('.tab-button').forEach(btn => {
            btn.classList.remove('active');
        });
        
        // Mostrar tab seleccionado
        document.getElementById(`tab${tabName.charAt(0).toUpperCase() + tabName.slice(1)}`).classList.add('active');
        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
    }

    toggleSection(header) {
        header.classList.toggle('collapsed');
    }

    saveFromModal() {
        // Validar campos requeridos
        const form = document.getElementById('formCustodia');
        if (!form.checkValidity()) {
            form.reportValidity();
            return;
        }

        // Recopilar datos
        const custodiaData = {
            id: document.getElementById('modalIdCustodia').value,
            fechaSolicitud: document.getElementById('modalFechaSolicitud').value,
            proveedor: document.getElementById('modalProveedor').value,
            fechaServicio: document.getElementById('modalFechaServicio').value,
            horaServicio: document.getElementById('modalHoraServicio').value,
            tipoMovimiento: document.getElementById('modalTipoMovimiento').value,
            ubicacionInicial: {
                cp: document.getElementById('modalInicialCP').value,
                pais: document.getElementById('modalInicialPais').value,
                estado: document.getElementById('modalInicialEstado').value,
                municipio: document.getElementById('modalInicialMunicipio').value,
                colonia: document.getElementById('modalInicialColonia').value,
                calle: document.getElementById('modalInicialCalle').value
            },
            ubicacionDestino: {
                cp: document.getElementById('modalDestinoCP').value,
                pais: document.getElementById('modalDestinoPais').value,
                estado: document.getElementById('modalDestinoEstado').value,
                municipio: document.getElementById('modalDestinoMunicipio').value,
                colonia: document.getElementById('modalDestinoColonia').value,
                calle: document.getElementById('modalDestinoCalle').value
            },
            observaciones: document.getElementById('modalObservaciones').value,
            estatus: 'pendiente'
        };

        // Buscar si existe (editar) o crear nueva
        const existingIndex = this.custodias.findIndex(c => c.id === custodiaData.id);
        
        if (existingIndex >= 0) {
            // Actualizar existente
            this.custodias[existingIndex] = custodiaData;
            this.showNotification('✅ Custodia actualizada correctamente', 'success');
        } else {
            // Agregar nueva
            this.custodias.push(custodiaData);
            this.showNotification('✅ Custodia creada correctamente', 'success');
        }

        // Guardar en localStorage
        this.saveCustodias();

        // Actualizar vista
        this.renderCustodias();
        this.updateStats();

        // Cerrar modal
        this.closeModal();
    }

    printCustodia() {
        // Obtener datos del formulario
        const custodiaData = {
            id: document.getElementById('modalIdCustodia').value,
            fechaSolicitud: document.getElementById('modalFechaSolicitud').value,
            proveedor: document.getElementById('modalProveedor').options[document.getElementById('modalProveedor').selectedIndex]?.text || '',
            fechaServicio: document.getElementById('modalFechaServicio').value,
            horaServicio: document.getElementById('modalHoraServicio').value,
            tipoMovimiento: document.getElementById('modalTipoMovimiento').value,
            ubicacionInicial: {
                cp: document.getElementById('modalInicialCP').value,
                pais: document.getElementById('modalInicialPais').value,
                estado: document.getElementById('modalInicialEstado').value,
                municipio: document.getElementById('modalInicialMunicipio').value,
                colonia: document.getElementById('modalInicialColonia').value,
                calle: document.getElementById('modalInicialCalle').value
            },
            ubicacionDestino: {
                cp: document.getElementById('modalDestinoCP').value,
                pais: document.getElementById('modalDestinoPais').value,
                estado: document.getElementById('modalDestinoEstado').value,
                municipio: document.getElementById('modalDestinoMunicipio').value,
                colonia: document.getElementById('modalDestinoColonia').value,
                calle: document.getElementById('modalDestinoCalle').value
            },
            observaciones: document.getElementById('modalObservaciones').value
        };

        // Crear ventana de impresión
        const printWindow = window.open('', '_blank', 'width=800,height=600');
        
        printWindow.document.write(`
            <!DOCTYPE html>
            <html lang="es">
            <head>
                <meta charset="UTF-8">
                <title>Custodia ${custodiaData.id}</title>
                <style>
                    body {
                        font-family: Arial, sans-serif;
                        padding: 20px;
                        margin: 0;
                    }
                    .print-header {
                        text-align: center;
                        border-bottom: 2px solid #2F3158;
                        padding-bottom: 10px;
                        margin-bottom: 20px;
                    }
                    .print-header h1 {
                        margin: 0;
                        color: #2F3158;
                        font-size: 24px;
                    }
                    .print-header p {
                        margin: 5px 0 0 0;
                        color: #666;
                    }
                    .section {
                        margin-bottom: 20px;
                    }
                    .section-title {
                        background: #2F3158;
                        color: white;
                        padding: 8px 12px;
                        font-weight: bold;
                        font-size: 14px;
                        margin-bottom: 10px;
                    }
                    table {
                        width: 100%;
                        border-collapse: collapse;
                        margin-bottom: 10px;
                    }
                    td {
                        padding: 8px;
                        border: 1px solid #ddd;
                    }
                    td.label {
                        width: 30%;
                        background: #f5f5f5;
                        font-weight: bold;
                    }
                    .ubicaciones {
                        display: flex;
                        gap: 20px;
                    }
                    .ubicacion-box {
                        flex: 1;
                    }
                    .print-actions {
                        position: fixed;
                        top: 10px;
                        right: 10px;
                        background: white;
                        padding: 10px;
                        border: 2px solid #2F3158;
                        border-radius: 4px;
                        box-shadow: 0 2px 8px rgba(0,0,0,0.2);
                    }
                    .print-actions button {
                        padding: 8px 16px;
                        margin: 4px;
                        cursor: pointer;
                        border: 1px solid #2F3158;
                        background: #2F3158;
                        color: white;
                        border-radius: 4px;
                        font-size: 14px;
                    }
                    .print-actions button:hover {
                        background: #1a1c3a;
                    }
                    @media print {
                        .print-actions {
                            display: none;
                        }
                    }
                </style>
            </head>
            <body>
                <div class="print-actions">
                    <button onclick="window.print()">🖨️ Imprimir</button>
                    <button onclick="generatePDF()">📄 Generar PDF</button>
                    <button onclick="sendEmail()">📧 Enviar por Correo</button>
                    <button onclick="window.close()">✕ Cerrar</button>
                </div>

                <div class="print-header">
                    <h1>SOLICITUD DE CUSTODIA</h1>
                    <p>ACOSA S.A. DE C.V. - Sistema de Gestión Logística</p>
                </div>

                <div class="section">
                    <div class="section-title">INFORMACIÓN GENERAL</div>
                    <table>
                        <tr>
                            <td class="label">ID Custodia:</td>
                            <td>${custodiaData.id}</td>
                            <td class="label">Fecha de Solicitud:</td>
                            <td>${custodiaData.fechaSolicitud}</td>
                        </tr>
                        <tr>
                            <td class="label">Proveedor:</td>
                            <td colspan="3">${custodiaData.proveedor}</td>
                        </tr>
                        <tr>
                            <td class="label">Fecha de Servicio:</td>
                            <td>${custodiaData.fechaServicio}</td>
                            <td class="label">Hora de Servicio:</td>
                            <td>${custodiaData.horaServicio}</td>
                        </tr>
                        <tr>
                            <td class="label">Tipo de Movimiento:</td>
                            <td colspan="3">${custodiaData.tipoMovimiento}</td>
                        </tr>
                    </table>
                </div>

                <div class="section">
                    <div class="section-title">UBICACIONES</div>
                    <div class="ubicaciones">
                        <div class="ubicacion-box">
                            <h4>🏁 Ubicación Inicial</h4>
                            <table>
                                <tr>
                                    <td class="label">País:</td>
                                    <td>${custodiaData.ubicacionInicial.pais}</td>
                                </tr>
                                <tr>
                                    <td class="label">Código Postal:</td>
                                    <td>${custodiaData.ubicacionInicial.cp}</td>
                                </tr>
                                <tr>
                                    <td class="label">Estado:</td>
                                    <td>${custodiaData.ubicacionInicial.estado}</td>
                                </tr>
                                <tr>
                                    <td class="label">Municipio:</td>
                                    <td>${custodiaData.ubicacionInicial.municipio}</td>
                                </tr>
                                <tr>
                                    <td class="label">Colonia:</td>
                                    <td>${custodiaData.ubicacionInicial.colonia}</td>
                                </tr>
                                <tr>
                                    <td class="label">Calle y Número:</td>
                                    <td>${custodiaData.ubicacionInicial.calle}</td>
                                </tr>
                            </table>
                        </div>

                        <div class="ubicacion-box">
                            <h4>🎯 Ubicación Destino</h4>
                            <table>
                                <tr>
                                    <td class="label">País:</td>
                                    <td>${custodiaData.ubicacionDestino.pais}</td>
                                </tr>
                                <tr>
                                    <td class="label">Código Postal:</td>
                                    <td>${custodiaData.ubicacionDestino.cp}</td>
                                </tr>
                                <tr>
                                    <td class="label">Estado:</td>
                                    <td>${custodiaData.ubicacionDestino.estado}</td>
                                </tr>
                                <tr>
                                    <td class="label">Municipio:</td>
                                    <td>${custodiaData.ubicacionDestino.municipio}</td>
                                </tr>
                                <tr>
                                    <td class="label">Colonia:</td>
                                    <td>${custodiaData.ubicacionDestino.colonia}</td>
                                </tr>
                                <tr>
                                    <td class="label">Calle y Número:</td>
                                    <td>${custodiaData.ubicacionDestino.calle}</td>
                                </tr>
                            </table>
                        </div>
                    </div>
                </div>

                <div class="section">
                    <div class="section-title">OBSERVACIONES</div>
                    <table>
                        <tr>
                            <td>${custodiaData.observaciones || 'Sin observaciones'}</td>
                        </tr>
                    </table>
                </div>

                <script>
                    function generatePDF() {
                        alert('📄 Funcionalidad de generar PDF en desarrollo.\\nSe integrará con una librería de generación de PDF.');
                    }

                    function sendEmail() {
                        alert('📧 Funcionalidad de envío por correo en desarrollo.\\nSe integrará con el backend para enviar emails.');
                    }
                </script>
            </body>
            </html>
        `);
        
        printWindow.document.close();
    }

    sendEmail() {
        this.showNotification('📧 Función de envío de correo en desarrollo', 'info');
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