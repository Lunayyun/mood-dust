"""
MOOD DUST 配置模块
===================
数据库配置、API密钥配置、Flask配置等
"""

import os

# 数据库配置
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATABASE_URI = f'sqlite:///{os.path.join(BASE_DIR, "mood_dust.db")}'

# Flask配置
SECRET_KEY = os.environ.get('SECRET_KEY')
DEBUG = True

# DashScope API配置（仅从服务端环境变量读取）
DASHSCOPE_API_KEY = os.environ.get('DASHSCOPE_API_KEY')

# 语录缓存文件
QUOTE_CACHE_FILE = os.path.join(BASE_DIR, 'quote_cache.json')

# JWT配置
JWT_SECRET_KEY = os.environ.get('JWT_SECRET_KEY')
JWT_EXPIRATION_HOURS = 24 * 7  # 7天过期
