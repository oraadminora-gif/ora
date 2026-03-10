# core/services/geocoding.py
"""
Geocoding via l'API officielle française : api-adresse.data.gouv.fr
Pas de clé API requise. Gratuit. Données gouvernementales.
"""
import math
import logging
import requests

logger = logging.getLogger(__name__)

GEOCODE_URL = "https://api-adresse.data.gouv.fr/search/"


def geocode_commune(commune: str, code_postal: str = "") -> tuple[float, float] | None:
    """
    Retourne (latitude, longitude) pour une commune française.
    Cherche d'abord avec code_postal + commune, puis commune seule.
    Retourne None si la recherche échoue.
    """
    query = f"{commune} {code_postal}".strip() if code_postal else commune
    if not query:
        return None

    params = {"q": query, "limit": 1, "type": "municipality"}
    if code_postal:
        params["postcode"] = code_postal

    try:
        resp = requests.get(GEOCODE_URL, params=params, timeout=5)
        resp.raise_for_status()
        features = resp.json().get("features", [])
        if features:
            lon, lat = features[0]["geometry"]["coordinates"]
            return float(lat), float(lon)
    except Exception as exc:
        logger.warning("Geocoding failed for %r: %s", query, exc)

    return None


def haversine_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """
    Calcule la distance en km entre deux points GPS (formule de Haversine).
    """
    R = 6371.0  # rayon terrestre en km
    d_lat = math.radians(lat2 - lat1)
    d_lon = math.radians(lon2 - lon1)
    a = (
        math.sin(d_lat / 2) ** 2
        + math.cos(math.radians(lat1))
        * math.cos(math.radians(lat2))
        * math.sin(d_lon / 2) ** 2
    )
    return R * 2 * math.asin(math.sqrt(a))


def ensure_coords(obj) -> bool:
    """
    Géocode `obj` si latitude/longitude sont absentes.
    `obj` doit avoir : commune, code_postal, latitude, longitude.
    Sauvegarde et retourne True si les coordonnées ont été mises à jour.
    """
    if obj.latitude and obj.longitude:
        return False  # déjà géocodé

    result = geocode_commune(
        getattr(obj, "commune", "") or getattr(obj, "city", ""),
        getattr(obj, "code_postal", ""),
    )
    if result:
        obj.latitude, obj.longitude = result
        obj.save(update_fields=["latitude", "longitude"])
        return True
    return False
