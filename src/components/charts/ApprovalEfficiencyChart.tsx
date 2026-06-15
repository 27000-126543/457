import {
  BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer, Legend,
} from 'recharts';

const data = [
  { type: '采购审核', avgHours: 4.2, overdueRate: 15 },
  { type: '财务复核', avgHours: 3.8, overdueRate: 8 },
  { type: '法务确认', avgHours: 5.1, overdueRate: 12 },
];

export default function ApprovalEfficiencyChart() {
  return (
    <div className="glass-card p-4">
      <h3 className="section-title mb-4">审批效率分析</h3>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={data} barCategoryGap="30%">
          <CartesianGrid strokeDasharray="3 3" stroke="#1e2a5e" />
          <XAxis dataKey="type" tick={{ fill: '#8892b0', fontSize: 12 }} />
          <YAxis tick={{ fill: '#8892b0', fontSize: 12 }} />
          <Tooltip
            contentStyle={{
              background: '#111640',
              border: '1px solid #1e2a5e',
              borderRadius: 8,
              color: '#e2e8f0',
            }}
          />
          <Legend wrapperStyle={{ color: '#8892b0' }} />
          <Bar dataKey="avgHours" name="平均处理时长(h)" fill="#00f5d4" radius={[4, 4, 0, 0]} />
          <Bar dataKey="overdueRate" name="逾期率(%)" fill="#f72585" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
