import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import * as XLSX from 'xlsx';
import { mockSupplyRecords, mockSuppliers, mockRiskEvents, mockAlerts } from '@/mock/data';
import type { RiskLevel, SupplyChainRecord } from '@/types';
import { formatDate, getLevelLabel, getPlanTypeLabel, getPlanStatusLabel, getApprovalTypeLabel, getLevelBadgeClass } from '@/utils/format';
import { useAppStore } from '@/stores/appStore';

const CATEGORIES = ['半导体', '纺织品', '汽车零部件', '钢材', '显示面板', '硅晶圆', '铁矿石', '农产品'] as const;
const RISK_LEVELS: RiskLevel[] = ['warning', 'severe', 'critical'];
const MILESTONES = ['订单', '生产', '运输', '交付'] as const;
type SortKey = 'supplier' | 'category' | 'orderDate' | 'deliveryDate' | 'cost';
type ViewMode = 'table' | 'timeline';

function getRecordRiskLevel(r: SupplyChainRecord): RiskLevel {
  if (r.status === '延迟风险' || r.riskEvents.length >= 2) return 'critical';
  if (r.riskEvents.length === 1) return 'severe';
  if (r.status === '生产中') return 'warning';
  return 'normal';
}
function getApprovalStatusLabel(s: string): string {
  return s === 'pending' ? '待审批' : s === 'approved' ? '已批准' : s === 'rejected' ? '已驳回' : '已升级';
}
function getTimestamp(): string {
  const d = new Date(), p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}`;
}
function emptyS3(rid: string): Record<string, string> {
  return { '记录ID': rid, '关联告警': '', '告警等级': '', '应急方案': '', '方案类型': '', '方案状态': '', '审批节点': '', '审批人': '', '当前审批人': '', '审批状态': '', '截止时间': '', '是否超期': '-' };
}

export default function Query() {
  const [supplier, setSupplier] = useState('');
  const [categories, setCategories] = useState<string[]>([]);
  const [dateStart, setDateStart] = useState('');
  const [dateEnd, setDateEnd] = useState('');
  const [riskLevels, setRiskLevels] = useState<RiskLevel[]>([]);
  const [sortKey, setSortKey] = useState<SortKey>('orderDate');
  const [sortAsc, setSortAsc] = useState(true);
  const [view, setView] = useState<ViewMode>('table');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [showPreview, setShowPreview] = useState(false);
  const emergencyPlans = useAppStore(s => s.emergencyPlans);
  const approvals = useAppStore(s => s.approvals);

  const toggleCat = (c: string) => setCategories(p => p.includes(c) ? p.filter(x => x !== c) : [...p, c]);
  const toggleRisk = (r: RiskLevel) => setRiskLevels(p => p.includes(r) ? p.filter(x => x !== r) : [...p, r]);
  const toggleRow = (id: string) => setSelected(p => { const n = new Set(p); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const toggleAll = () => setSelected(p => p.size === filtered.length ? new Set() : new Set(filtered.map(r => r.id)));

  const filtered = useMemo(() => {
    let data = [...mockSupplyRecords];
    if (supplier) data = data.filter(r => r.supplier === supplier);
    if (categories.length) data = data.filter(r => categories.includes(r.category));
    if (dateStart) data = data.filter(r => r.orderDate >= dateStart);
    if (dateEnd) data = data.filter(r => r.deliveryDate <= dateEnd);
    if (riskLevels.length) data = data.filter(r => riskLevels.includes(getRecordRiskLevel(r)));
    data.sort((a, b) => {
      const cmp = String(a[sortKey]).localeCompare(String(b[sortKey]));
      return sortAsc ? cmp : -cmp;
    });
    return data;
  }, [supplier, categories, dateStart, dateEnd, riskLevels, sortKey, sortAsc]);

  const handleSort = (key: SortKey) => { if (sortKey === key) setSortAsc(p => !p); else { setSortKey(key); setSortAsc(true); } };

  const handleExport = () => {
    if (selected.size === 0) return;
    const records = mockSupplyRecords.filter(r => selected.has(r.id));
    const rows = records.map(r => ({ '供应商': r.supplier, '品类': r.category, '订单日期': formatDate(r.orderDate), '交付日期': formatDate(r.deliveryDate), '状态': r.status, '风险事件数': r.riskEvents.length, '金额(元)': r.cost, '路径': r.path.join(' → ') }));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(rows), '查询结果');
    XLSX.writeFile(wb, `supply-chain-query-${getTimestamp()}.xlsx`);
  };

  const handleExportReviewPackage = () => {
    if (selected.size === 0) return;
    const records = mockSupplyRecords.filter(r => selected.has(r.id));
    const s1 = records.map(r => ({ '记录ID': r.id, '供应商': r.supplier, '品类': r.category, '订单日期': formatDate(r.orderDate), '交付日期': formatDate(r.deliveryDate), '当前状态': r.status, '订单金额(元)': r.cost, '物流路径': r.path.join(' → '), '风险等级': getLevelLabel(getRecordRiskLevel(r)) }));
    const s2: Record<string, string | number>[] = [];
    records.forEach(r => {
      if (r.riskEvents.length === 0) { s2.push({ '记录ID': r.id, '供应商': r.supplier, '事件ID': '', '事件日期': '', '风险类型': '无风险事件', '严重程度%': '', '处置方案': '', '处理时长(h)': '' }); return; }
      r.riskEvents.forEach(eid => {
        const evt = mockRiskEvents.find(e => e.id === eid);
        if (evt) s2.push({ '记录ID': r.id, '供应商': r.supplier, '事件ID': evt.id, '事件日期': formatDate(evt.date), '风险类型': evt.riskType, '严重程度%': evt.severity, '处置方案': evt.resolution, '处理时长(h)': evt.resolutionTime });
      });
    });
    const now = Date.now();
    const s3: Record<string, string>[] = [];
    records.forEach(r => {
      const al = mockAlerts.filter(a => a.supplier === r.supplier);
      if (al.length === 0) { s3.push(emptyS3(r.id)); return; }
      al.forEach(a => {
        const pl = emergencyPlans.filter(p => p.triggerAlertId === a.id);
        if (pl.length === 0) { s3.push({ ...emptyS3(r.id), '关联告警': a.message, '告警等级': getLevelLabel(a.level) }); return; }
        pl.forEach(p => {
          const ap = approvals.filter(x => x.planId === p.id);
          if (ap.length === 0) { s3.push({ ...emptyS3(r.id), '关联告警': a.message, '告警等级': getLevelLabel(a.level), '应急方案': p.title, '方案类型': getPlanTypeLabel(p.type), '方案状态': getPlanStatusLabel(p.status) }); return; }
          ap.forEach(ar => {
            const isOverdue = (ar.status === 'pending' || ar.status === 'escalated') && now > new Date(ar.deadline).getTime();
            s3.push({
              '记录ID': r.id,
              '关联告警': a.message,
              '告警等级': getLevelLabel(a.level),
              '应急方案': p.title,
              '方案类型': getPlanTypeLabel(p.type),
              '方案状态': getPlanStatusLabel(p.status),
              '审批节点': getApprovalTypeLabel(ar.type),
              '审批人': ar.currentApprover,
              '当前审批人': ar.currentApprover,
              '审批状态': getApprovalStatusLabel(ar.status),
              '截止时间': formatDate(ar.deadline),
              '是否超期': isOverdue ? '是' : '否'
            });
          });
        });
      });
    });
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(s1), '基础信息');
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(s2), '风险事件');
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(s3), '处理进度');
    XLSX.writeFile(wb, `supply-chain-review-pack-${getTimestamp()}.xlsx`);
  };

  const previewData = useMemo(() => {
    const records = mockSupplyRecords.filter(r => selected.has(r.id));
    const uniqueSuppliers = [...new Set(records.map(r => r.supplier))];
    const totalCost = records.reduce((sum, r) => sum + r.cost, 0);
    const matchingAlerts = mockAlerts.filter(a => uniqueSuppliers.includes(a.supplier));

    const supplierGroups = uniqueSuppliers.map(supplier => {
      const supRecords = records.filter(r => r.supplier === supplier);
      const supCost = supRecords.reduce((sum, r) => sum + r.cost, 0);
      const riskCounts: Record<string, number> = {};
      supRecords.forEach(r => {
        const lvl = getRecordRiskLevel(r);
        riskCounts[lvl] = (riskCounts[lvl] || 0) + 1;
      });
      const supAlerts = mockAlerts.filter(a => a.supplier === supplier);
      const supPlans = emergencyPlans.filter(p => supAlerts.some(a => a.id === p.triggerAlertId));
      const supApprovals = approvals.filter(x => supPlans.some(p => p.id === x.planId));
      const approvalCounts: Record<string, number> = {};
      supApprovals.forEach(a => {
        approvalCounts[a.status] = (approvalCounts[a.status] || 0) + 1;
      });
      return { supplier, supRecords, supCost, riskCounts, supAlerts, supPlans, supApprovals, approvalCounts };
    });

    return { records, uniqueSuppliers, totalCost, matchingAlerts, supplierGroups };
  }, [selected, emergencyPlans, approvals]);

  const SortHeader = ({ label, field }: { label: string; field: SortKey }) => (
    <th className="text-left py-2 px-3 cursor-pointer select-none hover:text-neon-cyan" onClick={() => handleSort(field)}>{label} {sortKey === field ? (sortAsc ? '↑' : '↓') : ''}</th>
  );
  const statusColor = (s: string) => s === '延迟风险' ? 'text-rose-critical' : s === '运输中' ? 'text-neon-cyan' : 'text-amber-warn';

  return (
    <div className="flex flex-col gap-4 h-full overflow-y-auto">
      <div className="glass-card p-4">
        <div className="flex flex-wrap gap-4 items-end">
          <div className="w-48">
            <label className="text-xs text-steel block mb-1">供应商</label>
            <select value={supplier} onChange={e => setSupplier(e.target.value)} className="input-field">
              <option value="">全部</option>
              {mockSuppliers.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
            </select>
          </div>
          <div className="w-64">
            <label className="text-xs text-steel block mb-1">品类</label>
            <div className="flex flex-wrap gap-2">{CATEGORIES.map(c => (
              <label key={c} className="flex items-center gap-1 text-xs cursor-pointer"><input type="checkbox" checked={categories.includes(c)} onChange={() => toggleCat(c)} className="accent-neon-cyan" />{c}</label>
            ))}</div>
          </div>
          <div className="flex gap-2 items-end">
            <div><label className="text-xs text-steel block mb-1">起始日期</label><input type="date" value={dateStart} onChange={e => setDateStart(e.target.value)} className="input-field w-36" /></div>
            <div><label className="text-xs text-steel block mb-1">结束日期</label><input type="date" value={dateEnd} onChange={e => setDateEnd(e.target.value)} className="input-field w-36" /></div>
          </div>
          <div>
            <label className="text-xs text-steel block mb-1">风险等级</label>
            <div className="flex gap-2">{RISK_LEVELS.map(r => (
              <label key={r} className="flex items-center gap-1 text-xs cursor-pointer"><input type="checkbox" checked={riskLevels.includes(r)} onChange={() => toggleRisk(r)} className="accent-neon-cyan" />{getLevelLabel(r)}</label>
            ))}</div>
          </div>
          <button className="btn-primary">搜索</button>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <h2 className="section-title">查询结果</h2>
        <div className="flex gap-1">{(['table', 'timeline'] as ViewMode[]).map(m => (
          <button key={m} onClick={() => setView(m)} className={`px-3 py-1 rounded-lg text-xs ${view === m ? 'btn-primary' : 'btn-ghost'}`}>{m === 'table' ? '表格' : '时间线'}</button>
        ))}</div>
      </div>
      {view === 'table' ? (
        <div className="glass-card p-4 overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="text-steel text-xs">
              <th className="py-2 px-3"><input type="checkbox" checked={selected.size === filtered.length && filtered.length > 0} onChange={toggleAll} className="accent-neon-cyan" /></th>
              <SortHeader label="供应商" field="supplier" /><SortHeader label="品类" field="category" /><SortHeader label="订单日期" field="orderDate" /><SortHeader label="交付日期" field="deliveryDate" />
              <th className="text-left py-2 px-3">状态</th><th className="text-left py-2 px-3">风险事件</th><SortHeader label="金额" field="cost" /><th className="text-left py-2 px-3">路径</th>
            </tr></thead>
            <tbody>{filtered.map(r => (
              <tr key={r.id} className="border-t border-deep-border/30 hover:bg-white/5">
                <td className="py-2 px-3"><input type="checkbox" checked={selected.has(r.id)} onChange={() => toggleRow(r.id)} className="accent-neon-cyan" /></td>
                <td className="py-2 px-3 text-white">{r.supplier}</td>
                <td className="py-2 px-3 text-steel">{r.category}</td>
                <td className="py-2 px-3 font-mono text-steel">{formatDate(r.orderDate)}</td>
                <td className="py-2 px-3 font-mono text-steel">{formatDate(r.deliveryDate)}</td>
                <td className={`py-2 px-3 ${statusColor(r.status)}`}>{r.status}</td>
                <td className="py-2 px-3">{r.riskEvents.length > 0 ? <span className="risk-badge-severe">{r.riskEvents.length}</span> : <span className="risk-badge-normal">0</span>}</td>
                <td className="py-2 px-3 font-mono text-white">¥{(r.cost / 10000).toFixed(0)}万</td>
                <td className="py-2 px-3 text-xs text-steel">{r.path.join(' → ')}</td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      ) : (
        <div className="flex flex-col gap-3">{filtered.map(r => (
          <motion.div key={r.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="glass-card p-4">
            <div className="flex justify-between mb-3">
              <span className="text-sm font-medium text-white">{r.supplier} · {r.category}</span>
              <span className={`text-xs ${statusColor(r.status)}`}>{r.status}</span>
            </div>
            <div className="flex items-center gap-0">{MILESTONES.map((ms, i) => {
              const active = i <= (r.status === '延迟风险' ? 2 : r.status === '运输中' ? 2 : r.status === '生产中' ? 1 : 3);
              return (
                <div key={ms} className="flex items-center flex-1">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${active ? 'bg-neon-cyan/30 text-neon-cyan border border-neon-cyan' : 'bg-deep-bg text-slate-dim border border-deep-border'}`}>{i + 1}</div>
                  <span className={`text-xs ml-1.5 ${active ? 'text-white' : 'text-slate-dim'}`}>{ms}</span>
                  {i < MILESTONES.length - 1 && <div className={`flex-1 h-px mx-2 ${active ? 'bg-neon-cyan/40' : 'bg-deep-border'}`} />}
                </div>
              );
            })}</div>
          </motion.div>
        ))}</div>
      )}
      <div className="flex gap-3">
        <button className="btn-primary" onClick={handleExport} disabled={selected.size === 0}>导出选中项</button>
        <button className="btn-primary" onClick={() => setShowPreview(true)} disabled={selected.size === 0}>生成风险复盘包</button>
        <span className="text-xs text-steel self-center">已选择 {selected.size} / {filtered.length} 条</span>
      </div>

      {showPreview && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="glass-card w-[900px] max-h-[80vh] overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="section-title mb-0">风险复盘包预览</h2>
              <button className="btn-ghost text-sm" onClick={() => setShowPreview(false)}>✕</button>
            </div>

            <div className="grid grid-cols-4 gap-4 mb-6">
              <div className="glass-card p-4">
                <div className="text-xs text-steel mb-1">选中记录数</div>
                <div className="text-2xl font-bold text-white">{previewData.records.length}</div>
              </div>
              <div className="glass-card p-4">
                <div className="text-xs text-steel mb-1">涉及供应商数</div>
                <div className="text-2xl font-bold text-white">{previewData.uniqueSuppliers.length}</div>
              </div>
              <div className="glass-card p-4">
                <div className="text-xs text-steel mb-1">总影响金额</div>
                <div className="text-2xl font-bold text-neon-cyan">¥{(previewData.totalCost / 10000).toFixed(0)}万</div>
              </div>
              <div className="glass-card p-4">
                <div className="text-xs text-steel mb-1">关联告警数</div>
                <div className="text-2xl font-bold text-amber-warn">{previewData.matchingAlerts.length}</div>
              </div>
            </div>

            <div className="flex flex-col gap-4 mb-6">
              <h3 className="text-sm font-medium text-white">按供应商分组</h3>
              {previewData.supplierGroups.map((g) => (
                <div key={g.supplier} className="glass-card p-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-medium text-white">{g.supplier}</span>
                    <span className="text-sm font-mono text-neon-cyan">¥{(g.supCost / 10000).toFixed(0)}万</span>
                  </div>
                  <div className="flex flex-col gap-3">
                    <div>
                      <div className="text-xs text-steel mb-1">风险等级分布</div>
                      <div className="flex gap-2 flex-wrap">
                        {Object.entries(g.riskCounts).map(([lvl, cnt]) => (
                          <span key={lvl} className={`${getLevelBadgeClass(lvl as RiskLevel)}`}>
                            {getLevelLabel(lvl as RiskLevel)} × {cnt}
                          </span>
                        ))}
                        {Object.keys(g.riskCounts).length === 0 && <span className="risk-badge-normal">正常 × {g.supRecords.length}</span>}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-steel mb-1">关联告警</div>
                      <div className="flex flex-col gap-1">
                        {g.supAlerts.length === 0 ? (
                          <span className="text-xs text-slate-dim">无关联告警</span>
                        ) : (
                          g.supAlerts.map(a => (
                            <div key={a.id} className="flex items-center gap-2">
                              <span className={getLevelBadgeClass(a.level)}>{getLevelLabel(a.level)}</span>
                              <span className="text-xs text-steel truncate max-w-[500px]">{a.message}</span>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-steel mb-1">关联方案</div>
                      <span className="text-sm text-white">{g.supPlans.length} 个</span>
                    </div>
                    <div>
                      <div className="text-xs text-steel mb-1">审批状态</div>
                      <div className="flex gap-2 flex-wrap">
                        {Object.entries(g.approvalCounts).map(([st, cnt]) => (
                          <span key={st} className={`text-xs px-2 py-0.5 rounded ${st === 'pending' ? 'bg-amber-warn/20 text-amber-warn' : st === 'approved' ? 'bg-neon-cyan/20 text-neon-cyan' : st === 'rejected' ? 'bg-rose-critical/20 text-rose-critical' : 'bg-purple-500/20 text-purple-400'}`}>
                            {getApprovalStatusLabel(st)} × {cnt}
                          </span>
                        ))}
                        {Object.keys(g.approvalCounts).length === 0 && <span className="text-xs text-slate-dim">无审批记录</span>}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex gap-3 justify-end">
              <button className="btn-ghost" onClick={() => setShowPreview(false)}>取消</button>
              <button className="btn-primary" onClick={() => { handleExportReviewPackage(); setShowPreview(false); }}>确认导出</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
