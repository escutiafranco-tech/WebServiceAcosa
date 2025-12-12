// ClientesManager - Homologado con Proveedores
class ClientesManager {
  constructor(){
    this.clientes = [];
    this.currentPage = 1;
    this.itemsPerPage = 10;
    this.currentFilter = '';
    this.storageKey = 'acosa_clientes';
    this.init();
  }

  async init(){
    await this.loadClientes();
    this.setupEvents();
    // No render de datos: solo estructura
    this.updateStats();
  }

  async loadClientes(){
    const saved = localStorage.getItem(this.storageKey);
    if(saved){ try{ const data = JSON.parse(saved); this.clientes = data.clientes || []; }catch(e){ this.clientes = []; } }
    if(!this.clientes || this.clientes.length === 0){
      // Semilla: 6 clientes demo
      this.clientes = [
        {id:'CLI-0001', codigo:'C001', nombre:'Cliente A', contacto:'Ana López', telefono:'555-101-0001', email:'ana@clientea.com', activo:true},
        {id:'CLI-0002', codigo:'C002', nombre:'Cliente B', contacto:'Bruno Díaz', telefono:'555-102-0002', email:'bruno@clienteb.com', activo:true},
        {id:'CLI-0003', codigo:'C003', nombre:'Cliente C', contacto:'Carla Pérez', telefono:'555-103-0003', email:'carla@clientec.com', activo:false},
        {id:'CLI-0004', codigo:'C004', nombre:'Cliente D', contacto:'David Ruiz', telefono:'555-104-0004', email:'david@cliented.com', activo:true},
        {id:'CLI-0005', codigo:'C005', nombre:'Cliente E', contacto:'Elena García', telefono:'555-105-0005', email:'elena@clientee.com', activo:true},
        {id:'CLI-0006', codigo:'C006', nombre:'Cliente F', contacto:'Fabio Torres', telefono:'555-106-0006', email:'fabio@clientef.com', activo:false},
      ];
      this.save();
    }
  }

  save(){ const payload = { clientes: this.clientes, meta:{ total: this.clientes.length, updatedAt: new Date().toISOString() } }; localStorage.setItem(this.storageKey, JSON.stringify(payload)); }

  setupEvents(){
    const btnNuevo = document.getElementById('btnNuevo');
    const btnRecargar = document.getElementById('btnRecargarClientes');
    const buscar = document.getElementById('buscar');
    const btnBuscar = document.getElementById('btnBuscar');
    const btnAnterior = document.getElementById('btnAnteriorClientes');
    const btnSiguiente = document.getElementById('btnSiguienteClientes');

    if(btnNuevo) btnNuevo.addEventListener('click', ()=> this.openNuevo());
    if(btnRecargar) btnRecargar.addEventListener('click', ()=>{ localStorage.removeItem(this.storageKey); this.loadClientes().then(()=>{ this.renderClientes(); this.updateStats(); }); });
    if(buscar) buscar.addEventListener('input', (e)=>{ this.currentFilter = (e.target.value||'').toLowerCase(); this.currentPage = 1; this.renderClientes(); });
    if(btnBuscar) btnBuscar.addEventListener('click', ()=>{ const q = (buscar?.value||'').toLowerCase(); this.currentFilter = q; this.currentPage = 1; this.renderClientes(); });
    if(btnAnterior) btnAnterior.addEventListener('click', ()=>{ if(this.currentPage>1){ this.currentPage--; this.renderClientes(); }});
    if(btnSiguiente) btnSiguiente.addEventListener('click', ()=>{ const totalPages = Math.ceil(this.getFiltered().length/this.itemsPerPage); if(this.currentPage<totalPages){ this.currentPage++; this.renderClientes(); }});
  }

  getFiltered(){ const q = this.currentFilter; if(!q) return this.clientes; return this.clientes.filter(c=> (c.nombre||'').toLowerCase().includes(q) || (c.codigo||'').toLowerCase().includes(q)); }
  // Eliminado: paginación visual de tabla

  renderList(){
    const container = document.getElementById('listaClientes'); if(!container) return;
    container.innerHTML = '';
  }

  escape(s){ return (s||'').toString().replace(/[&<>"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":"&#39;"})[c]); }

  attachRowEvents(){
    const idFrom = e => e.target.closest('.table-row')?.dataset?.cliId || '';
    document.querySelectorAll('#listaClientes [data-action="view"]').forEach(b=> b.addEventListener('click', e=>{ const id=idFrom(e); const c=this.clientes.find(x=>x.id===id); if(c) alert(`Cliente: ${c.nombre}\nCódigo: ${c.codigo}`); }));
    document.querySelectorAll('#listaClientes [data-action="edit"]').forEach(b=> b.addEventListener('click', e=>{ const id=idFrom(e); this.openEdit(id); }));
    document.querySelectorAll('#listaClientes [data-action="delete"]').forEach(b=> b.addEventListener('click', e=>{ const id=idFrom(e); this.deleteCliente(id); }));
  }

  openNuevo(){ const codigo = prompt('Código'); if(codigo==null) return; const nombre = prompt('Nombre'); if(nombre==null) return; const id = 'CLI-' + (this.clientes.length+1).toString().padStart(4,'0'); const c = {id,codigo,nombre,contacto:'',telefono:'',email:'',activo:true}; this.clientes.push(c); this.save(); /* sin render de datos */ this.updateStats(); }
  openEdit(id){ const c = this.clientes.find(x=>x.id===id); if(!c) return; const codigo = prompt('Código', c.codigo||''); if(codigo==null) return; const nombre = prompt('Nombre', c.nombre||''); if(nombre==null) return; c.codigo=codigo; c.nombre=nombre; this.save(); /* sin render de datos */ this.updateStats(); }
  deleteCliente(id){ if(!confirm('¿Eliminar cliente?')) return; this.clientes = this.clientes.filter(x=>x.id!==id); this.save(); /* sin render de datos */ this.updateStats(); }

  updateStats(){ const a = document.getElementById('clientesActivos'); const i = document.getElementById('clientesInactivos'); if(a) a.textContent = this.clientes.filter(x=>x.activo).length; if(i) i.textContent = this.clientes.filter(x=>!x.activo).length; }
  // Eliminado: paginación visual

  // Eliminado: sizing de columnas y grid de tabla
}

document.addEventListener('DOMContentLoaded', ()=>{ try{ window.ClientesManager = new ClientesManager(); }catch(e){ console.error(e); } });