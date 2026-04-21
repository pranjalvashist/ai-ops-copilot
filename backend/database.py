from sqlalchemy import create_engine, Column, Integer, String
from sqlalchemy.orm import sessionmaker, declarative_base

# ✅ Correct SQLite path (works on Render)
engine = create_engine(
    "sqlite:///./chat.db",
    connect_args={"check_same_thread": False}
)

SessionLocal = sessionmaker(bind=engine)

Base = declarative_base()

# ✅ Message table
class Message(Base):
    __tablename__ = "messages"

    id = Column(Integer, primary_key=True, index=True)
    role = Column(String)
    content = Column(String)

# ✅ Auto-create tables on startup
Base.metadata.create_all(bind=engine)