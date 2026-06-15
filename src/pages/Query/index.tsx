import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import * as XLSX from 'xlsx';
import { mockSupplyRecords, mockSuppliers } from '@/mock/data';
import type { RiskLevel, SupplyChainRecord } from '@/types';
import { formatDate, getLevelLabel } from '@/utils/format';

const CATEGORIES = ['半导体', '纺织品', '汽车零部件', '钢材', '显示面板', '硅晶圆', '铁矿石', '农产品'] as const;
const RISK_LEVELS: RiskLevel[] = ['warning', 'severe', 'critical'];
const MILESTONES = ['订单', '生产', '运输', '交付'] as const;

type SortKey = 'supplier' | 'category' | 'orderDate' | 'deliveryDate' | 'cost';
type ViewMode = 'table' | 'timeline';

function getRecordRiskLevel(record: SupplyChainRecord): RiskLevel {
  if (record.status === '延迟风险' || record.riskEvents.length >= 2) return 'critical';
  if (record.riskEvents.length === 1) return 'severe';
  if (record.status === '生产中') return 'warning';
  return 'normal';
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

  const toggleCat = (c: string) => setCategories(prev => prev.includes(c) ? prev.filter(x => x !== c) : [...prev, c]);
  const toggleRisk = (r: RiskLevel) => setRiskLevels(prev => prev.includes(r) ? prev.filter(x => x !== r) : [...prev, r]);
  const toggleRow = (id: string) => setSelected(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const toggleAll = () => setSelected(prev => prev.size === filtered.length ? new Set() : new Set(filtered.map(r => r.id)));

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

  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortAsc(p => !p);
    else { setSortKey(key); setSortAsc(true); }
  };

  const handleExport = () => {
    if (selected.size === 0) return;
    const records = mockSupplyRecords.filter(r => selected.has(r.id));
    const rows = records.map(r => ({
      '供应商': r.supplier,
      '品类': r.category,
      '订单日期': formatDate(r.orderDate),
      '交付日期': formatDate(r.deliveryDate),
      '状态': r.status,
      '风险事件数': r.riskEvents.length,
      '金额(元)': r.cost,
      '路径': r.path.join(' → '),
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, '查询结果');
    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    const ts = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}-${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
    XLSX.writeFile(wb, `supply-chain-query-${ts}.xlsx`);
  };

  const SortHeader = ({ label, field }: { label: string; field: SortKey }) => (
    <th className="text-left py-2 px-3 cursor-pointer select-none hover:text-neon-cyan" onClick={() => handleSort(field)}>
      {label} {sortKey === field ? (sortAsc ? '↑' : '↓') : ''}
    </th>
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
              <label key={c} className="flex items-center gap-1 text-xs cursor-pointer">
                <input type="checkbox" checked={categories.includes(c)} onChange={() => toggleCat(c)} className="accent-neon-cyan" />{c}
              </label>
            ))}</div>
          </div>
          <div className="flex gap-2 items-end">
            <div><label className="text-xs text-steel block mb-1">起始日期</label><input type="date" value={dateStart} onChange={e => setDateStart(e.target.value)} className="input-field w-36" /></div>
            <div><label className="text-xs text-steel block mb-1">结束日期</label><input type="date" value={dateEnd} onChange={e => setDateEnd(e.target.value)} className="input-field w-36" /></div>
          </div>
          <div>
            <label className="text-xs text-steel block mb-1">风险等级</label>
            <div className="flex gap-2">{RISK_LEVELS.map(r => (
              <label key={r} className="flex items-center gap-1 text-xs cursor-pointer">
                <input type="checkbox" checked={riskLevels.includes(r)} onChange={() => toggleRisk(r)} className="accent-neon-cyan" />{getLevelLabel(r)}
              </label>
            ))}</div>
          </div>
          <button className="btn-primary">搜索</button>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <h2 className="section-title">查询结果</h2>
        <div className="flex gap-1">
          {(['table', 'timeline'] as ViewMode[]).map(m => (
            <button key={m} onClick={() => setView(m)} className={`px-3 py-1 rounded-lg text-xs ${view === m ? 'btn-primary' : 'btn-ghost'}`}>{m === 'table' ? '表格' : '时间线'}</button>
          ))}
        </div>
      </div>

      {view === 'table' ? (
        <div className="glass-card p-4 overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="text-steel text-xs">
              <th className="py-2 px-3"><input type="checkbox" checked={selected.size === filtered.length && filtered.length > 0} onChange={toggleAll} className="accent-neon-cyan" /></th>
              <SortHeader label="供应商" field="supplier" />
              <SortHeader label="品类" field="category" />
              <SortHeader label="订单日期" field="orderDate" />
              <SortHeader label="交付日期" field="deliveryDate" />
              <th className="text-left py-2 px-3">状态</th>
              <th className="text-left py-2 px-3">风险事件</th>
              <SortHeader label="金额" field="cost" />
              <th className="text-left py-2 px-3">路径</th>
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
        <div className="flex flex-col gap-3">
          {filtered.map(r => (
            <motion.div key={r.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="glass-card p-4">
              <div className="flex justify-between mb-3">
                <span className="text-sm font-medium text-white">{r.supplier} · {r.category}</span>
                <span className={`text-xs ${statusColor(r.status)}`}>{r.status}</span>
              </div>
              <div className="flex items-center gap-0">
                {MILESTONES.map((ms, i) => {
                  const active = i <= (r.status === '延迟风险' ? 2 : r.status === '运输中' ? 2 : r.status === '生产中' ? 1 : 3);
                  return (
                    <div key={ms} className="flex items-center flex-1">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${active ? 'bg-neon-cyan/30 text-neon-cyan border border-neon-cyan' : 'bg-deep-bg text-slate-dim border border-deep-border'}`}>{i + 1}</div>
                      <span className={`text-xs ml-1.5 ${active ? 'text-white' : 'text-slate-dim'}`}>{ms}</span>
                      {i < MILESTONES.length - 1 && <div className={`flex-1 h-px mx-2 ${active ? 'bg-neon-cyan/40' : 'bg-deep-border'}`} />}
                    </div>
                  );
                })}
              </div>
            </motion.div>
          ))}
        </div>
      )}

      <div className="flex gap-3">
        <button className="btn-primary" onClick={handleExport} disabled={selected.size === 0}>导出选中项</button>
        <span className="text-xs text-steel self-center">已选择 {selected.size} / {filtered.length} 条</span>
      </div>
    </div>
  );
}
