"""Lancement local : catalogue au démarrage, synchronisation toutes les six heures."""
import functools, http.server, pathlib, threading
from ingestion.sync import sync
ROOT=pathlib.Path(__file__).resolve().parent

def worker():
    while True:
        try: sync()
        except Exception as ex: print('Synchronisation interrompue :',type(ex).__name__)
        threading.Event().wait(21600)

class Handler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Cache-Control','no-cache')
        super().end_headers()

if __name__=='__main__':
    threading.Thread(target=worker,daemon=True).start()
    print('Mékoikonfé : http://127.0.0.1:8765 — arrêt : Ctrl+C',flush=True)
    http.server.ThreadingHTTPServer(('127.0.0.1',8765),functools.partial(Handler,directory=str(ROOT))).serve_forever()
