// Mock data for DetoxBlanc Booking Management
// Replace with real Google Sheets data when API key is configured

export const SHEET_ID = '1f_ZwuCvQwR-Kv1S2GR59pxSAezwU3bchJ2UYPFQT0FY';
export const SHEET_GID = '1970021855';

export const PRODUCTS = [
  'Serum Vitamin C DetoxBlanc',
  'Kem dưỡng trắng da ban đêm',
  'Toner làm sạch sâu',
  'Mask thải độc than hoạt tính',
  'Kem chống nắng SPF50+',
  'Sữa rửa mặt tạo bọt',
  'Tinh chất Niacinamide 10%',
  'Kem mắt chống thâm quầng',
  'Set dưỡng da 3 bước',
  'Combo whitening cao cấp',
];

export const STAFF = [
  { id: 'S001', name: 'Nguyễn Thị Mai', avatar: 'NM' },
  { id: 'S002', name: 'Trần Thị Hoa', avatar: 'TH' },
  { id: 'S003', name: 'Lê Thị Lan', avatar: 'LL' },
  { id: 'S004', name: 'Phạm Thị Thu', avatar: 'PT' },
  { id: 'S005', name: 'Hoàng Thị Yến', avatar: 'HY' },
];

export const KOLS = [
  { id: 'K001', name: 'Beauty_Linh', platform: 'TikTok', followers: '520K', tier: 'KOL', status: 'Đang hợp tác', commission: 8, avatar: 'BL' },
  { id: 'K002', name: 'Skincare_Mia', platform: 'Instagram', followers: '180K', tier: 'KOC', status: 'Đang hợp tác', commission: 5, avatar: 'SM' },
  { id: 'K003', name: 'NaturalGlow_Trang', platform: 'YouTube', followers: '92K', tier: 'KOC', status: 'Đang hợp tác', commission: 5, avatar: 'NT' },
  { id: 'K004', name: 'GlowWithMe_Hà', platform: 'TikTok', followers: '310K', tier: 'KOL', status: 'Hết hạn', commission: 7, avatar: 'GH' },
  { id: 'K005', name: 'PinkSkin_Chi', platform: 'Instagram', followers: '65K', tier: 'KOC', status: 'Đang hợp tác', commission: 4, avatar: 'PC' },
];

export const SOURCES = ['Facebook', 'TikTok', 'Instagram', 'Zalo', 'KOL/KOC', 'Website', 'Giới thiệu'];
export const STATUSES = ['Mới', 'Đang xử lý', 'Đã chốt', 'Hủy'];

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomItem(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomDate(daysAgo = 30) {
  const d = new Date();
  d.setDate(d.getDate() - randomInt(0, daysAgo));
  d.setHours(randomInt(8, 20), randomInt(0, 59));
  return d.toISOString();
}

function generatePhone() {
  const prefixes = ['090', '091', '093', '094', '096', '097', '098', '032', '033', '034', '035', '036', '037', '038', '039'];
  return randomItem(prefixes) + randomInt(1000000, 9999999).toString();
}

const firstNames = ['Nguyễn', 'Trần', 'Lê', 'Phạm', 'Hoàng', 'Huỳnh', 'Phan', 'Vũ', 'Võ', 'Đặng', 'Bùi', 'Đỗ', 'Hồ', 'Ngô', 'Dương'];
const givenNames = ['Thị Lan', 'Thị Mai', 'Thị Hoa', 'Thị Thu', 'Thị Yến', 'Thị Ngọc', 'Thị Kim', 'Thị Trang', 'Thị Linh', 'Thị Nga', 'Thị Hà', 'Thị Chi', 'Thị Bích', 'Thị Loan', 'Thị Phương'];

const statusWeights = [0.15, 0.2, 0.55, 0.1]; // Mới, Đang xử lý, Đã chốt, Hủy

function weightedStatus() {
  const r = Math.random();
  let acc = 0;
  for (let i = 0; i < STATUSES.length; i++) {
    acc += statusWeights[i];
    if (r < acc) return STATUSES[i];
  }
  return STATUSES[2];
}

export function generateBookings(count = 120) {
  const bookings = [];
  for (let i = 1; i <= count; i++) {
    const product = randomItem(PRODUCTS);
    const qty = randomInt(1, 5);
    const unitPrice = randomInt(250, 1800) * 1000;
    const staff = randomItem(STAFF);
    const source = randomItem(SOURCES);
    const kol = source === 'KOL/KOC' ? randomItem(KOLS) : null;
    const status = weightedStatus();
    const createdAt = randomDate(60);

    bookings.push({
      id: `BK${String(i).padStart(4, '0')}`,
      createdAt,
      customerName: `${randomItem(firstNames)} ${randomItem(givenNames)}`,
      phone: generatePhone(),
      product,
      qty,
      unitPrice,
      totalValue: qty * unitPrice,
      staffId: staff.id,
      staffName: staff.name,
      source,
      kolId: kol?.id || null,
      kolName: kol?.name || null,
      status,
      note: '',
      updatedAt: createdAt,
    });
  }
  return bookings.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

export const MOCK_BOOKINGS = generateBookings(120);
