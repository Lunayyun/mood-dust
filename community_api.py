"""
MOOD DUST 社区 API 模块
=======================
帖子发布、点赞、评论、标签管理
"""

from datetime import datetime
from flask import Blueprint, request, jsonify, g
from sqlalchemy import func, desc, or_
from database import db_session
from models import Post, Comment, Tag, PostLike, Favorite, Report
from auth import token_required, optional_token

# 创建蓝图
community_bp = Blueprint('community', __name__, url_prefix='/api/community')


@community_bp.route('/posts', methods=['GET'])
@optional_token
def get_posts():
    """
    获取帖子列表
    支持：?page=1&page_size=10&tag=标签名&sort=newest/likes
    """
    try:
        page = int(request.args.get('page', 1))
        page_size = int(request.args.get('page_size', 10))
        tag_filter = request.args.get('tag')
        sort_order = request.args.get('sort', 'newest')
        search = request.args.get('search', '').strip()

        query = db_session.query(Post)

        # 按标签筛选
        if tag_filter:
            query = query.join(Post.tags).filter(Tag.name == tag_filter)
        if search:
            pattern = f'%{search}%'
            query = query.outerjoin(Post.tags).filter(
                or_(Post.content.ilike(pattern), Post.author_name.ilike(pattern), Tag.name.ilike(pattern))
            ).distinct()

        # 排序
        if sort_order == 'likes':
            query = query.order_by(desc(Post.likes_count), desc(Post.timestamp))
        else:
            query = query.order_by(desc(Post.timestamp))

        # 分页
        total = query.count()
        posts = query.offset((page - 1) * page_size).limit(page_size).all()
        post_data = []
        for post in posts:
            data = post.to_dict()
            data['liked'] = bool(g.user_id and db_session.query(PostLike).filter_by(post_id=post.id, user_id=g.user_id).first())
            data['favorited'] = bool(g.user_id and db_session.query(Favorite).filter_by(post_id=post.id, user_id=g.user_id).first())
            post_data.append(data)

        return jsonify({
            'success': True,
            'data': {
                'posts': post_data,
                'total': total,
                'page': page,
                'page_size': page_size,
                'total_pages': (total + page_size - 1) // page_size if total > 0 else 0
            }
        })

    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


@community_bp.route('/posts', methods=['POST'])
@token_required
def create_post():
    """
    发布新帖子
    """
    try:
        data = request.get_json()

        content = data.get('content', '').strip()
        is_anonymous = data.get('is_anonymous', False)
        tags = data.get('tags', [])

        if not content:
            return jsonify({'success': False, 'error': 'Content is required'}), 400

        # 创建帖子
        if len(content) > 5000:
            return jsonify({'success': False, 'error': 'Content is too long'}), 400

        post = Post(
            # Keep ownership for anonymous posts while hiding the author name.
            user_id=g.user_id,
            content=content,
            is_anonymous=is_anonymous,
            author_name='Anonymous' if is_anonymous else g.username
        )
        db_session.add(post)
        db_session.flush()  # 获取post.id

        # 处理标签
        for tag_name in tags:
            tag_name = tag_name.strip().lower()
            if not tag_name:
                continue

            tag = db_session.query(Tag).filter(Tag.name == tag_name).first()
            if not tag:
                tag = Tag(name=tag_name, usage_count=1)
                db_session.add(tag)
            else:
                tag.usage_count += 1

            post.tags.append(tag)

        db_session.commit()

        return jsonify({
            'success': True,
            'data': post.to_dict()
        }), 201

    except Exception as e:
        db_session.rollback()
        return jsonify({'success': False, 'error': str(e)}), 500


@community_bp.route('/posts/<int:post_id>', methods=['DELETE'])
@token_required
def delete_post(post_id):
    """
    删除帖子（仅作者可删除）
    """
    try:
        post = db_session.query(Post).filter(Post.id == post_id).first()

        if not post:
            return jsonify({'success': False, 'error': 'Post not found'}), 404

        # 验证是否是作者（user_id匹配）
        if post.user_id != g.user_id:
            return jsonify({'success': False, 'error': 'Not authorized'}), 403

        # 更新标签计数
        for tag in post.tags:
            if tag.usage_count > 0:
                tag.usage_count -= 1

        db_session.delete(post)
        db_session.commit()

        return jsonify({
            'success': True,
            'message': 'Post deleted'
        })

    except Exception as e:
        db_session.rollback()
        return jsonify({'success': False, 'error': str(e)}), 500


@community_bp.route('/posts/<int:post_id>/like', methods=['POST'])
@token_required
def toggle_like(post_id):
    """
    点赞/取消点赞
    """
    try:
        post = db_session.query(Post).filter(Post.id == post_id).first()

        if not post:
            return jsonify({'success': False, 'error': 'Post not found'}), 404

        # 检查是否已点赞
        existing_like = db_session.query(PostLike).filter(
            PostLike.post_id == post_id,
            PostLike.user_id == g.user_id
        ).first()

        if existing_like:
            # 取消点赞
            db_session.delete(existing_like)
            post.likes_count = max(0, post.likes_count - 1)
            liked = False
        else:
            # 添加点赞
            like = PostLike(post_id=post_id, user_id=g.user_id)
            db_session.add(like)
            post.likes_count += 1
            liked = True

        db_session.commit()

        return jsonify({
            'success': True,
            'data': {
                'liked': liked,
                'likes_count': post.likes_count
            }
        })

    except Exception as e:
        db_session.rollback()
        return jsonify({'success': False, 'error': str(e)}), 500


@community_bp.route('/posts/<int:post_id>/favorite', methods=['POST'])
@token_required
def toggle_favorite(post_id):
    post = db_session.query(Post).filter(Post.id == post_id).first()
    if not post:
        return jsonify({'success': False, 'error': 'Post not found'}), 404
    favorite = db_session.query(Favorite).filter_by(post_id=post_id, user_id=g.user_id).first()
    if favorite:
        db_session.delete(favorite)
        favorited = False
    else:
        db_session.add(Favorite(post_id=post_id, user_id=g.user_id))
        favorited = True
    db_session.commit()
    return jsonify({'success': True, 'data': {'favorited': favorited}})


@community_bp.route('/posts/<int:post_id>/report', methods=['POST'])
@token_required
def report_post(post_id):
    post = db_session.query(Post).filter(Post.id == post_id).first()
    if not post:
        return jsonify({'success': False, 'error': 'Post not found'}), 404
    data = request.get_json(silent=True) or {}
    reason = str(data.get('reason', 'Other')).strip()[:100] or 'Other'
    existing = db_session.query(Report).filter_by(post_id=post_id, user_id=g.user_id).first()
    if existing:
        return jsonify({'success': False, 'error': 'Already reported'}), 409
    db_session.add(Report(post_id=post_id, user_id=g.user_id, reason=reason))
    db_session.commit()
    return jsonify({'success': True, 'message': 'Report submitted'}), 201


@community_bp.route('/posts/<int:post_id>/comments', methods=['GET'])
def get_comments(post_id):
    """
    获取帖子的评论列表
    """
    try:
        post = db_session.query(Post).filter(Post.id == post_id).first()

        if not post:
            return jsonify({'success': False, 'error': 'Post not found'}), 404

        # 只获取顶级评论（parent_comment_id为空的）
        comments = db_session.query(Comment).filter(
            Comment.post_id == post_id,
            Comment.parent_comment_id == None
        ).order_by(desc(Comment.timestamp)).all()

        return jsonify({
            'success': True,
            'data': [c.to_dict() for c in comments]
        })

    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


@community_bp.route('/posts/<int:post_id>/comments', methods=['POST'])
@token_required
def add_comment(post_id):
    """
    添加评论
    """
    try:
        data = request.get_json()

        content = data.get('content', '').strip()
        is_anonymous = data.get('is_anonymous', False)
        reply_to_id = data.get('reply_to')  # 回复的评论ID

        if not content:
            return jsonify({'success': False, 'error': 'Content is required'}), 400

        post = db_session.query(Post).filter(Post.id == post_id).first()
        if not post:
            return jsonify({'success': False, 'error': 'Post not found'}), 404

        if reply_to_id:
            parent = db_session.query(Comment).filter(
                Comment.id == reply_to_id,
                Comment.post_id == post_id
            ).first()
            if not parent:
                return jsonify({'success': False, 'error': 'Reply target not found'}), 400

        # 创建评论
        comment = Comment(
            post_id=post_id,
            user_id=g.user_id if not is_anonymous else None,
            parent_comment_id=reply_to_id,
            content=content,
            is_anonymous=is_anonymous,
            author_name='Anonymous' if is_anonymous else g.username
        )
        db_session.add(comment)

        # 更新帖子评论数
        post.comments_count += 1

        db_session.commit()

        return jsonify({
            'success': True,
            'data': comment.to_dict()
        }), 201

    except Exception as e:
        db_session.rollback()
        return jsonify({'success': False, 'error': str(e)}), 500


@community_bp.route('/tags/popular', methods=['GET'])
def get_popular_tags():
    """
    获取热门标签
    """
    try:
        limit = int(request.args.get('limit', 10))

        tags = db_session.query(Tag).filter(
            Tag.usage_count > 0
        ).order_by(desc(Tag.usage_count)).limit(limit).all()

        return jsonify({
            'success': True,
            'data': [t.to_dict() for t in tags]
        })

    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


@community_bp.route('/check-like/<int:post_id>', methods=['GET'])
@token_required
def check_like_status(post_id):
    """
    检查当前用户是否已点赞某帖子
    """
    try:
        existing_like = db_session.query(PostLike).filter(
            PostLike.post_id == post_id,
            PostLike.user_id == g.user_id
        ).first()

        return jsonify({
            'success': True,
            'data': {
                'liked': existing_like is not None
            }
        })

    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500
