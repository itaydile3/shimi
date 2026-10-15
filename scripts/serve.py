#!/usr/bin/env python3
"""Local static preview with byte-range support for video and fresh source assets."""
import argparse
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
import os
from pathlib import Path
import re

ROOT = Path(__file__).resolve().parents[1]

class PreviewHandler(SimpleHTTPRequestHandler):
    protocol_version = "HTTP/1.1"

    def end_headers(self):
        self.send_header("Accept-Ranges", "bytes")
        if self.path.split("?", 1)[0].endswith((".html", ".js", ".css", ".json")) or self.path.split("?", 1)[0].endswith("/"):
            self.send_header("Cache-Control", "no-cache")
        super().end_headers()

    def send_head(self):
        self.byte_range = None
        path = self.translate_path(self.path)
        requested = self.headers.get("Range")
        if not requested or not os.path.isfile(path):
            return super().send_head()
        size = os.path.getsize(path)
        match = re.fullmatch(r"bytes=(\d*)-(\d*)", requested.strip())
        try:
            if not match or not any(match.groups()) or not size:
                raise ValueError
            first, last = match.groups()
            if first:
                start = int(first)
                end = min(int(last), size - 1) if last else size - 1
            else:
                suffix = int(last)
                if suffix <= 0:
                    raise ValueError
                start, end = max(0, size - suffix), size - 1
            if start >= size or start > end:
                raise ValueError
        except ValueError:
            self.send_response(416)
            self.send_header("Content-Range", f"bytes */{size}")
            self.send_header("Content-Length", "0")
            self.end_headers()
            return None
        source = open(path, "rb")
        self.byte_range = (start, end)
        self.send_response(206)
        self.send_header("Content-Type", self.guess_type(path))
        self.send_header("Content-Range", f"bytes {start}-{end}/{size}")
        self.send_header("Content-Length", str(end - start + 1))
        self.send_header("Last-Modified", self.date_time_string(os.fstat(source.fileno()).st_mtime))
        self.end_headers()
        return source

    def copyfile(self, source, outputfile):
        if self.byte_range is None:
            return super().copyfile(source, outputfile)
        start, end = self.byte_range
        source.seek(start)
        remaining = end - start + 1
        while remaining:
            block = source.read(min(64 * 1024, remaining))
            if not block:
                break
            outputfile.write(block)
            remaining -= len(block)

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--port", type=int, default=8000)
    parser.add_argument("--bind", default="127.0.0.1")
    args = parser.parse_args()
    server = ThreadingHTTPServer((args.bind, args.port), partial(PreviewHandler, directory=str(ROOT)))
    print(f"Preview running at http://{args.bind}:{args.port}/", flush=True)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        server.server_close()
