"""Shared domain constants for the Mtaafix backend."""

# Issue categories a report can belong to.
CATEGORIES = [
    {"id": "roads",    "label": "Roads & Potholes",  "icon": "🛣️"},
    {"id": "water",    "label": "Water",             "icon": "💧"},
    {"id": "power",    "label": "Electricity",       "icon": "⚡"},
    {"id": "garbage",  "label": "Garbage",           "icon": "🗑️"},
    {"id": "lights",   "label": "Streetlights",      "icon": "💡"},
    {"id": "drainage", "label": "Drainage & Floods", "icon": "🌊"},
    {"id": "security", "label": "Security",          "icon": "🚨"},
    {"id": "other",    "label": "Other",             "icon": "📌"},
]
CATEGORY_IDS = [c["id"] for c in CATEGORIES]

# status index -> human label (report lifecycle timeline)
STATUSES = ["Submitted", "Under Review", "Assigned", "In Progress", "Resolved"]

# Geographic areas. Each area ruler is scoped to exactly one area; residents may
# subscribe to a specific area (or all areas) for SMS notifications.
AREAS = [
    {"id": "kasarani", "name": "Kasarani"},
    {"id": "kibera",   "name": "Kibera"},
    {"id": "westlands", "name": "Westlands"},
    {"id": "embakasi", "name": "Embakasi East"},
    {"id": "mvita",    "name": "Mvita, Mombasa"},
]
AREA_IDS = [a["id"] for a in AREAS]
_AREA_BY_ID = {a["id"]: a for a in AREAS}


def area_name(area_id):
    a = _AREA_BY_ID.get(area_id)
    return a["name"] if a else (area_id or "")


def is_valid_area(area_id):
    return area_id in _AREA_BY_ID