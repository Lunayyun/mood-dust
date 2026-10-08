"""
每日语录生成器 - MOOD DUST 文艺风日记本
=======================================
功能：基于阿里云 DashScope SDK 和本地语料库，实现每日自动切换的文学语录展示
模型：通义千问 qwen3.5-omni-plus
作者：Python 全栈开发工程师
版本：1.0.0
"""

import os
import json
import random
import logging
from datetime import datetime, date
from typing import Optional, Dict, Any

# 尝试导入 dashscope，处理离线降级场景
try:
    import dashscope
    from dashscope.api_entities.dashscope_response import Role
    DASHSCOPE_AVAILABLE = True
except ImportError:
    DASHSCOPE_AVAILABLE = False
    logging.warning("DashScope SDK 未安装，将仅使用本地语料库")

# 配置日志
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('quote_generator.log', encoding='utf-8'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)


# ========== 本地诗集/文学语录语料库 ==========
# 来源：中国古典诗集、中外经典文学著作摘录
# 长度控制：10-25 个汉字，句式简洁，风格文雅
LOCAL_QUOTE_LIBRARY: Dict[str, list] = {
    "唐诗": [
        "行到水穷处，坐看云起时。",
        "明月松间照，清泉石上流。",
        "海内存知己，天涯若比邻。",
        "采菊东篱下，悠然见南山。",
        "山重水复疑无路，柳暗花明又一村。",
        "会当凌绝顶，一览众山小。",
        "春风得意马蹄疾，一日看尽长安花。",
        "此情可待成追忆，只是当时已惘然。",
        "人生若只如初见，何事秋风悲画扇。",
        "落花人独立，微雨燕双飞。",
    ],
    "宋词": [
        "无可奈何花落去，似曾相识燕归来。",
        "但愿人长久，千里共婵娟。",
        "衣带渐宽终不悔，为伊消得人憔悴。",
        "众里寻他千百度，蓦然回首，那人却在灯火阑珊处。",
        "欲买桂花同载酒，终不似少年游。",
        "一蓑烟雨任平生，也无风雨也无晴。",
        "人生自是有情痴，此恨不关风与月。",
        "流光容易把人抛，红了樱桃，绿了芭蕉。",
    ],
    "诗经": [
        "蒹葭苍苍，白露为霜。所谓伊人，在水一方。",
        "青青子衿，悠悠我心。",
        "桃之夭夭，灼灼其华。",
        "昔我往矣，杨柳依依。今我来思，雨雪霏霏。",
        "知我者谓我心忧，不知我者谓我何求。",
    ],
    "现代文学": [
        "生活不止眼前的苟且，还有诗和远方。",
        "愿你出走半生，归来仍是少年。",
        "世间所有的相遇，都是久别重逢。",
        "人生最好的境界，是丰富的安静。",
        "岁月静好，现世安稳。",
        "心有猛虎，细嗅蔷薇。",
        "你来时冬至，但眉上风止。",
        "温柔半两，从容一生。",
    ],
    "外国文学": [
        "世界以痛吻我，要我报之以歌。——泰戈尔",
        "黑夜无论怎样悠长，白昼总会到来。——莎士比亚",
        "一个人可以被毁灭，但不能被打败。——海明威",
        "满地都是六便士，他却抬头看见了月亮。——毛姆",
        "所有的光鲜亮丽都敌不过时间。——菲茨杰拉德",
        "我们都在阴沟里，但仍有人仰望星空。——王尔德",
    ],
}


class DailyQuoteGenerator:
    """
    每日语录生成器类
    
    功能：
    - 调用阿里云 DashScope qwen3.5-omni-plus 模型生成文学语录
    - 网络异常时自动降级到本地语料库
    - 按自然日锁定内容，同一天内重复访问返回相同语录
    - 支持自定义日期查询
    
    属性：
        api_key (str): 阿里云 DashScope API 密钥
        model_name (str): 使用的模型名称
        cache_file (str): 缓存文件路径
    """
    
    def __init__(self, api_key: Optional[str] = None):
        """
        初始化每日语录生成器
        
        Args:
            api_key: 阿里云 DashScope API 密钥，默认为 None 时从环境变量读取
        """
        self.api_key = api_key or os.getenv('DASHSCOPE_API_KEY')
        if not self.api_key:
            try:
                from config import DASHSCOPE_API_KEY
                self.api_key = DASHSCOPE_API_KEY
            except ImportError:
                pass
        self.model_name = 'qwen-plus'
        self.cache_file = os.path.join(
            os.path.dirname(os.path.abspath(__file__)),
            'quote_cache.json'
        )
        
        if not self.api_key:
            logger.warning("未找到 DASHSCOPE_API_KEY，将仅使用本地语料库")
        
        # 初始化 DashScope
        if DASHSCOPE_AVAILABLE and self.api_key:
            dashscope.api_key = self.api_key
            logger.info("DashScope SDK 初始化成功")
    
    def _get_today_str(self) -> str:
        """
        获取当前日期字符串（YYYY-MM-DD 格式）
        
        Returns:
            str: 日期字符串
        """
        return date.today().isoformat()
    
    def _load_cache(self) -> Dict[str, Any]:
        """
        加载缓存数据
        
        Returns:
            dict: 缓存数据，包含日期和对应的语录
        """
        try:
            if os.path.exists(self.cache_file):
                with open(self.cache_file, 'r', encoding='utf-8') as f:
                    return json.load(f)
        except Exception as e:
            logger.error(f"加载缓存失败：{e}")
        return {}
    
    def _save_cache(self, cache_data: Dict[str, Any]) -> None:
        """
        保存缓存数据
        
        Args:
            cache_data: 要保存的缓存数据
        """
        try:
            with open(self.cache_file, 'w', encoding='utf-8') as f:
                json.dump(cache_data, f, ensure_ascii=False, indent=2)
            logger.info("缓存保存成功")
        except Exception as e:
            logger.error(f"保存缓存失败：{e}")
    
    def _get_cached_quote(self, target_date: str) -> Optional[str]:
        """
        从缓存中获取指定日期的语录
        
        Args:
            target_date: 目标日期（YYYY-MM-DD 格式）
        
        Returns:
            str or None: 缓存的语录，不存在则返回 None
        """
        cache = self._load_cache()
        return cache.get(target_date)
    
    def _get_local_quote(self) -> str:
        """
        从本地语料库随机获取一条语录
        
        Returns:
            str: 随机语录
        """
        all_quotes = []
        for category, quotes in LOCAL_QUOTE_LIBRARY.items():
            all_quotes.extend(quotes)
        
        if not all_quotes:
            return "生活不止眼前的苟且，还有诗和远方。"
        
        selected_quote = random.choice(all_quotes)
        logger.info(f"从本地语料库获取语录：{selected_quote}")
        return selected_quote
    
    def _build_prompt(self) -> str:
        """
        构建专属 Prompt，要求模型从经典诗集、书籍中提取短句
        
        Returns:
            str: 构建好的 Prompt
        """
        prompt = """你是一位精通中国古典文学和中外经典著作的文学专家。
请从以下典籍中选择一句优美短句作为今日语录：
- 唐诗宋词
- 诗经楚辞  
- 元曲明清小说
- 中外经典文学名著

要求：
1. 语录长度严格控制在 10-25 个汉字
2. 句式简洁优雅，富有诗意
3. 必须是真实存在的经典名句，不得编造
4. 如果是外国文学作品，请注明作者姓名
5. 直接输出语录内容，不要添加任何解释或说明

今日日期：{date}
请输出一条适合今日展示的文学语录：""".format(
            date=date.today().strftime("%Y年%m月%d日")
        )
        return prompt
    
    def _call_dashscope_api(self) -> Optional[str]:
        """
        调用阿里云 DashScope qwen3.5-omni-plus 模型 API
        
        Returns:
            str or None: 生成的语录，失败则返回 None
        """
        if not DASHSCOPE_AVAILABLE:
            logger.warning("DashScope SDK 不可用")
            return None
        
        if not self.api_key:
            logger.warning("API Key 未配置")
            return None
        
        try:
            logger.info("开始调用 DashScope API...")
            
            response = dashscope.Generation.call(
                model=self.model_name,
                messages=[
                    {'role': Role.SYSTEM, 'content': '你是一位文学专家，擅长从经典文学作品中选取优美短句。'},
                    {'role': Role.USER, 'content': self._build_prompt()}
                ],
                result_format='message',
                timeout=30
            )
            
            if response.status_code == 200:
                quote = response.output.choices[0].message.content.strip()
                logger.info(f"API 调用成功，生成语录：{quote}")
                return quote
            else:
                logger.error(f"API 调用失败：{response.code} - {response.message}")
                return None
                
        except Exception as e:
            logger.error(f"API 调用异常：{e}")
            return None
    
    def get_daily_quote(self, target_date: Optional[str] = None) -> str:
        """
        获取指定日期的语录（主函数入口）
        
        逻辑流程：
        1. 检查缓存中是否已有该日期的语录
        2. 有则直接返回缓存内容
        3. 无则尝试调用 API 生成
        4. API 失败则降级到本地语料库
        5. 将新生成的语录保存到缓存
        
        Args:
            target_date: 目标日期（YYYY-MM-DD 格式），默认为今天
        
        Returns:
            str: 今日语录
        
        Example:
            >>> generator = DailyQuoteGenerator()
            >>> quote = generator.get_daily_quote()
            >>> print(f"今日语录：{quote}")
        """
        # 确定目标日期
        if target_date is None:
            target_date = self._get_today_str()
        
        logger.info(f"请求日期：{target_date} 的语录")
        
        # 步骤 1: 检查缓存
        cached_quote = self._get_cached_quote(target_date)
        if cached_quote:
            logger.info(f"从缓存获取语录：{cached_quote}")
            return cached_quote
        
        # 步骤 2: 尝试调用 API 生成
        quote = None
        if DASHSCOPE_AVAILABLE and self.api_key:
            quote = self._call_dashscope_api()
        
        # 步骤 3: API 失败则降级到本地语料库
        if not quote:
            logger.warning("API 调用失败或未配置，降级到本地语料库")
            quote = self._get_local_quote()
        
        # 步骤 4: 保存到缓存
        cache = self._load_cache()
        cache[target_date] = quote
        self._save_cache(cache)
        
        logger.info(f"最终语录：{quote}")
        return quote
    
    def clear_cache(self) -> None:
        """
        清空缓存数据
        
        用于测试或强制刷新语录
        """
        try:
            if os.path.exists(self.cache_file):
                os.remove(self.cache_file)
                logger.info("缓存已清空")
        except Exception as e:
            logger.error(f"清空缓存失败：{e}")


# ========== 对接界面的调用示例 ==========
def get_quote_for_display() -> Dict[str, str]:
    """
    对接界面日期组件的调用入口
    
    返回格式化的语录数据，可直接渲染到界面
    
    Returns:
        dict: 包含日期和语录的字典
    
    Example (前端调用):
        // JavaScript 调用 Python 后端
        fetch('/api/daily-quote')
            .then(response => response.json())
            .then(data => {
                document.getElementById('daily-quote').textContent = data.quote;
            });
    """
    generator = DailyQuoteGenerator()
    today = generator._get_today_str()
    quote = generator.get_daily_quote(today)
    
    return {
        "date": today,
        "quote": quote,
        "formatted_date": datetime.strptime(today, "%Y-%m-%d").strftime("%Y年%m月%d日")
    }


# ========== 命令行测试入口 ==========
if __name__ == "__main__":
    print("=" * 60)
    print("MOOD DUST - 每日语录生成器测试")
    print("=" * 60)
    
    # 创建生成器实例
    generator = DailyQuoteGenerator()
    
    # 获取今日语录
    today = generator._get_today_str()
    print(f"\n今日日期：{today}")
    
    quote = generator.get_daily_quote(today)
    print(f"\n今日语录：{quote}")
    
    print("\n" + "=" * 60)
    print("测试完成！语录已缓存，再次运行将返回相同内容。")
    print("如需刷新，请删除 quote_cache.json 文件或调用 generator.clear_cache()")
    print("=" * 60)
