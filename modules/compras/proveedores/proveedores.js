// Módulo de Proveedores (Compras)
// -------------------------------
// Controla la pantalla de catálogo de proveedores:
//  - Carga la lista desde la API /api/proveedores.
//  - Aplica filtro de texto en memoria.
//  - Abre un modal para alta/edición de proveedor.
//  - Gestiona servicios, sucursales y contactos asociados vía API.

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
  const modal = document.getElementById('modalProveedor');
  const tituloModal = document.getElementById('tituloModalProveedor');
  const btnCerrarModal = document.getElementById('btnCerrarModalProveedor');
  const btnGuardar = document.getElementById('btnGuardarProveedor');
  const btnCancelar = document.getElementById('btnCancelarProveedor');
  const form = document.getElementById('formProveedor');
  const inputId = document.getElementById('provId');
  const inputIdVisible = document.getElementById('provIdVisible');
  const inputCodigo = document.getElementById('provCodigo');
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
  let proveedores = [];
  let soloActivos = false; // reservado para filtrar solo activos más adelante

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
    if (!loading) return;
    loading.style.display = show ? 'flex' : 'none';
  }

  // Dibuja la lista de proveedores en el contenedor principal.
  // Aplica un filtro de texto (por código, nombre o RFC) en memoria.
  function renderLista(filtro = '') {
    if (!listaProveedores) return;
    const term = (filtro || '').toLowerCase();
    const filtrados = proveedores.filter(p => {
      const texto = `${p.codigo || ''} ${p.nombre || ''} ${p.rfc || ''}`.toLowerCase();
      const coincideTexto = texto.includes(term);
      // si en el futuro quieres volver a filtrar por activos, puedes reusar soloActivos aquí
      return coincideTexto;
    });

    listaProveedores.innerHTML = '';

    if (filtrados.length === 0) {
      const vacio = document.createElement('div');
      vacio.className = 'tabla-vacia';
      vacio.textContent = 'No hay proveedores para mostrar.';
      listaProveedores.appendChild(vacio);
    } else {
      filtrados.forEach(p => {
        const row = document.createElement('div');
        row.className = 'table-row proveedor-row';
        row.innerHTML = `
          <div class="col-codigo">${p.codigo || ''}</div>
          <div class="col-nombre">${p.nombre || ''}</div>
          <div class="col-rfc">${p.rfc || ''}</div>
          <div class="col-activo">${p.activo ? 'Activo' : 'Inactivo'}</div>
        `;
        listaProveedores.appendChild(row);
      });
    }

    // Se recalculan totales de activos/inactivos en base al filtrado.
    const activos = filtrados.filter(p => p.activo).length;
    const inactivos = filtrados.length - activos;

    if (lblActivos) lblActivos.textContent = activos;
    if (lblInactivos) lblInactivos.textContent = inactivos;
    if (lblMostrando) lblMostrando.textContent = `Mostrando ${filtrados.length} de ${proveedores.length}`;
  }

  // Llama al backend para obtener la lista de proveedores
  // y la adapta a la estructura usada en el frontend.
  async function cargarProveedores() {
    try {
      mostrarLoading(true);
      const res = await fetch('/api/proveedores');
      if (!res.ok) throw new Error('Error al obtener proveedores');
      const data = await res.json();

      // Adaptar estructura desde API (solo datos fiscales + activo)
      proveedores = (data || []).map(p => ({
        id: p.id,
        codigo: p.codigo,
        nombre: p.nombre,
        rfc: p.rfc,
        direccion: p.direccion,
        fecha_registro: p.fecha_registro,
        activo: p.activo === true || p.activo === 1
      }));

      renderLista(txtBuscar ? txtBuscar.value : '');
    } catch (e) {
      console.error('Error cargando proveedores', e);
    } finally {
      mostrarLoading(false);
    }
  }

  // Eventos de barra superior (refrescar + búsqueda).
  if (btnRefrescar) btnRefrescar.addEventListener('click', cargarProveedores);
  if (btnBuscar && txtBuscar) btnBuscar.addEventListener('click', () => renderLista(txtBuscar.value));
  if (txtBuscar) txtBuscar.addEventListener('keyup', () => renderLista(txtBuscar.value));

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
      codigo: inputCodigo ? inputCodigo.value.trim() : null,
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
      codigo: inputCodigo ? inputCodigo.value.trim() : null,
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
    if (inputCodigo) inputCodigo.value = prov.codigo || '';
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
    if (!listaProveedores) return;
    Array.from(listaProveedores.querySelectorAll('.proveedor-row')).forEach((row, idx) => {
      const prov = (function() {
        const term = (txtBuscar?.value || '').toLowerCase();
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

  // Carga inicial
  cargarProveedores();
});
