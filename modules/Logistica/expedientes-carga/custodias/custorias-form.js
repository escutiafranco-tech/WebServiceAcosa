// custodias-form.js - Lógica SOLO para el formulario de Custodias

class CustodiaForm {
    constructor() {
        this.proveedores = [];
        this.init();
    }

    async init() {
        console.log('📝 Inicializando FORMULARIO de Custodias...');
        await this.loadProveedores();
        this.setupEventListeners();
        this.initializeForm();
        console.log('✅ Formulario listo - ESPERANDO CAPTURA DE DATOS');
    }

    async loadProveedores() {
        try {
            const response = await fetch('/data/catalogos/proveedores.json');
            if (!response.ok) throw new Error('Error cargando proveedores');
            const data = await response.json();
            this.proveedores = data.proveedores || [];
        } catch (error) {
            console.error('Error cargando proveedores:', error);
            this.proveedores = this.getDefaultProveedores();
        }
    }

    setupEventListeners() {
        const btnGuardar = document.getElementById('btnGuardar');
        const btnCancelar = document.getElementById('btnCancelar');
        const observaciones = document.getElementById('observaciones');

        console.log('🔧 Configurando eventos...');

        // SOLO el botón Guardar ejecuta el guardado
        if (btnGuardar) {
            btnGuardar.addEventListener('click', (e) => {
                console.log('🖱️ Botón Guardar clickeado manualmente');
                this.handleSubmit(e);
            });
        }

        if (btnCancelar) {
            btnCancelar.addEventListener('click', () => {
                if (confirm('¿Estás seguro de que deseas salir? Se perderán los datos no guardados.')) {
                    window.location.href = 'custodias.html';
                }
            });
        }

        if (observaciones) {
            observaciones.addEventListener('input', () => this.updateCharCount());
        }

        // PREVENIR cualquier envío automático del formulario
        const form = document.getElementById('custodiaForm');
        if (form) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                console.log('🛑 Formulario prevenido de envío automático');
            });
        }
    }

    initializeForm() {
        this.generarIdCustodia();
        this.actualizarFechas();
        this.llenarSelectProveedores();
        this.updateCharCount();
    }

    generarIdCustodia() {
        const idCustodia = document.getElementById('idCustodia');
        if (idCustodia) {
            // Cargar custodias existentes para generar el próximo ID
            const storedData = localStorage.getItem('acosa_custodias');
            const existingCustodias = storedData ? JSON.parse(storedData).custodias : [];
            const folio = this.generarProximoFolio(existingCustodias);
            idCustodia.value = folio;
            console.log('🆔 ID generado:', folio);
        }
    }

    generarProximoFolio(existingCustodias = []) {
        const now = new Date();
        const year = now.getFullYear();
        const sequence = (existingCustodias.length + 1).toString().padStart(4, '0');
        return `CUST-${year}-${sequence}`;
    }

    actualizarFechas() {
        const fechaSolicitud = document.getElementById('fechaSolicitud');
        const fechaServicio = document.getElementById('fechaServicio');
        
        if (fechaSolicitud) {
            const now = new Date();
            fechaSolicitud.value = now.toLocaleDateString('es-MX');
        }
        
        if (fechaServicio) {
            const today = new Date().toISOString().split('T')[0];
            fechaServicio.min = today;
        }
    }

    llenarSelectProveedores() {
        const select = document.getElementById('proveedor');
        if (!select) return;

        select.innerHTML = '<option value="">Seleccione un proveedor</option>';
        
        this.proveedores.forEach(proveedor => {
            if (proveedor.activo !== false) {
                const option = document.createElement('option');
                option.value = proveedor.id;
                option.textContent = `${proveedor.nombre} - ${proveedor.rfc}`;
                select.appendChild(option);
            }
        });
    }

    updateCharCount() {
        const observaciones = document.getElementById('observaciones');
        const counter = document.getElementById('charCount');
        
        if (observaciones && counter) {
            counter.textContent = observaciones.value.length;
        }
    }

    async handleSubmit(event) {
        event.preventDefault();
        console.log('🔍 Iniciando proceso de guardado MANUAL...');
        
        // Primero validar
        if (!this.validateForm()) {
            this.showNotification('❌ Complete todos los campos requeridos', 'error');
            return;
        }

        // Si la validación pasa, entonces guardar
        try {
            console.log('✅ Validación exitosa, procediendo a guardar...');
            this.showFormLoading();
            
            const custodiaData = this.getFormData();
            await this.guardarCustodia(custodiaData);
            
            this.showNotification('✅ Custodia guardada exitosamente', 'success');
            
            // Redirigir después de 1.5 segundos
            setTimeout(() => {
                window.location.href = 'custodias.html';
            }, 1500);
            
        } catch (error) {
            console.error('Error guardando custodia:', error);
            this.showNotification('❌ Error al guardar la custodia', 'error');
        } finally {
            this.hideFormLoading();
        }
    }

    validateForm() {
        console.log('🔍 Validando formulario...');
        const requiredFields = document.querySelectorAll('[required]');
        let isValid = true;

        // Resetear colores primero
        requiredFields.forEach(field => {
            field.style.borderColor = '';
        });

        // Validar campos requeridos
        requiredFields.forEach(field => {
            if (!field.value.trim()) {
                field.style.borderColor = '#dc3545';
                isValid = false;
            }
        });

        // Validar proveedor seleccionado
        const proveedor = document.getElementById('proveedor');
        if (proveedor && !proveedor.value) {
            proveedor.style.borderColor = '#dc3545';
            isValid = false;
        }

        console.log(`📋 Validación ${isValid ? 'EXITOSA' : 'FALLIDA'}`);
        return isValid;
    }

    getFormData() {
        const proveedorId = document.getElementById('proveedor').value;
        const proveedor = this.proveedores.find(p => p.id == proveedorId);

        return {
            id: document.getElementById('idCustodia').value,
            folio: document.getElementById('idCustodia').value,
            fecha_solicitud: new Date().toISOString(),
            fecha_servicio: document.getElementById('fechaServicio').value,
            hora_servicio: document.getElementById('horaServicio').value,
            proveedor_id: parseInt(proveedorId),
            proveedor: proveedor,
            tipo_movimiento: document.getElementById('tipoMovimiento').value,
            ubicacion_inicial: {
                cp: document.getElementById('inicialCP').value,
                pais: document.getElementById('inicialPais').value,
                estado: document.getElementById('inicialEstado').value,
                municipio: document.getElementById('inicialMunicipio').value,
                colonia: document.getElementById('inicialColonia').value,
                calle: document.getElementById('inicialCalle').value
            },
            ubicacion_destino: {
                cp: document.getElementById('destinoCP').value,
                pais: document.getElementById('destinoPais').value,
                estado: document.getElementById('destinoEstado').value,
                municipio: document.getElementById('destinoMunicipio').value,
                colonia: document.getElementById('destinoColonia').value,
                calle: document.getElementById('destinoCalle').value
            },
            observaciones: document.getElementById('observaciones').value,
            estatus: 1,
            documentos: {
                solicitud_msg: { subido: false, ruta_archivo: null, fecha_subida: null },
                hoja_custodia: { subido: false, ruta_archivo: null, fecha_subida: null },
                factura: { subido: false, ruta_archivo: null, fecha_subida: null },
                pago: { subido: false, ruta_archivo: null, fecha_subida: null }
            },
            usuario_creacion: 'admin',
            fecha_creacion: new Date().toISOString()
        };
    }

    async guardarCustodia(custodiaData) {
        console.log('💾 Guardando custodia en base de datos...');
        
        // Cargar custodias existentes
        const storedData = localStorage.getItem('acosa_custodias');
        const existingCustodias = storedData ? JSON.parse(storedData).custodias : [];
        
        // Agregar nueva custodia
        existingCustodias.unshift(custodiaData);
        
        // Guardar
        const data = {
            custodias: existingCustodias,
            metadata: {
                total_registros: existingCustodias.length,
                ultima_actualizacion: new Date().toISOString()
            }
        };
        
        localStorage.setItem('acosa_custodias', JSON.stringify(data));
        
        console.log('✅ Custodia guardada correctamente');
        return custodiaData;
    }

    getDefaultProveedores() {
        return [
            {
                id: 1,
                nombre: "TRANSPORTES MEXICANOS SA DE CV",
                rfc: "TME890123456",
                contacto: "Juan Pérez",
                telefono: "+52 55 1234 5678",
                email: "juan@transportesmexicanos.com",
                activo: true
            },
            {
                id: 2,
                nombre: "LOGISTICA INTEGRAL DEL NORTE",
                rfc: "LIN780456123",
                contacto: "María García",
                telefono: "+52 81 2345 6789",
                email: "maria@logisticaintegral.com",
                activo: true
            }
        ];
    }

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

    showFormLoading() {
        const loading = document.getElementById('loadingForm');
        if (loading) loading.style.display = 'flex';
    }

    hideFormLoading() {
        const loading = document.getElementById('loadingForm');
        if (loading) loading.style.display = 'none';
    }
}

// Inicializar SOLO el formulario
document.addEventListener('DOMContentLoaded', () => {
    window.custodiaForm = new CustodiaForm();
});