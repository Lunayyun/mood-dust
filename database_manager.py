"""
MOOD DUST 数据访问层
====================
统一数据库操作管理类，封装日记、帖子、评论、标签、心情统计等所有数据访问逻辑
"""

from sqlalchemy import func, desc, and_
from sqlalchemy.orm import Session
from database import SessionLocal
from models import User, Diary, Post, Comment, Tag, MoodEntry, PostLike


class DatabaseManager:
    """
    统一数据访问层类
    
    功能：
    - 封装所有数据库 CRUD 操作
    - 提供日记、帖子、评论、标签、心情统计等业务方法
    - 自动管理数据库会话生命周期
    """
    
    def __init__(self):
        """
        初始化数据库管理器
        创建数据库会话实例
        """
        self.db: Session = SessionLocal()
    
    def __del__(self):
        """
        析构函数：确保会话关闭
        """
        try:
            self.db.close()
        except Exception:
            pass
    
    # ========== 用户操作 ==========
    
    def create_user(self, username: str, password_hash: str) -> User:
        """
        创建用户
        
        Args:
            username: 用户名
            password_hash: 密码哈希值（SHA-256）
        
        Returns:
            User: 创建的用户对象
        """
        user = User(
            username=username,
            password_hash=password_hash
        )
        self.db.add(user)
        self.db.commit()
        self.db.refresh(user)
        return user
    
    def get_user_by_username(self, username: str) -> User:
        """
        根据用户名获取用户
        
        Args:
            username: 用户名
        
        Returns:
            User or None: 用户对象或 None
        """
        return self.db.query(User).filter(User.username == username).first()
    
    def get_user_by_id(self, user_id: int) -> User:
        """
        根据用户ID获取用户
        
        Args:
            user_id: 用户ID
        
        Returns:
            User or None: 用户对象或 None
        """
        return self.db.query(User).filter(User.id == user_id).first()
    
    def username_exists(self, username: str) -> bool:
        """
        检查用户名是否已存在
        
        Args:
            username: 用户名
        
        Returns:
            bool: 是否已存在
        """
        return self.db.query(User).filter(User.username == username).count() > 0
    
    # ========== 日记操作 ==========
    
    def save_diary(self, user_id: int, date: str, mood: str, 
                   content: str = None, ai_sentence: str = None, 
                   image_paths: str = None) -> Diary:
        """
        保存日记（新增或更新）
        
        Args:
            user_id: 用户ID
            date: 日期（YYYY-MM-DD）
            mood: 心情类型
            content: 日记内容
            ai_sentence: AI生成句子
            image_paths: 图片路径JSON字符串
        
        Returns:
            Diary: 保存的日记对象
        """
        # 先查询是否已存在该日期的日记
        diary = self.db.query(Diary).filter(
            and_(Diary.user_id == user_id, Diary.date == date)
        ).first()
        
        if diary:
            # 更新现有日记
            diary.mood = mood
            diary.content = content
            diary.ai_sentence = ai_sentence
            diary.image_paths = image_paths
        else:
            # 创建新日记
            diary = Diary(
                user_id=user_id,
                date=date,
                mood=mood,
                content=content,
                ai_sentence=ai_sentence,
                image_paths=image_paths
            )
            self.db.add(diary)
        
        self.db.commit()
        self.db.refresh(diary)
        return diary
    
    def get_diary_by_date(self, user_id: int, date: str) -> Diary:
        """
        根据用户ID和日期获取日记
        
        Args:
            user_id: 用户ID
            date: 日期（YYYY-MM-DD）
        
        Returns:
            Diary or None: 日记对象或 None
        """
        return self.db.query(Diary).filter(
            and_(Diary.user_id == user_id, Diary.date == date)
        ).first()
    
    def get_diaries_by_month(self, user_id: int, year: int, month: int) -> list:
        """
        获取用户指定月份的所有日记
        
        Args:
            user_id: 用户ID
            year: 年份
            month: 月份（1-12）
        
        Returns:
            list: 日记对象列表，按日期升序排列
        """
        # 构建日期前缀（YYYY-MM）
        date_prefix = f"{year}-{month:02d}"
        
        return self.db.query(Diary).filter(
            and_(
                Diary.user_id == user_id,
                Diary.date.like(f"{date_prefix}%")
            )
        ).order_by(Diary.date.asc()).all()
    
    def get_all_diaries(self, user_id: int, page: int = 1, per_page: int = 10) -> list:
        """
        分页获取用户所有日记
        
        Args:
            user_id: 用户ID
            page: 页码（从1开始）
            per_page: 每页数量
        
        Returns:
            list: 日记对象列表，按日期降序排列
        """
        offset = (page - 1) * per_page
        
        return self.db.query(Diary).filter(
            Diary.user_id == user_id
        ).order_by(Diary.date.desc()).offset(offset).limit(per_page).all()
    
    def delete_diary(self, user_id: int, date: str) -> bool:
        """
        删除日记
        
        Args:
            user_id: 用户ID
            date: 日期（YYYY-MM-DD）
        
        Returns:
            bool: 是否删除成功
        """
        diary = self.db.query(Diary).filter(
            and_(Diary.user_id == user_id, Diary.date == date)
        ).first()
        
        if diary:
            self.db.delete(diary)
            self.db.commit()
            return True
        return False
    
    def get_diary_count(self, user_id: int) -> int:
        """
        获取用户日记总数
        
        Args:
            user_id: 用户ID
        
        Returns:
            int: 日记数量
        """
        return self.db.query(Diary).filter(Diary.user_id == user_id).count()
    
    # ========== 心情统计操作 ==========
    
    def save_mood_entry(self, user_id: int, mood: str, date: str) -> MoodEntry:
        """
        保存心情记录（用于统计）
        
        Args:
            user_id: 用户ID
            mood: 心情类型
            date: 日期（YYYY-MM-DD）
        
        Returns:
            MoodEntry: 心情记录对象
        """
        mood_entry = self.db.query(MoodEntry).filter(
            and_(MoodEntry.user_id == user_id, MoodEntry.date == date)
        ).first()
        
        if mood_entry:
            mood_entry.mood = mood
        else:
            mood_entry = MoodEntry(
                user_id=user_id,
                mood=mood,
                date=date
            )
            self.db.add(mood_entry)
        
        self.db.commit()
        self.db.refresh(mood_entry)
        return mood_entry
    
    def get_monthly_mood_stats(self, user_id: int, year: int, month: int) -> dict:
        """
        获取月度心情统计
        
        Args:
            user_id: 用户ID
            year: 年份
            month: 月份（1-12）
        
        Returns:
            dict: 心情统计字典，格式如 {'happy': 5, 'calm': 3, ...}
        """
        date_prefix = f"{year}-{month:02d}"
        
        stats = self.db.query(
            MoodEntry.mood,
            func.count(MoodEntry.mood).label('count')
        ).filter(
            and_(
                MoodEntry.user_id == user_id,
                MoodEntry.date.like(f"{date_prefix}%")
            )
        ).group_by(MoodEntry.mood).all()
        
        return {mood: count for mood, count in stats}
    
    def get_most_frequent_mood(self, user_id: int, year: int, month: int) -> tuple:
        """
        获取本月出现最多的心情
        
        Args:
            user_id: 用户ID
            year: 年份
            month: 月份（1-12）
        
        Returns:
            tuple: (心情类型, 出现次数)，若无记录则返回 (None, 0)
        """
        date_prefix = f"{year}-{month:02d}"
        
        result = self.db.query(
            MoodEntry.mood,
            func.count(MoodEntry.mood).label('count')
        ).filter(
            and_(
                MoodEntry.user_id == user_id,
                MoodEntry.date.like(f"{date_prefix}%")
            )
        ).group_by(MoodEntry.mood).order_by(desc('count')).first()
        
        if result:
            return (result.mood, result.count)
        return (None, 0)
    
    # ========== 社区帖子操作 ==========
    
    def create_post(self, user_id: int, content: str, is_anonymous: bool = False,
                    author_name: str = None, tags: list = None) -> Post:
        """
        创建社区帖子
        
        Args:
            user_id: 用户ID（匿名时可为None）
            content: 帖子内容
            is_anonymous: 是否匿名
            author_name: 作者名称
            tags: 标签名称列表
        
        Returns:
            Post: 创建的帖子对象
        """
        post = Post(
            user_id=user_id,
            content=content,
            is_anonymous=is_anonymous,
            author_name=author_name
        )
        
        # 处理标签
        if tags:
            for tag_name in tags:
                # 查找或创建标签
                tag = self.db.query(Tag).filter(Tag.name == tag_name).first()
                if not tag:
                    tag = Tag(name=tag_name)
                    self.db.add(tag)
                # 添加标签到帖子，并增加使用计数
                post.tags.append(tag)
                tag.usage_count = (tag.usage_count or 0) + 1
        
        self.db.add(post)
        self.db.commit()
        self.db.refresh(post)
        return post
    
    def get_posts(self, page: int = 1, per_page: int = 10, tag_name: str = None) -> list:
        """
        分页获取帖子列表
        
        Args:
            page: 页码
            per_page: 每页数量
            tag_name: 标签筛选（可选）
        
        Returns:
            list: 帖子对象列表，按时间降序排列
        """
        offset = (page - 1) * per_page
        
        query = self.db.query(Post).order_by(Post.timestamp.desc())
        
        if tag_name:
            query = query.join(Post.tags).filter(Tag.name == tag_name)
        
        return query.offset(offset).limit(per_page).all()
    
    def get_post_by_id(self, post_id: int) -> Post:
        """
        根据ID获取帖子
        
        Args:
            post_id: 帖子ID
        
        Returns:
            Post or None: 帖子对象或 None
        """
        return self.db.query(Post).filter(Post.id == post_id).first()
    
    def delete_post(self, post_id: int) -> bool:
        """
        删除帖子
        
        Args:
            post_id: 帖子ID
        
        Returns:
            bool: 是否删除成功
        """
        post = self.db.query(Post).filter(Post.id == post_id).first()
        
        if post:
            # 减少标签使用计数
            for tag in post.tags:
                tag.usage_count = max(0, (tag.usage_count or 0) - 1)
            
            self.db.delete(post)
            self.db.commit()
            return True
        return False
    
    def get_post_count(self) -> int:
        """
        获取帖子总数
        
        Returns:
            int: 帖子数量
        """
        return self.db.query(Post).count()
    
    # ========== 评论操作 ==========
    
    def create_comment(self, post_id: int, user_id: int, content: str,
                       is_anonymous: bool = False, author_name: str = None,
                       parent_comment_id: int = None) -> Comment:
        """
        创建评论
        
        Args:
            post_id: 帖子ID
            user_id: 用户ID
            content: 评论内容
            is_anonymous: 是否匿名
            author_name: 作者名称
            parent_comment_id: 父评论ID（回复时使用）
        
        Returns:
            Comment: 创建的评论对象
        """
        comment = Comment(
            post_id=post_id,
            user_id=user_id,
            content=content,
            is_anonymous=is_anonymous,
            author_name=author_name,
            parent_comment_id=parent_comment_id
        )
        
        self.db.add(comment)
        self.db.commit()
        self.db.refresh(comment)
        
        # 更新帖子评论计数
        post = self.db.query(Post).filter(Post.id == post_id).first()
        if post:
            post.comments_count = (post.comments_count or 0) + 1
            self.db.commit()
        
        return comment
    
    def get_comments_by_post(self, post_id: int) -> list:
        """
        获取帖子的所有评论
        
        Args:
            post_id: 帖子ID
        
        Returns:
            list: 评论对象列表，按时间升序排列
        """
        return self.db.query(Comment).filter(
            Comment.post_id == post_id
        ).order_by(Comment.timestamp.asc()).all()
    
    # ========== 点赞操作 ==========
    
    def toggle_like(self, post_id: int, user_id: int) -> bool:
        """
        点赞/取消点赞
        
        Args:
            post_id: 帖子ID
            user_id: 用户ID
        
        Returns:
            bool: 当前是否已点赞
        """
        like = self.db.query(PostLike).filter(
            and_(PostLike.post_id == post_id, PostLike.user_id == user_id)
        ).first()
        
        post = self.db.query(Post).filter(Post.id == post_id).first()
        
        if like:
            # 取消点赞
            self.db.delete(like)
            if post:
                post.likes_count = max(0, (post.likes_count or 0) - 1)
            self.db.commit()
            return False
        else:
            # 添加点赞
            new_like = PostLike(post_id=post_id, user_id=user_id)
            self.db.add(new_like)
            if post:
                post.likes_count = (post.likes_count or 0) + 1
            self.db.commit()
            return True
    
    def has_liked(self, post_id: int, user_id: int) -> bool:
        """
        检查用户是否已点赞帖子
        
        Args:
            post_id: 帖子ID
            user_id: 用户ID
        
        Returns:
            bool: 是否已点赞
        """
        return self.db.query(PostLike).filter(
            and_(PostLike.post_id == post_id, PostLike.user_id == user_id)
        ).count() > 0
    
    # ========== 标签操作 ==========
    
    def get_tags(self) -> list:
        """
        获取所有标签
        
        Returns:
            list: 标签对象列表，按使用计数降序排列
        """
        return self.db.query(Tag).order_by(desc(Tag.usage_count)).all()
    
    def get_hot_tags(self, limit: int = 10) -> list:
        """
        获取热门标签
        
        Args:
            limit: 返回数量限制
        
        Returns:
            list: 标签对象列表，按使用计数降序排列
        """
        return self.db.query(Tag).order_by(desc(Tag.usage_count)).limit(limit).all()
    
    def get_tag_by_name(self, name: str) -> Tag:
        """
        根据名称获取标签
        
        Args:
            name: 标签名称
        
        Returns:
            Tag or None: 标签对象或 None
        """
        return self.db.query(Tag).filter(Tag.name == name).first()


# 全局实例（可选，用于简化调用）
db_manager = DatabaseManager()
