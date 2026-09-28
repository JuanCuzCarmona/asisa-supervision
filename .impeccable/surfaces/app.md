# Surface brief — app (asi_prototype.html)

Mode: **Operate**. Un solo artefacto: el teléfono. Tres paneles (supervisor, admin, dueño)
y el wizard de ronda de 5 pasos + acta.

## Direction contract

**THESIS.** La app es el libro de novedades foliado y rubricado, no un dashboard. Rechaza la
grilla de tarjetas iguales sobre fondo celeste que esta categoría siempre entrega: no hay
tarjetas, hay folios; no hay "widgets", hay asientos numerados sobre renglones reales. Lo que
la pantalla promete es lo mismo que promete el libro: que lo asentado quedó asentado.

**OWN-WORLD.** Tapa: tela navy ASISA `#2D4175` con estampado en lámina dorada `#C8A03C` — el
dorado es la lámina del lomo, no un botón "premium". Hoja: papel rayado frío `#ECEEF0`
(nunca crema; el papel de libro de actas argentino es gris-azulado, no marfil). Reglado:
hairline azul-gris a 1 device pixel, dibujado, no simulado con borde. Filete de margen
izquierdo en bermellón `#A6272E` — el único rojo de la app y por eso el que manda. Sello:
violeta de tampón `#4B3A7A`, siempre rotado, siempre traslúcido, nunca centrado. **Radio cero
en todo el sistema.** Profundidad = papel: la hoja levanta del lecho reglado con sombra de
offset real; nada "infla". Una familia: **Archivo** (Omnibus-Type, Buenos Aires) variable en
peso y ancho — jerarquía por ancho, peso y tracking, nunca por color. Cuerpo 17–18 px piso.
Cifras tabulares siempre activas.

**STORY.** El supervisor entiende que está por asentar, no por "completar un formulario".
Cree que lo que firma vale porque tiene folio, hora, sello y firma al pie. Hace: abre el folio
del objetivo, asienta los ítems renglón por renglón, adjunta la evidencia, toma la firma del
vigilador y cierra el asiento. Admin y dueño leen el libro hacia atrás.

**FIRST VIEWPORT.** Tapa navy a sangre. El isotipo del jinete estampado en lámina dorada,
arriba a la izquierda, chico (28 px) y sin texto al lado. Debajo, a escala display en caja
alta y ancho expandido, el nombre del objetivo. La hoja entra desde abajo cubriendo ~70 % del
alto, con el filete bermellón corriendo por su borde izquierdo y la numeración de renglón
en la canaleta. `FOLIO Nº` y la fecha en el encabezado del folio, en cifras tabulares de
casillero fijo. La acción primaria ocupa el ancho completo del pie, 56 px de alto, en lámina
dorada sobre navy, dentro de la zona del pulgar.

**FORM.** Libro de novedades foliado — candidata 1 de mi lista ordenada de 7, presentada como
IMPECCABLE'S PICK y elegida por el usuario por encima de la asignada por el dado
(cinta de ronda, candidata 3). Seed key `dc5fa6d4`, scope direction, mode operate,
telemetría registrada con `--kind pick`.

**FINISH.** unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance

## Raises tomadas de los retadores rechazados

- **Raise (dona: nixie-laboratory-counter) — casillero fijo.** Toda cifra (hora, legajo,
  metros de geocerca, contadores) vive en una posición reservada de ancho fijo. Ningún número
  reflowa ni empuja lo que tiene al lado cuando cambia de magnitud.
- **Raise (dona: saville-catalog-sleeve) — el código es el titular.** `ACTA-20260924-0148` e
  `INC-202609-0071` se componen a escala display, no como epígrafe gris al pie.
- **Raise (dona: cyclorama-dawn) — compromiso de fase.** Las cinco fases de la ronda no son
  puntitos en un stepper: cada fase recompone el encabezado del folio completo, de modo que
  la pantalla sola dice en qué parte del asiento está.

## Retadores — veredictos

| Retador | Veredicto | Eje |
|---|---|---|
| `operate-c-emission-line-rail` | competitive | gana claridad de producto (estado por forma de línea, nunca por tono) |
| `rw-centre-rail-reference-setting` | competitive | gana claridad de producto (estados como marcas impresas, radio cero, motion de un eje) |
| `textiles-…-industrial-quote-grammar` | competitive | gana identificación del usuario (mundo de señalética industrial) |
| `stagecraft-…-cyclorama-dawn` | declined | donó compromiso de fase |
| `signals-instruments-nixie-laboratory-counter` | declined | donó casillero fijo |
| `brand-identity-canon-saville-catalog-sleeve` | declined | donó el código como titular |

Ningún retador ganó los dos ejes, así que ninguno se convirtió en la construcción.
Los tres competitivos siguen adoptables a pedido.
