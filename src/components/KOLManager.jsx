import { useMemo, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { formatCurrency, shortNumber } from '../utils/formatters';
import { KOLS } from '../data/mockData';
import { Plus, TrendingUp, Users, Star, X } from 'lucide-react';

const PLATFORM_COLORS = {
  TikTok: { bg: 'bg-gray-900', text: 'text-white', dot: '#000' },
  Instagram: { bg: 'bg-gradient-to-r from-purple-500 to-pink-500', text: 'text-white', dot: '#a855f7' },
  YouTube: { bg: 'bg-red-500', text: 'text-white', dot: '#ef4444' },
  Facebook: { bg: 'bg-blue-600', text: 'text-white', dot: '#2563eb' },
};

const TIER_COLORS = {
  KOL: 'bg-purple-100 text-purple-700',
  KOC: 'bg-pink-100 text-pink-600',
};

const STATUS_COLORS = {
  'Đang hợp tác': 'bg-emerald-100 text-emerald-700',
  'Hết hạn': 'bg-gray-100 text-gray-500',
  'Đang thương lượng': 'bg-amber-100 text-amber-700',
};

const CHART_COLORS = ['#e879a0', '#a78bfa', '#60a5fa', '#34d399', '#fbbf24'];

function KOLCard({ kol, bookingCount, revenue, onClick }) {
  const platform = PLATFORM_COLORS[kol.platform] || { bg: 'bg-gray-500', text: 'text-white', dot: '#6b7280' };
  return (
    <div
      onClick={onClick}
      className="bg-white rounded-2xl p-5 shadow-sm border border-pink-100 hover:shadow-md hover:border-pink-200 transition-all cursor-pointer"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-pink-200 to-fuchsia-300 flex items-center justify-center text-lg font-bold text-white">
            {kol.avatar}
          </div>
          <div>
            <div className="font-semibold text-gray-800">{kol.name}</div>
            <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${TIER_COLORS[kol.tier] || 'bg-gray-100 text-gray-600'}`}>
              {kol.tier}
            </span>
          </div>
        </div>
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[kol.status] || 'bg-gray-100 text-gray-500'}`}>
          <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
          {kol.status}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3 text-sm mb-4">
        <div>
          <div className="text-xs text-gray-400 mb-0.5">Platform</div>
          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-medium ${platform.bg} ${platform.text}`}>
            {kol.platform}
          </span>
        </div>
        <div>
          <div className="text-xs text-gray-400 mb-0.5">Followers</div>
          <div className="font-semibold text-gray-700">{kol.followers}</div>
        </div>
        <div>
          <div className="text-xs text-gray-400 mb-0.5">Hoa hồng</div>
          <div className="font-semibold text-pink-600">{kol.commission}%</div>
        </div>
        <div>
          <div className="text-xs text-gray-400 mb-0.5">Booking</div>
          <div className="font-semibold text-gray-700">{bookingCount}</div>
        </div>
      </div>

      <div className="pt-3 border-t border-pink-50">
        <div className="flex justify-between items-center">
          <span className="text-xs text-gray-400">Doanh thu đóng góp</span>
          <span className="text-sm font-bold text-pink-600">{shortNumber(revenue)}</span>
        </div>
      </div>
    </div>
  );
}

function KOLDetailModal({ kol, bookings, onClose }) {
  const myBookings = bookings.filter(b => b.kolId === kol.id || b.kolName === kol.name);
  const revenue = myBookings.filter(b => b.status === 'Đã chốt').reduce((s, b) => s + b.totalValue, 0);
  const commission = revenue * (kol.commission / 100);

  const productBreakdown = useMemo(() => {
    const map = {};
    myBookings.forEach(b => {
      if (!map[b.product]) map[b.product] = 0;
      map[b.product]++;
    });
    return Object.entries(map).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([name, count]) => ({ name, count }));
  }, [myBookings]);

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-pink-100 px-6 py-4 flex items-center justify-between rounded-t-2xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-pink-200 to-fuchsia-300 flex items-center justify-center font-bold text-white">
              {kol.avatar}
            </div>
            <div>
              <h3 className="font-semibold text-gray-800">{kol.name}</h3>
              <span className="text-xs text-gray-400">{kol.platform} · {kol.followers}</span>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
        </div>

        <div className="p-6 space-y-5">
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Tổng booking', value: myBookings.length, color: 'text-pink-600' },
              { label: 'Doanh thu', value: shortNumber(revenue), color: 'text-emerald-600' },
              { label: 'Hoa hồng', value: shortNumber(commission), color: 'text-purple-600' },
            ].map(s => (
              <div key={s.label} className="bg-pink-50/50 rounded-xl p-3 text-center">
                <div className={`text-lg font-bold ${s.color}`}>{s.value}</div>
                <div className="text-xs text-gray-400 mt-0.5">{s.label}</div>
              </div>
            ))}
          </div>

          {productBreakdown.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-gray-700 mb-3">Sản phẩm được booking nhiều nhất</h4>
              <ResponsiveContainer width="100%" height={140}>
                <BarChart data={productBreakdown} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#fce7f3" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 10 }} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 9 }} width={120}
                    tickFormatter={n => n.length > 18 ? n.slice(0, 18) + '…' : n} />
                  <Tooltip />
                  <Bar dataKey="count" name="Booking" radius={[0, 4, 4, 0]}>
                    {productBreakdown.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="bg-gray-50 rounded-xl p-3">
              <span className="text-xs text-gray-400 block mb-1">Tier</span>
              <span className={`px-2 py-0.5 rounded-lg text-xs font-semibold ${TIER_COLORS[kol.tier]}`}>{kol.tier}</span>
            </div>
            <div className="bg-gray-50 rounded-xl p-3">
              <span className="text-xs text-gray-400 block mb-1">Hoa hồng</span>
              <span className="font-bold text-pink-600">{kol.commission}%</span>
            </div>
            <div className="bg-gray-50 rounded-xl p-3">
              <span className="text-xs text-gray-400 block mb-1">Tình trạng</span>
              <span className={`px-2 py-0.5 rounded-lg text-xs font-medium ${STATUS_COLORS[kol.status]}`}>{kol.status}</span>
            </div>
            <div className="bg-gray-50 rounded-xl p-3">
              <span className="text-xs text-gray-400 block mb-1">Tỷ lệ chốt</span>
              <span className="font-bold text-emerald-600">
                {myBookings.length ? ((myBookings.filter(b => b.status === 'Đã chốt').length / myBookings.length) * 100).toFixed(1) : 0}%
              </span>
            </div>
          </div>

          {myBookings.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-gray-700 mb-2">Booking gần đây</h4>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {myBookings.slice(0, 8).map(b => (
                  <div key={b.id} className="flex items-center justify-between text-xs py-1.5 border-b border-gray-50">
                    <span className="font-mono text-pink-500">{b.id}</span>
                    <span className="text-gray-600 truncate mx-2">{b.customerName}</span>
                    <span className={`px-1.5 py-0.5 rounded-lg font-medium ${
                      b.status === 'Đã chốt' ? 'bg-emerald-100 text-emerald-700' :
                      b.status === 'Hủy' ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-600'
                    }`}>{b.status}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function KOLManager({ bookings }) {
  const [selectedKOL, setSelectedKOL] = useState(null);

  const kolStats = useMemo(() => {
    return KOLS.map(k => {
      const myBookings = bookings.filter(b => b.kolId === k.id || b.kolName === k.name);
      const revenue = myBookings.filter(b => b.status === 'Đã chốt').reduce((s, b) => s + b.totalValue, 0);
      return { ...k, bookingCount: myBookings.length, revenue };
    }).sort((a, b) => b.revenue - a.revenue);
  }, [bookings]);

  const totalKolRevenue = kolStats.reduce((s, k) => s + k.revenue, 0);
  const totalKolBookings = kolStats.reduce((s, k) => s + k.bookingCount, 0);
  const activeKols = kolStats.filter(k => k.status === 'Đang hợp tác').length;

  const sourceBreakdown = useMemo(() => {
    const kolSource = bookings.filter(b => b.source === 'KOL/KOC').length;
    const total = bookings.length;
    return {
      kolPct: total ? ((kolSource / total) * 100).toFixed(1) : 0,
      kolCount: kolSource,
    };
  }, [bookings]);

  const revenueChartData = kolStats.map(k => ({
    name: k.name.split('_')[0],
    'Doanh thu': k.revenue,
    'Booking': k.bookingCount,
  }));

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { icon: Users, label: 'KOL/KOC đang hợp tác', value: activeKols, sub: `/ ${KOLS.length} tổng`, color: 'bg-fuchsia-400' },
          { icon: Star, label: 'Booking từ KOL/KOC', value: totalKolBookings, sub: `${sourceBreakdown.kolPct}% tổng booking`, color: 'bg-pink-400' },
          { icon: TrendingUp, label: 'Doanh thu KOL/KOC', value: shortNumber(totalKolRevenue), sub: 'VNĐ', color: 'bg-purple-400' },
          { icon: Plus, label: 'Nguồn KOL/KOC', value: `${sourceBreakdown.kolPct}%`, sub: 'tổng booking', color: 'bg-rose-400' },
        ].map(({ icon: Icon, label, value, sub, color }) => (
          <div key={label} className="bg-white rounded-2xl p-5 shadow-sm border border-pink-100">
            <div className={`w-10 h-10 rounded-xl ${color} flex items-center justify-center mb-3`}>
              <Icon size={18} className="text-white" />
            </div>
            <div className="text-2xl font-bold text-gray-800">{value}</div>
            <div className="text-sm text-gray-500 mt-0.5">{label}</div>
            <div className="text-xs text-pink-400 mt-1">{sub}</div>
          </div>
        ))}
      </div>

      {/* Revenue chart */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-pink-100">
        <h3 className="font-semibold text-gray-700 mb-4 text-sm">Doanh thu & Booking theo KOL/KOC</h3>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={revenueChartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#fce7f3" />
            <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#9ca3af' }} />
            <YAxis yAxisId="left" tick={{ fontSize: 10, fill: '#9ca3af' }} tickFormatter={shortNumber} />
            <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 10, fill: '#9ca3af' }} />
            <Tooltip formatter={(v, n) => n === 'Doanh thu' ? formatCurrency(v) : v} />
            <Bar yAxisId="left" dataKey="Doanh thu" fill="#e879a0" radius={[6, 6, 0, 0]} />
            <Bar yAxisId="right" dataKey="Booking" fill="#c4b5fd" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* KOL Cards grid */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-700">Danh sách KOL/KOC</h3>
          <span className="text-sm text-gray-400">{KOLS.length} đối tác</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {kolStats.map(k => (
            <KOLCard
              key={k.id}
              kol={k}
              bookingCount={k.bookingCount}
              revenue={k.revenue}
              onClick={() => setSelectedKOL(k)}
            />
          ))}
        </div>
      </div>

      {selectedKOL && (
        <KOLDetailModal
          kol={selectedKOL}
          bookings={bookings}
          onClose={() => setSelectedKOL(null)}
        />
      )}
    </div>
  );
}
