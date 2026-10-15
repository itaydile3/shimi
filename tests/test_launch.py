import copy
import importlib.util
import json
from pathlib import Path
import unittest
from urllib.parse import urljoin

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location('configure_site', ROOT / 'scripts/configure_site.py')
site = importlib.util.module_from_spec(spec)
spec.loader.exec_module(site)

class LaunchConfigTests(unittest.TestCase):
    def setUp(self):
        self.config = json.loads((ROOT / 'site-config.json').read_text())

    def production_config(self):
        config = copy.deepcopy(self.config)
        config['demo'] = False
        config['siteUrl'] = 'https://studio.example.com/'
        config['instagramUrl'] = 'https://www.instagram.com/test_fixture/'
        config['analytics'] = {'ga4Id': 'G-1234567890', 'metaPixelId': '123456789012345', 'clarityId': 'abc123def4'}
        for item in config['testimonials']:
            item['approved'] = True
            item['image'] = ''
        return config

    def test_demo_is_safe_to_preview_but_not_production(self):
        site.validate(self.config)
        with self.assertRaises(ValueError):
            site.validate(self.config, production=True)

    def test_fake_tracking_ids_cannot_leave_demo_mode(self):
        config = self.production_config()
        config['analytics']['ga4Id'] = 'G-DEMO000000'
        with self.assertRaises(ValueError):
            site.validate(config)

    def test_unapproved_quotes_are_rejected_for_production(self):
        config = self.production_config()
        config['testimonials'][0]['approved'] = False
        with self.assertRaises(ValueError):
            site.validate(config)

    def test_demo_portraits_cannot_be_approved_into_production(self):
        config = self.production_config()
        config['testimonials'][0]['image'] = 'assets/demo-client-a.svg'
        with self.assertRaises(ValueError):
            site.validate(config)

    def test_media_cannot_escape_the_project(self):
        config = copy.deepcopy(self.config)
        config['testimonials'][0]['image'] = '../outside.svg'
        with self.assertRaises(ValueError):
            site.validate(config)

    def test_generated_metadata_is_static_absolute_and_unique(self):
        rendered = site.render(self.config)
        base = self.config['siteUrl'].rstrip('/') + '/'
        image = urljoin(base, 'assets/og.jpg')
        self.assertIn(f'property="og:image" content="{image}"', rendered)
        self.assertIn(f'name="twitter:image" content="{image}"', rendered)
        self.assertIn(f'rel="canonical" href="{base}"', rendered)
        self.assertEqual(rendered.count('property="og:image"'), 1)
        self.assertEqual(rendered.count('rel="canonical"'), 1)
        self.assertEqual(rendered.count('class="testimonial reveal"'), 2)
        self.assertIn('NOT AN ACTUAL CLIENT TESTIMONIAL', rendered)
        self.assertNotIn('href="https://instagram.example', rendered)
        self.assertEqual(rendered, (ROOT / 'index.html').read_text())

if __name__ == '__main__':
    unittest.main()
