import { useState } from 'react';
import { Plus, Trash2, Save, Eye, EyeOff, RefreshCw, Building2, Users, Package, Star, Globe, Lock, CheckCircle } from 'lucide-react';
import { getAccounts, saveAccounts } from '../hooks/useAuth';

const PLATFORMS = ['TikTok', 'Instagram', 'YouTube', 'Facebook'];
const TIERS = ['KOL', 'KOC'];
const KOL_STATUSES = ['Đang hợp tác', 'Hết hạn', 'Đang thương lượng'];

function Toast({ msg }) {
  if (!msg) return null;
  return (
    <div className="fixed bottom-6 right-6 bg-emerald-500 text-white px-4 py-3 rounded-xl shadow-lg flex items-center gap-2 text-sm z-50 animate-bounce">
      <CheckCircle size={16} /> {msg}
    </div>
  );
}

function SectionCard({ title, children }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-pink-100 overflow-hidden">
      <div className="px-5 py-4 border-b border-pink-50 bg-pink-50/40">
        <h3 className="font-semibold text-gray-700 text-sm">{title}</h3>
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

// ─── TAB: Công ty ───────────────────────────────────────────────────────────
function CompanyTab({ companyName, setCompanyName, sheetsApiKey, setSheetsApiKey }) {
  const [name, setName] = useState(companyName);
  const [key, setKey] = useState(sheetsApiKey);
  const [showKey, setShowKey] = useState(false);
  const [toast, setToast] = useState('');

  const save = () => {
    setCompanyName(name);
    setSheetsApiKey(key);
    setToast('Đã lưu cài đặt!');
    setTimeout(() => setToast(''), 2500);
  };

  return (
    <div className="space-y-4">
      <Toast msg={toast} />
      <SectionCard title="Thông tin công ty">
        <div className="space-y-3">
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Tên công ty</label>
            <input className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-pink-300 focus:ring-2 focus:ring-pink-100"
              value={name} onChange={e => setName(e.target.value)} />
          </div>
        </div>
      </SectionCard>

      <SectionCard title="Kết nối Google Sheets">
        <div className="space-y-3">
          <p className="text-xs text-gray-500">Nhập Google Sheets API Key để đọc dữ liệu thực từ Google Sheets của bạn.</p>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">API Key</label>
            <div className="relative">
              <input
                type={showKey ? 'text' : 'password'}
                placeholder="AIza..."
                className="w-full border border-gray-200 rounded-xl px-3 py-2 pr-10 text-sm focus:outline-none focus:border-pink-300 focus:ring-2 focus:ring-pink-100 font-mono"
                value={key} onChange={e => setKey(e.target.value)}
              />
              <button type="button" onClick={() => setShowKey(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                {showKey ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>
          <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 text-xs text-amber-700">
            <strong>Hướng dẫn:</strong> Vào console.cloud.google.com → tạo project → enable Google Sheets API → tạo API Key → paste vào đây.<br />
            Đảm bảo Google Sheet đã được chia sẻ công khai (Anyone with the link → Viewer).
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Sheet ID (từ URL Google Sheets)</label>
            <input readOnly className="w-full border border-gray-100 bg-gray-50 rounded-xl px-3 py-2 text-sm font-mono text-gray-500"
              value="1f_ZwuCvQwR-Kv1S2GR59pxSAezwU3bchJ2UYPFQT0FY" />
          </div>
        </div>
      </SectionCard>

      <button onClick={save} className="flex items-center gap-2 px-5 py-2.5 bg-pink-500 text-white rounded-xl text-sm font-medium hover:bg-pink-600 transition-colors">
        <Save size={15} /> Lưu cài đặt
      </button>
    </div>
  );
}

// ─── TAB: Nhân viên ──────────────────────────────────────────────────────────
function StaffTab({ staff, setStaff }) {
  const [form, setForm] = useState({ name: '', avatar: '' });
  const [toast, setToast] = useState('');

  const add = () => {
    if (!form.name.trim()) return;
    const avatar = form.avatar || form.name.split(' ').slice(-2).map(w => w[0]).join('').toUpperCase();
    const newStaff = [...staff, { id: `S${Date.now()}`, name: form.name.trim(), avatar }];
    setStaff(newStaff);
    setForm({ name: '', avatar: '' });
    setToast('Đã thêm nhân viên!');
    setTimeout(() => setToast(''), 2000);
  };

  const remove = id => setStaff(staff.filter(s => s.id !== id));

  return (
    <div className="space-y-4">
      <Toast msg={toast} />
      <SectionCard title="Thêm nhân viên mới">
        <div className="flex gap-3 flex-wrap">
          <input placeholder="Tên nhân viên *" className="flex-1 min-w-[180px] border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-pink-300 focus:ring-2 focus:ring-pink-100"
            value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            onKeyDown={e => e.key === 'Enter' && add()} />
          <input placeholder="Avatar (vd: NM)" maxLength={3}
            className="w-24 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-pink-300 focus:ring-2 focus:ring-pink-100 uppercase"
            value={form.avatar} onChange={e => setForm(f => ({ ...f, avatar: e.target.value.toUpperCase() }))} />
          <button onClick={add} className="flex items-center gap-2 px-4 py-2 bg-pink-500 text-white rounded-xl text-sm font-medium hover:bg-pink-600">
            <Plus size={15} /> Thêm
          </button>
        </div>
      </SectionCard>

      <SectionCard title={`Danh sách nhân viên (${staff.length})`}>
        <div className="space-y-2">
          {staff.map(s => (
            <div key={s.id} className="flex items-center justify-between py-2.5 px-3 bg-gray-50 rounded-xl hover:bg-pink-50/50 transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-pink-300 to-fuchsia-400 flex items-center justify-center text-xs font-bold text-white">
                  {s.avatar}
                </div>
                <span className="text-sm font-medium text-gray-700">{s.name}</span>
              </div>
              <button onClick={() => remove(s.id)} className="text-gray-300 hover:text-red-400 transition-colors p-1">
                <Trash2 size={15} />
              </button>
            </div>
          ))}
          {staff.length === 0 && <p className="text-center text-gray-400 text-sm py-4">Chưa có nhân viên</p>}
        </div>
      </SectionCard>
    </div>
  );
}

// ─── TAB: Sản phẩm ──────────────────────────────────────────────────────────
function ProductsTab({ products, setProducts }) {
  const [newProduct, setNewProduct] = useState('');
  const [toast, setToast] = useState('');

  const add = () => {
    if (!newProduct.trim() || products.includes(newProduct.trim())) return;
    setProducts([...products, newProduct.trim()]);
    setNewProduct('');
    setToast('Đã thêm sản phẩm!');
    setTimeout(() => setToast(''), 2000);
  };

  const remove = p => setProducts(products.filter(x => x !== p));

  return (
    <div className="space-y-4">
      <Toast msg={toast} />
      <SectionCard title="Thêm sản phẩm mới">
        <div className="flex gap-3">
          <input placeholder="Tên sản phẩm *"
            className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-pink-300 focus:ring-2 focus:ring-pink-100"
            value={newProduct} onChange={e => setNewProduct(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && add()} />
          <button onClick={add} className="flex items-center gap-2 px-4 py-2 bg-pink-500 text-white rounded-xl text-sm font-medium hover:bg-pink-600">
            <Plus size={15} /> Thêm
          </button>
        </div>
      </SectionCard>

      <SectionCard title={`Danh sách sản phẩm (${products.length})`}>
        <div className="space-y-2">
          {products.map((p, i) => (
            <div key={i} className="flex items-center justify-between py-2.5 px-3 bg-gray-50 rounded-xl hover:bg-pink-50/50 transition-colors">
              <span className="text-sm text-gray-700">{p}</span>
              <button onClick={() => remove(p)} className="text-gray-300 hover:text-red-400 transition-colors p-1">
                <Trash2 size={15} />
              </button>
            </div>
          ))}
          {products.length === 0 && <p className="text-center text-gray-400 text-sm py-4">Chưa có sản phẩm</p>}
        </div>
      </SectionCard>
    </div>
  );
}

// ─── TAB: KOL/KOC ────────────────────────────────────────────────────────────
function KOLTab({ kols, setKols }) {
  const [form, setForm] = useState({ name: '', platform: 'TikTok', followers: '', tier: 'KOL', commission: 5, status: 'Đang hợp tác' });
  const [toast, setToast] = useState('');
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const add = () => {
    if (!form.name.trim()) return;
    const avatar = form.name.split('_')[0].slice(0, 2).toUpperCase();
    setKols([...kols, { ...form, id: `K${Date.now()}`, avatar, commission: Number(form.commission) }]);
    setForm({ name: '', platform: 'TikTok', followers: '', tier: 'KOL', commission: 5, status: 'Đang hợp tác' });
    setToast('Đã thêm KOL/KOC!');
    setTimeout(() => setToast(''), 2000);
  };

  const remove = id => setKols(kols.filter(k => k.id !== id));

  return (
    <div className="space-y-4">
      <Toast msg={toast} />
      <SectionCard title="Thêm KOL/KOC mới">
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2">
            <label className="text-xs text-gray-500 mb-1 block">Tên / Username *</label>
            <input placeholder="Beauty_Linh" className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-pink-300 focus:ring-2 focus:ring-pink-100"
              value={form.name} onChange={e => set('name', e.target.value)} />
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Platform</label>
            <select className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-pink-300 focus:ring-2 focus:ring-pink-100"
              value={form.platform} onChange={e => set('platform', e.target.value)}>
              {PLATFORMS.map(p => <option key={p}>{p}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Followers (vd: 500K)</label>
            <input placeholder="500K" className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-pink-300 focus:ring-2 focus:ring-pink-100"
              value={form.followers} onChange={e => set('followers', e.target.value)} />
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Tier</label>
            <select className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-pink-300 focus:ring-2 focus:ring-pink-100"
              value={form.tier} onChange={e => set('tier', e.target.value)}>
              {TIERS.map(t => <option key={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Hoa hồng (%)</label>
            <input type="number" min={0} max={100} className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-pink-300 focus:ring-2 focus:ring-pink-100"
              value={form.commission} onChange={e => set('commission', e.target.value)} />
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Trạng thái</label>
            <select className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-pink-300 focus:ring-2 focus:ring-pink-100"
              value={form.status} onChange={e => set('status', e.target.value)}>
              {KOL_STATUSES.map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
        </div>
        <button onClick={add} className="mt-3 flex items-center gap-2 px-4 py-2 bg-pink-500 text-white rounded-xl text-sm font-medium hover:bg-pink-600">
          <Plus size={15} /> Thêm KOL/KOC
        </button>
      </SectionCard>

      <SectionCard title={`Danh sách KOL/KOC (${kols.length})`}>
        <div className="space-y-2">
          {kols.map(k => (
            <div key={k.id} className="flex items-center justify-between py-2.5 px-3 bg-gray-50 rounded-xl hover:bg-pink-50/50 transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-pink-200 to-fuchsia-300 flex items-center justify-center text-xs font-bold text-white">
                  {k.avatar}
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-700">{k.name}</div>
                  <div className="text-xs text-gray-400">{k.platform} · {k.followers} · {k.commission}% hoa hồng</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-xs px-2 py-0.5 rounded-lg font-medium ${k.status === 'Đang hợp tác' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>
                  {k.status}
                </span>
                <button onClick={() => remove(k.id)} className="text-gray-300 hover:text-red-400 transition-colors p-1">
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          ))}
          {kols.length === 0 && <p className="text-center text-gray-400 text-sm py-4">Chưa có KOL/KOC</p>}
        </div>
      </SectionCard>
    </div>
  );
}

// ─── TAB: Nguồn ──────────────────────────────────────────────────────────────
function SourcesTab({ sources, setSources }) {
  const [newSource, setNewSource] = useState('');
  const [toast, setToast] = useState('');

  const add = () => {
    if (!newSource.trim() || sources.includes(newSource.trim())) return;
    setSources([...sources, newSource.trim()]);
    setNewSource('');
    setToast('Đã thêm nguồn!');
    setTimeout(() => setToast(''), 2000);
  };

  const remove = s => setSources(sources.filter(x => x !== s));

  return (
    <div className="space-y-4">
      <Toast msg={toast} />
      <SectionCard title="Thêm nguồn booking">
        <div className="flex gap-3">
          <input placeholder="Tên nguồn (vd: Shopee, Lazada...)"
            className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-pink-300 focus:ring-2 focus:ring-pink-100"
            value={newSource} onChange={e => setNewSource(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && add()} />
          <button onClick={add} className="flex items-center gap-2 px-4 py-2 bg-pink-500 text-white rounded-xl text-sm font-medium hover:bg-pink-600">
            <Plus size={15} /> Thêm
          </button>
        </div>
      </SectionCard>

      <SectionCard title={`Nguồn booking (${sources.length})`}>
        <div className="flex flex-wrap gap-2">
          {sources.map((s, i) => (
            <span key={i} className="flex items-center gap-1.5 bg-pink-50 text-pink-700 text-sm px-3 py-1.5 rounded-xl border border-pink-100">
              {s}
              <button onClick={() => remove(s)} className="text-pink-300 hover:text-red-400 transition-colors">
                <Trash2 size={12} />
              </button>
            </span>
          ))}
          {sources.length === 0 && <p className="text-gray-400 text-sm">Chưa có nguồn nào</p>}
        </div>
      </SectionCard>
    </div>
  );
}

// ─── TAB: Tài khoản ──────────────────────────────────────────────────────────
function AccountsTab({ currentUser }) {
  const [accounts, setAccountsState] = useState(getAccounts);
  const [form, setForm] = useState({ username: '', password: '', displayName: '', role: 'staff' });
  const [showPws, setShowPws] = useState({});
  const [toast, setToast] = useState('');
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const save = accs => { saveAccounts(accs); setAccountsState(accs); };

  const add = () => {
    if (!form.username.trim() || !form.password.trim()) return;
    if (accounts.find(a => a.username === form.username)) return;
    save([...accounts, { ...form, displayName: form.displayName || form.username }]);
    setForm({ username: '', password: '', displayName: '', role: 'staff' });
    setToast('Đã thêm tài khoản!');
    setTimeout(() => setToast(''), 2000);
  };

  const remove = username => {
    if (username === currentUser?.username) return;
    save(accounts.filter(a => a.username !== username));
  };

  return (
    <div className="space-y-4">
      <Toast msg={toast} />
      <SectionCard title="Thêm tài khoản mới">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Tên đăng nhập *</label>
            <input placeholder="username" className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-pink-300 focus:ring-2 focus:ring-pink-100"
              value={form.username} onChange={e => set('username', e.target.value)} />
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Mật khẩu *</label>
            <input type="password" placeholder="••••••••" className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-pink-300 focus:ring-2 focus:ring-pink-100"
              value={form.password} onChange={e => set('password', e.target.value)} />
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Tên hiển thị</label>
            <input placeholder="Nguyễn Thị A" className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-pink-300 focus:ring-2 focus:ring-pink-100"
              value={form.displayName} onChange={e => set('displayName', e.target.value)} />
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Vai trò</label>
            <select className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-pink-300 focus:ring-2 focus:ring-pink-100"
              value={form.role} onChange={e => set('role', e.target.value)}>
              <option value="admin">Admin (toàn quyền)</option>
              <option value="staff">Nhân viên (xem & booking)</option>
            </select>
          </div>
        </div>
        <button onClick={add} className="mt-3 flex items-center gap-2 px-4 py-2 bg-pink-500 text-white rounded-xl text-sm font-medium hover:bg-pink-600">
          <Plus size={15} /> Thêm tài khoản
        </button>
      </SectionCard>

      <SectionCard title={`Danh sách tài khoản (${accounts.length})`}>
        <div className="space-y-2">
          {accounts.map(a => (
            <div key={a.username} className="flex items-center justify-between py-2.5 px-3 bg-gray-50 rounded-xl">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-pink-300 to-fuchsia-400 flex items-center justify-center text-xs font-bold text-white">
                  {(a.displayName || a.username)[0].toUpperCase()}
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-700">{a.displayName || a.username}</div>
                  <div className="text-xs text-gray-400">@{a.username} · {a.role === 'admin' ? 'Admin' : 'Nhân viên'}</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {a.username === currentUser?.username && (
                  <span className="text-xs bg-pink-100 text-pink-600 px-2 py-0.5 rounded-lg">Bạn</span>
                )}
                {a.username !== currentUser?.username && (
                  <button onClick={() => remove(a.username)} className="text-gray-300 hover:text-red-400 transition-colors p-1">
                    <Trash2 size={15} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </SectionCard>
    </div>
  );
}

// ─── MAIN SETTINGS ───────────────────────────────────────────────────────────
const TABS = [
  { id: 'company', label: 'Công ty', icon: Building2 },
  { id: 'staff', label: 'Nhân viên', icon: Users },
  { id: 'products', label: 'Sản phẩm', icon: Package },
  { id: 'kol', label: 'KOL/KOC', icon: Star },
  { id: 'sources', label: 'Nguồn', icon: Globe },
  { id: 'accounts', label: 'Tài khoản', icon: Lock },
];

export default function Settings({ settings, user }) {
  const [activeTab, setActiveTab] = useState('company');
  const { staff, setStaff, products, setProducts, kols, setKols, sources, setSources, sheetsApiKey, setSheetsApiKey, companyName, setCompanyName } = settings;

  return (
    <div className="space-y-6">
      {/* Tab nav */}
      <div className="flex gap-1 bg-pink-50 p-1 rounded-2xl flex-wrap">
        {TABS.map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${isActive ? 'bg-white text-pink-600 shadow-sm' : 'text-gray-500 hover:text-pink-500'}`}>
              <Icon size={15} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      {activeTab === 'company' && <CompanyTab companyName={companyName} setCompanyName={setCompanyName} sheetsApiKey={sheetsApiKey} setSheetsApiKey={setSheetsApiKey} />}
      {activeTab === 'staff' && <StaffTab staff={staff} setStaff={setStaff} />}
      {activeTab === 'products' && <ProductsTab products={products} setProducts={setProducts} />}
      {activeTab === 'kol' && <KOLTab kols={kols} setKols={setKols} />}
      {activeTab === 'sources' && <SourcesTab sources={sources} setSources={setSources} />}
      {activeTab === 'accounts' && <AccountsTab currentUser={user} />}
    </div>
  );
}
