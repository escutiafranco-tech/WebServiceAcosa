// Módulo de Reportes de Compras
// -----------------------------------------------
// Generador de reportes para Compras

const MIN_WIDTH_RPT = 90;
const MAX_WIDTH_RPT = 600;
const STORAGE_KEY_COLUMN_WIDTHS_RPT = 'REPORTES_COLUMN_WIDTHS_V1';

var reporteDOM = {
  tablaReporte: null,
  loading: null,
  txtBuscar: null,
  selectTipo: null
};

var datosReporte = [];
var metadataReporte = null;
var filtroActual = '';

document.addEventListener('DOMContentLoaded', () => {
  // Referencias DOM
  reporteDOM.tablaReporte = document.getElementById('tablaReporte');
  reporteDOM.loading = document.getElementById('loadingReporte');
  reporteDOM.txtBuscar = document.getElementById('buscarReporte');
  reporteDOM.selectTipo = document.getElementById('tipoReporte');

  const btnGenerar = document.getElementById('btnGenerarReporte');
  const btnExportar = document.getElementById('btnExportarReporte');
  const btnBuscar = document.getElementById('btnBuscarReporte');

  function mostrarLoading(show) {
    if (reporteDOM.loading) {
      reporteDOM.loading.style.display = show ? 'flex' : 'none';
    }
  }

  function medirAnchoPx(texto, fontSize = '12px', fontWeight = '400', fontFamily = 'Geneva, Tahoma, Verdana') {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    ctx.font = `${fontWeight} ${fontSize} ${fontFamily}`;
    const width = ctx.measureText(texto).width;
    return Math.ceil(width) + 24;
  }

  function calcularAnchosOptimos(columnas, datos) {
    const anchos = {};
    columnas.forEach(col => {
      let minWidth = medirAnchoPx(col, '12px', '700');
      let maxWidth = minWidth;

      datos.forEach(row => {
        const valor = String(row[col.toLowerCase()] || '');
        const anchoValor = medirAnchoPx(valor, '12px', '400');
        maxWidth = Math.max(maxWidth, anchoValor);
      });

      const ancho = Math.max(minWidth, Math.min(maxWidth, MAX_WIDTH_RPT));
      anchos[col] = Math.max(ancho, MIN_WIDTH_RPT);
    });
    return anchos;
  }

  function guardarAnchosColumnas(columnas, anchos) {
    const aStorage = {};
    columnas.forEach(col => {
      aStorage[col] = anchos[col];
    });
    localStorage.setItem(STORAGE_KEY_COLUMN_WIDTHS_RPT, JSON.stringify(aStorage));
  }

  function cargarAnchosColumnas(columnas) {
    const stored = localStorage.getItem(STORAGE_KEY_COLUMN_WIDTHS_RPT);
    if (!stored) return null;
    const data = JSON.parse(stored);
    const anchos = {};
    columnas.forEach(col => {
      anchos[col] = data[col] || 150;
    });
    return anchos;
  }

  async function generarReporte() {
    const tipoReporte = reporteDOM.selectTipo?.value || 'proveedores';
    mostrarLoading(true);

    try {
      let datos = [];
      let columnas = [];

      if (tipoReporte === 'proveedores') {
        const res = await fetch('/api/datos/TBL_PROVEEDORES');
        if (!res.ok) throw new Error('Error cargando proveedores');
        const resp = await res.json();
        datos = (resp.datos || resp || []).map(p => ({
          id: p.ID || '',
          nombre: p.NOMBRE || '',
          contacto: p.CONTACTO || '',
          telefono: p.TELEFONO || '',
          email: p.EMAIL || '',
          ciudad: p.CIUDAD || '',
          activo: p.ACTIVO ? 'Sí' : 'No'
        }));
        columnas = ['ID', 'NOMBRE', 'CONTACTO', 'TELEFONO', 'EMAIL', 'CIUDAD', 'ACTIVO'];
      } 
      else if (tipoReporte === 'productos-servicios') {
        const res = await fetch('/api/datos/TBL_PROD_SERVICIOS');
        if (!res.ok) throw new Error('Error cargando productos y servicios');
        const resp = await res.json();
        datos = (resp.datos || resp || []).map(p => ({
          id: p.ID || '',
          nombre: p.NOMBRE || '',
          descripcion: p.DESCRIPCION || '',
          activo: p.ACTIVO ? 'Sí' : 'No',
          fecha_registro: p.FECHA_REGISTRO || ''
        }));
        columnas = ['ID', 'NOMBRE', 'DESCRIPCION', 'ACTIVO', 'FECHA_REGISTRO'];
      }
      else if (tipoReporte === 'asignaciones') {
        // Placeholder para asignaciones por proveedor
        datos = [
          { proveedor: 'Por desarrollar', servicio: 'Asignaciones', estado: 'Pendiente' }
        ];
        columnas = ['PROVEEDOR', 'SERVICIO', 'ESTADO'];
      }

      datosReporte = datos;
      metadataReporte = { columnas };
      renderReporte();
    } catch (err) {
      console.error('Error:', err);
      reporteDOM.tablaReporte.innerHTML = `<div style="grid-column: 1/-1; padding: 20px; color: red;">Error: ${err.message}</div>`;
    } finally {
      mostrarLoading(false);
    }
  }

  function renderReporte(filtro = '') {
    if (!reporteDOM.tablaReporte || !datosReporte.length) {
      reporteDOM.tablaReporte.innerHTML = '<div style="padding: 20px; text-align: center; grid-column: 1/-1;">No hay datos para mostrar.</div>';
      document.getElementById('reporteTotal').textContent = '0';
      document.getElementById('mostrandoReporte').textContent = 'Mostrando 0 de 0';
      return;
    }

    const columnas = metadataReporte?.columnas || [];
    const term = (filtro || '').toLowerCase();

    const filtrados = datosReporte.filter(fila => {
      const texto = columnas.map(col => String(fila[col.toLowerCase()] || '')).join(' ').toLowerCase();
      return texto.includes(term);
    });

    reporteDOM.tablaReporte.innerHTML = '';
    reporteDOM.tablaReporte.className = 'tabla-unificada';

    if (filtrados.length === 0) {
      reporteDOM.tablaReporte.innerHTML = '<div style="padding: 20px; text-align: center; grid-column: 1/-1;">No se encontraron resultados.</div>';
      return;
    }

    // Calcular anchos
    let anchos = cargarAnchosColumnas(columnas);
    if (!anchos) {
      anchos = calcularAnchosOptimos(columnas, filtrados);
      guardarAnchosColumnas(columnas, anchos);
    }

    const frUnits = columnas.map(col => `${anchos[col]}fr`).join(' ');
    reporteDOM.tablaReporte.style.gridTemplateColumns = frUnits;

    // Headers
    columnas.forEach(col => {
      const header = document.createElement('div');
      header.className = 'header-cell';
      header.textContent = col;
      reporteDOM.tablaReporte.appendChild(header);
    });

    // Datos
    filtrados.forEach(fila => {
      columnas.forEach(col => {
        const cell = document.createElement('div');
        cell.className = 'data-cell';
        cell.textContent = String(fila[col.toLowerCase()] || '');
        reporteDOM.tablaReporte.appendChild(cell);
      });
    });

    // Estadísticas
    document.getElementById('reporteTotal').textContent = datosReporte.length;
    document.getElementById('mostrandoReporte').textContent = `Mostrando ${filtrados.length} de ${datosReporte.length}`;
  }

  // Event listeners
  btnGenerar.addEventListener('click', generarReporte);
  btnExportar.addEventListener('click', () => {
    if (datosReporte.length === 0) {
      alert('No hay datos para exportar. Genera un reporte primero.');
      return;
    }
    const ws = XLSX.utils.json_to_sheet(datosReporte);
    const wb = XLSX.utils.book_new();
    const tipoReporte = reporteDOM.selectTipo?.value || 'reporte';
    XLSX.utils.book_append_sheet(wb, ws, 'Reporte');
    XLSX.writeFile(wb, `reporte-compras-${tipoReporte}.xlsx`);
  });
  btnBuscar.addEventListener('click', () => {
    filtroActual = reporteDOM.txtBuscar?.value || '';
    renderReporte(filtroActual);
  });
  reporteDOM.txtBuscar?.addEventListener('keyup', (e) => {
    if (e.key === 'Enter') {
      filtroActual = reporteDOM.txtBuscar?.value || '';
      renderReporte(filtroActual);
    }
  });

  // Generar reporte al cargar
  generarReporte();
});
