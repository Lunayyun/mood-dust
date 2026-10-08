const API_BASE = '/api/account';

let currentPage = 1;
let pageSize = 10;
let totalPages = 1;
let currentResourceId = null;
let optionsData = {};

function showStatus(message, type = 'success') {
    const el = document.getElementById('status-message');
    el.textContent = message;
    el.className = `status-message ${type}`;
    el.classList.add('show');
    setTimeout(() => el.classList.remove('show'), 3000);
}

async function initOptions() {
    try {
        const res = await fetch(`${API_BASE}/options`);
        const data = await res.json();
        if (data.success) {
            optionsData = data.data;
            populateCategorySelect('platform');
            populateStatusSelect('platform');
        }
    } catch (e) {
        console.error('Failed to load options:', e);
    }
}

function populateCategorySelect(resourceType) {
    const select = document.getElementById('form-category');
    select.innerHTML = '';
    
    let categories = [];
    if (resourceType === 'platform') {
        categories = optionsData.platform_categories || [];
    } else if (resourceType === 'hardware') {
        categories = optionsData.hardware_types || [];
    } else if (resourceType === 'software') {
        categories = optionsData.software_types || [];
    }
    
    categories.forEach(cat => {
        const option = document.createElement('option');
        option.value = cat.value;
        option.textContent = cat.label;
        select.appendChild(option);
    });
}

function populateStatusSelect(resourceType) {
    const select = document.getElementById('form-status');
    select.innerHTML = '';
    
    let statuses = [];
    if (resourceType === 'platform') {
        statuses = optionsData.platform_status || [];
    } else if (resourceType === 'hardware') {
        statuses = optionsData.hardware_status || [];
    } else if (resourceType === 'software') {
        statuses = optionsData.software_status || [];
    }
    
    statuses.forEach(status => {
        const option = document.createElement('option');
        option.value = status.value;
        option.textContent = status.label;
        select.appendChild(option);
    });
}

function toggleResourceSections(resourceType) {
    document.getElementById('platform-section').style.display = resourceType === 'platform' ? 'block' : 'none';
    document.getElementById('hardware-section').style.display = resourceType === 'hardware' ? 'block' : 'none';
    document.getElementById('software-section').style.display = resourceType === 'software' ? 'block' : 'none';
    document.getElementById('login-method-row').style.display = resourceType === 'platform' ? 'grid' : 'none';
    
    populateCategorySelect(resourceType);
    populateStatusSelect(resourceType);
}

async function loadResources() {
    const search = document.getElementById('search-input').value;
    const resourceType = document.getElementById('resource-type-filter').value;
    const status = document.getElementById('status-filter').value;
    const renewalDays = document.getElementById('renewal-filter').value;
    const isPaid = document.getElementById('paid-filter').value;

    try {
        let url = `${API_BASE}/resources?page=${currentPage}&page_size=${pageSize}`;
        if (search) url += `&search=${encodeURIComponent(search)}`;
        if (resourceType) url += `&resource_type=${resourceType}`;
        if (status) url += `&status=${encodeURIComponent(status)}`;
        if (renewalDays) url += `&renewal_days=${renewalDays}`;
        if (isPaid) url += `&is_paid=${isPaid}`;

        const res = await fetch(url);
        const data = await res.json();
        
        if (data.success) {
            renderTable(data.data.resources);
            totalPages = Math.ceil(data.data.total / pageSize);
            updatePagination();
        }
    } catch (e) {
        console.error('Failed to load resources:', e);
    }
}

function getStatusClass(status) {
    if (['正常使用', '正常运行'].includes(status)) return 'normal';
    if (['暂停使用', '待维护', '维护中'].includes(status)) return 'warning';
    if (['已停用', '已报废'].includes(status)) return 'danger';
    return 'info';
}

function renderTable(resources) {
    const tbody = document.getElementById('resource-table-body');
    
    if (resources.length === 0) {
        tbody.innerHTML = '<tr><td colspan="10" class="empty-row">暂无数据</td></tr>';
        return;
    }

    tbody.innerHTML = resources.map(resource => `
        <tr>
            <td><span style="color: var(--zen-accent);">${escapeHtml(resource.name)}</span></td>
            <td>${resource.resource_type_label || resource.resource_type}</td>
            <td>${escapeHtml(resource.category) || '-'}</td>
            <td>${escapeHtml(resource.manager_name) || '-'}</td>
            <td><span class="detail-value copyable" onclick="copyToClipboard('${escapeHtml(resource.access_address || '')}')">${escapeHtml(resource.access_address) || '-'}</span></td>
            <td><span class="status-badge ${getStatusClass(resource.status)}">${escapeHtml(resource.status)}</span></td>
            <td>${resource.payment_status || '-'}</td>
            <td>${resource.next_renewal_date ? formatDate(resource.next_renewal_date) : '-'}</td>
            <td>${formatDateTime(resource.updated_at)}</td>
            <td>
                <button class="action-btn" onclick="viewDetail(${resource.id})">详情</button>
                <button class="action-btn" onclick="editResource(${resource.id})">编辑</button>
                <button class="action-btn delete" onclick="deleteResource(${resource.id}, '${escapeHtml(resource.name)}')">删除</button>
            </td>
        </tr>
    `).join('');
}

function updatePagination() {
    document.getElementById('page-info').textContent = `第 ${currentPage} 页 / 共 ${totalPages} 页`;
    document.getElementById('prev-page').disabled = currentPage <= 1;
    document.getElementById('next-page').disabled = currentPage >= totalPages;
}

async function loadStats() {
    try {
        const res = await fetch(`${API_BASE}/resources/stats`);
        const data = await res.json();
        
        if (data.success) {
            document.getElementById('total-count').textContent = data.data.total;
            document.getElementById('platform-count').textContent = data.data.total_platform;
            document.getElementById('hardware-count').textContent = data.data.total_hardware;
            document.getElementById('software-count').textContent = data.data.total_software;
            document.getElementById('renewal-count').textContent = data.data.upcoming_renewal;
            document.getElementById('expired-count').textContent = data.data.expired;
            
            renderRecentList(data.data.recent_modified);
        }
    } catch (e) {
        console.error('Failed to load stats:', e);
    }
}

function renderRecentList(items) {
    const list = document.getElementById('recent-list');
    
    if (!items || items.length === 0) {
        list.innerHTML = '<div class="recent-item empty">暂无数据</div>';
        return;
    }

    list.innerHTML = items.slice(0, 5).map(item => `
        <div class="recent-item" onclick="viewDetail(${item.id})">
            <span>${escapeHtml(item.name)}</span>
            <span style="color: var(--zen-text-tertiary); font-size: 10px;">${formatDate(item.updated_at)}</span>
        </div>
    `).join('');
}

async function viewDetail(id) {
    currentResourceId = id;
    
    try {
        const res = await fetch(`${API_BASE}/resources/${id}`);
        const data = await res.json();
        
        if (data.success) {
            renderDetail(data.data);
            document.getElementById('detail-modal').classList.add('active');
        }
    } catch (e) {
        console.error('Failed to load detail:', e);
        showStatus('加载详情失败', 'error');
    }
}

function renderDetail(data) {
    const container = document.getElementById('detail-content');
    let html = '';
    
    if (data.next_renewal_date) {
        const nextDate = new Date(data.next_renewal_date);
        const today = new Date();
        const diffDays = Math.ceil((nextDate - today) / (1000 * 60 * 60 * 24));
        
        if (diffDays < 0) {
            html += '<div class="expired-warning">⚠️ 已过期 ' + Math.abs(diffDays) + ' 天，请尽快续费</div>';
        } else if (diffDays <= 7) {
            html += '<div class="renewal-warning">⚠️ 即将在 ' + diffDays + ' 天内续费</div>';
        }
    }
    
    html += `
        <div class="detail-content-section">
            <div class="detail-content-title">基础信息</div>
            <div class="detail-grid">
                <div class="detail-item"><span class="detail-label">资源名称</span><span class="detail-value">${escapeHtml(data.name)}</span></div>
                <div class="detail-item"><span class="detail-label">资源类型</span><span class="detail-value">${data.resource_type_label}</span></div>
                <div class="detail-item"><span class="detail-label">分类</span><span class="detail-value">${escapeHtml(data.category) || '-'}</span></div>
                <div class="detail-item"><span class="detail-label">状态</span><span class="detail-value"><span class="status-badge ${getStatusClass(data.status)}">${escapeHtml(data.status)}</span></span></div>
                <div class="detail-item"><span class="detail-label">管理人</span><span class="detail-value">${escapeHtml(data.manager_name) || '-'}</span></div>
                <div class="detail-item"><span class="detail-label">创建时间</span><span class="detail-value">${formatDateTime(data.created_at)}</span></div>
                <div class="detail-item"><span class="detail-label">更新时间</span><span class="detail-value">${formatDateTime(data.updated_at)}</span></div>
            </div>
        </div>
        
        <div class="detail-content-section">
            <div class="detail-content-title">登录信息</div>
            <div class="detail-grid">
                <div class="detail-item"><span class="detail-label">登录账号</span><span class="detail-value copyable" onclick="copyToClipboard('${escapeHtml(data.username || '')}')">${escapeHtml(data.username) || '-'}</span></div>
                <div class="detail-item">
                    <span class="detail-label">登录密码</span>
                    <div class="password-toggle">
                        <input type="password" id="detail-password" value="${escapeHtml(data.password_secret || '')}" readonly>
                        <button class="toggle-btn" onclick="togglePassword('detail-password')">显示</button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    if (data.platform_detail) {
        const pd = data.platform_detail;
        html += `
            <div class="detail-content-section">
                <div class="detail-content-title">平台信息</div>
                <div class="detail-grid">
                    <div class="detail-item"><span class="detail-label">平台网址</span><span class="detail-value copyable" onclick="copyToClipboard('${escapeHtml(pd.website_url || '')}')">${escapeHtml(pd.website_url) || '-'}</span></div>
                    <div class="detail-item"><span class="detail-label">登录方式</span><span class="detail-value">${escapeHtml(pd.login_method) || '-'}</span></div>
                    <div class="detail-item"><span class="detail-label">二次验证</span><span class="detail-value">${pd.is_two_factor_auth ? '是' : '否'}</span></div>
                    <div class="detail-item"><span class="detail-label">注册人</span><span class="detail-value">${escapeHtml(pd.registrant_name) || '-'}</span></div>
                    <div class="detail-item"><span class="detail-label">联系人</span><span class="detail-value">${escapeHtml(pd.registered_contact_name) || '-'}</span></div>
                    <div class="detail-item"><span class="detail-label">联系电话</span><span class="detail-value copyable" onclick="copyToClipboard('${escapeHtml(pd.registered_contact_phone || '')}')">${escapeHtml(pd.registered_contact_phone) || '-'}</span></div>
                    <div class="detail-item"><span class="detail-label">联系邮箱</span><span class="detail-value copyable" onclick="copyToClipboard('${escapeHtml(pd.registered_contact_email || '')}')">${escapeHtml(pd.registered_contact_email) || '-'}</span></div>
                </div>
                ${pd.platform_contact_name ? `
                    <div class="form-section-sub">
                        <h4 class="form-section-subtitle">平台对接人</h4>
                        <div class="detail-grid">
                            <div class="detail-item"><span class="detail-label">姓名</span><span class="detail-value">${escapeHtml(pd.platform_contact_name)}</span></div>
                            <div class="detail-item"><span class="detail-label">单位/部门</span><span class="detail-value">${escapeHtml(pd.platform_contact_department) || '-'}</span></div>
                            <div class="detail-item"><span class="detail-label">职务</span><span class="detail-value">${escapeHtml(pd.platform_contact_position) || '-'}</span></div>
                            <div class="detail-item"><span class="detail-label">电话</span><span class="detail-value copyable" onclick="copyToClipboard('${escapeHtml(pd.platform_contact_phone || '')}')">${escapeHtml(pd.platform_contact_phone) || '-'}</span></div>
                            <div class="detail-item"><span class="detail-label">邮箱</span><span class="detail-value copyable" onclick="copyToClipboard('${escapeHtml(pd.platform_contact_email || '')}')">${escapeHtml(pd.platform_contact_email) || '-'}</span></div>
                        </div>
                    </div>
                ` : ''}
            </div>
        `;
    }
    
    if (data.hardware_detail) {
        const hd = data.hardware_detail;
        html += `
            <div class="detail-content-section">
                <div class="detail-content-title">硬件信息</div>
                <div class="detail-grid">
                    <div class="detail-item"><span class="detail-label">资源编号</span><span class="detail-value">${escapeHtml(hd.resource_code) || '-'}</span></div>
                    <div class="detail-item"><span class="detail-label">主机名</span><span class="detail-value">${escapeHtml(hd.server_name) || '-'}</span></div>
                    <div class="detail-item"><span class="detail-label">品牌</span><span class="detail-value">${escapeHtml(hd.brand) || '-'}</span></div>
                    <div class="detail-item"><span class="detail-label">型号</span><span class="detail-value">${escapeHtml(hd.model) || '-'}</span></div>
                    <div class="detail-item"><span class="detail-label">操作系统</span><span class="detail-value">${escapeHtml(hd.operating_system) || '-'}</span></div>
                    <div class="detail-item"><span class="detail-label">CPU</span><span class="detail-value">${escapeHtml(hd.cpu_info) || '-'}</span></div>
                    <div class="detail-item"><span class="detail-label">内存</span><span class="detail-value">${escapeHtml(hd.memory_size) || '-'}</span></div>
                    <div class="detail-item"><span class="detail-label">磁盘容量</span><span class="detail-value">${escapeHtml(hd.disk_capacity) || '-'}</span></div>
                    <div class="detail-item"><span class="detail-label">IP地址</span><span class="detail-value copyable" onclick="copyToClipboard('${escapeHtml(hd.ip_address || '')}')">${escapeHtml(hd.ip_address) || '-'}</span></div>
                    <div class="detail-item"><span class="detail-label">内网IP</span><span class="detail-value copyable" onclick="copyToClipboard('${escapeHtml(hd.private_ip || '')}')">${escapeHtml(hd.private_ip) || '-'}</span></div>
                    <div class="detail-item"><span class="detail-label">公网IP</span><span class="detail-value copyable" onclick="copyToClipboard('${escapeHtml(hd.public_ip || '')}')">${escapeHtml(hd.public_ip) || '-'}</span></div>
                    <div class="detail-item"><span class="detail-label">登录端口</span><span class="detail-value">${hd.login_port || '-'}</span></div>
                    <div class="detail-item"><span class="detail-label">登录协议</span><span class="detail-value">${escapeHtml(hd.login_protocol) || '-'}</span></div>
                    <div class="detail-item"><span class="detail-label">存放位置</span><span class="detail-value">${escapeHtml(hd.location) || '-'}</span></div>
                    <div class="detail-item"><span class="detail-label">启用时间</span><span class="detail-value">${hd.activated_at ? formatDate(hd.activated_at) : '-'}</span></div>
                    <div class="detail-item"><span class="detail-label">云服务器</span><span class="detail-value">${hd.is_cloud ? '是' : '否'}</span></div>
                </div>
            </div>
        `;
    }
    
    if (data.software_detail) {
        const sd = data.software_detail;
        html += `
            <div class="detail-content-section">
                <div class="detail-content-title">软件信息</div>
                <div class="detail-grid">
                    <div class="detail-item"><span class="detail-label">版本</span><span class="detail-value">${escapeHtml(sd.version) || '-'}</span></div>
                    <div class="detail-item"><span class="detail-label">用途</span><span class="detail-value">${escapeHtml(sd.purpose) || '-'}</span></div>
                    <div class="detail-item"><span class="detail-label">部署服务器</span><span class="detail-value">${escapeHtml(sd.deployed_server) || '-'}</span></div>
                    <div class="detail-item"><span class="detail-label">服务器IP</span><span class="detail-value copyable" onclick="copyToClipboard('${escapeHtml(sd.server_ip || '')}')">${escapeHtml(sd.server_ip) || '-'}</span></div>
                    <div class="detail-item"><span class="detail-label">访问地址</span><span class="detail-value copyable" onclick="copyToClipboard('${escapeHtml(sd.access_address || '')}')">${escapeHtml(sd.access_address) || '-'}</span></div>
                    <div class="detail-item"><span class="detail-label">端口</span><span class="detail-value">${sd.login_port || '-'}</span></div>
                    <div class="detail-item"><span class="detail-label">协议</span><span class="detail-value">${escapeHtml(sd.login_protocol) || '-'}</span></div>
                    <div class="detail-item"><span class="detail-label">部署路径</span><span class="detail-value">${escapeHtml(sd.deploy_path) || '-'}</span></div>
                    <div class="detail-item"><span class="detail-label">部署时间</span><span class="detail-value">${sd.deployed_at ? formatDate(sd.deployed_at) : '-'}</span></div>
                    <div class="detail-item"><span class="detail-label">管理后台</span><span class="detail-value copyable" onclick="copyToClipboard('${escapeHtml(sd.admin_url || '')}')">${escapeHtml(sd.admin_url) || '-'}</span></div>
                    <div class="detail-item"><span class="detail-label">需要授权</span><span class="detail-value">${sd.license_required ? '是' : '否'}</span></div>
                </div>
                ${sd.license_required ? `
                    <div class="form-section-sub">
                        <h4 class="form-section-subtitle">授权信息</h4>
                        <div class="detail-grid">
                            <div class="detail-item"><span class="detail-label">授权方式</span><span class="detail-value">${escapeHtml(sd.license_type) || '-'}</span></div>
                            <div class="detail-item"><span class="detail-label">到期时间</span><span class="detail-value">${sd.expires_at ? formatDate(sd.expires_at) : '-'}</span></div>
                            <div class="detail-item"><span class="detail-label">许可证信息</span><span class="detail-value">${escapeHtml(sd.license_info) || '-'}</span></div>
                        </div>
                    </div>
                ` : ''}
            </div>
        `;
    }
    
    if (data.billing_records && data.billing_records.length > 0) {
        data.billing_records.forEach((br, index) => {
            html += `
                <div class="detail-content-section">
                    <div class="detail-content-title">付费记录 ${index + 1}</div>
                    <div class="detail-grid">
                        <div class="detail-item"><span class="detail-label">费用类型</span><span class="detail-value">${escapeHtml(br.fee_type) || '-'}</span></div>
                        <div class="detail-item"><span class="detail-label">续费周期</span><span class="detail-value">${escapeHtml(br.renewal_cycle) || '-'}</span></div>
                        <div class="detail-item"><span class="detail-label">续费金额</span><span class="detail-value">${br.amount} ${br.currency}</span></div>
                        <div class="detail-item"><span class="detail-label">付款人</span><span class="detail-value">${escapeHtml(br.payer_name) || '-'}</span></div>
                        <div class="detail-item"><span class="detail-label">付款状态</span><span class="detail-value">${escapeHtml(br.payment_status)}</span></div>
                        <div class="detail-item"><span class="detail-label">最近续费</span><span class="detail-value">${br.last_renewal_date ? formatDate(br.last_renewal_date) : '-'}</span></div>
                        <div class="detail-item"><span class="detail-label">下次续费</span><span class="detail-value">${br.next_renewal_date ? formatDate(br.next_renewal_date) : '-'}</span></div>
                        <div class="detail-item"><span class="detail-label">合同名称</span><span class="detail-value">${escapeHtml(br.contract_name) || '-'}</span></div>
                        <div class="detail-item"><span class="detail-label">合同编号</span><span class="detail-value">${escapeHtml(br.contract_number) || '-'}</span></div>
                        <div class="detail-item"><span class="detail-label">合同期限</span><span class="detail-value">${br.contract_start_date ? formatDate(br.contract_start_date) : '-'} ~ ${br.contract_end_date ? formatDate(br.contract_end_date) : '-'}</span></div>
                    </div>
                </div>
            `;
        });
    }
    
    if (data.attachments && data.attachments.length > 0) {
        html += `
            <div class="detail-content-section">
                <div class="detail-content-title">附件</div>
                <div class="attachment-list">
                    ${data.attachments.map(att => `
                        <div class="attachment-item">
                            <div class="attachment-info">
                                <span class="attachment-name">${escapeHtml(att.file_name)}</span>
                                <span class="attachment-size">${formatFileSize(att.file_size)}</span>
                            </div>
                            <div class="attachment-actions">
                                <a href="${API_BASE}/attachments/${att.id}" target="_blank" class="attachment-btn">查看</a>
                                <a href="${API_BASE}/attachments/${att.id}" download class="attachment-btn">下载</a>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }
    
    if (data.remark) {
        html += `
            <div class="detail-content-section">
                <div class="detail-content-title">备注</div>
                <div class="detail-value">${escapeHtml(data.remark)}</div>
            </div>
        `;
    }
    
    container.innerHTML = html;
}

async function editResource(id) {
    currentResourceId = id;
    
    try {
        const res = await fetch(`${API_BASE}/resources/${id}`);
        const data = await res.json();
        
        if (data.success) {
            fillForm(data.data);
            document.getElementById('modal-title').textContent = '编辑资源';
            document.getElementById('modal-overlay').classList.add('active');
        }
    } catch (e) {
        console.error('Failed to load resource:', e);
        showStatus('加载失败', 'error');
    }
}

function fillForm(data) {
    document.getElementById('form-id').value = data.id;
    document.getElementById('form-resource-type').value = data.resource_type;
    document.getElementById('form-name').value = data.name || '';
    document.getElementById('form-manager').value = data.manager_name || '';
    document.getElementById('form-username').value = data.username || '';
    document.getElementById('form-remark').value = data.remark || '';
    document.getElementById('form-status').value = data.status || '';
    
    toggleResourceSections(data.resource_type);
    
    if (data.platform_detail) {
        const pd = data.platform_detail;
        document.getElementById('form-category').value = pd.platform_category || '';
        document.getElementById('form-website').value = pd.website_url || '';
        document.getElementById('form-purpose').value = '';
        document.getElementById('form-registrant').value = pd.registrant_name || '';
        document.getElementById('form-contact-name').value = pd.registered_contact_name || '';
        document.getElementById('form-contact-phone').value = pd.registered_contact_phone || '';
        document.getElementById('form-contact-email').value = pd.registered_contact_email || '';
        document.getElementById('form-platform-contact').value = pd.platform_contact_name || '';
        document.getElementById('form-platform-dept').value = pd.platform_contact_department || '';
        document.getElementById('form-platform-position').value = pd.platform_contact_position || '';
        document.getElementById('form-platform-phone').value = pd.platform_contact_phone || '';
        document.getElementById('form-platform-email').value = pd.platform_contact_email || '';
        document.getElementById('form-platform-remark').value = pd.platform_contact_remark || '';
        document.getElementById('form-login-method').value = pd.login_method || '';
        document.getElementById('form-two-factor').checked = pd.is_two_factor_auth;
    }
    
    if (data.hardware_detail) {
        const hd = data.hardware_detail;
        document.getElementById('form-category').value = hd.hardware_type || '';
        document.getElementById('form-resource-code').value = hd.resource_code || '';
        document.getElementById('form-server-name').value = hd.server_name || '';
        document.getElementById('form-brand').value = hd.brand || '';
        document.getElementById('form-model').value = hd.model || '';
        document.getElementById('form-os').value = hd.operating_system || '';
        document.getElementById('form-cpu').value = hd.cpu_info || '';
        document.getElementById('form-memory').value = hd.memory_size || '';
        document.getElementById('form-disk').value = hd.disk_capacity || '';
        document.getElementById('form-ip').value = hd.ip_address || '';
        document.getElementById('form-private-ip').value = hd.private_ip || '';
        document.getElementById('form-public-ip').value = hd.public_ip || '';
        document.getElementById('form-port').value = hd.login_port || '';
        document.getElementById('form-protocol').value = hd.login_protocol || '';
        document.getElementById('form-location').value = hd.location || '';
        document.getElementById('form-activated-at').value = hd.activated_at ? formatDateInput(hd.activated_at) : '';
        document.getElementById('form-is-cloud').checked = hd.is_cloud;
    }
    
    if (data.software_detail) {
        const sd = data.software_detail;
        document.getElementById('form-category').value = sd.software_type || '';
        document.getElementById('form-version').value = sd.version || '';
        document.getElementById('form-software-purpose').value = sd.purpose || '';
        document.getElementById('form-deployed-server').value = sd.deployed_server || '';
        document.getElementById('form-server-ip').value = sd.server_ip || '';
        document.getElementById('form-access-address').value = sd.access_address || '';
        document.getElementById('form-software-port').value = sd.login_port || '';
        document.getElementById('form-software-protocol').value = sd.login_protocol || '';
        document.getElementById('form-deploy-path').value = sd.deploy_path || '';
        document.getElementById('form-deployed-at').value = sd.deployed_at ? formatDateInput(sd.deployed_at) : '';
        document.getElementById('form-admin-url').value = sd.admin_url || '';
        document.getElementById('form-license-required').checked = sd.license_required;
        document.getElementById('form-license-type').value = sd.license_type || '';
        document.getElementById('form-expires-at').value = sd.expires_at ? formatDateInput(sd.expires_at) : '';
        document.getElementById('form-license-info').value = sd.license_info || '';
        document.getElementById('form-login-note').value = sd.login_note || '';
    }
}

function clearForm() {
    document.getElementById('form-id').value = '';
    document.getElementById('form-resource-type').value = 'platform';
    document.getElementById('form-name').value = '';
    document.getElementById('form-manager').value = '';
    document.getElementById('form-username').value = '';
    document.getElementById('form-password').value = '';
    document.getElementById('form-remark').value = '';
    
    document.getElementById('form-category').selectedIndex = 0;
    document.getElementById('form-status').selectedIndex = 0;
    
    toggleResourceSections('platform');
    
    document.getElementById('form-website').value = '';
    document.getElementById('form-purpose').value = '';
    document.getElementById('form-registrant').value = '';
    document.getElementById('form-contact-name').value = '';
    document.getElementById('form-contact-phone').value = '';
    document.getElementById('form-contact-email').value = '';
    document.getElementById('form-platform-contact').value = '';
    document.getElementById('form-platform-dept').value = '';
    document.getElementById('form-platform-position').value = '';
    document.getElementById('form-platform-phone').value = '';
    document.getElementById('form-platform-email').value = '';
    document.getElementById('form-platform-remark').value = '';
    document.getElementById('form-login-method').value = '';
    document.getElementById('form-two-factor').checked = false;
    
    document.getElementById('form-resource-code').value = '';
    document.getElementById('form-server-name').value = '';
    document.getElementById('form-brand').value = '';
    document.getElementById('form-model').value = '';
    document.getElementById('form-os').value = '';
    document.getElementById('form-cpu').value = '';
    document.getElementById('form-memory').value = '';
    document.getElementById('form-disk').value = '';
    document.getElementById('form-ip').value = '';
    document.getElementById('form-private-ip').value = '';
    document.getElementById('form-public-ip').value = '';
    document.getElementById('form-port').value = '';
    document.getElementById('form-protocol').value = '';
    document.getElementById('form-location').value = '';
    document.getElementById('form-activated-at').value = '';
    document.getElementById('form-is-cloud').checked = false;
    
    document.getElementById('form-version').value = '';
    document.getElementById('form-software-purpose').value = '';
    document.getElementById('form-deployed-server').value = '';
    document.getElementById('form-server-ip').value = '';
    document.getElementById('form-access-address').value = '';
    document.getElementById('form-software-port').value = '';
    document.getElementById('form-software-protocol').value = '';
    document.getElementById('form-deploy-path').value = '';
    document.getElementById('form-deployed-at').value = '';
    document.getElementById('form-admin-url').value = '';
    document.getElementById('form-license-required').checked = false;
    document.getElementById('form-license-type').value = '';
    document.getElementById('form-expires-at').value = '';
    document.getElementById('form-license-info').value = '';
    document.getElementById('form-login-note').value = '';
}

async function saveResource() {
    const id = document.getElementById('form-id').value;
    const resourceType = document.getElementById('form-resource-type').value;
    
    const data = {
        resource_type: resourceType,
        name: document.getElementById('form-name').value,
        category: document.getElementById('form-category').value,
        username: document.getElementById('form-username').value,
        password: document.getElementById('form-password').value,
        manager_name: document.getElementById('form-manager').value,
        status: document.getElementById('form-status').value,
        remark: document.getElementById('form-remark').value
    };
    
    if (resourceType === 'platform') {
        data.platform_category = document.getElementById('form-category').value;
        data.website_url = document.getElementById('form-website').value;
        data.registrant_name = document.getElementById('form-registrant').value;
        data.registered_contact_name = document.getElementById('form-contact-name').value;
        data.registered_contact_phone = document.getElementById('form-contact-phone').value;
        data.registered_contact_email = document.getElementById('form-contact-email').value;
        data.platform_contact_name = document.getElementById('form-platform-contact').value;
        data.platform_contact_department = document.getElementById('form-platform-dept').value;
        data.platform_contact_position = document.getElementById('form-platform-position').value;
        data.platform_contact_phone = document.getElementById('form-platform-phone').value;
        data.platform_contact_email = document.getElementById('form-platform-email').value;
        data.platform_contact_remark = document.getElementById('form-platform-remark').value;
        data.login_method = document.getElementById('form-login-method').value;
        data.is_two_factor_auth = document.getElementById('form-two-factor').checked;
    } else if (resourceType === 'hardware') {
        data.hardware_type = document.getElementById('form-category').value;
        data.resource_code = document.getElementById('form-resource-code').value;
        data.server_name = document.getElementById('form-server-name').value;
        data.brand = document.getElementById('form-brand').value;
        data.model = document.getElementById('form-model').value;
        data.operating_system = document.getElementById('form-os').value;
        data.cpu_info = document.getElementById('form-cpu').value;
        data.memory_size = document.getElementById('form-memory').value;
        data.disk_capacity = document.getElementById('form-disk').value;
        data.ip_address = document.getElementById('form-ip').value;
        data.private_ip = document.getElementById('form-private-ip').value;
        data.public_ip = document.getElementById('form-public-ip').value;
        data.login_port = document.getElementById('form-port').value;
        data.login_protocol = document.getElementById('form-protocol').value;
        data.location = document.getElementById('form-location').value;
        data.activated_at = document.getElementById('form-activated-at').value;
        data.is_cloud = document.getElementById('form-is-cloud').checked;
    } else if (resourceType === 'software') {
        data.software_type = document.getElementById('form-category').value;
        data.version = document.getElementById('form-version').value;
        data.purpose = document.getElementById('form-software-purpose').value;
        data.deployed_server = document.getElementById('form-deployed-server').value;
        data.server_ip = document.getElementById('form-server-ip').value;
        data.access_address = document.getElementById('form-access-address').value;
        data.login_port = document.getElementById('form-software-port').value;
        data.login_protocol = document.getElementById('form-software-protocol').value;
        data.deploy_path = document.getElementById('form-deploy-path').value;
        data.deployed_at = document.getElementById('form-deployed-at').value;
        data.admin_url = document.getElementById('form-admin-url').value;
        data.license_required = document.getElementById('form-license-required').checked;
        data.license_type = document.getElementById('form-license-type').value;
        data.expires_at = document.getElementById('form-expires-at').value;
        data.license_info = document.getElementById('form-license-info').value;
        data.login_note = document.getElementById('form-login-note').value;
    }
    
    try {
        let url = `${API_BASE}/resources`;
        let method = 'POST';
        
        if (id) {
            url = `${API_BASE}/resources/${id}`;
            method = 'PUT';
        }
        
        const res = await fetch(url, {
            method: method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        
        const result = await res.json();
        
        if (result.success) {
            showStatus(id ? '更新成功' : '创建成功');
            document.getElementById('modal-overlay').classList.remove('active');
            loadResources();
            loadStats();
        } else {
            showStatus(result.error || '操作失败', 'error');
        }
    } catch (e) {
        console.error('Failed to save resource:', e);
        showStatus('保存失败', 'error');
    }
}

async function deleteResource(id, name) {
    if (!confirm(`确定要删除资源「${name}」吗？`)) return;
    
    try {
        const res = await fetch(`${API_BASE}/resources/${id}`, { method: 'DELETE' });
        const data = await res.json();
        
        if (data.success) {
            showStatus('删除成功');
            loadResources();
            loadStats();
        } else {
            showStatus(data.error || '删除失败', 'error');
        }
    } catch (e) {
        console.error('Failed to delete resource:', e);
        showStatus('删除失败', 'error');
    }
}

function copyToClipboard(text) {
    if (!text) return;
    navigator.clipboard.writeText(text).then(() => {
        showStatus('已复制到剪贴板');
    });
}

function togglePassword(fieldId) {
    const field = document.getElementById(fieldId);
    const type = field.type === 'password' ? 'text' : 'password';
    field.type = type;
    event.target.textContent = type === 'password' ? '显示' : '隐藏';
}

function formatDate(dateStr) {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function formatDateInput(dateStr) {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function formatDateTime(dateStr) {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}

function formatFileSize(bytes) {
    if (!bytes) return '-';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function initDate() {
    const now = new Date();
    const dateStr = `${now.getFullYear()}年${now.getMonth() + 1}月${now.getDate()}日`;
    document.getElementById('current-date').textContent = dateStr;
}

document.addEventListener('DOMContentLoaded', () => {
    initDate();
    initOptions();
    loadResources();
    loadStats();
    
    document.getElementById('search-input').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') loadResources();
    });
    
    document.getElementById('search-btn').addEventListener('click', loadResources);
    
    document.getElementById('resource-type-filter').addEventListener('change', () => {
        currentPage = 1;
        loadResources();
    });
    
    document.getElementById('status-filter').addEventListener('change', () => {
        currentPage = 1;
        loadResources();
    });
    
    document.getElementById('renewal-filter').addEventListener('change', () => {
        currentPage = 1;
        loadResources();
    });
    
    document.getElementById('paid-filter').addEventListener('change', () => {
        currentPage = 1;
        loadResources();
    });
    
    document.getElementById('prev-page').addEventListener('click', () => {
        if (currentPage > 1) {
            currentPage--;
            loadResources();
        }
    });
    
    document.getElementById('next-page').addEventListener('click', () => {
        if (currentPage < totalPages) {
            currentPage++;
            loadResources();
        }
    });
    
    document.getElementById('add-btn').addEventListener('click', () => {
        clearForm();
        document.getElementById('modal-title').textContent = '新增资源';
        document.getElementById('modal-overlay').classList.add('active');
    });
    
    document.getElementById('modal-close').addEventListener('click', () => {
        document.getElementById('modal-overlay').classList.remove('active');
    });
    
    document.getElementById('detail-close').addEventListener('click', () => {
        document.getElementById('detail-modal').classList.remove('active');
    });
    
    document.getElementById('cancel-btn').addEventListener('click', () => {
        document.getElementById('modal-overlay').classList.remove('active');
    });
    
    document.getElementById('save-btn').addEventListener('click', saveResource);
    
    document.getElementById('form-resource-type').addEventListener('change', (e) => {
        toggleResourceSections(e.target.value);
    });
    
    document.getElementById('detail-edit-btn').addEventListener('click', () => {
        document.getElementById('detail-modal').classList.remove('active');
        editResource(currentResourceId);
    });
    
    document.getElementById('detail-delete-btn').addEventListener('click', () => {
        document.getElementById('detail-modal').classList.remove('active');
        deleteResource(currentResourceId, document.getElementById('detail-title').textContent.replace('资源详情 - ', ''));
    });
    
    document.getElementById('modal-overlay').addEventListener('click', (e) => {
        if (e.target === document.getElementById('modal-overlay')) {
            document.getElementById('modal-overlay').classList.remove('active');
        }
    });
    
    document.getElementById('detail-modal').addEventListener('click', (e) => {
        if (e.target === document.getElementById('detail-modal')) {
            document.getElementById('detail-modal').classList.remove('active');
        }
    });
});