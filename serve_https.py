#!/usr/bin/env python3
"""Servidor HTTPS local para probar geolocalización real del navegador.
Envuelve http.server con un certificado autofirmado (certs/). Solo para desarrollo."""
import http.server
import ssl
import os

PORT = 5500
CERT = os.path.join(os.path.dirname(__file__), "certs", "localhost-cert.pem")
KEY = os.path.join(os.path.dirname(__file__), "certs", "localhost-key.pem")

httpd = http.server.HTTPServer(("localhost", PORT), http.server.SimpleHTTPRequestHandler)
ctx = ssl.SSLContext(ssl.PROTOCOL_TLS_SERVER)
ctx.load_cert_chain(certfile=CERT, keyfile=KEY)
httpd.socket = ctx.wrap_socket(httpd.socket, server_side=True)

print(f"Sirviendo HTTPS en https://localhost:{PORT}")
httpd.serve_forever()
