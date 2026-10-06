// Datos inventados. Este modo no realiza solicitudes a una API ni persiste información real.
(function () {
  const now = () => new Date().toISOString();
  const daysAgo = n => new Date(Date.now() - n * 86400000).toISOString();
  const objetivos = [
    { id: 1, nombre: "Barrio Los Álamos", tipo: "Barrios", subtipo: "barrio_multipuesto", modalidad: "multipuesto", direccion: "Acceso Norte 120, Ciudad Ejemplo", lat: -32.89, lng: -68.84, radio_geocerca_m: 500, visitas_meta_mes: 8, visitas_mes: 6 },
    { id: 2, nombre: "Parque Industrial Central", tipo: "Industrias", subtipo: "industria", modalidad: "multipuesto", direccion: "Ruta Provincial 10, Ciudad Ejemplo", lat: -32.92, lng: -68.80, radio_geocerca_m: 500, visitas_meta_mes: 10, visitas_mes: 7 },
    { id: 3, nombre: "Centro Comercial Norte", tipo: "Locales", subtipo: "local_comercial", modalidad: "unipersonal", direccion: "Av. Central 450, Ciudad Ejemplo", lat: -32.87, lng: -68.86, radio_geocerca_m: 300, visitas_meta_mes: 6, visitas_mes: 4 },
  ];
  const vigiladores = [
    { id: 1, legajo: 1001, nombre: "Paula Ríos", puesto: "Vigiladora", estado: "activo", objetivo_asignado: objetivos[0].nombre, credencial_venc: "2027-12-31", es_chofer: false },
    { id: 2, legajo: 1002, nombre: "Diego Torres", puesto: "Jefe de puesto", estado: "activo", objetivo_asignado: objetivos[1].nombre, credencial_venc: "2027-11-30", es_chofer: true, licencia_cat: "B2", licencia_venc: "2027-09-30" },
    { id: 3, legajo: 1003, nombre: "Laura Méndez", puesto: "Vigiladora", estado: "activo", objetivo_asignado: objetivos[2].nombre, credencial_venc: "2028-01-31", es_chofer: false },
  ];
  const secciones = [{ id: 1, clave: "seguridad", nombre: "Seguridad", color: "azul", orden: 1 }];
  const checklist = [
    { id: 1, seccion_id: 1, seccion_clave: "seguridad", titulo_corto: "Puesto y consignas", criterio_completo: "Verificar orden del puesto y conocimiento de consignas.", area_responsable: "Operaciones", tipos_objetivo: ["Barrios", "Industrias", "Locales"], orden: 1 },
    { id: 2, seccion_id: 1, seccion_clave: "seguridad", titulo_corto: "Control de accesos", criterio_completo: "Verificar registro de ingresos y egresos.", area_responsable: "Operaciones", tipos_objetivo: ["Barrios", "Industrias", "Locales"], orden: 2 },
    { id: 3, seccion_id: 1, seccion_clave: "seguridad", titulo_corto: "Estado de equipos", criterio_completo: "Comprobar funcionamiento de equipos asignados.", area_responsable: "Mantenimiento", tipos_objetivo: ["Barrios", "Industrias", "Locales"], orden: 3 },
  ];
  const tickets = [
    { id: 1, codigo_ticket: "INC-001", objetivo: objetivos[1].nombre, supervisor: "Marina López", valoracion: "M", area_responsable: "Mantenimiento", item_titulo: "Estado de equipos", vigilador: "Diego Torres", estado: "ABIERTO", descripcion: "Equipo de comunicaciones fuera de servicio.", resolucion: null, codigo_acta: "DEMO-001", fecha_creacion: daysAgo(3) },
    { id: 2, codigo_ticket: "INC-002", objetivo: objetivos[0].nombre, supervisor: "Marina López", valoracion: "R", area_responsable: "Operaciones", item_titulo: "Control de accesos", vigilador: "Paula Ríos", estado: "ABIERTO", descripcion: "Registro de visitas incompleto.", resolucion: null, codigo_acta: "DEMO-002", fecha_creacion: daysAgo(1) },
    { id: 3, codigo_ticket: "INC-003", objetivo: objetivos[2].nombre, supervisor: "Marina López", valoracion: "R", area_responsable: "Operaciones", item_titulo: "Puesto y consignas", vigilador: "Laura Méndez", estado: "CERRADO", descripcion: "Consigna actualizada y comunicada.", resolucion: "Corregido", codigo_acta: "DEMO-003", fecha_creacion: daysAgo(6) },
  ];
  const actividad = [
    { codigo_acta: "DEMO-001", fecha_hora: daysAgo(3), supervisor: "Marina López", objetivo: objetivos[1].nombre, tipo: "presencial", tickets: 1 },
    { codigo_acta: "DEMO-002", fecha_hora: daysAgo(1), supervisor: "Marina López", objetivo: objetivos[0].nombre, tipo: "presencial", tickets: 1 },
    { codigo_acta: "DEMO-003", fecha_hora: daysAgo(6), supervisor: "Marina López", objetivo: objetivos[2].nombre, tipo: "remota", tickets: 1 },
  ];
  const reply = (data, status = 200) => new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json" } });

  window.whitelabelDemoFetch = async function (path, opts = {}) {
    const url = new URL(path, location.origin);
    const route = url.pathname;
    if (route === "/api/inicializar") return reply({ ok: true, objetivos, vigiladores, secciones, checklist, ajustes: [], observaciones: [{ id: 1, area: "Operaciones", texto: "Registro incompleto" }] });
    if (route === "/api/tickets") return reply({ ok: true, tickets, paginacion: { paginas: 1 } });
    if (route.startsWith("/api/tickets/") && route.endsWith("/resolver")) {
      const item = tickets.find(t => t.id === Number(route.split("/")[3]));
      if (item) { item.estado = "CERRADO"; item.resolucion = JSON.parse(opts.body || "{}").resolucion || "Resuelto"; }
      return reply({ ok: !!item }, item ? 200 : 404);
    }
    if (route === "/api/kpis") return reply({ ok: true, kpis: {
      cumplimiento_objetivos: objetivos.map(o => ({ ...o, rondas_realizadas: o.visitas_mes })),
      tickets: { criticos: tickets.filter(t => t.estado === "ABIERTO" && t.valoracion === "M").length, abiertos: tickets.filter(t => t.estado === "ABIERTO").length, cerrados: tickets.filter(t => t.estado === "CERRADO").length, anteriores_48h: 1, dias_promedio_resolucion: 2, por_area: [{ area_responsable: "Operaciones", cantidad: 2 }, { area_responsable: "Mantenimiento", cantidad: 1 }] },
      rondas: { presenciales: 14, remotas: 3 },
    } });
    if (route === "/api/kpis/historico") return reply({ ok: true, historico: [5, 7, 8, 10, 12, 17].map((rondas, i) => ({ mes: `Mes ${i + 1}`, rondas })) });
    if (route === "/api/actividad") return reply({ ok: true, actividad: url.searchParams.get("tipo") === "remota" ? actividad.filter(a => a.tipo === "remota") : actividad });
    if (route.startsWith("/api/vigilador/")) {
      const v = vigiladores.find(x => x.legajo === Number(route.split("/").pop()));
      return reply({ ok: !!v, vigilador: v, historial: [], sanciones: [], incidencias: [] }, v ? 200 : 404);
    }
    if (route.startsWith("/api/actas/")) {
      const codigo = decodeURIComponent(route.split("/").pop());
      const a = actividad.find(x => x.codigo_acta === codigo);
      return reply(a ? { ok: true, acta: a, checklist: [], vigiladores: [], evidencias: [], tickets: tickets.filter(t => t.codigo_acta === codigo) } : { ok: false, mensaje: "Acta no encontrada" }, a ? 200 : 404);
    }
    if (route === "/api/rondas") return reply({ ok: true, codigo: `DEMO-${Date.now()}` });
    if (route === "/api/cuenta/clave") return reply({ ok: true, solicitudes: [], mensaje: "Cambio simulado en la demostración" });
    if (route === "/api/solicitudes-clave") return reply({ ok: true, solicitudes: [] });
    return reply({ ok: false, mensaje: "Función no disponible en la demostración" }, 404);
  };
})();
