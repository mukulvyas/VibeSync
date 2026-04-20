import os
import logging
from datetime import datetime, timezone
from typing import Optional

logger = logging.getLogger("vibesync")

class FirebaseStore:
    """
    Handles persistence for SOS alerts using Google Cloud Firestore.
    Features a simulation mode for development environments.
    """
    def __init__(self):
        self.db = None
        self.simulated = True
        self._initialize()

    def _initialize(self):
        try:
            import firebase_admin
            from firebase_admin import credentials, firestore

            # Check for service account path in environment
            cred_path = os.getenv("GOOGLE_APPLICATION_CREDENTIALS")
            if cred_path and os.path.exists(cred_path):
                cred = credentials.Certificate(cred_path)
                firebase_admin.initialize_app(cred)
                self.db = firestore.client()
                self.simulated = False
                logger.info("Firebase Firestore initialized with Service Account.")
            else:
                # Attempt default initialization (useful for Cloud Run / GAE)
                try:
                    firebase_admin.initialize_app()
                    self.db = firestore.client()
                    self.simulated = False
                    logger.info("Firebase Firestore initialized with Application Default Credentials.")
                except Exception:
                    logger.info("Firebase in SIMULATION MODE (No credentials found).")
        except ImportError:
            logger.warning("firebase-admin not installed. Firebase in SIMULATION MODE.")
        except Exception as e:
            logger.error(f"Error initializing Firebase: {e}. Falling back to SIMULATION MODE.")

    def save_alert(self, alert_data: dict):
        """Save a new alert to Firestore."""
        if self.simulated:
            logger.info(f"[SIMULATION] Saving alert to Firestore: {alert_data.get('id')}")
            return True
        
        try:
            doc_ref = self.db.collection("alerts").document(str(alert_data.get("id")))
            doc_ref.set(alert_data)
            logger.info(f"Alert {alert_data.get('id')} persisted to Firestore.")
            return True
        except Exception as e:
            logger.error(f"Failed to save alert to Firestore: {e}")
            return False

    def update_alert(self, alert_id: int, updates: dict):
        """Update an existing alert (e.g. resolve it)."""
        if self.simulated:
            logger.info(f"[SIMULATION] Updating alert {alert_id} in Firestore: {updates}")
            return True
        
        try:
            doc_ref = self.db.collection("alerts").document(str(alert_id))
            doc_ref.update(updates)
            logger.info(f"Alert {alert_id} updated in Firestore.")
            return True
        except Exception as e:
            logger.error(f"Failed to update alert in Firestore: {e}")
            return False

# Singleton instance
firebase_store = FirebaseStore()
