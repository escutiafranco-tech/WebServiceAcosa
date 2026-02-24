// Módulo de Custodias (Logística)
// -------------------------------
// Pantalla de consulta de custodias:
//  - Llama al endpoint /api/logistica/custodias.
//  - Muestra los registros en una tabla responsive.
//  - Actualiza totales (contador y texto "Mostrando X de Y").
//  - De momento solo soporta consulta; "Nueva custodia" es un placeholder.

document.addEventListener('DOMContentLoaded', () => {
  const lista = document.getElementById('listaCustodias');
  const loading = document.getElementById('loadingCustodias');
  const lblTotal = document.getElementById('totalCustodias');
  const lblMostrando = document.getElementById('mostrandoCustodias');
  const btnRefrescar = document.getElementById('btnRefrescarCustodias');
  const btnRecargar = document.getElementById('btnRecargarCustodias');

  // Arreglo en memoria con las custodias recibidas desde la API.
  let custodias = [];

  // Muestra/oculta el overlay de "Cargando custodias...".
  function mostrarLoading(show) {
    if (!loading) return;
    loading.style.display = show ? 'flex' : 'none';
  }

  // Renderiza la lista de custodias en el contenedor principal.
  function renderLista() {
    if (!lista) return;
    lista.innerHTML = '';

    if (!custodias.length) {
      const vacio = document.createElement('div');
      vacio.className = 'tabla-vacia';
      vacio.textContent = 'No hay custodias registradas.';
      lista.appendChild(vacio);
    } else {
      custodias.forEach(c => {
        const row = document.createElement('div');
        row.className = 'table-row custodia-row';
        row.innerHTML = `
          <div class="col-folio">${c.folio || ''}</div>
          <div class="col-proveedor">${c.proveedor || ''}</div>
          <div class="col-fecha">${c.fecha || ''}</div>
          <div class="col-ubicacion">${c.ubicacion || ''}</div>
          <div class="col-estatus">${c.estatus || ''}</div>
        `;
        lista.appendChild(row);
      });
    }

    // Actualiza indicadores inferiores: total y "Mostrando".
    if (lblTotal) lblTotal.textContent = custodias.length;
    if (lblMostrando) lblMostrando.textContent = `Mostrando ${custodias.length} de ${custodias.length}`;
  }

  // Consume la API de logística para traer custodias y redibujar la tabla.
  async function cargarCustodias() {
    try {
      mostrarLoading(true);
      const res = await fetch('/api/logistica/custodias');
      if (!res.ok) throw new Error('Error al obtener custodias');
      const data = await res.json();
      // La API devuelve un objeto { custodias: [...] }.
      custodias = Array.isArray(data.custodias) ? data.custodias : [];
      renderLista();
    } catch (e) {
      console.error('Error cargando custodias', e);
      custodias = [];
      renderLista();
    } finally {
      mostrarLoading(false);
    }
  }

  if (btnRefrescar) btnRefrescar.addEventListener('click', cargarCustodias);
  if (btnRecargar) btnRecargar.addEventListener('click', cargarCustodias);

  const btnNueva = document.getElementById('btnNuevaCustodia');
  if (btnNueva) {
    btnNueva.addEventListener('click', () => {
      alert('Función "Nueva custodia" aún no implementada en esta versión.');
    });
  }

  cargarCustodias();
});
