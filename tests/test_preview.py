import http.client
import importlib.util
from functools import partial
from http.server import ThreadingHTTPServer
from pathlib import Path
import threading
import unittest

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location('serve', ROOT / 'scripts/serve.py')
serve = importlib.util.module_from_spec(spec)
spec.loader.exec_module(serve)

class QuietHandler(serve.PreviewHandler):
    def log_message(self, *args):
        pass

class PreviewRangeTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.server = ThreadingHTTPServer(('127.0.0.1', 0), partial(QuietHandler, directory=str(ROOT)))
        cls.thread = threading.Thread(target=cls.server.serve_forever, daemon=True)
        cls.thread.start()
        cls.media = (ROOT / 'assets/hero.mp4').read_bytes()

    @classmethod
    def tearDownClass(cls):
        cls.server.shutdown()
        cls.server.server_close()
        cls.thread.join()

    def request(self, path, byte_range=None, method='GET'):
        connection = http.client.HTTPConnection('127.0.0.1', self.server.server_port)
        headers = {'Range': byte_range} if byte_range else {}
        connection.request(method, path, headers=headers)
        response = connection.getresponse()
        result = response.status, dict(response.getheaders()), response.read()
        connection.close()
        return result

    def test_video_initial_probe_is_exactly_two_bytes(self):
        status, headers, body = self.request('/assets/hero.mp4', 'bytes=0-1')
        self.assertEqual(status, 206)
        self.assertEqual(headers['Content-Range'], f'bytes 0-1/{len(self.media)}')
        self.assertEqual(body, self.media[:2])

    def test_open_range_and_suffix_range(self):
        for header, expected in [('bytes=5-', self.media[5:]), ('bytes=-4', self.media[-4:])]:
            with self.subTest(header=header):
                status, _, body = self.request('/assets/hero.mp4', header)
                self.assertEqual(status, 206)
                self.assertEqual(body, expected)

    def test_unsatisfiable_range_has_no_body(self):
        status, headers, body = self.request('/assets/hero.mp4', f'bytes={len(self.media)}-')
        self.assertEqual(status, 416)
        self.assertEqual(headers['Content-Range'], f'bytes */{len(self.media)}')
        self.assertEqual(body, b'')

    def test_head_range_and_fresh_source(self):
        status, headers, body = self.request('/assets/hero.mp4', 'bytes=0-1', 'HEAD')
        self.assertEqual(status, 206)
        self.assertEqual(headers['Content-Length'], '2')
        self.assertEqual(body, b'')
        status, headers, _ = self.request('/')
        self.assertEqual(status, 200)
        self.assertEqual(headers['Cache-Control'], 'no-cache')

if __name__ == '__main__':
    unittest.main()
