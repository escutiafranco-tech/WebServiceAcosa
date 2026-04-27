// Módulo de Proveedores (Compras)
// -------------------------------
// Controla la pantalla de catálogo de proveedores:
//  - Carga la lista desde la API /api/datos/TBL_PROV_GLOBAL (tabla de consulta dinámica).
//  - Genera encabezados dinámicamente desde metadata.
//  - Aplica filtro de texto en memoria.
//  - Abre un modal para alta/edición de proveedor.

const TABLA_CONSULTA = 'TBL_PROV_GLOBAL';  // ✅ Tabla de consulta dinámica
var metadataTabla = null;                   // Almacena metadata cargada

// ✅ VARIABLES GLOBALES (EXPUESTAS) para ordenamiento y estado
var proveedores = [];                        // Array de proveedores cargados
var soloActivos = false;                     // Filtro de estado
var columnasVisiblesGlobal = [];             // Orden de columnas visibles
var sortState = {};                          // Estado de ordenamiento: { nombreCol: 'asc'|'desc'|null }
var filtroActualProveedores = '';            // Termo de búsqueda actual

// ✅ REFERENCIAS GLOBALES del DOM (para que las funciones expuestas puedan acceder)
var ProveedoresDOM = {
  listaProveedores: null,
  loading: null,
  txtBuscar: null,
  lblMostrando: null,
  lblActivos: null,
  lblInactivos: null,
  btnRefrescar: null,
  btnBuscar: null
};

document.addEventListener('DOMContentLoaded', () => {
  // Referencias a elementos del DOM usados en la pantalla.
  const listaProveedores = document.getElementById('listaProveedores');
  const loading = document.getElementById('loadingProveedores');
  const txtBuscar = document.getElementById('buscarProveedor');
  const lblMostrando = document.getElementById('mostrandoProveedores');
  const lblActivos = document.getElementById('proveedoresActivos');
  const lblInactivos = document.getElementById('proveedoresInactivos');
  const btnRefrescar = document.getElementById('btnRefrescarProveedores');
  const btnBuscar = document.getElementById('btnBuscarProveedor');
  
  // ✅ LLENAR REFERENCIAS GLOBALES DEL DOM
  ProveedoresDOM.listaProveedores = listaProveedores;
  ProveedoresDOM.loading = loading;
  ProveedoresDOM.txtBuscar = txtBuscar;
  ProveedoresDOM.lblMostrando = lblMostrando;
  ProveedoresDOM.lblActivos = lblActivos;
  ProveedoresDOM.lblInactivos = lblInactivos;
  ProveedoresDOM.btnRefrescar = btnRefrescar;
  ProveedoresDOM.btnBuscar = btnBuscar;
  const modal = document.getElementById('modalProveedor');
  const tituloModal = document.getElementById('tituloModalProveedor');
  const btnCerrarModal = document.getElementById('btnCerrarModalProveedor');
  const btnGuardar = document.getElementById('btnGuardarProveedor');
  const btnCancelar = document.getElementById('btnCancelarProveedor');
  const form = document.getElementById('formProveedor');
  const inputId = document.getElementById('provId');
  const inputIdVisible = document.getElementById('provIdVisible');
  const inputRFC = document.getElementById('provRFC');
  const inputNombre = document.getElementById('provNombre');
  const inputDireccion = document.getElementById('provDireccion');
  const inputFechaReg = document.getElementById('provFechaRegistro');
  const inputActivo = document.getElementById('provActivo');
  const tbodyServicios = document.getElementById('tbodyServicios');
  const tbodySucursales = document.getElementById('tbodySucursales');
  const tbodyContactos = document.getElementById('tbodyContactos');
  const btnNuevoServicio = document.getElementById('btnNuevoServicio');
  const btnNuevaSucursal = document.getElementById('btnNuevaSucursal');
  const btnNuevoContacto = document.getElementById('btnNuevoContacto');

  // Modales secundarios para servicios, sucursales y contactos
  const modalServicio = document.getElementById('modalServicio');
  const modalSucursal = document.getElementById('modalSucursal');
  const modalContacto = document.getElementById('modalContacto');

  const formServicio = document.getElementById('formServicio');
  const inputSrvNombre = document.getElementById('srvNombre');
  const inputSrvDescripcion = document.getElementById('srvDescripcion');
  const btnGuardarServicio = document.getElementById('btnGuardarServicio');
  const btnCancelarServicio = document.getElementById('btnCancelarServicio');
  const btnCerrarModalServicio = document.getElementById('btnCerrarModalServicio');

  const formSucursal = document.getElementById('formSucursal');
  const inputSucTipo = document.getElementById('sucTipo');
  const inputSucNombre = document.getElementById('sucNombre');
  const inputSucPais = document.getElementById('sucPais');
  const inputSucEstado = document.getElementById('sucEstado');
  const inputSucMunicipio = document.getElementById('sucMunicipio');
  const btnGuardarSucursal = document.getElementById('btnGuardarSucursal');
  const btnCancelarSucursal = document.getElementById('btnCancelarSucursal');
  const btnCerrarModalSucursal = document.getElementById('btnCerrarModalSucursal');

  const formContacto = document.getElementById('formContacto');
  const inputCtoArea = document.getElementById('ctoArea');
  const inputCtoNombre = document.getElementById('ctoNombre');
  const inputCtoTelefono = document.getElementById('ctoTelefono');
  const inputCtoCorreo = document.getElementById('ctoCorreo');
  const btnGuardarContacto = document.getElementById('btnGuardarContacto');
  const btnCancelarContacto = document.getElementById('btnCancelarContacto');
  const btnCerrarModalContacto = document.getElementById('btnCerrarModalContacto');

  // Lógica de pestañas del modal (DATOS GENERALES / EXPEDIENTE / VENTAS / SALDOS / AGENDA)
  const tabButtons = modal ? modal.querySelectorAll('.tab-button') : [];
  const tabContents = modal ? modal.querySelectorAll('.tab-content') : [];

  function activarTab(tabId) {
    if (!tabId) return;

    tabButtons.forEach(btn => {
      const target = btn.getAttribute('data-tab');
      if (target === tabId) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });

    tabContents.forEach(c => {
      if (c.id === tabId) {
        c.classList.add('active');
        
        // ✅ VERIFICAR SI LA PESTAÑA ESTÁ VACÍA Y MOSTRAR "EN DESARROLLO"
        if (typeof mostrarDesarrollo === 'function' && (!c.textContent.trim() || c.innerHTML.trim() === '')) {
          c.innerHTML = mostrarDesarrollo({
            titulo: 'Pestaña en Desarrollo',
            descripcion: 'Esta pestaña está en desarrollo y estará disponible pronto.',
            imagen: '/Imagenes/Ico_Construccion_03.png',
            alturaMinima: 300
          });
        }
      } else {
        c.classList.remove('active');
      }
    });
  }

  tabButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const target = btn.getAttribute('data-tab');
      activarTab(target);
    });
  });

  // Muestra/oculta el overlay de "Cargando" sobre la lista.
  function mostrarLoading(show) {
    if (!ProveedoresDOM.loading) return;
    ProveedoresDOM.loading.style.display = show ? 'flex' : 'none';
  }

  // Dibuja la lista de proveedores con columnas dinámicas.
  // Aplica un filtro de texto en memoria.
  function renderLista(filtro = '') {
    if (!ProveedoresDOM.listaProveedores || !metadataTabla) return;
    
    const term = (filtro || '').toLowerCase();
    const columnasVisibles = metadataTabla?.columnas_visibles || ['ID', 'NOMBRE', 'RFC', 'ACTIVO'];
    const todasLasColumnas = metadataTabla?.todas_las_columnas || [];
    
    // Filtrar basándose en todas las columnas visibles
    const filtrados = proveedores.filter(p => {
      const textoBusqueda = columnasVisibles
        .map(col => String(p[col.toLowerCase()] || ''))
        .join(' ')
        .toLowerCase();
      return textoBusqueda.includes(term);
    });

    ProveedoresDOM.listaProveedores.innerHTML = '';
    ProveedoresDOM.listaProveedores.className = 'tabla-unificada';

    if (filtrados.length === 0) {
      ProveedoresDOM.listaProveedores.classList.add('vacia');
      ProveedoresDOM.listaProveedores.textContent = 'No hay proveedores para mostrar.';
      // Estadísticas
      if (ProveedoresDOM.lblActivos) ProveedoresDOM.lblActivos.textContent = '0';
      if (ProveedoresDOM.lblInactivos) ProveedoresDOM.lblInactivos.textContent = '0';
      if (ProveedoresDOM.lblMostrando) ProveedoresDOM.lblMostrando.textContent = `Mostrando 0 de ${proveedores.length}`;
      return;
    }

    // ✅ Generar headers como celdas del grid CON DRAG-AND-DROP PARA REORDEN
    columnasVisibles.forEach((colNombre, colIndex) => {
      const colMetadata = todasLasColumnas.find(c => c.nombre === colNombre);
      const etiqueta = colMetadata?.etiqueta || colNombre;
      
      const headerCell = document.createElement('div');
      headerCell.className = 'header-cell';
      headerCell.setAttribute('data-column', colNombre);
      headerCell.setAttribute('draggable', 'true');
      headerCell.setAttribute('data-col-index', colIndex);
      headerCell.innerHTML = `<strong>${etiqueta}</strong>`;
      
      // Aplicar clase si ya está ordenado
      if (sortState[colNombre]) {
        headerCell.classList.add(`sorted-${sortState[colNombre]}`);
      }
      
      // Agregar click listener para ordenamiento (solo si NO está siendo arrastrado)
      let isDragging = false;
      headerCell.addEventListener('dragstart', (e) => {
        isDragging = true;
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', colNombre);
        headerCell.style.opacity = '0.6';
      });

      headerCell.addEventListener('dragend', () => {
        isDragging = false;
        headerCell.style.opacity = '1';
      });

      headerCell.addEventListener('dragover', (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        headerCell.style.borderLeft = '3px solid #4a90e2';
      });

      headerCell.addEventListener('dragleave', () => {
        headerCell.style.borderLeft = '';
      });

      headerCell.addEventListener('drop', (e) => {
        e.preventDefault();
        headerCell.style.borderLeft = '';
        
        const draggedColumn = e.dataTransfer.getData('text/plain');
        const targetColumn = colNombre;
        
        if (draggedColumn !== targetColumn) {
          reordenarColumnasProveedores(draggedColumn, targetColumn);
        }
      });

      headerCell.addEventListener('click', () => {
        // Solo ejecutar ordenamiento si no fue un drag
        if (!isDragging && window.ordenarPorColumnaProveedores) {
          window.ordenarPorColumnaProveedores(colNombre);
        }
      });
      
      ProveedoresDOM.listaProveedores.appendChild(headerCell);
    });

    // ✅ Generar datos como celdas del grid
    filtrados.forEach(p => {
      const row = document.createElement('div');
      row.className = 'data-row';
      
      // Generar celdas dinámicamente según columnas visibles
      columnasVisibles.forEach(col => {
        const colNombre = col.toLowerCase();
        let valor = p[colNombre] || '';
        
        // Formatear según tipo de columna
        if (colNombre === 'activo') {
          valor = valor === true || valor === 1 ? 'Activo' : 'Inactivo';
        }
        
        const cell = document.createElement('div');
        cell.className = `data-cell col-${colNombre}`;
        cell.textContent = valor;
        row.appendChild(cell);
      });
      
      ProveedoresDOM.listaProveedores.appendChild(row);
    });

    // Se recalculan totales de activos/inactivos
    const activos = filtrados.filter(p => p.activo === true || p.activo === 1).length;
    const inactivos = filtrados.length - activos;

    if (ProveedoresDOM.lblActivos) ProveedoresDOM.lblActivos.textContent = activos;
    if (ProveedoresDOM.lblInactivos) ProveedoresDOM.lblInactivos.textContent = inactivos;
    if (ProveedoresDOM.lblMostrando) ProveedoresDOM.lblMostrando.textContent = `Mostrando ${filtrados.length} de ${proveedores.length}`;
    
    // ✅ Aplicar anchos después de renderizar (es crítico para mantener widths después de reorder)
    inicializarColumnasProveedores();
  }

  // Carga metadata de la tabla de consulta TBL_PROV_GLOBAL
  async function cargarMetadata() {
    try {
      const res = await fetch(`/api/datos/${TABLA_CONSULTA}/schema`);
      if (!res.ok) throw new Error('Error al obtener schema');
      metadataTabla = await res.json();
      
      // ✅ Filtrar columna CODIGO (no queremos mostrarla)
      if (metadataTabla.columnas_visibles) {
        metadataTabla.columnas_visibles = metadataTabla.columnas_visibles.filter(col => col !== 'CODIGO');
      }
      if (metadataTabla.todas_las_columnas) {
        metadataTabla.todas_las_columnas = metadataTabla.todas_las_columnas.filter(col => col.nombre !== 'CODIGO');
      }
      
      console.log('✓ Metadata cargada (sin CODIGO):', metadataTabla);
      
      // ✅ Restaurar orden de columnas guardado
      restaurarOrdenColumnasProveedores();
      
      // ✅ Renderizar tabla unificada basada en metadata
      renderLista(ProveedoresDOM.txtBuscar ? ProveedoresDOM.txtBuscar.value : '');
    } catch (e) {
      console.error('Error cargando metadata:', e);
    }
  }

  // Función para ordenar por columna (A-Z / Z-A)
  function ordenarPorColumna(nombreCol) {
    // Alternar entre asc, desc y ninguno
    const estadoActual = sortState[nombreCol] || null;
    let nuevoEstado = null;
    
    if (estadoActual === null) {
      nuevoEstado = 'asc';  // Primer click: A-Z
    } else if (estadoActual === 'asc') {
      nuevoEstado = 'desc';  // Segundo click: Z-A
    } else {
      nuevoEstado = null;  // Tercer click: sin ordenamiento
    }
    
    // Limpiar todos los estados de ordenamiento
    Object.keys(sortState).forEach(col => {
      sortState[col] = null;
    });
    
    // Asignar nuevo estado
    sortState[nombreCol] = nuevoEstado;
    
    // Ordenar array
    if (nuevoEstado !== null) {
      const colKey = nombreCol.toLowerCase();  // ✅ CONVERTIR A MINÚSCULAS PARA ACCEDER AL ARRAY
      proveedores.sort((a, b) => {
        const valA = a[colKey] || '';
        const valB = b[colKey] || '';
        
        // Convertir a string y comparar
        const strA = String(valA).toLowerCase();
        const strB = String(valB).toLowerCase();
        
        if (nuevoEstado === 'asc') {
          return strA.localeCompare(strB, 'es');
        } else {
          return strB.localeCompare(strA, 'es');
        }
      });
    }
    
    // Redibujar tabla con los datos ordenados
    console.log(`📊 Ordenamiento: ${nombreCol} -> ${nuevoEstado}`);
    console.log(`📋 Llamando a renderLista con filtro: "${filtroActualProveedores || ''}"`);
    
    if (typeof renderLista === 'function') {
      renderLista(filtroActualProveedores || '');
      console.log('✓ renderLista ejecutado (función local)');
    } else if (typeof window.renderListaProveedores === 'function') {
      window.renderListaProveedores(filtroActualProveedores || '');
      console.log('✓ renderListaProveedores ejecutado (función global)');
    } else {
      console.error('✗ No se encontró renderLista ni renderListaProveedores');
    }
    
    // Reinicializar redimensionamiento después de renderizar
    setTimeout(() => {
      inicializarRedimensionamiento();
    }, 50);
  }

  // ✅ NUEVA FUNCIÓN: Reordenar columnas por drag-and-drop
  function reordenarColumnasProveedores(draggedColumn, targetColumn) {
    if (!metadataTabla || !metadataTabla.columnas_visibles) return;
    
    const columnas = metadataTabla.columnas_visibles;
    const dragIndex = columnas.indexOf(draggedColumn);
    const targetIndex = columnas.indexOf(targetColumn);
    
    if (dragIndex === -1 || targetIndex === -1 || dragIndex === targetIndex) return;
    
    // Guardar los anchos ANTES de reordenar (para preservarlos)
    const anchosGuardados = restaurarAnchosColumnas() || {};
    console.log('✓ Anchos guardados ANTES de reordenar:', anchosGuardados);
    
    // Reordenar array
    const nuevasColumnas = [...columnas];
    nuevasColumnas.splice(dragIndex, 1);
    nuevasColumnas.splice(targetIndex, 0, draggedColumn);
    
    // Actualizar metadata
    metadataTabla.columnas_visibles = nuevasColumnas;
    
    // Guardar en localStorage
    const STORAGE_KEY_COLUMN_ORDER = 'PROV_COLUMN_ORDER_V2';
    localStorage.setItem(STORAGE_KEY_COLUMN_ORDER, JSON.stringify(nuevasColumnas));
    console.log('✓ Orden de columnas guardado:', nuevasColumnas);
    
    // Asegurar que los anchos se preserven (NO los sobrescribas)
    // Solo guarda si los anchos no existen aún para las nuevas columnas
    const anchosFinales = {};
    nuevasColumnas.forEach(col => {
      // Usar el ancho guardado, o el default si no existe
      anchosFinales[col] = anchosGuardados[col] || DEFAULT_MIN_WIDTH;
    });
    
    localStorage.setItem(STORAGE_KEY_COLUMN_WIDTHS, JSON.stringify(anchosFinales));
    console.log('✓ Anchos finales después del reorden:', anchosFinales);
    
    // Re-renderizar tabla con nuevo orden
    renderLista(filtroActualProveedores || '');
    
    // Reinicializar redimensionamiento
    setTimeout(() => {
      inicializarRedimensionamiento();
    }, 50);
  }

  // ✅ FUNCIÓN: Restaurar orden de columnas desde localStorage
  function restaurarOrdenColumnasProveedores() {
    if (!metadataTabla) return;
    
    const STORAGE_KEY_COLUMN_ORDER = 'PROV_COLUMN_ORDER_V2';
    const ordenGuardado = localStorage.getItem(STORAGE_KEY_COLUMN_ORDER);
    
    if (ordenGuardado) {
      try {
        const columnasOrdenadas = JSON.parse(ordenGuardado);
        // Validar que todas las columnas guardadas existan aún
        const columnasValidas = columnasOrdenadas.filter(col => 
          metadataTabla.todas_las_columnas?.some(c => c.nombre === col)
        );
        
        if (columnasValidas.length > 0) {
          // Agregar columnas nuevas que no estaban en el orden guardado
          const columnasNuevas = metadataTabla.columnas_visibles?.filter(col =>
            !columnasValidas.includes(col)
          ) || [];
          
          metadataTabla.columnas_visibles = [...columnasValidas, ...columnasNuevas];
          console.log('✓ Orden de columnas restaurado:', metadataTabla.columnas_visibles);
        }
      } catch (e) {
        console.warn('⚠️ Error restaurando orden de columnas:', e);
      }
    }
  }

  // Llama al backend para obtener los datos de TBL_PROV_GLOBAL
  async function cargarProveedores() {
    try {
      mostrarLoading(true);
      
      // Cargar metadata primero si no está cargada
      if (!metadataTabla) {
        await cargarMetadata();
      }
      
      // Cargar datos desde tabla de consulta dinámica
      const res = await fetch(`/api/datos/${TABLA_CONSULTA}`);
      if (!res.ok) throw new Error('Error al obtener proveedores');
      const respuesta = await res.json();
      const data = respuesta.datos || [];

      // Adaptar estructura (ahora con columnas dinámicas)
      // ✅ Transformar IDs al formato PRV-XXXX
      proveedores = data.map((p, index) => ({
        id: `PRV-${String(index + 1).padStart(4, '0')}`,  // PRV-0001, PRV-0002, etc.
        nombre: p.NOMBRE,
        rfc: p.RFC,
        direccion: p.DIRECCION,
        fecha_registro: p.FECHA_REGISTRO,
        activo: p.ACTIVO === true || p.ACTIVO === 1
      }));

      renderLista(ProveedoresDOM.txtBuscar ? ProveedoresDOM.txtBuscar.value : '');
    } catch (e) {
      console.error('Error cargando proveedores:', e);
    } finally {
      mostrarLoading(false);
    }
  }

  // Eventos de barra superior (refrescar + búsqueda).
  if (ProveedoresDOM.btnRefrescar) ProveedoresDOM.btnRefrescar.addEventListener('click', cargarProveedores);
  if (ProveedoresDOM.btnBuscar && ProveedoresDOM.txtBuscar) ProveedoresDOM.btnBuscar.addEventListener('click', () => {
    filtroActualProveedores = ProveedoresDOM.txtBuscar.value;
    renderLista(filtroActualProveedores);
  });
  if (ProveedoresDOM.txtBuscar) ProveedoresDOM.txtBuscar.addEventListener('keyup', () => {
    filtroActualProveedores = ProveedoresDOM.txtBuscar.value;
    renderLista(filtroActualProveedores);
  });

  // Prepara y muestra el modal en modo "Nuevo proveedor".
  function abrirModalNuevo() {
    if (!modal) return;
    if (tituloModal) tituloModal.textContent = 'Nuevo proveedor';
    if (inputId) inputId.value = '';
    if (inputIdVisible) inputIdVisible.value = '';
    if (inputRFC) inputRFC.value = '';
    if (inputNombre) inputNombre.value = '';
    if (inputDireccion) inputDireccion.value = '';
    if (inputFechaReg) inputFechaReg.value = '';
    if (inputActivo) inputActivo.checked = true;
    modal.style.display = 'flex';
    activarTab('tab-datos-generales');
    
    // ✅ Asegurar que solo la primera sección esté abierta
    const allHeaders = modal.querySelectorAll('.section-header-collapse');
    allHeaders.forEach((header, index) => {
      if (index === 0) {
        header.classList.remove('collapsed'); // Primera sección abierta
      } else {
        header.classList.add('collapsed'); // Resto colapsadas
      }
    });
    
    if (tbodyServicios) tbodyServicios.innerHTML = '';
    if (tbodySucursales) tbodySucursales.innerHTML = '';
    if (tbodyContactos) tbodyContactos.innerHTML = '';
  }

  // Cierra el modal de proveedor.
  function cerrarModal() {
    if (!modal) return;
    modal.style.display = 'none';
  }

  function abrirModalServicio() {
    if (!modalServicio) return;
    if (formServicio) formServicio.reset();
    modalServicio.style.display = 'flex';
  }

  function cerrarModalServicio() {
    if (!modalServicio) return;
    modalServicio.style.display = 'none';
  }

  function abrirModalSucursal() {
    if (!modalSucursal) return;
    if (formSucursal) formSucursal.reset();
    if (inputSucTipo) inputSucTipo.value = 'Sucursal';
    modalSucursal.style.display = 'flex';
  }

  function cerrarModalSucursal() {
    if (!modalSucursal) return;
    modalSucursal.style.display = 'none';
  }

  function abrirModalContacto() {
    if (!modalContacto) return;
    if (formContacto) formContacto.reset();
    modalContacto.style.display = 'flex';
  }

  function cerrarModalContacto() {
    if (!modalContacto) return;
    modalContacto.style.display = 'none';
  }

  // Envía al backend el alta/edición de un proveedor (MERGE en server.js).
  async function guardarProveedor() {
    if (!inputNombre) return;
    // Si no hay ID, dejamos que el servidor lo genere de forma consecutiva (PROV-00001...)
    const id = inputId && inputId.value ? inputId.value : null;
    const fechaRegistro = (inputFechaReg && inputFechaReg.value) ? inputFechaReg.value : null;

    const body = {
      id,
      nombre: inputNombre.value.trim(),
      rfc: (inputRFC?.value || '').trim(),
      direccion: (inputDireccion?.value || '').trim(),
      activo: inputActivo ? inputActivo.checked : true,
      fecha_registro: fechaRegistro
    };

    try {
      mostrarLoading(true);
      const res = await fetch('/api/proveedores', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Error al guardar proveedor');
      }
      const data = await res.json().catch(() => ({}));
      // Si el servidor generó un ID/fecha, reflejarlos en el formulario
      if (data && data.id) {
        if (inputId) inputId.value = data.id;
        if (inputIdVisible) inputIdVisible.value = data.id;
      }
      if (data && data.fecha_registro && inputFechaReg && !inputFechaReg.value) {
        inputFechaReg.value = data.fecha_registro;
      }
      await cargarProveedores();
      cerrarModal();
    } catch (e) {
      console.error('Error guardando proveedor', e);
      alert('No se pudo guardar el proveedor. Revisa la consola para más detalles.');
    } finally {
      mostrarLoading(false);
    }
  }

  // Asegura que el proveedor exista en la base antes de agregar
  // servicios, sucursales o contactos. Si aún no tiene ID, genera
  // uno y hace un guardado rápido silencioso.
  async function ensureProveedorPersistido() {
    if (!inputId) return null;
    if (inputId.value) return inputId.value;

    if (!inputNombre) return null;

    // Regla: para poder agregar servicios/sucursales/contactos,
    // al menos debe estar capturado el Nombre del proveedor.
    if (!inputNombre.value.trim()) {
      alert('Primero captura el Nombre del proveedor y luego agrega los detalles.');
      return null;
    }

    const body = {
      id: null,
      nombre: inputNombre.value.trim(),
      rfc: (inputRFC?.value || '').trim(),
      direccion: (inputDireccion?.value || '').trim(),
      activo: inputActivo ? inputActivo.checked : true,
      fecha_registro: null
    };

    try {
      const res = await fetch('/api/proveedores', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      const data = await res.json().catch(() => ({}));
      const newId = data && data.id ? data.id : null;
      if (newId) {
        inputId.value = newId;
        if (inputIdVisible) inputIdVisible.value = newId;
      }
      if (data && data.fecha_registro && inputFechaReg && !inputFechaReg.value) {
        inputFechaReg.value = data.fecha_registro;
      }
      return newId;
    } catch (e) {
      console.error('No se pudo preparar el proveedor antes de agregar detalles', e);
      alert('No se pudo preparar el proveedor. Revisa conexión antes de agregar detalles.');
      inputId.value = '';
      return null;
    }
  }

  // Eventos de cierre/guardar del modal.
  if (btnCerrarModal) btnCerrarModal.addEventListener('click', cerrarModal);
  if (btnCancelar) btnCancelar.addEventListener('click', cerrarModal);
  if (btnGuardar) btnGuardar.addEventListener('click', guardarProveedor);
  if (form) form.addEventListener('submit', (e) => { e.preventDefault(); guardarProveedor(); });

    // Cierres de modales secundarios
    if (btnCerrarModalServicio) btnCerrarModalServicio.addEventListener('click', cerrarModalServicio);
    if (btnCancelarServicio) btnCancelarServicio.addEventListener('click', cerrarModalServicio);
    if (btnCerrarModalSucursal) btnCerrarModalSucursal.addEventListener('click', cerrarModalSucursal);
    if (btnCancelarSucursal) btnCancelarSucursal.addEventListener('click', cerrarModalSucursal);
    if (btnCerrarModalContacto) btnCerrarModalContacto.addEventListener('click', cerrarModalContacto);
    if (btnCancelarContacto) btnCancelarContacto.addEventListener('click', cerrarModalContacto);

  // Colapsar/expandir secciones "Servicios / Sucursales / Contactos" del modal.
  document.querySelectorAll('.section-header-collapse').forEach(h => {
    h.addEventListener('click', () => {
      h.classList.toggle('collapsed');
      
      // ✅ Si se expande (collapsed se quita), verificar si el contenido está vacío
      if (!h.classList.contains('collapsed')) {
        const sectionBody = h.nextElementSibling; // .section-body
        if (sectionBody && (!sectionBody.textContent.trim() || sectionBody.innerHTML.trim() === '<!-- Vacío - JavaScript lo llenará con "En Desarrollo" -->')) {
          // Mostrar mensaje de desarrollo para secciones colapsables (versión COMPACTA)
          if (typeof mostrarDesarrollo === 'function') {
            sectionBody.innerHTML = mostrarDesarrollo({
              titulo: 'Seccion desplegable en Desarrollo',
              descripcion: 'Esta seccion desplegable está en desarrollo y estará disponible pronto.',
              imagen: '/Imagenes/Ico_Construccion_03.png',
              compacto: true  // ✅ Usar layout horizontal compacto
            });
          }
        }
      }
    });
  });

  // Carga datos de un proveedor en el modal y dispara la carga
  // de servicios, sucursales y contactos asociados.
  function abrirModalEditar(prov) {
    if (!modal) return;
    if (tituloModal) tituloModal.textContent = 'Editar proveedor';
    if (inputId) inputId.value = prov.id || '';
    if (inputIdVisible) inputIdVisible.value = prov.id || '';
    if (inputRFC) inputRFC.value = prov.rfc || '';
    if (inputNombre) inputNombre.value = prov.nombre || '';
    if (inputDireccion) inputDireccion.value = prov.direccion || '';
    if (inputFechaReg) inputFechaReg.value = prov.fecha_registro || '';
    if (inputActivo) inputActivo.checked = !!prov.activo;
    modal.style.display = 'flex';
    activarTab('tab-datos-generales');
    
    // ✅ Asegurar que solo la primera sección esté abierta
    const allHeaders = modal.querySelectorAll('.section-header-collapse');
    allHeaders.forEach((header, index) => {
      if (index === 0) {
        header.classList.remove('collapsed'); // Primera sección abierta
      } else {
        header.classList.add('collapsed'); // Resto colapsadas
      }
    });
    
    if (prov.id) {
      cargarServicios(prov.id);
      cargarSucursales(prov.id);
      cargarContactos(prov.id);
    }
  }

  // Trae servicios desde /api/proveedores/:id/servicios y los
  // pinta en la tabla de la pestaña de servicios del modal.
  async function cargarServicios(provId) {
    if (!tbodyServicios) return;
    tbodyServicios.innerHTML = '';
    try {
      const res = await fetch(`/api/proveedores/${encodeURIComponent(provId)}/servicios`);
      if (!res.ok) throw new Error('Error al obtener servicios');
      const data = await res.json();
      (data || []).forEach(s => {
        const txtServicio = s.servicio || s.SERVICIO || '';
        const txtDescripcion = s.descripcion || s.DESCRIPCION || '';
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td>
            <button type="button" class="btn btn-icon" data-del-servicio="${s.id}">🗑</button>
          </td>
          <td>${txtServicio}</td>
          <td>${txtDescripcion}</td>
        `;
        tbodyServicios.appendChild(tr);
      });

      // Eventos de borrado de servicio por fila.
      tbodyServicios.querySelectorAll('[data-del-servicio]').forEach(btn => {
        btn.addEventListener('click', async (e) => {
          const id = btn.getAttribute('data-del-servicio');
          if (!id || !confirm('¿Eliminar servicio?')) return;
          try {
            await fetch(`/api/proveedores/${encodeURIComponent(provId)}/servicios/${encodeURIComponent(id)}`, { method: 'DELETE' });
            cargarServicios(provId);
          } catch (err) {
            console.error('Error eliminando servicio', err);
          }
        });
      });
    } catch (e) {
      console.error('Error cargando servicios', e);
    }
  }

  // Trae sucursales desde /api/proveedores/:id/sucursales.
  async function cargarSucursales(provId) {
    if (!tbodySucursales) return;
    tbodySucursales.innerHTML = '';
    try {
      const res = await fetch(`/api/proveedores/${encodeURIComponent(provId)}/sucursales`);
      if (!res.ok) throw new Error('Error al obtener sucursales');
      const data = await res.json();
      (data || []).forEach(s => {
        const txtTipo = s.tipo || s.TIPO || '';
        const txtNombre = s.nombre || s.NOMBRE || '';
        const txtPais = s.pais || s.PAIS || '';
        const txtEstado = s.estado || s.ESTADO || '';
        const txtMunicipio = s.municipio || s.MUNICIPIO || '';
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td>
            <button type="button" class="btn btn-icon" data-del-sucursal="${s.id}">🗑</button>
          </td>
          <td>${txtTipo}</td>
          <td>${txtNombre}</td>
          <td>${txtPais}</td>
          <td>${txtEstado}</td>
          <td>${txtMunicipio}</td>
        `;
        tbodySucursales.appendChild(tr);
      });

      // Eventos de borrado de sucursal.
      tbodySucursales.querySelectorAll('[data-del-sucursal]').forEach(btn => {
        btn.addEventListener('click', async () => {
          const id = btn.getAttribute('data-del-sucursal');
          if (!id || !confirm('¿Eliminar sucursal?')) return;
          try {
            await fetch(`/api/proveedores/${encodeURIComponent(provId)}/sucursales/${encodeURIComponent(id)}`, { method: 'DELETE' });
            cargarSucursales(provId);
          } catch (err) {
            console.error('Error eliminando sucursal', err);
          }
        });
      });
    } catch (e) {
      console.error('Error cargando sucursales', e);
    }
  }

  // Trae contactos desde /api/proveedores/:id/contactos.
  async function cargarContactos(provId) {
    if (!tbodyContactos) return;
    tbodyContactos.innerHTML = '';
    try {
      const res = await fetch(`/api/proveedores/${encodeURIComponent(provId)}/contactos`);
      if (!res.ok) throw new Error('Error al obtener contactos');
      const data = await res.json();
      (data || []).forEach(c => {
        const txtArea = c.area || c.AREA || '';
        const txtNombre = c.nombre || c.NOMBRE || '';
        const txtTel = c.telefono || c.TELEFONO || '';
        const txtCorreo = c.correo || c.CORREO || '';
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td>
            <button type="button" class="btn btn-icon" data-del-contacto="${c.id}">🗑</button>
          </td>
          <td>${txtArea}</td>
          <td>${txtNombre}</td>
          <td>${txtTel}</td>
          <td>${txtCorreo}</td>
        `;
        tbodyContactos.appendChild(tr);
      });

      // Eventos de borrado de contacto.
      tbodyContactos.querySelectorAll('[data-del-contacto]').forEach(btn => {
        btn.addEventListener('click', async () => {
          const id = btn.getAttribute('data-del-contacto');
          if (!id || !confirm('¿Eliminar contacto?')) return;
          try {
            await fetch(`/api/proveedores/${encodeURIComponent(provId)}/contactos/${encodeURIComponent(id)}`, { method: 'DELETE' });
            cargarContactos(provId);
          } catch (err) {
            console.error('Error eliminando contacto', err);
          }
        });
      });
    } catch (e) {
      console.error('Error cargando contactos', e);
    }
  }

  // Alta de servicio mediante formulario en modal secundario.
  if (btnNuevoServicio) {
    btnNuevoServicio.addEventListener('click', async () => {
      if (!inputId || !inputId.value) {
        const ensuredId = await ensureProveedorPersistido();
        if (!ensuredId) return;
      }
      abrirModalServicio();
    });
  }

  async function guardarServicioDetalle() {
    if (!inputId || !inputId.value) return;
    if (!inputSrvNombre) return;
    const servicio = inputSrvNombre.value.trim();
    const descripcion = (inputSrvDescripcion?.value || '').trim();
    if (!servicio) {
      alert('Captura el nombre del servicio.');
      return;
    }
    try {
      await fetch(`/api/proveedores/${encodeURIComponent(inputId.value)}/servicios`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ servicio, descripcion })
      });
      cerrarModalServicio();
      cargarServicios(inputId.value);
    } catch (e) {
      console.error('Error agregando servicio', e);
      alert('No se pudo agregar el servicio.');
    }
  }

  if (btnGuardarServicio) {
    btnGuardarServicio.addEventListener('click', guardarServicioDetalle);
  }
  if (formServicio) {
    formServicio.addEventListener('submit', (e) => {
      e.preventDefault();
      guardarServicioDetalle();
    });
  }

  // Alta de sucursal mediante formulario en modal secundario.
  if (btnNuevaSucursal) {
    btnNuevaSucursal.addEventListener('click', async () => {
      if (!inputId || !inputId.value) {
        const ensuredId = await ensureProveedorPersistido();
        if (!ensuredId) return;
      }
      abrirModalSucursal();
    });
  }

  async function guardarSucursalDetalle() {
    if (!inputId || !inputId.value) return;
    if (!inputSucNombre) return;
    const body = {
      id: `SUC-${Date.now()}`,
      tipo: (inputSucTipo?.value || '').trim() || 'Sucursal',
      nombre: inputSucNombre.value.trim(),
      pais: (inputSucPais?.value || '').trim(),
      estado: (inputSucEstado?.value || '').trim(),
      municipio: (inputSucMunicipio?.value || '').trim(),
      localidad: '',
      calle: '',
      colonia: '',
      cp: '',
      no_exterior: '',
      no_interior: '',
      codigo_colonia: '',
      codigo_localidad: ''
    };
    if (!body.nombre) {
      alert('Captura el nombre de la sucursal.');
      return;
    }
    try {
      await fetch(`/api/proveedores/${encodeURIComponent(inputId.value)}/sucursales`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      cerrarModalSucursal();
      cargarSucursales(inputId.value);
    } catch (e) {
      console.error('Error agregando sucursal', e);
      alert('No se pudo agregar la sucursal.');
    }
  }

  if (btnGuardarSucursal) {
    btnGuardarSucursal.addEventListener('click', guardarSucursalDetalle);
  }
  if (formSucursal) {
    formSucursal.addEventListener('submit', (e) => {
      e.preventDefault();
      guardarSucursalDetalle();
    });
  }

  // Alta de contacto mediante formulario en modal secundario.
  if (btnNuevoContacto) {
    btnNuevoContacto.addEventListener('click', async () => {
      if (!inputId || !inputId.value) {
        const ensuredId = await ensureProveedorPersistido();
        if (!ensuredId) return;
      }
      abrirModalContacto();
    });
  }

  async function guardarContactoDetalle() {
    if (!inputId || !inputId.value) return;
    if (!inputCtoNombre) return;
    const body = {
      id: `CTO-${Date.now()}`,
      area: (inputCtoArea?.value || '').trim(),
      nombre: inputCtoNombre.value.trim(),
      telefono: (inputCtoTelefono?.value || '').trim(),
      ext: '',
      correo: (inputCtoCorreo?.value || '').trim(),
      dato1: '',
      dato2: ''
    };
    if (!body.nombre) {
      alert('Captura el nombre del contacto.');
      return;
    }
    try {
      await fetch(`/api/proveedores/${encodeURIComponent(inputId.value)}/contactos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      cerrarModalContacto();
      cargarContactos(inputId.value);
    } catch (e) {
      console.error('Error agregando contacto', e);
      alert('No se pudo agregar el contacto.');
    }
  }

  if (btnGuardarContacto) {
    btnGuardarContacto.addEventListener('click', guardarContactoDetalle);
  }
  if (formContacto) {
    formContacto.addEventListener('submit', (e) => {
      e.preventDefault();
      guardarContactoDetalle();
    });
  }

  // Botón "Nuevo proveedor" abre el formulario modal en blanco.
  const btnNuevo = document.getElementById('btnNuevoProveedor');
  if (btnNuevo) {
    btnNuevo.addEventListener('click', abrirModalNuevo);
  }

  // Al hacer clic en una fila de proveedor, se abre el modal en modo edición.
  function wireRowClicks() {
    if (!ProveedoresDOM.listaProveedores) return;
    Array.from(ProveedoresDOM.listaProveedores.querySelectorAll('.data-row')).forEach((row, idx) => {
      const prov = (function() {
        const term = (ProveedoresDOM.txtBuscar?.value || '').toLowerCase();
        const filtrados = proveedores.filter(p => {
          const texto = `${p.codigo || ''} ${p.nombre || ''} ${p.rfc || ''}`.toLowerCase();
          return texto.includes(term);
        });
        return filtrados[idx];
      })();
      if (!prov) return;
      row.style.cursor = 'pointer';
      row.addEventListener('click', () => abrirModalEditar(prov));
    });
  }

  // Re-wire row clicks después de cada render para que no se pierdan
  // los eventos al reconstruir la lista de proveedores.
  const oldRenderLista = renderLista;
  renderLista = function(filtro = '') {
    oldRenderLista(filtro);
    wireRowClicks();
  };

  // ========================================
  // FUNCIONALIDAD DE REDIMENSIONAMIENTO DE COLUMNAS (DRAG-TO-RESIZE)
  // ========================================
  const STORAGE_KEY_COLUMN_WIDTHS = 'PROV_COLUMN_WIDTHS_V3';  // ✅ v3: por nombre de columna
  const DEFAULT_MIN_WIDTH = 120;   // Ancho mínimo por defecto
  const MIN_WIDTH = 90;             // Mínimo permitido (garantiza que la línea divisoria sea visible)
  const MAX_WIDTH = 600;            // Máximo permitido

  // ✅ FUNCIÓN GLOBAL: Medir ancho de texto usando canvas (muy preciso)
  function medirAnchoPx(texto, fontSize = '13px', fontWeight = '700', fontFamily = "'Geneva', Tahoma, Verdana") {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    ctx.font = `${fontWeight} ${fontSize} ${fontFamily}`;
    const metrics = ctx.measureText(texto);
    return Math.ceil(metrics.width) + 24; // +24px para padding + margen de seguridad
  }

  // ✅ FUNCIÓN GLOBAL: Calcular anchos dinámicamente basados en contenido
  function calcularAnchosOptimos(columnasVisibles, dataRows, headers) {
    const anchosCalculados = {};
    
    columnasVisibles.forEach((colNombre, colIndex) => {
      let maxAncho = 0;
      
      // 1️⃣ Obtener ancho del encabezado (MÍNIMO)
      const headerCell = headers[colIndex];
      let anchoEncabezado = 0;
      if (headerCell) {
        const textEncabezado = headerCell.textContent.trim();
        anchoEncabezado = medirAnchoPx(textEncabezado, '13px', '700');
        console.log(`📏 Header [${colNombre}]: "${textEncabezado}" = ${anchoEncabezado}px`);
        maxAncho = Math.max(maxAncho, anchoEncabezado);
      }
      
      // 2️⃣ Obtener ancho del texto más largo en los datos (MÁXIMO)
      dataRows.forEach((row) => {
        const dataCell = row.querySelectorAll('.data-cell')[colIndex];
        if (dataCell) {
          const textoDato = dataCell.textContent.trim();
          if (textoDato) {
            const anchoDato = medirAnchoPx(textoDato, '12px', '500');
            maxAncho = Math.max(maxAncho, anchoDato);
          }
        }
      });
      
      // 3️⃣ Aplicar límites MIN y MAX
      maxAncho = Math.max(maxAncho, MIN_WIDTH);
      maxAncho = Math.min(maxAncho, MAX_WIDTH);
      
      anchosCalculados[colNombre] = maxAncho;
      console.log(`✓ Ancho final [${colNombre}]: ${maxAncho}px (min: ${anchoEncabezado}px)`);
    });
    
    return anchosCalculados;
  }

  // Inicializar anchos de columnas con valores mínimos por defecto (OBJETO por nombre de columna)
  function obtenerAnchosDefault() {
    // Retornar objeto vacío - se llenará dinámicamente según columnas visibles
    return {};
  }

  // Obtener ancho para una columna específica
  function obtenerAnchosParaColumnasVisibles(columnasVisibles) {
    const anchosGuardados = restaurarAnchosColumnas() || {};
    const anchos = [];
    
    console.log('📐 Obteniendo anchos para columnas:', columnasVisibles);
    console.log('📦 Anchos guardados en localStorage:', anchosGuardados);
    
    columnasVisibles.forEach(colNombre => {
      // Si existe ancho guardado para esta columna, usarlo; si no, usar default
      const ancho = anchosGuardados[colNombre] || DEFAULT_MIN_WIDTH;
      console.log(`  - ${colNombre}: ${ancho}px`);
      anchos.push(ancho);
    });
    
    console.log('📊 Array de anchos final:', anchos);
    return anchos;
  }

  // Guardar anchos de columnas en localStorage (por nombre de columna)
  function guardarAnchosColumnas(columnasVisibles, anchos) {
    const anchosMap = {};
    columnasVisibles.forEach((colNombre, idx) => {
      anchosMap[colNombre] = anchos[idx];
    });
    localStorage.setItem(STORAGE_KEY_COLUMN_WIDTHS, JSON.stringify(anchosMap));
    console.log('✓ Anchos de columnas guardados:', anchosMap);
  }

  // Restaurar anchos de columnas desde localStorage (objeto por nombre de columna)
  function restaurarAnchosColumnas() {
    const almacenados = localStorage.getItem(STORAGE_KEY_COLUMN_WIDTHS);
    if (!almacenados) return null;
    
    try {
      return JSON.parse(almacenados);
    } catch (e) {
      console.warn('⚠️ Error restaurando anchos:', e);
      return null;
    }
  }

  // Aplicar anchos a la tabla (en píxeles, como Excel)
  function aplicarAnchosColumnas(anchos) {
    if (!ProveedoresDOM.listaProveedores) return;
    
    // Usar píxeles directamente (como en Excel)
    // Cuando ajustas el ancho de una columna, solo esa columna se expande
    // Las demás mantienen su tamaño original
    // La tabla se expande horizontalmente si es necesario
    const gridTemplate = anchos.map(w => `${w}px`).join(' ');
    ProveedoresDOM.listaProveedores.style.gridTemplateColumns = gridTemplate;
    console.log('✓ Grid aplicado en píxeles:', gridTemplate);
    console.log('✓ Anchos:', anchos.map(a => Math.round(a) + 'px').join(', '));
  }

  // Inicializar el sistema de arrastres
  function inicializarRedimensionamiento() {
    if (!ProveedoresDOM.listaProveedores) return;

    // Obtener las celdas de encabezado
    let headerCells = ProveedoresDOM.listaProveedores.querySelectorAll('.header-cell');
    if (headerCells.length === 0) return;

    // Obtener columnas visibles del metadata
    const columnasVisibles = metadataTabla?.columnas_visibles || [];

    // ✅ IMPORTANTE: Limpiar separadores antiguos antes de crear nuevos (evita duplicación al reordenar)
    headerCells.forEach(header => {
      const oldSeparator = header.querySelector('div[style*="col-resize"]');
      if (oldSeparator) {
        oldSeparator.remove();
      }
    });

    // Re-obtener headers después de limpiar
    headerCells = ProveedoresDOM.listaProveedores.querySelectorAll('.header-cell');

    headerCells.forEach((header, colIndex) => {
      const colNombre = columnasVisibles[colIndex];  // ✅ Obtener nombre de la columna
      
      // Crear separador visual al lado del header (excepto el último)
      if (colIndex < headerCells.length - 1) {
        const separator = document.createElement('div');
        separator.style.position = 'absolute';
        separator.style.right = '-4px';  // Sobresale del header para siempre ser visible
        separator.style.top = '0';
        separator.style.width = '8px';   // Área más grande para mejor interacción
        separator.style.height = '100%';
        separator.style.cursor = 'col-resize';
        separator.style.backgroundColor = 'rgba(0,0,0,0)';
        separator.style.transition = 'backgroundColor 0.2s';
        separator.style.zIndex = '5';    // Asegura que esté encima de contenido
        
        // Mostrar separador en hover con línea más visible
        separator.addEventListener('mouseenter', () => {
          separator.style.backgroundColor = 'rgba(100, 150, 255, 0.5)';
        });

        separator.addEventListener('mouseleave', () => {
          separator.style.backgroundColor = 'rgba(0,0,0,0)';
        });

        // Drag para redimensionar (TIPO EXCEL: solo la columna se expande, las demás no se mueven)
        separator.addEventListener('mousedown', (e) => {
          e.preventDefault();
          
          // ✅ Parsear correctamente los valores px del gridTemplate
          const gridTemplate = ProveedoresDOM.listaProveedores.style.gridTemplateColumns;
          let anchosActuales = [];
          
          if (gridTemplate && gridTemplate.includes('px')) {
            // Extraer píxeles directamente
            anchosActuales = gridTemplate.split(' ').map(v => parseFloat(v));
          } else if (gridTemplate && gridTemplate.includes('fr')) {
            // Si está en fr (de recarga anterior), convertir a píxeles
            const containerWidth = ProveedoresDOM.listaProveedores.offsetWidth;
            const frValues = gridTemplate.split(' ').map(v => parseFloat(v));
            const totalFr = frValues.reduce((a, b) => a + b, 0);
            anchosActuales = frValues.map(fr => (fr / totalFr) * containerWidth);
          } else {
            // Si no hay template, obtener del localStorage
            anchosActuales = obtenerAnchosParaColumnasVisibles(columnasVisibles);
          }

          const startX = e.pageX;
          const startWidth = anchosActuales[colIndex];

          function handleMouseMove(moveEvent) {
            const diff = moveEvent.pageX - startX;
            let nuevoAncho = startWidth + diff;

            // Aplicar límites
            nuevoAncho = Math.max(MIN_WIDTH, Math.min(MAX_WIDTH, nuevoAncho));

            // ⭐ TIPO EXCEL: Solo actualizar esta columna, las demás no cambian
            anchosActuales[colIndex] = nuevoAncho;

            // Aplicar cambios (mantiene píxeles)
            aplicarAnchosColumnas(anchosActuales);
          }

          function handleMouseUp() {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
            
            // Guardar cambios en localStorage (como píxeles)
            guardarAnchosColumnas(columnasVisibles, anchosActuales);
            console.log('✅ Anchos guardados (tipo Excel):', anchosActuales.map(a => Math.round(a) + 'px').join(', '));
          }

          document.addEventListener('mousemove', handleMouseMove);
          document.addEventListener('mouseup', handleMouseUp);
        });

        header.appendChild(separator);
      }
    });
  }

  // Inicializar anchos al cargar
  function inicializarColumnasProveedores() {
    // Obtener columnas visibles del metadata
    const columnasVisibles = metadataTabla?.columnas_visibles || [];
    
    const grid = ProveedoresDOM.listaProveedores;
    if (!grid) return;
    
    // 1️⃣ Calcular anchos óptimos basados en contenido (mín=encabezado, máx=dato más largo)
    const headers = grid.querySelectorAll('.header-cell');
    const dataRows = grid.querySelectorAll('.data-row');
    
    if (headers.length > 0 && dataRows.length > 0) {
      console.log('\n🔍 Calculando anchos óptimos basados en contenido...');
      const anchosOptimos = calcularAnchosOptimos(columnasVisibles, dataRows, headers);
      
      // 2️⃣ Guardar los anchos calculados en localStorage (para que persistan)
      localStorage.setItem(STORAGE_KEY_COLUMN_WIDTHS, JSON.stringify(anchosOptimos));
      console.log('✅ Anchos óptimos guardados en localStorage:', anchosOptimos);
      
      // 3️⃣ Convertir a array en el orden correcto
      const anchos = columnasVisibles.map(col => anchosOptimos[col] || DEFAULT_MIN_WIDTH);
      
      // 4️⃣ Aplicar anchos a la tabla
      aplicarAnchosColumnas(anchos);
    } else {
      // Si no hay datos aún, usar el método anterior
      console.log('⚠️ No hay headers o datos, usando anchos guardados');
      const anchos = obtenerAnchosParaColumnasVisibles(columnasVisibles);
      aplicarAnchosColumnas(anchos);
    }
    
    // Inicializar redimensionamiento después de que se cargue la tabla
    setTimeout(() => {
      inicializarRedimensionamiento();
    }, 100);
  }

  // Reinicializar redimensionamiento después de cada render
  const originalCargarProveedores = cargarProveedores;
  cargarProveedores = async function() {
    await originalCargarProveedores.call(this);
    setTimeout(() => {
      inicializarRedimensionamiento();
      inicializarColumnasProveedores();
    }, 100);
  };

  // ========================================
  // FUNCIONALIDAD DE EXPORTAR/IMPORTAR
  // ========================================
  
  // Variables para el modal de exportación
  const modalExportarTablas = document.getElementById('modalExportarTablas');
  const btnCerrarModalExport = document.getElementById('btnCerrarModalExport');
  const btnCancelarExport = document.getElementById('btnCancelarExport');
  const btnConfirmarExport = document.getElementById('btnConfirmarExport');
  const chkExportProveedores = document.getElementById('chkExportProveedores');
  const chkExportServicios = document.getElementById('chkExportServicios');
  const chkExportSucursales = document.getElementById('chkExportSucursales');
  const chkExportContactos = document.getElementById('chkExportContactos');

  // Cerrar modal de exportación
  if (btnCerrarModalExport) {
    btnCerrarModalExport.addEventListener('click', () => {
      if (modalExportarTablas) modalExportarTablas.style.display = 'none';
    });
  }
  if (btnCancelarExport) {
    btnCancelarExport.addEventListener('click', () => {
      if (modalExportarTablas) modalExportarTablas.style.display = 'none';
    });
  }

  // Función para obtener todos los datos relacionados a un proveedor
  async function obtenerDatosRelacionados(provId) {
    const datos = {
      servicios: [],
      sucursales: [],
      contactos: []
    };

    try {
      if (chkExportServicios && chkExportServicios.checked) {
        const resServ = await fetch(`/api/proveedores/${encodeURIComponent(provId)}/servicios`).catch(() => null);
        if (resServ && resServ.ok) {
          datos.servicios = await resServ.json();
        }
      }

      if (chkExportSucursales && chkExportSucursales.checked) {
        const resSuc = await fetch(`/api/proveedores/${encodeURIComponent(provId)}/sucursales`).catch(() => null);
        if (resSuc && resSuc.ok) {
          datos.sucursales = await resSuc.json();
        }
      }

      if (chkExportContactos && chkExportContactos.checked) {
        const resCont = await fetch(`/api/proveedores/${encodeURIComponent(provId)}/contactos`).catch(() => null);
        if (resCont && resCont.ok) {
          datos.contactos = await resCont.json();
        }
      }
    } catch (e) {
      console.warn('Error obteniendo datos relacionados:', e);
    }

    return datos;
  }

  // Función para exportar proveedores con tablas seleccionadas
  async function realizarExportacion() {
    if (!proveedores || proveedores.length === 0) {
      alert('No hay proveedores para exportar.');
      return;
    }

    mostrarLoading(true);

    try {
      const wb = XLSX.utils.book_new();

      // HOJA 1: PROVEEDORES
      if (chkExportProveedores && chkExportProveedores.checked) {
        const datosProveedores = proveedores.map(prov => ({
          ID: prov.id || '',
          CÓDIGO: prov.codigo || '',
          NOMBRE: prov.nombre || '',
          RFC: prov.rfc || '',
          DIRECCIÓN: prov.direccion || '',
          ACTIVO: prov.activo ? 'Sí' : 'No',
          'FECHA REGISTRO': prov.fecha_registro || ''
        }));

        const wsProveedores = XLSX.utils.json_to_sheet(datosProveedores);
        wsProveedores['!cols'] = [
          { wch: 8 }, { wch: 12 }, { wch: 25 }, 
          { wch: 15 }, { wch: 30 }, { wch: 10 }, { wch: 15 }
        ];
        XLSX.utils.book_append_sheet(wb, wsProveedores, 'Proveedores');
      }

      // HOJAS 2-4: SERVICIOS, SUCURSALES, CONTACTOS
      if (chkExportServicios && chkExportServicios.checked) {
        const datosServicios = [];
        for (const prov of proveedores) {
          const datos = await obtenerDatosRelacionados(prov.id);
          datos.servicios.forEach(s => {
            datosServicios.push({
              'PROVEEDOR ID': prov.id || '',
              'PROVEEDOR': prov.nombre || '',
              'SERVICIO': s.servicio || '',
              'DESCRIPCIÓN': s.descripcion || ''
            });
          });
        }

        if (datosServicios.length > 0) {
          const wsServicios = XLSX.utils.json_to_sheet(datosServicios);
          wsServicios['!cols'] = [
            { wch: 12 }, { wch: 25 }, { wch: 20 }, { wch: 30 }
          ];
          XLSX.utils.book_append_sheet(wb, wsServicios, 'Servicios');
        }
      }

      if (chkExportSucursales && chkExportSucursales.checked) {
        const datosSucursales = [];
        for (const prov of proveedores) {
          const datos = await obtenerDatosRelacionados(prov.id);
          datos.sucursales.forEach(s => {
            datosSucursales.push({
              'PROVEEDOR ID': prov.id || '',
              'PROVEEDOR': prov.nombre || '',
              'TIPO': s.tipo || '',
              'NOMBRE': s.nombre || '',
              'PAÍS': s.pais || '',
              'ESTADO': s.estado || '',
              'MUNICIPIO': s.municipio || ''
            });
          });
        }

        if (datosSucursales.length > 0) {
          const wsSucursales = XLSX.utils.json_to_sheet(datosSucursales);
          wsSucursales['!cols'] = [
            { wch: 12 }, { wch: 25 }, { wch: 12 }, 
            { wch: 20 }, { wch: 12 }, { wch: 12 }, { wch: 15 }
          ];
          XLSX.utils.book_append_sheet(wb, wsSucursales, 'Sucursales');
        }
      }

      if (chkExportContactos && chkExportContactos.checked) {
        const datosContactos = [];
        for (const prov of proveedores) {
          const datos = await obtenerDatosRelacionados(prov.id);
          datos.contactos.forEach(c => {
            datosContactos.push({
              'PROVEEDOR ID': prov.id || '',
              'PROVEEDOR': prov.nombre || '',
              'ÁREA': c.area || '',
              'NOMBRE': c.nombre || '',
              'TELÉFONO': c.telefono || '',
              'CORREO': c.correo || ''
            });
          });
        }

        if (datosContactos.length > 0) {
          const wsContactos = XLSX.utils.json_to_sheet(datosContactos);
          wsContactos['!cols'] = [
            { wch: 12 }, { wch: 25 }, { wch: 15 }, 
            { wch: 20 }, { wch: 15 }, { wch: 25 }
          ];
          XLSX.utils.book_append_sheet(wb, wsContactos, 'Contactos');
        }
      }

      // Descargar Excel
      const nombreArchivo = `proveedores_${new Date().toISOString().split('T')[0]}.xlsx`;
      XLSX.writeFile(wb, nombreArchivo);

      alert('✓ Exportación completada correctamente.');
    } catch (e) {
      console.error('Error en exportación:', e);
      alert('Error en la exportación: ' + e.message);
    } finally {
      mostrarLoading(false);
      if (modalExportarTablas) modalExportarTablas.style.display = 'none';
    }
  }

  // Event listener para confirmar exportación
  if (btnConfirmarExport) {
    btnConfirmarExport.addEventListener('click', realizarExportacion);
  }

  // Función para exportar proveedores (abre el modal de selección)
  function exportarProveedores() {
    if (!proveedores || proveedores.length === 0) {
      alert('No hay proveedores para exportar.');
      return;
    }

    // Mostrar modal de selección
    if (modalExportarTablas) {
      modalExportarTablas.style.display = 'flex';
    }
  }

  // Variables para el modal de importación
  const modalImportarTablas = document.getElementById('modalImportarTablas');
  const btnCerrarModalImport = document.getElementById('btnCerrarModalImport');
  const btnCancelarImport = document.getElementById('btnCancelarImport');
  const btnConfirmarImport = document.getElementById('btnConfirmarImport');

  // Cerrar modal de importación
  if (btnCerrarModalImport) {
    btnCerrarModalImport.addEventListener('click', () => {
      if (modalImportarTablas) modalImportarTablas.style.display = 'none';
    });
  }
  if (btnCancelarImport) {
    btnCancelarImport.addEventListener('click', () => {
      if (modalImportarTablas) modalImportarTablas.style.display = 'none';
    });
  }

  // Función para procesar importación de Proveedores
  async function procesarImportacionProveedores(datosImportar) {
    let exitosos = 0;
    let errores = 0;
    const detalles = [];

    for (const prov of datosImportar) {
      try {
        const body = {
          codigo: prov.CÓDIGO || prov.codigo || '',
          nombre: prov.NOMBRE || prov.nombre || '',
          rfc: prov.RFC || prov.rfc || '',
          direccion: prov.DIRECCIÓN || prov.direccion || '',
          activo: prov.ACTIVO === 'Sí' || prov.ACTIVO === 'SI' || prov.ACTIVO === 1 ? 1 : 0
        };

        const response = await fetch('/api/proveedores', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body)
        });

        if (response.ok) {
          exitosos++;
          detalles.push(`✓ ${body.nombre}`);
        } else {
          errores++;
          detalles.push(`✗ ${body.nombre}`);
        }
      } catch (e) {
        console.error('Error importando proveedor:', e);
        errores++;
        detalles.push(`✗ Error: ${e.message}`);
      }
    }

    await cargarProveedores();
    return { exitosos, errores, detalles };
  }

  // Función para procesar importación de Servicios
  async function procesarImportacionServicios(datosImportar) {
    let exitosos = 0;
    let errores = 0;

    for (const serv of datosImportar) {
      try {
        const provId = serv['PROVEEDOR ID'] || serv['proveedor_id'];
        if (!provId) {
          errores++;
          continue;
        }

        const body = {
          servicio: serv.SERVICIO || serv.servicio || '',
          descripcion: serv.DESCRIPCIÓN || serv.descripcion || ''
        };

        const response = await fetch(`/api/proveedores/${encodeURIComponent(provId)}/servicios`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body)
        });

        if (response.ok) {
          exitosos++;
        } else {
          errores++;
        }
      } catch (e) {
        console.error('Error importando servicio:', e);
        errores++;
      }
    }

    return { exitosos, errores };
  }

  // Función para procesar importación de Sucursales
  async function procesarImportacionSucursales(datosImportar) {
    let exitosos = 0;
    let errores = 0;

    for (const suc of datosImportar) {
      try {
        const provId = suc['PROVEEDOR ID'] || suc['proveedor_id'];
        if (!provId) {
          errores++;
          continue;
        }

        const body = {
          tipo: suc.TIPO || suc.tipo || '',
          nombre: suc.NOMBRE || suc.nombre || '',
          pais: suc.PAÍS || suc.pais || '',
          estado: suc.ESTADO || suc.estado || '',
          municipio: suc.MUNICIPIO || suc.municipio || ''
        };

        const response = await fetch(`/api/proveedores/${encodeURIComponent(provId)}/sucursales`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body)
        });

        if (response.ok) {
          exitosos++;
        } else {
          errores++;
        }
      } catch (e) {
        console.error('Error importando sucursal:', e);
        errores++;
      }
    }

    return { exitosos, errores };
  }

  // Función para procesar importación de Contactos
  async function procesarImportacionContactos(datosImportar) {
    let exitosos = 0;
    let errores = 0;

    for (const cont of datosImportar) {
      try {
        const provId = cont['PROVEEDOR ID'] || cont['proveedor_id'];
        if (!provId) {
          errores++;
          continue;
        }

        const body = {
          area: cont.ÁREA || cont.area || '',
          nombre: cont.NOMBRE || cont.nombre || '',
          telefono: cont.TELÉFONO || cont.telefono || '',
          correo: cont.CORREO || cont.correo || ''
        };

        const response = await fetch(`/api/proveedores/${encodeURIComponent(provId)}/contactos`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body)
        });

        if (response.ok) {
          exitosos++;
        } else {
          errores++;
        }
      } catch (e) {
        console.error('Error importando contacto:', e);
        errores++;
      }
    }

    return { exitosos, errores };
  }

  // Función para importar con procesamiento según tabla seleccionada
  async function procesarImportacion(tablaSeleccionada, file) {
    let datosImportar = [];

    try {
      mostrarLoading(true);

      // Si es Excel
      if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
        const arrayBuffer = await file.arrayBuffer();
        const workbook = XLSX.read(arrayBuffer, { type: 'array' });
        const hojaSeleccionada = tablaSeleccionada.charAt(0).toUpperCase() + tablaSeleccionada.slice(1);
        const worksheet = workbook.Sheets[hojaSeleccionada] || workbook.Sheets[workbook.SheetNames[0]];
        datosImportar = XLSX.utils.sheet_to_json(worksheet);
      } 
      // Si es JSON
      else if (file.name.endsWith('.json')) {
        const fileContent = await file.text();
        const data = JSON.parse(fileContent);
        datosImportar = Array.isArray(data) ? data : (data[tablaSeleccionada] || []);
      } else {
        alert('Por favor selecciona un archivo .xlsx, .xls o .json');
        return;
      }

      if (datosImportar.length === 0) {
        alert('El archivo no contiene datos para importar.');
        return;
      }

      // Confirmar importación
      const confirmar = confirm(
        `Se importarán ${datosImportar.length} registros de ${tablaSeleccionada}.\\n\\n¿Deseas continuar?`
      );

      if (!confirmar) {
        mostrarLoading(false);
        return;
      }

      // Procesar según tabla seleccionada
      let resultado = {};
      switch (tablaSeleccionada) {
        case 'proveedores':
          resultado = await procesarImportacionProveedores(datosImportar);
          break;
        case 'servicios':
          resultado = await procesarImportacionServicios(datosImportar);
          break;
        case 'sucursales':
          resultado = await procesarImportacionSucursales(datosImportar);
          break;
        case 'contactos':
          resultado = await procesarImportacionContactos(datosImportar);
          break;
      }

      mostrarLoading(false);

      // Mostrar resultado
      const mensaje = `✓ Importación de ${tablaSeleccionada} completada:
- Exitosos: ${resultado.exitosos}
- Errores: ${resultado.errores}`;

      alert(mensaje);

    } catch (e) {
      mostrarLoading(false);
      console.error('Error al importar:', e);
      alert('Error al procesar el archivo: ' + e.message);
    }
  }

  // Función para importar proveedores (abre el modal de selección)
  function importarProveedores() {
    // Mostrar modal de selección
    if (modalImportarTablas) {
      modalImportarTablas.style.display = 'flex';
    }
  }

  // Función para procesar importación de múltiples tablas desde un mismo archivo
  async function procesarImportacionMultiple(tablasSeleccionadas, file) {
    const resultadosGlobales = {
      proveedores: { exitosos: 0, errores: 0 },
      servicios: { exitosos: 0, errores: 0 },
      sucursales: { exitosos: 0, errores: 0 },
      contactos: { exitosos: 0, errores: 0 }
    };

    try {
      mostrarLoading(true);

      // Cargar archivo una sola vez
      let workbook = null;

      if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
        const arrayBuffer = await file.arrayBuffer();
        workbook = XLSX.read(arrayBuffer, { type: 'array' });
      } else if (file.name.endsWith('.json')) {
        const fileContent = await file.text();
        workbook = JSON.parse(fileContent);
      } else {
        alert('Por favor selecciona un archivo .xlsx, .xls o .json');
        return;
      }

      // Procesar cada tabla seleccionada
      for (const tabla of tablasSeleccionadas) {
        let datosImportar = [];

        // Obtener datos según tipo de archivo
        if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
          const hojaSeleccionada = tabla.charAt(0).toUpperCase() + tabla.slice(1);
          const worksheet = workbook.Sheets[hojaSeleccionada];
          
          if (!worksheet) {
            console.warn(`Hoja "${hojaSeleccionada}" no encontrada`);
            continue;
          }
          
          datosImportar = XLSX.utils.sheet_to_json(worksheet);
        } else {
          // JSON
          datosImportar = Array.isArray(workbook[tabla]) ? workbook[tabla] : 
                         (Array.isArray(workbook) ? workbook : []);
        }

        if (datosImportar.length === 0) {
          continue;
        }

        // Procesar según tabla
        let resultado = {};
        switch (tabla) {
          case 'proveedores':
            resultado = await procesarImportacionProveedores(datosImportar);
            break;
          case 'servicios':
            resultado = await procesarImportacionServicios(datosImportar);
            break;
          case 'sucursales':
            resultado = await procesarImportacionSucursales(datosImportar);
            break;
          case 'contactos':
            resultado = await procesarImportacionContactos(datosImportar);
            break;
        }

        resultadosGlobales[tabla] = resultado;
      }

      mostrarLoading(false);

      // Generar mensaje de resultado
      let mensajeResultado = '✓ Importación completada:\n\n';
      let totalExitosos = 0;
      let totalErrores = 0;

      for (const tabla of tablasSeleccionadas) {
        const res = resultadosGlobales[tabla];
        mensajeResultado += `${tabla.charAt(0).toUpperCase() + tabla.slice(1)}: ${res.exitosos} ✓ / ${res.errores} ✗\n`;
        totalExitosos += res.exitosos;
        totalErrores += res.errores;
      }

      mensajeResultado += `\nTotal: ${totalExitosos} exitosos, ${totalErrores} errores`;
      alert(mensajeResultado);

    } catch (e) {
      mostrarLoading(false);
      console.error('Error al importar:', e);
      alert('Error al procesar el archivo: ' + e.message);
    }
  }

  // Event listener para confirmar importación
  if (btnConfirmarImport) {
    btnConfirmarImport.addEventListener('click', () => {
      const chkProveedores = document.getElementById('chkImportProveedores');
      const chkServicios = document.getElementById('chkImportServicios');
      const chkSucursales = document.getElementById('chkImportSucursales');
      const chkContactos = document.getElementById('chkImportContactos');

      const tablasSeleccionadas = [];
      if (chkProveedores && chkProveedores.checked) tablasSeleccionadas.push('proveedores');
      if (chkServicios && chkServicios.checked) tablasSeleccionadas.push('servicios');
      if (chkSucursales && chkSucursales.checked) tablasSeleccionadas.push('sucursales');
      if (chkContactos && chkContactos.checked) tablasSeleccionadas.push('contactos');

      if (tablasSeleccionadas.length === 0) {
        alert('Por favor selecciona al menos una tabla.');
        return;
      }

      // Cerrar modal
      if (modalImportarTablas) modalImportarTablas.style.display = 'none';

      // Abrir selector de archivo
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.xlsx,.xls,.json';

      input.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        
        // Confirmar importación
        const confirmar = confirm(
          `Se importarán datos de ${tablasSeleccionadas.length} tabla(s).\\n\\n¿Deseas continuar?`
        );

        if (confirmar) {
          await procesarImportacionMultiple(tablasSeleccionadas, file);
        }
      });

      input.click();
    });
  }

  // Agregar event listeners a los botones
  const btnExportar = document.getElementById('btnExportarProveedores');
  const btnImportar = document.getElementById('btnImportarProveedores');

  if (btnExportar) {
    btnExportar.addEventListener('click', exportarProveedores);
  }

  if (btnImportar) {
    btnImportar.addEventListener('click', importarProveedores);
  }

  // Carga inicial
  // ✅ EXPONER FUNCIONES GLOBALMENTE (necesarias para los event listeners)
  window.renderListaProveedores = renderLista;
  window.ordenarPorColumnaProveedores = ordenarPorColumna;
  window.reordenarColumnasProveedores = reordenarColumnasProveedores;
  window.cargarProveedoresFunc = cargarProveedores;

  // Inicializar sistema de columnas
  inicializarColumnasProveedores();
  
  cargarProveedores();
});
