import { useState } from 'react';
import { Eye, EyeOff, Lock, User } from 'lucide-react';

export default function Login({ onLogin }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    setError('');
    await new Promise(r => setTimeout(r, 400));
    const ok = onLogin(username, password);
    if (!ok) setError('Tên đăng nhập hoặc mật khẩu không đúng');
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-fuchsia-50 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-pink-400 to-fuchsia-500 flex items-center justify-center shadow-lg mx-auto mb-4">
            <span className="text-white font-bold text-2xl">DB</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-800">DetoxBlanc</h1>
          <p className="text-sm text-pink-400 mt-1">Booking Management System</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-lg border border-pink-100 p-8">
          <h2 className="text-lg font-semibold text-gray-700 mb-6 text-center">Đăng nhập</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs text-gray-500 mb-1.5 block font-medium">Tên đăng nhập</label>
              <div className="relative">
                <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="admin"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-pink-300 focus:ring-2 focus:ring-pink-100 bg-gray-50"
                  autoFocus
                />
              </div>
            </div>

            <div>
              <label className="text-xs text-gray-500 mb-1.5 block font-medium">Mật khẩu</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type={showPw ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full pl-9 pr-10 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-pink-300 focus:ring-2 focus:ring-pink-100 bg-gray-50"
                />
                <button type="button" onClick={() => setShowPw(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 text-xs rounded-xl px-3 py-2.5">
                {error}
              </div>
            )}

            <button type="submit" disabled={loading || !username || !password}
              className="w-full py-2.5 bg-gradient-to-r from-pink-500 to-fuchsia-500 text-white rounded-xl font-medium text-sm hover:from-pink-600 hover:to-fuchsia-600 transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed mt-2">
              {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
            </button>
          </form>

          <div className="mt-6 p-3 bg-pink-50 rounded-xl text-xs text-gray-500 text-center">
            Tài khoản mặc định:<br />
            <span className="font-mono font-semibold text-pink-600">admin</span> / <span className="font-mono font-semibold text-pink-600">detoxblanc2025</span>
          </div>
        </div>
      </div>
    </div>
  );
}
