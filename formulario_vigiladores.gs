function crearFormularioVigiladores() {
  // 1. Crear el formulario
  const form = FormApp.create('ASI - Relevamiento de Personal (Vigiladores) para Lucia');
  form.setDescription(
    'Hola Lucia,\n\n' +
    'Este formulario es para relevar como llevan hoy la informacion del personal de vigilancia ' +
    '(legajos, credenciales, sanciones, asignaciones a objetivos) y asi poder cargarla en el nuevo ' +
    'sistema de supervision.\n\n' +
    'Sabemos que hoy gran parte de esto esta en papel o en una planilla de Excel, no hace falta que ' +
    'nos tipees cada vigilador aca: alcanza con que nos confirmes que campos tenes disponibles y nos ' +
    'adjuntes esa planilla donde se indica. Para dudas tecnicas, el equipo (Gino y Juan) esta a disposicion.'
  );
  form.setCollectEmail(true);

  // ==========================================
  // BLOQUE 1: DATOS MAESTROS DEL VIGILADOR
  // ==========================================
  form.addPageBreakItem().setTitle('Bloque 1 - Datos maestros de cada vigilador');

  const itemInfo = form.addSectionHeaderItem();
  itemInfo.setTitle('Informacion que necesitamos por cada vigilador');
  itemInfo.setHelpText(
    'Para dar de alta a cada vigilador en el sistema necesitamos, por persona:\n\n' +
    '- Legajo (numero interno, unico)\n' +
    '- Nombre y apellido completo\n' +
    '- DNI\n' +
    '- Fecha de nacimiento y nacionalidad\n' +
    '- Domicilio y telefono de contacto\n' +
    '- Puesto / rol (ej: sereno, jefe de turno)\n' +
    '- Objetivo(s) donde presta servicio actualmente\n' +
    '- Convenio colectivo de trabajo (ej: UPSRA)\n' +
    '- Estado (activo / suspendido)\n' +
    '- Foto (para credencial digital, opcional)'
  );

  form.addTextItem()
    .setTitle('Link a la planilla de Excel o carpeta con las fichas del personal (Drive, WhatsApp, mail)')
    .setHelpText('Si no la tenes subida a ningun lado, contanos como preferis hacernosla llegar en la pregunta de Observaciones mas abajo.')
    .setRequired(false);

  form.addMultipleChoiceItem()
    .setTitle('Tenes todos estos datos cargados hoy para cada vigilador, o hay campos que no se registran?')
    .setChoiceValues([
      'Tengo todos estos datos para todo el personal.',
      'Tengo la mayoria, pero faltan algunos campos o algunos vigiladores (detallar abajo).',
      'Hoy esto esta solo en papel / no esta centralizado en ningun lado.'
    ])
    .setRequired(true);

  form.addParagraphTextItem()
    .setTitle('Observaciones sobre los datos maestros')
    .setHelpText('Que campos faltan, estan desactualizados, o como preferis hacernos llegar la planilla?');

  // ==========================================
  // BLOQUE 2: CREDENCIALES, LICENCIAS Y HABILITACIONES
  // ==========================================
  form.addPageBreakItem().setTitle('Bloque 2 - Credenciales, licencias y habilitaciones');

  const itemDoc = form.addSectionHeaderItem();
  itemDoc.setTitle('Documentacion con vencimiento');
  itemDoc.setHelpText(
    'El sistema puede alertar automaticamente cuando una credencial o licencia esta por vencer. ' +
    'Para eso necesitamos, por vigilador:\n\n' +
    '- Numero de credencial habilitante y fecha de vencimiento\n' +
    '- Es chofer? Categoria de licencia de conducir y fecha de vencimiento\n' +
    '- Esta habilitado para portar arma (armado)?\n' +
    '- Tiene asignado handheld / radio de comunicacion?'
  );

  form.addMultipleChoiceItem()
    .setTitle('Hoy llevan un control de vencimientos de credenciales y licencias?')
    .setChoiceValues([
      'Si, con alertas o recordatorios (contanos como)',
      'Si, pero de forma manual (planilla, agenda, etc.)',
      'No, no se controla sistematicamente'
    ])
    .setRequired(true);

  form.addParagraphTextItem()
    .setTitle('Como llevan ese control hoy?')
    .setHelpText('Ej: Excel con columna de vencimiento, carpeta fisica por vigilador, no se lleva.');

  // ==========================================
  // BLOQUE 3: HISTORIAL, SANCIONES Y ACTAS
  // ==========================================
  form.addPageBreakItem().setTitle('Bloque 3 - Historial disciplinario y actas del vigilador');

  const itemHist = form.addSectionHeaderItem();
  itemHist.setTitle('Historial por vigilador');
  itemHist.setHelpText(
    'Queremos poder mostrarle al supervisor, antes de una ronda, el historial de cada vigilador: ' +
    'actas anteriores y sanciones (descripcion, fecha, y si la sancion esta activa, cumplida o apelada).'
  );

  form.addMultipleChoiceItem()
    .setTitle('Llevan hoy un registro de sanciones o llamados de atencion por vigilador?')
    .setChoiceValues([
      'Si, centralizado (planilla o sistema)',
      'Si, pero disperso (legajo en papel, mails sueltos, etc.)',
      'No se registra formalmente'
    ])
    .setRequired(true);

  form.addParagraphTextItem()
    .setTitle('Formato del registro de sanciones/historial')
    .setHelpText('Si tenes un registro, que datos incluye por sancion? (fecha, motivo, estado, quien la aplico, etc.) Adjunta un ejemplo si podes.');

  form.addMultipleChoiceItem()
    .setTitle('Las actas de rondas anteriores estan guardadas en algun lado consultable?')
    .setChoiceValues(['Si, digitalizadas', 'Si, pero en papel/carpetas', 'No se conservan de forma organizada']);

  // ==========================================
  // BLOQUE 4: ASIGNACION A OBJETIVOS Y TURNOS
  // ==========================================
  form.addPageBreakItem().setTitle('Bloque 4 - Asignacion a objetivos y turnos');

  form.addParagraphTextItem()
    .setTitle('Como se decide y actualiza a que objetivo va cada vigilador?')
    .setHelpText('Ej: planilla de asignaciones semanal, decision del supervisor de zona, rotacion fija, etc.')
    .setRequired(true);

  form.addMultipleChoiceItem()
    .setTitle('Con que frecuencia cambian las asignaciones de vigilador a objetivo?')
    .setChoiceValues(['Practicamente fijas (mismo vigilador, mismo objetivo)', 'Cambian por turno/semana', 'Cambian con frecuencia segun cobertura de ausencias']);

  form.addParagraphTextItem()
    .setTitle('Hay vigiladores que roten entre varios objetivos en un mismo mes?')
    .setHelpText('Si es asi, contanos un ejemplo para entender el caso.');

  // ==========================================
  // CIERRE
  // ==========================================
  form.addPageBreakItem().setTitle('Cierre');

  form.addMultipleChoiceItem()
    .setTitle('Cual es la mejor forma de coordinar una llamada o visita si surgen dudas al completar esto?')
    .setChoiceValues(['WhatsApp', 'Llamada telefonica', 'Email', 'Reunion presencial en la oficina de ASI']);

  form.addTextItem()
    .setTitle('Datos de contacto (telefono o email) para coordinar');

  // Generar enlaces
  Logger.log('Formulario de vigiladores creado con exito!');
  Logger.log('URL de edicion: ' + form.getEditUrl());
  Logger.log('URL para responder: ' + form.getPublishedUrl());
}
