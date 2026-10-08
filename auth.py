"""
MOOD DUST 用户认证模块
=====================
用户注册、登录、密码哈希、JWT令牌管理
"""

import hashlib
import secrets
from datetime import datetime, timedelta
from functools import wraps
from flask import Blueprint, request, jsonify, g
from sqlalchemy import func
from database import db_session
from models import User
from config import JWT_SECRET_KEY, JWT_EXPIRATION_HOURS

# 创建蓝图
auth_bp = Blueprint('auth', __name__, url_prefix='/api/auth')


def simple_hash(password):
    """
    简单哈希函数（用于密码验证）
    """
    return hashlib.sha256(password.encode()).hexdigest()


def create_token(user_id, username):
    """
    创建JWT令牌
    """
    import jwt
    expire = datetime.utcnow() + timedelta(hours=JWT_EXPIRATION_HOURS)
    payload = {
        'user_id': user_id,
        'username': username,
        'exp': expire
    }
    token = jwt.encode(payload, JWT_SECRET_KEY, algorithm='HS256')
    return token


def verify_token(token):
    """
    验证JWT令牌
    """
    import jwt
    try:
        payload = jwt.decode(token, JWT_SECRET_KEY, algorithms=['HS256'])
        return payload
    except jwt.ExpiredSignatureError:
        return None
    except jwt.InvalidTokenError:
        return None


def token_required(f):
    """
    装饰器：验证请求中的JWT令牌
    """
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        auth_header = request.headers.get('Authorization')

        if auth_header and auth_header.startswith('Bearer '):
            token = auth_header.split(' ')[1]

        if not token:
            return jsonify({'success': False, 'error': 'Token is missing'}), 401

        payload = verify_token(token)
        if not payload:
            return jsonify({'success': False, 'error': 'Token is invalid or expired'}), 401

        g.user_id = payload['user_id']
        g.username = payload['username']

        return f(*args, **kwargs)
    return decorated


def optional_token(f):
    """
    装饰器：可选的令牌验证（不强制要求登录）
    """
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        auth_header = request.headers.get('Authorization')

        if auth_header and auth_header.startswith('Bearer '):
            token = auth_header.split(' ')[1]

        if token:
            payload = verify_token(token)
            if payload:
                g.user_id = payload['user_id']
                g.username = payload['username']
            else:
                g.user_id = None
                g.username = None
        else:
            g.user_id = None
            g.username = None

        return f(*args, **kwargs)
    return decorated


@auth_bp.route('/register', methods=['POST'])
def register():
    """
    用户注册接口
    """
    try:
        data = request.get_json()

        username = data.get('username', '').strip()
        password = data.get('password', '')

        # 验证输入
        if not username or not password:
            return jsonify({'success': False, 'error': 'Username and password required'}), 400

        if len(username) < 3:
            return jsonify({'success': False, 'error': 'Username must be at least 3 characters'}), 400

        if len(password) < 4:
            return jsonify({'success': False, 'error': 'Password must be at least 4 characters'}), 400

        # 检查用户名是否已存在
        existing_user = db_session.query(User).filter(User.username == username).first()
        if existing_user:
            return jsonify({'success': False, 'error': 'Username already exists'}), 400

        # 创建新用户
        user = User(
            username=username,
            password_hash=simple_hash(password)
        )
        db_session.add(user)
        db_session.commit()

        # 生成令牌
        token = create_token(user.id, user.username)

        return jsonify({
            'success': True,
            'data': {
                'user_id': user.id,
                'username': user.username,
                'token': token
            }
        }), 201

    except Exception as e:
        db_session.rollback()
        return jsonify({'success': False, 'error': str(e)}), 500


@auth_bp.route('/login', methods=['POST'])
def login():
    """
    用户登录接口
    """
    try:
        data = request.get_json()

        username = data.get('username', '').strip()
        password = data.get('password', '')

        if not username or not password:
            return jsonify({'success': False, 'error': 'Username and password required'}), 400

        # 查找用户
        user = db_session.query(User).filter(User.username == username).first()
        if not user:
            return jsonify({'success': False, 'error': 'User not found'}), 404

        # 验证密码
        if user.password_hash != simple_hash(password):
            return jsonify({'success': False, 'error': 'Incorrect password'}), 401

        # 生成令牌
        token = create_token(user.id, user.username)

        return jsonify({
            'success': True,
            'data': {
                'user_id': user.id,
                'username': user.username,
                'token': token
            }
        })

    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


@auth_bp.route('/me', methods=['GET'])
@token_required
def get_current_user():
    """
    获取当前登录用户信息
    """
    try:
        user = db_session.query(User).filter(User.id == g.user_id).first()
        if not user:
            return jsonify({'success': False, 'error': 'User not found'}), 404

        return jsonify({
            'success': True,
            'data': user.to_dict()
        })

    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


@auth_bp.route('/verify', methods=['POST'])
def verify_token_api():
    """
    验证令牌有效性
    """
    try:
        data = request.get_json()
        token = data.get('token', '')

        if not token:
            return jsonify({'success': False, 'error': 'Token required'}), 400

        payload = verify_token(token)
        if not payload:
            return jsonify({'success': False, 'error': 'Invalid token'}), 401

        return jsonify({
            'success': True,
            'data': {
                'user_id': payload['user_id'],
                'username': payload['username']
            }
        })

    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500
