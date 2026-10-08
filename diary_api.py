"""
MOOD DUST 日记 API 模块
=======================
日记 CRUD、月度心情统计、心情记录管理
"""

import json
from flask import Blueprint, request, jsonify, g
from sqlalchemy import func, desc
from database import db_session
from models import Diary, MoodEntry, User
from auth import token_required, optional_token

# 创建蓝图
diary_bp = Blueprint('diary', __name__, url_prefix='/api/diary')


@diary_bp.route('/', methods=['GET'])
@token_required
def get_diaries():
    """
    获取当前用户的所有日记
    支持分页：?page=1&page_size=10
    支持按月份筛选：?year=2024&month=6
    """
    try:
        page = int(request.args.get('page', 1))
        page_size = int(request.args.get('page_size', 10))
        year = request.args.get('year')
        month = request.args.get('month')

        query = db_session.query(Diary).filter(Diary.user_id == g.user_id)

        # 按月份筛选
        if year and month:
            month_str = f"{year}-{int(month):02d}"
            query = query.filter(Diary.date.like(f"{month_str}%"))

        # 按日期降序
        query = query.order_by(desc(Diary.date))

        # 分页
        total = query.count()
        diaries = query.offset((page - 1) * page_size).limit(page_size).all()

        return jsonify({
            'success': True,
            'data': {
                'diaries': [d.to_dict() for d in diaries],
                'total': total,
                'page': page,
                'page_size': page_size,
                'total_pages': (total + page_size - 1) // page_size
            }
        })

    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


@diary_bp.route('/<date>', methods=['GET'])
@token_required
def get_diary_by_date(date):
    """
    获取指定日期的日记
    """
    try:
        diary = db_session.query(Diary).filter(
            Diary.user_id == g.user_id,
            Diary.date == date
        ).first()

        if not diary:
            return jsonify({
                'success': True,
                'data': None,
                'message': 'No diary for this date'
            })

        return jsonify({
            'success': True,
            'data': diary.to_dict()
        })

    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


@diary_bp.route('/', methods=['POST'])
@token_required
def save_diary():
    """
    保存或更新日记
    """
    try:
        data = request.get_json()

        date = data.get('date')
        mood = data.get('mood')
        content = data.get('content', '')
        ai_sentence = data.get('ai_sentence', '')
        image_paths = data.get('image_paths', [])

        if not date:
            return jsonify({'success': False, 'error': 'Date is required'}), 400

        # 查找是否已存在该日期的日记
        diary = db_session.query(Diary).filter(
            Diary.user_id == g.user_id,
            Diary.date == date
        ).first()

        if diary:
            # 更新
            diary.mood = mood
            diary.content = content
            diary.ai_sentence = ai_sentence
            diary.image_paths = json.dumps(image_paths) if image_paths else None
        else:
            # 创建
            diary = Diary(
                user_id=g.user_id,
                date=date,
                mood=mood,
                content=content,
                ai_sentence=ai_sentence,
                image_paths=json.dumps(image_paths) if image_paths else None
            )
            db_session.add(diary)

        # 同步更新心情记录（用于统计）
        if mood:
            mood_entry = db_session.query(MoodEntry).filter(
                MoodEntry.user_id == g.user_id,
                MoodEntry.date == date
            ).first()

            if mood_entry:
                mood_entry.mood = mood
            else:
                mood_entry = MoodEntry(
                    user_id=g.user_id,
                    mood=mood,
                    date=date
                )
                db_session.add(mood_entry)

        db_session.commit()

        return jsonify({
            'success': True,
            'data': diary.to_dict()
        })

    except Exception as e:
        db_session.rollback()
        return jsonify({'success': False, 'error': str(e)}), 500


@diary_bp.route('/<date>', methods=['DELETE'])
@token_required
def delete_diary(date):
    """
    删除指定日期的日记
    """
    try:
        diary = db_session.query(Diary).filter(
            Diary.user_id == g.user_id,
            Diary.date == date
        ).first()

        if not diary:
            return jsonify({'success': False, 'error': 'Diary not found'}), 404

        db_session.delete(diary)

        # 同时删除心情记录
        mood_entry = db_session.query(MoodEntry).filter(
            MoodEntry.user_id == g.user_id,
            MoodEntry.date == date
        ).first()
        if mood_entry:
            db_session.delete(mood_entry)

        db_session.commit()

        return jsonify({
            'success': True,
            'message': 'Diary deleted'
        })

    except Exception as e:
        db_session.rollback()
        return jsonify({'success': False, 'error': str(e)}), 500


@diary_bp.route('/stats', methods=['GET'])
@token_required
def get_mood_stats():
    """
    获取月度心情统计
    支持：?year=2024&month=6
    返回：本月出现最多的心情
    """
    try:
        year = request.args.get('year')
        month = request.args.get('month')

        if not year or not month:
            from datetime import datetime
            now = datetime.now()
            year = now.year
            month = now.month

        # 查询该月份的心情记录
        month_str = f"{year}-{int(month):02d}"
        entries = db_session.query(MoodEntry).filter(
            MoodEntry.user_id == g.user_id,
            MoodEntry.date.like(f"{month_str}%")
        ).all()

        if not entries:
            return jsonify({
                'success': True,
                'data': {
                    'month': month_str,
                    'total_entries': 0,
                    'top_mood': None,
                    'mood_counts': {}
                }
            })

        # 统计各心情出现次数
        mood_counts = {}
        for entry in entries:
            mood = entry.mood or 'unknown'
            mood_counts[mood] = mood_counts.get(mood, 0) + 1

        # 找出最多的心情
        top_mood = max(mood_counts, key=mood_counts.get)
        top_count = mood_counts[top_mood]

        return jsonify({
            'success': True,
            'data': {
                'month': month_str,
                'total_entries': len(entries),
                'top_mood': top_mood,
                'top_count': top_count,
                'mood_counts': mood_counts
            }
        })

    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


@diary_bp.route('/history', methods=['GET'])
@token_required
def get_mood_history():
    """
    获取心情历史记录（用于冥想页面）
    """
    try:
        year = request.args.get('year')
        month = request.args.get('month')

        if not year or not month:
            from datetime import datetime
            now = datetime.now()
            year = now.year
            month = now.month

        month_str = f"{year}-{int(month):02d}"
        entries = db_session.query(MoodEntry).filter(
            MoodEntry.user_id == g.user_id,
            MoodEntry.date.like(f"{month_str}%")
        ).order_by(MoodEntry.date).all()

        return jsonify({
            'success': True,
            'data': [e.to_dict() for e in entries]
        })

    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500
