import { useState, useEffect, useCallback } from 'react';
import { MOCK_BOOKINGS } from '../data/mockData';

function mapRow(row) {
  return {
    _rowIndex: row._rowIndex,
    id: String(row.id || ''),
    createdAt: row.createdAt ? String(row.createdAt) : new Date().toISOString(),
    customerName: String(row.customerName || ''),
    phone: String(row.phone || ''),
    product: String(row.product || ''),
    qty: Number(row.qty) || 1,
    unitPrice: Number(row.unitPrice) || 0,
    totalValue: Number(row.totalValue) || 0,
    staffName: String(row.staffName || ''),
    staffId: '',
    source: String(row.source || ''),
    kolName: row.kolName || null,
    kolId: null,
    status: String(row.status || 'Mới'),
    note: String(row.note || ''),
    updatedAt: new Date().toISOString(),
  };
}

async function callScript(url, body) {
  const res = await fetch(url, { method: 'POST', body: JSON.stringify(body) });
  const json = await res.json();
  if (json.status !== 'ok') throw new Error(json.message || 'Script error');
  return json;
}

export function useGoogleSheetsDB(scriptUrl) {
  const [bookings, setBookings] = useState(MOCK_BOOKINGS);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [usingMock, setUsingMock] = useState(true);

  const refresh = useCallback(async () => {
    if (!scriptUrl) {
      setUsingMock(true);
      setBookings(MOCK_BOOKINGS);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(scriptUrl);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      if (json.status !== 'ok') throw new Error(json.message || 'Script error');
      const mapped = (json.data || []).map(mapRow);
      setBookings(mapped);
      setUsingMock(false);
    } catch (err) {
      setError(err.message);
      setBookings(MOCK_BOOKINGS);
      setUsingMock(true);
    } finally {
      setLoading(false);
    }
  }, [scriptUrl]);

  useEffect(() => {
    refresh();
    if (!scriptUrl) return;
    const interval = setInterval(refresh, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [refresh, scriptUrl]);

  const addBooking = useCallback(async (booking) => {
    if (!scriptUrl) {
      setBookings(prev => [booking, ...prev]);
      return booking;
    }
    setSaving(true);
    try {
      const json = await callScript(scriptUrl, { action: 'insert', row: booking });
      const withIdx = { ...booking, _rowIndex: json.rowIndex };
      setBookings(prev => [withIdx, ...prev]);
      return withIdx;
    } finally {
      setSaving(false);
    }
  }, [scriptUrl]);

  const updateBooking = useCallback(async (booking) => {
    if (!scriptUrl) {
      setBookings(prev => prev.map(b => b.id === booking.id ? booking : b));
      return;
    }
    setSaving(true);
    try {
      await callScript(scriptUrl, { action: 'update', rowIndex: booking._rowIndex, row: booking });
      setBookings(prev => prev.map(b => b.id === booking.id ? booking : b));
    } finally {
      setSaving(false);
    }
  }, [scriptUrl]);

  const deleteBooking = useCallback(async (booking) => {
    if (!scriptUrl) {
      setBookings(prev => prev.filter(b => b.id !== booking.id));
      return;
    }
    setSaving(true);
    try {
      await callScript(scriptUrl, { action: 'delete', rowIndex: booking._rowIndex });
      setBookings(prev => prev.filter(b => b.id !== booking.id));
    } finally {
      setSaving(false);
    }
  }, [scriptUrl]);

  return { bookings, loading, saving, error, usingMock, refresh, addBooking, updateBooking, deleteBooking };
}
