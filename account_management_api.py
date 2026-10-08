"""
账号与服务器管理 API
====================
管理平台类、硬件类、软件类账号资源
"""

from flask import Blueprint, jsonify, request, send_from_directory
from datetime import datetime, timedelta
import os
import hashlib
import uuid
from database import db_session
from models import (
    AccountResource, PlatformAccountDetail, HardwareResourceDetail,
    SoftwareResourceDetail, BillingRecord, Attachment
)

account_bp = Blueprint('account', __name__, url_prefix='/api/account')

ALLOWED_EXTENSIONS = {'pdf', 'doc', 'docx'}
MAX_FILE_SIZE = 10 * 1024 * 1024

UPLOAD_FOLDER = os.path.join(os.path.dirname(__file__), 'uploads')
if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)


def encrypt_password(password):
    if not password:
        return None
    return hashlib.sha256(password.encode()).hexdigest()


def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS


def get_resource_type_label(resource_type):
    labels = {
        'platform': '平台类',
        'hardware': '硬件类',
        'software': '软件类'
    }
    return labels.get(resource_type, resource_type)


def get_resource_with_details(resource):
    data = resource.to_dict()
    data['resource_type_label'] = get_resource_type_label(resource.resource_type)

    if resource.resource_type == 'platform' and resource.platform_detail:
        data['platform_detail'] = resource.platform_detail.to_dict()
    elif resource.resource_type == 'hardware' and resource.hardware_detail:
        data['hardware_detail'] = resource.hardware_detail.to_dict()
    elif resource.resource_type == 'software' and resource.software_detail:
        data['software_detail'] = resource.software_detail.to_dict()

    if resource.billing_records:
        data['billing_records'] = [br.to_dict() for br in resource.billing_records]
    else:
        data['billing_records'] = []

    return data


@account_bp.route('/resources', methods=['GET'])
def get_resources():
    """获取资源列表"""
    try:
        session = db_session
        page = int(request.args.get('page', 1))
        page_size = int(request.args.get('page_size', 10))
        search = request.args.get('search', '')
        resource_type = request.args.get('resource_type', '')
        category = request.args.get('category', '')
        status = request.args.get('status', '')
        manager_name = request.args.get('manager_name', '')
        is_paid = request.args.get('is_paid', '')
        renewal_days = request.args.get('renewal_days', '')

        query = session.query(AccountResource).filter(AccountResource.deleted_at.is_(None))

        if resource_type:
            query = query.filter(AccountResource.resource_type == resource_type)
        if category:
            query = query.filter(AccountResource.category == category)
        if status:
            query = query.filter(AccountResource.status == status)
        if manager_name:
            query = query.filter(AccountResource.manager_name.like(f'%{manager_name}%'))
        if search:
            search = f'%{search}%'
            query = query.filter(
                AccountResource.name.like(search) |
                AccountResource.username.like(search) |
                AccountResource.access_address.like(search) |
                AccountResource.manager_name.like(search)
            )

        if is_paid == 'true':
            subq = session.query(BillingRecord.resource_id).filter(BillingRecord.is_paid == True)
            query = query.filter(AccountResource.id.in_(subq))
        elif is_paid == 'false':
            subq = session.query(BillingRecord.resource_id).filter(BillingRecord.is_paid == True)
            query = query.filter(AccountResource.id.notin_(subq))

        if renewal_days:
            today = datetime.now()
            if renewal_days == '7':
                deadline = today + timedelta(days=7)
                subq = session.query(BillingRecord.resource_id).filter(
                    BillingRecord.next_renewal_date.between(today, deadline)
                )
                query = query.filter(AccountResource.id.in_(subq))
            elif renewal_days == '30':
                deadline = today + timedelta(days=30)
                subq = session.query(BillingRecord.resource_id).filter(
                    BillingRecord.next_renewal_date.between(today, deadline)
                )
                query = query.filter(AccountResource.id.in_(subq))
            elif renewal_days == 'expired':
                subq = session.query(BillingRecord.resource_id).filter(
                    BillingRecord.next_renewal_date < today
                )
                query = query.filter(AccountResource.id.in_(subq))

        total = query.count()
        query = query.order_by(AccountResource.updated_at.desc())
        resources = query.offset((page - 1) * page_size).limit(page_size).all()

        results = []
        for resource in resources:
            data = resource.to_dict()
            data['resource_type_label'] = get_resource_type_label(resource.resource_type)

            if resource.billing_records:
                latest_billing = max(resource.billing_records, key=lambda x: x.created_at)
                data['payment_status'] = latest_billing.payment_status
                data['next_renewal_date'] = latest_billing.next_renewal_date.isoformat() if latest_billing.next_renewal_date else None
            else:
                data['payment_status'] = '未付费'
                data['next_renewal_date'] = None

            results.append(data)

        

        return jsonify({
            'success': True,
            'data': {
                'resources': results,
                'total': total,
                'page': page,
                'page_size': page_size
            }
        })

    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


@account_bp.route('/resources/<int:resource_id>', methods=['GET'])
def get_resource_detail(resource_id):
    """获取资源详情"""
    try:
        session = db_session
        resource = session.query(AccountResource).filter(
            AccountResource.id == resource_id,
            AccountResource.deleted_at.is_(None)
        ).first()

        if not resource:
            
            return jsonify({'success': False, 'error': '资源不存在'}), 404

        data = get_resource_with_details(resource)

        attachments = session.query(Attachment).filter(
            Attachment.resource_id == resource_id,
            Attachment.deleted_at.is_(None)
        ).all()
        data['attachments'] = [a.to_dict() for a in attachments]

        for br in resource.billing_records:
            br_attachments = session.query(Attachment).filter(
                Attachment.billing_record_id == br.id,
                Attachment.deleted_at.is_(None)
            ).all()
            for b in data['billing_records']:
                if b['id'] == br.id:
                    b['attachments'] = [a.to_dict() for a in br_attachments]

        

        return jsonify({'success': True, 'data': data})

    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


@account_bp.route('/resources', methods=['POST'])
def create_resource():
    """创建资源"""
    try:
        session = db_session
        data = request.get_json()

        resource_type = data.get('resource_type')
        name = data.get('name')
        username = data.get('username')
        manager_name = data.get('manager_name')

        if resource_type == 'platform':
            if not name or not data.get('platform_category') or not username or not manager_name:
                
                return jsonify({'success': False, 'error': '平台名称、分类、登录账号和管理人不能为空'}), 400
        elif resource_type == 'hardware':
            if not name or not data.get('hardware_type') or not manager_name:
                
                return jsonify({'success': False, 'error': '资源名称、类型和管理人不能为空'}), 400
        elif resource_type == 'software':
            if not name or not data.get('software_type') or not manager_name:
                
                return jsonify({'success': False, 'error': '软件名称、类型和管理人不能为空'}), 400

        password = data.get('password')

        resource = AccountResource(
            resource_type=resource_type,
            name=name,
            category=data.get('category'),
            username=username,
            password_secret=encrypt_password(password),
            manager_name=manager_name,
            project_id=data.get('project_id'),
            status=data.get('status', '正常使用'),
            access_address=data.get('access_address'),
            remark=data.get('remark')
        )
        session.add(resource)
        session.flush()

        if resource_type == 'platform':
            detail = PlatformAccountDetail(
                resource_id=resource.id,
                platform_category=data.get('platform_category'),
                website_url=data.get('website_url'),
                registrant_name=data.get('registrant_name'),
                registered_contact_name=data.get('registered_contact_name'),
                registered_contact_phone=data.get('registered_contact_phone'),
                registered_contact_email=data.get('registered_contact_email'),
                platform_contact_name=data.get('platform_contact_name'),
                platform_contact_department=data.get('platform_contact_department'),
                platform_contact_position=data.get('platform_contact_position'),
                platform_contact_phone=data.get('platform_contact_phone'),
                platform_contact_email=data.get('platform_contact_email'),
                platform_contact_remark=data.get('platform_contact_remark'),
                login_method=data.get('login_method'),
                is_two_factor_auth=data.get('is_two_factor_auth', False)
            )
            session.add(detail)
        elif resource_type == 'hardware':
            detail = HardwareResourceDetail(
                resource_id=resource.id,
                resource_code=data.get('resource_code'),
                hardware_type=data.get('hardware_type'),
                server_name=data.get('server_name'),
                purpose=data.get('purpose'),
                operating_system=data.get('operating_system'),
                cpu_info=data.get('cpu_info'),
                memory_size=data.get('memory_size'),
                disk_capacity=data.get('disk_capacity'),
                ip_address=data.get('ip_address'),
                private_ip=data.get('private_ip'),
                public_ip=data.get('public_ip'),
                login_port=data.get('login_port'),
                login_protocol=data.get('login_protocol'),
                location=data.get('location'),
                brand=data.get('brand'),
                model=data.get('model'),
                activated_at=datetime.fromisoformat(data.get('activated_at')) if data.get('activated_at') else None,
                is_cloud=data.get('is_cloud', False)
            )
            session.add(detail)
        elif resource_type == 'software':
            detail = SoftwareResourceDetail(
                resource_id=resource.id,
                software_type=data.get('software_type'),
                version=data.get('version'),
                purpose=data.get('purpose'),
                deployed_server=data.get('deployed_server'),
                server_ip=data.get('server_ip'),
                access_address=data.get('access_address'),
                login_port=data.get('login_port'),
                login_protocol=data.get('login_protocol'),
                deploy_path=data.get('deploy_path'),
                deployed_at=datetime.fromisoformat(data.get('deployed_at')) if data.get('deployed_at') else None,
                license_required=data.get('license_required', False),
                license_type=data.get('license_type'),
                license_info=data.get('license_info'),
                expires_at=datetime.fromisoformat(data.get('expires_at')) if data.get('expires_at') else None,
                admin_url=data.get('admin_url'),
                login_note=data.get('login_note')
            )
            session.add(detail)

        billing_records = data.get('billing_records', [])
        for br in billing_records:
            billing_record = BillingRecord(
                resource_id=resource.id,
                is_paid=br.get('is_paid', False),
                fee_type=br.get('fee_type'),
                renewal_cycle=br.get('renewal_cycle'),
                last_renewal_date=datetime.fromisoformat(br.get('last_renewal_date')) if br.get('last_renewal_date') else None,
                next_renewal_date=datetime.fromisoformat(br.get('next_renewal_date')) if br.get('next_renewal_date') else None,
                amount=br.get('amount'),
                currency=br.get('currency', 'CNY'),
                payer_name=br.get('payer_name'),
                payment_status=br.get('payment_status', '未付款'),
                contract_name=br.get('contract_name'),
                contract_number=br.get('contract_number'),
                contract_start_date=datetime.fromisoformat(br.get('contract_start_date')) if br.get('contract_start_date') else None,
                contract_end_date=datetime.fromisoformat(br.get('contract_end_date')) if br.get('contract_end_date') else None,
                fee_remark=br.get('fee_remark')
            )
            session.add(billing_record)

        session.commit()
        

        return jsonify({'success': True, 'data': {'id': resource.id}, 'message': '创建成功'}), 201

    except Exception as e:
        session.rollback()
        
        return jsonify({'success': False, 'error': str(e)}), 500


@account_bp.route('/resources/<int:resource_id>', methods=['PUT'])
def update_resource(resource_id):
    """更新资源"""
    try:
        session = db_session
        resource = session.query(AccountResource).filter(
            AccountResource.id == resource_id,
            AccountResource.deleted_at.is_(None)
        ).first()

        if not resource:
            
            return jsonify({'success': False, 'error': '资源不存在'}), 404

        data = request.get_json()

        resource.name = data.get('name', resource.name)
        resource.category = data.get('category', resource.category)
        resource.username = data.get('username', resource.username)
        resource.manager_name = data.get('manager_name', resource.manager_name)
        resource.project_id = data.get('project_id', resource.project_id)
        resource.status = data.get('status', resource.status)
        resource.access_address = data.get('access_address', resource.access_address)
        resource.remark = data.get('remark', resource.remark)

        password = data.get('password')
        if password:
            resource.password_secret = encrypt_password(password)

        if resource.resource_type == 'platform':
            if resource.platform_detail:
                detail = resource.platform_detail
            else:
                detail = PlatformAccountDetail(resource_id=resource.id)
                session.add(detail)

            detail.platform_category = data.get('platform_category', detail.platform_category)
            detail.website_url = data.get('website_url', detail.website_url)
            detail.registrant_name = data.get('registrant_name', detail.registrant_name)
            detail.registered_contact_name = data.get('registered_contact_name', detail.registered_contact_name)
            detail.registered_contact_phone = data.get('registered_contact_phone', detail.registered_contact_phone)
            detail.registered_contact_email = data.get('registered_contact_email', detail.registered_contact_email)
            detail.platform_contact_name = data.get('platform_contact_name', detail.platform_contact_name)
            detail.platform_contact_department = data.get('platform_contact_department', detail.platform_contact_department)
            detail.platform_contact_position = data.get('platform_contact_position', detail.platform_contact_position)
            detail.platform_contact_phone = data.get('platform_contact_phone', detail.platform_contact_phone)
            detail.platform_contact_email = data.get('platform_contact_email', detail.platform_contact_email)
            detail.platform_contact_remark = data.get('platform_contact_remark', detail.platform_contact_remark)
            detail.login_method = data.get('login_method', detail.login_method)
            detail.is_two_factor_auth = data.get('is_two_factor_auth', detail.is_two_factor_auth)

        elif resource.resource_type == 'hardware':
            if resource.hardware_detail:
                detail = resource.hardware_detail
            else:
                detail = HardwareResourceDetail(resource_id=resource.id)
                session.add(detail)

            detail.resource_code = data.get('resource_code', detail.resource_code)
            detail.hardware_type = data.get('hardware_type', detail.hardware_type)
            detail.server_name = data.get('server_name', detail.server_name)
            detail.purpose = data.get('purpose', detail.purpose)
            detail.operating_system = data.get('operating_system', detail.operating_system)
            detail.cpu_info = data.get('cpu_info', detail.cpu_info)
            detail.memory_size = data.get('memory_size', detail.memory_size)
            detail.disk_capacity = data.get('disk_capacity', detail.disk_capacity)
            detail.ip_address = data.get('ip_address', detail.ip_address)
            detail.private_ip = data.get('private_ip', detail.private_ip)
            detail.public_ip = data.get('public_ip', detail.public_ip)
            detail.login_port = data.get('login_port', detail.login_port)
            detail.login_protocol = data.get('login_protocol', detail.login_protocol)
            detail.location = data.get('location', detail.location)
            detail.brand = data.get('brand', detail.brand)
            detail.model = data.get('model', detail.model)
            if data.get('activated_at'):
                detail.activated_at = datetime.fromisoformat(data.get('activated_at'))
            detail.is_cloud = data.get('is_cloud', detail.is_cloud)

        elif resource.resource_type == 'software':
            if resource.software_detail:
                detail = resource.software_detail
            else:
                detail = SoftwareResourceDetail(resource_id=resource.id)
                session.add(detail)

            detail.software_type = data.get('software_type', detail.software_type)
            detail.version = data.get('version', detail.version)
            detail.purpose = data.get('purpose', detail.purpose)
            detail.deployed_server = data.get('deployed_server', detail.deployed_server)
            detail.server_ip = data.get('server_ip', detail.server_ip)
            detail.access_address = data.get('access_address', detail.access_address)
            detail.login_port = data.get('login_port', detail.login_port)
            detail.login_protocol = data.get('login_protocol', detail.login_protocol)
            detail.deploy_path = data.get('deploy_path', detail.deploy_path)
            if data.get('deployed_at'):
                detail.deployed_at = datetime.fromisoformat(data.get('deployed_at'))
            detail.license_required = data.get('license_required', detail.license_required)
            detail.license_type = data.get('license_type', detail.license_type)
            detail.license_info = data.get('license_info', detail.license_info)
            if data.get('expires_at'):
                detail.expires_at = datetime.fromisoformat(data.get('expires_at'))
            detail.admin_url = data.get('admin_url', detail.admin_url)
            detail.login_note = data.get('login_note', detail.login_note)

        billing_records = data.get('billing_records', [])
        if billing_records:
            for existing_br in resource.billing_records:
                session.delete(existing_br)
            for br in billing_records:
                billing_record = BillingRecord(
                    resource_id=resource.id,
                    is_paid=br.get('is_paid', False),
                    fee_type=br.get('fee_type'),
                    renewal_cycle=br.get('renewal_cycle'),
                    last_renewal_date=datetime.fromisoformat(br.get('last_renewal_date')) if br.get('last_renewal_date') else None,
                    next_renewal_date=datetime.fromisoformat(br.get('next_renewal_date')) if br.get('next_renewal_date') else None,
                    amount=br.get('amount'),
                    currency=br.get('currency', 'CNY'),
                    payer_name=br.get('payer_name'),
                    payment_status=br.get('payment_status', '未付款'),
                    contract_name=br.get('contract_name'),
                    contract_number=br.get('contract_number'),
                    contract_start_date=datetime.fromisoformat(br.get('contract_start_date')) if br.get('contract_start_date') else None,
                    contract_end_date=datetime.fromisoformat(br.get('contract_end_date')) if br.get('contract_end_date') else None,
                    fee_remark=br.get('fee_remark')
                )
                session.add(billing_record)

        session.commit()
        

        return jsonify({'success': True, 'message': '更新成功'})

    except Exception as e:
        session.rollback()
        
        return jsonify({'success': False, 'error': str(e)}), 500


@account_bp.route('/resources/<int:resource_id>', methods=['DELETE'])
def delete_resource(resource_id):
    """删除资源"""
    try:
        session = db_session
        resource = session.query(AccountResource).filter(
            AccountResource.id == resource_id,
            AccountResource.deleted_at.is_(None)
        ).first()

        if not resource:
            
            return jsonify({'success': False, 'error': '资源不存在'}), 404

        resource.deleted_at = datetime.now()

        for attachment in resource.attachments:
            attachment.deleted_at = datetime.now()

        for br in resource.billing_records:
            for attachment in br.attachments:
                attachment.deleted_at = datetime.now()

        session.commit()
        

        return jsonify({'success': True, 'message': '删除成功'})

    except Exception as e:
        session.rollback()
        
        return jsonify({'success': False, 'error': str(e)}), 500


@account_bp.route('/resources/stats', methods=['GET'])
def get_stats():
    """获取统计数据"""
    try:
        session = db_session

        today = datetime.now()
        in_7_days = today + timedelta(days=7)
        in_30_days = today + timedelta(days=30)

        total_platform = session.query(AccountResource).filter(
            AccountResource.resource_type == 'platform',
            AccountResource.deleted_at.is_(None)
        ).count()
        total_hardware = session.query(AccountResource).filter(
            AccountResource.resource_type == 'hardware',
            AccountResource.deleted_at.is_(None)
        ).count()
        total_software = session.query(AccountResource).filter(
            AccountResource.resource_type == 'software',
            AccountResource.deleted_at.is_(None)
        ).count()

        status_counts = {}
        for status in ['正常使用', '暂停使用', '已停用', '待维护', '正常运行', '维护中', '已报废']:
            count = session.query(AccountResource).filter(
                AccountResource.status == status,
                AccountResource.deleted_at.is_(None)
            ).count()
            status_counts[status] = count

        upcoming_renewal = session.query(BillingRecord).filter(
            BillingRecord.next_renewal_date.between(today, in_30_days),
            BillingRecord.payment_status != '已停止'
        ).count()
        expired = session.query(BillingRecord).filter(
            BillingRecord.next_renewal_date < today,
            BillingRecord.payment_status != '已停止'
        ).count()

        recent_added = session.query(AccountResource).filter(
            AccountResource.deleted_at.is_(None)
        ).order_by(AccountResource.created_at.desc()).limit(5).all()
        recent_modified = session.query(AccountResource).filter(
            AccountResource.deleted_at.is_(None)
        ).order_by(AccountResource.updated_at.desc()).limit(5).all()

        upcoming_renewal_records = session.query(BillingRecord).filter(
            BillingRecord.next_renewal_date.between(today, in_30_days),
            BillingRecord.payment_status != '已停止'
        ).order_by(BillingRecord.next_renewal_date.asc()).limit(5).all()

        

        return jsonify({
            'success': True,
            'data': {
                'total_platform': total_platform,
                'total_hardware': total_hardware,
                'total_software': total_software,
                'total': total_platform + total_hardware + total_software,
                'status_counts': status_counts,
                'upcoming_renewal': upcoming_renewal,
                'expired': expired,
                'recent_added': [r.to_dict() for r in recent_added],
                'recent_modified': [r.to_dict() for r in recent_modified],
                'upcoming_renewal_records': [r.to_dict() for r in upcoming_renewal_records]
            }
        })

    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


@account_bp.route('/resources/renewal', methods=['GET'])
def get_renewal_list():
    """获取即将续费列表"""
    try:
        session = db_session
        days = int(request.args.get('days', 30))
        today = datetime.now()
        deadline = today + timedelta(days=days)

        query = session.query(BillingRecord).filter(
            BillingRecord.next_renewal_date.between(today, deadline),
            BillingRecord.payment_status != '已停止'
        ).order_by(BillingRecord.next_renewal_date.asc())

        records = query.all()
        results = []
        for record in records:
            data = record.to_dict()
            resource = session.query(AccountResource).filter(
                AccountResource.id == record.resource_id,
                AccountResource.deleted_at.is_(None)
            ).first()
            if resource:
                data['resource_name'] = resource.name
                data['resource_type'] = resource.resource_type
                data['resource_type_label'] = get_resource_type_label(resource.resource_type)
            results.append(data)

        

        return jsonify({'success': True, 'data': {'records': results}})

    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


@account_bp.route('/attachments', methods=['POST'])
def upload_attachment():
    """上传附件"""
    try:
        if 'file' not in request.files:
            return jsonify({'success': False, 'error': '请选择文件'}), 400

        file = request.files['file']
        if file.filename == '':
            return jsonify({'success': False, 'error': '请选择文件'}), 400

        if not allowed_file(file.filename):
            return jsonify({'success': False, 'error': '只支持PDF、DOC、DOCX格式'}), 400

        if len(file.read()) > MAX_FILE_SIZE:
            return jsonify({'success': False, 'error': '文件大小不能超过10MB'}), 400
        file.seek(0)

        resource_id = request.form.get('resource_id')
        billing_record_id = request.form.get('billing_record_id')

        if not resource_id and not billing_record_id:
            return jsonify({'success': False, 'error': '请指定资源ID或付费记录ID'}), 400

        filename = str(uuid.uuid4()) + '_' + file.filename
        filepath = os.path.join(UPLOAD_FOLDER, filename)
        file.save(filepath)

        file_size = os.path.getsize(filepath)
        file_type = file.filename.rsplit('.', 1)[1].lower()

        session = db_session
        attachment = Attachment(
            resource_id=int(resource_id) if resource_id else None,
            billing_record_id=int(billing_record_id) if billing_record_id else None,
            file_name=file.filename,
            file_path=filename,
            file_size=file_size,
            file_type=file_type,
            uploaded_by='admin'
        )
        session.add(attachment)
        session.commit()
        

        return jsonify({'success': True, 'data': attachment.to_dict(), 'message': '上传成功'})

    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


@account_bp.route('/attachments', methods=['GET'])
def get_attachments():
    """获取附件列表"""
    try:
        session = db_session
        resource_id = request.args.get('resource_id')
        billing_record_id = request.args.get('billing_record_id')

        query = session.query(Attachment).filter(Attachment.deleted_at.is_(None))

        if resource_id:
            query = query.filter(Attachment.resource_id == int(resource_id))
        if billing_record_id:
            query = query.filter(Attachment.billing_record_id == int(billing_record_id))

        attachments = query.order_by(Attachment.uploaded_at.desc()).all()

        

        return jsonify({'success': True, 'data': {'attachments': [a.to_dict() for a in attachments]}})

    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


@account_bp.route('/attachments/<int:attachment_id>', methods=['GET'])
def download_attachment(attachment_id):
    """下载附件"""
    try:
        session = db_session
        attachment = session.query(Attachment).filter(
            Attachment.id == attachment_id,
            Attachment.deleted_at.is_(None)
        ).first()

        if not attachment:
            
            return jsonify({'success': False, 'error': '附件不存在'}), 404

        filepath = os.path.join(UPLOAD_FOLDER, attachment.file_path)
        if not os.path.exists(filepath):
            
            return jsonify({'success': False, 'error': '文件不存在'}), 404

        

        return send_from_directory(UPLOAD_FOLDER, attachment.file_path, as_attachment=True, download_name=attachment.file_name)

    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


@account_bp.route('/attachments/<int:attachment_id>', methods=['DELETE'])
def delete_attachment(attachment_id):
    """删除附件"""
    try:
        session = db_session
        attachment = session.query(Attachment).filter(
            Attachment.id == attachment_id,
            Attachment.deleted_at.is_(None)
        ).first()

        if not attachment:
            
            return jsonify({'success': False, 'error': '附件不存在'}), 404

        attachment.deleted_at = datetime.now()
        session.commit()
        

        return jsonify({'success': True, 'message': '删除成功'})

    except Exception as e:
        session.rollback()
        
        return jsonify({'success': False, 'error': str(e)}), 500


@account_bp.route('/options', methods=['GET'])
def get_options():
    """获取选项配置"""
    try:
        options = {
            'resource_types': [
                {'value': 'platform', 'label': '平台类'},
                {'value': 'hardware', 'label': '硬件类'},
                {'value': 'software', 'label': '软件类'}
            ],
            'platform_categories': [
                {'value': '网站管理', 'label': '网站管理'},
                {'value': '云服务', 'label': '云服务'},
                {'value': '知识产权', 'label': '知识产权'},
                {'value': 'AI平台', 'label': 'AI平台'},
                {'value': '招投标平台', 'label': '招投标平台'},
                {'value': '微信及社交媒体', 'label': '微信及社交媒体'},
                {'value': '其他', 'label': '其他'}
            ],
            'hardware_types': [
                {'value': '物理服务器', 'label': '物理服务器'},
                {'value': '云服务器', 'label': '云服务器'},
                {'value': '工作站', 'label': '工作站'},
                {'value': '存储设备', 'label': '存储设备'},
                {'value': '网络设备', 'label': '网络设备'},
                {'value': '其他', 'label': '其他'}
            ],
            'software_types': [
                {'value': '开发平台', 'label': '开发平台'},
                {'value': '数据库', 'label': '数据库'},
                {'value': '项目管理', 'label': '项目管理'},
                {'value': '数据分析', 'label': '数据分析'},
                {'value': '部署服务', 'label': '部署服务'},
                {'value': '服务器管理', 'label': '服务器管理'},
                {'value': '其他', 'label': '其他'}
            ],
            'platform_status': [
                {'value': '正常使用', 'label': '正常使用'},
                {'value': '暂停使用', 'label': '暂停使用'},
                {'value': '已停用', 'label': '已停用'},
                {'value': '待维护', 'label': '待维护'}
            ],
            'hardware_status': [
                {'value': '正常运行', 'label': '正常运行'},
                {'value': '维护中', 'label': '维护中'},
                {'value': '暂停使用', 'label': '暂停使用'},
                {'value': '已停用', 'label': '已停用'},
                {'value': '已报废', 'label': '已报废'}
            ],
            'software_status': [
                {'value': '正常运行', 'label': '正常运行'},
                {'value': '维护中', 'label': '维护中'},
                {'value': '暂停使用', 'label': '暂停使用'},
                {'value': '已停用', 'label': '已停用'}
            ],
            'fee_types': [
                {'value': '月付', 'label': '月付'},
                {'value': '季付', 'label': '季付'},
                {'value': '年付', 'label': '年付'},
                {'value': '按量付费', 'label': '按量付费'},
                {'value': '一次性付费', 'label': '一次性付费'},
                {'value': '其他', 'label': '其他'}
            ],
            'payment_status': [
                {'value': '未付款', 'label': '未付款'},
                {'value': '已付款', 'label': '已付款'},
                {'value': '待续费', 'label': '待续费'},
                {'value': '已停止', 'label': '已停止'}
            ]
        }

        return jsonify({'success': True, 'data': options})

    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500