// ProveedoresManager - Paridad funcional con Custodias
class ProveedoresManager { // Clase principal que gestiona proveedores
    constructor() { // Constructor: inicializa estado y arranca
        this.proveedores = []; // Lista de proveedores en memoria
        this.currentPage = 1; // Página actual para paginación
        this.itemsPerPage = 10; // Registros por página
        this.currentFilter = ''; // Texto de filtro de búsqueda
        // Eliminado: configuración de columnas/tabla
        this.storageKey = 'acosa_proveedores'; // Clave de localStorage

        this.hideLoading(); // Oculta spinner de carga
        this.init(); // Ejecuta flujo de inicialización
    }

    hideLoading(){ const l = document.getElementById('loading'); if(l) l.style.display='none'; } // Oculta indicador de carga
    showLoading(){ const l = document.getElementById('loading'); if(l) l.style.display='flex'; } // Muestra indicador de carga

    async init(){ // Carga preferencias, datos y configura UI
        // Eliminado: carga de preferencias de columnas
        // Semilla: si no hay datos, crear 10 registros demo para visualizar la tabla
        const stored = localStorage.getItem(this.storageKey); // Obtiene JSON guardado
        if (stored) { // Si existe almacenamiento previo
            try { const data = JSON.parse(stored); this.proveedores = data.proveedores || []; } catch(e){ this.proveedores = []; } // Parseo seguro
        }
        if (!this.proveedores || this.proveedores.length === 0) { // Si no hay datos, crear demo
            this.proveedores = Array.from({length: 10}, (_, i) => { // Genera 10 registros
                const n = i + 1; // Número consecutivo
                return { // Objeto proveedor demo
                    id: `PROV-${String(n).padStart(4,'0')}`, // ID formateado
                    codigo: `PROV-${String(n).padStart(3,'0')}`, // Código formateado
                    nombre: ['TRANSPORTES MEXICANOS SA DE CV','LOGISTICA INTEGRAL DEL NORTE','CARGA Y DESCARGA RAPIDA','FLETES EXPRESS','ALMACENES CENTRALES','DISTRIBUIDORA SUR','PROVEEDOR OCCIDENTE','TRANSPORTE NORTEÑA','LOGIS PACIFICO','GRUPO CARGAS'][i] || `Proveedor ${n}`, // Nombre demo
                    contacto: ['Juan Pérez','María García','Carlos López','Ana Torres','Luis Ramírez','Sofía Díaz','Pedro Márquez','Elena Ríos','Hugo Salas','Laura Cruz'][i] || 'Contacto', // Contacto demo
                    telefono: `+52 55 ${String(1000 + i).padStart(4,'0')} ${String(1000 + i).padStart(4,'0')}`, // Teléfono demo
                    email: `prov${n}@acosa.com`, // Email demo
                    activo: i % 4 !== 2 // Estado activo alternado
                };
            });
            this.saveToStorage(); // Persiste la semilla en localStorage
        }
        this.setupEventListeners(); // Enlaza eventos de UI
        // No render de datos: solo estructura
        this.updateStats(); // Actualiza contadores de estado
    }

    async loadProveedores(){ // Carga proveedores desde storage o JSON
        this.showLoading(); // Muestra loading
        try{
            const stored = localStorage.getItem(this.storageKey); // Lee cache
            if(stored){ const data = JSON.parse(stored); this.proveedores = data.proveedores || []; } // Usa cache si existe
            else { // Si no hay cache, carga JSON estático
                const res = await fetch('/data/catalogos/proveedores.json'); // Solicita archivo
                if(res.ok){ const json = await res.json(); this.proveedores = json.proveedores || []; this.saveToStorage(); } // Asigna y guarda
                else this.proveedores = []; // Si falla, lista vacía
            }
            // Normalizar registros: asegurar ID y campos básicos
            this.normalizeProveedores(); // Limpia y completa campos
        }catch(e){ console.error('Error cargando proveedores', e); this.proveedores = []; } // Manejo de error
        finally{ this.hideLoading(); } // Oculta loading
    }

    saveToStorage(){ const data = { proveedores: this.proveedores, metadata:{ total_registros: this.proveedores.length, ultima_actualizacion: new Date().toISOString() } }; localStorage.setItem(this.storageKey, JSON.stringify(data)); } // Persiste datos

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
    }

    getFilteredProveedores(){ // Devuelve lista filtrada por texto
        let filtered = this.proveedores; // Base
        if(this.currentFilter){ filtered = filtered.filter(p=> (p.nombre||'').toLowerCase().includes(this.currentFilter) || (p.codigo||'').toLowerCase().includes(this.currentFilter) || (p.rfc||'').toLowerCase().includes(this.currentFilter)); } // Aplica condiciones
        return filtered; // Resultado
    }

    renderList(){ // Sin tablas ni placeholders: solo contenedor vacío
        const container = document.getElementById('listaProveedores');
        if (!container) return;
        container.innerHTML = '';
    }

    escape(s){ return (s||'').toString().replace(/[&<>\"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":"&#39;"})[c]); } // Escapa HTML básico

    // Eliminado: eventos ligados a filas de tabla

    viewProveedor(id){ const p = this.proveedores.find(x=>x.id===id); if(p) alert(`Proveedor: ${p.nombre}\nRFC: ${p.rfc}`); } // Muestra datos básicos

    openModal(id=null){ // Abre modal para crear/editar
        const modal = document.getElementById('modalProveedor'); const title = document.getElementById('modalTitleProveedor'); // Referencias modal
        if(id){ title.textContent='Editar Proveedor'; const p = this.proveedores.find(x=>x.id===id); if(p) this.fillModalForm(p); } // Editar
        else { title.textContent='Nuevo Proveedor'; this.resetModalForm(); this.generateNewId(); } // Nuevo
        document.getElementById('modalProveedor').style.display='flex'; document.body.style.overflow='hidden'; this.setupModalEvents(); // Muestra modal y bloquea scroll
    }

    closeModal(){ document.getElementById('modalProveedor').style.display='none'; document.body.style.overflow=''; } // Cierra modal y restaura scroll

    resetModalForm(){ const f = document.getElementById('formProveedor'); if(f) f.reset(); document.getElementById('modalFechaRegistro').value = new Date().toLocaleString(); } // Limpia formulario

    generateNewId(){ const id = 'PROV-' + (this.proveedores.length+1).toString().padStart(4,'0'); document.getElementById('modalIdProveedor').value = id; } // Genera ID siguiente

    fillModalForm(p){ document.getElementById('modalIdProveedor').value = p.id; document.getElementById('modalCodigo').value = p.codigo||''; document.getElementById('modalNombre').value = p.nombre||''; document.getElementById('modalRfc').value = p.rfc||''; document.getElementById('modalContacto').value = p.contacto||''; document.getElementById('modalTelefono').value = p.telefono||''; document.getElementById('modalEmail').value = p.email||''; document.getElementById('modalDireccion').value = p.direccion || ''; document.getElementById('modalActivo').checked = !!p.activo; document.getElementById('modalFechaRegistro').value = p.fecha_registro || ''; } // Llena formulario

    normalizeProveedores(){ // Normaliza estructura de registros
        let counter = 0; // Contador para IDs
        this.proveedores = (this.proveedores || []).map((p)=>{ // Mapea registros
            const id = p.id && String(p.id).trim() ? String(p.id).trim() : ('PROV-' + (++counter).toString().padStart(4,'0')); // ID seguro
            return { // Devuelve registro normalizado
                id,
                codigo: p.codigo || '',
                nombre: p.nombre || p.razon_social || '',
                rfc: p.rfc || '',
                contacto: p.contacto || '',
                telefono: p.telefono || '',
                email: p.email || '',
                direccion: p.direccion || '',
                activo: typeof p.activo === 'boolean' ? p.activo : true,
                fecha_registro: p.fecha_registro || new Date().toISOString()
            };
        });
    }

    setupModalEvents(){ // Enlaces dentro del modal
        document.getElementById('btnCloseModalProveedor').onclick = ()=> this.closeModal(); // Cerrar modal
        document.getElementById('btnGuardarModalProveedor').onclick = ()=> this.saveFromModal(); // Guardar proveedor
        document.getElementById('btnImprimirProveedor').onclick = ()=> this.printProveedor(); // Imprimir (pendiente)
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

    switchTab(tab){ // Cambia pestaña activa
        // Normalizar clave desde data-tab (soporta valores con espacios y mayúsculas)
        const key = String(tab).toLowerCase().replace(/\s+/g,''); // Normaliza texto
        const targetId = 'tab' + key.charAt(0).toUpperCase() + key.slice(1); // Construye ID

        // Reset de estado
        document.querySelectorAll('.tab-content').forEach(c=> c.classList.remove('active')); // Desactiva contenidos
        document.querySelectorAll('.tab-button').forEach(b=> b.classList.remove('active')); // Desactiva botones

        // Activar botón y contenido
        const btn = Array.from(document.querySelectorAll('.tab-button')).find(b=> String(b.dataset.tab).toLowerCase() === String(tab).toLowerCase()); // Busca botón
        if(btn) btn.classList.add('active'); // Activa botón
        const cont = document.getElementById(targetId) || document.getElementById('tabDatos') || document.getElementById('tabDocumentos'); // Busca contenedor
        if(cont) cont.classList.add('active'); // Activa contenido
    }

    saveFromModal(){ const id = document.getElementById('modalIdProveedor').value; const nombre = document.getElementById('modalNombre').value.trim(); if(!nombre){ alert('Nombre requerido'); return; } const codigo = document.getElementById('modalCodigo').value.trim(); const rfc = document.getElementById('modalRfc').value.trim(); const contacto = document.getElementById('modalContacto').value.trim(); const telefono = document.getElementById('modalTelefono').value.trim(); const email = document.getElementById('modalEmail').value.trim(); const direccion = document.getElementById('modalDireccion').value.trim(); const activo = document.getElementById('modalActivo').checked; const fecha_registro = document.getElementById('modalFechaRegistro').value || new Date().toISOString(); const existing = this.proveedores.findIndex(p=>p.id===id); // Lee valores del formulario y valida nombre
        const record = { id, codigo, nombre, rfc, contacto, telefono, email, direccion, activo, fecha_registro }; // Construye objeto
        if(existing>=0) { this.proveedores[existing] = record; this.showNotification('Proveedor actualizado','success'); } // Actualiza si existe
        else { this.proveedores.push(record); this.showNotification('Proveedor agregado','success'); } // Inserta si nuevo
        this.saveToStorage(); /* sin render de datos */ this.updateStats(); this.closeModal(); } // Persiste y refresca UI

    deleteProveedor(id){ if(!confirm('¿Cancelar proveedor?')) return; this.proveedores = this.proveedores.filter(p=>p.id!==id); this.saveToStorage(); /* sin render de datos */ this.updateStats(); this.showNotification('Proveedor cancelado','success'); } // Elimina por ID

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
    }

    updatePagination(total){ const btnAnterior = document.getElementById('btnAnterior'); const btnSiguiente = document.getElementById('btnSiguiente'); const infoPagina = document.getElementById('infoPagina'); const mostrando = document.getElementById('mostrandoRegistros'); const totalPages = Math.max(1, Math.ceil(total/this.itemsPerPage)); if(btnAnterior) btnAnterior.disabled = this.currentPage===1; if(btnSiguiente) btnSiguiente.disabled = this.currentPage===totalPages; if(infoPagina) infoPagina.textContent = `Página ${this.currentPage} de ${totalPages}`; if(mostrando){ const start = ((this.currentPage-1)*this.itemsPerPage)+1; const end = Math.min(this.currentPage*this.itemsPerPage, total); mostrando.textContent = `Mostrando ${start}-${end} de ${total} registros`; } } // Actualiza controles de paginación

    // Eliminado: utilidades de columnas (resize/reorder), render y ordenamiento

    showNotification(msg,type='info'){ const n = document.createElement('div'); n.style.cssText = `position:fixed;top:20px;right:20px;padding:12px 16px;background:${type==='success'? '#28a745': type==='error'? '#dc3545':'#17a2b8'};color:white;border-radius:6px;z-index:10000;font-weight:600`; n.textContent=msg; document.body.appendChild(n); setTimeout(()=>n.remove(),4000); } // Notificación flotante
}

// Inicializar
document.addEventListener('DOMContentLoaded', ()=>{ try{ window.ProveedoresManager = new ProveedoresManager(); }catch(e){ console.error(e); } }); // Crea instancia al cargar
