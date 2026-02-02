'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// ============================================
// Types
// ============================================

type LineItem = {
    name: string;
    qty: number;
};

type HistoryTicket = {
    id: string;
    table: string;
    items: LineItem[];
    completedAt: number;
    prepTimeMins: number;
    status: 'READY' | 'SERVED';
};

// ============================================
// Component
// ============================================

export default function KitchenHistory() {
    const [tickets, setTickets] = useState<HistoryTicket[]>([]);
    const [loading, setLoading] = useState(true);
    const [mounted, setMounted] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<'ALL' | 'READY' | 'SERVED'>('ALL');

    const fetchHistory = useCallback(async () => {
        try {
            const res = await fetch('/api/orders?status=READY,SERVED');
            const data = await res.json();
            if (!data.success) return;

            const historyTickets = data.orders.map((o: any) => ({
                id: o.id.slice(0, 8).toUpperCase(),
                table: o.tableCode.replace('T-', ''),
                completedAt: new Date(o.updatedAt).getTime(),
                prepTimeMins: Math.round((new Date(o.updatedAt).getTime() - new Date(o.createdAt).getTime()) / 60000),
                status: o.status,
                items: o.items.map((i: any) => ({ name: i.itemName, qty: i.quantity }))
            })).sort((a: any, b: any) => b.completedAt - a.completedAt);

            setTickets(historyTickets);
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    }, []);

    useEffect(() => {
        setMounted(true);
        fetchHistory();
    }, [fetchHistory]);

    const filteredTickets = useMemo(() => {
        return tickets.filter(t => {
            const matchesSearch = t.table.includes(searchQuery) || t.id.includes(searchQuery.toUpperCase());
            const matchesStatus = statusFilter === 'ALL' || t.status === statusFilter;
            return matchesSearch && matchesStatus;
        });
    }, [tickets, searchQuery, statusFilter]);

    if (!mounted) return null;

    if (loading && tickets.length === 0) {
        return (
            <div className="h-full flex items-center justify-center bg-white">
                <div className="w-8 h-8 border-2 border-zinc-100 border-t-[#D43425] rounded-full animate-spin" />
            </div>
        );
    }

    const avgPrep = tickets.length > 0 ? Math.round(tickets.reduce((acc, t) => acc + t.prepTimeMins, 0) / tickets.length) : 0;

    return (
        <div className="h-full bg-white flex flex-col overflow-hidden">

            {/* CLEAN HEADER & STATS */}
            <div className="px-6 py-6 border-b border-zinc-100 shrink-0">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h1 className="text-xl font-bold text-[#111111] tracking-tight">Service History</h1>
                        <p className="text-[10px] text-zinc-400 font-medium uppercase tracking-widest mt-1">Operational Ledger</p>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="text-right">
                            <span className="text-[10px] font-bold text-zinc-300 uppercase tracking-widest block">Avg Prep</span>
                            <span className="text-sm font-bold text-[#111111]">{avgPrep}m</span>
                        </div>
                    </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                    <input
                        type="text"
                        placeholder="Search history..."
                        className="flex-1 h-10 bg-zinc-50 border border-zinc-100 rounded-lg px-4 text-sm focus:outline-none focus:border-zinc-300 transition-all font-medium"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    <div className="flex items-center gap-1 p-1 bg-zinc-50 border border-zinc-100 rounded-lg">
                        {(['ALL', 'READY', 'SERVED'] as const).map(f => (
                            <button
                                key={f}
                                onClick={() => setStatusFilter(f)}
                                className={`px-3 py-1 rounded-md text-[9px] font-bold uppercase tracking-widest transition-all ${statusFilter === f ? 'bg-white text-[#111111] shadow-sm' : 'text-zinc-400'}`}
                            >
                                {f}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* HISTORY FEED */}
            <div className="grow overflow-y-auto px-6 py-8 no-scrollbar pb-32">
                <div className="max-w-4xl space-y-4">
                    {filteredTickets.map(ticket => (
                        <div
                            key={ticket.id}
                            className="bg-white border border-zinc-100 rounded-xl p-4 flex flex-col sm:flex-row items-center gap-4 shadow-sm"
                        >
                            <div className="flex items-center gap-4 min-w-[120px]">
                                <span className="text-2xl font-bold tracking-tighter text-[#111111]">T-{ticket.table}</span>
                                <div className="flex flex-col">
                                    <span className="text-[8px] font-bold text-zinc-300 uppercase tracking-widest">#{ticket.id}</span>
                                    <span className={`text-[8px] font-bold uppercase tracking-widest mt-0.5 ${ticket.status === 'SERVED' ? 'text-green-600' : 'text-blue-500'}`}>
                                        {ticket.status}
                                    </span>
                                </div>
                            </div>

                            <div className="grow flex flex-wrap gap-2">
                                {ticket.items.map((item, idx) => (
                                    <div key={idx} className="bg-zinc-50 px-2 py-1 rounded-md flex items-center gap-2">
                                        <span className="text-[10px] font-bold text-[#111111]">{item.qty}x</span>
                                        <span className="text-[10px] font-medium text-zinc-500 uppercase">{item.name}</span>
                                    </div>
                                ))}
                            </div>

                            <div className="shrink-0 flex items-center gap-4 border-t sm:border-t-0 sm:border-l border-zinc-50 pt-3 sm:pt-0 sm:pl-4 w-full sm:w-auto justify-between sm:justify-end">
                                <div className="text-right">
                                    <span className="text-[8px] font-bold text-zinc-300 uppercase tracking-widest block">Time</span>
                                    <span className="text-xs font-bold text-[#111111] tabular-nums">
                                        {new Date(ticket.completedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                </div>
                                <div className="text-right">
                                    <span className="text-[8px] font-bold text-zinc-300 uppercase tracking-widest block">Prep</span>
                                    <span className="text-xs font-bold text-[#111111] tabular-nums">{ticket.prepTimeMins}m</span>
                                </div>
                            </div>
                        </div>
                    ))}

                    {filteredTickets.length === 0 && !loading && (
                        <div className="py-24 text-center opacity-20">
                            <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">No matching records</p>
                        </div>
                    )}
                </div>
            </div>

            <style jsx global>{`
                .no-scrollbar::-webkit-scrollbar { display: none; }
                .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
            `}</style>
        </div>
    );
}
