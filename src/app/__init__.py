import base64
import zstd
import hashlib
import boto3
from flask import Flask, request, jsonify
from app.extensions import db
from app.models.EventLog import EventLog
from sqlalchemy import func

from config import Config
web_config = Config()

def upload_image_to_s3( image_data, image_hash ):
    s3_client = boto3.client(
        "s3",
        aws_access_key_id=web_config.S3_ACCESS_KEY,
        aws_secret_access_key=web_config.S3_SECRET_KEY,
        region_name=web_config.S3_REGION
    )

    s3_client.put_object(
        Bucket=web_config.S3_BUCKET,
        Key=f"{image_hash}",
        Body=image_data,
        ContentType="image/png"
    )

def build_image_url( image_hash ):
    return f"https://{web_config.S3_BUCKET}.s3.{web_config.S3_REGION}.amazonaws.com/{image_hash}"

def create_app():
    flask_app = Flask(__name__)
    flask_app.config["SQLALCHEMY_DATABASE_URI"] = web_config.SQLALCHEMY_DATABASE_URI

    db.init_app( flask_app )

    @flask_app.route("/api/get_events", methods=["GET"])
    def get_events():
        """
            Get events from the database with optional filtering and pagination.
            Query parameters:
                - device_name: Filter events by device name ( case insensitive ) (optional) = [Device Name].
                - only_flagged: Filter to only include flagged events (optional) = true/false.
                - per_page: Number of events per page (optional) = [1-100].
                - sort_order: Sort order for events (optional) = asc/desc.
                - page: Page number for pagination (optional) = [1-∞].
            Returns:
                - events: List of event objects with details.
                - total_pages: Total number of pages available with the current filter.
                - current_page: Current page number.
                - has_next_page: Boolean indicating if there is a next page.
        """
        target_device_name = request.args.get("device_name", None)
        only_flagged = request.args.get("only_flagged", False, bool)
        per_page = request.args.get("per_page", 10, int)
        sort_order = request.args.get("sort_order", "desc")
        page = max( request.args.get("page", 1, int), 1 )
        
        try:
            assert sort_order in ["asc", "desc"], "Invalid sort order"
            assert isinstance(per_page, int) and per_page > 0, "Invalid per_page value"
            assert per_page <= 100, "per_page value exceeds limit of 100"
            assert isinstance(page, int) and page > 0, "Invalid page value"
            assert target_device_name is None or isinstance(target_device_name, str), "Invalid device name"
        except Exception as e:
            return jsonify({"error": str(e)}), 400
        
        event_query = EventLog.query
        if only_flagged:
            event_query = event_query.filter(EventLog.flagged == True)
        if target_device_name:
            event_query = event_query.filter(func.lower(EventLog.device_name) == func.lower(target_device_name))
        event_query = event_query.order_by(EventLog.created_at.desc() if sort_order == "desc" else EventLog.created_at.asc())
        event_query = event_query.paginate(page=page, per_page=per_page, error_out=False)

        event_list = []
        for event in event_query.items:
            event : EventLog = event
            event_dict = {
                "id": event.id,
                "created_at": event.created_at.timestamp(),
                "image_hash": event.image_hash,
                "flagged": event.flagged,
                "device_name": event.device_name,
                "image_url": build_image_url(event.image_hash) if event.image_hash else None
            }
            event_list.append(event_dict)
        return jsonify({
            "events": event_list,
            "total_pages": event_query.pages,
            "current_page": page,
            "has_next_page": event_query.has_next
        })

    @flask_app.route("/api/log_event", methods=["POST"])
    def log_event():
        try:
            assert "Authorization" in request.headers, "Authorization header is missing"
            assert request.headers["Authorization"] == web_config.UPLOAD_ACCESS_KEY, "Invalid Authorization key"
        except Exception as e:
            return jsonify({"error": str(e)}), 401
        
        try:
            assert request.is_json, "Request body must be JSON"
            payload_data = request.get_json()
            assert "image" in payload_data, "Image data is missing"
            assert "device_name" in payload_data, "Device name is missing"
            assert "flagged" in payload_data, "Flagged status is missing"
            assert isinstance(payload_data["flagged"], bool), "Flagged status must be a boolean"
            if payload_data["image"]:
                assert isinstance(payload_data["image"], str), "Image data must be a string or null"
            assert isinstance(payload_data["device_name"], str), "Device name must be a string"
            assert len(payload_data["device_name"]) > 0, "Device name cannot be empty"
        except Exception as e:
            return jsonify({"error": str(e)}), 400
        
        image_hash = None
        if payload_data["image"]:
            try:
                image_data = payload_data["image"]
                image_data = base64.b64decode(image_data)
                image_data = zstd.decompress(image_data)
                image_hash = hashlib.sha256(image_data).hexdigest()

                upload_image_to_s3(image_data, image_hash)
            except Exception as e:
                return jsonify({"error": str(e)}), 400

        new_event = EventLog(
            image_hash = image_hash,
            flagged = payload_data["flagged"],
            device_name = payload_data["device_name"]
        )
        db.session.add(new_event)
        db.session.commit()

        return jsonify({"message": "Event logged successfully", "event_id": new_event.id}), 200

    return flask_app