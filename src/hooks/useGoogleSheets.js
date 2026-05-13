import { useState, useEffect } from 'react';
import { SHEET_ID, SHEET_GID, MOCK_BOOKINGS } from '../data/mockData';

const GOOGLE_API_KEY = import.meta.env.VITE_GOOGLE_API_KEY || '';

// Map a raw row array from Google Sheets to our booking object
// Adjust column indices to match your actual sheet headers
function mapRowToBooking(row, index) {
  // Expected column order (0-indexed):
  // 0: ID, 1: Ngày tạo, 2: Tên KH, 3: SĐT, 4: Sản phẩm,
  // 5: Số lượng, 6: Đơn giá, 7: Nhân viên, 8: Nguồn, 9: KOL/KOC, 10: Trạng thái, 11: Ghi chú
  return {
    id: row[0] || `BK${String(index + 1).padStart(4, '0')}`,
    createdAt: row[1] ? new Date(row[1]).toISOString() : new Date().toISOString(),
    customerName: row[2] || '',
    phone: row[3] || '',
    product: row[4] || '',
    qty: parseInt(row[5]) || 1,
    unitPrice: parseFloat(String(row[6]).replace(/[^0-9.]/g, '')) || 0,
    totalValue: parseFloat(String(row[7] || (parseInt(row[5] || 1) * parseFloat(String(row[6] || 0).replace(/[^0-9.]/g, '')))).replace(/[^0-9.]/g, '')) || 0,
    staffId: row[7] || '',
    staffName: row[7] || '',
    source: row[8] || '',
    kolName: row[9] || null,
    kolId: null,
    status: row[10] || 'Mới',
    note: row[11] || '',
    updatedAt: row[1] ? new Date(row[1]).toISOString() : new Date().toISOString(),
  };
}

export function useGoogleSheets() {
  const [bookings, setBookings] = useState(MOCK_BOOKINGS);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [usingMock, setUsingMock] = useState(true);

  useEffect(() => {
    if (!GOOGLE_API_KEY) {
      setUsingMock(true);
      setBookings(MOCK_BOOKINGS);
      return;
    }

    async function fetchSheet() {
      setLoading(true);
      setError(null);
      try {
        const range = 'A2:L1000';
        const url = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${range}?key=${GOOGLE_API_KEY}`;
        const res = await fetch(url);
        if (!res.ok) throw new Error(`Sheets API error: ${res.status}`);
        const json = await res.json();
        const rows = json.values || [];
        const mapped = rows.filter(r => r && r.length > 1).map(mapRowToBooking);
        setBookings(mapped.length > 0 ? mapped : MOCK_BOOKINGS);
        setUsingMock(mapped.length === 0);
      } catch (err) {
        console.error('Google Sheets fetch failed:', err);
        setError(err.message);
        setBookings(MOCK_BOOKINGS);
        setUsingMock(true);
      } finally {
        setLoading(false);
      }
    }

    fetchSheet();
    const interval = setInterval(fetchSheet, 5 * 60 * 1000); // refresh every 5 minutes
    return () => clearInterval(interval);
  }, []);

  return { bookings, setBookings, loading, error, usingMock };
}
