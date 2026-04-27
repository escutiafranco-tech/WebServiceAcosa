// Módulo de Productos y Servicios (Compras)
// -----------------------------------------------
// Catálogo de productos y servicios con funcionalidad CRUD completa

const TABLA_CONSULTA_PS = 'TBL_PROD_SERVICIOS';
var metadataTablaPS = null;
var prodServicios = [];
var filtroActualPS = '';

const STORAGE_KEY_COLUMN_WIDTHS_PS = 'PROD_SERVICIOS_COLUMN_WIDTHS_V1';
const STORAGE_KEY_COLUMN_ORDER_PS = 'PROD_SERVICIOS_COLUMN_ORDER_V1';
const MIN_WIDTH_PS = 90;
const MAX_WIDTH_PS = 600;

var ProdServiciosDOM = {
  listaProdServicios: null,
  loading: null,
  txtBuscar: null,
  lblMostrando: null,
  lblActivos: null,
  lblInactivos: null
};

document.addEventListener('DOMContentLoaded', () => {
  // Referencias DOM
  const listaProdServicios = document.getElementById('listaProdServicios');
  const loading = document.getElementById('loadingProdServicios');
  const txtBuscar = document.getElementById('buscarProdServicio');
  const lblMostrando = document.getElementById('mostrandoProdServicios');
  const lblActivos = document.getElementById('prodServiciosActivos');
  const lblInactivos = document.getElementById('prodServiciosInactivos');
  const btnBuscar = document.getElementById('btnBuscarProdServicio');
  const btnNuevo = document.getElementById('btnNuevoProdServicio');
  const btnExportar = document.getElementById('btnExportarProdServicios');
  const btnImportar = document.getElementById('btnImportarProdServicios');
  const btnRefrescar = document.getElementById('btnRefrescarProdServicios');
  const inputImportar = document.getElementById('inputImportarProdServicios');

  ProdServiciosDOM.listaProdServicios = listaProdServicios;
  ProdServiciosDOM.loading = loading;
  ProdServiciosDOM.txtBuscar = txtBuscar;
  ProdServiciosDOM.lblMostrando = lblMostrando;
  ProdServiciosDOM.lblActivos = lblActivos;
  ProdServiciosDOM.lblInactivos = lblInactivos;

  // Modal
  const modal = document.getElementById('modalServicio');
  const tituloModal = document.getElementById('tituloModalServicio');
  const btnCerrarModal = document.getElementById('btnCerrarModalServicio');
  const btnGuardar = document.getElementById('btnGuardarServicio');
  const btnCancelar = document.getElementById('btnCancelarServicio');
  const form = document.getElementById('formServicio');
  const inputId = document.getElementById('srvId');
  const inputNombre = document.getElementById('srvNombre');
  const inputDescripcion = document.getElementById('srvDescripcion');
  const inputActivo = document.getElementById('srvActivo');

  function mostrarLoading(show) {
    if (!ProdServiciosDOM.loading) return;
    ProdServiciosDOM.loading.style.display = show ? 'flex' : 'none';
  }

  // Función para medir ancho de texto con Canvas
  function medirAnchoPx(texto, fontSize = '12px', fontWeight = '400', fontFamily = 'Geneva, Tahoma, Verdana') {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    ctx.font = `${fontWeight} ${fontSize} ${fontFamily}`;
    const width = ctx.measureText(texto).width;
    return Math.ceil(width) + 24;
  }

  // Calcular anchos óptimos
  function calcularAnchosOptimos(columnasVisibles, dataRows, headers) {
    const anchos = {};
    columnasVisibles.forEach(col => {
      const headerCell = headers.find(h => h.nombre === col);
      const etiqueta = headerCell?.etiqueta || col;
      let minWidth = medirAnchoPx(etiqueta, '12px', '700');
      let maxWidth = minWidth;
      
      dataRows.forEach(row => {
        const valor = String(row[col.toLowerCase()] || '');
        const anchoValor = medirAnchoPx(valor, '12px', '400');
        maxWidth = Math.max(maxWidth, anchoValor);
      });

      const ancho = Math.max(minWidth, Math.min(maxWidth, MAX_WIDTH_PS));
      anchos[col] = Math.max(ancho, MIN_WIDTH_PS);
    });
    return anchos;
  }

  // Guardar anchos en localStorage
  function guardarAnchosColumnas(columnasVisibles, anchos) {
    const aStorage = {};
    columnasVisibles.forEach(col => {
      aStorage[col] = anchos[col];
    });
    localStorage.setItem(STORAGE_KEY_COLUMN_WIDTHS_PS, JSON.stringify(aStorage));
  }

  // Cargar anchos desde localStorage
  function cargarAnchosColumnas(columnasVisibles) {
    const stored = localStorage.getItem(STORAGE_KEY_COLUMN_WIDTHS_PS);
    if (!stored) return null;
    const data = JSON.parse(stored);
    const anchos = {};
    columnasVisibles.forEach(col => {
      anchos[col] = data[col] || 150;
    });
    return anchos;
  }

  // Guardar orden de columnas
  function guardarOrdenColumnas(orden) {
    localStorage.setItem(STORAGE_KEY_COLUMN_ORDER_PS, JSON.stringify(orden));
  }

  // Cargar orden de columnas
  function cargarOrdenColumnas(columnasOriginales) {
    const stored = localStorage.getItem(STORAGE_KEY_COLUMN_ORDER_PS);
    if (!stored) return columnasOriginales;
    const orden = JSON.parse(stored);
    return orden.filter(col => columnasOriginales.includes(col));
  }

  // Reordenar columnas
  function reordenarColumnas(draggedColumn, targetColumn) {
    const columnasVisibles = metadataTablaPS?.columnas_visibles || [];
    const anchos = cargarAnchosColumnas(columnasVisibles);
    if (anchos) {
      guardarAnchosColumnas(columnasVisibles, anchos);
    }

    const dragIndex = columnasVisibles.indexOf(draggedColumn);
    const targetIndex = columnasVisibles.indexOf(targetColumn);

    if (dragIndex !== -1 && targetIndex !== -1) {
      const newOrder = [...columnasVisibles];
      newOrder.splice(dragIndex, 1);
      newOrder.splice(targetIndex, 0, draggedColumn);
      
      if (metadataTablaPS) {
        metadataTablaPS.columnas_visibles = newOrder;
      }
      guardarOrdenColumnas(newOrder);
    }
    renderLista(filtroActualPS);
  }

  // Renderizar lista
  function renderLista(filtro = '') {
    if (!ProdServiciosDOM.listaProdServicios || !metadataTablaPS) return;

    const term = (filtro || '').toLowerCase();
    const columnasVisibles = metadataTablaPS?.columnas_visibles || ['ID', 'NOMBRE', 'DESCRIPCION', 'ACTIVO'];
    const todasLasColumnas = metadataTablaPS?.columnas_base || [];

    const filtrados = prodServicios.filter(p => {
      const textoBusqueda = columnasVisibles
        .map(col => String(p[col.toLowerCase()] || ''))
        .join(' ')
        .toLowerCase();
      return textoBusqueda.includes(term);
    });

    ProdServiciosDOM.listaProdServicios.innerHTML = '';
    ProdServiciosDOM.listaProdServicios.className = 'tabla-unificada';

    if (filtrados.length === 0) {
      ProdServiciosDOM.listaProdServicios.innerHTML = '<div style="padding: 20px; text-align: center; grid-column: 1/-1;">No hay productos o servicios para mostrar.</div>';
      if (ProdServiciosDOM.lblActivos) ProdServiciosDOM.lblActivos.textContent = '0';
      if (ProdServiciosDOM.lblInactivos) ProdServiciosDOM.lblInactivos.textContent = '0';
      if (ProdServiciosDOM.lblMostrando) ProdServiciosDOM.lblMostrando.textContent = `Mostrando 0 de ${prodServicios.length}`;
      return;
    }

    // Calcular anchos
    let anchos = cargarAnchosColumnas(columnasVisibles);
    if (!anchos) {
      anchos = calcularAnchosOptimos(columnasVisibles, filtrados, todasLasColumnas);
      guardarAnchosColumnas(columnasVisibles, anchos);
    }

    // Grid template
    const frUnits = columnasVisibles.map(col => `${anchos[col]}fr`).join(' ');
    ProdServiciosDOM.listaProdServicios.style.gridTemplateColumns = frUnits;

    // Headers
    columnasVisibles.forEach((colNombre, colIndex) => {
      const colMeta = todasLasColumnas.find(c => c.nombre === colNombre);
      const etiqueta = colMeta?.etiqueta || colNombre;

      const headerCell = document.createElement('div');
      headerCell.className = 'header-cell';
      headerCell.setAttribute('data-column', colNombre);
      headerCell.setAttribute('draggable', 'true');
      headerCell.textContent = etiqueta;

      let isDragging = false;
      headerCell.addEventListener('dragstart', (e) => {
        isDragging = true;
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', colNombre);
      });

      headerCell.addEventListener('dragend', () => {
        isDragging = false;
      });

      headerCell.addEventListener('dragover', (e) => {
        if (!isDragging) {
          e.preventDefault();
          e.dataTransfer.dropEffect = 'move';
        }
      });

      headerCell.addEventListener('drop', (e) => {
        e.preventDefault();
        const draggedCol = e.dataTransfer.getData('text/plain');
        if (draggedCol !== colNombre) {
          reordenarColumnas(draggedCol, colNombre);
        }
      });

      ProdServiciosDOM.listaProdServicios.appendChild(headerCell);
    });

    // Data rows
    filtrados.forEach(item => {
      columnasVisibles.forEach(colNombre => {
        const dataCell = document.createElement('div');
        dataCell.className = 'data-cell';
        const valor = item[colNombre.toLowerCase()] || '';
        
        if (colNombre === 'ACTIVO') {
          dataCell.textContent = valor ? '✓' : '✗';
        } else {
          dataCell.textContent = String(valor);
        }
        
        dataCell.addEventListener('click', () => {
          abrirModalEdicion(item);
        });

        ProdServiciosDOM.listaProdServicios.appendChild(dataCell);
      });
    });

    // Estadísticas
    const activos = prodServicios.filter(p => p.activo).length;
    const inactivos = prodServicios.filter(p => !p.activo).length;
    if (ProdServiciosDOM.lblActivos) ProdServiciosDOM.lblActivos.textContent = activos;
    if (ProdServiciosDOM.lblInactivos) ProdServiciosDOM.lblInactivos.textContent = inactivos;
    if (ProdServiciosDOM.lblMostrando) ProdServiciosDOM.lblMostrando.textContent = `Mostrando ${filtrados.length} de ${prodServicios.length}`;

    inicializarColumnasPS();
  }

  function inicializarColumnasPS() {
    // Aplicar anchos persistidos
    const columnasVisibles = metadataTablaPS?.columnas_visibles || [];
    const anchos = cargarAnchosColumnas(columnasVisibles);
    if (anchos) {
      const frUnits = columnasVisibles.map(col => `${anchos[col]}fr`).join(' ');
      ProdServiciosDOM.listaProdServicios.style.gridTemplateColumns = frUnits;
    }
  }

  // Cargar datos
  async function cargarDatos() {
    mostrarLoading(true);
    try {
      const [resData, resSchema] = await Promise.all([
        fetch(`/api/datos/${TABLA_CONSULTA_PS}`),
        fetch(`/api/datos/${TABLA_CONSULTA_PS}/schema`)
      ]);

      if (!resData.ok || !resSchema.ok) throw new Error('Error cargando datos');

      const dataResponse = await resData.json();
      const schema = await resSchema.json();

      metadataTablaPS = schema;
      const data = dataResponse.datos || dataResponse || [];
      prodServicios = (data || []).map((p, index) => ({
        id: p.ID || `PS-${String(index + 1).padStart(4, '0')}`,
        nombre: p.NOMBRE || '',
        descripcion: p.DESCRIPCION || '',
        activo: p.ACTIVO === true || p.ACTIVO === 1,
        fecha_registro: p.FECHA_REGISTRO || new Date().toISOString().split('T')[0]
      }));

      // Restaurar orden de columnas
      const ordenGuardado = localStorage.getItem(STORAGE_KEY_COLUMN_ORDER_PS);
      if (ordenGuardado) {
        metadataTablaPS.columnas_visibles = JSON.parse(ordenGuardado);
      }

      renderLista();
    } catch (err) {
      console.error('Error:', err);
      ProdServiciosDOM.listaProdServicios.innerHTML = `<div style="grid-column: 1/-1; padding: 20px; color: red;">Error: ${err.message}</div>`;
    } finally {
      mostrarLoading(false);
    }
  }

  // Modal
  function abrirModalNuevo() {
    tituloModal.textContent = 'Nuevo Producto/Servicio';
    inputId.value = `PS-${String(prodServicios.length + 1).padStart(4, '0')}`;
    inputNombre.value = '';
    inputDescripcion.value = '';
    inputActivo.checked = true;
    modal.style.display = 'flex';
    inputNombre.focus();
  }

  function abrirModalEdicion(item) {
    tituloModal.textContent = 'Editar Producto/Servicio';
    inputId.value = item.id;
    inputNombre.value = item.nombre;
    inputDescripcion.value = item.descripcion;
    inputActivo.checked = item.activo;
    modal.style.display = 'flex';
    inputNombre.focus();
  }

  function cerrarModal() {
    modal.style.display = 'none';
    form.reset();
  }

  function guardarServicio() {
    const id = inputId.value.trim();
    const nombre = inputNombre.value.trim();
    const descripcion = inputDescripcion.value.trim();
    const activo = inputActivo.checked;

    if (!nombre) {
      alert('El nombre es requerido');
      return;
    }

    const index = prodServicios.findIndex(p => p.id === id);
    if (index >= 0) {
      prodServicios[index] = { id, nombre, descripcion, activo, fecha_registro: prodServicios[index].fecha_registro };
    } else {
      prodServicios.push({ id, nombre, descripcion, activo, fecha_registro: new Date().toISOString().split('T')[0] });
    }

    cerrarModal();
    renderLista(filtroActualPS);
  }

  // Importar desde Excel
  function importarDesdeExcel(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const rows = XLSX.utils.sheet_to_json(sheet);

        if (rows.length === 0) {
          alert('El archivo está vacío');
          return;
        }

        const importados = rows.map(row => ({
          id: row.ID || row.id || `PS-${Date.now()}`,
          nombre: row.NOMBRE || row.nombre || '',
          descripcion: row.DESCRIPCION || row.descripcion || '',
          activo: (row.ACTIVO ?? row.activo ?? true) ? true : false,
          fecha_registro: row.FECHA_REGISTRO || row.fecha_registro || new Date().toISOString().split('T')[0]
        }));

        // Agregar nuevos o actualizar existentes
        importados.forEach(importado => {
          const existe = prodServicios.findIndex(p => p.id === importado.id);
          if (existe >= 0) {
            prodServicios[existe] = importado;
          } else {
            prodServicios.push(importado);
          }
        });

        renderLista();
        alert(`Se importaron ${importados.length} productos/servicios correctamente`);
      } catch (err) {
        console.error('Error al importar:', err);
        alert(`Error al importar: ${err.message}`);
      } finally {
        inputImportar.value = '';
      }
    };
    reader.readAsArrayBuffer(file);
  }

  // Event listeners
  btnNuevo.addEventListener('click', abrirModalNuevo);
  btnBuscar.addEventListener('click', () => {
    filtroActualPS = txtBuscar.value;
    renderLista(filtroActualPS);
  });
  txtBuscar.addEventListener('keyup', (e) => {
    if (e.key === 'Enter') {
      filtroActualPS = txtBuscar.value;
      renderLista(filtroActualPS);
    }
  });
  btnRefrescar.addEventListener('click', cargarDatos);
  btnExportar.addEventListener('click', () => {
    const ws = XLSX.utils.json_to_sheet(prodServicios);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Productos y Servicios');
    XLSX.writeFile(wb, 'productos-servicios.xlsx');
  });
  btnImportar.addEventListener('click', () => {
    inputImportar.click();
  });
  inputImportar.addEventListener('change', importarDesdeExcel);

  btnCerrarModal.addEventListener('click', cerrarModal);
  btnCancelar.addEventListener('click', cerrarModal);
  btnGuardar.addEventListener('click', guardarServicio);

  modal.addEventListener('click', (e) => {
    if (e.target === modal) cerrarModal();
  });

  // Cargar datos al iniciar
  cargarDatos();
});
