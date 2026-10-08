"""
MOOD DUST - Flask 主入口
========================
整合所有蓝图：认证、日记、社区、语录、账号管理
"""

from flask import Flask, jsonify, send_from_directory, request
from flask_cors import CORS
import os
import requests

from config import DEBUG
from database import init_db, close_db
from auth import auth_bp
from diary_api import diary_bp
from community_api import community_bp
from account_management_api import account_bp
from quote_generator import DailyQuoteGenerator

# 创建Flask应用
app = Flask(__name__, static_folder='.')
CORS(app)

UPLOAD_FOLDER = os.path.join(os.path.dirname(__file__), 'uploads')
if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['MAX_CONTENT_LENGTH'] = 10 * 1024 * 1024

# 注册蓝图
app.register_blueprint(auth_bp)
app.register_blueprint(diary_bp)
app.register_blueprint(community_bp)
app.register_blueprint(account_bp)

# 数据库初始化
@app.before_request
def before_request():
    pass  # SQLAlchemy自动管理会话

@app.teardown_appcontext
def shutdown_session(exception=None):
    close_db()

# 初始化数据库（首次运行）
with app.app_context():
    init_db()

# ==================== 每日语录 API ====================

@app.route('/api/daily-quote', methods=['GET'])
def get_daily_quote():
    """
    获取今日语录
    支持 ?date=YYYY-MM-DD 查询历史日期
    """
    try:
        from datetime import datetime
        from functools import wraps

        target_date = None
        target_date = target_date or datetime.now().strftime('%Y-%m-%d')

        generator = DailyQuoteGenerator()
        quote = generator.get_daily_quote(target_date)

        return jsonify({
            'success': True,
            'data': {
                'date': target_date,
                'quote': quote
            }
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


@app.route('/api/daily-quote/refresh', methods=['POST'])
def refresh_daily_quote():
    """
    强制刷新语录
    """
    try:
        generator = DailyQuoteGenerator()
        generator.clear_cache()
        quote = generator.get_daily_quote()

        return jsonify({
            'success': True,
            'data': {
                'date': generator._get_today_str(),
                'quote': quote
            },
            'message': 'Quote refreshed'
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


@app.route('/api/poetry', methods=['POST'])
def generate_poetry():
    """Server-side proxy so the DashScope key never reaches the browser."""
    api_key = os.environ.get('DASHSCOPE_API_KEY')
    data = request.get_json(silent=True) or {}
    messages = data.get('messages', [])
    if not api_key:
        return jsonify({'success': False, 'error': 'AI service is not configured'}), 503
    if not isinstance(messages, list) or not messages:
        return jsonify({'success': False, 'error': 'Messages are required'}), 400
    try:
        response = requests.post(
            'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions',
            headers={'Content-Type': 'application/json', 'Authorization': f'Bearer {api_key}'},
            json={'model': 'qwen-plus', 'messages': messages, 'max_tokens': 120, 'temperature': 0.9},
            timeout=30
        )
        return jsonify(response.json()), response.status_code
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 502


# ==================== 静态文件服务 ====================

@app.route('/')
def index():
    """主页"""
    return send_from_directory('.', 'mood_dust.html')


@app.route('/mood_dust.html')
def mood_dust_page():
    """日记主页"""
    return send_from_directory('.', 'mood_dust.html')


@app.route('/meditation.html')
def meditation_page():
    """冥想页面"""
    return send_from_directory('.', 'meditation.html')


@app.route('/community.html')
def community_page():
    """社区页面"""
    return send_from_directory('.', 'community.html')


@app.route('/account_management.html')
def account_management_page():
    """账号管理页面"""
    return send_from_directory('.', 'account_management.html')


@app.route('/<path:filename>')
def serve_static(filename):
    """静态文件服务"""
    return send_from_directory('.', filename)


# ==================== 健康检查 ====================

@app.route('/api/health', methods=['GET'])
def health_check():
    """健康检查"""
    return jsonify({
        'status': 'ok',
        'service': 'MOOD DUST API'
    })


# ==================== 启动服务器 ====================

if __name__ == '__main__':
    print("=" * 50)
    print("MOOD DUST - 禅意心情日记")
    print("=" * 50)
    print("\n启动服务...")
    print("访问地址：http://localhost:5000")
    print("API文档：http://localhost:5000/")
    print("\n按 Ctrl+C 停止服务")
    print("=" * 50)

    app.run(host='0.0.0.0', port=5000, debug=DEBUG)
