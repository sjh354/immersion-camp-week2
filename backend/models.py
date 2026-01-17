from flask_sqlalchemy import SQLAlchemy
from sqlalchemy import Column, String, Integer, DateTime, Boolean, ForeignKey, Float, Text
from sqlalchemy.dialects.postgresql import UUID, ARRAY, ENUM
from sqlalchemy.orm import relationship
from pgvector.sqlalchemy import Vector
import uuid
from datetime import datetime
import pytz

db = SQLAlchemy()

# Enum type definition
style_enum = ENUM('default', 'detailed', 'concise', name='style_enum', create_type=False)

def get_current_time():
    return datetime.now(pytz.utc)

class User(db.Model):
    __tablename__ = 'USER'

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String(255), unique=True, nullable=False)
    password_hash = Column(String(255))
    display_name = Column(String(100))
    created_at = Column(DateTime(timezone=True), default=get_current_time)
    updated_at = Column(DateTime(timezone=True), default=get_current_time, onupdate=get_current_time)
    last_login_at = Column(DateTime(timezone=True))
    google_sub = Column(String(255), unique=True)
    setting_mbti = Column("setting_MBTI", String(10)) # Manual quoting for mixed case column name
    setting_intensity = Column("setting_Intensity", Integer) # Manual quoting
    style = Column(style_enum)

    conversations = relationship("Conversation", back_populates="user", cascade="all, delete-orphan")
    posts = relationship("Post", back_populates="user", cascade="all, delete-orphan")
    comments = relationship("Comment", back_populates="user", cascade="all, delete-orphan")

class Conversation(db.Model):
    __tablename__ = 'CONVERSATION'

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey('USER.id', ondelete='CASCADE'), nullable=False)
    title = Column(String(255))
    created_at = Column(DateTime(timezone=True), default=get_current_time)
    updated_at = Column(DateTime(timezone=True), default=get_current_time, onupdate=get_current_time)
    deleted = Column(Boolean, default=False)

    user = relationship("User", back_populates="conversations")
    messages = relationship("Message", back_populates="conversation", cascade="all, delete-orphan")

class Message(db.Model):
    __tablename__ = 'MESSAGE'

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    conversation_id = Column(UUID(as_uuid=True), ForeignKey('CONVERSATION.id', ondelete='CASCADE'), nullable=False)
    user_id = Column(UUID(as_uuid=True), ForeignKey('USER.id', ondelete='CASCADE'), nullable=False)
    role = Column(String(50), nullable=False)
    created_at = Column(DateTime(timezone=True), default=get_current_time)
    content = Column(Text)
    content_len = Column(Integer)
    language = Column(String(50))
    model_name = Column(String(100))
    temperature = Column(Float)
    embedding = Column(Vector(1024))

    conversation = relationship("Conversation", back_populates="messages")
    user = relationship("User") # No back_populates needed on User unless traversing frequently

class Post(db.Model):
    __tablename__ = 'POST'

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey('USER.id', ondelete='CASCADE'), nullable=False)
    msgs = Column(ARRAY(UUID(as_uuid=True))) # Array of Message IDs
    hearts = Column(Integer, default=0)

    user = relationship("User", back_populates="posts")
    comments = relationship("Comment", back_populates="post", cascade="all, delete-orphan")

class Comment(db.Model):
    __tablename__ = 'COMMENT'

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey('USER.id', ondelete='CASCADE'), nullable=False)
    post_id = Column(UUID(as_uuid=True), ForeignKey('POST.id', ondelete='CASCADE'), nullable=False)
    anonymous = Column(Boolean, default=False)
    content = Column(Text)
    created_at = Column(DateTime(timezone=True), default=get_current_time)

    user = relationship("User", back_populates="comments")
    post = relationship("Post", back_populates="comments")