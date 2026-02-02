'use client';

import { useParams, useRouter } from 'next/navigation';
import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';

// ============================================
// Types
// ============================================

interface OrderItem {
    id: string;
    name: string;
    qty: number;
    note?: string;
    status: string;
    origin: string;
    time: string;
}

interface TableDetailsData {
    id: string;
    fullId: string;
    tableCode: string;
    status: string;
    version: number;
    guest: string;
    time: string;
    items: OrderItem[];
}

// ============================================
// Component
// ============================================

export default function TableDetails() {
    const { id } = useParams();
    const router = useRouter();

    const [data, setData] = useState<TableDetailsData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [updating, setUpdating] = useState(false);

    const fetchTableDetails = useCallback(async () => {
        try {
            const tablesRes = await fetch(`/api/tables`);
            const tablesData = await tablesRes.json();
            const table = tablesData.tables?.find((t: any) => t.id === id);

            if (!table) throw new Error('Table not found');

            const ordersRes = await fetch(`/api/orders?status=NEW,PREPARING,READY,SERVED,BILL_REQUESTED`);
            const ordersData = await ordersRes.json();
            const activeOrder = ordersData.orders?.find((o: any) => o.tableId === id);

            if (!activeOrder) {
                setData({
                    id: id as string, fullId: '', tableCode: table.tableCode, status: 'VACANT', version: 0, guest: 'No guest', time: '--:--', items: []
                });
            } else {
                setData({
                    id: activeOrder.id.slice(0, 8).toUpperCase(),
                    fullId: activeOrder.id,
                    tableCode: table.tableCode,
                    status: activeOrder.status,
                    version: activeOrder.version,
                    guest: activeOrder.customerName || `Guest @ ${table.tableCode}`,
                    time: new Date(activeOrder.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                    items: activeOrder.items.map((item: any) => ({
                        id: item.id, name: item.itemName, qty: item.quantity, note: item.note, status: item.status, origin: 'Entry', time: new Date(item.createdAt || activeOrder.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                    }))
                });
            }
            setError(null);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Error');
        } finally { setLoading(false); }
    }, [id]);

    useEffect(() => {
        fetchTableDetails();
        const interval = setInterval(fetchTableDetails, 5000);
        return () => clearInterval(interval);
    }, [fetchTableDetails]);

    const markAsServed = async () => {
        if (!data || data.status !== 'READY' || updating) return;
        setUpdating(true);
        try {
            await fetch(`/api/orders/${data.fullId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: 'SERVED', version: data.version })
            });
            await fetchTableDetails();
        } finally { setUpdating(false); }
    };

    if (loading) return (
        <div className="h-full flex items-center justify-center bg-white">
            <div className="w-8 h-8 border-2 border-zinc-100 border-t-[#111111] rounded-full animate-spin" />
        </div>
    );

    if (error || !data) return (
        <div className="h-full flex flex-col items-center justify-center p-8 text-center bg-white">
            <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-4">Sync error</p>
            <button onClick={() => router.push('/waiter')} className="px-8 py-3 bg-[#111111] text-white rounded-xl text-[10px] font-bold uppercase tracking-widest">Back</button>
        </div>
    );

    return (
        <div className="h-full flex flex-col bg-white overflow-hidden">

            {/* CLEAN HEADER */}
            <div className="px-6 py-6 border-b border-zinc-100 shrink-0">
                <div className="flex items-center justify-between mb-4">
                    <button onClick={() => router.push('/waiter')} className="p-2 -ml-2 text-zinc-400 hover:text-[#111111]">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="15 18 9 12 15 6"></polyline></svg>
                    </button>
                    <span className={`px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider ${data.status === 'READY' ? 'bg-green-600 text-white' : 'bg-zinc-50 text-zinc-400'}`}>
                        {data.status}
                    </span>
                </div>
                <h1 className="text-2xl font-bold tracking-tight text-[#111111]">Table {data.tableCode}</h1>
                <p className="text-[10px] text-zinc-400 font-medium uppercase tracking-widest mt-1">{data.guest} &bull; {data.time}</p>
            </div>

            {/* ORDER LIST */}
            <div className="grow overflow-y-auto px-6 py-8 no-scrollbar pb-32">
                <div className="space-y-6 max-w-2xl">
                    {data.items.length === 0 ? (
                        <div className="py-12 text-center opacity-20">
                            <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">No active items</p>
                        </div>
                    ) : data.items.map((item) => (
                        <div key={item.id} className="flex items-start gap-4">
                            <div className="w-8 h-8 rounded-lg bg-zinc-50 border border-zinc-100 flex items-center justify-center shrink-0">
                                <span className="text-xs font-bold text-[#111111]">{item.qty}</span>
                            </div>
                            <div className="grow">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-sm font-bold text-[#111111]">{item.name}</h3>
                                    <span className="text-[8px] font-bold text-zinc-300 uppercase tracking-widest">{item.status}</span>
                                </div>
                                {item.note && <p className="text-[10px] text-zinc-400 italic mt-1">{item.note}</p>}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* SIMPLE ACTION BAR */}
            <div className="fixed bottom-6 left-6 right-6 flex gap-3 pointer-events-none">
                <Link
                    href={`/waiter/table/${id}/add`}
                    className="flex-1 h-14 bg-[#111111] text-white rounded-2xl flex items-center justify-center gap-2 pointer-events-auto shadow-sm active:scale-95 transition-all"
                >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M12 5v14M5 12h14" /></svg>
                    <span className="text-[10px] font-bold uppercase tracking-widest">Add Item</span>
                </Link>

                <button
                    onClick={markAsServed}
                    disabled={data.status !== 'READY' || updating}
                    className={`flex-1 h-14 rounded-2xl flex items-center justify-center pointer-events-auto transition-all active:scale-95 ${data.status === 'READY' ? 'bg-green-600 text-white shadow-sm' : 'bg-zinc-50 border border-zinc-100 text-zinc-300'}`}
                >
                    <span className="text-[10px] font-bold uppercase tracking-widest">
                        {updating ? '...' : data.status === 'READY' ? 'Serve' : 'On Process'}
                    </span>
                </button>
            </div>

            <style jsx global>{`
                .no-scrollbar::-webkit-scrollbar { display: none; }
                .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
            `}</style>
        </div>
    );
}
