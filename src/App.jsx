import { useState } from 'react';
import { LayoutDashboard, CalendarCheck, BarChart3, Users, RefreshCw, AlertCircle, Wifi, WifiOff, Menu, X } from 'lucide-react';
import Dashboard from './components/Dashboard';
import BookingTable from './components/BookingTable';
import StaffReport from './components/StaffReport';
import KOLManager from './components/KOLManager';
import { useGoogleSheets } from './hooks/useGoogleSheets';

const TABS = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'bookings', label: 'Quản lý Booking', icon: CalendarCheck },
  { id: 'staff', label: 'Báo cáo NV', icon: BarChart3 },
  { id: 'kol', label: 'KOL/KOC', icon: Users },
];

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { bookings, setBookings, loading, error, usingMock } = useGoogleSheets();

  const currentTab = TABS.find(t => t.id === activeTab);

  return (
    <div className="min-h-screen bg-[#fdf8f6] flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-pink-100 sticky top-0 z-40 shadow-sm">
        <div className="max-w-screen-xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-pink-400 to-fuchsia-500 flex items-center justify-center shadow-md">
                <span className="text-white font-bold text-sm">DB</span>
              </div>
              <div>
                <div className="font-bold text-gray-800 leading-tight text-sm sm:text-base">DetoxBlanc</div>
                <div className="text-xs text-pink-400 font-medium leading-tight hidden sm:block">Booking Management</div>
              </div>
            </div>

            {/* Desktop Nav */}
            <nav className="hidden md:flex items-center gap-1">
              {TABS.map(tab => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                      isActive
                        ? 'bg-pink-50 text-pink-600 shadow-sm'
                        : 'text-gray-500 hover:text-pink-500 hover:bg-pink-50/50'
                    }`}
                  >
                    <Icon size={16} />
                    {tab.label}
                  </button>
                );
              })}
            </nav>

            {/* Status indicators */}
            <div className="flex items-center gap-3">
              {loading && (
                <div className="flex items-center gap-1.5 text-xs text-gray-400">
                  <RefreshCw size={13} className="animate-spin" />
                  <span className="hidden sm:inline">Đang tải...</span>
                </div>
              )}
              {usingMock && !loading && (
                <div className="flex items-center gap-1.5 text-xs text-amber-500 bg-amber-50 px-2.5 py-1 rounded-lg">
                  <WifiOff size={13} />
                  <span className="hidden sm:inline">Dữ liệu mẫu</span>
                </div>
              )}
              {!usingMock && !loading && (
                <div className="flex items-center gap-1.5 text-xs text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-lg">
                  <Wifi size={13} />
                  <span className="hidden sm:inline">Google Sheets</span>
                </div>
              )}

              {/* Mobile menu button */}
              <button
                className="md:hidden p-2 rounded-xl hover:bg-pink-50 text-gray-500"
                onClick={() => setMobileMenuOpen(v => !v)}
              >
                {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
              </button>
            </div>
          </div>

          {/* Mobile Nav */}
          {mobileMenuOpen && (
            <div className="md:hidden border-t border-pink-50 py-3 grid grid-cols-2 gap-2">
              {TABS.map(tab => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => { setActiveTab(tab.id); setMobileMenuOpen(false); }}
                    className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                      isActive ? 'bg-pink-50 text-pink-600' : 'text-gray-500 hover:bg-pink-50/50'
                    }`}
                  >
                    <Icon size={16} />
                    {tab.label}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 max-w-screen-xl mx-auto w-full px-4 sm:px-6 py-6">
        {/* Page title */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-800">{currentTab?.label}</h1>
            <p className="text-sm text-gray-400 mt-0.5">
              {bookings.length} booking · Cập nhật {new Date().toLocaleDateString('vi-VN')}
            </p>
          </div>
        </div>

        {/* Error banner */}
        {error && (
          <div className="mb-4 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 flex items-start gap-2 text-sm text-amber-700">
            <AlertCircle size={16} className="mt-0.5 shrink-0" />
            <div>
              <strong>Không kết nối được Google Sheets:</strong> {error}
              <br />
              <span className="text-xs text-amber-600">
                Đang dùng dữ liệu mẫu. Thêm <code className="bg-amber-100 px-1 rounded">VITE_GOOGLE_API_KEY</code> vào file <code className="bg-amber-100 px-1 rounded">.env</code> để kết nối.
              </span>
            </div>
          </div>
        )}

        {/* Tab content */}
        {activeTab === 'dashboard' && <Dashboard bookings={bookings} />}
        {activeTab === 'bookings' && <BookingTable bookings={bookings} setBookings={setBookings} />}
        {activeTab === 'staff' && <StaffReport bookings={bookings} />}
        {activeTab === 'kol' && <KOLManager bookings={bookings} />}
      </main>

      {/* Footer */}
      <footer className="border-t border-pink-100 bg-white mt-auto">
        <div className="max-w-screen-xl mx-auto px-6 py-3 flex items-center justify-between text-xs text-gray-400 flex-wrap gap-2">
          <span>© 2025 DetoxBlanc · Booking Management System</span>
          <span>
            {usingMock
              ? 'Chế độ demo — Thêm VITE_GOOGLE_API_KEY để kết nối dữ liệu thực'
              : 'Kết nối Google Sheets · Tự động làm mới mỗi 5 phút'
            }
          </span>
        </div>
      </footer>
    </div>
  );
}
