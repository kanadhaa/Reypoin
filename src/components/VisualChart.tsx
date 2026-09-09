import React, { useState, useMemo } from 'react';
import { PointTransaction } from '../types';
import { TrendingUp, Award, AlertTriangle } from 'lucide-react';

interface VisualChartProps {
  transactions: PointTransaction[];
  initialPoints?: number;
  currentPoints: number;
  title?: string;
  subtitle?: string;
}

type Period = '1M' | '3M' | '6M' | 'ALL';

interface ChartPoint {
  date: Date;
  dateStr: string;
  displayDate: string;
  points: number;
  delta: number;
  type: 'initial' | 'prestasi' | 'pelanggaran';
  title: string;
}

export const VisualChart: React.FC<VisualChartProps> = ({
  transactions,
  initialPoints = 100,
  currentPoints,
  title = 'Grafik Akumulasi Poin',
  subtitle = 'Perkembangan poin kedisiplinan dan prestasi dari waktu ke waktu',
}) => {
  const [period, setPeriod] = useState<Period>('3M');
  const [hoveredPoint, setHoveredPoint] = useState<ChartPoint | null>(null);

  // Compute chronologically sorted points history
  const chartData = useMemo(() => {
    // Sort transactions oldest first
    const sorted = [...transactions].sort(
      (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );

    const now = new Date();
    let cutoff = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000); // 3M default
    if (period === '1M') {
      cutoff = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    } else if (period === '6M') {
      cutoff = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000);
    } else if (period === 'ALL') {
      cutoff = new Date(0);
    }

    // Filter transactions after cutoff or fallback to at least the start
    const points: ChartPoint[] = [];

    // Base starting point
    const baseDate = sorted.length > 0 ? new Date(sorted[0].timestamp) : new Date(now.getTime() - 30 * 86400000);
    baseDate.setDate(baseDate.getDate() - 5);

    let runningPoints = initialPoints;
    points.push({
      date: baseDate,
      dateStr: baseDate.toISOString(),
      displayDate: baseDate.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }),
      points: runningPoints,
      delta: 0,
      type: 'initial',
      title: 'Poin Awal Kepengurusan',
    });

    sorted.forEach(t => {
      const delta = t.type === 'prestasi' ? t.points : -t.points;
      runningPoints = Math.max(0, runningPoints + delta);
      const d = new Date(t.timestamp);

      points.push({
        date: d,
        dateStr: t.timestamp,
        displayDate: d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }),
        points: runningPoints,
        delta,
        type: t.type,
        title: t.title,
      });
    });

    // Filter points by period cutoff (keeping at least the latest 2 points so chart always renders)
    const filtered = points.filter((p, i) => i === 0 || p.date >= cutoff || i === points.length - 1);
    return filtered.length > 1 ? filtered : points;
  }, [transactions, initialPoints, period]);

  // Dimensions
  const width = 600;
  const height = 220;
  const paddingX = 45;
  const paddingY = 30;

  const minVal = Math.max(0, Math.min(...chartData.map(d => d.points), 40) - 10);
  const maxVal = Math.max(...chartData.map(d => d.points), 120) + 10;
  const valRange = maxVal - minVal || 1;

  // Convert points to SVG coordinates
  const svgCoords = useMemo(() => {
    const total = chartData.length;
    return chartData.map((d, i) => {
      const x = paddingX + (i / Math.max(1, total - 1)) * (width - paddingX * 2);
      const y = height - paddingY - ((d.points - minVal) / valRange) * (height - paddingY * 2);
      return { ...d, x, y };
    });
  }, [chartData, minVal, valRange]);

  // Create SVG path
  const linePath = useMemo(() => {
    if (svgCoords.length === 0) return '';
    return svgCoords.reduce((acc, pt, i) => {
      if (i === 0) return `M ${pt.x} ${pt.y}`;
      // Smooth cubic curve
      const prev = svgCoords[i - 1];
      const cx1 = prev.x + (pt.x - prev.x) / 2;
      const cy1 = prev.y;
      const cx2 = prev.x + (pt.x - prev.x) / 2;
      const cy2 = pt.y;
      return `${acc} C ${cx1} ${cy1}, ${cx2} ${cy2}, ${pt.x} ${pt.y}`;
    }, '');
  }, [svgCoords]);

  const areaPath = useMemo(() => {
    if (svgCoords.length === 0) return '';
    const first = svgCoords[0];
    const last = svgCoords[svgCoords.length - 1];
    const bottomY = height - paddingY;
    return `${linePath} L ${last.x} ${bottomY} L ${first.x} ${bottomY} Z`;
  }, [linePath, svgCoords]);

  // Statistics
  const highest = Math.max(...chartData.map(d => d.points));
  const lowest = Math.min(...chartData.map(d => d.points));
  const totalPrestasiCount = transactions.filter(t => t.type === 'prestasi').length;
  const totalPelanggaranCount = transactions.filter(t => t.type === 'pelanggaran').length;

  return (
    <div id="visual-chart-container" className="bg-white rounded-xl border border-slate-200/80 shadow-xs p-4 sm:p-6 transition-all">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-indigo-50 text-indigo-700">
              <TrendingUp className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-slate-800 text-base sm:text-lg">{title}</h3>
          </div>
          <p className="text-xs text-slate-500 mt-1">{subtitle}</p>
        </div>

        {/* Period Filter Buttons */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg self-start sm:self-auto">
          {(['1M', '3M', '6M', 'ALL'] as Period[]).map(p => (
            <button
              key={p}
              id={`period-btn-${p}`}
              onClick={() => setPeriod(p)}
              className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all ${
                period === p
                  ? 'bg-white text-indigo-700 shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {p === '1M' ? '1 Bln' : p === '3M' ? '3 Bln' : p === '6M' ? '1 Smt' : 'Semua'}
            </button>
          ))}
        </div>
      </div>

      {/* SVG Canvas Area */}
      <div className="relative w-full overflow-hidden">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-48 sm:h-56 select-none overflow-visible"
        >
          <defs>
            {/* Soft subtle gradient area */}
            <linearGradient id="chartGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#4f46e5" stopOpacity="0.22" />
              <stop offset="100%" stopColor="#4f46e5" stopOpacity="0.0" />
            </linearGradient>
            {/* Warning baseline line */}
            <linearGradient id="lineStroke" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#4f46e5" />
              <stop offset="100%" stopColor="#3b82f6" />
            </linearGradient>
          </defs>

          {/* Grid lines (horizontal) */}
          {[minVal, minVal + valRange * 0.33, minVal + valRange * 0.66, maxVal].map((val, idx) => {
            const y = height - paddingY - ((val - minVal) / valRange) * (height - paddingY * 2);
            return (
              <g key={idx}>
                <line
                  x1={paddingX}
                  y1={y}
                  x2={width - paddingX}
                  y2={y}
                  stroke="#e2e8f0"
                  strokeDasharray="3 3"
                  strokeWidth="1"
                />
                <text
                  x={paddingX - 8}
                  y={y + 3}
                  textAnchor="end"
                  className="fill-slate-400 text-[10px] font-medium"
                >
                  {Math.round(val)}
                </text>
              </g>
            );
          })}

          {/* SP 1 Alert Line threshold (e.g. 70 points) */}
          {minVal <= 70 && maxVal >= 70 && (
            <g>
              {(() => {
                const spY = height - paddingY - ((70 - minVal) / valRange) * (height - paddingY * 2);
                return (
                  <>
                    <line
                      x1={paddingX}
                      y1={spY}
                      x2={width - paddingX}
                      y2={spY}
                      stroke="#f59e0b"
                      strokeWidth="1.2"
                      strokeDasharray="4 2"
                    />
                    <text
                      x={width - paddingX}
                      y={spY - 3}
                      textAnchor="end"
                      className="fill-amber-600 text-[9px] font-semibold"
                    >
                      Batas Waspada (70)
                    </text>
                  </>
                );
              })()}
            </g>
          )}

          {/* Area fill */}
          <path d={areaPath} fill="url(#chartGradient)" />

          {/* Line stroke */}
          <path
            d={linePath}
            fill="none"
            stroke="url(#lineStroke)"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Data Points */}
          {svgCoords.map((pt, i) => {
            const isHovered = hoveredPoint?.dateStr === pt.dateStr;
            const isPrestasi = pt.type === 'prestasi';
            const isPelanggaran = pt.type === 'pelanggaran';

            const dotColor = isPrestasi ? '#10b981' : isPelanggaran ? '#ef4444' : '#4f46e5';

            return (
              <g key={i} className="cursor-pointer">
                {/* Invisible larger hit target */}
                <circle
                  cx={pt.x}
                  cy={pt.y}
                  r="14"
                  fill="transparent"
                  onMouseEnter={() => setHoveredPoint(pt)}
                  onMouseLeave={() => setHoveredPoint(null)}
                  onClick={() => setHoveredPoint(pt)}
                />

                {/* Visible dot */}
                <circle
                  cx={pt.x}
                  cy={pt.y}
                  r={isHovered ? '6' : i === svgCoords.length - 1 ? '5' : '3.5'}
                  fill={dotColor}
                  stroke="#ffffff"
                  strokeWidth="2"
                  className="transition-all duration-150"
                />

                {/* Bottom X-axis label */}
                <text
                  x={pt.x}
                  y={height - 8}
                  textAnchor="middle"
                  className={`text-[9.5px] font-medium transition-colors ${
                    isHovered ? 'fill-indigo-600 font-bold' : 'fill-slate-400'
                  }`}
                >
                  {pt.displayDate}
                </text>
              </g>
            );
          })}
        </svg>

        {/* Hover / Touch Tooltip overlay */}
        {hoveredPoint && (
          <div
            className="absolute top-2 left-1/2 transform -translate-x-1/2 sm:translate-x-0 sm:left-auto sm:right-4 bg-slate-900 text-white rounded-lg px-3 py-2 text-xs shadow-lg pointer-events-none z-10 max-w-[280px]"
          >
            <div className="flex items-center justify-between gap-3 font-semibold pb-1 border-b border-slate-700">
              <span>{hoveredPoint.displayDate}</span>
              <span className="text-amber-400 font-bold">{hoveredPoint.points} Poin</span>
            </div>
            <div className="pt-1 text-[11px] text-slate-200">
              <p className="font-medium text-white">{hoveredPoint.title}</p>
              {hoveredPoint.delta !== 0 && (
                <p
                  className={`mt-0.5 font-bold ${
                    hoveredPoint.delta > 0 ? 'text-emerald-400' : 'text-rose-400'
                  }`}
                >
                  {hoveredPoint.delta > 0 ? `+${hoveredPoint.delta}` : hoveredPoint.delta} Poin
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Quick Stats Grid under chart */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-4 mt-2 border-t border-slate-100">
        <div className="bg-slate-50 rounded-lg p-2.5">
          <p className="text-[11px] text-slate-500 font-medium">Poin Sekarang</p>
          <p className="text-base font-extrabold text-slate-900">{currentPoints} Poin</p>
        </div>
        <div className="bg-slate-50 rounded-lg p-2.5">
          <p className="text-[11px] text-slate-500 font-medium">Tertinggi Periode</p>
          <p className="text-base font-bold text-indigo-700">{highest} Poin</p>
        </div>
        <div className="bg-emerald-50/70 rounded-lg p-2.5">
          <div className="flex items-center gap-1 text-emerald-700 text-[11px] font-medium">
            <Award className="w-3.5 h-3.5" />
            <span>Prestasi Dicatat</span>
          </div>
          <p className="text-base font-bold text-emerald-800">{totalPrestasiCount} Kali</p>
        </div>
        <div className="bg-rose-50/70 rounded-lg p-2.5">
          <div className="flex items-center gap-1 text-rose-700 text-[11px] font-medium">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Pelanggaran Dicatat</span>
          </div>
          <p className="text-base font-bold text-rose-800">{totalPelanggaranCount} Kali</p>
        </div>
      </div>
    </div>
  );
};
