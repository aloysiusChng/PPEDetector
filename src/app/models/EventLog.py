from app.extensions import db
from datetime import datetime, timezone

class EventLog( db.Model ):
    id = db.Column( db.BigInteger, primary_key=True, autoincrement=True )
    created_at = db.Column( db.DateTime, nullable=False, index=True )
    image_hash = db.Column( db.String( 512 ), nullable=True )
    flagged = db.Column( db.Boolean, nullable=False, default=False, index=True )
    device_name = db.Column( db.Text, nullable=False )

    def __init__(
        self,
        image_hash: str,
        flagged: bool = False,
        device_name: str = None
    ):
        self.image_hash = image_hash
        self.flagged = flagged
        self.device_name = device_name
        self.created_at = datetime.now( timezone.utc )

    def __repr__( self ):
        return f"<EventLog {self.id}>"