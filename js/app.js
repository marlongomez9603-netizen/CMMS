/* ============================================
   MaintPro CMMS v2.0 - Main Application
   Login flow, navigation, all views including
   Calendar and Asset History
   ============================================ */
class App {
    constructor() {
        this.currentView = 'dashboard';
        this.charts = {};
        this.calendarDate = new Date();
        this.viewingAssetId = null;
        this.init();
    }

    init() {
        // Check session
        if (auth.isLoggedIn()) {
            const cedula = auth.getCurrentCedula();
            if (cedula) {
                initStore(cedula);
                this.showApp();
            } else if (auth.isAdmin()) {
                this.showApp(); // Admin without student selected
            }
        } else {
            this.showLogin();
        }
    }

    // ========== LOGIN ==========
    showLogin() {
        document.getElementById('loginScreen').style.display = 'flex';
        document.getElementById('appContainer').style.display = 'none';
        const form = document.getElementById('loginForm');
        const errorEl = document.getElementById('loginError');
        errorEl.style.display = 'none';

        form.onsubmit = (e) => {
            e.preventDefault();
            const identifier = document.getElementById('loginIdentifier').value.trim();
            const password = document.getElementById('loginPassword').value.trim();

            // Attempt login
            const result = auth.login(identifier, password);
            if (result.success) {
                errorEl.style.display = 'none';
                if (result.type === 'admin') {
                    this.showApp();
                } else {
                    initStore(result.student.cedula);
                    this.showApp();
                }
            } else {
                errorEl.textContent = result.message;
                errorEl.style.display = 'block';
                document.getElementById('loginIdentifier').classList.add('input-error');
                setTimeout(() => document.getElementById('loginIdentifier').classList.remove('input-error'), 1500);
            }
        };
    }

    showApp() {
        document.getElementById('loginScreen').style.display = 'none';
        document.getElementById('appContainer').style.display = 'flex';
        this.setupSidebar();
        this.bindNav();

        if (auth.isAdmin() && !auth.getCurrentCedula()) {
            this.showAdminStudentPicker();
        } else {
            this.navigate('dashboard');
        }
    }

    setupSidebar() {
        // User info in sidebar
        const userInfo = document.getElementById('userInfo');
        const adminSelector = document.getElementById('adminStudentSelector');

        if (auth.isAdmin()) {
            userInfo.innerHTML = `
                <div class="user-avatar admin"><i class="fas fa-user-shield"></i></div>
                <div>
                    <div class="user-name">Administrador</div>
                    <div class="user-role">Modo Docente</div>
                </div>`;
            adminSelector.style.display = 'block';
            // Populate student dropdown
            const sel = document.getElementById('adminStudentSelect');
            sel.innerHTML = '<option value="">— Seleccionar Estudiante —</option>' +
                STUDENTS.map(s => `<option value="${s.cedula}" ${auth.getCurrentCedula() === s.cedula ? 'selected' : ''}>${s.nombre}</option>`).join('');
            sel.onchange = () => {
                if (sel.value) {
                    auth.adminViewStudent(sel.value);
                    initStore(sel.value);
                    this.navigate('dashboard');
                }
            };
        } else {
            const session = auth.getSession();
            const student = getStudentByCedula(session.cedula);
            const nombre = student ? student.nombre.split(',').reverse().join(' ').trim() : session.nombre;
            const sector = getStudentSector(session.cedula);
            userInfo.innerHTML = `
                <div class="user-avatar student">${nombre.split(' ').map(n => n[0]).slice(0, 2).join('')}</div>
                <div>
                    <div class="user-name">${nombre}</div>
                    <div class="user-role">${sector.name}</div>
                </div>`;
            adminSelector.style.display = 'none';
        }

        // Logout button
        document.getElementById('btnLogout').onclick = () => {
            auth.logout();
            store = null;
            this.showLogin();
        };
    }

    showAdminStudentPicker() {
        // Show a centered prompt to pick a student
        const content = document.getElementById('content');
        document.querySelectorAll('.view-section').forEach(s => s.classList.remove('active'));
        const el = document.getElementById('view-dashboard');
        el.classList.add('active');
        el.innerHTML = `
        <div class="admin-picker-wrapper">
            <div class="admin-picker-card">
                <div class="admin-picker-icon"><i class="fas fa-user-shield"></i></div>
                <h2>Modo Administrador</h2>
                <p>Seleccione un estudiante para visualizar su gestión de mantenimiento.</p>
                <div class="admin-student-grid">
                    ${STUDENTS.map(s => {
                        const preview = getStudentAssetPreview(s.cedula);
                        return `<div class="admin-student-card" data-cedula="${s.cedula}">
                            <div class="admin-student-avatar">${s.nombre.split(' ').map(n => n[0]).slice(0, 2).join('')}</div>
                            <div class="admin-student-name">${s.nombre.split(',').reverse().join(' ').trim()}</div>
                            <div class="admin-student-sector"><i class="fas fa-industry"></i> ${preview.company} · ${preview.sector}</div>
                            <div class="admin-student-assets">
                                ${preview.assets.map(a => `<div class="admin-asset-tag"><i class="fas fa-cog"></i> ${a}</div>`).join('')}
                            </div>
                        </div>`;
                    }).join('')}
                </div>
            </div>
        </div>`;
        el.querySelectorAll('.admin-student-card').forEach(card => {
            card.addEventListener('click', () => {
                const cedula = card.dataset.cedula;
                auth.adminViewStudent(cedula);
                initStore(cedula);
                document.getElementById('adminStudentSelect').value = cedula;
                this.navigate('dashboard');
            });
        });
    }

    // ---- Navigation ----
    bindNav() {
        document.querySelectorAll('.nav-item[data-view]').forEach(item => {
            item.addEventListener('click', () => this.navigate(item.dataset.view));
        });
    }

    navigate(view) {
        // Close mobile sidebar on navigate
        document.getElementById('sidebar').classList.remove('open');

        if (!store) {
            if (auth.isAdmin()) {
                this.showAdminStudentPicker();
                return;
            }
            return;
        }

        this.currentView = view;
        document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
        const activeNav = document.querySelector(`.nav-item[data-view="${view}"]`);
        if (activeNav) activeNav.classList.add('active');

        document.querySelectorAll('.view-section').forEach(s => s.classList.remove('active'));
        const section = document.getElementById(`view-${view}`);
        if (section) { section.classList.add('active'); section.innerHTML = ''; }

        const titles = {
            dashboard: 'Dashboard', assets: 'Activos / Equipos', workorders: 'Órdenes de Trabajo',
            preventive: 'Mantenimiento Preventivo', inventory: 'Inventario de Repuestos',
            personnel: 'Personal Técnico', reports: 'Reportes y KPIs',
            calendar: 'Calendario de Mantenimiento', assetDetail: 'Historial del Equipo'
        };
        const topTitle = document.getElementById('topbarTitle');
        if (topTitle) topTitle.textContent = titles[view] || '';

        // Company name in topbar
        const companyLabel = document.getElementById('topbarCompany');
        if (companyLabel && store) {
            const c = store.getCurrentCompany();
            companyLabel.textContent = c ? c.name : '';
        }

        const render = {
            dashboard: () => this.renderDashboard(), assets: () => this.renderAssets(),
            workorders: () => this.renderWorkOrders(), preventive: () => this.renderPreventive(),
            inventory: () => this.renderInventory(), personnel: () => this.renderPersonnel(),
            reports: () => this.renderReports(), calendar: () => this.renderCalendar(),
            assetDetail: () => this.renderAssetDetail()
        };
        if (render[view]) render[view]();
        this.updateBadges();
    }

    updateBadges() {
        if (!store) return;
        const k = store.getKPIs();
        const b = document.getElementById('badgePendingWOs');
        if (b) { b.textContent = k.pendingWOs; b.style.display = k.pendingWOs > 0 ? '' : 'none'; }
        const b2 = document.getElementById('badgeOverduePMs');
        if (b2) { b2.textContent = k.overduePMs; b2.style.display = k.overduePMs > 0 ? '' : 'none'; }
        const b3 = document.getElementById('badgeLowStock');
        if (b3) { b3.textContent = k.lowStockCount; b3.style.display = k.lowStockCount > 0 ? '' : 'none'; }
    }

    toast(msg, type = 'success') {
        const c = document.getElementById('toastContainer');
        const t = document.createElement('div');
        t.className = `toast toast-${type}`;
        const icons = { success: 'fa-check-circle', danger: 'fa-exclamation-circle', warning: 'fa-exclamation-triangle', info: 'fa-info-circle' };
        t.innerHTML = `<i class="fas ${icons[type] || icons.info}"></i><span>${msg}</span>`;
        c.appendChild(t);
        setTimeout(() => { t.style.opacity = '0'; setTimeout(() => t.remove(), 300); }, 3500);
    }

    // ---- Helpers ----
    getAssetName(id) { const a = store.getAsset(id); return a ? a.name : 'N/A'; }
    getPersonName(id) { const p = store.getPersonnelById(id); return p ? p.name : 'Sin asignar'; }
    fmtDate(d) { if (!d) return '—'; try { return new Date(d + 'T12:00:00').toLocaleDateString('es-CO'); } catch { return d; } }
    fmtMoney(v) { return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(v || 0); }

    statusBadge(s) {
        const m = { operativo: ['success', 'Operativo'], en_mantenimiento: ['warning', 'En Mtto'], fuera_de_servicio: ['danger', 'Fuera de Servicio'], pendiente: ['warning', 'Pendiente'], en_progreso: ['info', 'En Progreso'], completada: ['success', 'Completada'], cancelada: ['muted', 'Cancelada'], activo: ['success', 'Activo'], inactivo: ['muted', 'Inactivo'] };
        const [cls, label] = m[s] || ['muted', s];
        return `<span class="badge badge-${cls} badge-dot">${label}</span>`;
    }

    priorityBadge(p) {
        const m = { critica: ['critical', 'Crítica'], alta: ['high', 'Alta'], media: ['medium', 'Media'], baja: ['low', 'Baja'] };
        const [cls, label] = m[p] || ['medium', p];
        return `<span class="badge priority-${cls}">${label}</span>`;
    }

    criticalityHTML(c) {
        const cls = c === 'alta' ? 'alta' : c === 'media' ? 'media' : 'baja';
        return `<span class="criticality criticality-${cls}"><span class="criticality-dot"></span>${c.charAt(0).toUpperCase() + c.slice(1)}</span>`;
    }

    // ---- Modal ----
    showModal(title, bodyHTML, onSave) {
        const ov = document.getElementById('modalOverlay');
        document.getElementById('modalTitle').textContent = title;
        document.getElementById('modalBody').innerHTML = bodyHTML;
        const saveBtn = document.getElementById('modalSave');
        const newBtn = saveBtn.cloneNode(true);
        saveBtn.parentNode.replaceChild(newBtn, saveBtn);
        newBtn.id = 'modalSave';
        newBtn.addEventListener('click', () => { if (onSave) onSave(); });
        ov.classList.add('active');
        document.getElementById('modalClose').onclick = () => ov.classList.remove('active');
        document.getElementById('modalCancel').onclick = () => ov.classList.remove('active');
        ov.addEventListener('click', e => { if (e.target === ov) ov.classList.remove('active'); });
    }

    closeModal() { document.getElementById('modalOverlay').classList.remove('active'); }

    confirmAction(msg, onConfirm) {
        this.showModal('Confirmar Acción', `<div class="confirm-message"><i class="fas fa-exclamation-triangle"></i><h3>¿Estás seguro?</h3><p>${msg}</p></div>`, () => { onConfirm(); this.closeModal(); });
    }

    // ========== DASHBOARD ==========
    renderDashboard() {
        const el = document.getElementById('view-dashboard');
        const k = store.getKPIs();
        const logs = store.getRecentLogs(8);
        const plans = store.getPreventivePlans();
        const today = store.today();
        const overduePlans = plans.filter(p => p.nextExecution && p.nextExecution < today && p.status === 'activo');
        const upcomingPlans = plans.filter(p => p.nextExecution && p.nextExecution >= today && p.status === 'activo').sort((a, b) => a.nextExecution.localeCompare(b.nextExecution)).slice(0, 5);

        el.innerHTML = `
      ${k.overduePMs > 0 ? `<div class="alert-bar alert-danger"><i class="fas fa-exclamation-circle"></i><strong>${k.overduePMs} plan(es) preventivo(s) vencido(s)</strong> — Requieren atención inmediata</div>` : ''}
      ${k.lowStockCount > 0 ? `<div class="alert-bar alert-warning"><i class="fas fa-boxes-stacked"></i><strong>${k.lowStockCount} ítem(s) con stock bajo</strong> — Revisar inventario</div>` : ''}
      <div class="kpi-grid">
        <div class="kpi-card kpi-primary"><div class="kpi-icon"><i class="fas fa-cogs"></i></div><div class="kpi-content"><div class="kpi-label">Total Activos</div><div class="kpi-value">${k.totalAssets}</div><div class="kpi-trend up"><i class="fas fa-circle-check"></i> ${k.activeAssets} operativos</div></div></div>
        <div class="kpi-card kpi-warning"><div class="kpi-icon"><i class="fas fa-clipboard-list"></i></div><div class="kpi-content"><div class="kpi-label">OT Pendientes</div><div class="kpi-value">${k.pendingWOs}</div><div class="kpi-trend"><i class="fas fa-spinner"></i> ${k.inProgressWOs} en progreso</div></div></div>
        <div class="kpi-card kpi-success"><div class="kpi-icon"><i class="fas fa-clock"></i></div><div class="kpi-content"><div class="kpi-label">MTTR (horas)</div><div class="kpi-value">${k.mttr}</div><div class="kpi-trend">Tiempo medio de reparación</div></div></div>
        <div class="kpi-card kpi-info"><div class="kpi-icon"><i class="fas fa-calendar-days"></i></div><div class="kpi-content"><div class="kpi-label">MTBF (días)</div><div class="kpi-value">${k.mtbf}</div><div class="kpi-trend">Tiempo medio entre fallas</div></div></div>
        <div class="kpi-card kpi-primary"><div class="kpi-icon"><i class="fas fa-gauge-high"></i></div><div class="kpi-content"><div class="kpi-label">Disponibilidad</div><div class="kpi-value">${k.availability}%</div><div class="progress-bar" style="margin-top:8px"><div class="progress-fill ${k.availability >= 90 ? 'fill-success' : k.availability >= 75 ? 'fill-warning' : 'fill-danger'}" style="width:${k.availability}%"></div></div></div></div>
        <div class="kpi-card kpi-danger"><div class="kpi-icon"><i class="fas fa-triangle-exclamation"></i></div><div class="kpi-content"><div class="kpi-label">PM Vencidos</div><div class="kpi-value">${k.overduePMs}</div><div class="kpi-trend">${k.activePlans} planes activos</div></div></div>
      </div>
      <div class="dashboard-charts">
        <div class="chart-card"><div class="card-title">Órdenes por Tipo</div><div class="chart-wrapper"><canvas id="chartWOType"></canvas></div></div>
        <div class="chart-card"><div class="card-title">Órdenes por Prioridad</div><div class="chart-wrapper"><canvas id="chartWOPriority"></canvas></div></div>
      </div>
      <div class="grid-2">
        <div class="card"><div class="card-header"><div class="card-title"><i class="fas fa-clock-rotate-left"></i> Actividad Reciente</div></div>
          <ul class="recent-list">${logs.length === 0 ? '<li class="recent-item"><span class="recent-meta">Sin actividad reciente — ¡Crea tu primera OT!</span></li>' : logs.map(l => {
            const icons = { wo_created: ['fa-plus', 'info'], wo_started: ['fa-play', 'warning'], wo_completed: ['fa-check', 'success'], system: ['fa-gear', 'primary'], asset_created: ['fa-cog', 'primary'] };
            const [ico, cls] = icons[l.action] || ['fa-circle', 'primary'];
            return `<li class="recent-item"><div class="recent-icon" style="background:var(--${cls}-bg);color:var(--${cls})"><i class="fas ${ico}"></i></div><div class="recent-info"><div class="recent-title">${l.message}</div><div class="recent-meta">${l.user || 'Sistema'} · ${new Date(l.timestamp).toLocaleString('es-CO')}</div></div></li>`;
        }).join('')}</ul>
        </div>
        <div class="card"><div class="card-header"><div class="card-title"><i class="fas fa-calendar-check"></i> Próximos Mantenimientos</div></div>
          <ul class="recent-list">${[...overduePlans.map(p => `<li class="recent-item"><div class="recent-icon" style="background:var(--danger-bg);color:var(--danger)"><i class="fas fa-exclamation"></i></div><div class="recent-info"><div class="recent-title">${p.name}</div><div class="recent-meta" style="color:var(--danger)">VENCIDO: ${this.fmtDate(p.nextExecution)} · ${this.getAssetName(p.assetId)}</div></div></li>`), ...upcomingPlans.map(p => `<li class="recent-item"><div class="recent-icon" style="background:var(--primary-glow);color:var(--primary)"><i class="fas fa-wrench"></i></div><div class="recent-info"><div class="recent-title">${p.name}</div><div class="recent-meta">${this.fmtDate(p.nextExecution)} · ${this.getAssetName(p.assetId)}</div></div></li>`)].join('') || '<li class="recent-item"><span class="recent-meta">Sin mantenimientos programados</span></li>'}</ul>
        </div>
      </div>`;

        this.renderChart('chartWOType', 'doughnut', {
            labels: ['Correctivo', 'Preventivo', 'Predictivo', 'Mejora'],
            datasets: [{ data: [k.woByType.correctivo, k.woByType.preventivo, k.woByType.predictivo, k.woByType.mejora], backgroundColor: ['#ff5252', '#00e676', '#448aff', '#ffab40'], borderWidth: 0 }]
        });
        this.renderChart('chartWOPriority', 'bar', {
            labels: ['Crítica', 'Alta', 'Media', 'Baja'],
            datasets: [{ label: 'Cantidad', data: [k.woByPriority.critica, k.woByPriority.alta, k.woByPriority.media, k.woByPriority.baja], backgroundColor: ['#ff1744', '#ff5252', '#ffab40', '#448aff'], borderRadius: 6, borderSkipped: false }]
        }, { indexAxis: 'y' });
    }

    renderChart(canvasId, type, data, extra = {}) {
        const ctx = document.getElementById(canvasId);
        if (!ctx) return;
        if (this.charts[canvasId]) this.charts[canvasId].destroy();
        const defaults = { responsive: true, maintainAspectRatio: false, plugins: { legend: { labels: { color: '#9ea7c0', font: { family: 'Inter' } } } }, scales: {} };
        if (type === 'bar') {
            defaults.scales = { x: { ticks: { color: '#6b7490' }, grid: { color: 'rgba(255,255,255,0.04)' } }, y: { ticks: { color: '#6b7490' }, grid: { color: 'rgba(255,255,255,0.04)' } } };
        }
        this.charts[canvasId] = new Chart(ctx, { type, data, options: { ...defaults, ...extra } });
    }

    // ========== ASSETS ==========
    renderAssets() {
        const el = document.getElementById('view-assets');
        const assets = store.getAssets();
        el.innerHTML = `
      <div class="toolbar"><div class="toolbar-left"><div class="search-input"><i class="fas fa-search"></i><input type="text" id="assetSearch" placeholder="Buscar activos..."></div>
        <select class="filter-select" id="assetStatusFilter"><option value="">Todos los estados</option><option value="operativo">Operativo</option><option value="en_mantenimiento">En Mantenimiento</option><option value="fuera_de_servicio">Fuera de Servicio</option></select></div>
        <div class="toolbar-right"><button class="btn btn-primary" id="btnAddAsset"><i class="fas fa-plus"></i> Nuevo Activo</button></div></div>
      <div class="table-container"><table class="data-table"><thead><tr><th>Código</th><th>Nombre</th><th>Categoría</th><th>Ubicación</th><th>Criticidad</th><th>Estado</th><th>Acciones</th></tr></thead>
        <tbody id="assetsTableBody">${this.renderAssetsRows(assets)}</tbody></table></div>`;

        document.getElementById('btnAddAsset').addEventListener('click', () => this.showAssetForm());
        document.getElementById('assetSearch').addEventListener('input', () => this.filterAssets());
        document.getElementById('assetStatusFilter').addEventListener('change', () => this.filterAssets());
        this.bindAssetActions();
    }

    renderAssetsRows(assets) {
        if (assets.length === 0) return '<tr><td colspan="7"><div class="empty-state"><i class="fas fa-cogs"></i><h3>Sin activos registrados</h3></div></td></tr>';
        return assets.map(a => `<tr>
      <td><strong>${a.code}</strong></td><td>${a.name}</td><td>${a.category}</td><td>${a.location}</td>
      <td>${this.criticalityHTML(a.criticality)}</td><td>${this.statusBadge(a.status)}</td>
      <td><div class="action-btns"><button class="btn btn-icon btn-sm" data-viewasset="${a.id}" data-tooltip="Ver historial"><i class="fas fa-eye"></i></button><button class="btn btn-icon btn-sm" data-edit="${a.id}" data-tooltip="Editar"><i class="fas fa-pen"></i></button><button class="btn btn-icon btn-sm" data-del="${a.id}" data-tooltip="Eliminar"><i class="fas fa-trash"></i></button></div></td></tr>`).join('');
    }

    filterAssets() {
        const q = (document.getElementById('assetSearch')?.value || '').toLowerCase();
        const st = document.getElementById('assetStatusFilter')?.value || '';
        let assets = store.getAssets();
        if (q) assets = assets.filter(a => (a.name + a.code + a.category + a.location).toLowerCase().includes(q));
        if (st) assets = assets.filter(a => a.status === st);
        document.getElementById('assetsTableBody').innerHTML = this.renderAssetsRows(assets);
        this.bindAssetActions();
    }

    bindAssetActions() {
        document.querySelectorAll('[data-viewasset]').forEach(b => b.addEventListener('click', () => {
            this.viewingAssetId = b.dataset.viewasset;
            this.navigate('assetDetail');
        }));
        document.querySelectorAll('[data-edit]').forEach(b => b.addEventListener('click', () => this.showAssetForm(b.dataset.edit)));
        document.querySelectorAll('[data-del]').forEach(b => b.addEventListener('click', () => {
            this.confirmAction('Este activo será eliminado permanentemente.', () => { store.deleteAsset(b.dataset.del); this.renderAssets(); this.toast('Activo eliminado', 'danger'); });
        }));
    }

    showAssetForm(editId) {
        const a = editId ? store.getAsset(editId) : {};
        const title = editId ? 'Editar Activo' : 'Nuevo Activo';
        const html = `
      <div class="form-row"><div class="form-group"><label class="form-label">Nombre <span class="required">*</span></label><input class="form-control" id="fName" value="${a.name || ''}"></div>
        <div class="form-group"><label class="form-label">Código <span class="required">*</span></label><input class="form-control" id="fCode" value="${a.code || ''}"></div></div>
      <div class="form-row"><div class="form-group"><label class="form-label">Categoría</label><input class="form-control" id="fCategory" value="${a.category || ''}"></div>
        <div class="form-group"><label class="form-label">Ubicación</label><input class="form-control" id="fLocation" value="${a.location || ''}"></div></div>
      <div class="form-row"><div class="form-group"><label class="form-label">Marca</label><input class="form-control" id="fBrand" value="${a.brand || ''}"></div>
        <div class="form-group"><label class="form-label">Modelo</label><input class="form-control" id="fModel" value="${a.model || ''}"></div></div>
      <div class="form-row"><div class="form-group"><label class="form-label">Serial</label><input class="form-control" id="fSerial" value="${a.serial || ''}"></div>
        <div class="form-group"><label class="form-label">Fecha Instalación</label><input class="form-control" type="date" id="fInstallDate" value="${a.installDate || ''}"></div></div>
      <div class="form-row"><div class="form-group"><label class="form-label">Estado</label><select class="form-control" id="fStatus"><option value="operativo" ${a.status === 'operativo' ? 'selected' : ''}>Operativo</option><option value="en_mantenimiento" ${a.status === 'en_mantenimiento' ? 'selected' : ''}>En Mantenimiento</option><option value="fuera_de_servicio" ${a.status === 'fuera_de_servicio' ? 'selected' : ''}>Fuera de Servicio</option></select></div>
        <div class="form-group"><label class="form-label">Criticidad</label><select class="form-control" id="fCriticality"><option value="alta" ${a.criticality === 'alta' ? 'selected' : ''}>Alta</option><option value="media" ${a.criticality === 'media' ? 'selected' : ''}>Media</option><option value="baja" ${a.criticality === 'baja' ? 'selected' : ''}>Baja</option></select></div></div>
      <div class="form-group"><label class="form-label">Especificaciones Técnicas</label><textarea class="form-control" id="fSpecs">${a.specs || ''}</textarea></div>`;

        this.showModal(title, html, () => {
            const data = { name: document.getElementById('fName').value, code: document.getElementById('fCode').value, category: document.getElementById('fCategory').value, location: document.getElementById('fLocation').value, brand: document.getElementById('fBrand').value, model: document.getElementById('fModel').value, serial: document.getElementById('fSerial').value, installDate: document.getElementById('fInstallDate').value, status: document.getElementById('fStatus').value, criticality: document.getElementById('fCriticality').value, specs: document.getElementById('fSpecs').value };
            if (!data.name || !data.code) { this.toast('Nombre y Código son obligatorios', 'danger'); return; }
            if (editId) { store.updateAsset(editId, data); this.toast('Activo actualizado'); } else { store.addAsset(data); store.addLog({ action: 'asset_created', message: `Activo creado: ${data.name}` }); this.toast('Activo creado'); }
            this.closeModal(); this.renderAssets();
        });
    }

    // ========== WORK ORDERS ==========
    renderWorkOrders() {
        const el = document.getElementById('view-workorders');
        const wos = store.getWorkOrders();
        el.innerHTML = `
      <div class="toolbar"><div class="toolbar-left"><div class="search-input"><i class="fas fa-search"></i><input type="text" id="woSearch" placeholder="Buscar órdenes..."></div>
        <select class="filter-select" id="woStatusFilter"><option value="">Todos</option><option value="pendiente">Pendiente</option><option value="en_progreso">En Progreso</option><option value="completada">Completada</option><option value="cancelada">Cancelada</option></select>
        <select class="filter-select" id="woTypeFilter"><option value="">Todos los tipos</option><option value="correctivo">Correctivo</option><option value="preventivo">Preventivo</option><option value="predictivo">Predictivo</option><option value="mejora">Mejora</option></select></div>
        <div class="toolbar-right"><button class="btn btn-primary" id="btnAddWO"><i class="fas fa-plus"></i> Nueva OT</button></div></div>
      <div class="table-container"><table class="data-table"><thead><tr><th>ID</th><th>Equipo</th><th>Tipo</th><th>Prioridad</th><th>Estado</th><th>Asignado a</th><th>Fecha</th><th>Acciones</th></tr></thead>
        <tbody id="woTableBody">${this.renderWORows(wos)}</tbody></table></div>`;

        document.getElementById('btnAddWO').addEventListener('click', () => this.showWOForm());
        ['woSearch', 'woStatusFilter', 'woTypeFilter'].forEach(id => document.getElementById(id).addEventListener(id.includes('Search') ? 'input' : 'change', () => this.filterWOs()));
        this.bindWOActions();
    }

    renderWORows(wos) {
        if (wos.length === 0) return '<tr><td colspan="8"><div class="empty-state"><i class="fas fa-clipboard-list"></i><h3>Sin órdenes de trabajo</h3><p>Crea tu primera orden de trabajo para comenzar</p></div></td></tr>';
        const typeLabels = { correctivo: 'Correctivo', preventivo: 'Preventivo', predictivo: 'Predictivo', mejora: 'Mejora' };
        return wos.map(w => `<tr>
      <td><strong>${w.id.substring(0, 8).toUpperCase()}</strong></td><td>${this.getAssetName(w.assetId)}</td>
      <td><span class="badge badge-${w.type === 'correctivo' ? 'danger' : w.type === 'preventivo' ? 'success' : w.type === 'predictivo' ? 'info' : 'warning'}">${typeLabels[w.type] || w.type}</span></td>
      <td>${this.priorityBadge(w.priority)}</td><td>${this.statusBadge(w.status)}</td>
      <td>${this.getPersonName(w.assignedTo)}</td><td>${this.fmtDate(w.createdDate)}</td>
      <td><div class="action-btns">
        ${w.status === 'pendiente' ? `<button class="btn btn-sm btn-success" data-start="${w.id}" data-tooltip="Iniciar"><i class="fas fa-play"></i></button>` : ''}
        ${w.status === 'en_progreso' ? `<button class="btn btn-sm btn-success" data-complete="${w.id}" data-tooltip="Completar"><i class="fas fa-check"></i></button>` : ''}
        <button class="btn btn-icon btn-sm" data-editwo="${w.id}"><i class="fas fa-pen"></i></button>
        <button class="btn btn-icon btn-sm" data-delwo="${w.id}"><i class="fas fa-trash"></i></button></div></td></tr>`).join('');
    }

    filterWOs() {
        const q = (document.getElementById('woSearch')?.value || '').toLowerCase();
        const st = document.getElementById('woStatusFilter')?.value || '';
        const tp = document.getElementById('woTypeFilter')?.value || '';
        let wos = store.getWorkOrders();
        if (q) wos = wos.filter(w => (w.description + this.getAssetName(w.assetId) + w.id).toLowerCase().includes(q));
        if (st) wos = wos.filter(w => w.status === st);
        if (tp) wos = wos.filter(w => w.type === tp);
        document.getElementById('woTableBody').innerHTML = this.renderWORows(wos);
        this.bindWOActions();
    }

    bindWOActions() {
        document.querySelectorAll('[data-start]').forEach(b => b.addEventListener('click', () => {
            store.updateWorkOrder(b.dataset.start, { status: 'en_progreso', startDate: store.today() });
            store.addLog({ action: 'wo_started', message: 'OT iniciada: ' + b.dataset.start.substring(0, 8).toUpperCase() });
            this.toast('Orden de trabajo iniciada', 'info'); this.renderWorkOrders();
        }));
        document.querySelectorAll('[data-complete]').forEach(b => b.addEventListener('click', () => {
            store.updateWorkOrder(b.dataset.complete, { status: 'completada', completedDate: store.today() });
            store.addLog({ action: 'wo_completed', message: 'OT completada: ' + b.dataset.complete.substring(0, 8).toUpperCase() });
            this.toast('Orden de trabajo completada'); this.renderWorkOrders();
        }));
        document.querySelectorAll('[data-editwo]').forEach(b => b.addEventListener('click', () => this.showWOForm(b.dataset.editwo)));
        document.querySelectorAll('[data-delwo]').forEach(b => b.addEventListener('click', () => {
            this.confirmAction('Esta orden será eliminada.', () => { store.deleteWorkOrder(b.dataset.delwo); this.renderWorkOrders(); this.toast('OT eliminada', 'danger'); });
        }));
    }

    showWOForm(editId) {
        const w = editId ? store.getWorkOrder(editId) : {};
        const assets = store.getAssets();
        const personnel = store.getPersonnel();
        const html = `
      <div class="form-row"><div class="form-group"><label class="form-label">Equipo <span class="required">*</span></label><select class="form-control" id="fWOAsset"><option value="">Seleccionar...</option>${assets.map(a => `<option value="${a.id}" ${w.assetId === a.id ? 'selected' : ''}>${a.code} - ${a.name}</option>`).join('')}</select></div>
        <div class="form-group"><label class="form-label">Tipo <span class="required">*</span></label><select class="form-control" id="fWOType"><option value="correctivo" ${w.type === 'correctivo' ? 'selected' : ''}>Correctivo</option><option value="preventivo" ${w.type === 'preventivo' ? 'selected' : ''}>Preventivo</option><option value="predictivo" ${w.type === 'predictivo' ? 'selected' : ''}>Predictivo</option><option value="mejora" ${w.type === 'mejora' ? 'selected' : ''}>Mejora</option></select></div></div>
      <div class="form-row"><div class="form-group"><label class="form-label">Prioridad</label><select class="form-control" id="fWOPriority"><option value="baja" ${w.priority === 'baja' ? 'selected' : ''}>Baja</option><option value="media" ${w.priority === 'media' ? 'selected' : ''}>Media</option><option value="alta" ${w.priority === 'alta' ? 'selected' : ''}>Alta</option><option value="critica" ${w.priority === 'critica' ? 'selected' : ''}>Crítica</option></select></div>
        <div class="form-group"><label class="form-label">Asignado a</label><select class="form-control" id="fWOAssigned"><option value="">Sin asignar</option>${personnel.map(p => `<option value="${p.id}" ${w.assignedTo === p.id ? 'selected' : ''}>${p.name} (${p.role})</option>`).join('')}</select></div></div>
      <div class="form-group"><label class="form-label">Descripción <span class="required">*</span></label><textarea class="form-control" id="fWODesc" rows="3">${w.description || ''}</textarea></div>
      <div class="form-row"><div class="form-group"><label class="form-label">Horas Estimadas</label><input class="form-control" type="number" id="fWOEstHours" value="${w.estimatedHours || ''}"></div>
        <div class="form-group"><label class="form-label">Horas Reales</label><input class="form-control" type="number" id="fWOActHours" value="${w.actualHours || ''}"></div></div>
      <div class="form-group"><label class="form-label">Repuestos Necesarios</label><input class="form-control" id="fWOParts" value="${w.spareParts || ''}"></div>
      <div class="form-group"><label class="form-label">Notas</label><textarea class="form-control" id="fWONotes" rows="2">${w.notes || ''}</textarea></div>`;

        this.showModal(editId ? 'Editar OT' : 'Nueva Orden de Trabajo', html, () => {
            const data = { assetId: document.getElementById('fWOAsset').value, type: document.getElementById('fWOType').value, priority: document.getElementById('fWOPriority').value, assignedTo: document.getElementById('fWOAssigned').value, description: document.getElementById('fWODesc').value, estimatedHours: document.getElementById('fWOEstHours').value, actualHours: document.getElementById('fWOActHours').value, spareParts: document.getElementById('fWOParts').value, notes: document.getElementById('fWONotes').value };
            if (!data.assetId || !data.description) { this.toast('Equipo y Descripción son obligatorios', 'danger'); return; }
            if (editId) { store.updateWorkOrder(editId, data); this.toast('OT actualizada'); } else { data.status = 'pendiente'; data.createdDate = store.today(); store.addWorkOrder(data); store.addLog({ action: 'wo_created', message: `OT creada: ${data.description.substring(0, 50)}` }); this.toast('OT creada'); }
            this.closeModal(); this.renderWorkOrders();
        });
    }

    // ========== PREVENTIVE ==========
    renderPreventive() {
        const el = document.getElementById('view-preventive');
        const plans = store.getPreventivePlans();
        const today = store.today();
        el.innerHTML = `
      <div class="toolbar"><div class="toolbar-left"><div class="search-input"><i class="fas fa-search"></i><input type="text" id="pmSearch" placeholder="Buscar planes..."></div></div>
        <div class="toolbar-right"><button class="btn btn-primary" id="btnAddPM"><i class="fas fa-plus"></i> Nuevo Plan</button></div></div>
      <div class="table-container"><table class="data-table"><thead><tr><th>Plan</th><th>Equipo</th><th>Frecuencia</th><th>Última Ejecución</th><th>Próxima</th><th>Estado</th><th>Acciones</th></tr></thead>
        <tbody>${plans.length === 0 ? '<tr><td colspan="7"><div class="empty-state"><i class="fas fa-calendar"></i><h3>Sin planes preventivos</h3></div></td></tr>' : plans.map(p => {
            const overdue = p.nextExecution && p.nextExecution < today && p.status === 'activo';
            return `<tr style="${overdue ? 'background:var(--danger-bg)' : ''}"><td><strong>${p.name}</strong></td><td>${this.getAssetName(p.assetId)}</td><td>${p.frequency} ${p.frequencyUnit}</td><td>${this.fmtDate(p.lastExecution)}</td><td>${overdue ? `<span style="color:var(--danger);font-weight:600">${this.fmtDate(p.nextExecution)} ⚠</span>` : this.fmtDate(p.nextExecution)}</td><td>${this.statusBadge(p.status)}</td>
          <td><div class="action-btns">${p.status === 'activo' ? `<button class="btn btn-sm btn-success" data-execpm="${p.id}" data-tooltip="Ejecutar"><i class="fas fa-play"></i></button>` : ''}<button class="btn btn-icon btn-sm" data-editpm="${p.id}"><i class="fas fa-pen"></i></button><button class="btn btn-icon btn-sm" data-delpm="${p.id}"><i class="fas fa-trash"></i></button></div></td></tr>`;
        }).join('')}</tbody></table></div>`;

        document.getElementById('btnAddPM').addEventListener('click', () => this.showPMForm());
        document.getElementById('pmSearch').addEventListener('input', () => this.renderPreventive());
        document.querySelectorAll('[data-execpm]').forEach(b => b.addEventListener('click', () => {
            const p = store.getPreventivePlan(b.dataset.execpm);
            if (p) {
                const nextDate = new Date(p.nextExecution || store.today());
                nextDate.setDate(nextDate.getDate() + parseInt(p.frequency));
                store.updatePreventivePlan(p.id, { lastExecution: store.today(), nextExecution: nextDate.toISOString().split('T')[0] });
                const woData = { assetId: p.assetId, type: 'preventivo', priority: 'media', status: 'completada', description: `Plan PM ejecutado: ${p.name}`, assignedTo: p.assignedTo, createdDate: store.today(), completedDate: store.today(), estimatedHours: p.estimatedHours, actualHours: p.estimatedHours, spareParts: '', notes: `Tareas: ${(p.tasks || '').replace(/\|/g, ', ')}` };
                store.addWorkOrder(woData);
                store.addLog({ action: 'wo_completed', message: `PM ejecutado: ${p.name}` });
                this.toast('Plan ejecutado — OT generada'); this.renderPreventive();
            }
        }));
        document.querySelectorAll('[data-editpm]').forEach(b => b.addEventListener('click', () => this.showPMForm(b.dataset.editpm)));
        document.querySelectorAll('[data-delpm]').forEach(b => b.addEventListener('click', () => {
            this.confirmAction('Plan eliminado permanentemente.', () => { store.deletePreventivePlan(b.dataset.delpm); this.renderPreventive(); this.toast('Plan eliminado', 'danger'); });
        }));
    }

    showPMForm(editId) {
        const p = editId ? store.getPreventivePlan(editId) : {};
        const assets = store.getAssets();
        const personnel = store.getPersonnel();
        const html = `
      <div class="form-group"><label class="form-label">Nombre del Plan <span class="required">*</span></label><input class="form-control" id="fPMName" value="${p.name || ''}"></div>
      <div class="form-row"><div class="form-group"><label class="form-label">Equipo <span class="required">*</span></label><select class="form-control" id="fPMAsset"><option value="">Seleccionar...</option>${assets.map(a => `<option value="${a.id}" ${p.assetId === a.id ? 'selected' : ''}>${a.code} - ${a.name}</option>`).join('')}</select></div>
        <div class="form-group"><label class="form-label">Asignado a</label><select class="form-control" id="fPMAssigned"><option value="">Sin asignar</option>${personnel.map(pe => `<option value="${pe.id}" ${p.assignedTo === pe.id ? 'selected' : ''}>${pe.name}</option>`).join('')}</select></div></div>
      <div class="form-row-3"><div class="form-group"><label class="form-label">Frecuencia</label><input class="form-control" type="number" id="fPMFreq" value="${p.frequency || '30'}"></div>
        <div class="form-group"><label class="form-label">Unidad</label><select class="form-control" id="fPMUnit"><option value="días" ${p.frequencyUnit === 'días' ? 'selected' : ''}>Días</option><option value="horas" ${p.frequencyUnit === 'horas' ? 'selected' : ''}>Horas</option><option value="semanas" ${p.frequencyUnit === 'semanas' ? 'selected' : ''}>Semanas</option></select></div>
        <div class="form-group"><label class="form-label">Horas Estimadas</label><input class="form-control" type="number" id="fPMHours" value="${p.estimatedHours || ''}"></div></div>
      <div class="form-row"><div class="form-group"><label class="form-label">Próxima Ejecución</label><input class="form-control" type="date" id="fPMNext" value="${p.nextExecution || ''}"></div>
        <div class="form-group"><label class="form-label">Estado</label><select class="form-control" id="fPMStatus"><option value="activo" ${p.status === 'activo' ? 'selected' : ''}>Activo</option><option value="inactivo" ${p.status === 'inactivo' ? 'selected' : ''}>Inactivo</option></select></div></div>
      <div class="form-group"><label class="form-label">Tareas (separar con |)</label><textarea class="form-control" id="fPMTasks" rows="3">${p.tasks || ''}</textarea></div>`;

        this.showModal(editId ? 'Editar Plan' : 'Nuevo Plan Preventivo', html, () => {
            const data = { name: document.getElementById('fPMName').value, assetId: document.getElementById('fPMAsset').value, assignedTo: document.getElementById('fPMAssigned').value, frequency: document.getElementById('fPMFreq').value, frequencyUnit: document.getElementById('fPMUnit').value, estimatedHours: document.getElementById('fPMHours').value, nextExecution: document.getElementById('fPMNext').value, status: document.getElementById('fPMStatus').value, tasks: document.getElementById('fPMTasks').value };
            if (!data.name || !data.assetId) { this.toast('Nombre y Equipo son obligatorios', 'danger'); return; }
            if (editId) { store.updatePreventivePlan(editId, data); this.toast('Plan actualizado'); } else { data.lastExecution = ''; store.addPreventivePlan(data); this.toast('Plan creado'); }
            this.closeModal(); this.renderPreventive();
        });
    }

    // ========== INVENTORY ==========
    renderInventory() {
        const el = document.getElementById('view-inventory');
        const items = store.getInventory();
        el.innerHTML = `
      <div class="toolbar"><div class="toolbar-left"><div class="search-input"><i class="fas fa-search"></i><input type="text" id="invSearch" placeholder="Buscar repuestos..."></div></div>
        <div class="toolbar-right"><button class="btn btn-primary" id="btnAddInv"><i class="fas fa-plus"></i> Nuevo Ítem</button></div></div>
      <div class="table-container"><table class="data-table"><thead><tr><th>Código</th><th>Nombre</th><th>Categoría</th><th>Stock</th><th>Mín/Máx</th><th>Costo Unit.</th><th>Ubicación</th><th>Acciones</th></tr></thead>
        <tbody id="invTableBody">${this.renderInvRows(items)}</tbody></table></div>`;

        document.getElementById('btnAddInv').addEventListener('click', () => this.showInvForm());
        document.getElementById('invSearch').addEventListener('input', () => {
            const q = document.getElementById('invSearch').value.toLowerCase();
            const filtered = q ? items.filter(i => (i.name + i.code + i.category).toLowerCase().includes(q)) : items;
            document.getElementById('invTableBody').innerHTML = this.renderInvRows(filtered);
            this.bindInvActions();
        });
        this.bindInvActions();
    }

    renderInvRows(items) {
        if (items.length === 0) return '<tr><td colspan="8"><div class="empty-state"><i class="fas fa-boxes-stacked"></i><h3>Sin ítems</h3></div></td></tr>';
        return items.map(i => {
            const low = parseFloat(i.quantity) <= parseFloat(i.minStock);
            const pct = parseFloat(i.maxStock) > 0 ? Math.min((parseFloat(i.quantity) / parseFloat(i.maxStock)) * 100, 100) : 0;
            return `<tr ${low ? 'style="background:var(--danger-bg)"' : ''}><td><strong>${i.code}</strong></td><td>${i.name}</td><td>${i.category}</td>
        <td><div class="stock-indicator"><strong ${low ? 'style="color:var(--danger)"' : ''}>${i.quantity} ${i.unit}</strong><div class="stock-bar"><div class="progress-bar"><div class="progress-fill ${low ? 'fill-danger' : pct > 60 ? 'fill-success' : 'fill-warning'}" style="width:${pct}%"></div></div></div></div></td>
        <td>${i.minStock} / ${i.maxStock}</td><td>${this.fmtMoney(i.unitCost)}</td><td>${i.location}</td>
        <td><div class="action-btns"><button class="btn btn-icon btn-sm" data-editinv="${i.id}"><i class="fas fa-pen"></i></button><button class="btn btn-icon btn-sm" data-delinv="${i.id}"><i class="fas fa-trash"></i></button></div></td></tr>`;
        }).join('');
    }

    bindInvActions() {
        document.querySelectorAll('[data-editinv]').forEach(b => b.addEventListener('click', () => this.showInvForm(b.dataset.editinv)));
        document.querySelectorAll('[data-delinv]').forEach(b => b.addEventListener('click', () => {
            this.confirmAction('Ítem eliminado permanentemente.', () => { store.deleteInventoryItem(b.dataset.delinv); this.renderInventory(); this.toast('Ítem eliminado', 'danger'); });
        }));
    }

    showInvForm(editId) {
        const i = editId ? store.getInventoryItem(editId) : {};
        const html = `
      <div class="form-row"><div class="form-group"><label class="form-label">Nombre <span class="required">*</span></label><input class="form-control" id="fInvName" value="${i.name || ''}"></div>
        <div class="form-group"><label class="form-label">Código</label><input class="form-control" id="fInvCode" value="${i.code || ''}"></div></div>
      <div class="form-row-3"><div class="form-group"><label class="form-label">Categoría</label><input class="form-control" id="fInvCat" value="${i.category || ''}"></div>
        <div class="form-group"><label class="form-label">Unidad</label><input class="form-control" id="fInvUnit" value="${i.unit || 'und'}"></div>
        <div class="form-group"><label class="form-label">Costo Unitario</label><input class="form-control" type="number" id="fInvCost" value="${i.unitCost || ''}"></div></div>
      <div class="form-row-3"><div class="form-group"><label class="form-label">Cantidad</label><input class="form-control" type="number" id="fInvQty" value="${i.quantity || '0'}"></div>
        <div class="form-group"><label class="form-label">Stock Mínimo</label><input class="form-control" type="number" id="fInvMin" value="${i.minStock || '0'}"></div>
        <div class="form-group"><label class="form-label">Stock Máximo</label><input class="form-control" type="number" id="fInvMax" value="${i.maxStock || '0'}"></div></div>
      <div class="form-row"><div class="form-group"><label class="form-label">Ubicación</label><input class="form-control" id="fInvLoc" value="${i.location || ''}"></div>
        <div class="form-group"><label class="form-label">Proveedor</label><input class="form-control" id="fInvSupp" value="${i.supplier || ''}"></div></div>`;

        this.showModal(editId ? 'Editar Ítem' : 'Nuevo Ítem de Inventario', html, () => {
            const data = { name: document.getElementById('fInvName').value, code: document.getElementById('fInvCode').value, category: document.getElementById('fInvCat').value, unit: document.getElementById('fInvUnit').value, unitCost: document.getElementById('fInvCost').value, quantity: document.getElementById('fInvQty').value, minStock: document.getElementById('fInvMin').value, maxStock: document.getElementById('fInvMax').value, location: document.getElementById('fInvLoc').value, supplier: document.getElementById('fInvSupp').value };
            if (!data.name) { this.toast('Nombre es obligatorio', 'danger'); return; }
            if (editId) { store.updateInventoryItem(editId, data); this.toast('Ítem actualizado'); } else { store.addInventoryItem(data); this.toast('Ítem creado'); }
            this.closeModal(); this.renderInventory();
        });
    }

    // ========== PERSONNEL ==========
    renderPersonnel() {
        const el = document.getElementById('view-personnel');
        const personnel = store.getPersonnel();
        const wos = store.getWorkOrders();
        el.innerHTML = `
      <div class="toolbar"><div class="toolbar-left"><div class="search-input"><i class="fas fa-search"></i><input type="text" id="perSearch" placeholder="Buscar personal..."></div></div>
        <div class="toolbar-right"><button class="btn btn-primary" id="btnAddPer"><i class="fas fa-plus"></i> Nuevo Técnico</button></div></div>
      <div class="table-container"><table class="data-table"><thead><tr><th>Nombre</th><th>Rol</th><th>Especialización</th><th>Turno</th><th>OTs Activas</th><th>Estado</th><th>Acciones</th></tr></thead>
        <tbody>${personnel.length === 0 ? '<tr><td colspan="7"><div class="empty-state"><i class="fas fa-users"></i><h3>Sin personal</h3></div></td></tr>' : personnel.map((p, idx) => {
            const activeWOs = wos.filter(w => w.assignedTo === p.id && (w.status === 'pendiente' || w.status === 'en_progreso')).length;
            const colors = ['avatar-primary', 'avatar-success', 'avatar-warning'];
            return `<tr><td><div style="display:flex;align-items:center;gap:10px"><div class="avatar ${colors[idx % 3]}">${p.name.split(' ').map(n => n[0]).slice(0, 2).join('')}</div>${p.name}</div></td><td>${p.role}</td><td>${p.specialization}</td><td>${p.shift}</td>
          <td><strong>${activeWOs}</strong></td><td>${this.statusBadge(p.status)}</td>
          <td><div class="action-btns"><button class="btn btn-icon btn-sm" data-editper="${p.id}"><i class="fas fa-pen"></i></button><button class="btn btn-icon btn-sm" data-delper="${p.id}"><i class="fas fa-trash"></i></button></div></td></tr>`;
        }).join('')}</tbody></table></div>`;

        document.getElementById('btnAddPer').addEventListener('click', () => this.showPerForm());
        document.querySelectorAll('[data-editper]').forEach(b => b.addEventListener('click', () => this.showPerForm(b.dataset.editper)));
        document.querySelectorAll('[data-delper]').forEach(b => b.addEventListener('click', () => {
            this.confirmAction('Técnico eliminado permanentemente.', () => { store.deletePersonnel(b.dataset.delper); this.renderPersonnel(); this.toast('Técnico eliminado', 'danger'); });
        }));
    }

    showPerForm(editId) {
        const p = editId ? store.getPersonnelById(editId) : {};
        const html = `
      <div class="form-group"><label class="form-label">Nombre Completo <span class="required">*</span></label><input class="form-control" id="fPerName" value="${p.name || ''}"></div>
      <div class="form-row"><div class="form-group"><label class="form-label">Rol</label><input class="form-control" id="fPerRole" value="${p.role || ''}"></div>
        <div class="form-group"><label class="form-label">Especialización</label><input class="form-control" id="fPerSpec" value="${p.specialization || ''}"></div></div>
      <div class="form-row"><div class="form-group"><label class="form-label">Email</label><input class="form-control" type="email" id="fPerEmail" value="${p.email || ''}"></div>
        <div class="form-group"><label class="form-label">Teléfono</label><input class="form-control" id="fPerPhone" value="${p.phone || ''}"></div></div>
      <div class="form-row"><div class="form-group"><label class="form-label">Turno</label><input class="form-control" id="fPerShift" value="${p.shift || ''}"></div>
        <div class="form-group"><label class="form-label">Estado</label><select class="form-control" id="fPerStatus"><option value="activo" ${p.status === 'activo' ? 'selected' : ''}>Activo</option><option value="inactivo" ${p.status === 'inactivo' ? 'selected' : ''}>Inactivo</option></select></div></div>`;

        this.showModal(editId ? 'Editar Técnico' : 'Nuevo Técnico', html, () => {
            const data = { name: document.getElementById('fPerName').value, role: document.getElementById('fPerRole').value, specialization: document.getElementById('fPerSpec').value, email: document.getElementById('fPerEmail').value, phone: document.getElementById('fPerPhone').value, shift: document.getElementById('fPerShift').value, status: document.getElementById('fPerStatus').value };
            if (!data.name) { this.toast('Nombre es obligatorio', 'danger'); return; }
            if (editId) { store.updatePersonnel(editId, data); this.toast('Técnico actualizado'); } else { store.addPersonnel(data); this.toast('Técnico creado'); }
            this.closeModal(); this.renderPersonnel();
        });
    }

    // ========== CALENDAR ==========
    renderCalendar() {
        const el = document.getElementById('view-calendar');
        const year = this.calendarDate.getFullYear();
        const month = this.calendarDate.getMonth();
        const monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
        const dayNames = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        let startDow = firstDay.getDay() - 1;
        if (startDow < 0) startDow = 6;

        const wos = store.getWorkOrders();
        const plans = store.getPreventivePlans().filter(p => p.status === 'activo');
        const todayStr = store.today();

        // Build calendar cells
        let cells = '';
        for (let i = 0; i < startDow; i++) cells += '<div class="cal-cell cal-empty"></div>';

        for (let day = 1; day <= lastDay.getDate(); day++) {
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const isToday = dateStr === todayStr;

            // OTs on this date (by created, start or completed)
            const dayWOs = wos.filter(w => w.createdDate === dateStr || w.startDate === dateStr || w.completedDate === dateStr);
            // PMs due on this date
            const dayPMs = plans.filter(p => p.nextExecution === dateStr);

            const hasEvents = dayWOs.length > 0 || dayPMs.length > 0;

            let dots = '';
            if (dayWOs.length > 0) {
                const statuses = [...new Set(dayWOs.map(w => w.status))];
                dots = statuses.map(s => {
                    const cls = s === 'pendiente' ? 'dot-warning' : s === 'en_progreso' ? 'dot-info' : s === 'completada' ? 'dot-success' : 'dot-muted';
                    return `<span class="cal-dot ${cls}"></span>`;
                }).join('');
            }
            if (dayPMs.length > 0) {
                const overdue = dayPMs.some(p => dateStr < todayStr);
                dots += `<span class="cal-dot ${overdue ? 'dot-danger' : 'dot-primary'}"></span>`;
            }

            cells += `<div class="cal-cell ${isToday ? 'cal-today' : ''} ${hasEvents ? 'cal-has-events' : ''}" data-date="${dateStr}">
                <div class="cal-day-num">${day}</div>
                ${dots ? `<div class="cal-dots">${dots}</div>` : ''}
                ${dayWOs.length > 0 ? `<div class="cal-count">${dayWOs.length} OT${dayWOs.length > 1 ? 's' : ''}</div>` : ''}
            </div>`;
        }

        el.innerHTML = `
        <div class="calendar-header">
            <button class="btn btn-icon" id="calPrev"><i class="fas fa-chevron-left"></i></button>
            <h2 class="calendar-month-title">${monthNames[month]} ${year}</h2>
            <button class="btn btn-icon" id="calNext"><i class="fas fa-chevron-right"></i></button>
            <button class="btn btn-secondary" id="calToday" style="margin-left:16px"><i class="fas fa-crosshairs"></i> Hoy</button>
        </div>
        <div class="calendar-legend">
            <span class="legend-item"><span class="cal-dot dot-warning"></span> Pendiente</span>
            <span class="legend-item"><span class="cal-dot dot-info"></span> En Progreso</span>
            <span class="legend-item"><span class="cal-dot dot-success"></span> Completada</span>
            <span class="legend-item"><span class="cal-dot dot-primary"></span> PM Programado</span>
            <span class="legend-item"><span class="cal-dot dot-danger"></span> PM Vencido</span>
        </div>
        <div class="calendar-grid">
            ${dayNames.map(d => `<div class="cal-header-cell">${d}</div>`).join('')}
            ${cells}
        </div>
        <div id="calDayDetail" class="cal-day-detail"></div>`;

        // Navigation
        document.getElementById('calPrev').addEventListener('click', () => {
            this.calendarDate.setMonth(this.calendarDate.getMonth() - 1);
            this.renderCalendar();
        });
        document.getElementById('calNext').addEventListener('click', () => {
            this.calendarDate.setMonth(this.calendarDate.getMonth() + 1);
            this.renderCalendar();
        });
        document.getElementById('calToday').addEventListener('click', () => {
            this.calendarDate = new Date();
            this.renderCalendar();
        });

        // Click day for details
        el.querySelectorAll('.cal-cell[data-date]').forEach(cell => {
            cell.addEventListener('click', () => {
                el.querySelectorAll('.cal-cell').forEach(c => c.classList.remove('cal-selected'));
                cell.classList.add('cal-selected');
                this.showCalDayDetail(cell.dataset.date);
            });
        });
    }

    showCalDayDetail(dateStr) {
        const detailEl = document.getElementById('calDayDetail');
        const wos = store.getWorkOrders().filter(w => w.createdDate === dateStr || w.startDate === dateStr || w.completedDate === dateStr);
        const plans = store.getPreventivePlans().filter(p => p.nextExecution === dateStr && p.status === 'activo');

        if (wos.length === 0 && plans.length === 0) {
            detailEl.innerHTML = `<div class="cal-detail-empty"><i class="fas fa-calendar-day"></i> Sin eventos para ${this.fmtDate(dateStr)}</div>`;
            return;
        }

        const typeLabels = { correctivo: 'Correctivo', preventivo: 'Preventivo', predictivo: 'Predictivo', mejora: 'Mejora' };
        let html = `<div class="cal-detail-title"><i class="fas fa-calendar-day"></i> Eventos del ${this.fmtDate(dateStr)}</div>`;

        if (wos.length > 0) {
            html += `<div class="cal-detail-section">Órdenes de Trabajo</div>`;
            html += wos.map(w => `<div class="cal-detail-item">
                <div class="cal-detail-item-header">${this.statusBadge(w.status)} <span class="badge badge-${w.type === 'correctivo' ? 'danger' : 'success'}">${typeLabels[w.type]}</span> ${this.priorityBadge(w.priority)}</div>
                <div class="cal-detail-item-title">${this.getAssetName(w.assetId)}</div>
                <div class="cal-detail-item-desc">${w.description || '—'}</div>
                <div class="cal-detail-item-meta"><i class="fas fa-user"></i> ${this.getPersonName(w.assignedTo)}</div>
            </div>`).join('');
        }

        if (plans.length > 0) {
            html += `<div class="cal-detail-section">Planes Preventivos</div>`;
            html += plans.map(p => `<div class="cal-detail-item cal-detail-pm">
                <div class="cal-detail-item-title"><i class="fas fa-wrench"></i> ${p.name}</div>
                <div class="cal-detail-item-desc">${this.getAssetName(p.assetId)} — Cada ${p.frequency} ${p.frequencyUnit}</div>
            </div>`).join('');
        }

        detailEl.innerHTML = html;
    }

    // ========== ASSET DETAIL / HISTORY ==========
    renderAssetDetail() {
        const el = document.getElementById('view-assetDetail');
        if (!this.viewingAssetId) {
            el.innerHTML = '<div class="empty-state"><i class="fas fa-eye-slash"></i><h3>Seleccione un equipo</h3><p>Vuelva a Activos y presione el botón 👁 para ver el historial.</p></div>';
            return;
        }

        const asset = store.getAsset(this.viewingAssetId);
        if (!asset) {
            el.innerHTML = '<div class="empty-state"><i class="fas fa-exclamation-triangle"></i><h3>Equipo no encontrado</h3></div>';
            return;
        }

        const kpis = store.getAssetKPIs(this.viewingAssetId);
        const wos = store.getWorkOrders().filter(w => w.assetId === this.viewingAssetId).sort((a, b) => (b.createdDate || '').localeCompare(a.createdDate || ''));
        const plans = store.getPreventivePlans().filter(p => p.assetId === this.viewingAssetId);
        const typeLabels = { correctivo: 'Correctivo', preventivo: 'Preventivo', predictivo: 'Predictivo', mejora: 'Mejora' };

        el.innerHTML = `
        <div class="toolbar"><div class="toolbar-left"><button class="btn btn-secondary" id="btnBackAssets"><i class="fas fa-arrow-left"></i> Volver a Activos</button></div></div>

        <div class="asset-detail-header">
            <div class="asset-detail-info">
                <h2 class="asset-detail-name">${asset.name}</h2>
                <div class="asset-detail-code">${asset.code} · ${asset.brand} ${asset.model}</div>
            </div>
            <div class="asset-detail-status">${this.statusBadge(asset.status)} ${this.criticalityHTML(asset.criticality)}</div>
        </div>

        <div class="detail-grid" style="margin-bottom:24px">
            <div class="detail-field"><div class="detail-field-label">Categoría</div><div class="detail-field-value">${asset.category}</div></div>
            <div class="detail-field"><div class="detail-field-label">Ubicación</div><div class="detail-field-value">${asset.location}</div></div>
            <div class="detail-field"><div class="detail-field-label">Serial</div><div class="detail-field-value">${asset.serial || '—'}</div></div>
            <div class="detail-field"><div class="detail-field-label">Instalación</div><div class="detail-field-value">${this.fmtDate(asset.installDate)}</div></div>
            <div class="detail-field"><div class="detail-field-label">Especificaciones</div><div class="detail-field-value" style="font-size:0.8rem">${asset.specs || '—'}</div></div>
        </div>

        <div class="kpi-grid" style="margin-bottom:24px">
            <div class="kpi-card kpi-primary"><div class="kpi-icon"><i class="fas fa-clipboard-list"></i></div><div class="kpi-content"><div class="kpi-label">Total OTs</div><div class="kpi-value">${kpis.totalWOs}</div><div class="kpi-trend">${kpis.completedWOs} completadas</div></div></div>
            <div class="kpi-card kpi-success"><div class="kpi-icon"><i class="fas fa-clock"></i></div><div class="kpi-content"><div class="kpi-label">MTTR</div><div class="kpi-value">${kpis.mttr}h</div><div class="kpi-trend">Tiempo medio reparación</div></div></div>
            <div class="kpi-card kpi-warning"><div class="kpi-icon"><i class="fas fa-hourglass-half"></i></div><div class="kpi-content"><div class="kpi-label">Horas Acum.</div><div class="kpi-value">${kpis.totalHours}h</div><div class="kpi-trend">Total mantenimiento</div></div></div>
            <div class="kpi-card kpi-info"><div class="kpi-icon"><i class="fas fa-calendar-check"></i></div><div class="kpi-content"><div class="kpi-label">Última Intervención</div><div class="kpi-value" style="font-size:1rem">${kpis.lastIntervention ? this.fmtDate(kpis.lastIntervention) : '—'}</div></div></div>
        </div>

        <div class="grid-2">
            <div class="card">
                <div class="card-header"><div class="card-title"><i class="fas fa-history"></i> Historial de Mantenimiento</div></div>
                ${wos.length === 0 ? '<div class="empty-state" style="padding:30px"><i class="fas fa-clipboard-list"></i><h3>Sin órdenes de trabajo</h3><p>Crea una OT asociada a este equipo para iniciar su historial.</p></div>' :
                `<div class="timeline">${wos.map(w => `<div class="timeline-item">
                    <div class="timeline-date">${this.fmtDate(w.createdDate)} ${w.completedDate ? '→ ' + this.fmtDate(w.completedDate) : ''}</div>
                    <div class="timeline-content">
                        <div style="margin-bottom:4px">${this.statusBadge(w.status)} <span class="badge badge-${w.type === 'correctivo' ? 'danger' : w.type === 'preventivo' ? 'success' : 'info'}">${typeLabels[w.type]}</span> ${this.priorityBadge(w.priority)}</div>
                        <div style="font-weight:500;margin-bottom:4px">${w.description}</div>
                        <div style="font-size:0.78rem;color:var(--text-muted)"><i class="fas fa-user"></i> ${this.getPersonName(w.assignedTo)} · <i class="fas fa-clock"></i> Est: ${w.estimatedHours || '—'}h / Real: ${w.actualHours || '—'}h</div>
                        ${w.spareParts ? `<div style="font-size:0.78rem;color:var(--text-muted);margin-top:2px"><i class="fas fa-box"></i> ${w.spareParts}</div>` : ''}
                        ${w.notes ? `<div style="font-size:0.78rem;color:var(--text-muted);margin-top:2px"><i class="fas fa-sticky-note"></i> ${w.notes}</div>` : ''}
                    </div>
                </div>`).join('')}</div>`}
            </div>
            <div class="card">
                <div class="card-header"><div class="card-title"><i class="fas fa-calendar-check"></i> Planes Preventivos</div></div>
                ${plans.length === 0 ? '<div class="empty-state" style="padding:30px"><i class="fas fa-calendar"></i><h3>Sin planes asignados</h3><p>Crea un plan preventivo para este equipo.</p></div>' :
                `<div class="recent-list">${plans.map(p => {
                    const overdue = p.nextExecution && p.nextExecution < store.today() && p.status === 'activo';
                    return `<li class="recent-item">
                        <div class="recent-icon" style="background:${overdue ? 'var(--danger-bg)' : 'var(--primary-glow)'};color:${overdue ? 'var(--danger)' : 'var(--primary)'}"><i class="fas ${overdue ? 'fa-exclamation' : 'fa-wrench'}"></i></div>
                        <div class="recent-info">
                            <div class="recent-title">${p.name} ${this.statusBadge(p.status)}</div>
                            <div class="recent-meta">${overdue ? '<span style="color:var(--danger)">VENCIDO</span> · ' : ''}Cada ${p.frequency} ${p.frequencyUnit} · Próxima: ${this.fmtDate(p.nextExecution)}</div>
                            <div class="recent-meta">Tareas: ${(p.tasks || '').replace(/\|/g, ', ')}</div>
                        </div>
                    </li>`;
                }).join('')}</div>`}
            </div>
        </div>`;

        document.getElementById('btnBackAssets').addEventListener('click', () => this.navigate('assets'));
    }

    // ========== REPORTS ==========
    renderReports() {
        const el = document.getElementById('view-reports');
        const k = store.getKPIs();
        const company = store.getCurrentCompany();
        el.innerHTML = `
      <div class="card" style="margin-bottom:24px"><div class="card-header"><div class="card-title"><i class="fas fa-building"></i> ${company.name} — Resumen Ejecutivo</div></div>
        <div class="detail-grid">
          <div class="detail-field"><div class="detail-field-label">Total Activos</div><div class="detail-field-value">${k.totalAssets}</div></div>
          <div class="detail-field"><div class="detail-field-label">Activos Operativos</div><div class="detail-field-value">${k.activeAssets} (${k.totalAssets > 0 ? Math.round(k.activeAssets / k.totalAssets * 100) : 0}%)</div></div>
          <div class="detail-field"><div class="detail-field-label">Total OTs</div><div class="detail-field-value">${k.totalWOs}</div></div>
          <div class="detail-field"><div class="detail-field-label">MTTR</div><div class="detail-field-value">${k.mttr} horas</div></div>
          <div class="detail-field"><div class="detail-field-label">MTBF</div><div class="detail-field-value">${k.mtbf} días</div></div>
          <div class="detail-field"><div class="detail-field-label">Disponibilidad</div><div class="detail-field-value">${k.availability}%</div></div>
          <div class="detail-field"><div class="detail-field-label">Personal Técnico</div><div class="detail-field-value">${k.totalPersonnel}</div></div>
          <div class="detail-field"><div class="detail-field-label">Planes PM Activos</div><div class="detail-field-value">${k.activePlans}</div></div>
        </div></div>
      <div class="dashboard-charts">
        <div class="chart-card"><div class="card-title">Estado de Órdenes de Trabajo</div><div class="chart-wrapper"><canvas id="chartReportStatus"></canvas></div></div>
        <div class="chart-card"><div class="card-title">Distribución por Tipo de Mantenimiento</div><div class="chart-wrapper"><canvas id="chartReportType"></canvas></div></div>
      </div>
      <div style="text-align:center;margin-top:16px"><button class="btn btn-secondary" id="btnExportData"><i class="fas fa-download"></i> Exportar Datos (JSON)</button>
        <button class="btn btn-danger" id="btnResetData" style="margin-left:10px"><i class="fas fa-rotate-left"></i> Restablecer Datos Iniciales</button></div>`;

        this.renderChart('chartReportStatus', 'doughnut', {
            labels: ['Pendiente', 'En Progreso', 'Completada', 'Cancelada'],
            datasets: [{ data: [k.pendingWOs, k.inProgressWOs, k.completedWOs, k.cancelledWOs], backgroundColor: ['#ffab40', '#448aff', '#00e676', '#6b7490'], borderWidth: 0 }]
        });
        this.renderChart('chartReportType', 'pie', {
            labels: ['Correctivo', 'Preventivo', 'Predictivo', 'Mejora'],
            datasets: [{ data: [k.woByType.correctivo, k.woByType.preventivo, k.woByType.predictivo, k.woByType.mejora], backgroundColor: ['#ff5252', '#00e676', '#448aff', '#ffab40'], borderWidth: 0 }]
        });

        document.getElementById('btnExportData').addEventListener('click', () => {
            const blob = new Blob([JSON.stringify(store.data, null, 2)], { type: 'application/json' });
            const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `maintpro_backup_${store.today()}.json`; a.click();
            this.toast('Datos exportados correctamente', 'info');
        });
        document.getElementById('btnResetData').addEventListener('click', () => {
            this.confirmAction('Se restablecerán todos los datos a los valores iniciales. Perderás los cambios realizados.', () => { store.resetData(); this.navigate('dashboard'); this.toast('Datos restablecidos', 'warning'); });
        });
    }
}

// Start app
document.addEventListener('DOMContentLoaded', () => { window.app = new App(); });
