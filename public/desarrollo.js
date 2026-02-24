/**
 * SISTEMA GLOBAL: Componente "En Desarrollo"
 * 
 * ✅ Uso 1: Mostrar en un contenedor
 * document.getElementById('mi-contenedor').innerHTML = mostrarDesarrollo();
 * 
 * ✅ Uso 2: Automático en pestañas sin contenido
 * Al hacer clic en una pestaña, si está vacía muestra automáticamente "En Desarrollo"
 * 
 * ✅ Uso 3: Inicializar todas las pestañas al cargar módulo
 * inicializarPestanasDesarrollo();
 */

// ✅ OBTENER ID DE PESTAÑA DESDE URL (Para módulos sin desarrollar)
function obtenerPestanaId() {
  const params = new URLSearchParams(window.location.search);
  return params.get('pestana_id');
}

// ✅ CERRAR PESTAÑA CORRECTAMENTE (Desde módulo sin desarrollar)
function cerrarPestana() {
  const pestanaId = obtenerPestanaId();
  
  if (pestanaId && window.parent && window.parent.cerrarPestañaDesdeJS) {
    // Si está en un iframe con pestaña conocida, ciérrala
    window.parent.cerrarPestañaDesdeJS(pestanaId);
  } else {
    // Si no, simplemente vuelve atrás
    window.history.back();
  }
}

function mostrarDesarrollo(opciones = {}) {
  // Valores por defecto para módulos completos
  const config = {
    titulo: opciones.titulo || 'Módulo en Desarrollo',
    descripcion: opciones.descripcion || 'Este módulo está en desarrollo y estará disponible pronto.',
    imagen: opciones.imagen || '/Imagenes/Ico_Construccion_01.png',
    alturaMinima: opciones.alturaMinima || 400,
    compacto: opciones.compacto || false  // Nuevo: layout compacto horizontal
  };

  // ✅ VERSIÓN COMPACTA (imagen + texto horizontal)
  if (config.compacto) {
    return `
      <style>
        .contenedor-desarrollo-compacto {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 20px;
          padding: 5px 20px;
          min-height: 100px;
        }
        .icono-construccion-compacto {
          flex-shrink: 0;
        }
        .icono-construccion-compacto img {
          width: 80px;
          height: 80px;
        }
        .contenido-desarrollo-compacto {
          text-align: left;
          flex-grow: 1;
        }
        .mensaje-desarrollo-compacto {
          font-size: 18px;
          color: #2F3158;
          font-weight: 700;
          margin: 0 0 10px 0;
        }
        .texto-desarrollo-compacto {
          font-size: 13px;
          color: #666;
          margin: 0;
          line-height: 1.4;
        }
      </style>
      <div class="contenedor-desarrollo-compacto">
        <div class="icono-construccion-compacto">
          <img src="${config.imagen}" alt="Construcción">
        </div>
        <div class="contenido-desarrollo-compacto">
          <h3 class="mensaje-desarrollo-compacto">${config.titulo}</h3>
          <p class="texto-desarrollo-compacto">${config.descripcion}</p>
        </div>
      </div>
    `;
  }

  // ✅ VERSIÓN ORIGINAL (imagen arriba, texto abajo)
  return `
    <style>
      .contenedor-desarrollo {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        min-height: ${config.alturaMinima}px;
        text-align: center;
        padding: 40px 20px;
      }
      .icono-construccion {
        margin-bottom: 30px;
      }
      .icono-construccion img {
        width: 100px;
        height: 100px;
      }
      .mensaje-desarrollo {
        font-size: 20px;
        color: #2F3158;
        font-weight: 700;
        margin: 20px 0;
      }
      .texto-desarrollo {
        font-size: 14px;
        color: #666;
        margin: 20px 0;
        max-width: 400px;
      }
    </style>
    <div class="contenedor-desarrollo">
      <div class="icono-construccion">
        <img src="${config.imagen}" alt="Construcción">
      </div>
      <h3 class="mensaje-desarrollo">${config.titulo}</h3>
      <p class="texto-desarrollo">${config.descripcion}</p>
    </div>
  `;
}

/**
 * Interceptor automático de pestañas vacías
 * Cuando hagas clic en una pestaña, si su contenedor está vacío, muestra "En Desarrollo"
 */
function inicializarPestanasDesarrollo() {
  // Busca todos los botones de pestaña (data-tab, data-panel, etc)
  const pestanas = document.querySelectorAll('[data-tab], [role="tab"], .tab-btn, .pestaña-btn, [class*="tab"]');
  
  pestanas.forEach(pestaña => {
    pestaña.addEventListener('click', function(e) {
      // Intenta encontrar el contenedor asociado
      const targetId = this.getAttribute('data-tab') || 
                       this.getAttribute('aria-controls') || 
                       this.getAttribute('id')?.replace('btn-', '') ||
                       this.getAttribute('id')?.replace('tab-', '');
      
      if (targetId) {
        const contenedor = document.getElementById(targetId) || 
                          document.querySelector(`[data-panel="${targetId}"]`) ||
                          document.querySelector(`[aria-labelledby="${this.id}"]`);
        
        if (contenedor) {
          // Si el contenedor está vacío o solo tiene espacios en blanco
          const contenido = contenedor.textContent.trim();
          if (!contenido || contenido.length === 0) {
            // Para pestañas en formularios: usar Ico_Construccion_03
            contenedor.innerHTML = mostrarDesarrollo({
              titulo: 'Pestaña en Desarrollo',
              descripcion: 'Esta pestaña está en desarrollo y estará disponible pronto.',
              imagen: '/Imagenes/Ico_Construccion_03.png',
              alturaMinima: 300
            });
          }
        }
      }
    });
  });
}

/**
 * Manejador específico para pestañas en modales/formularios
 * Uso: activarPestañaConDesarrollo('miPestaña', 'contenedor-pestaña')
 */
function activarPestañaConDesarrollo(nombrePestaña, idContenedor) {
  const contenedor = document.getElementById(idContenedor);
  
  if (contenedor && (!contenedor.textContent.trim() || contenedor.textContent.trim().length === 0)) {
    contenedor.innerHTML = mostrarDesarrollo({
      titulo: 'Pestaña en Desarrollo',
      descripcion: 'Esta pestaña está en desarrollo y estará disponible pronto.',
      imagen: '/Imagenes/Ico_Construccion_03.png',
      alturaMinima: 300
    });
  }
}

// Auto-inicializar cuando el DOM esté listo
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', inicializarPestanasDesarrollo);
} else {
  inicializarPestanasDesarrollo();
}
