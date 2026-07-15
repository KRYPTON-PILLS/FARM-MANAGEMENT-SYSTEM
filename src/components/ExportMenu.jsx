import { useState, useRef, useEffect } from 'react';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Download, FileText, Sheet, MessageCircle, ChevronDown, Check } from 'lucide-react';

function toCsv(rows) {
  if (!rows || rows.length === 0) return '';
  const headers = Object.keys(rows[0]);
  const escape = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const lines = [headers.join(','), ...rows.map((r) => headers.map((h) => escape(r[h])).join(','))];
  return lines.join('\n');
}

function downloadFile(content, filename, mime) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

/** Canvas roundRect — not universally supported, so drawn manually rather than relying on ctx.roundRect(). */
function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

/** Builds a shareable 800x800 PNG summary card — title, date, and up to 4 KPI tiles. */
function buildSummaryImage({ reportTitle, dateLabel, summaryStats }) {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    canvas.width = 800;
    canvas.height = 800;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#f9fafb';
    ctx.fillRect(0, 0, 800, 800);

    ctx.fillStyle = '#14532d';
    ctx.fillRect(0, 0, 800, 150);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 40px sans-serif';
    ctx.fillText(reportTitle, 40, 75);
    ctx.font = '20px sans-serif';
    ctx.fillStyle = '#dcfce7';
    ctx.fillText(dateLabel, 40, 112);

    const stats = summaryStats.slice(0, 4);
    stats.forEach((s, i) => {
      const col = i % 2;
      const row = Math.floor(i / 2);
      const x = 40 + col * 380;
      const y = 190 + row * 160;
      ctx.fillStyle = '#ffffff';
      roundRect(ctx, x, y, 340, 130, 16);
      ctx.fill();
      ctx.fillStyle = '#6b7280';
      ctx.font = '18px sans-serif';
      ctx.fillText(s.label, x + 24, y + 42);
      ctx.fillStyle = '#14532d';
      ctx.font = 'bold 34px sans-serif';
      ctx.fillText(String(s.value), x + 24, y + 90);
    });

    ctx.fillStyle = '#9ca3af';
    ctx.font = '15px sans-serif';
    ctx.fillText('Shared from Farm Management System', 40, 760);

    canvas.toBlob((blob) => resolve(blob), 'image/png');
  });
}

/**
 * @param {Array<object>} data - flat array of rows to export
 * @param {string} filename - without extension
 * @param {string} [reportTitle] - shown as the PDF/WhatsApp card heading; defaults to filename
 * @param {Array<{label: string, value: string|number}>} [summaryStats] - KPI values shown
 *   at the top of the PDF and on the WhatsApp summary card. Optional — if omitted, the PDF
 *   skips the summary table and the WhatsApp card just shows the title/date/record count.
 */
export default function ExportMenu({ data = [], filename = 'report', reportTitle, summaryStats = [] }) {
  const [open, setOpen] = useState(false);
  const [justShared, setJustShared] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const title = reportTitle || filename;
  const dateLabel = new Date().toLocaleDateString('en-KE', { day: 'numeric', month: 'long', year: 'numeric' });

  const handleCsv = () => {
    downloadFile(toCsv(data), `${filename}.csv`, 'text/csv');
    setOpen(false);
  };

  const handleExcel = () => {
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, title.slice(0, 31)); // sheet names are capped at 31 chars
    XLSX.writeFile(wb, `${filename}.xlsx`);
    setOpen(false);
  };

  const handlePdf = () => {
    const doc = new jsPDF();

    doc.setFontSize(18);
    doc.setTextColor(20, 83, 45); // green-900
    doc.text(title, 14, 20);

    doc.setFontSize(10);
    doc.setTextColor(107, 114, 128); // gray-500
    doc.text(`Generated ${dateLabel}`, 14, 27);

    let cursorY = 34;

    if (summaryStats.length > 0) {
      autoTable(doc, {
        startY: cursorY,
        head: [['Metric', 'Value']],
        body: summaryStats.map((s) => [s.label, String(s.value)]),
        theme: 'plain',
        headStyles: { fillColor: [22, 163, 74], textColor: 255 },
        styles: { fontSize: 9 },
        margin: { left: 14, right: 14 },
      });
      cursorY = doc.lastAutoTable.finalY + 10;
    }

    if (data.length > 0) {
      const headers = Object.keys(data[0]);
      autoTable(doc, {
        startY: cursorY,
        head: [headers],
        body: data.map((row) => headers.map((h) => (row[h] ?? ''))),
        headStyles: { fillColor: [22, 163, 74], textColor: 255 },
        styles: { fontSize: 8 },
        margin: { left: 14, right: 14 },
      });
    }

    doc.save(`${filename}.pdf`);
    setOpen(false);
  };

  const handleWhatsApp = async () => {
    const stats = summaryStats.length > 0 ? summaryStats : [{ label: 'Records', value: data.length }];
    const blob = await buildSummaryImage({ reportTitle: title, dateLabel, summaryStats: stats });
    const file = new File([blob], `${filename}-summary.png`, { type: 'image/png' });

    const canShareFile = typeof navigator.canShare === 'function' && navigator.canShare({ files: [file] });

    if (canShareFile) {
      try {
        await navigator.share({ files: [file], title, text: `${title} — ${dateLabel}` });
      } catch (err) {
        // User cancelled the share sheet — not an error, nothing to do.
      }
    } else {
      // Desktop or unsupported browser: download the card so it can be attached manually.
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${filename}-summary.png`;
      a.click();
      URL.revokeObjectURL(url);
      setJustShared(true);
      setTimeout(() => setJustShared(false), 2500);
    }
    setOpen(false);
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-gray-50 px-3 py-1.5 text-sm font-medium text-green-900 transition-colors hover:bg-green-50"
      >
        {justShared ? <Check size={14} className="text-green-600" /> : <Download size={14} />}
        {justShared ? 'Saved — attach in WhatsApp' : 'Export'}
        <ChevronDown size={12} />
      </button>

      {open && (
        <div className="absolute right-0 z-10 mt-1 w-56 rounded-xl border border-gray-200 bg-white p-1 shadow-lg">
          <button onClick={handleCsv} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm hover:bg-gray-50">
            <Sheet size={14} className="text-gray-500" /> Export as CSV
          </button>
          <button onClick={handleExcel} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm hover:bg-gray-50">
            <Sheet size={14} className="text-gray-500" /> Export as Excel
          </button>
          <button onClick={handlePdf} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm hover:bg-gray-50">
            <FileText size={14} className="text-gray-500" /> Export as PDF
          </button>
          <button onClick={handleWhatsApp} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm hover:bg-gray-50">
            <MessageCircle size={14} className="text-gray-500" /> Share to WhatsApp
          </button>
        </div>
      )}
    </div>
  );
}