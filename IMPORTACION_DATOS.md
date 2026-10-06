# Traer los datos reales de la oficina de ASI

Hoy ASI guarda los vigiladores y las rondas en planillas de Excel, en su servidor de la
oficina. El plan es copiarlas tal cual en la visita, cargarlas acá en una zona "cruda" de
la base y recién después pasarlas, con SQL revisado, a las tablas reales del sistema.

> ⚠️ Son datos personales (DNI, domicilios, sanciones). Van en la carpeta `datos_asi/`, que
> está en `.gitignore` (el repo es público). No mandarlos por WhatsApp ni subirlos a GitHub.
> Al terminar la importación, guardarlos donde diga Carlos y borrarlos de la Mac.

## 1. En la oficina

Llevar un pendrive (o la Mac). Antes, pedirle a Lucía que complete el formulario
(`formulario_asi.gs`, sección "Lucía · 5"): dice qué archivos hay y en qué computadora.

Copiar **sin abrir ni editar nada**:

- [ ] Planilla(s) de **personal / vigiladores** (legajos, DNI, credenciales, vencimientos).
- [ ] Planilla(s) de **rondas** — todos los meses que haya.
- [ ] Planilla de **objetivos / clientes** (direcciones), si existe.
- [ ] **Sanciones** / llamados de atención, si están en un archivo aparte.
- [ ] Cualquier otra planilla que Lucía use para el personal.

Si en vez de Excel hay una **base de datos** o un programa:

| Qué es | Cómo sacarlo |
|---|---|
| Access (`.mdb` / `.accdb`) | Copiar el archivo. Si no se puede, exportar cada tabla a Excel desde Access. |
| MySQL / MariaDB | `mysqldump -u <usuario> -p <base> > asi.sql` |
| SQL Server | Desde SSMS: *Tareas → Exportar datos* a Excel, o *Generar scripts* con datos. |
| PostgreSQL | `pg_dump -Fc <base> > asi.dump` |
| Un programa contratado | Buscar la opción "Exportar a Excel/CSV" de cada listado. |

Anotar también: qué representa cada archivo, quién lo actualiza y si alguna columna tiene
un significado que no es obvio (colores, abreviaturas, filas tachadas).

## 2. Cargar en la Mac

```bash
mkdir -p datos_asi && cp -R /Volumes/PENDRIVE/* datos_asi/
npm run importar -- datos_asi/
```

`scripts/importar_crudo.js` lee `.xlsx`, `.xls`, `.ods` y `.csv`, y copia cada hoja de cada
archivo a una tabla `crudo.<archivo>_<hoja>`:

- todas las columnas como texto, con nombres limpios (`"Vto. Credencial"` → `vto_credencial`);
- `_fila` = número de fila en Excel, para volver a la planilla original ante cualquier duda;
- detecta el encabezado aunque arriba haya títulos o filas vacías;
- las fechas guardadas como fecha en Excel quedan en formato `2026-08-15`.

Usa la base del `.env` (por defecto la local `asi`). Se puede volver a correr: reemplaza las
tablas de esos archivos. Para ver qué entró:

```bash
psql asi -c "SELECT tabla, archivo, hoja, filas, columnas FROM crudo._importaciones ORDER BY archivo, hoja"
```

## 3. Pasar a las tablas reales

Con las tablas `crudo.*` a la vista se arma un `importacion_asi.sql` (gitignored si tiene
datos) que hace `INSERT … SELECT` a `objetivos`, `vigiladores`, `historial_vigiladores`,
`sanciones` y, si sirve, a las rondas históricas, limpiando formatos (DNI con puntos, fechas
escritas a mano, nombres de objetivos con variantes). Se prueba primero en la base local y,
cuando cierra, se corre contra la de producción.
