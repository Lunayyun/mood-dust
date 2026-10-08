"""
每日语录 API 服务 - MOOD DUST 文艺风日记本
=========================================
功能：提供 RESTful API 接口，供前端获取每日语录
依赖：Flask + quote_generator 模块
作者：Python 全栈开发工程师
版本：1.0.0
"""

from flask import Flask, jsonify, request
from flask_cors import CORS
import logging
from quote_generator import DailyQuoteGenerator, get_quote_for_display

# 配置日志
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# 初始化 Flask 应用
app = Flask(__name__)
CORS(app)  # 允许跨域请求

# 初始化语录生成器
quote_generator = DailyQuoteGenerator()


@app.route('/api/daily-quote', methods=['GET'])
def get_daily_quote():
    """
    获取今日语录 API 接口
    
    查询参数：
        date: 可选，指定日期（YYYY-MM-DD 格式），默认为今天
    
    返回：
        JSON 格式：
        {
            "success": true,
            "data": {
                "date": "2024-01-15",
                "quote": "行到水穷处，坐看云起时。",
                "formatted_date": "2024 年 01 月 15 日"
            }
        }
    """
    try:
        # 获取可选的日期参数
        target_date = request.args.get('date', None)
        
        logger.info(f"收到语录请求，日期：{target_date or '今天'}")
        
        # 调用语录生成器
        if target_date:
            quote = quote_generator.get_daily_quote(target_date)
            from datetime import datetime
            formatted_date = datetime.strptime(target_date, "%Y-%m-%d").strftime("%Y年%m月%d日")
        else:
            result = get_quote_for_display()
            quote = result['quote']
            formatted_date = result['formatted_date']
            target_date = result['date']
        
        response_data = {
            "success": True,
            "data": {
                "date": target_date,
                "quote": quote,
                "formatted_date": formatted_date
            }
        }
        
        logger.info(f"成功返回语录：{quote}")
        return jsonify(response_data), 200
        
    except Exception as e:
        logger.error(f"获取语录失败：{e}")
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500


@app.route('/api/daily-quote/refresh', methods=['POST'])
def refresh_quote():
    """
    强制刷新今日语录 API 接口
    
    清空缓存并重新生成语录
    
    返回：
        JSON 格式：
        {
            "success": true,
            "data": {
                "date": "2024-01-15",
                "quote": "明月松间照，清泉石上流。",
                "formatted_date": "2024 年 01 月 15 日"
            }
        }
    """
    try:
        logger.info("收到强制刷新语录请求")
        
        # 清空缓存
        quote_generator.clear_cache()
        
        # 重新生成
        result = get_quote_for_display()
        
        response_data = {
            "success": True,
            "data": result,
            "message": "语录已刷新"
        }
        
        logger.info(f"刷新成功，新语录：{result['quote']}")
        return jsonify(response_data), 200
        
    except Exception as e:
        logger.error(f"刷新语录失败：{e}")
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500


@app.route('/api/health', methods=['GET'])
def health_check():
    """
    健康检查接口
    
    返回：
        JSON 格式：
        {
            "status": "ok",
            "service": "MOOD DUST Quote API"
        }
    """
    return jsonify({
        "status": "ok",
        "service": "MOOD DUST Quote API"
    }), 200


@app.route('/', methods=['GET'])
def index():
    """
    API 首页 - 显示可用接口列表
    """
    html_content = """
    <!DOCTYPE html>
    <html lang="zh-CN">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>MOOD DUST - 每日语录 API</title>
        <style>
            body {
                font-family: 'Courier New', monospace;
                background: #f5f2eb;
                color: #3a3732;
                padding: 40px;
                max-width: 800px;
                margin: 0 auto;
            }
            h1 {
                color: #c4a87c;
                border-bottom: 2px solid #c4a87c;
                padding-bottom: 10px;
            }
            .endpoint {
                background: #fff;
                padding: 15px;
                margin: 10px 0;
                border-radius: 6px;
                box-shadow: 0 2px 8px rgba(0,0,0,0.08);
            }
            .method {
                display: inline-block;
                padding: 4px 8px;
                border-radius: 4px;
                font-size: 12px;
                font-weight: bold;
                margin-right: 10px;
            }
            .get { background: #61affe; color: white; }
            .post { background: #49cc90; color: white; }
            code {
                background: #f0f0f0;
                padding: 2px 6px;
                border-radius: 3px;
                font-size: 13px;
            }
        </style>
    </head>
    <body>
        <h1>📖 MOOD DUST - 每日语录 API</h1>
        <p>基于阿里云 DashScope SDK 和本地语料库的文学语录服务</p>
        
        <h2>可用接口</h2>
        
        <div class="endpoint">
            <span class="method get">GET</span>
            <code>/api/daily-quote</code>
            <p>获取今日语录</p>
            <p><strong>参数：</strong> <code>date</code> (可选，YYYY-MM-DD 格式)</p>
            <p><strong>示例：</strong> <code>/api/daily-quote?date=2024-01-15</code></p>
        </div>
        
        <div class="endpoint">
            <span class="method post">POST</span>
            <code>/api/daily-quote/refresh</code>
            <p>强制刷新今日语录</p>
        </div>
        
        <div class="endpoint">
            <span class="method get">GET</span>
            <code>/api/health</code>
            <p>健康检查</p>
        </div>
        
        <h2>前端调用示例</h2>
        <pre><code>// 获取今日语录
fetch('http://localhost:5000/api/daily-quote')
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            console.log('今日语录：', data.data.quote);
            document.getElementById('quote').textContent = data.data.quote;
        }
    });</code></pre>
    </body>
    </html>
    """
    return html_content, 200, {'Content-Type': 'text/html; charset=utf-8'}


if __name__ == '__main__':
    print("=" * 60)
    print("MOOD DUST - 每日语录 API 服务")
    print("=" * 60)
    print("\n服务启动中...")
    print("\n访问地址：http://localhost:5000")
    print("API 文档：http://localhost:5000/")
    print("\n按 Ctrl+C 停止服务")
    print("=" * 60)
    
    app.run(host='0.0.0.0', port=5000, debug=True)
