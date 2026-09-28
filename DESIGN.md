# Design — ASISA · Libro de novedades

<!-- impeccable:design-schema 1 -->

Mundo visual: **el libro de novedades foliado y rubricado**. No es un dashboard con tema
oscuro ni claymorphism recoloreado: es un libro de actas. Contrato de dirección completo en
`.impeccable/surfaces/app.md`. Ese archivo manda; este describe el sistema que lo ejecuta.

## Regla cero

**Radio cero en toda la aplicación.** Ningún `border-radius` mayor que 0, sin excepción — ni
avatares, ni sheets, ni el canvas de firma. El libro no tiene esquinas redondeadas.

## Color

Estrategia: **Committed** — el navy de tapa ocupa entre el 30 % y el 60 % de la superficie a
escala de página. No es un acento espolvoreado sobre fondo neutro.

### Tapa (tela navy ASISA)
| token | hex | uso |
|---|---|---|
| `navy-900` | `#101A33` | lomo, sombra de tela |
| `navy-800` | `#1C2A4E` | tapa en reposo |
| `navy-700` | `#2D4175` | **color del logo** — base de marca |
| `navy-600` | `#3C5490` | tapa iluminada, hover |
| `navy-500` | `#5470AC` | trazo sobre tapa |
| `navy-200` | `#C3CEE2` | reglado sobre plano claro |
| `navy-100` | `#DEE5F0` | wash |

### Hoja (papel rayado frío — NUNCA crema)
| token | hex | uso |
|---|---|---|
| `paper` | `#ECEEF0` | la hoja |
| `paper-hi` | `#F5F6F7` | hoja levantada, campo de entrada |
| `bed` | `#DDE0E4` | el lecho reglado detrás de la hoja |
| `rule` | `#C2CBD6` | hairline del renglón, 1 device pixel |

El papel del libro de actas argentino es gris-azulado. El marfil, el crema y el pergamino
están prohibidos en este sistema: son el default que cualquier modelo entrega para "libro".

### Tinta
| token | hex | contraste sobre `paper` | uso |
|---|---|---|---|
| `ink` | `#141E33` | 15.5:1 | cuerpo, titulares |
| `ink-soft` | `#32405E` | 9.2:1 | texto secundario |
| `ink-mute` | `#546282` | 4.8:1 | **piso de texto**, mínimo 16 px |
| `ink-faint` | `#8894AE` | 3.1:1 | **no-texto**: hairlines, trazos de ícono grande |

El secundario se tiñe del navy, nunca de gris neutro.

### Marcas
| token | hex | uso |
|---|---|---|
| `rubric` | `#A6272E` | filete de margen izquierdo, foco, error. **El único rojo.** |
| `stamp` | `#4B3A7A` | violeta de tampón: sellos, selección de texto |
| `foil` | `#C8A03C` | lámina dorada del lomo: acción primaria, isotipo sobre tapa |
| `foil-hi` / `foil-dim` | `#E3C46A` / `#9C7B26` | brillo y sombra de la lámina |

Tinta `ink` sobre `foil` = 6.8:1. `foil` sobre `navy-700` = 4.0:1 → sólo texto ≥ 18.66 px
bold o componentes de interfaz, nunca cuerpo.

### Semánticos (escala Likert B / R / M)
| token | hex | forma obligatoria |
|---|---|---|
| `good` `#1F6B4A` | 5.2:1 | marca de asiento ✓ |
| `warn` `#8A5A12` | 4.8:1 | triángulo + subrayado |
| `bad` = `rubric` | 6.2:1 | aspa ✕ + el renglón toma el filete bermellón |

**Nada depende sólo del color.** Cada estado lleva forma además de tono.

## Tipografía

Una sola familia: **Archivo** (Omnibus-Type, Buenos Aires), variable en peso `100..900` y
ancho `62..125`. Se eligió por ser una grotesca de trabajo pensada para formularios e impresión
de alto rendimiento, con cifras tabulares reales y foundry argentina. La jerarquía se construye
con **ancho, peso y tracking**, jamás con color.

| rol | especificación |
|---|---|
| display | 800 · wdth 112 · caja alta · tracking -0.02em · 26–34 px |
| folio | 700 · wdth 118 · cifras tabulares · 20–24 px |
| rótulo (apparatus) | 700 · wdth 92 · caja alta · tracking .14em · 12 px |
| cuerpo | 400/500 · 17 px / 1.55 — **piso absoluto 16 px** |
| dato | 600 · `font-variant-numeric: tabular-nums` |

Piso de 17 px por el perfil declarado en PRODUCT.md (usuarios grandes, vista cansada).

## Geometría y profundidad

- Ritmo base 8 px. **Renglón: 28 px** — el reglado es real y el contenido se apoya en él.
- Canaleta de margen izquierdo: 34 px, con numeración de renglón y el filete bermellón.
- Hairline 1 px `rule`; regla fuerte 2 px `ink`.
- Profundidad = papel: la hoja levanta del lecho con sombra de **offset real más blur suave**
  (`0 2px 0 rgba(20,30,51,.06), 0 10px 22px -8px rgba(20,30,51,.30)`). Nada se infla, nada
  lleva halo de color sin offset.

## Movimiento

Un solo momento autorado: **el asentado** — el sello cae sobre el acta cerrada, una vez,
con rotación y desenfoque que resuelven. Todo lo demás es un solo eje, amortiguado, ≤ 180 ms,
sin rebote. `prefers-reduced-motion` respetado.

## Superficies del navegador

Ninguna queda en default:
- `::selection` → violeta de tampón al 18 %
- `caret-color` → `rubric`
- scrollbar → 4 px, pulgar `navy-200` sobre hoja y `foil-dim` sobre tapa
- `:focus-visible` → contorno `rubric` 2 px, offset 2 px, radio 0 (un corchete, no un anillo)
- `text-underline-offset: 3px`
- cifras tabulares activas en todo dato

## Marca

`assets/asi-logo.svg` (lockup) · `assets/asi-isotipo.svg` (jinete) ·
`assets/asi-wordmark.svg` (barra + texto). Los tres usan `fill="currentColor"` y se inlinean
para teñirse desde CSS. Sobre tapa navy se estampan en `foil`; sobre hoja, en `navy-700`.

El nombre de la empresa es **ASISA** — Argentina Seguridad Integral Sociedad Anónima.
Nunca "ASI" en la interfaz.
