import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import type { DailyReport } from '@/types';

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

function drawGrid(doc: jsPDF, cx: number, cy: number, cw: number, ch: number, maxV: number, minV: number = 0) {
  const range = maxV - minV || 1;
  doc.setDrawColor(220, 220, 220);
  doc.setLineWidth(0.2);
  for (let i = 0; i <= 4; i++) {
    const gy = cy + (ch / 4) * i;
    doc.line(cx, gy, cx + cw, gy);
    const v = maxV - (range / 4) * i;
    doc.setFontSize(7);
    doc.setTextColor(150, 150, 150);
    doc.text(v.toFixed(1), cx - 2, gy + 2, { align: 'right' });
  }
  doc.setDrawColor(180, 180, 180);
  doc.line(cx, cy, cx, cy + ch);
  doc.line(cx, cy + ch, cx + cw, cy + ch);
}

function drawXLabels(doc: jsPDF, cx: number, cy: number, cw: number, ch: number, dates: string[], step: number) {
  if (dates.length === 0) return;
  doc.setFontSize(6);
  doc.setTextColor(150, 150, 150);
  const lblStep = Math.ceil(dates.length / 5);
  for (let i = 0; i < dates.length; i += lblStep) {
    doc.text(dates[i].slice(5), cx + step * i, cy + ch + 8, { align: 'center' });
  }
}

function drawLineChart(
  doc: jsPDF,
  data: number[],
  x: number,
  y: number,
  w: number,
  h: number,
  color: [number, number, number],
  label: string,
  dates: string[]
) {
  const pad = 20, cx = x + pad, cy = y + pad, cw = w - pad * 2, ch = h - pad - 10;
  doc.setFontSize(10);
  doc.setTextColor(80, 80, 80);
  doc.text(label, x + w / 2, y + 8, { align: 'center' });
  const minV = Math.min(...data), maxV = Math.max(...data);
  drawGrid(doc, cx, cy, cw, ch, maxV, minV);
  const range = maxV - minV || 1;
  const sx = cw / (data.length - 1 || 1);
  doc.setDrawColor(color[0], color[1], color[2]);
  doc.setLineWidth(1);
  for (let i = 0; i < data.length; i++) {
    const px = cx + sx * i, py = cy + ch - ((data[i] - minV) / range) * ch;
    i === 0 ? doc.moveTo(px, py) : doc.lineTo(px, py);
  }
  doc.stroke();
  doc.setFillColor(color[0], color[1], color[2]);
  for (let i = 0; i < data.length; i++) {
    const px = cx + sx * i, py = cy + ch - ((data[i] - minV) / range) * ch;
    doc.circle(px, py, 1, 'F');
  }
  drawXLabels(doc, cx, cy, cw, ch, dates, sx);
}

function drawBarChart(
  doc: jsPDF,
  data: number[],
  x: number,
  y: number,
  w: number,
  h: number,
  color: [number, number, number],
  label: string,
  dates: string[]
) {
  const pad = 20, cx = x + pad, cy = y + pad, cw = w - pad * 2, ch = h - pad - 10;
  doc.setFontSize(10);
  doc.setTextColor(80, 80, 80);
  doc.text(label, x + w / 2, y + 8, { align: 'center' });
  const maxV = Math.max(...data, 1);
  drawGrid(doc, cx, cy, cw, ch, maxV);
  const gap = 1, bw = (cw - gap * (data.length - 1)) / data.length;
  doc.setFillColor(color[0], color[1], color[2]);
  for (let i = 0; i < data.length; i++) {
    const bx = cx + (bw + gap) * i, bh = (data[i] / maxV) * ch;
    doc.rect(bx, cy + ch - bh, bw, bh, 'F');
  }
  drawXLabels(doc, cx, cy, cw, ch, dates, bw + gap);
}

function drawTrendRow(
  doc: jsPDF,
  y: number,
  cw: number,
  ch: number,
  data: { onTimeRate: number; costDeviation: number; riskEvents: number; date: string }[],
  label: string
) {
  const onTime = data.map(t => t.onTimeRate);
  const cost = data.map(t => t.costDeviation);
  const risk = data.map(t => t.riskEvents);
  const dates = data.map(t => t.date);
  drawLineChart(doc, onTime, 14, y, cw, ch, [0, 245, 212], `准时率趋势 (${label})`, dates);
  drawBarChart(doc, cost, 14 + cw + 5, y, cw, ch, [255, 107, 53], `成本偏差趋势 (${label})`, dates);
  drawBarChart(doc, risk, 14 + (cw + 5) * 2, y, cw, ch, [247, 37, 133], `风险事件趋势 (${label})`, dates);
}

function checkPage(doc: jsPDF, curY: number, needed: number) {
  if (curY + needed > doc.internal.pageSize.getHeight()) {
    doc.addPage();
    return 20;
  }
  return curY;
}

export function exportDailyReportPDF(report: DailyReport) {
  const doc = new jsPDF();
  const pw = doc.internal.pageSize.getWidth();
  doc.setFontSize(20);
  doc.setTextColor(0, 245, 212);
  doc.text(`供应链日报 - ${report.date}`, pw / 2, 20, { align: 'center' });

  const tc = report.categorySummaries.length;
  const avgOT = tc > 0 ? report.categorySummaries.reduce((s, c) => s + c.onTimeRate, 0) / tc : 0;
  const avgCD = tc > 0 ? report.categorySummaries.reduce((s, c) => s + c.costDeviation, 0) / tc : 0;
  const tr = report.categorySummaries.reduce((s, c) => s + c.riskEventCount, 0);

  let y = 32;
  doc.setFontSize(12);
  doc.setTextColor(0, 0, 0);
  doc.text('摘要统计', 14, y);
  y += 8;
  const stats = [['品类数', `${tc}`], ['平均准时率', `${avgOT.toFixed(1)}%`], ['平均成本偏差', `${avgCD.toFixed(1)}%`], ['风险事件总数', `${tr}`]];
  stats.forEach(([k, v], i) => {
    const cx = 14 + (pw - 28) / 4 * i;
    doc.setFontSize(9);
    doc.setTextColor(120, 120, 120);
    doc.text(k, cx, y);
    doc.setFontSize(11);
    doc.setTextColor(0, 0, 0);
    doc.text(v, cx, y + 6);
  });
  y += 20;

  doc.setFontSize(12);
  doc.setTextColor(0, 0, 0);
  doc.text('品类汇总', 14, y);
  y += 4;

  const td = report.categorySummaries.map(c => [c.category, `${c.onTimeRate}%`, `${c.costDeviation}%`, `${c.riskEventCount}`, c.avgResolutionTime > 0 ? `${c.avgResolutionTime}h` : '-']);
  autoTable(doc, {
    startY: y,
    head: [['品类', '准时交付率%', '成本偏差%', '风险事件数', '平均处理时长h']],
    body: td,
    styles: { fontSize: 9 },
    headStyles: { fillColor: [0, 245, 212], textColor: 0, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [245, 248, 255] },
  });
  y = (doc as any).lastAutoTable.finalY + 10;

  const ch = 75, cw = (pw - 28 - 10) / 3;
  y = checkPage(doc, y, ch + 20);
  doc.setFontSize(12);
  doc.setTextColor(0, 0, 0);
  doc.text('趋势分析', 14, y);
  y += 4;

  drawTrendRow(doc, y, cw, ch, report.trendData.slice(-30), '30天');
  y += ch + 12;
  y = checkPage(doc, y, ch + 20);
  drawTrendRow(doc, y, cw, ch, report.trendData.slice(-15), '15天');
  y += ch + 12;
  y = checkPage(doc, y, ch + 20);
  drawTrendRow(doc, y, cw, ch, report.trendData.slice(-7), '7天');

  const blob = doc.output('blob');
  triggerDownload(blob, `supply-chain-daily-${report.date}.pdf`);
}

export function exportDailyReportExcel(report: DailyReport) {
  const wb = XLSX.utils.book_new();
  const s1 = [
    ['品类', '准时交付率%', '成本偏差%', '风险事件数', '平均处理时长h'],
    ...report.categorySummaries.map(c => [c.category, c.onTimeRate, c.costDeviation, c.riskEventCount, c.avgResolutionTime]),
  ];
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(s1), '品类汇总');
  const s2 = [
    ['日期', '准时率%', '成本偏差%', '风险事件数'],
    ...report.trendData.map(t => [t.date, t.onTimeRate, t.costDeviation, t.riskEvents]),
  ];
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(s2), '趋势明细');
  const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  triggerDownload(blob, `supply-chain-daily-${report.date}.xlsx`);
}
