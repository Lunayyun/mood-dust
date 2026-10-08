"""
MOOD DUST 数据模型
==================
SQLAlchemy ORM 模型定义
"""

from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, ForeignKey, Table, Float
from sqlalchemy.orm import relationship
from database import Base


# 帖子-标签关联表
post_tags = Table(
    'post_tags',
    Base.metadata,
    Column('post_id', Integer, ForeignKey('posts.id'), primary_key=True),
    Column('tag_id', Integer, ForeignKey('tags.id'), primary_key=True)
)


class User(Base):
    """
    用户模型
    """
    __tablename__ = 'users'

    id = Column(Integer, primary_key=True)
    username = Column(String(50), unique=True, nullable=False, index=True)
    password_hash = Column(String(128), nullable=False)
    created_at = Column(DateTime, default=datetime.now)
    updated_at = Column(DateTime, default=datetime.now, onupdate=datetime.now)

    # 关系
    diaries = relationship('Diary', back_populates='user', cascade='all, delete-orphan')
    posts = relationship('Post', back_populates='user', cascade='all, delete-orphan')

    def to_dict(self):
        return {
            'id': self.id,
            'username': self.username,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }


class Diary(Base):
    """
    日记模型
    """
    __tablename__ = 'diaries'

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey('users.id'), nullable=False, index=True)
    date = Column(String(10), nullable=False, index=True)  # YYYY-MM-DD
    mood = Column(String(20))  # meditation, isolate, happy, sad等
    content = Column(Text)
    ai_sentence = Column(Text)
    image_paths = Column(Text)  # JSON字符串，存储图片路径数组
    created_at = Column(DateTime, default=datetime.now)
    updated_at = Column(DateTime, default=datetime.now, onupdate=datetime.now)

    # 关系
    user = relationship('User', back_populates='diaries')

    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'date': self.date,
            'mood': self.mood,
            'content': self.content,
            'ai_sentence': self.ai_sentence,
            'image_paths': self.image_paths,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }


class Post(Base):
    """
    社区帖子模型
    """
    __tablename__ = 'posts'

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey('users.id'), nullable=True, index=True)  # 可为空（匿名）
    content = Column(Text, nullable=False)
    is_anonymous = Column(Boolean, default=False)
    author_name = Column(String(50))  # 匿名时存储"Anonymous"，实名时存储用户名
    timestamp = Column(DateTime, default=datetime.now)
    likes_count = Column(Integer, default=0)
    comments_count = Column(Integer, default=0)

    # 关系
    user = relationship('User', back_populates='posts')
    comments = relationship('Comment', back_populates='post', cascade='all, delete-orphan')
    tags = relationship('Tag', secondary=post_tags, back_populates='posts')

    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'content': self.content,
            'is_anonymous': self.is_anonymous,
            'author': self.author_name,
            'timestamp': self.timestamp.isoformat() if self.timestamp else None,
            'likes_count': self.likes_count,
            'comments_count': self.comments_count,
            'tags': [tag.name for tag in self.tags]
        }


class Comment(Base):
    """
    评论模型
    """
    __tablename__ = 'comments'

    id = Column(Integer, primary_key=True)
    post_id = Column(Integer, ForeignKey('posts.id'), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey('users.id'), nullable=True)
    parent_comment_id = Column(Integer, ForeignKey('comments.id'), nullable=True)  # 回复功能
    content = Column(Text, nullable=False)
    is_anonymous = Column(Boolean, default=False)
    author_name = Column(String(50))
    timestamp = Column(DateTime, default=datetime.now)

    # 关系
    post = relationship('Post', back_populates='comments')
    replies = relationship('Comment', backref='parent', remote_side=[id])

    def to_dict(self):
        return {
            'id': self.id,
            'post_id': self.post_id,
            'parent_comment_id': self.parent_comment_id,
            'content': self.content,
            'is_anonymous': self.is_anonymous,
            'author': self.author_name,
            'timestamp': self.timestamp.isoformat() if self.timestamp else None,
            'replies': [r.to_dict() for r in self.replies]
        }


class Tag(Base):
    """
    标签模型
    """
    __tablename__ = 'tags'

    id = Column(Integer, primary_key=True)
    name = Column(String(50), unique=True, nullable=False, index=True)
    usage_count = Column(Integer, default=0)

    # 关系
    posts = relationship('Post', secondary=post_tags, back_populates='tags')

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'usage_count': self.usage_count
        }


class MoodEntry(Base):
    """
    心情记录模型（用于统计）
    """
    __tablename__ = 'mood_entries'

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey('users.id'), nullable=False, index=True)
    mood = Column(String(20), nullable=False)
    date = Column(String(10), nullable=False, index=True)  # YYYY-MM-DD
    created_at = Column(DateTime, default=datetime.now)

    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'mood': self.mood,
            'date': self.date,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }


class PostLike(Base):
    """
    帖子点赞模型
    """
    __tablename__ = 'post_likes'

    id = Column(Integer, primary_key=True)
    post_id = Column(Integer, ForeignKey('posts.id'), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey('users.id'), nullable=False)
    created_at = Column(DateTime, default=datetime.now)


class Favorite(Base):
    __tablename__ = 'post_favorites'

    id = Column(Integer, primary_key=True)
    post_id = Column(Integer, ForeignKey('posts.id'), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey('users.id'), nullable=False, index=True)
    created_at = Column(DateTime, default=datetime.now)


class Report(Base):
    __tablename__ = 'post_reports'

    id = Column(Integer, primary_key=True)
    post_id = Column(Integer, ForeignKey('posts.id'), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey('users.id'), nullable=False, index=True)
    reason = Column(String(100), nullable=False)
    created_at = Column(DateTime, default=datetime.now)


class AccountResource(Base):
    """
    账号资源主表
    """
    __tablename__ = 'account_resources'

    id = Column(Integer, primary_key=True)
    resource_type = Column(String(20), nullable=False, index=True)
    name = Column(String(100), nullable=False, index=True)
    category = Column(String(50))
    username = Column(String(100), index=True)
    password_secret = Column(String(255))
    manager_name = Column(String(50), index=True)
    project_id = Column(Integer)
    status = Column(String(20), default='正常使用', index=True)
    access_address = Column(String(255))
    remark = Column(Text)
    created_at = Column(DateTime, default=datetime.now)
    updated_at = Column(DateTime, default=datetime.now, onupdate=datetime.now)
    deleted_at = Column(DateTime)

    platform_detail = relationship('PlatformAccountDetail', uselist=False, back_populates='resource', cascade='all, delete-orphan')
    hardware_detail = relationship('HardwareResourceDetail', uselist=False, back_populates='resource', cascade='all, delete-orphan')
    software_detail = relationship('SoftwareResourceDetail', uselist=False, back_populates='resource', cascade='all, delete-orphan')
    billing_records = relationship('BillingRecord', back_populates='resource', cascade='all, delete-orphan')
    attachments = relationship('Attachment', back_populates='resource', cascade='all, delete-orphan')

    def to_dict(self, include_password=False):
        data = {
            'id': self.id,
            'resource_type': self.resource_type,
            'name': self.name,
            'category': self.category,
            'username': self.username,
            'manager_name': self.manager_name,
            'project_id': self.project_id,
            'status': self.status,
            'access_address': self.access_address,
            'remark': self.remark,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }
        if include_password:
            data['password_secret'] = self.password_secret
        return data


class PlatformAccountDetail(Base):
    """
    平台账号详情
    """
    __tablename__ = 'platform_account_details'

    id = Column(Integer, primary_key=True)
    resource_id = Column(Integer, ForeignKey('account_resources.id'), nullable=False, index=True)
    platform_category = Column(String(50))
    website_url = Column(String(255))
    registrant_name = Column(String(50))
    registered_contact_name = Column(String(50))
    registered_contact_phone = Column(String(20))
    registered_contact_email = Column(String(100))
    platform_contact_name = Column(String(50))
    platform_contact_department = Column(String(100))
    platform_contact_position = Column(String(50))
    platform_contact_phone = Column(String(20))
    platform_contact_email = Column(String(100))
    platform_contact_remark = Column(Text)
    login_method = Column(String(50))
    is_two_factor_auth = Column(Boolean, default=False)

    resource = relationship('AccountResource', back_populates='platform_detail')

    def to_dict(self):
        return {
            'id': self.id,
            'resource_id': self.resource_id,
            'platform_category': self.platform_category,
            'website_url': self.website_url,
            'registrant_name': self.registrant_name,
            'registered_contact_name': self.registered_contact_name,
            'registered_contact_phone': self.registered_contact_phone,
            'registered_contact_email': self.registered_contact_email,
            'platform_contact_name': self.platform_contact_name,
            'platform_contact_department': self.platform_contact_department,
            'platform_contact_position': self.platform_contact_position,
            'platform_contact_phone': self.platform_contact_phone,
            'platform_contact_email': self.platform_contact_email,
            'platform_contact_remark': self.platform_contact_remark,
            'login_method': self.login_method,
            'is_two_factor_auth': self.is_two_factor_auth
        }


class HardwareResourceDetail(Base):
    """
    硬件资源详情
    """
    __tablename__ = 'hardware_resource_details'

    id = Column(Integer, primary_key=True)
    resource_id = Column(Integer, ForeignKey('account_resources.id'), nullable=False, index=True)
    resource_code = Column(String(50))
    hardware_type = Column(String(50))
    server_name = Column(String(100))
    purpose = Column(String(200))
    operating_system = Column(String(50))
    cpu_info = Column(String(100))
    memory_size = Column(String(50))
    disk_capacity = Column(String(50))
    ip_address = Column(String(50))
    private_ip = Column(String(50))
    public_ip = Column(String(50))
    login_port = Column(Integer)
    login_protocol = Column(String(20))
    location = Column(String(100))
    brand = Column(String(50))
    model = Column(String(100))
    activated_at = Column(DateTime)
    is_cloud = Column(Boolean, default=False)

    resource = relationship('AccountResource', back_populates='hardware_detail')

    def to_dict(self):
        return {
            'id': self.id,
            'resource_id': self.resource_id,
            'resource_code': self.resource_code,
            'hardware_type': self.hardware_type,
            'server_name': self.server_name,
            'purpose': self.purpose,
            'operating_system': self.operating_system,
            'cpu_info': self.cpu_info,
            'memory_size': self.memory_size,
            'disk_capacity': self.disk_capacity,
            'ip_address': self.ip_address,
            'private_ip': self.private_ip,
            'public_ip': self.public_ip,
            'login_port': self.login_port,
            'login_protocol': self.login_protocol,
            'location': self.location,
            'brand': self.brand,
            'model': self.model,
            'activated_at': self.activated_at.isoformat() if self.activated_at else None,
            'is_cloud': self.is_cloud
        }


class SoftwareResourceDetail(Base):
    """
    软件资源详情
    """
    __tablename__ = 'software_resource_details'

    id = Column(Integer, primary_key=True)
    resource_id = Column(Integer, ForeignKey('account_resources.id'), nullable=False, index=True)
    software_type = Column(String(50))
    version = Column(String(50))
    purpose = Column(String(200))
    deployed_server = Column(String(100))
    server_ip = Column(String(50))
    access_address = Column(String(255))
    login_port = Column(Integer)
    login_protocol = Column(String(20))
    deploy_path = Column(String(200))
    deployed_at = Column(DateTime)
    license_required = Column(Boolean, default=False)
    license_type = Column(String(50))
    license_info = Column(Text)
    expires_at = Column(DateTime)
    admin_url = Column(String(255))
    login_note = Column(Text)

    resource = relationship('AccountResource', back_populates='software_detail')

    def to_dict(self):
        return {
            'id': self.id,
            'resource_id': self.resource_id,
            'software_type': self.software_type,
            'version': self.version,
            'purpose': self.purpose,
            'deployed_server': self.deployed_server,
            'server_ip': self.server_ip,
            'access_address': self.access_address,
            'login_port': self.login_port,
            'login_protocol': self.login_protocol,
            'deploy_path': self.deploy_path,
            'deployed_at': self.deployed_at.isoformat() if self.deployed_at else None,
            'license_required': self.license_required,
            'license_type': self.license_type,
            'license_info': self.license_info,
            'expires_at': self.expires_at.isoformat() if self.expires_at else None,
            'admin_url': self.admin_url,
            'login_note': self.login_note
        }


class BillingRecord(Base):
    """
    付费记录
    """
    __tablename__ = 'billing_records'

    id = Column(Integer, primary_key=True)
    resource_id = Column(Integer, ForeignKey('account_resources.id'), nullable=False, index=True)
    is_paid = Column(Boolean, default=False)
    fee_type = Column(String(20))
    renewal_cycle = Column(String(20))
    last_renewal_date = Column(DateTime)
    next_renewal_date = Column(DateTime, index=True)
    amount = Column(Float)
    currency = Column(String(10), default='CNY')
    payer_name = Column(String(50))
    payment_status = Column(String(20), default='未付款')
    contract_name = Column(String(100))
    contract_number = Column(String(50))
    contract_start_date = Column(DateTime)
    contract_end_date = Column(DateTime)
    fee_remark = Column(Text)
    created_at = Column(DateTime, default=datetime.now)
    updated_at = Column(DateTime, default=datetime.now, onupdate=datetime.now)

    resource = relationship('AccountResource', back_populates='billing_records')
    attachments = relationship('Attachment', back_populates='billing_record', cascade='all, delete-orphan')

    def to_dict(self):
        return {
            'id': self.id,
            'resource_id': self.resource_id,
            'is_paid': self.is_paid,
            'fee_type': self.fee_type,
            'renewal_cycle': self.renewal_cycle,
            'last_renewal_date': self.last_renewal_date.isoformat() if self.last_renewal_date else None,
            'next_renewal_date': self.next_renewal_date.isoformat() if self.next_renewal_date else None,
            'amount': self.amount,
            'currency': self.currency,
            'payer_name': self.payer_name,
            'payment_status': self.payment_status,
            'contract_name': self.contract_name,
            'contract_number': self.contract_number,
            'contract_start_date': self.contract_start_date.isoformat() if self.contract_start_date else None,
            'contract_end_date': self.contract_end_date.isoformat() if self.contract_end_date else None,
            'fee_remark': self.fee_remark,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }


class Attachment(Base):
    """
    附件表
    """
    __tablename__ = 'attachments'

    id = Column(Integer, primary_key=True)
    resource_id = Column(Integer, ForeignKey('account_resources.id'), index=True)
    billing_record_id = Column(Integer, ForeignKey('billing_records.id'), index=True)
    file_name = Column(String(200), nullable=False)
    file_path = Column(String(255), nullable=False)
    file_size = Column(Integer)
    file_type = Column(String(50))
    uploaded_by = Column(String(50))
    uploaded_at = Column(DateTime, default=datetime.now)
    deleted_at = Column(DateTime)

    resource = relationship('AccountResource', back_populates='attachments')
    billing_record = relationship('BillingRecord', back_populates='attachments')

    def to_dict(self):
        return {
            'id': self.id,
            'resource_id': self.resource_id,
            'billing_record_id': self.billing_record_id,
            'file_name': self.file_name,
            'file_path': self.file_path,
            'file_size': self.file_size,
            'file_type': self.file_type,
            'uploaded_by': self.uploaded_by,
            'uploaded_at': self.uploaded_at.isoformat() if self.uploaded_at else None
        }
