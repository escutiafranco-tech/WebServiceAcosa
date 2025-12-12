// custodias.js - Lógica SOLO para la lista de Custodias

// ⚡ SOLUCIÓN EXPRÉS - Ocultar loading inmediatamente
// Ocultar cualquier overlay de loading al cargar el script
(function() {
    const ids = ['loading','loadingCustodias'];
    ids.forEach(id=>{ const el = document.getElementById(id); if(el) el.style.display='none'; });
})();

class CustodiasManager {
    constructor() {
        this.custodias = [];
        this.currentPage = 1;
        this.itemsPerPage = 10;
        this.currentFilter = '';
        this.currentEstatusFilter = '';
        this.columnOrder = [0, 1, 2, 3, 4, 5, 6];
        this.columnWidths = [100, 200, 140, 110, 180, 130, 140];
        
        // ✅ OCULTAR LOADING AL INICIAR
        this.hideLoading();
        try {
            this.init();
        } catch (e) {
            console.error('Error inicializando CustodiasManager:', e);
            this.showNotification('Error inicializando módulo de Custodias', 'error');
        }
    }

    async init() {
        this.hideLoading();
        // Reducimos la inicialización para evitar fallos por dependencias faltantes
        this.setupEventListeners();
        this.updateStats();
        this.hideLoading();
    }

    // ================================
    // 🔥 REDIMENSIONAMIENTO DE COLUMNAS
    // ================================
    initColumnResize() {
        if (window.TableUtils && typeof TableUtils.makeResizable === 'function') {
            TableUtils.makeResizable('.header-row', this, { fixedClasses: ['col-acciones','col-estatus'] });
            return;
        }

        // Fallback: no TableUtils disponible, mantener comportamiento previo mínimo
        // (Si necesitas mantener la lógica completa sin TableUtils, podemos restaurarla aquí.)
    }

    // ================================
    // 🔥 REORDENAMIENTO DE COLUMNAS (DRAG & DROP)
    // ================================
    initColumnReorder() {
        if (window.TableUtils && typeof TableUtils.makeReorderable === 'function') {
            TableUtils.makeReorderable('.header-row', this, { fixedClasses: ['col-acciones','col-estatus'] });
            return;
        }

        // Fallback: sin TableUtils no se aplica reordenamiento centralizado.
    }

    reorderColumns(fromIndex, toIndex) {
        // Evitar reordenar si se intenta mover la primera o la segunda columna (acciones/estatus)
        if (fromIndex === 0 || toIndex === 0 || fromIndex === 1 || toIndex === 1) {
            this.showNotification('No se puede mover la columna Acciones/Estatus', 'info');
            return;
        }

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
        
        // Anchos mínimos por columna para evitar encabezados demasiado contraídos
        const minWidths = [60, 100, 240, 140, 110, 220, 120];
        // Construir array de anchos en el orden actual y aplicar al grid
        const colsCount = this.columnOrder.length;
        const widths = new Array(colsCount);
        const minW = 60;
        const maxW = 2000;
        for (let i = 0; i < colsCount; i++) {
            const actualIndex = this.columnOrder[i];
            const raw = Math.max(this.columnWidths[actualIndex] || 100, minWidths[actualIndex] || 100);
            const w = Math.max(minW, Math.min(maxW, Math.round(raw)));
            widths[i] = w;
            // Normalize stored widths to sane values
            if (!this.columnWidths) this.columnWidths = [];
            this.columnWidths[actualIndex] = w;
        }

        // Última columna flexible para ocupar restante
        const template = widths.map((w, idx) => idx === colsCount - 1 ? '1fr' : `${w}px`).join(' ');
        const table = document.querySelector('.custodias-table');
        if (table) table.style.setProperty('--table-cols', template);

        const headerRow = document.querySelector('.header-row');
        if (headerRow) {
            headerRow.style.gridTemplateColumns = template;
            headerRow.style.width = '100%';
        }

        bodyRows.forEach(row => {
            row.style.gridTemplateColumns = template;
            row.style.width = '100%';
            Array.from(row.children).forEach((cell, index) => {
                const width = widths[index] || 100;
                cell.style.minWidth = width + 'px';
                if (index === colsCount - 1) {
                    cell.style.maxWidth = '';
                    cell.style.width = '';
                } else {
                    cell.style.maxWidth = width + 'px';
                    cell.style.width = width + 'px';
                }
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
            // Añadir sorting por headers usando util común
            if (window.TableUtils) {
                const mapping = ['acciones','estatus','id','proveedor','fecha_servicio','tipo_movimiento','ubicacion_inicial'];
                // No reordenamos DOM; pasar mapping en el orden de cabecera (estático)
                window.TableUtils.addHeaderSorting('.header-row', this, mapping);
            }
        }, 100);
    }

    // Ordenamiento desactivado en listas sin tabla
    sortData(key, dir = 1) { return; }

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
        if (confirm(`¿Estás seguro de que deseas cancelar la custodia ${custodiaId}?`)) {
            this.custodias = this.custodias.filter(c => c.id !== custodiaId);
            this.saveCustodiasToFile().then(() => {
                this.renderCustodias();
                this.updateStats();
                this.showNotification('Custodia cancelada correctamente', 'success');
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
        const a = document.getElementById('enActivos');
        const i = document.getElementById('enInactivos');
            if(a) a.textContent = (this.custodias||[]).filter(x=>x.activo).length;
            if(i) i.textContent = (this.custodias||[]).filter(x=>!x.activo).length;
            const total = Array.isArray(this.custodias) ? this.custodias.length : 0;
            const mostrando = document.getElementById('mostrandoRegistros');
            const info = document.getElementById('infoPagina');
            const btnAnterior = document.getElementById('btnAnterior');
            const btnSiguiente = document.getElementById('btnSiguiente');
            const totalPages = Math.max(1, Math.ceil(total/ (this.itemsPerPage||10)));
            if(mostrando){
                const start = ((this.currentPage-1)*(this.itemsPerPage||10))+1;
                const end = Math.min(this.currentPage*(this.itemsPerPage||10), total);
                mostrando.textContent = total ? `Mostrando ${start}-${end} de ${total}` : 'Mostrando 0 de 0';
            }
            if(info) info.textContent = `Página ${Math.min(this.currentPage,totalPages)} de ${totalPages}`;
            if(btnAnterior) btnAnterior.disabled = this.currentPage<=1 || total===0;
            if(btnSiguiente) btnSiguiente.disabled = this.currentPage>=totalPages || total===0;
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
        const el = document.getElementById('loadingCustodias') || document.getElementById('loading');
        if (el) el.style.display = 'flex';
    }

    hideLoading() {
        const el = document.getElementById('loadingCustodias') || document.getElementById('loading');
        if (el) el.style.display = 'none';
    }

    exportToExcel() { this.showNotification('Función de exportación en desarrollo', 'info'); }

    // ================================
    // 🔥 FUNCIONES DEL MODAL
    // ================================

    openModal(custodiaData = null) {
        const modal = document.getElementById('modalCustodia');
        if (!modal) { alert('No se encontró el contenedor del formulario (modalCustodia)'); return; }
        const modalTitle = document.getElementById('modalTitleCustodia');
        if (!modalTitle) { console.warn('Título del modal no encontrado: modalTitleCustodia'); }
        
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
        try {
            modal.style.display = 'flex';
            document.body.style.overflow = 'hidden';
        } catch (e) {
            console.error('Error mostrando el modal:', e);
            alert('Ocurrió un error al abrir el formulario. Revisa la consola.');
        }
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
        const fechaServicioEl = document.getElementById('modalFechaServicio');
        fechaServicioEl.min = today;
        // Prellenar fecha/hora de servicio con valores por defecto para facilitar guardado
        fechaServicioEl.value = today;
        const horaEl = document.getElementById('modalHoraServicio');
        horaEl.value = hours + ':' + minutes;

        // Seleccionar el primer tipo de movimiento si existe
        const tipoEl = document.getElementById('modalTipoMovimiento');
        if (tipoEl && tipoEl.options && tipoEl.options.length > 0) {
            tipoEl.selectedIndex = 0;
        }
        
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
        // Soportar ambos formatos: snake_case (persistido) y camelCase (legacy)
        document.getElementById('modalIdCustodia').value = custodia.id || '';
        document.getElementById('modalFechaSolicitud').value = custodia.fecha_solicitud || custodia.fechaSolicitud || '';

        const proveedorSelect = document.getElementById('modalProveedor');
        if (custodia.proveedor) {
            if (typeof custodia.proveedor === 'object') {
                proveedorSelect.value = custodia.proveedor.id || '';
            } else {
                // si es texto, intentar seleccionar por texto (si existe)
                const opt = Array.from(proveedorSelect.options).find(o => o.text === custodia.proveedor || o.value === custodia.proveedor);
                proveedorSelect.value = opt ? opt.value : '';
            }
        } else {
            proveedorSelect.value = '';
        }

        document.getElementById('modalFechaServicio').value = custodia.fecha_servicio || custodia.fechaServicio || '';
        document.getElementById('modalHoraServicio').value = custodia.hora_servicio || custodia.horaServicio || '';
        document.getElementById('modalTipoMovimiento').value = custodia.tipo_movimiento || custodia.tipoMovimiento || '';

        // Ubicación inicial (soportar snake_case o camelCase)
        const ini = custodia.ubicacion_inicial || custodia.ubicacionInicial || {};
        document.getElementById('modalInicialCP').value = ini.cp || '';
        document.getElementById('modalInicialPais').value = ini.pais || '';
        document.getElementById('modalInicialEstado').value = ini.estado || '';
        document.getElementById('modalInicialMunicipio').value = ini.municipio || '';
        document.getElementById('modalInicialColonia').value = ini.colonia || '';
        document.getElementById('modalInicialCalle').value = ini.calle || '';

        // Ubicación destino
        const dest = custodia.ubicacion_destino || custodia.ubicacionDestino || {};
        document.getElementById('modalDestinoCP').value = dest.cp || '';
        document.getElementById('modalDestinoPais').value = dest.pais || '';
        document.getElementById('modalDestinoEstado').value = dest.estado || '';
        document.getElementById('modalDestinoMunicipio').value = dest.municipio || '';
        document.getElementById('modalDestinoColonia').value = dest.colonia || '';
        document.getElementById('modalDestinoCalle').value = dest.calle || '';

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
        const btnClose = document.getElementById('btnCloseModalCustodia') || document.getElementById('btnCloseModal');
        if (btnClose) btnClose.onclick = () => this.closeModal();
        
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

    async saveFromModal() {
        try {
            // Validar campos requeridos
            const form = document.getElementById('formCustodia');
            if (!form) throw new Error('Formulario no encontrado (id=formCustodia)');
            if (!form.checkValidity()) {
                // Mostrar la validación nativa y además notificar y enfocar el primer campo inválido
                form.reportValidity();
                const firstInvalid = form.querySelector(':invalid');
                if (firstInvalid && typeof firstInvalid.focus === 'function') firstInvalid.focus();
                this.showNotification('Completa los campos obligatorios marcados', 'error');
                return;
            }

        // Recopilar datos
        const proveedorSelect = document.getElementById('modalProveedor');
        const proveedorValue = proveedorSelect ? proveedorSelect.value : '';
        const proveedorText = proveedorSelect ? (proveedorSelect.options[proveedorSelect.selectedIndex]?.text || '') : '';

        // Construir objeto usando las claves que espera el render (snake_case)
        const custodiaData = {
            id: document.getElementById('modalIdCustodia').value,
            fecha_solicitud: document.getElementById('modalFechaSolicitud').value,
            proveedor: { id: proveedorValue, nombre: proveedorText },
            fecha_servicio: document.getElementById('modalFechaServicio').value,
            hora_servicio: document.getElementById('modalHoraServicio').value,
            tipo_movimiento: document.getElementById('modalTipoMovimiento').value,
            ubicacion_inicial: {
                cp: document.getElementById('modalInicialCP').value,
                pais: document.getElementById('modalInicialPais').value,
                estado: document.getElementById('modalInicialEstado').value,
                municipio: document.getElementById('modalInicialMunicipio').value,
                colonia: document.getElementById('modalInicialColonia').value,
                calle: document.getElementById('modalInicialCalle').value
            },
            ubicacion_destino: {
                cp: document.getElementById('modalDestinoCP').value,
                pais: document.getElementById('modalDestinoPais').value,
                estado: document.getElementById('modalDestinoEstado').value,
                municipio: document.getElementById('modalDestinoMunicipio').value,
                colonia: document.getElementById('modalDestinoColonia').value,
                calle: document.getElementById('modalDestinoCalle').value
            },
            observaciones: document.getElementById('modalObservaciones').value,
            estatus: 1
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

            // Guardar en localStorage (persistencia)
            await this.saveCustodiasToFile();

            // Actualizar vista
            this.renderCustodias();
            this.updateStats();

            // Cerrar modal
            this.closeModal();
        } catch (err) {
            console.error('Error guardando custodia:', err);
            this.showNotification('Error guardando la custodia: ' + (err.message || err), 'error');
        }
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
    const btnNuevo = document.getElementById('btnNuevo');
    const buscar = document.getElementById('buscar');
    const btnBuscar = document.getElementById('btnBuscar');
    if (btnNuevo) btnNuevo.addEventListener('click', (e) => { e.preventDefault(); window.custodiasManager.openModal(); });
    if (buscar) buscar.addEventListener('input', (e) => { /* listas sin render */ });
    if (btnBuscar) btnBuscar.addEventListener('click', () => { /* aplica filtro al clic; listas no renderizan */ });
    // Delegación como respaldo
    document.body.addEventListener('click', (e) => {
        const t = e.target.closest('#btnNuevo');
        if (t) { e.preventDefault(); window.custodiasManager.openModal(); }
    });
    // Fallback por si el botón se renderiza tarde
    setTimeout(() => {
        const lateBtn = document.getElementById('btnNuevo');
        if (lateBtn && !lateBtn._custodiaBound) {
            lateBtn.addEventListener('click', (e) => { e.preventDefault(); window.custodiasManager.openModal(); });
            lateBtn._custodiaBound = true;
        }
    }, 500);
});

// ✅ BACKUP - Forzar ocultar loading después de 3 segundos por si acaso
setTimeout(() => {
    const ids = ['loadingCustodias','loading'];
    ids.forEach(id=>{ const el = document.getElementById(id); if(el) el.style.display='none'; });
}, 3000);