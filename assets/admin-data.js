/* =========================================================================
   Detoxblanc Admin — product data layer (localStorage CRUD).
   LocalStorage key: dtx_admin_products
   Schema per SKU: { id, code, name, category, ingr, bullets[2], tag, tagCls,
                     rating, reviews, price, old, stock, lowStock, status,
                     slug, seoTitle, seoDesc, description, tags[], grad,
                     variants[{ size, price, stock }], createdAt, updatedAt }
   ========================================================================= */
(function(){
  const KEY = 'dtx_admin_products';
  const SEED_KEY = 'dtx_admin_products_seeded_v1';

  // 8 SKUs gốc trong category.html + 26 SKUs Sprint 3 generator = 34 ban đầu
  const SEED = [
    // 8 gốc
    { code:'N°01', name:'Radiance Serum N°1 — Tinh chất dưỡng sáng · mờ nám', category:'Trị nám',
      ingr:'Niacinamide 10%', b1:'Alpha Arbutin 2% + Niacinamide 10%', b2:'Hiệu quả rõ rệt sau 8 tuần',
      tag:'HOT', cls:'tag-hot', rating:'4.9', reviews:'876', price:980000, old:null, stock:42, grad:'#63C1BB' },
    { code:'N°02', name:'Melano Clear — Serum trị nám chuyên sâu', category:'Trị nám',
      ingr:'Tranexamic 5%', b1:'Tranexamic Acid 5%', b2:'Giảm 70% nám sau 12 tuần',
      tag:'-15%', cls:'tag-sale', rating:'4.8', reviews:'543', price:1050000, old:1235000, stock:128, grad:'#1F6661' },
    { code:'N°03a', name:'Bright C+ Serum — Vitamin C 15%', category:'Dưỡng trắng',
      ingr:'Vitamin C 15%', b1:'Ethyl Ascorbic + Ferulic', b2:'Làm sáng da sau 4 tuần',
      tag:null, cls:'tag-green', rating:'4.7', reviews:'421', price:820000, old:null, stock:96, grad:'#F5C46B' },
    { code:'N°09a', name:'Night Retinol — Retinol 0.3%', category:'Chống lão hoá',
      ingr:'Retinol 0.3%', b1:'Mờ nếp nhăn + tái tạo da', b2:'Công thức microencap 8h',
      tag:'NEW', cls:'tag-new', rating:'4.7', reviews:'389', price:1050000, old:null, stock:73, grad:'#1F6661' },
    { code:'N°05a', name:'Azelaic Booster — Serum làm dịu', category:'Nhạy cảm',
      ingr:'Azelaic 10%', b1:'Azelaic Acid 10%', b2:'Dịu nhẹ · giảm mẩn đỏ',
      tag:null, cls:'tag-green', rating:'4.6', reviews:'287', price:720000, old:null, stock:54, grad:'#4FB2AD' },
    { code:'MSK-00', name:'Soothing Sheet Mask — Centella + HA', category:'Mặt nạ',
      ingr:'Centella + HA', b1:'Bio-cellulose · bám sát da', b2:'Làm dịu sau nắng',
      tag:null, cls:'tag-green', rating:'4.8', reviews:'612', price:380000, old:null, stock:215, grad:'#63C1BB' },
    { code:'PEP-00', name:'Peptide Renewal Cream — Kem phục hồi', category:'Chống lão hoá',
      ingr:'Peptide complex', b1:'Matrixyl 3000 + HA', b2:'Tăng đàn hồi da',
      tag:'BEST', cls:'tag-green', rating:'4.9', reviews:'734', price:1180000, old:null, stock:81, grad:'#3AA39C' },
    { code:'SET-01', name:'Melano Expert Set — Liệu trình trị nám 4 bước', category:'Combo',
      ingr:'Combo -18%', b1:'4 sản phẩm đầy đủ', b2:'Tiết kiệm 18%',
      tag:'SET', cls:'tag-green', rating:'4.9', reviews:'523', price:1780000, old:2145000, stock:38, grad:'#1F6661' },
    // 26 từ Sprint 3
    { code:'N°03', name:'Hydra Essence N°3 — Tinh chất cấp ẩm 5 tầng', category:'Phục hồi',
      ingr:'HA 5-Weight', b1:'HA 3 tầng + Panthenol 5%', b2:'+42% độ ẩm sau 30 phút',
      tag:'NEW', cls:'tag-new', rating:'4.8', reviews:'512', price:720000, old:null, stock:112, grad:'#8DDAD4' },
    { code:'N°04', name:'Barrier Cream N°4 — Kem phục hồi hàng rào da', category:'Phục hồi',
      ingr:'Ceramide 3%', b1:'Ceramide 3-type + Cholesterol', b2:'−60% mất nước',
      tag:'BEST', cls:'tag-green', rating:'4.9', reviews:'1204', price:890000, old:null, stock:28, grad:'#63C1BB' },
    { code:'N°05', name:'Calm Rescue Balm N°5 — Kem dịu cho da kích ứng', category:'Nhạy cảm',
      ingr:'Madecassoside', b1:'TECA 0.2% + Bisabolol 1%', b2:'Dịu mẩn đỏ 15 phút',
      tag:null, cls:'tag-green', rating:'4.8', reviews:'687', price:650000, old:null, stock:142, grad:'#4FB2AD' },
    { code:'N°05A', name:'Youth Revive Serum — Retinal 0.1%', category:'Chống lão hoá',
      ingr:'Retinal 0.1%', b1:'Mờ nếp nhăn 8 tuần', b2:'Không kích ứng',
      tag:'-20%', cls:'tag-sale', rating:'4.7', reviews:'389', price:1180000, old:1475000, stock:47, grad:'#1F6661' },
    { code:'N°06', name:'Gentle Exfoliator N°6 — Tinh chất tẩy tế bào chết AHA', category:'Tẩy tế bào chết',
      ingr:'AHA 12%', b1:'Glycolic 7% + PHA 3% + Lactic 2%', b2:'Đều màu da',
      tag:null, cls:'tag-green', rating:'4.7', reviews:'456', price:680000, old:null, stock:88, grad:'#63C1BB' },
    { code:'N°07', name:'Bright C+ Serum N°7 — Vitamin C 15% ethyl ascorbic', category:'Dưỡng trắng',
      ingr:'Vitamin C 15%', b1:'C 15% ổn định 18 tháng', b2:'Sáng da sau 4 tuần',
      tag:'HOT', cls:'tag-hot', rating:'4.9', reviews:'932', price:820000, old:null, stock:18, grad:'#F5C46B' },
    { code:'N°08', name:'Clarity Toner N°8 — Nước cân bằng làm dịu lỗ chân lông', category:'Làm sạch',
      ingr:'Niacinamide 5%', b1:'pH 5.5 · không cồn', b2:'Se khít lỗ chân lông',
      tag:null, cls:'tag-green', rating:'4.8', reviews:'734', price:420000, old:null, stock:234, grad:'#63C1BB' },
    { code:'N°09', name:'Night Retinol N°9 — Kem retinol 0.3% ban đêm', category:'Chống lão hoá',
      ingr:'Retinol 0.3%', b1:'Mờ nếp nhăn + tái tạo', b2:'Giải phóng chậm 8h',
      tag:'NEW', cls:'tag-new', rating:'4.7', reviews:'421', price:1050000, old:null, stock:62, grad:'#1F6661' },
    { code:'SPF-01', name:'Sun Shield Fluid SPF50+ PA++++ — Chống nắng mỏng nhẹ', category:'Chống nắng',
      ingr:'SPF50+ PA++++', b1:'Kháng nước 80 phút', b2:'Finish lụa',
      tag:'HOT', cls:'tag-hot', rating:'4.9', reviews:'2145', price:620000, old:null, stock:34, grad:'#F5C46B' },
    { code:'SPF-02', name:'Sun Shield Tone-Up — Chống nắng nâng tông 3-trong-1', category:'Chống nắng',
      ingr:'Tone-Up SPF50+', b1:'Nâng tông tự nhiên', b2:'Dưỡng sáng',
      tag:null, cls:'tag-green', rating:'4.8', reviews:'1078', price:680000, old:null, stock:89, grad:'#F3C89A' },
    { code:'SPF-03', name:'Sun Shield Stick — Thanh chống nắng dặm lại', category:'Chống nắng',
      ingr:'SPF50+ Stick', b1:'15g · dùng trên makeup', b2:'Không bết rít',
      tag:'-10%', cls:'tag-sale', rating:'4.6', reviews:'298', price:480000, old:540000, stock:156, grad:'#F5C46B' },
    { code:'BDY-01', name:'AHA Body Milk — Sữa dưỡng thể tẩy tế bào chết', category:'Cơ thể',
      ingr:'AHA 8%', b1:'300ml · mịn mượt', b2:'Giảm thâm cùi chỏ',
      tag:null, cls:'tag-green', rating:'4.7', reviews:'543', price:520000, old:null, stock:187, grad:'#8DDAD4' },
    { code:'BDY-02', name:'Niacinamide Body Lotion — Dưỡng thể sáng da 300ml', category:'Cơ thể',
      ingr:'Niacinamide 4%', b1:'Làm sáng đều màu', b2:'Không gây mụn',
      tag:null, cls:'tag-green', rating:'4.8', reviews:'812', price:480000, old:null, stock:203, grad:'#63C1BB' },
    { code:'BDY-03', name:'Body Sun Milk SPF50 — Sữa chống nắng toàn thân', category:'Cơ thể',
      ingr:'SPF50 Body', b1:'200ml · SPF50 · kháng nước', b2:'Thấm nhanh',
      tag:'NEW', cls:'tag-new', rating:'4.7', reviews:'276', price:550000, old:null, stock:94, grad:'#F5C46B' },
    { code:'CLS-01', name:'Micellar Water — Nước tẩy trang dịu nhẹ 500ml', category:'Làm sạch',
      ingr:'Micellar Clean', b1:'Không cần rửa lại', b2:'An toàn da nhạy cảm',
      tag:null, cls:'tag-green', rating:'4.8', reviews:'1432', price:340000, old:null, stock:312, grad:'#A6E0DB' },
    { code:'CLS-02', name:'Gentle Gel Cleanser — Sữa rửa mặt dịu pH 5.5', category:'Làm sạch',
      ingr:'pH 5.5', b1:'Không sulfate · paraben', b2:'Sạch sâu không khô',
      tag:null, cls:'tag-green', rating:'4.9', reviews:'987', price:320000, old:null, stock:276, grad:'#63C1BB' },
    { code:'CLS-03', name:'Cleansing Balm — Sáp tẩy trang sâu tầng kép', category:'Làm sạch',
      ingr:'Balm Cleanser', b1:'Sạch makeup lì & SPF', b2:'Không bít tắc',
      tag:null, cls:'tag-green', rating:'4.7', reviews:'654', price:420000, old:null, stock:121, grad:'#F3D999' },
    { code:'MSK-01', name:'Cica Mask Sheet — Mặt nạ giấy phục hồi x10', category:'Mặt nạ',
      ingr:'Centella Mask', b1:'Bio-cellulose', b2:'Làm dịu sau nắng',
      tag:'HOT', cls:'tag-hot', rating:'4.8', reviews:'1098', price:380000, old:null, stock:245, grad:'#63C1BB' },
    { code:'MSK-02', name:'Overnight Hydro Mask — Mặt nạ ngủ cấp ẩm sâu', category:'Mặt nạ',
      ingr:'Hydro Overnight', b1:'100ml · căng mọng', b2:'Không bết rít',
      tag:null, cls:'tag-green', rating:'4.8', reviews:'723', price:480000, old:null, stock:168, grad:'#8DDAD4' },
    { code:'EYE-01', name:'Peptide Eye Serum — Tinh chất vùng mắt 15ml', category:'Đặc trị vùng',
      ingr:'Eye Peptide', b1:'Giảm bọng mắt · quầng', b2:'Mịn chân chim',
      tag:'-15%', cls:'tag-sale', rating:'4.7', reviews:'489', price:680000, old:800000, stock:67, grad:'#1F6661' },
    { code:'EYE-02', name:'Bright Eye Patch — Mặt nạ mắt hydrogel x60', category:'Đặc trị vùng',
      ingr:'Eye Patch x60', b1:'Cấp ẩm tức thì', b2:'60 miếng · 3 lần/tuần',
      tag:'NEW', cls:'tag-new', rating:'4.6', reviews:'354', price:420000, old:null, stock:98, grad:'#F5C46B' },
    { code:'LIP-01', name:'Lip Recovery Balm — Son dưỡng môi SPF15', category:'Đặc trị vùng',
      ingr:'Lip SPF15', b1:'Làm mềm · chống UV', b2:'Không màu · mùi · paraben',
      tag:null, cls:'tag-green', rating:'4.8', reviews:'601', price:180000, old:null, stock:189, grad:'#F3B7B7' },
    { code:'HND-01', name:'Hand Repair Cream — Kem dưỡng tay phục hồi 60ml', category:'Đặc trị vùng',
      ingr:'Hand Niacinamide', b1:'Làm sáng · mờ đốm tay', b2:'Thấm nhanh',
      tag:null, cls:'tag-green', rating:'4.7', reviews:'287', price:260000, old:null, stock:143, grad:'#8DDAD4' },
    { code:'ACN-01', name:'Pore Minimizer — Tinh chất BHA 2% se lỗ chân lông', category:'Trị mụn',
      ingr:'BHA 2%', b1:'Giảm mụn đầu đen', b2:'Không làm mỏng da',
      tag:'HOT', cls:'tag-hot', rating:'4.8', reviews:'821', price:520000, old:null, stock:56, grad:'#63C1BB' },
    { code:'MLN-01', name:'Tone Corrector — Kem đồng đều màu da Tranexamic', category:'Dưỡng trắng',
      ingr:'Tranexamic 5%', b1:'Mờ thâm sau mụn', b2:'An toàn thai kỳ',
      tag:null, cls:'tag-green', rating:'4.8', reviews:'612', price:780000, old:null, stock:79, grad:'#1F6661' },
    { code:'SET-04', name:'Clinical Routine Bundle — Bộ 4 bước căn bản', category:'Combo',
      ingr:'Bundle 4pc', b1:'Toner + Serum + Cream + SPF', b2:'Tiết kiệm 22%',
      tag:'SET', cls:'tag-green', rating:'4.9', reviews:'1876', price:1980000, old:2540000, stock:24, grad:'#1F6661' },
  ];

  function slug(s){
    return String(s).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'')
      .replace(/đ/g,'d').replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'').slice(0,80);
  }

  function normalize(p, i){
    const now = new Date().toISOString();
    const id = p.id || ('sku_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2,7));
    return {
      id,
      code: p.code || ('SKU-' + (i+1)),
      name: p.name || 'Sản phẩm chưa đặt tên',
      category: p.category || 'Chưa phân loại',
      ingr: p.ingr || '',
      bullets: p.bullets || [p.b1, p.b2].filter(Boolean),
      tag: p.tag || null,
      tagCls: p.tagCls || p.cls || 'tag-green',
      rating: Number(p.rating || 4.8),
      reviews: Number(String(p.reviews || 0).replace(/[^\d]/g,'') || 0),
      price: Number(p.price || 0),
      old: p.old ? Number(String(p.old).replace(/[^\d]/g,'')) : null,
      stock: Number(p.stock != null ? p.stock : 100),
      reserved: Number(p.reserved || 0),
      avgCost: Number(p.avgCost || 0),
      lowStock: Number(p.lowStock || 30),
      status: p.status || 'active',
      slug: p.slug || slug(p.name || p.code || id),
      seoTitle: p.seoTitle || '',
      seoDesc: p.seoDesc || '',
      description: p.description || '',
      tags: Array.isArray(p.tags) ? p.tags : [],
      grad: p.grad || '#63C1BB',
      variants: Array.isArray(p.variants) ? p.variants : [],
      createdAt: p.createdAt || now,
      updatedAt: now,
    };
  }

  function load(){
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) return JSON.parse(raw);
    } catch(_){}
    return null;
  }

  function save(list){
    localStorage.setItem(KEY, JSON.stringify(list));
    window.dispatchEvent(new CustomEvent('dtx:products-updated', { detail:{ count:list.length } }));
  }

  function seedIfNeeded(){
    if (localStorage.getItem(SEED_KEY)) return load() || [];
    const seeded = SEED.map((p, i) => normalize(p, i));
    save(seeded);
    localStorage.setItem(SEED_KEY, '1');
    return seeded;
  }

  const API = {
    all(){ return load() || seedIfNeeded() },
    get(id){ return (this.all()).find(p => p.id === id) || null },
    create(partial){
      const list = this.all();
      const p = normalize({ ...partial, createdAt: new Date().toISOString() }, list.length);
      list.unshift(p);
      save(list);
      return p;
    },
    update(id, patch){
      const list = this.all();
      const idx = list.findIndex(p => p.id === id);
      if (idx < 0) return null;
      list[idx] = normalize({ ...list[idx], ...patch, id }, idx);
      save(list);
      return list[idx];
    },
    remove(id){
      const list = this.all().filter(p => p.id !== id);
      save(list);
    },
    removeMany(ids){
      const set = new Set(ids);
      save(this.all().filter(p => !set.has(p.id)));
    },
    setStatus(ids, status){
      const set = new Set(ids);
      const list = this.all().map(p => set.has(p.id) ? { ...p, status, updatedAt: new Date().toISOString() } : p);
      save(list);
    },
    reset(){
      localStorage.removeItem(KEY);
      localStorage.removeItem(SEED_KEY);
      return this.all();
    },
    formatVND(n){
      if (n == null) return '';
      return Number(n).toLocaleString('vi-VN') + '₫';
    },
    slug,
  };

  window.DTX_ADMIN = API;
})();
