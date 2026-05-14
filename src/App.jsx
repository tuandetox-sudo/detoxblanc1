import { useState } from 'react';
import { LayoutDashboard, CalendarCheck, BarChart3, Users, RefreshCw, AlertCircle, Wifi, WifiOff, Menu, X, Settings as SettingsIcon, LogOut, ChevronDown, Database } from 'lucide-react';
import Dashboard from './components/Dashboard';
import BookingTable from './components/BookingTable';
import StaffReport from './components/StaffReport';
import KOLManager from './components/KOLManager';
import Settings from './components/Settings';
import Login from './components/Login';
import { useGoogleSheetsDB } from './hooks/useGoogleSheetsDB';
import { useAuth } from './hooks/useAuth';
import { useSettings } from './hooks/useSettings';

const TABS = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'bookings', label: 'Quản lý Booking', icon: CalendarCheck },
  { id: 'staff', label: 'Báo cáo NV', icon: BarChart3 },
  { id: 'kol', label: 'KOL/KOC', icon: Users },
];

export default function App() {
  const { user, login, logout } = useAuth();
  const settings = useSettings();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const { bookings, loading, saving, error, usingMock, refresh, addBooking, updateBooking, deleteBooking } = useGoogleSheetsDB(settings.scriptUrl);

  if (!user) return <Login onLogin={login} />;

  const currentTab = activeTab === 'settings' ? { label: 'Cài đặt' } : TABS.find(t => t.id === activeTab);

  return (
    <div className="min-h-screen bg-[#fdf8f6] flex flex-col">
      <header className="bg-white border-b border-pink-100 sticky top-0 z-40 shadow-sm">
        <div className="max-w-screen-xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-pink-400 to-fuchsia-500 flex items-center justify-center shadow-md">
                <span className="text-white font-bold text-sm">DB</span>
              </div>
              <div>
                <div className="font-bold text-gray-800 leading-tight text-sm sm:text-base">{settings.companyName}</div>
                <div className="text-xs text-pink-400 font-medium leading-tight hidden sm:block">Booking Management</div>
              </div>
            </div>

            <nav className="hidden md:flex items-center gap-1">
              {TABS.map(tab => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${isActive ? 'bg-pink-50 text-pink-600 shadow-sm' : 'text-gray-500 hover:text-pink-500 hover:bg-pink-50/50'}`}>
                    <Icon size={16} />{tab.label}
                  </button>
                );
              })}
              {user.role === 'admin' && (
                <button onClick={() => setActiveTab('settings')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${activeTab === 'settings' ? 'bg-pink-50 text-pink-600 shadow-sm' : 'text-gray-500 hover:text-pink-500 hover:bg-pink-50/50'}`}>
                  <SettingsIcon size={16} />Cài đặt
                </button>
              )}
            </nav>

            <div className="flex items-center gap-3">
              {(loading || saving) && (
                <div className="flex items-center gap-1.5 text-xs text-gray-400">
                  <RefreshCw size={13} className="animate-spin" />
                  <span className="hidden sm:inline">{saving ? 'Đang lưu...' : 'Đang tải...'}</span>
                </div>
              )}
              {usingMock && !loading && (
                <div className="flex items-center gap-1.5 text-xs text-amber-500 bg-amber-50 px-2.5 py-1 rounded-lg">
                  <WifiOff size={13} />
                  <span className="hidden sm:inline">Dữ liệu mẫu</span>
                </div>
              )}
              {!usingMock && !loading && (
                <button onClick={refresh} className="flex items-center gap-1.5 text-xs text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-lg hover:bg-emerald-100 transition-colors">
                  <Database size={13} />
                  <span className="hidden sm:inline">Google Sheets</span>
                </button>
              )}

              <div className="relative hidden md:block">
                <button onClick={() => setShowUserMenu(v => !v)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-xl hover:bg-pink-50 transition-colors text-sm text-gray-600">
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-pink-400 to-fuchsia-500 flex items-center justify-center text-xs font-bold text-white">
                    {(user.displayName || user.username)[0].toUpperCase()}
                  </div>
                  <span className="font-medium">{user.displayName || user.username}</span>
                  <ChevronDown size={14} />
                </button>
                {showUserMenu && (
                  <div className="absolute right-0 top-full mt-1 bg-white rounded-xl shadow-lg border border-pink-100 py-1 w-44 z-50">
                    <div className="px-3 py-2 border-b border-gray-50">
                      <div className="text-xs font-semibold text-gray-700">{user.displayName}</div>
                      <div className="text-xs text-gray-400">{user.role === 'admin' ? 'Quản trị viên' : 'Nhân viên'}</div>
                    </div>
                    {user.role === 'admin' && (
                      <button onClick={() => { setActiveTab('settings'); setShowUserMenu(false); }}
                        className="w-full text-left px-3 py-2 text-sm text-gray-600 hover:bg-pink-50 flex items-center gap-2">
                        <SettingsIcon size={14} />Cài đặt
                      </button>
                    )}
                    <button onClick={logout}
                      className="w-full text-left px-3 py-2 text-sm text-red-500 hover:bg-red-50 flex items-center gap-2">
                      <LogOut size={14} />Đăng xuất
                    </button>
                  </div>
                )}
              </div>

              <button className="md:hidden p-2 rounded-xl hover:bg-pink-50 text-gray-500"
                onClick={() => setMobileMenuOpen(v => !v)}>
                {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
              </button>
            </div>
          </div>

          {mobileMenuOpen && (
            <div className="md:hidden border-t border-pink-50 py-3 space-y-1">
              <div className="grid grid-cols-2 gap-2">
                {TABS.map(tab => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.id;
                  return (
                    <button key={tab.id} onClick={() => { setActiveTab(tab.id); setMobileMenuOpen(false); }}
                      className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium ${isActive ? 'bg-pink-50 text-pink-600' : 'text-gray-500'}`}>
                      <Icon size={16} />{tab.label}
                    </button>
                  );
                })}
                {user.role === 'admin' && (
                  <button onClick={() => { setActiveTab('settings'); setMobileMenuOpen(false); }}
                    className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium ${activeTab === 'settings' ? 'bg-pink-50 text-pink-600' : 'text-gray-500'}`}>
                    <SettingsIcon size={16} />Cài đặt
                  </button>
                )}
              </div>
              <div className="pt-2 border-t border-pink-50 flex items-center justify-between px-1">
                <span className="text-xs text-gray-500">{user.displayName} · {user.role === 'admin' ? 'Admin' : 'NV'}</span>
                <button onClick={logout} className="flex items-center gap-1 text-xs text-red-500 px-2 py-1">
                  <LogOut size={13} />Đăng xuất
                </button>
              </div>
            </div>
          )}
        </div>
      </header>

      {showUserMenu && <div className="fixed inset-0 z-30" onClick={() => setShowUserMenu(false)} />}

      <main className="flex-1 max-w-screen-xl mx-auto w-full px-4 sm:px-6 py-6">
        <div className="mb-6">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-800">{currentTab?.label}</h1>
          <p className="text-sm text-gray-400 mt-0.5">
            {activeTab !== 'settings' ? `${bookings.length} booking · Cập nhật ${new Date().toLocaleDateString('vi-VN')}` : 'Quản lý cấu hình hệ thống'}
          </p>
        </div>

        {error && activeTab !== 'settings' && (
          <div className="mb-4 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 flex items-start gap-2 text-sm text-amber-700">
            <AlertCircle size={16} className="mt-0.5 shrink-0" />
            <div>
              <strong>Không kết nối được Google Sheets:</strong> {error}
              <br />
              <span className="text-xs text-amber-600">Vào <strong>Cài đặt → Công ty</strong> để nhập API Key.</span>
            </div>
          </div>
        )}

        {activeTab === 'dashboard' && <Dashboard bookings={bookings} />}
        {activeTab === 'bookings' && <BookingTable bookings={bookings} addBooking={addBooking} updateBooking={updateBooking} deleteBooking={deleteBooking} saving={saving} />}
        {activeTab === 'staff' && <StaffReport bookings={bookings} />}
        {activeTab === 'kol' && <KOLManager bookings={bookings} />}
        {activeTab === 'settings' && <Settings settings={settings} user={user} />}
      </main>

      <footer className="border-t border-pink-100 bg-white mt-auto">
        <div className="max-w-screen-xl mx-auto px-6 py-3 flex items-center justify-between text-xs text-gray-400 flex-wrap gap-2">
          <span>© 2025 {settings.companyName} · Booking Management System</span>
          <span>{usingMock ? 'Chế độ demo — Vào Cài đặt → Google Sheets để kết nối dữ liệu thực' : 'Kết nối Google Sheets · Tự động làm mới mỗi 5 phút'}</span>
        </div>
      </footer>
    </div>
  );
}
