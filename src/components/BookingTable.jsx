import { useState, useMemo, useCallback } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  flexRender,
} from '@tanstack/react-table';
import { Search, ChevronUp, ChevronDown, ChevronsUpDown, ChevronLeft, ChevronRight, Plus, X, SlidersHorizontal } from 'lucide-react';
import { formatCurrency, formatDate, getStatusColor } from '../utils/formatters';
import { STATUSES, SOURCES, STAFF, PRODUCTS } from '../data/mockData';

const STATUS_FLOW = ['Mới', 'Đang xử lý', 'Đã chốt', 'Hủy'];

function StatusBadge({ status }) {
  const c = getStatusColor(status);
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${c.bg} ${c.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`}></span>
      {status}
    </span>
  );
}

function EditModal({ booking, onClose, onSave }) {
  const [form, setForm] = useState({ ...booking });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-pink-100 px-6 py-4 flex items-center justify-between rounded-t-2xl">
          <h3 className="font-semibold text-gray-800">Chi tiết booking #{form.id}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X size={20} />
          </button>
        </div>
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="text-xs text-gray-500 mb-1 block">Tên khách hàng</label>
              <input className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-pink-300 focus:ring-2 focus:ring-pink-100"
                value={form.customerName} onChange={e => set('customerName', e.target.value)} />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Số điện thoại</label>
              <input className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-pink-300 focus:ring-2 focus:ring-pink-100"
                value={form.phone} onChange={e => set('phone', e.target.value)} />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Trạng thái</label>
              <select className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-pink-300 focus:ring-2 focus:ring-pink-100"
                value={form.status} onChange={e => set('status', e.target.value)}>
                {STATUSES.map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div className="col-span-2">
              <label className="text-xs text-gray-500 mb-1 block">Sản phẩm</label>
              <select className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-pink-300 focus:ring-2 focus:ring-pink-100"
                value={form.product} onChange={e => set('product', e.target.value)}>
                {PRODUCTS.map(p => <option key={p}>{p}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Số lượng</label>
              <input type="number" min={1} className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-pink-300 focus:ring-2 focus:ring-pink-100"
                value={form.qty} onChange={e => set('qty', parseInt(e.target.value) || 1)} />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Đơn giá (VNĐ)</label>
              <input type="number" className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-pink-300 focus:ring-2 focus:ring-pink-100"
                value={form.unitPrice} onChange={e => set('unitPrice', parseFloat(e.target.value) || 0)} />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Nhân viên phụ trách</label>
              <select className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-pink-300 focus:ring-2 focus:ring-pink-100"
                value={form.staffName} onChange={e => set('staffName', e.target.value)}>
                {STAFF.map(s => <option key={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Nguồn</label>
              <select className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-pink-300 focus:ring-2 focus:ring-pink-100"
                value={form.source} onChange={e => set('source', e.target.value)}>
                {SOURCES.map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div className="col-span-2">
              <label className="text-xs text-gray-500 mb-1 block">Ghi chú</label>
              <textarea rows={3} className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-pink-300 focus:ring-2 focus:ring-pink-100 resize-none"
                value={form.note} onChange={e => set('note', e.target.value)} />
            </div>
          </div>
        </div>
        <div className="sticky bottom-0 bg-white border-t border-pink-100 px-6 py-4 flex gap-3 justify-end rounded-b-2xl">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">
            Hủy
          </button>
          <button onClick={() => onSave({ ...form, totalValue: form.qty * form.unitPrice })}
            className="px-4 py-2 text-sm text-white bg-pink-500 rounded-xl hover:bg-pink-600 transition-colors font-medium">
            Lưu thay đổi
          </button>
        </div>
      </div>
    </div>
  );
}

function AddModal({ onClose, onAdd }) {
  const [form, setForm] = useState({
    customerName: '', phone: '', product: PRODUCTS[0], qty: 1,
    unitPrice: 500000, staffName: STAFF[0].name, source: SOURCES[0],
    status: 'Mới', note: '', kolName: null,
  });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-pink-100 px-6 py-4 flex items-center justify-between rounded-t-2xl">
          <h3 className="font-semibold text-gray-800">Thêm booking mới</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
        </div>
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="text-xs text-gray-500 mb-1 block">Tên khách hàng *</label>
              <input placeholder="Nguyễn Thị A" className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-pink-300 focus:ring-2 focus:ring-pink-100"
                value={form.customerName} onChange={e => set('customerName', e.target.value)} />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Số điện thoại</label>
              <input placeholder="0901234567" className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-pink-300 focus:ring-2 focus:ring-pink-100"
                value={form.phone} onChange={e => set('phone', e.target.value)} />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Trạng thái</label>
              <select className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-pink-300 focus:ring-2 focus:ring-pink-100"
                value={form.status} onChange={e => set('status', e.target.value)}>
                {STATUSES.map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div className="col-span-2">
              <label className="text-xs text-gray-500 mb-1 block">Sản phẩm</label>
              <select className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-pink-300 focus:ring-2 focus:ring-pink-100"
                value={form.product} onChange={e => set('product', e.target.value)}>
                {PRODUCTS.map(p => <option key={p}>{p}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Số lượng</label>
              <input type="number" min={1} className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-pink-300 focus:ring-2 focus:ring-pink-100"
                value={form.qty} onChange={e => set('qty', parseInt(e.target.value) || 1)} />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Đơn giá (VNĐ)</label>
              <input type="number" className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-pink-300 focus:ring-2 focus:ring-pink-100"
                value={form.unitPrice} onChange={e => set('unitPrice', parseFloat(e.target.value) || 0)} />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Nhân viên</label>
              <select className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-pink-300 focus:ring-2 focus:ring-pink-100"
                value={form.staffName} onChange={e => set('staffName', e.target.value)}>
                {STAFF.map(s => <option key={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Nguồn</label>
              <select className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-pink-300 focus:ring-2 focus:ring-pink-100"
                value={form.source} onChange={e => set('source', e.target.value)}>
                {SOURCES.map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div className="col-span-2">
              <label className="text-xs text-gray-500 mb-1 block">Ghi chú</label>
              <textarea rows={2} className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-pink-300 focus:ring-2 focus:ring-pink-100 resize-none"
                value={form.note} onChange={e => set('note', e.target.value)} />
            </div>
          </div>
        </div>
        <div className="sticky bottom-0 bg-white border-t border-pink-100 px-6 py-4 flex gap-3 justify-end rounded-b-2xl">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">Hủy</button>
          <button onClick={() => {
            if (!form.customerName.trim()) return;
            onAdd({ ...form, totalValue: form.qty * form.unitPrice });
          }} className="px-4 py-2 text-sm text-white bg-pink-500 rounded-xl hover:bg-pink-600 transition-colors font-medium">
            Thêm booking
          </button>
        </div>
      </div>
    </div>
  );
}

export default function BookingTable({ bookings, setBookings }) {
  const [globalFilter, setGlobalFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sourceFilter, setSourceFilter] = useState('');
  const [sorting, setSorting] = useState([{ id: 'createdAt', desc: true }]);
  const [editingRow, setEditingRow] = useState(null);
  const [showAdd, setShowAdd] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  const filteredData = useMemo(() => {
    let d = bookings;
    if (statusFilter) d = d.filter(b => b.status === statusFilter);
    if (sourceFilter) d = d.filter(b => b.source === sourceFilter);
    return d;
  }, [bookings, statusFilter, sourceFilter]);

  const columns = useMemo(() => [
    {
      accessorKey: 'id',
      header: 'Mã BK',
      size: 90,
      cell: ({ getValue }) => <span className="font-mono text-xs text-pink-600 font-semibold">{getValue()}</span>,
    },
    {
      accessorKey: 'createdAt',
      header: 'Ngày',
      size: 100,
      cell: ({ getValue }) => <span className="text-xs text-gray-500">{formatDate(getValue(), true)}</span>,
    },
    {
      accessorKey: 'customerName',
      header: 'Khách hàng',
      cell: ({ row }) => (
        <div>
          <div className="font-medium text-gray-800 text-sm">{row.original.customerName}</div>
          <div className="text-xs text-gray-400">{row.original.phone}</div>
        </div>
      ),
    },
    {
      accessorKey: 'product',
      header: 'Sản phẩm',
      cell: ({ getValue, row }) => (
        <div>
          <div className="text-sm text-gray-700 leading-tight">{getValue()}</div>
          <div className="text-xs text-gray-400">SL: {row.original.qty}</div>
        </div>
      ),
    },
    {
      accessorKey: 'totalValue',
      header: 'Giá trị',
      size: 120,
      cell: ({ getValue }) => <span className="text-sm font-semibold text-gray-800">{formatCurrency(getValue())}</span>,
    },
    {
      accessorKey: 'staffName',
      header: 'Nhân viên',
      size: 130,
      cell: ({ getValue }) => (
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-pink-100 flex items-center justify-center text-xs font-bold text-pink-600 shrink-0">
            {getValue()?.split(' ').pop()?.charAt(0)}
          </div>
          <span className="text-xs text-gray-600 truncate">{getValue()}</span>
        </div>
      ),
    },
    {
      accessorKey: 'source',
      header: 'Nguồn',
      size: 90,
      cell: ({ getValue }) => <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-lg">{getValue()}</span>,
    },
    {
      accessorKey: 'status',
      header: 'Trạng thái',
      size: 120,
      cell: ({ getValue }) => <StatusBadge status={getValue()} />,
    },
  ], []);

  const table = useReactTable({
    data: filteredData,
    columns,
    state: { globalFilter, sorting },
    onGlobalFilterChange: setGlobalFilter,
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 15 } },
    globalFilterFn: (row, _, value) => {
      const v = value.toLowerCase();
      return (
        row.original.customerName?.toLowerCase().includes(v) ||
        row.original.phone?.includes(v) ||
        row.original.product?.toLowerCase().includes(v) ||
        row.original.id?.toLowerCase().includes(v) ||
        row.original.staffName?.toLowerCase().includes(v)
      );
    },
  });

  const handleSave = useCallback((updated) => {
    setBookings(prev => prev.map(b => b.id === updated.id ? { ...updated, updatedAt: new Date().toISOString() } : b));
    setEditingRow(null);
  }, [setBookings]);

  const handleAdd = useCallback((form) => {
    const newBooking = {
      ...form,
      id: `BK${String(Date.now()).slice(-4)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      staffId: STAFF.find(s => s.name === form.staffName)?.id || '',
      kolId: null,
      kolName: null,
    };
    setBookings(prev => [newBooking, ...prev]);
    setShowAdd(false);
  }, [setBookings]);

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-pink-100 overflow-hidden">
      {/* Toolbar */}
      <div className="p-4 border-b border-pink-50">
        <div className="flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-[200px]">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-pink-300 focus:ring-2 focus:ring-pink-100 bg-gray-50"
              placeholder="Tìm kiếm booking, khách hàng, SĐT..."
              value={globalFilter}
              onChange={e => setGlobalFilter(e.target.value)}
            />
          </div>

          <button onClick={() => setShowFilters(f => !f)}
            className={`flex items-center gap-2 px-3 py-2.5 text-sm border rounded-xl transition-colors ${showFilters ? 'border-pink-300 bg-pink-50 text-pink-600' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
            <SlidersHorizontal size={15} />
            Bộ lọc
            {(statusFilter || sourceFilter) && <span className="w-2 h-2 rounded-full bg-pink-500"></span>}
          </button>

          <button onClick={() => setShowAdd(true)}
            className="flex items-center gap-2 px-4 py-2.5 text-sm bg-pink-500 text-white rounded-xl hover:bg-pink-600 transition-colors font-medium">
            <Plus size={16} />
            Thêm booking
          </button>
        </div>

        {showFilters && (
          <div className="flex flex-wrap gap-3 mt-3">
            <select
              className="text-sm border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:border-pink-300 bg-gray-50"
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
            >
              <option value="">Tất cả trạng thái</option>
              {STATUSES.map(s => <option key={s}>{s}</option>)}
            </select>
            <select
              className="text-sm border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:border-pink-300 bg-gray-50"
              value={sourceFilter}
              onChange={e => setSourceFilter(e.target.value)}
            >
              <option value="">Tất cả nguồn</option>
              {SOURCES.map(s => <option key={s}>{s}</option>)}
            </select>
            {(statusFilter || sourceFilter) && (
              <button onClick={() => { setStatusFilter(''); setSourceFilter(''); }}
                className="text-xs text-pink-500 hover:text-pink-700 flex items-center gap-1">
                <X size={12} /> Xóa bộ lọc
              </button>
            )}
          </div>
        )}
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            {table.getHeaderGroups().map(hg => (
              <tr key={hg.id} className="bg-pink-50/60 border-b border-pink-100">
                {hg.headers.map(h => (
                  <th key={h.id}
                    className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap cursor-pointer select-none hover:text-pink-600 transition-colors"
                    style={{ width: h.column.getSize() }}
                    onClick={h.column.getToggleSortingHandler()}
                  >
                    <div className="flex items-center gap-1">
                      {flexRender(h.column.columnDef.header, h.getContext())}
                      {h.column.getIsSorted() === 'asc' ? <ChevronUp size={13} className="text-pink-500" /> :
                        h.column.getIsSorted() === 'desc' ? <ChevronDown size={13} className="text-pink-500" /> :
                          h.column.getCanSort() ? <ChevronsUpDown size={13} className="text-gray-300" /> : null}
                    </div>
                  </th>
                ))}
                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Hành động</th>
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.map((row, i) => (
              <tr key={row.id}
                className={`border-b border-gray-50 hover:bg-pink-50/40 transition-colors cursor-pointer ${i % 2 === 0 ? '' : 'bg-gray-50/30'}`}
                onClick={() => setEditingRow(row.original)}
              >
                {row.getVisibleCells().map(cell => (
                  <td key={cell.id} className="px-4 py-3">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
                <td className="px-4 py-3">
                  <button
                    onClick={e => { e.stopPropagation(); setEditingRow(row.original); }}
                    className="text-xs text-pink-500 hover:text-pink-700 border border-pink-200 hover:border-pink-400 px-2.5 py-1 rounded-lg transition-colors"
                  >
                    Sửa
                  </button>
                </td>
              </tr>
            ))}
            {table.getRowModel().rows.length === 0 && (
              <tr>
                <td colSpan={9} className="text-center py-12 text-gray-400 text-sm">
                  Không tìm thấy booking nào
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="px-4 py-3 border-t border-pink-50 flex items-center justify-between flex-wrap gap-2">
        <span className="text-xs text-gray-500">
          Hiển thị {table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1}–
          {Math.min((table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize, filteredData.length)} /
          {' '}{filteredData.length} booking
        </span>
        <div className="flex items-center gap-2">
          <button onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}
            className="p-1.5 rounded-lg border border-gray-200 disabled:opacity-40 hover:bg-pink-50 transition-colors">
            <ChevronLeft size={15} />
          </button>
          <span className="text-xs text-gray-600 px-2">
            Trang {table.getState().pagination.pageIndex + 1} / {table.getPageCount()}
          </span>
          <button onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}
            className="p-1.5 rounded-lg border border-gray-200 disabled:opacity-40 hover:bg-pink-50 transition-colors">
            <ChevronRight size={15} />
          </button>
        </div>
      </div>

      {editingRow && <EditModal booking={editingRow} onClose={() => setEditingRow(null)} onSave={handleSave} />}
      {showAdd && <AddModal onClose={() => setShowAdd(false)} onAdd={handleAdd} />}
    </div>
  );
}
