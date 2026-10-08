"""
MOOD DUST 数据库模块
====================
数据库连接管理、初始化、会话处理
"""

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, scoped_session
from sqlalchemy.ext.declarative import declarative_base
from config import DATABASE_URI

# 创建引擎
engine = create_engine(
    DATABASE_URI,
    echo=False,  # 关闭SQL日志
    connect_args={'check_same_thread': False}  # SQLite多线程支持
)

# 创建会话工厂
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# 创建作用域会话（线程安全）
db_session = scoped_session(SessionLocal)

# 创建基类
Base = declarative_base()

# 导入所有模型以便创建表
from models import User, Diary, Post, Comment, MoodEntry, Favorite, Report, AccountResource, PlatformAccountDetail, HardwareResourceDetail, SoftwareResourceDetail, BillingRecord, Attachment


def init_db():
    """
    初始化数据库：创建所有表
    """
    from models import User, Diary, Post, Comment, MoodEntry, Favorite, Report, AccountResource, PlatformAccountDetail, HardwareResourceDetail, SoftwareResourceDetail, BillingRecord, Attachment
    Base.metadata.create_all(bind=engine)
    print("[Database] Tables created successfully")


def get_db():
    """
    获取数据库会话
    用法：from database import get_db; db = get_db()
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def close_db(e=None):
    """
    关闭数据库会话
    """
    db_session.remove()
