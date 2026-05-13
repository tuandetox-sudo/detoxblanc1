import { useMemo, useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, Radar, LineChart, Line, Legend,
} from 'recharts';
import { formatCurrency, shortNumber, isThisWeek, isThisMonth } from '../utils/formatters';
import { STAFF } from '../data/mockData';

const COLORS = ['#e879a0', '#f472b6', '#a78bfa', '#60a5fa', '#34d399'];

function Avatar({ name, size = 'md' }) {
  const initials = name?.split(' ').slice(-2).map(w => w[0]).join('') || '?';
  const sizes = { sm: 'w-8 h-8 text-xs', md: 'w-11 h-11 text-sm', lg: 'w-14 h-14 text-base' };
  return (
    <div className={`${sizes[size]} rounded-full bg-gradient-to-br from-pink-300 to-fuchsia-400 flex items-center justify-center font-bold text-white shrink-0`}>
      {initials}
    </div>
  );
}

function ProgressBar({ value, max, color }) {
  const pct = max ? Math.min((value / max) * 100, 100) : 0;
  return (
    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
      <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, background: color }} />
    </div>
  );
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-pink-100 rounded-xl shadow-lg p-3 text-sm">
      <p className="font-semibold text-gray-700 mb-1">{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color }} className="text-xs">
          {p.name}: {p.name.includes('oanh') ? formatCurrency(p.value) : p.value}
        </p>
      ))}
    </div>
  );
};

export default function StaffReport({ bookings }) {
  const [period, setPeriod] = useState('month');

  const periodBookings = useMemo(() => {
    if (period === 'week') return bookings.filter(b => isThisWeek(b.createdAt));
    if (period === 'month') return bookings.filter(b => isThisMonth(b.createdAt));
    return bookings;
  }, [bookings, period]);

  const staffStats = useMemo(() => {
    return STAFF.map((s, idx) => {
      const myBookings = periodBookings.filter(b => b.staffName === s.name);
      const closed = myBookings.filter(b => b.status === 'Đã chốt');
      const cancelled = myBookings.filter(b => b.status === 'Hủy');
      const revenue = closed.reduce((acc, b) => acc + b.totalValue, 0);
      const convRate = myBookings.length ? (closed.length / myBookings.length) * 100 : 0;

      return {
        ...s,
        bookings: myBookings.length,
        closed: closed.length,
        cancelled: cancelled.length,
        revenue,
        convRate,
        color: COLORS[idx % COLORS.length],
      };
    }).sort((a, b) => b.revenue - a.revenue);
  }, [periodBookings]);

  // Weekly trend per staff (last 6 weeks)
  const weeklyTrend = useMemo(() => {
    const weeks = [];
    for (let i = 5; i >= 0; i--) {
      const start = new Date();
      start.setDate(start.getDate() - i * 7 - start.getDay() + 1);
      start.setHours(0, 0, 0, 0);
      const end = new Date(start);
      end.setDate(start.getDate() + 6);
      end.setHours(23, 59, 59, 999);

      const entry = { week: `T${start.getDate()}/${start.getMonth() + 1}` };
      STAFF.forEach(s => {
        const cnt = bookings.filter(b => {
          const d = new Date(b.createdAt);
          return b.staffName === s.name && d >= start && d <= end;
        }).length;
        entry[s.name.split(' ').pop()] = cnt;
      });
      weeks.push(entry);
    }
    return weeks;
  }, [bookings]);

  const staffNames = STAFF.map(s => s.name.split(' ').pop());
  const maxRevenue = Math.max(...staffStats.map(s => s.revenue), 1);
  const maxBookings = Math.max(...staffStats.map(s => s.bookings), 1);

  // Radar data for selected top staff
  const radarData = useMemo(() => {
    const top = staffStats[0];
    if (!top) return [];
    return [
      { metric: 'Booking', value: top.bookings, fullMark: maxBookings },
      { metric: 'Chốt đơn', value: top.closed, fullMark: maxBookings },
      { metric: 'Tỷ lệ %', value: Math.round(top.convRate), fullMark: 100 },
      { metric: 'Doanh thu', value: Math.round(top.revenue / 1e6), fullMark: Math.round(maxRevenue / 1e6) },
      { metric: 'Chuyên cần', value: top.bookings > 0 ? Math.round(80 + (top.convRate / 10)) : 0, fullMark: 100 },
    ];
  }, [staffStats, maxRevenue, maxBookings]);

  return (
    <div className="space-y-6">
      {/* Period selector */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="text-lg font-semibold text-gray-800">Báo cáo nhân viên</h2>
        <div className="flex gap-2 bg-pink-50 p-1 rounded-xl">
          {[['week', 'Tuần này'], ['month', 'Tháng này'], ['all', 'Tất cả']].map(([v, l]) => (
            <button key={v} onClick={() => setPeriod(v)}
              className={`px-4 py-1.5 text-sm rounded-lg font-medium transition-all ${period === v ? 'bg-white text-pink-600 shadow-sm' : 'text-gray-500 hover:text-pink-500'}`}>
              {l}
            </button>
          ))}
        </div>
      </div>

      {/* Staff cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {staffStats.map((s, i) => (
          <div key={s.id} className="bg-white rounded-2xl p-4 shadow-sm border border-pink-100 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3 mb-3">
              <Avatar name={s.name} size="md" />
              <div className="min-w-0">
                <div className="font-semibold text-gray-800 text-sm truncate">{s.name}</div>
                {i === 0 && <span className="text-xs text-amber-500 font-medium">🏆 Top 1</span>}
              </div>
            </div>
            <div className="space-y-2.5">
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-gray-500">Doanh thu</span>
                  <span className="font-semibold text-gray-800">{shortNumber(s.revenue)}</span>
                </div>
                <ProgressBar value={s.revenue} max={maxRevenue} color={s.color} />
              </div>
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-gray-500">Booking</span>
                  <span className="font-semibold text-gray-800">{s.bookings}</span>
                </div>
                <ProgressBar value={s.bookings} max={maxBookings} color="#f4a9bb" />
              </div>
              <div className="pt-1 flex justify-between text-xs">
                <span className="text-gray-500">Tỷ lệ chốt</span>
                <span className={`font-bold ${s.convRate >= 60 ? 'text-emerald-500' : s.convRate >= 40 ? 'text-amber-500' : 'text-red-400'}`}>
                  {s.convRate.toFixed(1)}%
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Revenue bar chart */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-pink-100">
          <h3 className="font-semibold text-gray-700 mb-4 text-sm">Doanh thu theo nhân viên</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={staffStats} layout="vertical" margin={{ left: 0, right: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#fce7f3" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 10, fill: '#9ca3af' }} tickFormatter={v => shortNumber(v)} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: '#6b7280' }}
                tickFormatter={n => n.split(' ').slice(-1)[0]} width={60} />
              <Tooltip content={<CustomTooltip />} formatter={(v) => formatCurrency(v)} />
              <Bar dataKey="revenue" name="Doanh thu" radius={[0, 6, 6, 0]}>
                {staffStats.map((s, i) => (
                  <rect key={i} fill={s.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Weekly trend line chart */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-pink-100">
          <h3 className="font-semibold text-gray-700 mb-4 text-sm">Booking theo tuần (6 tuần gần nhất)</h3>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={weeklyTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#fce7f3" />
              <XAxis dataKey="week" tick={{ fontSize: 10, fill: '#9ca3af' }} />
              <YAxis tick={{ fontSize: 10, fill: '#9ca3af' }} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: '11px' }} />
              {staffNames.map((name, i) => (
                <Line key={name} type="monotone" dataKey={name} stroke={COLORS[i % COLORS.length]}
                  strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Detailed table */}
      <div className="bg-white rounded-2xl shadow-sm border border-pink-100 overflow-hidden">
        <div className="px-5 py-4 border-b border-pink-50">
          <h3 className="font-semibold text-gray-700 text-sm">Bảng chi tiết hiệu suất</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-pink-50/60 border-b border-pink-100">
                {['Nhân viên', 'Booking', 'Đã chốt', 'Tỷ lệ chốt', 'Doanh thu', 'TB/đơn', 'Hủy'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {staffStats.map((s, i) => (
                <tr key={s.id} className={`border-b border-gray-50 hover:bg-pink-50/30 transition-colors ${i % 2 === 0 ? '' : 'bg-gray-50/20'}`}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Avatar name={s.name} size="sm" />
                      <span className="font-medium text-gray-800">{s.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-700 font-medium">{s.bookings}</td>
                  <td className="px-4 py-3">
                    <span className="text-emerald-600 font-semibold">{s.closed}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`font-bold ${s.convRate >= 60 ? 'text-emerald-500' : s.convRate >= 40 ? 'text-amber-500' : 'text-red-400'}`}>
                      {s.convRate.toFixed(1)}%
                    </span>
                  </td>
                  <td className="px-4 py-3 font-semibold text-gray-800">{formatCurrency(s.revenue)}</td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{s.closed ? formatCurrency(Math.round(s.revenue / s.closed)) : '—'}</td>
                  <td className="px-4 py-3 text-red-400 font-medium">{s.cancelled}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
