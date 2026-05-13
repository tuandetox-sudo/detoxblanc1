import { useMemo } from 'react';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend
} from 'recharts';
import { TrendingUp, Users, ShoppingBag, Award, ArrowUp, ArrowDown } from 'lucide-react';
import { formatCurrency, isToday, isThisWeek, isThisMonth, shortNumber, getStatusColor } from '../utils/formatters';

const COLORS = ['#e879a0', '#f4a9bb', '#fbbf24', '#34d399', '#60a5fa', '#a78bfa'];

function StatCard({ icon: Icon, label, value, sub, trend, color }) {
  const isPositive = trend >= 0;
  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-pink-100 flex flex-col gap-3 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
          <Icon size={20} className="text-white" />
        </div>
        {trend !== undefined && (
          <span className={`flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full ${isPositive ? 'text-emerald-700 bg-emerald-50' : 'text-red-600 bg-red-50'}`}>
            {isPositive ? <ArrowUp size={12} /> : <ArrowDown size={12} />}
            {Math.abs(trend)}%
          </span>
        )}
      </div>
      <div>
        <div className="text-2xl font-bold text-gray-800">{value}</div>
        <div className="text-sm text-gray-500 mt-0.5">{label}</div>
        {sub && <div className="text-xs text-pink-400 mt-1">{sub}</div>}
      </div>
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

export default function Dashboard({ bookings }) {
  const stats = useMemo(() => {
    const todayB = bookings.filter(b => isToday(b.createdAt));
    const weekB = bookings.filter(b => isThisWeek(b.createdAt));
    const monthB = bookings.filter(b => isThisMonth(b.createdAt));
    const closed = bookings.filter(b => b.status === 'Đã chốt');
    const convRate = bookings.length ? ((closed.length / bookings.length) * 100).toFixed(1) : 0;
    const totalRevenue = closed.reduce((s, b) => s + b.totalValue, 0);
    const monthRevenue = monthB.filter(b => b.status === 'Đã chốt').reduce((s, b) => s + b.totalValue, 0);

    return { todayB, weekB, monthB, closed, convRate, totalRevenue, monthRevenue };
  }, [bookings]);

  // Weekly booking trend (last 8 weeks)
  const weeklyData = useMemo(() => {
    const weeks = [];
    for (let i = 7; i >= 0; i--) {
      const start = new Date();
      start.setDate(start.getDate() - i * 7 - start.getDay() + 1);
      start.setHours(0, 0, 0, 0);
      const end = new Date(start);
      end.setDate(start.getDate() + 6);
      end.setHours(23, 59, 59, 999);
      const wBookings = bookings.filter(b => {
        const d = new Date(b.createdAt);
        return d >= start && d <= end;
      });
      const revenue = wBookings.filter(b => b.status === 'Đã chốt').reduce((s, b) => s + b.totalValue, 0);
      weeks.push({
        name: `T${start.getDate()}/${start.getMonth() + 1}`,
        'Booking': wBookings.length,
        'Chốt': wBookings.filter(b => b.status === 'Đã chốt').length,
        'Doanh thu': revenue,
      });
    }
    return weeks;
  }, [bookings]);

  // Top products
  const topProducts = useMemo(() => {
    const map = {};
    bookings.forEach(b => {
      if (!map[b.product]) map[b.product] = { name: b.product, count: 0, revenue: 0 };
      map[b.product].count++;
      if (b.status === 'Đã chốt') map[b.product].revenue += b.totalValue;
    });
    return Object.values(map).sort((a, b) => b.count - a.count).slice(0, 5);
  }, [bookings]);

  // Status distribution
  const statusDist = useMemo(() => {
    const map = {};
    bookings.forEach(b => {
      map[b.status] = (map[b.status] || 0) + 1;
    });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [bookings]);

  // Top staff by revenue
  const topStaff = useMemo(() => {
    const map = {};
    bookings.forEach(b => {
      if (!map[b.staffName]) map[b.staffName] = { name: b.staffName, total: 0, closed: 0, bookings: 0 };
      map[b.staffName].bookings++;
      if (b.status === 'Đã chốt') {
        map[b.staffName].total += b.totalValue;
        map[b.staffName].closed++;
      }
    });
    return Object.values(map).sort((a, b) => b.total - a.total).slice(0, 5);
  }, [bookings]);

  return (
    <div className="space-y-6">
      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={ShoppingBag} label="Booking hôm nay" value={stats.todayB.length} sub={`Tuần: ${stats.weekB.length}`} trend={12} color="bg-pink-400" />
        <StatCard icon={TrendingUp} label="Booking tháng này" value={stats.monthB.length} sub={`Đã chốt: ${stats.monthB.filter(b => b.status === 'Đã chốt').length}`} trend={8} color="bg-rose-400" />
        <StatCard icon={Award} label="Tỷ lệ chốt đơn" value={`${stats.convRate}%`} sub={`${stats.closed.length} / ${bookings.length} đơn`} trend={-2} color="bg-fuchsia-400" />
        <StatCard icon={Users} label="Doanh thu tháng" value={shortNumber(stats.monthRevenue)} sub="VNĐ" trend={15} color="bg-purple-400" />
      </div>

      {/* Charts row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Weekly trend */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-5 shadow-sm border border-pink-100">
          <h3 className="font-semibold text-gray-700 mb-4 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-pink-400 inline-block"></span>
            Xu hướng booking 8 tuần gần nhất
          </h3>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={weeklyData}>
              <defs>
                <linearGradient id="colorBooking" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#e879a0" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#e879a0" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorChot" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#34d399" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#34d399" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#fce7f3" />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#9ca3af' }} />
              <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="Booking" stroke="#e879a0" fill="url(#colorBooking)" strokeWidth={2} />
              <Area type="monotone" dataKey="Chốt" stroke="#34d399" fill="url(#colorChot)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Status Pie */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-pink-100">
          <h3 className="font-semibold text-gray-700 mb-4 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-fuchsia-400 inline-block"></span>
            Trạng thái booking
          </h3>
          <ResponsiveContainer width="100%" height={160}>
            <PieChart>
              <Pie data={statusDist} cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={3} dataKey="value">
                {statusDist.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip formatter={(v, n) => [v, n]} />
            </PieChart>
          </ResponsiveContainer>
          <div className="mt-2 space-y-1">
            {statusDist.map((s, i) => (
              <div key={s.name} className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ background: COLORS[i % COLORS.length] }}></span>
                  <span className="text-gray-600">{s.name}</span>
                </span>
                <span className="font-medium text-gray-700">{s.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Charts row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Top products */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-pink-100">
          <h3 className="font-semibold text-gray-700 mb-4 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-400 inline-block"></span>
            Top sản phẩm được booking
          </h3>
          <div className="space-y-3">
            {topProducts.map((p, i) => {
              const max = topProducts[0].count;
              return (
                <div key={p.name}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-gray-600 truncate max-w-[70%]">{i + 1}. {p.name}</span>
                    <span className="text-gray-800 font-medium">{p.count} booking</span>
                  </div>
                  <div className="h-2 bg-pink-50 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${(p.count / max) * 100}%`,
                        background: `linear-gradient(90deg, #e879a0, #f4a9bb)`,
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Top staff */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-pink-100">
          <h3 className="font-semibold text-gray-700 mb-4 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-purple-400 inline-block"></span>
            Nhân viên xuất sắc
          </h3>
          <div className="space-y-3">
            {topStaff.map((s, i) => {
              const medals = ['🥇', '🥈', '🥉', '4', '5'];
              const rate = s.bookings ? ((s.closed / s.bookings) * 100).toFixed(0) : 0;
              return (
                <div key={s.name} className="flex items-center gap-3">
                  <span className="text-lg w-6 text-center">{medals[i]}</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-700 truncate">{s.name}</div>
                    <div className="text-xs text-gray-400">{s.bookings} booking · chốt {rate}%</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-semibold text-pink-600">{shortNumber(s.total)}</div>
                    <div className="text-xs text-gray-400">VNĐ</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
