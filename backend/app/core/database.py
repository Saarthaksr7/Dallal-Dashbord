from sqlmodel import SQLModel, create_engine, Session, select
from .config import settings
from app.models.user import User
from app.models.rdp_session import RDPSession, RDPRecording  # Import for table creation
from app.core.security import get_password_hash

connect_args = {"check_same_thread": False}
engine = create_engine(settings.DATABASE_URL, echo=True, connect_args=connect_args)

def init_db():
    SQLModel.metadata.create_all(engine)
    
    with Session(engine) as session:
        user = session.exec(select(User).where(User.username == "admin")).first()
        if not user:
            print("Creating default admin user...")
            user = User(
                username="admin", 
                hashed_password=get_password_hash("admin"),
                role="admin",
                is_superuser=True
            )
            session.add(user)
            session.commit()

def get_session():
    with Session(engine) as session:
        yield session
