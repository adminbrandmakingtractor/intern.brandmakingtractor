#!/usr/bin/env python3
"""
Local dev server with "clean URL" support — the same behavior Netlify,
Vercel and most modern static hosts give you automatically in production.

Requesting /about serves about.html directly (no redirect, URL bar stays
clean). Requesting /internship-detail?id=INT-DA-001 serves
internship-detail.html with the query string left untouched for the
page's own JS to read via location.search.

Usage: python dev-server.py [port]   (default port 8791)
"""
import http.server
import sys
import os
import urllib.parse

PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 8791
ROOT = os.path.dirname(os.path.abspath(__file__))


class CleanUrlHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=ROOT, **kwargs)

    def send_head(self):
        # Split off the query string before resolving the path to a file.
        parsed = urllib.parse.urlsplit(self.path)
        path = parsed.path

        if path != "/" and "." not in os.path.basename(path):
            candidate = os.path.join(ROOT, path.lstrip("/") + ".html")
            if os.path.isfile(candidate):
                self.path = path + ".html" + (("?" + parsed.query) if parsed.query else "")
            elif not os.path.isfile(os.path.join(ROOT, path.lstrip("/"))):
                # No matching clean-URL page and no literal file either — mirror
                # production's custom 404 page instead of the bare stdlib error.
                self.path = "/404.html"

        return super().send_head()

    def end_headers(self):
        # Keep local testing snappy and cache-free while iterating.
        self.send_header("Cache-Control", "no-cache")
        super().end_headers()


class ThreadingHTTPServer(http.server.ThreadingHTTPServer):
    # Handle each request on its own thread so a slow/kept-alive connection
    # (or a browser firing off CSS/JS/image requests in parallel) never
    # blocks or drops other requests — the plain single-threaded TCPServer
    # this used to run on would occasionally refuse connections under load.
    daemon_threads = True
    allow_reuse_address = True


if __name__ == "__main__":
    with ThreadingHTTPServer(("", PORT), CleanUrlHandler) as httpd:
        print(f"Serving {ROOT} at http://localhost:{PORT} (clean URLs enabled)")
        httpd.serve_forever()
