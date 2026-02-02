'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// ============================================
// Types
// ============================================

type StockItem = {
    id: string;
    name: string;
    category: string;
    quantity: number;
    isAvailable: boolean;
    unit: string;
    threshold: number;
    lastUpdated: string;
};

// ============================================
// Component
// ============================================

export default function KitchenInventory() {
    const [mounted, setMounted] = useState(false);
    const [items, setItems] = useState<StockItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    const fetchStock = useCallback(async () => {
        try {
            const res = await fetch('/api/kitchen/inventory');
            const data = await res.json();
            if (data.success) setItems(data.items);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, []);

    const handleAdjust = async (menuItemId: string, currentQty: number) => {
        const val = prompt(`Set quantity:`, currentQty.toString());
        if (val === null || isNaN(parseInt(val))) return;
        try {
            await fetch('/api/kitchen/inventory', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ menuItemId, quantity: parseInt(val) })
            });
            fetchStock();
        } catch (err) { console.error(err); }
    };

    const toggle86 = async (menuItemId: string, currentStatus: boolean) => {
        try {
            await fetch('/api/kitchen/inventory', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ menuItemId, isAvailable: !currentStatus })
            });
            fetchStock();
        } catch (err) { console.error(err); }
    };

    useEffect(() => {
        setMounted(true);
        fetchStock();
        const interval = setInterval(fetchStock, 10000);
        return () => clearInterval(interval);
    }, [fetchStock]);

    const filteredItems = useMemo(() => {
        return items.filter(i => i.name.toLowerCase().includes(search.toLowerCase()));
    }, [items, search]);

    if (!mounted) return null;

    if (loading && items.length === 0) {
        return (
            <div className="h-full flex items-center justify-center bg-white">
                <div className="w-8 h-8 border-2 border-zinc-100 border-t-[#D43425] rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="h-full bg-white flex flex-col overflow-hidden">

            {/* CLEAN HEADER */}
            <div className="px-6 py-6 border-b border-zinc-100 shrink-0">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h1 className="text-xl font-bold text-[#111111] tracking-tight">Inventory</h1>
                        <p className="text-[10px] text-zinc-400 font-medium uppercase tracking-widest mt-1">Resource Management</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="px-3 py-1 bg-zinc-50 rounded-full border border-zinc-100 text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
                            {items.filter(i => i.quantity <= i.threshold).length} Low Stock
                        </div>
                    </div>
                </div>

                <input
                    type="text"
                    placeholder="Search resources..."
                    className="w-full h-10 bg-zinc-50 border border-zinc-100 rounded-lg px-4 text-sm focus:outline-none focus:border-zinc-300 transition-all font-medium"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
            </div>

            {/* INVENTORY GRID */}
            <div className="grow overflow-y-auto px-6 py-8 no-scrollbar pb-32">
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
                    {filteredItems.map(item => {
                        const isLow = item.quantity <= item.threshold;
                        const is86 = !item.isAvailable;
                        return (
                            <div
                                key={item.id}
                                className={`p-5 rounded-2xl border transition-all ${is86 ? 'opacity-40 grayscale' : 'bg-white border-zinc-100 shadow-sm'}`}
                            >
                                <div className="flex items-start justify-between mb-4">
                                    <div className="grow">
                                        <h3 className="text-sm font-bold text-[#111111] truncate">{item.name}</h3>
                                        <span className="text-[9px] font-bold text-zinc-300 uppercase tracking-widest">{item.category}</span>
                                    </div>
                                    {isLow && !is86 && <div className="w-1.5 h-1.5 rounded-full bg-red-500" />}
                                </div>

                                <div className="flex items-baseline gap-1 mb-6">
                                    <span className={`text-2xl font-bold tracking-tighter ${isLow ? 'text-red-500' : 'text-[#111111]'}`}>{item.quantity}</span>
                                    <span className="text-[10px] font-bold text-zinc-300 uppercase">{item.unit}</span>
                                </div>

                                <div className="pt-4 border-t border-zinc-50 flex gap-2">
                                    <button
                                        onClick={() => handleAdjust(item.id, item.quantity)}
                                        className="flex-1 py-1.5 bg-zinc-50 rounded-lg text-[9px] font-bold uppercase text-zinc-400 hover:text-[#111111]"
                                    >
                                        Edit
                                    </button>
                                    <button
                                        onClick={() => toggle86(item.id, item.isAvailable)}
                                        className={`flex-1 py-1.5 rounded-lg text-[9px] font-bold uppercase transition-colors ${is86 ? 'bg-red-600 text-white' : 'bg-[#111111] text-white'}`}
                                    >
                                        {is86 ? 'In' : '86'}
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            <style jsx global>{`
                .no-scrollbar::-webkit-scrollbar { display: none; }
                .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
            `}</style>
        </div>
    );
}
