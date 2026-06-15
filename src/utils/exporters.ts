import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import * as XLSX from 'xlsx';
import type { DailyReport } from '@/types';
import { mockRiskEvents, mockApprovals, mockEmergencyPlans } from '@/mock/data';

export interface ExportOptions {
  modules?: string[];
  reportElement?: HTMLElement;
}

const DEFAULT_MODULES = ['category', 'trend', 'risk', 'approval', 'emergency'];

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function hasModule(options: ExportOptions | undefined, module: string): boolean {
  if (!options?.modules) return DEFAULT_MODULES.includes(module);
  return options.modules.includes(module);
}

export async function exportDailyReportPDF(report: DailyReport, options?: ExportOptions) {
  const tc = report.categorySummaries.length;
  const avgOT = tc > 0 ? report.categorySummaries.reduce((s, c) => s + c.onTimeRate, 0) / tc : 0;
  const avgCD = tc > 0 ? report.categorySummaries.reduce((s, c) => s + c.costDeviation, 0) / tc : 0;
  const tr = report.categorySummaries.reduce((s, c) => s + c.riskEventCount, 0);

  const container = document.createElement('div');
  container.style.position = 'absolute';
  container.style.left = '-9999px';
  container.style.top = '0';
  container.style.width = '1100px';
  container.style.background = '#ffffff';
  container.style.padding = '40px';
  container.style.fontFamily = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "PingFang SC", "Microsoft YaHei", sans-serif';
  container.style.color = '#1a1a2e';

  let html = `
    <div style="text-align: center; margin-bottom: 32px;">
      <h1 style="font-size: 28px; font-weight: bold; color: #0a0e27; margin: 0;">供应链日报</h1>
      <p style="font-size: 16px; color: #6b7280; margin-top: 8px;">报告日期：${report.date}</p>
    </div>
  `;

  html += `
    <div style="margin-bottom: 32px;">
      <h2 style="font-size: 18px; font-weight: 600; color: #0a0e27; margin-bottom: 16px; padding-bottom: 8px; border-bottom: 2px solid #00f5d4;">摘要统计</h2>
      <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px;">
        <div style="background: #f8fafc; padding: 16px; border-radius: 8px;">
          <div style="font-size: 12px; color: #6b7280;">品类数</div>
          <div style="font-size: 24px; font-weight: bold; color: #00f5d4; margin-top: 4px;">${tc}</div>
        </div>
        <div style="background: #f8fafc; padding: 16px; border-radius: 8px;">
          <div style="font-size: 12px; color: #6b7280;">平均准时率</div>
          <div style="font-size: 24px; font-weight: bold; color: #00f5d4; margin-top: 4px;">${avgOT.toFixed(1)}%</div>
        </div>
        <div style="background: #f8fafc; padding: 16px; border-radius: 8px;">
          <div style="font-size: 12px; color: #6b7280;">平均成本偏差</div>
          <div style="font-size: 24px; font-weight: bold; color: #ff6b35; margin-top: 4px;">${avgCD.toFixed(1)}%</div>
        </div>
        <div style="background: #f8fafc; padding: 16px; border-radius: 8px;">
          <div style="font-size: 12px; color: #6b7280;">风险事件总数</div>
          <div style="font-size: 24px; font-weight: bold; color: #f72585; margin-top: 4px;">${tr}</div>
        </div>
      </div>
    </div>
  `;

  if (hasModule(options, 'category')) {
    html += `
      <div style="margin-bottom: 32px; page-break-inside: avoid;">
        <h2 style="font-size: 18px; font-weight: 600; color: #0a0e27; margin-bottom: 16px; padding-bottom: 8px; border-bottom: 2px solid #00f5d4;">品类汇总</h2>
        <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
          <thead>
            <tr style="background: #00f5d4; color: #0a0e27;">
              <th style="padding: 10px 12px; text-align: left; font-weight: 600;">品类</th>
              <th style="padding: 10px 12px; text-align: left; font-weight: 600;">准时交付率%</th>
              <th style="padding: 10px 12px; text-align: left; font-weight: 600;">成本偏差%</th>
              <th style="padding: 10px 12px; text-align: left; font-weight: 600;">风险事件数</th>
              <th style="padding: 10px 12px; text-align: left; font-weight: 600;">平均处理时长h</th>
            </tr>
          </thead>
          <tbody>
    `;
    report.categorySummaries.forEach((c, i) => {
      const bgColor = i % 2 === 0 ? '#ffffff' : '#f5f8ff';
      html += `
        <tr style="background: ${bgColor}; border-bottom: 1px solid #e2e8f0;">
          <td style="padding: 10px 12px;">${c.category}</td>
          <td style="padding: 10px 12px; font-family: monospace;">${c.onTimeRate}%</td>
          <td style="padding: 10px 12px; font-family: monospace;">${c.costDeviation}%</td>
          <td style="padding: 10px 12px; font-family: monospace;">${c.riskEventCount}</td>
          <td style="padding: 10px 12px; font-family: monospace;">${c.avgResolutionTime > 0 ? `${c.avgResolutionTime}h` : '-'}</td>
        </tr>
      `;
    });
    html += `
          </tbody>
        </table>
      </div>
    `;
  }

  if (hasModule(options, 'trend')) {
    const trend30 = report.trendData.slice(-30);
    html += `
      <div style="margin-bottom: 32px; page-break-inside: avoid;">
        <h2 style="font-size: 18px; font-weight: 600; color: #0a0e27; margin-bottom: 16px; padding-bottom: 8px; border-bottom: 2px solid #00f5d4;">趋势分析（30天）</h2>
        <table style="width: 100%; border-collapse: collapse; font-size: 12px;">
          <thead>
            <tr style="background: #00f5d4; color: #0a0e27;">
              <th style="padding: 8px 10px; text-align: left; font-weight: 600;">日期</th>
              <th style="padding: 8px 10px; text-align: left; font-weight: 600;">准时率%</th>
              <th style="padding: 8px 10px; text-align: left; font-weight: 600;">成本偏差%</th>
              <th style="padding: 8px 10px; text-align: left; font-weight: 600;">风险事件数</th>
            </tr>
          </thead>
          <tbody>
    `;
    trend30.forEach((t, i) => {
      const bgColor = i % 2 === 0 ? '#ffffff' : '#f5f8ff';
      html += `
        <tr style="background: ${bgColor}; border-bottom: 1px solid #e2e8f0;">
          <td style="padding: 8px 10px;">${t.date}</td>
          <td style="padding: 8px 10px; font-family: monospace;">${t.onTimeRate}%</td>
          <td style="padding: 8px 10px; font-family: monospace;">${t.costDeviation}%</td>
          <td style="padding: 8px 10px; font-family: monospace;">${t.riskEvents}</td>
        </tr>
      `;
    });
    html += `
          </tbody>
        </table>
      </div>
    `;
  }

  if (hasModule(options, 'risk')) {
    html += `
      <div style="margin-bottom: 32px; page-break-inside: avoid;">
        <h2 style="font-size: 18px; font-weight: 600; color: #0a0e27; margin-bottom: 16px; padding-bottom: 8px; border-bottom: 2px solid #00f5d4;">风险事件明细</h2>
        <table style="width: 100%; border-collapse: collapse; font-size: 12px;">
          <thead>
            <tr style="background: #00f5d4; color: #0a0e27;">
              <th style="padding: 8px 10px; text-align: left; font-weight: 600;">日期</th>
              <th style="padding: 8px 10px; text-align: left; font-weight: 600;">供应商</th>
              <th style="padding: 8px 10px; text-align: left; font-weight: 600;">品类</th>
              <th style="padding: 8px 10px; text-align: left; font-weight: 600;">风险类型</th>
              <th style="padding: 8px 10px; text-align: left; font-weight: 600;">严重程度</th>
              <th style="padding: 8px 10px; text-align: left; font-weight: 600;">处置方案</th>
              <th style="padding: 8px 10px; text-align: left; font-weight: 600;">处理时长</th>
            </tr>
          </thead>
          <tbody>
    `;
    mockRiskEvents.slice(0, 10).forEach((e, i) => {
      const bgColor = i % 2 === 0 ? '#ffffff' : '#f5f8ff';
      html += `
        <tr style="background: ${bgColor}; border-bottom: 1px solid #e2e8f0;">
          <td style="padding: 8px 10px;">${e.date}</td>
          <td style="padding: 8px 10px;">${e.supplier}</td>
          <td style="padding: 8px 10px;">${e.category}</td>
          <td style="padding: 8px 10px;">${e.riskType}</td>
          <td style="padding: 8px 10px; font-family: monospace;">${e.severity}</td>
          <td style="padding: 8px 10px;">${e.resolution}</td>
          <td style="padding: 8px 10px; font-family: monospace;">${e.resolutionTime > 0 ? `${e.resolutionTime}h` : '-'}</td>
        </tr>
      `;
    });
    html += `
          </tbody>
        </table>
      </div>
    `;
  }

  if (hasModule(options, 'approval')) {
    const typeMap: Record<string, string> = {
      procurement_review: '采购审核',
      finance_review: '财务审核',
      legal_review: '法务审核',
    };
    const statusMap: Record<string, string> = {
      pending: '待审批',
      approved: '已批准',
      rejected: '已拒绝',
      escalated: '已升级',
    };
    html += `
      <div style="margin-bottom: 32px; page-break-inside: avoid;">
        <h2 style="font-size: 18px; font-weight: 600; color: #0a0e27; margin-bottom: 16px; padding-bottom: 8px; border-bottom: 2px solid #00f5d4;">审批进度</h2>
        <table style="width: 100%; border-collapse: collapse; font-size: 12px;">
          <thead>
            <tr style="background: #00f5d4; color: #0a0e27;">
              <th style="padding: 8px 10px; text-align: left; font-weight: 600;">审批ID</th>
              <th style="padding: 8px 10px; text-align: left; font-weight: 600;">类型</th>
              <th style="padding: 8px 10px; text-align: left; font-weight: 600;">申请人</th>
              <th style="padding: 8px 10px; text-align: left; font-weight: 600;">状态</th>
              <th style="padding: 8px 10px; text-align: left; font-weight: 600;">审批人</th>
              <th style="padding: 8px 10px; text-align: left; font-weight: 600;">提交时间</th>
              <th style="padding: 8px 10px; text-align: left; font-weight: 600;">截止时间</th>
            </tr>
          </thead>
          <tbody>
    `;
    mockApprovals.forEach((a, i) => {
      const bgColor = i % 2 === 0 ? '#ffffff' : '#f5f8ff';
      html += `
        <tr style="background: ${bgColor}; border-bottom: 1px solid #e2e8f0;">
          <td style="padding: 8px 10px; font-family: monospace;">${a.id}</td>
          <td style="padding: 8px 10px;">${typeMap[a.type] || a.type}</td>
          <td style="padding: 8px 10px;">${a.applicant}</td>
          <td style="padding: 8px 10px;">${statusMap[a.status] || a.status}</td>
          <td style="padding: 8px 10px;">${a.currentApprover}</td>
          <td style="padding: 8px 10px; font-size: 11px;">${a.submittedAt.replace('T', ' ')}</td>
          <td style="padding: 8px 10px; font-size: 11px;">${a.deadline.replace('T', ' ')}</td>
        </tr>
      `;
    });
    html += `
          </tbody>
        </table>
      </div>
    `;
  }

  if (hasModule(options, 'emergency')) {
    const typeMap: Record<string, string> = {
      supplier_switch: '供应商切换',
      route_adjust: '路线调整',
      fx_lock: '汇率锁定',
    };
    const statusMap: Record<string, string> = {
      generated: '已生成',
      under_review: '审核中',
      approved: '已批准',
      executing: '执行中',
      completed: '已完成',
    };
    html += `
      <div style="margin-bottom: 32px; page-break-inside: avoid;">
        <h2 style="font-size: 18px; font-weight: 600; color: #0a0e27; margin-bottom: 16px; padding-bottom: 8px; border-bottom: 2px solid #00f5d4;">应急方案执行情况</h2>
        <table style="width: 100%; border-collapse: collapse; font-size: 12px;">
          <thead>
            <tr style="background: #00f5d4; color: #0a0e27;">
              <th style="padding: 8px 10px; text-align: left; font-weight: 600;">方案ID</th>
              <th style="padding: 8px 10px; text-align: left; font-weight: 600;">标题</th>
              <th style="padding: 8px 10px; text-align: left; font-weight: 600;">类型</th>
              <th style="padding: 8px 10px; text-align: left; font-weight: 600;">成本影响%</th>
              <th style="padding: 8px 10px; text-align: left; font-weight: 600;">时效影响</th>
              <th style="padding: 8px 10px; text-align: left; font-weight: 600;">风险降低%</th>
              <th style="padding: 8px 10px; text-align: left; font-weight: 600;">状态</th>
            </tr>
          </thead>
          <tbody>
    `;
    mockEmergencyPlans.forEach((p, i) => {
      const bgColor = i % 2 === 0 ? '#ffffff' : '#f5f8ff';
      html += `
        <tr style="background: ${bgColor}; border-bottom: 1px solid #e2e8f0;">
          <td style="padding: 8px 10px; font-family: monospace;">${p.id}</td>
          <td style="padding: 8px 10px;">${p.title}</td>
          <td style="padding: 8px 10px;">${typeMap[p.type] || p.type}</td>
          <td style="padding: 8px 10px; font-family: monospace;">${p.costImpact}%</td>
          <td style="padding: 8px 10px;">${p.timeImpact}</td>
          <td style="padding: 8px 10px; font-family: monospace;">${p.riskReduction}%</td>
          <td style="padding: 8px 10px;">${statusMap[p.status] || p.status}</td>
        </tr>
      `;
    });
    html += `
          </tbody>
        </table>
      </div>
    `;
  }

  container.innerHTML = html;
  document.body.appendChild(container);

  try {
    const canvas = await html2canvas(container, {
      scale: 2,
      backgroundColor: '#ffffff',
      useCORS: true,
      logging: false,
    });

    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    const imgWidth = canvas.width;
    const imgHeight = canvas.height;
    const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
    const imgX = (pdfWidth - imgWidth * ratio) / 2;
    const imgYPx = imgHeight * ratio;

    let heightLeft = imgYPx;
    let position = 0;

    pdf.addImage(imgData, 'PNG', imgX, position, imgWidth * ratio, imgYPx);
    heightLeft -= pdfHeight;

    while (heightLeft >= 0) {
      position = heightLeft - imgYPx;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', imgX, position, imgWidth * ratio, imgYPx);
      heightLeft -= pdfHeight;
    }

    const blob = pdf.output('blob');
    triggerDownload(blob, `supply-chain-daily-${report.date}.pdf`);
  } finally {
    document.body.removeChild(container);
  }
}

export function exportDailyReportExcel(report: DailyReport, options?: ExportOptions) {
  const wb = XLSX.utils.book_new();

  if (hasModule(options, 'category')) {
    const s1 = [
      ['品类', '准时交付率%', '成本偏差%', '风险事件数', '平均处理时长h'],
      ...report.categorySummaries.map(c => [c.category, c.onTimeRate, c.costDeviation, c.riskEventCount, c.avgResolutionTime]),
    ];
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(s1), '品类汇总');
  }

  if (hasModule(options, 'trend')) {
    const s2 = [
      ['日期', '准时率%', '成本偏差%', '风险事件数'],
      ...report.trendData.map(t => [t.date, t.onTimeRate, t.costDeviation, t.riskEvents]),
    ];
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(s2), '趋势明细');
  }

  if (hasModule(options, 'risk')) {
    const s3 = [
      ['日期', '供应商', '品类', '风险类型', '严重程度', '处置方案', '处理时长'],
      ...mockRiskEvents.map(e => [e.date, e.supplier, e.category, e.riskType, e.severity, e.resolution, e.resolutionTime > 0 ? `${e.resolutionTime}h` : '-']),
    ];
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(s3), '风险事件明细');
  }

  if (hasModule(options, 'approval')) {
    const typeMap: Record<string, string> = {
      procurement_review: '采购审核',
      finance_review: '财务审核',
      legal_review: '法务审核',
    };
    const statusMap: Record<string, string> = {
      pending: '待审批',
      approved: '已批准',
      rejected: '已拒绝',
      escalated: '已升级',
    };
    const s4 = [
      ['审批ID', '类型', '申请人', '状态', '审批人', '提交时间', '截止时间'],
      ...mockApprovals.map(a => [a.id, typeMap[a.type] || a.type, a.applicant, statusMap[a.status] || a.status, a.currentApprover, a.submittedAt, a.deadline]),
    ];
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(s4), '审批进度');
  }

  if (hasModule(options, 'emergency')) {
    const typeMap: Record<string, string> = {
      supplier_switch: '供应商切换',
      route_adjust: '路线调整',
      fx_lock: '汇率锁定',
    };
    const statusMap: Record<string, string> = {
      generated: '已生成',
      under_review: '审核中',
      approved: '已批准',
      executing: '执行中',
      completed: '已完成',
    };
    const s5 = [
      ['方案ID', '标题', '类型', '成本影响%', '时效影响', '风险降低%', '状态'],
      ...mockEmergencyPlans.map(p => [p.id, p.title, typeMap[p.type] || p.type, `${p.costImpact}%`, p.timeImpact, `${p.riskReduction}%`, statusMap[p.status] || p.status]),
    ];
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(s5), '应急方案');
  }

  const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  triggerDownload(blob, `supply-chain-daily-${report.date}.xlsx`);
}
