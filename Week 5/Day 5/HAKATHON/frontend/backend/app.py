
"""
MTAA FIX MANAGEMENT SYSTEM — Main Application
================================================
Flask backend with REST API, SQLite database,
authentication, and full CRUD operations.

Run:
    python app.py

API Base URL: http://localhost:5000/api
"""

import os
from flask import Flask, jsonify, send_from_directory
from flask_migrate import Migrate
from flask_login import LoginManager
from flask_mail import Mail
from flask_cors import CORS
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address

from config import config_map
from models import db, User, Technician, FixRequest

# ═══════════════════════════════════════════
# APP FACTORY
# ═══════════════════════════════════════════

def create_app(config_name=None):
    """Application factory."""
    if config_name is None:
        config_name = os.environ.get("FLASK_ENV", "development")

    app = Flask(__name__, static_folder="static", template_folder="templates")
    app.config.from_object(config_map.get(config_name, config_map["development"]))

    # ── Initialize Extensions ──
    db.init_app(app)
    Migrate(app, db)
    CORS(app, supports_credentials=True)
    mail = Mail(app)
    limiter = Limiter(get_remote_address, app=app, default_limits=["200 per hour"])

    login_manager = LoginManager(app)
    login_manager.login_view = "auth.login"

    @login_manager.user_loader
    def load_user(user_id):
        return User.query.get(int(user_id))

    @login_manager.unauthorized_handler
    def unauthorized():
        return jsonify({"success": False, "message": "Authentication required"}), 401

    # ── Register Blueprints ──
    from routes.auth import auth_bp
    from routes.requests_bp import requests_bp
    from routes.technicians import technicians_bp
    from routes.dashboard import dashboard_bp
    from routes.contact import contact_bp

    app.register_blueprint(auth_bp)
    app.register_blueprint(requests_bp)
    app.register_blueprint(technicians_bp)
    app.register_blueprint(dashboard_bp)
    app.register_blueprint(contact_bp)

    # ── Health Check ──
    @app.route("/api/health")
    def health():
        return jsonify({
            "status": "healthy",
            "app": "Mtaa Fix Management System",
            "version": "2.0.0",
        })

    # ── Serve Frontend ──
    @app.route("/")
    def index():
        return send_from_directory("static", "index.html")

    # ── Error Handlers ──
    @app.errorhandler(404)
    def not_found(e):
        return jsonify({"success": False, "message": "Resource not found"}), 404

    @app.errorhandler(500)
    def server_error(e):
        return jsonify({"success": False, "message": "Internal server error"}), 500

    @app.errorhandler(429)
    def rate_limit(e):
        return jsonify({"success": False, "message": "Rate limit exceeded"}), 429

    # ── Create Tables & Seed Data ──
    with app.app_context():
        db.create_all()
        seed_data()

    return app


# ═══════════════════════════════════════════
# SEED DATA
# ═══════════════════════════════════════════

def seed_data():
    """Seed initial data if database is empty."""

    # ── Admin User ──
    if not User.query.filter_by(username="admin").first():
        admin = User(
            username="admin",
            email="admin@mtaafix.co.tz",
            full_name="System Admin",
            phone="0700-000-000",
            role="admin",
        )
        admin.set_password("admin123")
        db.session.add(admin)

    # ── Technicians ──
    if Technician.query.count() == 0:
        technicians = [
            Technician(id="T001", name="Juma Hassan",
                       specialization="Road & Drainage",
                       phone="0712-345-678", tasks_completed=42, rating=4.8),
            Technician(id="T002", name="Amina Said",
                       specialization="Electricity",
                       phone="0723-456-789", tasks_completed=37, rating=4.9),
            Technician(id="T003", name="Baraka Mwita",
                       specialization="Water Supply",
                       phone="0734-567-890", tasks_completed=29, rating=4.7),
            Technician(id="T004", name="Grace Kimaro",
                       specialization="Street Lighting",
                       phone="0745-678-901", tasks_completed=22, rating=4.6),
            Technician(id="T005", name="Hassan Omari",
                       specialization="Garbage & Sanitation",
                       phone="0756-789-012", tasks_completed=18, rating=4.5),
        ]
        db.session.add_all(technicians)

    # ── Sample Requests ──
    if FixRequest.query.count() == 0:
        from datetime import datetime, timedelta, timezone

        now = datetime.now(timezone.utc)
        samples = [
            {
                "title": "Burst water pipe near market",
                "description": "Large water pipe burst causing flooding on the main road near Kariakoo market.",
                "category": "Water Supply",
                "priority": "Critical",
                "location": "Mtaa wa Kati",
                "city": "Dar es Salaam",
                "reported_by_name": "Mama Khadija",
                "reported_by_phone": "0712-111-222",
                "status": "In Progress",
                "assigned_technician_id": "T003",
                "created_at": now - timedelta(days=2),
                "updated_at": now - timedelta(days=1),
            },
            {
                "title": "Streetlight outage near clinic",
                "description": "Several streetlights are off near the municipal clinic, creating a safety concern at night.",
                "category": "Street Lighting",
                "priority": "High",
                "location": "Mtaa wa Magomeni",
                "city": "Dar es Salaam",
                "reported_by_name": "Abdallah Msuya",
                "reported_by_phone": "0713-222-333",
                "status": "Pending",
                "assigned_technician_id": "T004",
                "created_at": now - timedelta(days=4),
                "updated_at": now - timedelta(days=3),
            },
            {
                "title": "Blocked drainage near school",
                "description": "Drainage water is overflowing and pooling near the local primary school entrance.",
                "category": "Road & Drainage",
                "priority": "Medium",
                "location": "Mtaa wa Jangwani",
                "city": "Arusha",
                "reported_by_name": "Sofia Mlay",
                "reported_by_phone": "0714-333-444",
                "status": "Open",
                "assigned_technician_id": "T001",
                "created_at": now - timedelta(days=5),
                "updated_at": now - timedelta(days=2),
            },
            {
                "title": "Broken power line on residential lane",
                "description": "A power line is hanging low and unsafe in a residential neighborhood.",
                "category": "Electricity",
                "priority": "Critical",
                "location": "Mtaa wa Temeke",
                "city": "Dar es Salaam",
                "reported_by_name": "Juma Ali",
                "reported_by_phone": "0715-444-555",
                "status": "Escalated",
                "assigned_technician_id": "T002",
                "created_at": now - timedelta(days=1),
                "updated_at": now - timedelta(hours=2),
            },
        ]

        db.session.add_all(FixRequest(**sample) for sample in samples)
        db.session.commit()
