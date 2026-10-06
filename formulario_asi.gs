/**
 * Formulario de Google para Carlos (Dirección) y Lucía (Administración).
 *
 * Uso: script.google.com → Nuevo proyecto → pegar este archivo → ejecutar
 * `crearFormularioASI` → autorizar. En "Registro de ejecución" quedan el link
 * para compartir y el de edición. Cada ejecución crea un formulario nuevo.
 *
 * La primera pregunta ("¿Quién responde?") lleva a cada uno a su parte y los dos
 * terminan en el mismo cierre. Cada uno lo completa por separado con su link.
 */
function crearFormularioASI() {
  const form = FormApp.create('ASI - Puesta en marcha del sistema de supervisión');
  form.setDescription(
    'Hola,\n\n' +
    'El sistema de supervisión ya está funcionando en el servidor. Para dejarlo listo para el día a día ' +
    'necesitamos algunas decisiones de Carlos y la información de cómo trabaja hoy Administración.\n\n' +
    'Al empezar elegí quién sos: el formulario te muestra solo tus preguntas. ' +
    'Si algo no lo sabés, dejalo en blanco y lo vemos en persona.\n\n' +
    'Dudas: el equipo (Gino y Juan).'
  );
  form.setCollectEmail(true);
  form.setProgressBar(true);
  form.setConfirmationMessage('¡Gracias! Con esto avanzamos. Si queda alguna duda te escribimos.');

  const quien = form.addMultipleChoiceItem()
    .setTitle('¿Quién responde?')
    .setRequired(true);

  // ============================================================
  // CARLOS — DIRECCIÓN
  // ============================================================
  const inicioCarlos = form.addPageBreakItem()
    .setTitle('Carlos · 1. Cuenta del servidor, pagos y dominio');

  form.addSectionHeaderItem()
    .setTitle('Dónde funciona el sistema')
    .setHelpText(
      'El sistema funciona en Railway, un servicio en la nube que se paga por mes con tarjeta ' +
      '(alrededor de USD 5 al principio; crece con la cantidad de fotos de las actas). ' +
      'Hoy está en la cuenta del equipo. Lo recomendable es que la cuenta quede a nombre de ASI, ' +
      'para que el sistema sea de la empresa aunque el equipo cambie.'
    );

  form.addMultipleChoiceItem()
    .setTitle('¿A nombre de quién querés que quede la cuenta del servidor?')
    .setChoiceValues([
      'A nombre de ASI (con un mail de la empresa)',
      'A mi nombre',
      'Que la siga administrando el equipo y me pasen el costo'
    ])
    .setRequired(true);

  form.addTextItem()
    .setTitle('Mail para la cuenta del servidor')
    .setHelpText('El de la empresa o el tuyo. Ahí llegan las facturas y los avisos.');

  form.addMultipleChoiceItem()
    .setTitle('¿Con qué se paga?')
    .setChoiceValues(['Tarjeta de crédito de la empresa', 'Tarjeta personal'])
    .showOtherOption(true);

  form.addMultipleChoiceItem()
    .setTitle('¿Quieren usar una dirección propia, por ejemplo app.argentinaseguridad.com.ar?')
    .setHelpText('Hoy la web está en asi-supervision.pages.dev. Para usar el dominio de ASI hay que tener acceso a su configuración.')
    .setChoiceValues([
      'Sí, y el dominio lo manejamos nosotros',
      'Sí, pero el dominio lo maneja un proveedor (aclarar abajo)',
      'No hace falta por ahora',
      'No sé'
    ]);

  form.addTextItem()
    .setTitle('¿Quién maneja hoy la página web o el dominio de ASI?')
    .setHelpText('Nombre de la persona o empresa y un contacto.');

  // ------------------------------------------------------------
  form.addPageBreakItem().setTitle('Carlos · 2. Usuarios y permisos');

  form.addParagraphTextItem()
    .setTitle('Además de vos, ¿alguien más tiene que ver el panel de Dirección?')
    .setHelpText('Nombre y cargo. Si no, dejalo en blanco.');

  form.addMultipleChoiceItem()
    .setTitle('Los cambios de contraseña de los usuarios los aprobás vos. ¿Querés que también pueda aprobarlos Lucía?')
    .setChoiceValues(['Solo yo', 'Yo y Lucía'])
    .setRequired(true);

  form.addCheckboxItem()
    .setTitle('¿Qué puede ver Administración?')
    .setChoiceValues([
      'Incidencias y su resolución',
      'Actas completas, con fotos y firmas',
      'Datos personales de los vigiladores (DNI, domicilio, teléfono)',
      'Historial de sanciones',
      'Indicadores del mes (cumplimiento de visitas)'
    ]);

  form.addCheckboxItem()
    .setTitle('Durante la ronda, ¿qué puede ver el supervisor de cada vigilador?')
    .setChoiceValues([
      'Nombre y legajo',
      'Vencimiento de la credencial',
      'Actas anteriores',
      'Sanciones',
      'Teléfono'
    ]);

  // ------------------------------------------------------------
  form.addPageBreakItem().setTitle('Carlos · 3. Reglas de la supervisión');

  form.addParagraphTextItem()
    .setTitle('¿Quién define cuántas visitas por mes necesita cada objetivo? ¿Cambia según el cliente?')
    .setHelpText('El sistema mide el cumplimiento contra esa meta mensual.');

  form.addMultipleChoiceItem()
    .setTitle('Supervisión remota (cuando el supervisor no está físicamente en el lugar)')
    .setChoiceValues([
      'Se permite siempre que deje una justificación',
      'Se permite, pero quiero enterarme cada vez',
      'Solo excepcional, con autorización previa'
    ])
    .setRequired(true);

  form.addMultipleChoiceItem()
    .setTitle('¿Cuánto tiempo puede tardar una incidencia en resolverse antes de considerarse atrasada?')
    .setChoiceValues(['24 horas', '48 horas', '72 horas', '1 semana']);

  form.addMultipleChoiceItem()
    .setTitle('Si un vigilador se niega a firmar el acta...')
    .setChoiceValues([
      'Que quede registrado y vaya a RRHH (como funciona hoy)',
      'Además quiero un aviso en el momento'
    ]);

  // ------------------------------------------------------------
  form.addPageBreakItem().setTitle('Carlos · 4. Reportes y avisos');

  form.addCheckboxItem()
    .setTitle('¿Qué indicadores querés ver primero en tu panel?')
    .setChoiceValues([
      'Cumplimiento de visitas por objetivo',
      'Incidencias abiertas y críticas',
      'Tiempo promedio de resolución',
      'Supervisiones remotas',
      'Desempeño por supervisor',
      'Credenciales por vencer'
    ])
    .showOtherOption(true);

  form.addMultipleChoiceItem()
    .setTitle('¿Cada cuánto querés recibir un resumen?')
    .setChoiceValues(['Todos los días', 'Una vez por semana', 'Una vez por mes', 'No hace falta, entro al panel cuando quiero']);

  form.addCheckboxItem()
    .setTitle('Para avisos urgentes (por ejemplo, una incidencia crítica), ¿por dónde?')
    .setChoiceValues(['Mail', 'WhatsApp', 'Notificación en el celular', 'No quiero avisos urgentes']);

  form.addParagraphTextItem()
    .setTitle('¿Hoy les mandan algún informe a los clientes? ¿Qué les gustaría recibir?')
    .setHelpText('Ej: "a fin de mes, las visitas que tuvo su barrio y las novedades".');

  // ------------------------------------------------------------
  form.addPageBreakItem().setTitle('Carlos · 5. Datos y puesta en marcha');

  form.addMultipleChoiceItem()
    .setTitle('¿Autorizás copiar las planillas de personal y de rondas de la oficina para cargarlas al sistema?')
    .setHelpText('Las copiamos el día de la visita y no salen del equipo: tienen datos personales.')
    .setChoiceValues(['Sí', 'Sí, coordinándolo con Lucía', 'Prefiero hablarlo antes'])
    .setRequired(true);

  form.addMultipleChoiceItem()
    .setTitle('¿Cuánto tiempo hay que guardar las actas y sus fotos?')
    .setHelpText('Guardarlas más tiempo ocupa más espacio en el servidor y cuesta un poco más.')
    .setChoiceValues(['1 año', '2 años', '5 años', 'Para siempre']);

  form.addParagraphTextItem()
    .setTitle('¿Desde cuándo te gustaría usarlo, y con qué supervisores u objetivos empezamos a probar?');

  form.addParagraphTextItem()
    .setTitle('¿Algo más que quieras que tenga el sistema?');

  // ============================================================
  // LUCÍA — ADMINISTRACIÓN
  // ============================================================
  const inicioLucia = form.addPageBreakItem()
    .setTitle('Lucía · 1. Datos de cada vigilador');

  form.addSectionHeaderItem()
    .setTitle('Qué necesitamos por cada vigilador')
    .setHelpText(
      'No hace falta que escribas cada vigilador acá: alcanza con que nos cuentes qué datos tenés ' +
      'y dónde están. Por persona necesitamos:\n\n' +
      '- Legajo\n' +
      '- Nombre y apellido\n' +
      '- DNI\n' +
      '- Fecha de nacimiento y nacionalidad\n' +
      '- Domicilio y teléfono\n' +
      '- Puesto (ej: vigilador nocturno, jefe de puesto)\n' +
      '- Objetivo donde trabaja\n' +
      '- Convenio (ej: UPSRA)\n' +
      '- Estado (activo / suspendido)\n' +
      '- Foto (opcional)'
    );

  form.addMultipleChoiceItem()
    .setTitle('¿Tenés hoy estos datos para cada vigilador?')
    .setChoiceValues([
      'Sí, para todo el personal',
      'La mayoría, pero faltan algunos datos o algunos vigiladores',
      'Está en papel o repartido en distintos lugares'
    ])
    .setRequired(true);

  form.addParagraphTextItem()
    .setTitle('¿Qué datos faltan o están desactualizados?');

  // ------------------------------------------------------------
  form.addPageBreakItem().setTitle('Lucía · 2. Credenciales, licencias y vencimientos');

  form.addSectionHeaderItem()
    .setTitle('Documentación que vence')
    .setHelpText(
      'El sistema puede avisar antes de que venza algo. Para eso necesitamos, por vigilador:\n\n' +
      '- Número de credencial y fecha de vencimiento\n' +
      '- Si es chofer: categoría de licencia y vencimiento\n' +
      '- Si está habilitado para portar arma\n' +
      '- Si tiene radio asignada'
    );

  form.addMultipleChoiceItem()
    .setTitle('¿Hoy controlan los vencimientos?')
    .setChoiceValues([
      'Sí, con recordatorios',
      'Sí, a mano (planilla, agenda)',
      'No se controla'
    ])
    .setRequired(true);

  form.addParagraphTextItem()
    .setTitle('¿Cómo lo controlan hoy?')
    .setHelpText('Ej: una columna de vencimiento en el Excel, una carpeta por vigilador.');

  // ------------------------------------------------------------
  form.addPageBreakItem().setTitle('Lucía · 3. Sanciones y actas anteriores');

  form.addMultipleChoiceItem()
    .setTitle('¿Registran las sanciones o llamados de atención de cada vigilador?')
    .setChoiceValues([
      'Sí, todo en un mismo lugar (planilla o sistema)',
      'Sí, pero repartido (legajo en papel, mails)',
      'No se registra'
    ])
    .setRequired(true);

  form.addParagraphTextItem()
    .setTitle('¿Qué datos anotan de cada sanción?')
    .setHelpText('Ej: fecha, motivo, si está vigente o cumplida, quién la aplicó.');

  form.addMultipleChoiceItem()
    .setTitle('Las actas de rondas anteriores, ¿se pueden consultar?')
    .setChoiceValues(['Sí, están digitalizadas', 'Están en papel o carpetas', 'No se guardan ordenadas']);

  // ------------------------------------------------------------
  form.addPageBreakItem().setTitle('Lucía · 4. Asignación a objetivos');

  form.addParagraphTextItem()
    .setTitle('¿Cómo se decide a qué objetivo va cada vigilador, y quién lo actualiza?')
    .setRequired(true);

  form.addMultipleChoiceItem()
    .setTitle('¿Cada cuánto cambian las asignaciones?')
    .setChoiceValues(['Casi nunca (mismo vigilador, mismo objetivo)', 'Por turno o por semana', 'Seguido, para cubrir ausencias']);

  form.addParagraphTextItem()
    .setTitle('¿Hay vigiladores que trabajen en varios objetivos en el mismo mes? Contanos un ejemplo.');

  // ------------------------------------------------------------
  form.addPageBreakItem().setTitle('Lucía · 5. Dónde está guardada la información');

  form.addSectionHeaderItem()
    .setTitle('Para preparar la visita a la oficina')
    .setHelpText(
      'Vamos a ir a la oficina a copiar las planillas de personal y de rondas. ' +
      'No hace falta ordenar nada antes: nos sirven tal como están.'
    );

  form.addCheckboxItem()
    .setTitle('¿En qué programas está hoy la información?')
    .setChoiceValues(['Excel', 'Google Sheets / Drive', 'Access u otra base de datos', 'Un programa contratado', 'Papel / carpetas'])
    .showOtherOption(true)
    .setRequired(true);

  form.addParagraphTextItem()
    .setTitle('¿Qué archivos usan? (nombre aproximado y qué tiene cada uno)')
    .setHelpText('Ej: "Personal 2026.xlsx", una hoja por objetivo; "Rondas Octubre.xlsx", uno por mes.')
    .setRequired(true);

  form.addMultipleChoiceItem()
    .setTitle('¿Cómo están organizadas las rondas?')
    .setChoiceValues(['Un archivo por mes', 'Un archivo por supervisor', 'Un archivo por objetivo', 'Todo en un solo archivo'])
    .showOtherOption(true);

  form.addMultipleChoiceItem()
    .setTitle('¿Desde cuándo hay rondas guardadas?')
    .setChoiceValues(['Menos de 6 meses', 'Entre 6 meses y 1 año', 'Entre 1 y 3 años', 'Más de 3 años']);

  form.addParagraphTextItem()
    .setTitle('¿En qué computadora están los archivos y quién nos da acceso ese día?')
    .setHelpText('Si algún archivo tiene contraseña, avisanos, pero no la escribas acá.');

  // ------------------------------------------------------------
  form.addPageBreakItem().setTitle('Lucía · 6. Objetivos');

  form.addSectionHeaderItem()
    .setTitle('Qué necesitamos por cada objetivo')
    .setHelpText(
      '- Nombre\n' +
      '- Dirección exacta (con eso lo ubicamos en el mapa)\n' +
      '- Tipo: barrio con varios puestos, barrio con un puesto, local comercial, industria / planta, empresa / oficinas\n' +
      '- Cuántas visitas de supervisión por mes lleva\n' +
      '- Qué vigiladores trabajan ahí\n' +
      '- Si es grande (barrio, planta): hasta cuántos metros de la entrada cuenta como "estar en el lugar"'
    );

  form.addMultipleChoiceItem()
    .setTitle('¿Esta lista de objetivos está en alguna planilla?')
    .setChoiceValues(['Sí, completa', 'Sí, pero le faltan datos', 'No, la armo para ustedes'])
    .setRequired(true);

  form.addParagraphTextItem()
    .setTitle('¿Hay objetivos con algo particular que el supervisor tenga que revisar?')
    .setHelpText('Ej: "Shopping Norte tiene móvil propio", "en Los Pinos no hay cámaras".');

  // ------------------------------------------------------------
  form.addPageBreakItem().setTitle('Lucía · 7. Quiénes usan el sistema');

  form.addParagraphTextItem()
    .setTitle('Supervisores: nombre y apellido, celular y si usan Android o iPhone')
    .setHelpText('Uno por línea. Ej: "Pablo Gómez - 11 5555 1234 - Android".')
    .setRequired(true);

  // ------------------------------------------------------------
  form.addPageBreakItem().setTitle('Lucía · 8. Cómo te gustaría que quede ordenado');

  form.addSectionHeaderItem()
    .setTitle('Tus ideas')
    .setHelpText(
      'Vos sabés mejor que nadie cómo se trabaja en ASI. Con esto armamos las pantallas de ' +
      'Administración y los reportes para Carlos.'
    );

  form.addCheckboxItem()
    .setTitle('¿Cómo te sirve agrupar vigiladores y objetivos?')
    .setChoiceValues(['Por zona', 'Por cliente', 'Por turno (día / noche)', 'Por supervisor a cargo', 'Por tipo de objetivo'])
    .showOtherOption(true);

  form.addCheckboxItem()
    .setTitle('¿Qué vencimientos querés que te avise el sistema?')
    .setChoiceValues(['Credencial', 'Licencia de conducir', 'Habilitación para portar arma', 'Examen psicofísico', 'Fin de una sanción'])
    .showOtherOption(true);

  form.addMultipleChoiceItem()
    .setTitle('¿Con cuánta anticipación?')
    .setChoiceValues(['15 días antes', '30 días antes', '60 días antes']);

  form.addParagraphTextItem()
    .setTitle('¿Quién resuelve cada tipo de problema?')
    .setHelpText('Cuando el supervisor marca algo mal, el sistema se lo asigna a un área. Decinos qué persona se ocupa de cada una:\n' +
      'Operaciones, Logística (equipos, móviles, radios), Supervisión, RRHH, Mantenimiento.');

  form.addParagraphTextItem()
    .setTitle('¿Qué reportes le mandás a Carlos o a los clientes, y cada cuánto?')
    .setHelpText('Ej: "a fin de mes, cuántas visitas tuvo cada objetivo".');

  form.addCheckboxItem()
    .setTitle('¿Qué te gustaría poder cargar o cambiar vos sola desde el sistema?')
    .setChoiceValues(['Alta y baja de vigiladores', 'Datos y vencimientos de cada vigilador', 'Asignación de vigiladores a objetivos', 'Objetivos nuevos', 'Sanciones', 'Lista de control de cada objetivo']);

  form.addParagraphTextItem()
    .setTitle('Ideas libres: ¿qué cambiarías de cómo se trabaja hoy?');

  // ============================================================
  // CIERRE (los dos)
  // ============================================================
  const cierre = form.addPageBreakItem().setTitle('Cierre');

  form.addMultipleChoiceItem()
    .setTitle('Si surgen dudas, ¿cómo preferís que te contactemos?')
    .setChoiceValues(['WhatsApp', 'Llamada', 'Mail', 'En persona en la oficina']);

  form.addTextItem()
    .setTitle('Teléfono o mail de contacto');

  // ── Navegación ──
  // setGoToPage en un salto de página define a dónde va la sección ANTERIOR:
  // al terminar la última página de Carlos se pasa al cierre, sin ver las de Lucía.
  inicioLucia.setGoToPage(cierre);
  quien.setChoices([
    quien.createChoice('Carlos (Dirección)', inicioCarlos),
    quien.createChoice('Lucía (Administración)', inicioLucia)
  ]);

  Logger.log('Formulario creado.');
  Logger.log('Link para responder (mandáselo a Carlos y a Lucía): ' + form.getPublishedUrl());
  Logger.log('Link para editar: ' + form.getEditUrl());
  Logger.log('Las respuestas se ven en la pestaña "Respuestas" del formulario.');
}
