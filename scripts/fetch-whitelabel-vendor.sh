#!/bin/sh
set -eu
cd "$(dirname "$0")/.."
mkdir -p assets/vendor/whitelabel
curl -fLsS --max-time 60 'https://unpkg.com/react@18.3.1/umd/react.production.min.js' -o assets/vendor/whitelabel/react.production.min.js
curl -fLsS --max-time 60 'https://unpkg.com/react-dom@18.3.1/umd/react-dom.production.min.js' -o assets/vendor/whitelabel/react-dom.production.min.js
curl -fLsS --max-time 60 'https://unpkg.com/@babel/standalone@7.25.9/babel.min.js' -o assets/vendor/whitelabel/babel.min.js
curl -fLsS --max-time 60 'https://cdn.tailwindcss.com/3.4.17' -o assets/vendor/whitelabel/tailwindcss.js
curl -fLsS --max-time 60 'https://unpkg.com/react@18.3.1/LICENSE' -o assets/vendor/whitelabel/LICENSE.react
curl -fLsS --max-time 60 'https://unpkg.com/react-dom@18.3.1/LICENSE' -o assets/vendor/whitelabel/LICENSE.react-dom
curl -fLsS --max-time 60 'https://unpkg.com/@babel/standalone@7.25.9/LICENSE' -o assets/vendor/whitelabel/LICENSE.babel
curl -fLsS --max-time 60 'https://unpkg.com/tailwindcss@3.4.17/LICENSE' -o assets/vendor/whitelabel/LICENSE.tailwindcss
echo 'Dependencias locales descargadas'
