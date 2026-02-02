'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';

// ============================================
// Types
// ============================================

interface TableData {
    id: string;
    tableCode: string;
    capacity: number;
    status: string;
    order?: OrderData;
}

interface OrderItem {
    id: string;
    itemName: string;
    quantity: number;
}

interface OrderData {
    id: string;
    status: string;
    updatedAt: string;
    customerName?: string;
    items: OrderItem[];
    version?: number;
}

// ============================================
// Component
// ============================================

export default function WaiterDashboard() {
    const [tables, setTables] = useState<TableData[]>([]);
    const [loading, setLoading] = useState(true);
    const [mounted, setMounted] = useState(false);
    const [notification, setNotification] = useState<string | null>(null);
    const [updatingTableId, setUpdatingTableId] = useState<string | null>(null);
    const [activeFilter, setActiveFilter] = useState<'ALL' | 'READY' | 'ACTIVE' | 'DIRTY'>('ALL');
    const [outOfStockItems, setOutOfStockItems] = useState<string[]>([]);
    const [currentUser, setCurrentUser] = useState<any>(null);

    const fetchData = useCallback(async () => {
        try {
            const [tablesRes, ordersRes, stockRes, userRes] = await Promise.all([
                fetch('/api/tables'),
                fetch('/api/orders?status=NEW,PREPARING,READY,SERVED,BILL_REQUESTED'),
                fetch('/api/kitchen/inventory'),
                fetch('/api/auth/me')
            ]);

            const [tData, oData, sData, uData] = await Promise.all([
                tablesRes.json(),
                ordersRes.json(),
                stockRes.json(),
                userRes.json()
            ]);

            if (uData.success) setCurrentUser(uData.user);

            if (tData.success && oData.success) {
                let mapped = tData.tables.map((t: any) => ({
                    ...t,
                    order: oData.orders?.find((o: any) => o.tableCode === t.tableCode)
                }));

                if (uData.success && uData.user.role === 'WAITER') {
                    mapped = mapped.filter((t: any) => t.assignedWaiterId === uData.user.id);
                }

                setTables(mapped);
            }

            if (sData.success) {
                const oos = sData.items.filter((i: any) => !i.isAvailable).map((i: any) => i.name);
                setOutOfStockItems(oos);
            }
        } catch (err) {
            console.error('[WAITER_FETCH] Error:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    const handleMarkServed = async (e: React.MouseEvent, table: TableData) => {
        e.preventDefault(); e.stopPropagation();
        if (!table.order || updatingTableId) return;
        setUpdatingTableId(table.id);
        try {
            const res = await fetch(`/api/orders/${table.order.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: 'SERVED', version: table.order.version || 1 }),
            });
            if (res.ok) {
                setNotification(`Table ${table.tableCode} served.`);
                fetchData();
            }
        } finally { setUpdatingTableId(null); }
    };

    const handleMarkCleaned = async (e: React.MouseEvent, tableId: string) => {
        e.preventDefault(); e.stopPropagation();
        setUpdatingTableId(tableId);
        try {
            const res = await fetch(`/api/tables/${tableId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: 'VACANT' }),
            });
            if (res.ok) {
                setNotification(`Table reset.`);
                fetchData();
            }
        } finally { setUpdatingTableId(null); }
    };

    const getStatusTheme = (table: TableData) => {
        const orderStatus = table.order?.status;
        const tableStatus = table.status;

        if (tableStatus === 'DIRTY') return { id: 'DIRTY', label: 'Cleaning', accent: '#71717A', text: 'text-zinc-500' };
        if (orderStatus === 'READY') return { id: 'READY', label: 'Ready', accent: '#22C55E', text: 'text-green-600' };
        if (orderStatus === 'BILL_REQUESTED') return { id: 'BILL_REQ', label: 'Bill', accent: '#EF4444', text: 'text-red-500' };
        if (orderStatus === 'SERVED') return { id: 'SERVED', label: 'Eating', accent: '#3B82F6', text: 'text-blue-500' };
        if (orderStatus === 'NEW' || orderStatus === 'PREPARING') return { id: 'ACTIVE', label: 'Preparing', accent: '#F59E0B', text: 'text-amber-600' };

        return { id: 'VACANT', label: 'Vacant', accent: '#E4E4E7', text: 'text-zinc-300' };
    };

    const filteredTables = useMemo(() => {
        if (activeFilter === 'ALL') return tables;
        return tables.filter(t => {
            const theme = getStatusTheme(t);
            if (activeFilter === 'READY') return theme.id === 'READY' || theme.id === 'BILL_REQ';
            if (activeFilter === 'ACTIVE') return theme.id === 'ACTIVE' || theme.id === 'SERVED';
            if (activeFilter === 'DIRTY') return theme.id === 'DIRTY';
            return true;
        });
    }, [tables, activeFilter]);

    useEffect(() => {
        setMounted(true);
        fetchData();
        const interval = setInterval(fetchData, 8000);
        return () => clearInterval(interval);
    }, [fetchData]);

    if (!mounted) return null;

    return (
        <div className="h-full bg-white flex flex-col overflow-hidden">

            {/* MINIMALIST HEADER INFO */}
            <div className="px-6 py-6 border-b border-zinc-100 shrink-0">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h1 className="text-xl font-bold text-[#111111] tracking-tight">Tables</h1>
                        <p className="text-[10px] text-zinc-400 font-medium uppercase tracking-widest mt-1">
                            {tables.filter(t => t.status !== 'VACANT').length} occupied &bull; {currentUser?.name}
                        </p>
                    </div>

                    <div className="flex items-center gap-2">
                        {(['ALL', 'READY', 'ACTIVE', 'DIRTY'] as const).map(filter => (
                            <button
                                key={filter}
                                onClick={() => setActiveFilter(filter)}
                                className={`px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all ${activeFilter === filter ? 'bg-[#111111] text-white shadow-sm' : 'bg-zinc-50 text-zinc-400 hover:text-zinc-600'}`}
                            >
                                {filter}
                            </button>
                        ))}
                    </div>
                </div>

                {/* SUBTLE ALERTS */}
                <AnimatePresence>
                    {(notification || outOfStockItems.length > 0) && (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-zinc-50 rounded-xl p-3 flex items-center justify-between border border-zinc-100"
                        >
                            <div className="flex items-center gap-3">
                                <div className={`w-1.5 h-1.5 rounded-full ${outOfStockItems.length > 0 ? 'bg-amber-500' : 'bg-green-500'}`} />
                                <span className="text-[10px] font-bold text-[#111111] uppercase tracking-wider">
                                    {notification || `Inventory Alert: ${outOfStockItems.join(', ')}`}
                                </span>
                            </div>
                            <button onClick={() => setNotification(null)} className="text-[10px] font-bold text-zinc-400 hover:text-[#111111]">Hide</button>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* TABLE GRID */}
            <div className="grow overflow-y-auto px-6 py-8 no-scrollbar pb-32">
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
                    <AnimatePresence mode="popLayout">
                        {filteredTables.map((table) => {
                            const theme = getStatusTheme(table);
                            const isUpdating = updatingTableId === table.id;

                            return (
                                <motion.div key={table.id} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                                    <Link
                                        href={theme.id === 'VACANT' || theme.id === 'DIRTY' ? '#' : `/waiter/table/${table.id}`}
                                        className={`group block p-5 rounded-2xl border transition-all ${isUpdating ? 'opacity-50' : ''} ${theme.id === 'VACANT' ? 'bg-white border-zinc-100' : 'bg-white border-zinc-200 shadow-sm'}`}
                                    >
                                        <div className="flex items-center justify-between mb-4">
                                            <span className="text-2xl font-bold tracking-tighter text-[#111111]">{table.tableCode}</span>
                                            <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: theme.accent }} />
                                        </div>

                                        <div className="flex flex-col gap-1">
                                            <span className={`text-[9px] font-bold uppercase tracking-widest ${theme.text}`}>{theme.label}</span>
                                            <span className="text-[8px] font-medium text-zinc-300 uppercase tracking-widest leading-none">
                                                {table.capacity} Seats
                                            </span>
                                        </div>

                                        {/* SIMPLE ACTIONS */}
                                        <div className="mt-6 border-t border-zinc-50 pt-4">
                                            {theme.id === 'DIRTY' ? (
                                                <button onClick={(e) => handleMarkCleaned(e, table.id)} className="w-full text-center text-[10px] font-bold text-[#111111] uppercase tracking-widest py-1 bg-zinc-50 rounded-lg">Reset</button>
                                            ) : theme.id === 'READY' ? (
                                                <button onClick={(e) => handleMarkServed(e, table)} className="w-full text-center text-[10px] font-bold text-green-600 uppercase tracking-widest py-1 bg-green-50 rounded-lg">Serve</button>
                                            ) : (
                                                <div className="w-4 h-px bg-zinc-100" />
                                            )}
                                        </div>
                                    </Link>
                                </motion.div>
                            );
                        })}
                    </AnimatePresence>
                </div>
            </div>

            <style jsx global>{`
                .no-scrollbar::-webkit-scrollbar { display: none; }
                .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
            `}</style>
        </div>
    );
}
