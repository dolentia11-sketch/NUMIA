"""The deployment entry must serve the same bundle whose contracts we test."""
import unittest
from fastapi.testclient import TestClient
from app.main import app


class ServedFrontendTests(unittest.TestCase):
    def test_frontend_and_bundle_are_served(self):
        with TestClient(app) as client:
            page = client.get("/")
            self.assertEqual(page.status_code, 200)
            self.assertIn('/assets/app.js', page.text)
            bundle = client.get("/assets/app.js")
            self.assertEqual(bundle.status_code, 200)
            self.assertIn('function autoBalance(', bundle.text)
            self.assertIn('function nextAuxiliaryId(', bundle.text)
