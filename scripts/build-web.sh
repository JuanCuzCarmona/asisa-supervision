#!/bin/bash
# Arma web-dist/ para publicar la webapp en Cloudflare Pages:
#   bash scripts/build-web.sh && wrangler pages deploy web-dist --project-name asi-supervision --branch main
# asi_prototype.html sigue siendo la fuente única; esto solo copia y agrega íconos/manifest.
#
# La página ya apunta al servidor de producción (<meta name="asi-api-url">).
# ASI_API_URL=https://otro-servidor bash scripts/build-web.sh la reemplaza en web-dist.
set -e
cd "$(dirname "$0")/.."
rm -rf web-dist && mkdir -p web-dist
cp asi_prototype.html web-dist/index.html
if [ -n "${ASI_API_URL:-}" ]; then
  case "$ASI_API_URL" in
    https://*) ;;
    *) echo "ASI_API_URL tiene que ser https:// (el celular bloquea HTTP sin cifrar)"; exit 1 ;;
  esac
  ASI_API_URL="$ASI_API_URL" python3 - <<'EOF2'
import os, re
p = 'web-dist/index.html'; s = open(p, encoding='utf-8').read()
s, n = re.subn(r'<meta name="asi-api-url" content="[^"]*" />',
               f'<meta name="asi-api-url" content="{os.environ["ASI_API_URL"]}" />', s)
assert n == 1, "No se encontró <meta name=asi-api-url> en asi_prototype.html"
open(p, 'w', encoding='utf-8').write(s)
EOF2
  echo "API fija: $ASI_API_URL"
fi
python3 - <<'EOF'
from PIL import Image, ImageDraw, ImageFilter
import json
bl=Image.open('assets/brand/asi-emblem-white.png').convert('RGBA')
TOP,BOT=(0x74,0xAC,0xDF),(0x2F,0x7B,0xBF)
def icono(size, frac=0.62):
    im=Image.new('RGBA',(size,size)); d=ImageDraw.Draw(im)
    for y in range(size):
        k=y/(size-1); d.line([(0,y),(size,y)],fill=tuple(int(TOP[i]+(BOT[i]-TOP[i])*k) for i in range(3))+(255,))
    h=int(size*frac); w=int(bl.size[0]*h/bl.size[1]); e=bl.resize((w,h),Image.LANCZOS)
    x=(size-w)//2; y=(size-h)//2-int(size*0.01)
    sh=Image.new('RGBA',e.size,(10,30,80,0)); sh.putalpha(e.split()[3].point(lambda v:int(v*0.30)))
    t=Image.new('RGBA',(size,size),(0,0,0,0)); t.alpha_composite(sh,(x,y+int(size*0.012)))
    im.alpha_composite(t.filter(ImageFilter.GaussianBlur(size*0.012))); im.alpha_composite(e,(x,y))
    return im.convert('RGB')
icono(180).save('web-dist/apple-touch-icon.png')   # iOS redondea las esquinas solo
icono(192).save('web-dist/icon-192.png'); icono(512).save('web-dist/icon-512.png')
icono(512,0.46).save('web-dist/icon-maskable-512.png')
json.dump({"name":"ASI · Supervisión","short_name":"ASI","start_url":"/","display":"standalone",
  "background_color":"#F4F6FA","theme_color":"#F4F6FA","lang":"es-AR",
  "icons":[{"src":"icon-192.png","sizes":"192x192","type":"image/png"},
           {"src":"icon-512.png","sizes":"512x512","type":"image/png"},
           {"src":"icon-maskable-512.png","sizes":"512x512","type":"image/png","purpose":"maskable"}]},
  open('web-dist/manifest.webmanifest','w'),ensure_ascii=False,indent=2)
EOF
# Encabezados para Cloudflare Pages
cat > web-dist/_headers <<'HDR'
/*
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin
  X-Frame-Options: SAMEORIGIN
/index.html
  Cache-Control: no-cache
HDR
echo "web-dist listo"
