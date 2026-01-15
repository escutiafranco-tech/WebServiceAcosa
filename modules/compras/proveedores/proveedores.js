/*
    Módulo: proveedores.js
    Propósito: conectar la UI de Proveedores (botón "+", modal de sucursal y lista)
    Cómo funciona: escuchamos eventos, abrimos/cerramos el modal y pintamos la sucursal en la lista.
*/
(function () {
    const qs = (id) => document.getElementById(id);
    const LS_KEY = 'proveedores_sucursales';

    function openModalSucursal() {
        const overlay = qs('modalSucursal');
        if (overlay) overlay.style.display = 'flex';
    }

    function closeModalSucursal() {
        const overlay = qs('modalSucursal');
        if (overlay) overlay.style.display = 'none';
    }

    function getFormData() {
        return {
            id: crypto && crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
            tipo: qs('modalSucursalTipo')?.value || '',
            nombre: qs('modalSucursalNombre')?.value || '',
            pais: qs('modalSucursalPais')?.value || '',
            estado: qs('modalSucursalEstado')?.value || '',
            municipio: qs('modalSucursalMunicipio')?.value || '',
            localidad: qs('modalSucursalLocalidad')?.value || '',
            calle: qs('modalSucursalCalle')?.value || '',
            colonia: qs('modalSucursalColonia')?.value || '',
            cp: qs('modalSucursalCP')?.value || '',
            noExterior: qs('modalSucursalNoExterior')?.value || '',
            noInterior: qs('modalSucursalNoInterior')?.value || '',
            codigoColonia: qs('modalSucursalCodigoColonia')?.value || '',
            codigoLocalidad: qs('modalSucursalCodigoLocalidad')?.value || ''
        };
    }

    function setFormData(data) {
        if (!data) return;
        if (qs('modalSucursalTipo')) qs('modalSucursalTipo').value = data.tipo || '';
        if (qs('modalSucursalNombre')) qs('modalSucursalNombre').value = data.nombre || '';
        if (qs('modalSucursalPais')) qs('modalSucursalPais').value = data.pais || '';
        if (qs('modalSucursalEstado')) qs('modalSucursalEstado').value = data.estado || '';
        if (qs('modalSucursalMunicipio')) qs('modalSucursalMunicipio').value = data.municipio || '';
        if (qs('modalSucursalLocalidad')) qs('modalSucursalLocalidad').value = data.localidad || '';
        if (qs('modalSucursalCalle')) qs('modalSucursalCalle').value = data.calle || '';
        if (qs('modalSucursalColonia')) qs('modalSucursalColonia').value = data.colonia || '';
        if (qs('modalSucursalCP')) qs('modalSucursalCP').value = data.cp || '';
        if (qs('modalSucursalNoExterior')) qs('modalSucursalNoExterior').value = data.noExterior || '';
        if (qs('modalSucursalNoInterior')) qs('modalSucursalNoInterior').value = data.noInterior || '';
        if (qs('modalSucursalCodigoColonia')) qs('modalSucursalCodigoColonia').value = data.codigoColonia || '';
        if (qs('modalSucursalCodigoLocalidad')) qs('modalSucursalCodigoLocalidad').value = data.codigoLocalidad || '';
    }

    function loadSucursales() {
        try {
            const raw = localStorage.getItem(LS_KEY);
            return raw ? JSON.parse(raw) : [];
        } catch (e) {
            return [];
        }
    }

    function saveSucursales(list) {
        try {
            localStorage.setItem(LS_KEY, JSON.stringify(list || []));
        } catch (e) {
            /* noop */
        }
    }

    function renderSucursales() {
        const lista = qs('listaSucursales');
        if (!lista) return;
        lista.innerHTML = '';
        const data = loadSucursales();
        data.forEach((suc) => {
            const item = document.createElement('div');
            item.className = 'sucursal-item';
            item.dataset.id = suc.id;

            const info = document.createElement('span');
            info.className = 'sucursal-info';
            info.textContent = `${suc.tipo ? suc.tipo.toUpperCase() : 'Sucursal'} - ${suc.nombre}`;

            const actions = document.createElement('div');
            actions.className = 'sucursal-actions';

            const btnVer = document.createElement('button');
            btnVer.id = 'Ico_Visaulaiazar';
            btnVer.title = 'Visualizar';
            btnVer.textContent = '👁️';

            const btnEditar = document.createElement('button');
            btnEditar.id = 'Ico_Editar';
            btnEditar.title = 'Editar';
            btnEditar.textContent = '✏️';

            actions.appendChild(btnVer);
            actions.appendChild(btnEditar);

            item.appendChild(info);
            item.appendChild(actions);
            lista.appendChild(item);
        });
    }

    function setupSucursalEvents() {
        const btnAgregar = qs('btnAgregarSucursal');
        const btnClose = qs('btnCloseModalSucursal');
        const btnCancelar = qs('btnCancelarSucursal');
        const btnGuardar = qs('btnGuardarSucursal');

        if (btnAgregar) {
            btnAgregar.addEventListener('click', (e) => {
                e.preventDefault();
                // Limpiar formulario para alta
                setFormData({});
                // Marcar que no hay edición activa
                qs('modalSucursal').dataset.editingId = '';
                openModalSucursal();
            });
        }

        if (btnClose) btnClose.addEventListener('click', closeModalSucursal);
        if (btnCancelar) btnCancelar.addEventListener('click', (e) => {
            e.preventDefault();
            closeModalSucursal();
        });

        if (btnGuardar) {
            btnGuardar.addEventListener('click', (e) => {
                e.preventDefault();
                const list = loadSucursales();
                const editingId = qs('modalSucursal').dataset.editingId || '';
                if (editingId) {
                    // Actualizar existente
                    const idx = list.findIndex((x) => x.id === editingId);
                    if (idx >= 0) {
                        const current = list[idx];
                        const updated = { ...current, ...getFormData(), id: editingId };
                        list[idx] = updated;
                    }
                } else {
                    // Alta nueva
                    const data = getFormData();
                    list.push(data);
                }
                saveSucursales(list);
                renderSucursales();
                closeModalSucursal();
            });
        }

        // Delegación de eventos para Visualizar/Editar
        const lista = qs('listaSucursales');
        if (lista) {
            lista.addEventListener('click', (e) => {
                const target = e.target;
                const item = target && target.closest('.sucursal-item');
                if (!item) return;
                const id = item.dataset.id;
                const list = loadSucursales();
                const suc = list.find((x) => x.id === id);
                if (!suc) return;

                if (target.id === 'Ico_Visaulaiazar') {
                    // Solo visualizar: llenar formulario y abrir en modo lectura
                    setFormData(suc);
                    qs('modalSucursal').dataset.editingId = '';
                    openModalSucursal();
                }

                if (target.id === 'Ico_Editar') {
                    // Editar: llenar formulario, marcar edición y abrir
                    setFormData(suc);
                    qs('modalSucursal').dataset.editingId = id;
                    openModalSucursal();
                }
            });
        }
    }

    document.addEventListener('DOMContentLoaded', () => {
        renderSucursales();
        setupSucursalEvents();
    });
})();
// ProveedoresManager - Paridad funcional con Custodias
class ProveedoresManager { // Clase principal que gestiona proveedores
    constructor() { // Constructor: inicializa estado y arranca
        this.proveedores = []; // Lista de proveedores en memoria
        this.contactos = []; // Lista de contactos en memoria
        this.currentPage = 1; // Página actual para paginación
        this.itemsPerPage = 10; // Registros por página
        this.currentFilter = ''; // Texto de filtro de búsqueda
        this.sortColumn = null; // Columna por defecto para ordenar (null = sin orden)
        this.sortDirection = 'asc'; // Dirección de orden: 'asc' o 'desc'
        // Eliminado: configuración de columnas/tabla
        this.storageKey = 'acosa_proveedores'; // Clave de localStorage

        this.hideLoading(); // Oculta spinner de carga
        this.init(); // Ejecuta flujo de inicialización
    }

    hideLoading(){ const l = document.getElementById('loading'); if(l) l.style.display='none'; } // Oculta indicador de carga
    showLoading(){ const l = document.getElementById('loading'); if(l) l.style.display='flex'; } // Muestra indicador de carga

    async init(){ // Carga preferencias, datos y configura UI
        await this.loadProveedores(); // Carga datos desde API
        this.setupEventListeners(); // Enlaza eventos de UI
        // No render de datos: solo estructura
        this.updateStats(); // Actualiza contadores de estado
        this.updateBottomBar(); // Actualiza barra inferior y renderiza lista
        this.renderContactos(); // Renderiza contactos
    }

    async loadProveedores(){ // Carga proveedores desde API
        this.showLoading(); // Muestra loading
        try{
            console.log('Cargando proveedores desde API...');
            const res = await fetch('/api/proveedores'); // Solicita API
            console.log('Respuesta fetch:', res.status);
            if(res.ok){ 
                const data = await res.json(); 
                console.log('Datos recibidos:', data.length);
                this.proveedores = data || []; 
            } // Asigna
            else { 
                console.error('Error en fetch:', res.statusText);
                this.proveedores = []; 
            } // Si falla, lista vacía
            // Normalizar registros: asegurar ID y campos básicos
            this.normalizeProveedores(); // Limpia y completa campos
        }catch(e){ 
            console.error('Error cargando proveedores:', e); 
            this.proveedores = []; 
        } // Manejo de error
        finally{ this.hideLoading(); }
        console.log('Proveedores cargados:', this.proveedores.length); // Oculta loading
    }

    saveToStorage(){ const data = { proveedores: this.proveedores, contactos: this.contactos, metadata:{ total_registros: this.proveedores.length, ultima_actualizacion: new Date().toISOString() } }; localStorage.setItem(this.storageKey, JSON.stringify(data)); } // Persiste datos

    setupEventListeners(){ // Configura listeners de UI mínimos
        const btnNuevo = document.getElementById('btnNuevo'); // Botón nuevo unificado
        const btnRecargar = document.getElementById('btnRecargar'); // Botón recargar
        const buscar = document.getElementById('buscar'); // Input búsqueda unificado
        const btnBuscar = document.getElementById('btnBuscar'); // Botón buscar unificado

        if(btnNuevo) btnNuevo.addEventListener('click', ()=> this.openModal()); // Abre modal nuevo
        if(btnRecargar) btnRecargar.addEventListener('click', async ()=>{ localStorage.removeItem(this.storageKey); await this.loadProveedores(); this.updateStats(); this.updateBottomBar(); }); // Recarga datos
        if(buscar) buscar.addEventListener('input', (e)=>{ this.currentFilter = e.target.value.toLowerCase(); this.currentPage = 1; this.updateBottomBar(); }); // Actualiza filtro
        if(btnBuscar) btnBuscar.addEventListener('click', ()=>{ const q = (buscar?.value||'').toLowerCase(); this.currentFilter = q; this.currentPage = 1; this.updateBottomBar(); }); // Aplica filtro al clic

        const btnAnterior = document.getElementById('btnAnterior');
        const btnSiguiente = document.getElementById('btnSiguiente');
        if(btnAnterior) btnAnterior.addEventListener('click', ()=>{ if(this.currentPage>1){ this.currentPage--; this.updateBottomBar(); } });
        if(btnSiguiente) btnSiguiente.addEventListener('click', ()=>{ const totalPages = Math.max(1, Math.ceil(this.getFilteredProveedores().length/this.itemsPerPage)); if(this.currentPage<totalPages){ this.currentPage++; this.updateBottomBar(); } });

        // Eventos para contactos
        const btnAgregarContacto = document.getElementById('btnAgregarContacto');
        if(btnAgregarContacto) {
            console.log('Añadiendo event listener a btnAgregarContacto');
            btnAgregarContacto.addEventListener('click', (e) => {
                e.preventDefault();
                console.log('Botón agregar contacto clickeado');
                this.openModalContacto();
            });
        } else {
            console.log('btnAgregarContacto no encontrado');
        }
    }

    getFilteredProveedores(){ // Devuelve lista filtrada por texto
        let filtered = this.proveedores; // Base
        if(this.currentFilter){ filtered = filtered.filter(p=> (p.nombre||'').toLowerCase().includes(this.currentFilter) || (p.codigo||'').toLowerCase().includes(this.currentFilter) || (p.rfc||'').toLowerCase().includes(this.currentFilter)); } // Aplica condiciones
        return filtered; // Resultado
    }

    renderList(){ // Renderiza proveedores en tabla
        console.log('Renderizando lista, proveedores:', this.proveedores.length);
        const container = document.getElementById('listaProveedores');
        if (!container) { console.error('No se encontró listaProveedores'); return; }
        const tbody = container.querySelector('tbody');
        if (!tbody) { console.error('No se encontró tbody'); return; }
        tbody.innerHTML = '';
        const filtered = this.getFilteredProveedores();
        console.log('Proveedores filtrados:', filtered.length);
        const start = (this.currentPage - 1) * this.itemsPerPage;
        const end = start + this.itemsPerPage;
        const pageItems = filtered.slice(start, end);
        console.log('Items en página:', pageItems.length);
        pageItems.forEach(p => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>
                    <button onclick="window.ProveedoresManager.viewProveedor('${p.id}')" title="Ver">👁</button>
                    <button onclick="window.ProveedoresManager.openModal('${p.id}')" title="Editar">✏</button>
                    <button onclick="window.ProveedoresManager.deleteProveedor('${p.id}')" title="Eliminar">🗑</button>
                </td>
                <td>${this.escape(p.codigo)}</td>
                <td>${this.escape(p.nombre)}</td>
                <td>${this.escape(p.rfc)}</td>
                <td>${this.escape(typeof p.direccion === 'object' ? (p.direccion.calle || '') + ', ' + (p.direccion.colonia || '') + ', ' + (p.direccion.municipio || '') : p.direccion)}</td>
                <td>${p.activo ? 'Activo' : 'Inactivo'}</td>
            `;
            tbody.appendChild(tr);
        });
    }

    escape(s){ return (s||'').toString().replace(/[&<>\"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":"&#39;"})[c]); } // Escapa HTML básico

    // Eliminado: eventos ligados a filas de tabla

    viewProveedor(id){ const p = this.proveedores.find(x=>x.id===id); if(p) alert(`Proveedor: ${p.nombre}\nRFC: ${p.rfc}`); } // Muestra datos básicos

    openModal(id=null){ // Abre modal para crear/editar
        const modal = document.getElementById('modalProveedor'); const title = document.getElementById('modalTitleProveedor'); // Referencias modal
        if(id){ title.textContent='Editar Proveedor'; const p = this.proveedores.find(x=>x.id===id); if(p) this.fillModalForm(p); } // Editar
        else { title.textContent='Alta de Proveedor'; this.resetModalForm(); this.generateNewId(); } // Nuevo
        document.getElementById('modalProveedor').style.display='flex'; document.body.style.overflow='hidden'; this.setupModalEvents(); // Muestra modal y bloquea scroll
    }

    closeModal(){ document.getElementById('modalProveedor').style.display='none'; document.body.style.overflow=''; } // Cierra modal y restaura scroll

    resetModalForm(){ const f = document.getElementById('formProveedor'); if(f) f.reset(); document.getElementById('modalFechaRegistro').value = new Date().toLocaleString(); 
        // Expandir todas las secciones
        document.querySelectorAll('.section-header-collapse').forEach(header => {
            header.classList.remove('collapsed');
        });
    } // Limpia formulario

    generateNewId(){ const id = 'PROV-' + (this.proveedores.length+1).toString().padStart(4,'0'); document.getElementById('modalIdProveedor').value = id; } // Genera ID siguiente

    fillModalForm(p){ document.getElementById('modalIdProveedor').value = p.id; document.getElementById('modalCodigo').value = p.codigo||''; document.getElementById('modalNombre').value = p.nombre||''; document.getElementById('modalRfc').value = p.rfc||''; document.getElementById('modalDireccion').value = p.direccion || ''; document.getElementById('modalEstatus').value = p.activo ? 'true' : 'false'; document.getElementById('modalFechaRegistro').value = p.fecha_registro || ''; } // Llena formulario

    normalizeProveedores(){ // Normaliza estructura de registros
        let counter = 0; // Contador para IDs
        this.proveedores = (this.proveedores || []).map((p)=>{ // Mapea registros
            const id = p.id && String(p.id).trim() ? String(p.id).trim() : ('PROV-' + (++counter).toString().padStart(4,'0')); // ID seguro
            return { // Devuelve registro normalizado
                id,
                codigo: p.codigo || '',
                nombre: p.nombre || p.razon_social || '',
                rfc: p.rfc || '',
                telefono: p.telefono || '',
                email: p.email || '',
                direccion: typeof p.direccion === 'string' ? p.direccion : `${p.direccion?.calle || ''} ${p.direccion?.numero || ''}, ${p.direccion?.colonia || ''}, ${p.direccion?.municipio || ''}, ${p.direccion?.estado || ''}, ${p.direccion?.cp || ''}, ${p.direccion?.pais || ''}`.trim(),
                activo: typeof p.activo === 'boolean' ? p.activo : true,
                fecha_registro: p.fecha_registro || new Date().toISOString()
            };
        });
    }

    setupModalEvents(){ // Enlaces dentro del modal
        document.getElementById('btnCloseModalProveedor').onclick = ()=> this.closeModal(); // Cerrar modal
        document.getElementById('btnGuardarModalProveedor').onclick = ()=> this.saveFromModal(); // Guardar proveedor
        const btnImp = document.getElementById('btnImprimirProveedor');
        if (btnImp) btnImp.style.display = 'none';
        document.querySelectorAll('.tab-button').forEach(btn=> btn.onclick = ()=> this.switchTab(btn.dataset.tab)); // Cambiar pestaña

        // Secciones colapsables: igual que en Custodias
        document.querySelectorAll('.section-header-collapse').forEach(header => { // Headers colapsables
            header.onclick = () => { // Toggle colapso
                header.classList.toggle('collapsed'); // Cambia clase
                const body = header.parentElement?.querySelector('.section-body'); // Cuerpo asociado
                if (body) { // Si existe
                    const isCollapsed = header.classList.contains('collapsed'); // Estado
                    body.style.display = isCollapsed ? 'none' : ''; // Muestra/oculta
                }
            };
        });
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

        // Expandir todas las secciones colapsables en la nueva pestaña
        const activeTab = document.getElementById(`tab${tabName.charAt(0).toUpperCase() + tabName.slice(1)}`);
        if (activeTab) {
            activeTab.querySelectorAll('.section-header-collapse').forEach(header => {
                header.classList.remove('collapsed');
                const body = header.parentElement?.querySelector('.section-body');
                if (body) body.style.display = '';
            });
        }
    }

    saveFromModal(){ 
        const modalIdEl = document.getElementById('modalIdProveedor');
        if (!modalIdEl) { console.error('modalIdProveedor not found'); return; }
        const id = modalIdEl.value; 
        const nombreEl = document.getElementById('modalNombre');
        if (!nombreEl) { console.error('modalNombre not found'); return; }
        const nombre = nombreEl.value.trim(); 
        if(!nombre){ alert('Nombre requerido'); return; } 
        const codigoEl = document.getElementById('modalCodigo');
        if (!codigoEl) { console.error('modalCodigo not found'); return; }
        const codigo = codigoEl.value.trim(); 
        const rfcEl = document.getElementById('modalRfc');
        if (!rfcEl) { console.error('modalRfc not found'); return; }
        const rfc = rfcEl.value.trim(); 
        if(!rfc){ alert('RFC requerido'); return; }
        const direccionEl = document.getElementById('modalDireccion');
        if (!direccionEl) { console.error('modalDireccion not found'); return; }
        const direccion = direccionEl.value.trim(); 
        if(!direccion){ alert('Dirección fiscal requerida'); return; }
        const estatusEl = document.getElementById('modalEstatus');
        if (!estatusEl) { console.error('modalEstatus not found'); return; }
        const activo = estatusEl.value === 'true'; 
        const fechaRegistroEl = document.getElementById('modalFechaRegistro');
        if (!fechaRegistroEl) { console.error('modalFechaRegistro not found'); return; }
        const fecha_registro = fechaRegistroEl.value || new Date().toISOString(); 
        const existing = this.proveedores.findIndex(p=>p.id===id); // Lee valores del formulario y valida nombre
        const record = { id, codigo, nombre, rfc, direccion, activo, fecha_registro }; // Construye objeto
        if(existing>=0) { this.proveedores[existing] = record; this.showNotification('Proveedor actualizado','success'); } // Actualiza si existe
        else { this.proveedores.push(record); this.showNotification('Proveedor agregado','success'); } // Inserta si nuevo
        fetch('/api/proveedores', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify(record) }).then(res=>res.json()).then(data=>{ console.log('Guardado:', data); }).catch(e=>console.error('Error guardando:', e)); // Persiste en DB
        this.saveToStorage(); /* sin render de datos */ this.updateStats(); this.updateBottomBar(); this.closeModal(); } // Persiste y refresca UI

    deleteProveedor(id){ if(!confirm('¿Cancelar proveedor?')) return; this.proveedores = this.proveedores.filter(p=>p.id!==id); fetch('/api/proveedores/' + id, { method: 'DELETE' }).then(res=>res.json()).then(data=>{ console.log('Eliminado:', data); }).catch(e=>console.error('Error eliminando:', e)); this.saveToStorage(); /* sin render de datos */ this.updateStats(); this.updateBottomBar(); this.showNotification('Proveedor cancelado','success'); } // Elimina por ID

    printProveedor(){ this.showNotification('Función de impresión en desarrollo','info'); } // Placeholder de impresión

    updateStats(){ const enActivos = document.getElementById('enActivos'); const enInactivos = document.getElementById('enInactivos'); if(enActivos) enActivos.textContent = this.proveedores.filter(p=>p.activo).length; if(enInactivos) enInactivos.textContent = this.proveedores.filter(p=>!p.activo).length; } // Actualiza contadores
    
    updateBottomBar(){ // Actualiza contador y paginación unificada
        const total = (this.getFilteredProveedores()||[]).length;
        const mostrando = document.getElementById('mostrandoRegistros');
        const infoPagina = document.getElementById('infoPagina');
        const btnAnterior = document.getElementById('btnAnterior');
        const btnSiguiente = document.getElementById('btnSiguiente');
        const totalPages = Math.max(1, Math.ceil(total/this.itemsPerPage));
        if(mostrando){ const start = ((this.currentPage-1)*this.itemsPerPage)+1; const end = Math.min(this.currentPage*this.itemsPerPage, total); mostrando.textContent = total ? `Mostrando ${start}-${end} de ${total}` : `Mostrando 0 de 0`; }
        if(infoPagina){ infoPagina.textContent = `Página ${Math.min(this.currentPage,totalPages)} de ${totalPages}`; }
        if(btnAnterior) btnAnterior.disabled = this.currentPage<=1 || total===0;
        if(btnSiguiente) btnSiguiente.disabled = this.currentPage>=totalPages || total===0;
        this.renderList(); // Renderiza la lista actualizada
    }

    updatePagination(total){ const btnAnterior = document.getElementById('btnAnterior'); const btnSiguiente = document.getElementById('btnSiguiente'); const infoPagina = document.getElementById('infoPagina'); const mostrando = document.getElementById('mostrandoRegistros'); const totalPages = Math.max(1, Math.ceil(total/this.itemsPerPage)); if(btnAnterior) btnAnterior.disabled = this.currentPage===1; if(btnSiguiente) btnSiguiente.disabled = this.currentPage===totalPages; if(infoPagina) infoPagina.textContent = `Página ${this.currentPage} de ${totalPages}`; if(mostrando){ const start = ((this.currentPage-1)*this.itemsPerPage)+1; const end = Math.min(this.currentPage*this.itemsPerPage, total); mostrando.textContent = `Mostrando ${start}-${end} de ${total} registros`; } } // Actualiza controles de paginación

    // Eliminado: utilidades de columnas (resize/reorder), render y ordenamiento

    // Funciones para contactos
    renderContactos() {
        const lista = document.getElementById('listaContactos');
        if (!lista) return;
        lista.innerHTML = '';
        this.contactos.forEach((contacto) => {
            const item = document.createElement('div');
            item.className = 'contacto-item';
            item.dataset.id = contacto.id;

            const info = document.createElement('span');
            info.className = 'contacto-info';
            info.textContent = `${contacto.area ? contacto.area.toUpperCase() : 'Contacto'} - ${contacto.nombre}`;

            const actions = document.createElement('div');
            actions.className = 'contacto-actions';

            const btnVer = document.createElement('button');
            btnVer.id = 'Ico_Visualizar';
            btnVer.title = 'Visualizar';
            btnVer.textContent = '👁️';

            const btnEditar = document.createElement('button');
            btnEditar.id = 'Ico_Editar';
            btnEditar.title = 'Editar';
            btnEditar.textContent = '✏️';

            actions.appendChild(btnVer);
            actions.appendChild(btnEditar);

            item.appendChild(info);
            item.appendChild(actions);
            lista.appendChild(item);
        });
    }

    openModalContacto(id = null) {
        const modal = document.getElementById('modalContacto');
        const title = document.getElementById('modalTitleContacto');
        if (id) {
            title.textContent = 'Editar Contacto';
            const contacto = this.contactos.find(c => c.id === id);
            if (contacto) this.fillModalContacto(contacto);
        } else {
            title.textContent = 'Agregar Contacto';
            this.resetModalContacto();
        }
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
        this.setupModalContactoEvents();
    }

    closeModalContacto() {
        const modal = document.getElementById('modalContacto');
        modal.style.display = 'none';
        document.body.style.overflow = '';
    }

    resetModalContacto() {
        document.getElementById('formContacto').reset();
    }

    fillModalContacto(contacto) {
        document.getElementById('modalContactoArea').value = contacto.area || '';
        document.getElementById('modalContactoNombre').value = contacto.nombre || '';
        document.getElementById('modalContactoTelefono').value = contacto.telefono || '';
        document.getElementById('modalContactoExt').value = contacto.ext || '';
        document.getElementById('modalContactoCorreo').value = contacto.correo || '';
        document.getElementById('modalContactoDato1').value = contacto.dato1 || '';
        document.getElementById('modalContactoDato2').value = contacto.dato2 || '';
    }

    setupModalContactoEvents() {
        document.getElementById('btnCloseModalContacto').onclick = () => this.closeModalContacto();
        document.getElementById('btnCancelarContacto').onclick = (e) => {
            e.preventDefault();
            this.closeModalContacto();
        };
        document.getElementById('btnGuardarContacto').onclick = (e) => {
            e.preventDefault();
            this.saveContacto();
        };

        // Delegación para visualizar/editar
        const lista = document.getElementById('listaContactos');
        if (lista) {
            lista.addEventListener('click', (e) => {
                const target = e.target;
                const item = target.closest('.contacto-item');
                if (!item) return;
                const id = item.dataset.id;
                const contacto = this.contactos.find(c => c.id === id);
                if (!contacto) return;

                if (target.id === 'Ico_Visualizar') {
                    this.fillModalContacto(contacto);
                    this.openModalContacto();
                }
                if (target.id === 'Ico_Editar') {
                    this.openModalContacto(id);
                }
            });
        }
    }

    saveContacto() {
        const id = crypto.randomUUID ? crypto.randomUUID() : String(Date.now());
        const contacto = {
            id,
            area: document.getElementById('modalContactoArea').value,
            nombre: document.getElementById('modalContactoNombre').value,
            telefono: document.getElementById('modalContactoTelefono').value,
            ext: document.getElementById('modalContactoExt').value,
            correo: document.getElementById('modalContactoCorreo').value,
            dato1: document.getElementById('modalContactoDato1').value,
            dato2: document.getElementById('modalContactoDato2').value
        };
        this.contactos.push(contacto);
        this.saveToStorage();
        this.renderContactos();
        this.closeModalContacto();
    }

    showNotification(msg,type='info'){ const n = document.createElement('div'); n.style.cssText = `position:fixed;top:20px;right:20px;padding:12px 16px;background:${type==='success'? '#28a745': type==='error'? '#dc3545':'#17a2b8'};color:white;border-radius:6px;z-index:10000;font-weight:600`; n.textContent=msg; document.body.appendChild(n); setTimeout(()=>n.remove(),4000); } // Notificación flotante
}

// Funciones globales para contactos, similar a sucursales
function openModalContacto(id = null) {
    const overlay = document.getElementById('modalContacto');
    if (overlay) {
        overlay.style.display = 'flex';
        document.body.style.overflow = 'hidden';
        // Configurar desde la clase
        if (window.ProveedoresManager) {
            window.ProveedoresManager.setupModalContactoEvents();
            if (id) {
                const contacto = window.ProveedoresManager.contactos.find(c => c.id === id);
                if (contacto) window.ProveedoresManager.fillModalContacto(contacto);
                document.getElementById('modalTitleContacto').textContent = 'Editar Contacto';
            } else {
                window.ProveedoresManager.resetModalContacto();
                document.getElementById('modalTitleContacto').textContent = 'Agregar Contacto';
            }
        }
    }
}

function closeModalContacto() {
    const overlay = document.getElementById('modalContacto');
    if (overlay) overlay.style.display = 'none';
    document.body.style.overflow = '';
}

// Inicializar
document.addEventListener('DOMContentLoaded', ()=>{ try{ window.ProveedoresManager = new ProveedoresManager(); }catch(e){ console.error(e); } }); // Crea instancia al cargar
