import { useState, useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { mockDailyReport, mockRiskEvents, mockApprovals, mockEmergencyPlans } from '@/mock/data';
import { getRiskIndexColor, getPlanStatusLabel, getApprovalTypeLabel } from '@/utils/format';
import { exportDailyReportPDF, exportDailyReportExcel } from '@/utils/exporters';

interface SubscriptionConfig {
  id: string;
  modules: string[];
  recipients: string[];
  frequency: 'daily' | 'weekly' | 'monthly';
  formats: ('pdf' | 'excel')[];
  enabled: boolean;
  createdAt: string;
}
interface SendRecord {
  id: string;
  subscriptionId: string;
  sentAt: string;
  modules: string[];
  formats: string[];
  recipients: string[];
  status: 'success' | 'failed';
}

const mockSubscriptions: SubscriptionConfig[] = [
  { id: 'SUB001', modules: ['category', 'trend'], recipients: ['ceo@company.com', 'cfo@company.com'], frequency: 'daily', formats: ['pdf', 'excel'], enabled: true, createdAt: '2026-06-01T09:00:00' },
  { id: 'SUB002', modules: ['category', 'risk', 'emergency'], recipients: ['ops@company.com'], frequency: 'weekly', formats: ['excel'], enabled: false, createdAt: '2026-06-05T10:00:00' },
];
const mockSendRecords: SendRecord[] = [
  { id: 'SR001', subscriptionId: 'SUB001', sentAt: '2026-06-15T06:00:00', modules: ['category', 'trend'], formats: ['pdf', 'excel'], recipients: ['ceo@company.com', 'cfo@company.com'], status: 'success' },
  { id: 'SR002', subscriptionId: 'SUB001', sentAt: '2026-06-14T06:00:00', modules: ['category', 'trend'], formats: ['pdf', 'excel'], recipients: ['ceo@company.com', 'cfo@company.com'], status: 'success' },
  { id: 'SR003', subscriptionId: 'SUB001', sentAt: '2026-06-13T06:00:00', modules: ['category', 'trend'], formats: ['pdf', 'excel'], recipients: ['ceo@company.com', 'cfo@company.com'], status: 'success' },
  { id: 'SR004', subscriptionId: 'SUB002', sentAt: '2026-06-10T06:00:00', modules: ['category', 'risk', 'emergency'], formats: ['excel'], recipients: ['ops@company.com'], status: 'failed' },
];

const RANGES = [7, 30, 90] as const;

const MODULE_CONFIG = [
  { key: 'category', label: '品类汇总', defaultChecked: true },
  { key: 'trend', label: '趋势分析', defaultChecked: true },
  { key: 'risk', label: '风险事件明细', defaultChecked: false },
  { key: 'approval', label: '审批进度', defaultChecked: false },
  { key: 'emergency', label: '应急方案执行情况', defaultChecked: false },
] as const;

type ModuleKey = typeof MODULE_CONFIG[number]['key'];

function StatCard({ label, value, unit }: { label: string; value: string | number; unit?: string }) {
  return (
    <div className="glass-card p-4 flex-1">
      <div className="text-steel text-xs mb-1">{label}</div>
      <div className="stat-value text-neon-cyan">{value}{unit && <span className="text-sm text-steel ml-1">{unit}</span>}</div>
    </div>
  );
}

export default function Reports() {
  const [range, setRange] = useState<number>(30);
  const [selectedModules, setSelectedModules] = useState<Set<ModuleKey>>(
    new Set(MODULE_CONFIG.filter(m => m.defaultChecked).map(m => m.key))
  );
  const [subscriptions, setSubscriptions] = useState<SubscriptionConfig[]>(mockSubscriptions);
  const [editingSub, setEditingSub] = useState<SubscriptionConfig | null>(null);
  const [subModules, setSubModules] = useState<Set<string>>(new Set());
  const [subRecipients, setSubRecipients] = useState('');
  const [subFrequency, setSubFrequency] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const [subFormats, setSubFormats] = useState<Set<'pdf' | 'excel'>>(new Set(['pdf']));
  const [subEnabled, setSubEnabled] = useState(true);
  const [showAlert, setShowAlert] = useState(false);
  const { categorySummaries, trendData } = mockDailyReport;

  const filtered = useMemo(() => trendData.slice(-range), [trendData, range]);
  const totalCategories = categorySummaries.length;
  const avgOnTime = (categorySummaries.reduce((s, c) => s + c.onTimeRate, 0) / totalCategories).toFixed(1);
  const avgCostDev = (categorySummaries.reduce((s, c) => s + c.costDeviation, 0) / totalCategories).toFixed(1);
  const totalRisk = categorySummaries.reduce((s, c) => s + c.riskEventCount, 0);

  const sortedRecords = useMemo(
    () => [...mockSendRecords].sort((a, b) => new Date(b.sentAt).getTime() - new Date(a.sentAt).getTime()).slice(0, 10),
    []
  );

  const toggleModule = (key: ModuleKey) => {
    setSelectedModules(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const modulesList = Array.from(selectedModules);

  const hasModule = (key: ModuleKey) => selectedModules.has(key);

  const handleExport = (type: 'pdf' | 'excel') => {
    if (selectedModules.size === 0) {
      setShowAlert(true);
      setTimeout(() => setShowAlert(false), 2000);
      return;
    }
    if (type === 'pdf') {
      exportDailyReportPDF(mockDailyReport, { modules: modulesList });
    } else {
      exportDailyReportExcel(mockDailyReport, { modules: modulesList });
    }
  };

  const getFrequencyLabel = (f: 'daily' | 'weekly' | 'monthly') =>
    f === 'daily' ? '每日' : f === 'weekly' ? '每周' : '每月';

  const toggleSubEnabled = (id: string) => {
    setSubscriptions(prev => prev.map(s => s.id === id ? { ...s, enabled: !s.enabled } : s));
  };

  const toggleSubModule = (key: string) => {
    setSubModules(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const toggleSubFormat = (f: 'pdf' | 'excel') => {
    setSubFormats(prev => {
      const next = new Set(prev);
      if (next.has(f)) next.delete(f);
      else next.add(f);
      return next;
    });
  };

  const startNewSub = () => {
    setEditingSub(null);
    setSubModules(new Set());
    setSubRecipients('');
    setSubFrequency('daily');
    setSubFormats(new Set(['pdf']));
    setSubEnabled(true);
  };

  const startEditSub = (sub: SubscriptionConfig) => {
    setEditingSub(sub);
    setSubModules(new Set(sub.modules));
    setSubRecipients(sub.recipients.join(', '));
    setSubFrequency(sub.frequency);
    setSubFormats(new Set(sub.formats));
    setSubEnabled(sub.enabled);
  };

  const cancelEdit = () => {
    setEditingSub(null);
    setSubModules(new Set());
    setSubRecipients('');
    setSubFrequency('daily');
    setSubFormats(new Set(['pdf']));
    setSubEnabled(true);
  };

  const saveSubscription = () => {
    if (subModules.size === 0 || !subRecipients.trim() || subFormats.size === 0) return;
    const recipients = subRecipients.split(',').map(r => r.trim()).filter(Boolean);
    if (editingSub) {
      setSubscriptions(prev => prev.map(s => s.id === editingSub.id ? {
        ...s,
        modules: Array.from(subModules),
        recipients,
        frequency: subFrequency,
        formats: Array.from(subFormats),
        enabled: subEnabled,
      } : s));
    } else {
      const newSub: SubscriptionConfig = {
        id: `SUB${String(subscriptions.length + 1).padStart(3, '0')}`,
        modules: Array.from(subModules),
        recipients,
        frequency: subFrequency,
        formats: Array.from(subFormats),
        enabled: subEnabled,
        createdAt: new Date().toISOString(),
      };
      setSubscriptions(prev => [...prev, newSub]);
    }
    cancelEdit();
  };

  const sendNow = (id: string) => {
    const sub = subscriptions.find(s => s.id === id);
    if (!sub || !sub.enabled) return;
    alert(`已触发订阅 ${id} 立即发送`);
  };

  return (
    <div className="flex flex-col gap-4 h-full overflow-y-auto">
      <div className="flex items-center gap-4">
        <input type="date" defaultValue={mockDailyReport.date} className="input-field w-48" />
        <h2 className="section-title">日报概览</h2>
      </div>

      <div className="glass-card p-4">
        <h3 className="section-title mb-3">日报模板配置</h3>
        <div className="flex flex-wrap gap-4">
          {MODULE_CONFIG.map(m => (
            <label key={m.key} className="flex items-center gap-2 text-sm cursor-pointer select-none">
              <input
                type="checkbox"
                checked={selectedModules.has(m.key)}
                onChange={() => toggleModule(m.key)}
                className="accent-neon-cyan w-4 h-4"
              />
              <span className={selectedModules.has(m.key) ? 'text-white' : 'text-steel'}>{m.label}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="flex gap-3">
        <StatCard label="品类数" value={totalCategories} />
        <StatCard label="平均准时率" value={avgOnTime} unit="%" />
        <StatCard label="平均成本偏差" value={avgCostDev} unit="%" />
        <StatCard label="风险事件总数" value={totalRisk} />
      </div>

      {selectedModules.size === 0 && (
        <div className="glass-card p-4 border-amber-warn/50 bg-amber-warn/10">
          <div className="text-amber-warn text-sm">⚠️ 请至少勾选一个日报模块</div>
        </div>
      )}

      {showAlert && (
        <div className="glass-card p-3 border-amber-warn/50 bg-amber-warn/10">
          <div className="text-amber-warn text-sm">请先至少选择一个模块</div>
        </div>
      )}

      {hasModule('category') && (
        <div className="glass-card p-4">
          <h3 className="section-title mb-3">品类汇总</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-steel text-xs">
                  <th className="text-left py-2 px-3">品类</th>
                  <th className="text-left py-2 px-3">准时交付率</th>
                  <th className="text-left py-2 px-3">成本偏差</th>
                  <th className="text-left py-2 px-3">风险事件数</th>
                  <th className="text-left py-2 px-3">平均处理时长</th>
                </tr>
              </thead>
              <tbody>
                {categorySummaries.map(c => (
                  <tr key={c.category} className="border-t border-deep-border/30">
                    <td className="py-2 px-3 text-white">{c.category}</td>
                    <td className={`py-2 px-3 font-mono ${c.onTimeRate < 80 ? 'text-rose-critical' : c.onTimeRate < 85 ? 'text-amber-warn' : 'text-neon-cyan'}`}>{c.onTimeRate}%</td>
                    <td className="py-2 px-3 font-mono text-amber-warn">{c.costDeviation}%</td>
                    <td className="py-2 px-3 font-mono" style={{ color: getRiskIndexColor(c.riskEventCount * 20 + 40) }}>{c.riskEventCount}</td>
                    <td className="py-2 px-3 font-mono text-steel">{c.avgResolutionTime > 0 ? `${c.avgResolutionTime}h` : '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {hasModule('trend') && (
        <div className="glass-card p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="section-title">趋势分析</h3>
            <div className="flex gap-2">
              {RANGES.map(r => (
                <button key={r} onClick={() => setRange(r)} className={`px-3 py-1 rounded-lg text-xs transition-all ${range === r ? 'btn-primary' : 'btn-ghost'}`}>{r}天</button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            {[
              { key: 'onTimeRate', label: '准时率趋势', color: '#00f5d4' },
              { key: 'costDeviation', label: '成本偏差趋势', color: '#ff6b35' },
              { key: 'riskEvents', label: '风险事件趋势', color: '#f72585' },
            ].map(chart => (
              <div key={chart.key}>
                <div className="text-xs text-steel mb-2 text-center">{chart.label}</div>
                <ResponsiveContainer width="100%" height={160}>
                  <LineChart data={filtered}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e2a5e" />
                    <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#8892b0' }} tickFormatter={(v: string) => v.slice(5)} />
                    <YAxis tick={{ fontSize: 10, fill: '#8892b0' }} width={36} />
                    <Tooltip contentStyle={{ background: '#111640', border: '1px solid #1e2a5e', borderRadius: 8, fontSize: 12 }} />
                    <Line type="monotone" dataKey={chart.key} stroke={chart.color} strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ))}
          </div>
        </div>
      )}

      {hasModule('risk') && (
        <div className="glass-card p-4">
          <h3 className="section-title mb-3">风险事件明细</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-steel text-xs">
                  <th className="text-left py-2 px-3">日期</th>
                  <th className="text-left py-2 px-3">供应商</th>
                  <th className="text-left py-2 px-3">品类</th>
                  <th className="text-left py-2 px-3">风险类型</th>
                  <th className="text-left py-2 px-3">严重程度</th>
                  <th className="text-left py-2 px-3">处置方案</th>
                  <th className="text-left py-2 px-3">处理时长</th>
                </tr>
              </thead>
              <tbody>
                {mockRiskEvents.map(e => (
                  <tr key={e.id} className="border-t border-deep-border/30">
                    <td className="py-2 px-3 font-mono text-steel">{e.date}</td>
                    <td className="py-2 px-3 text-white">{e.supplier}</td>
                    <td className="py-2 px-3 text-steel">{e.category}</td>
                    <td className="py-2 px-3 text-white">{e.riskType}</td>
                    <td className="py-2 px-3 font-mono" style={{ color: getRiskIndexColor(e.severity) }}>{e.severity}</td>
                    <td className="py-2 px-3 text-steel">{e.resolution}</td>
                    <td className="py-2 px-3 font-mono text-steel">{e.resolutionTime > 0 ? `${e.resolutionTime}h` : '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {hasModule('approval') && (
        <div className="glass-card p-4">
          <h3 className="section-title mb-3">审批进度</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-steel text-xs">
                  <th className="text-left py-2 px-3">审批ID</th>
                  <th className="text-left py-2 px-3">类型</th>
                  <th className="text-left py-2 px-3">申请人</th>
                  <th className="text-left py-2 px-3">状态</th>
                  <th className="text-left py-2 px-3">审批人</th>
                  <th className="text-left py-2 px-3">提交时间</th>
                  <th className="text-left py-2 px-3">截止时间</th>
                </tr>
              </thead>
              <tbody>
                {mockApprovals.map(a => (
                  <tr key={a.id} className="border-t border-deep-border/30">
                    <td className="py-2 px-3 font-mono text-neon-cyan">{a.id}</td>
                    <td className="py-2 px-3 text-white">{getApprovalTypeLabel(a.type)}</td>
                    <td className="py-2 px-3 text-steel">{a.applicant}</td>
                    <td className="py-2 px-3">
                      <span className={`risk-badge-${a.status === 'approved' ? 'normal' : a.status === 'escalated' ? 'warning' : a.status === 'rejected' ? 'severe' : 'warning'}`}>
                        {a.status === 'approved' ? '已批准' : a.status === 'pending' ? '待审批' : a.status === 'rejected' ? '已驳回' : '已升级'}
                      </span>
                    </td>
                    <td className="py-2 px-3 text-steel">{a.currentApprover}</td>
                    <td className="py-2 px-3 font-mono text-xs text-steel">{a.submittedAt.replace('T', ' ')}</td>
                    <td className="py-2 px-3 font-mono text-xs text-steel">{a.deadline.replace('T', ' ')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {hasModule('emergency') && (
        <div className="glass-card p-4">
          <h3 className="section-title mb-3">应急方案执行情况</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-steel text-xs">
                  <th className="text-left py-2 px-3">方案ID</th>
                  <th className="text-left py-2 px-3">标题</th>
                  <th className="text-left py-2 px-3">类型</th>
                  <th className="text-left py-2 px-3">成本影响</th>
                  <th className="text-left py-2 px-3">时效影响</th>
                  <th className="text-left py-2 px-3">风险降低</th>
                  <th className="text-left py-2 px-3">状态</th>
                </tr>
              </thead>
              <tbody>
                {mockEmergencyPlans.map(p => (
                  <tr key={p.id} className="border-t border-deep-border/30">
                    <td className="py-2 px-3 font-mono text-neon-cyan">{p.id}</td>
                    <td className="py-2 px-3 text-white">{p.title}</td>
                    <td className="py-2 px-3 text-steel">{p.type === 'supplier_switch' ? '供应商切换' : p.type === 'route_adjust' ? '路线调整' : '汇率锁定'}</td>
                    <td className="py-2 px-3 font-mono text-amber-warn">+{p.costImpact}%</td>
                    <td className="py-2 px-3 text-steel">{p.timeImpact}</td>
                    <td className="py-2 px-3 font-mono text-neon-cyan">-{p.riskReduction}%</td>
                    <td className="py-2 px-3">
                      <span className={
                        p.status === 'completed' ? 'risk-badge-normal' :
                        p.status === 'approved' ? 'risk-badge-normal' :
                        p.status === 'executing' ? 'risk-badge-warning' :
                        p.status === 'under_review' ? 'risk-badge-warning' :
                        'bg-slate-dim/20 text-slate-dim border-slate-dim/30 rounded px-2 py-0.5 text-xs'
                      }>
                        {getPlanStatusLabel(p.status)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="glass-card p-4">
        <h3 className="section-title mb-4">定时订阅配置</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-medium text-white">现有订阅</h4>
              <button onClick={startNewSub} className="btn-ghost text-xs px-3 py-1">新建订阅</button>
            </div>
            <div className="space-y-2">
              {subscriptions.map(sub => (
                <div key={sub.id} className="bg-deep-bg/40 rounded-lg p-3 border border-deep-border/30">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-neon-cyan text-sm">{sub.id}</span>
                      <span className="text-xs text-steel">{getFrequencyLabel(sub.frequency)}</span>
                    </div>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <span className="text-xs text-steel">{sub.enabled ? '已启用' : '已停用'}</span>
                      <input
                        type="checkbox"
                        checked={sub.enabled}
                        onChange={() => toggleSubEnabled(sub.id)}
                        className="accent-neon-cyan w-4 h-4"
                      />
                    </label>
                  </div>
                  <div className="flex flex-wrap gap-1 mb-2">
                    {sub.formats.map(f => (
                      <span key={f} className="px-2 py-0.5 rounded text-xs bg-neon-cyan/10 text-neon-cyan border border-neon-cyan/20">
                        {f.toUpperCase()}
                      </span>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => startEditSub(sub)} className="btn-ghost text-xs px-3 py-1">编辑</button>
                    {sub.enabled && (
                      <button onClick={() => sendNow(sub.id)} className="btn-primary text-xs px-3 py-1">立即发送</button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div>
            <h4 className="text-sm font-medium text-white mb-3">
              {editingSub ? `编辑订阅 ${editingSub.id}` : '新建订阅'}
            </h4>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-steel mb-1 block">选择模块</label>
                <div className="flex flex-wrap gap-3">
                  {MODULE_CONFIG.map(m => (
                    <label key={m.key} className="flex items-center gap-2 text-sm cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={subModules.has(m.key)}
                        onChange={() => toggleSubModule(m.key)}
                        className="accent-neon-cyan w-4 h-4"
                      />
                      <span className={subModules.has(m.key) ? 'text-white' : 'text-steel'}>{m.label}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs text-steel mb-1 block">收件人（逗号分隔）</label>
                <textarea
                  value={subRecipients}
                  onChange={(e) => setSubRecipients(e.target.value)}
                  className="input-field h-16 resize-none"
                  placeholder="email1@company.com, email2@company.com"
                />
              </div>
              <div>
                <label className="text-xs text-steel mb-1 block">发送频率</label>
                <div className="flex gap-4">
                  {(['daily', 'weekly', 'monthly'] as const).map(f => (
                    <label key={f} className="flex items-center gap-2 text-sm cursor-pointer select-none">
                      <input
                        type="radio"
                        name="frequency"
                        checked={subFrequency === f}
                        onChange={() => setSubFrequency(f)}
                        className="accent-neon-cyan w-4 h-4"
                      />
                      <span className={subFrequency === f ? 'text-white' : 'text-steel'}>{getFrequencyLabel(f)}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs text-steel mb-1 block">导出格式</label>
                <div className="flex gap-4">
                  {(['pdf', 'excel'] as const).map(f => (
                    <label key={f} className="flex items-center gap-2 text-sm cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={subFormats.has(f)}
                        onChange={() => toggleSubFormat(f)}
                        className="accent-neon-cyan w-4 h-4"
                      />
                      <span className={subFormats.has(f) ? 'text-white' : 'text-steel'}>{f.toUpperCase()}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={subEnabled}
                    onChange={(e) => setSubEnabled(e.target.checked)}
                    className="accent-neon-cyan w-4 h-4"
                  />
                  <span className={subEnabled ? 'text-white' : 'text-steel'}>启用订阅</span>
                </label>
              </div>
              <div className="flex gap-2 pt-1">
                <button onClick={saveSubscription} className="btn-primary text-xs px-4 py-2">保存订阅</button>
                <button onClick={cancelEdit} className="btn-ghost text-xs px-4 py-2">取消</button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="glass-card p-4">
        <h3 className="section-title mb-3">发送记录</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-steel text-xs">
                <th className="text-left py-2 px-3">发送时间</th>
                <th className="text-left py-2 px-3">订阅ID</th>
                <th className="text-left py-2 px-3">模块数量</th>
                <th className="text-left py-2 px-3">格式</th>
                <th className="text-left py-2 px-3">收件人数</th>
                <th className="text-left py-2 px-3">状态</th>
              </tr>
            </thead>
            <tbody>
              {sortedRecords.map(r => (
                <tr key={r.id} className="border-t border-deep-border/30">
                  <td className="py-2 px-3 font-mono text-steel text-xs">{r.sentAt.replace('T', ' ')}</td>
                  <td className="py-2 px-3 font-mono text-neon-cyan">{r.subscriptionId}</td>
                  <td className="py-2 px-3 text-white">{r.modules.length}</td>
                  <td className="py-2 px-3 text-white">{r.formats.map(f => f.toUpperCase()).join(', ')}</td>
                  <td className="py-2 px-3 text-white">{r.recipients.length}</td>
                  <td className="py-2 px-3">
                    <span className={r.status === 'success' ? 'risk-badge-normal' : 'risk-badge-severe'}>
                      {r.status === 'success' ? '成功' : '失败'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex gap-3">
        <button
          className={`btn-primary ${selectedModules.size === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
          onClick={() => handleExport('pdf')}
          disabled={selectedModules.size === 0}
        >
          导出PDF
        </button>
        <button
          className={`btn-ghost ${selectedModules.size === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
          onClick={() => handleExport('excel')}
          disabled={selectedModules.size === 0}
        >
          导出Excel
        </button>
      </div>
    </div>
  );
}
