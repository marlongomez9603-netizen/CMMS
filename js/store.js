/* ============================================
   MaintPro CMMS v2.0 - Data Store
   Almacenamiento aislado por cédula (localStorage)
   ============================================ */

class DataStore {
    constructor(cedula) {
        this.cedula = cedula;
        this.STORAGE_KEY = `maintpro_${cedula}`;
        this.data = this.load();
        if (!this.data || !this.data.companies || this.data.companies.length === 0) {
            this.data = generateStudentData(cedula);
            if (this.data) this.save();
        }
        this.currentCompanyId = this.data ? this.data.companies[0].id : null;
    }

    load() {
        try {
            const raw = localStorage.getItem(this.STORAGE_KEY);
            return raw ? JSON.parse(raw) : null;
        } catch {
            return null;
        }
    }

    save() {
        if (this.data) {
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.data));
        }
    }

    resetData() {
        this.data = generateStudentData(this.cedula);
        if (this.data) {
            this.currentCompanyId = this.data.companies[0].id;
            this.save();
        }
    }

    // ---------- Helpers ----------
    genId() {
        return 'id_' + Date.now().toString(36) + Math.random().toString(36).substr(2, 6);
    }

    today() {
        return new Date().toISOString().split('T')[0];
    }

    dateOffset(days) {
        const d = new Date();
        d.setDate(d.getDate() + days);
        return d.toISOString().split('T')[0];
    }

    // ---------- Company (single per student) ----------
    getCompanies() { return this.data.companies; }
    getCompany(id) { return this.data.companies.find(c => c.id === id); }
    getCurrentCompany() { return this.getCompany(this.currentCompanyId); }

    setCurrentCompany(id) {
        this.currentCompanyId = id;
    }

    // ---------- Generic CRUD ----------
    _getCollection(name) {
        return (this.data[name] || []).filter(item => item.companyId === this.currentCompanyId);
    }

    _getAll(name) {
        return this.data[name] || [];
    }

    _getById(name, id) {
        return (this.data[name] || []).find(item => item.id === id);
    }

    _add(name, item) {
        if (!this.data[name]) this.data[name] = [];
        item.id = this.genId();
        item.companyId = this.currentCompanyId;
        item.createdAt = this.today();
        this.data[name].push(item);
        this.save();
        return item;
    }

    _update(name, id, updates) {
        const idx = (this.data[name] || []).findIndex(item => item.id === id);
        if (idx !== -1) {
            Object.assign(this.data[name][idx], updates);
            this.data[name][idx].updatedAt = this.today();
            this.save();
            return this.data[name][idx];
        }
        return null;
    }

    _delete(name, id) {
        this.data[name] = (this.data[name] || []).filter(item => item.id !== id);
        this.save();
    }

    // ---------- Assets ----------
    getAssets() { return this._getCollection('assets'); }
    getAsset(id) { return this._getById('assets', id); }
    addAsset(a) { return this._add('assets', a); }
    updateAsset(id, u) { return this._update('assets', id, u); }
    deleteAsset(id) { this._delete('assets', id); }

    // ---------- Work Orders ----------
    getWorkOrders() { return this._getCollection('workOrders'); }
    getWorkOrder(id) { return this._getById('workOrders', id); }
    addWorkOrder(wo) { return this._add('workOrders', wo); }
    updateWorkOrder(id, u) { return this._update('workOrders', id, u); }
    deleteWorkOrder(id) { this._delete('workOrders', id); }

    // ---------- Preventive Plans ----------
    getPreventivePlans() { return this._getCollection('preventivePlans'); }
    getPreventivePlan(id) { return this._getById('preventivePlans', id); }
    addPreventivePlan(p) { return this._add('preventivePlans', p); }
    updatePreventivePlan(id, u) { return this._update('preventivePlans', id, u); }
    deletePreventivePlan(id) { this._delete('preventivePlans', id); }

    // ---------- Inventory ----------
    getInventory() { return this._getCollection('inventory'); }
    getInventoryItem(id) { return this._getById('inventory', id); }
    addInventoryItem(item) { return this._add('inventory', item); }
    updateInventoryItem(id, u) { return this._update('inventory', id, u); }
    deleteInventoryItem(id) { this._delete('inventory', id); }

    // ---------- Personnel ----------
    getPersonnel() { return this._getCollection('personnel'); }
    getPersonnelById(id) { return this._getById('personnel', id); }
    addPersonnel(p) { return this._add('personnel', p); }
    updatePersonnel(id, u) { return this._update('personnel', id, u); }
    deletePersonnel(id) { this._delete('personnel', id); }

    // ---------- Activity Log ----------
    addLog(entry) {
        if (!this.data.activityLog) this.data.activityLog = [];
        this.data.activityLog.unshift({
            id: this.genId(),
            companyId: this.currentCompanyId,
            timestamp: new Date().toISOString(),
            ...entry
        });
        if (this.data.activityLog.length > 500) this.data.activityLog = this.data.activityLog.slice(0, 500);
        this.save();
    }

    getRecentLogs(limit = 10) {
        return (this.data.activityLog || [])
            .filter(l => l.companyId === this.currentCompanyId)
            .slice(0, limit);
    }

    // ---------- KPIs ----------
    getKPIs() {
        const assets = this.getAssets();
        const wos = this.getWorkOrders();
        const plans = this.getPreventivePlans();
        const inventory = this.getInventory();

        const completed = wos.filter(w => w.status === 'completada');
        const pending = wos.filter(w => w.status === 'pendiente');
        const inProgress = wos.filter(w => w.status === 'en_progreso');

        // MTTR
        let mttr = 0;
        if (completed.length > 0) {
            const totalHours = completed.reduce((s, w) => s + (parseFloat(w.actualHours) || parseFloat(w.estimatedHours) || 2), 0);
            mttr = (totalHours / completed.length).toFixed(1);
        }

        // MTBF
        const correctiveCompleted = completed.filter(w => w.type === 'correctivo');
        let mtbf = assets.length > 0 ? Math.round(365 / Math.max(correctiveCompleted.length, 1)) : 0;

        // Availability
        const totalPossibleHours = assets.length * 720;
        const downtime = wos.reduce((s, w) => s + (parseFloat(w.actualHours) || parseFloat(w.estimatedHours) || 0), 0);
        const availability = totalPossibleHours > 0 ? (((totalPossibleHours - downtime) / totalPossibleHours) * 100).toFixed(1) : 100;

        // Low stock
        const lowStock = inventory.filter(i => parseFloat(i.quantity) <= parseFloat(i.minStock));

        // Overdue PMs
        const today = this.today();
        const overduePlans = plans.filter(p => p.nextExecution && p.nextExecution < today && p.status === 'activo');

        return {
            totalAssets: assets.length,
            activeAssets: assets.filter(a => a.status === 'operativo').length,
            totalWOs: wos.length,
            pendingWOs: pending.length,
            inProgressWOs: inProgress.length,
            completedWOs: completed.length,
            cancelledWOs: wos.filter(w => w.status === 'cancelada').length,
            mttr: parseFloat(mttr),
            mtbf,
            availability: parseFloat(availability),
            lowStockCount: lowStock.length,
            overduePMs: overduePlans.length,
            totalPlans: plans.length,
            activePlans: plans.filter(p => p.status === 'activo').length,
            totalPersonnel: this.getPersonnel().length,
            woByType: {
                correctivo: wos.filter(w => w.type === 'correctivo').length,
                preventivo: wos.filter(w => w.type === 'preventivo').length,
                predictivo: wos.filter(w => w.type === 'predictivo').length,
                mejora: wos.filter(w => w.type === 'mejora').length,
            },
            woByPriority: {
                critica: wos.filter(w => w.priority === 'critica').length,
                alta: wos.filter(w => w.priority === 'alta').length,
                media: wos.filter(w => w.priority === 'media').length,
                baja: wos.filter(w => w.priority === 'baja').length,
            }
        };
    }

    // ---------- Asset-specific KPIs ----------
    getAssetKPIs(assetId) {
        const wos = this.getWorkOrders().filter(w => w.assetId === assetId);
        const completed = wos.filter(w => w.status === 'completada');
        const totalHours = completed.reduce((s, w) => s + (parseFloat(w.actualHours) || parseFloat(w.estimatedHours) || 0), 0);
        const mttr = completed.length > 0 ? (totalHours / completed.length).toFixed(1) : 0;
        const lastWO = completed.sort((a, b) => (b.completedDate || '').localeCompare(a.completedDate || ''))[0];
        return {
            totalWOs: wos.length,
            completedWOs: completed.length,
            pendingWOs: wos.filter(w => w.status === 'pendiente').length,
            inProgressWOs: wos.filter(w => w.status === 'en_progreso').length,
            totalHours: totalHours.toFixed(1),
            mttr: parseFloat(mttr),
            lastIntervention: lastWO ? lastWO.completedDate : null,
            correctiveCount: wos.filter(w => w.type === 'correctivo').length,
            preventiveCount: wos.filter(w => w.type === 'preventivo').length,
        };
    }

    // ---------- Work Orders by date range (for calendar) ----------
    getWorkOrdersByMonth(year, month) {
        return this.getWorkOrders().filter(w => {
            const dates = [w.createdDate, w.startDate, w.completedDate].filter(Boolean);
            return dates.some(d => {
                const dt = new Date(d + 'T12:00:00');
                return dt.getFullYear() === year && dt.getMonth() === month;
            });
        });
    }

    getPlansInMonth(year, month) {
        return this.getPreventivePlans().filter(p => {
            if (!p.nextExecution || p.status !== 'activo') return false;
            const dt = new Date(p.nextExecution + 'T12:00:00');
            return dt.getFullYear() === year && dt.getMonth() === month;
        });
    }
}

// Global store - initialized after login
let store = null;

function initStore(cedula) {
    store = new DataStore(cedula);
}
