'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';

// ============================================
// Types
// ============================================

interface MenuItem {
    id: string;
    name: string;
    price: number;
    category: string;
    code: string;
}

// ============================================
// Component
// ============================================

export default function QuickAddPad() {
    const { id } = useParams();
    const router = useRouter();

    const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
    const [categories, setCategories] = useState<string[]>([]);
    const [activeCategory, setActiveCategory] = useState('ALL');
    const [search, setSearch] = useState('');
    const [cart, setCart] = useState<Record<string, number>>({});
    const [loading, setLoading] = useState(true);
    const [committing, setCommitting] = useState(false);
    const [orderId, setOrderId] = useState<string | null>(null);

    const initData = useCallback(async () => {
        try {
            const menuRes = await fetch('/api/menu');
            const menuData = await menuRes.json();
            if (!menuData.success) throw new Error('Menu fetch failed');

            const items = menuData.items.map((item: any) => ({
                ...item, category: item.category || 'Kitchen', code: item.name.slice(0, 3).toUpperCase()
            }));
            setMenuItems(items);

            const cats = Array.from(new Set(items.map((i: any) => i.category))) as string[];
            setCategories(['ALL', ...cats]);

            const ordersRes = await fetch('/api/orders?status=NEW,PREPARING,READY,SERVED,BILL_REQUESTED');
            const ordersData = await ordersRes.json();
            const activeOrder = ordersData.orders?.find((o: any) => o.tableId === id);
            if (activeOrder) setOrderId(activeOrder.id);
        } catch (err) {
            console.error(err);
        } finally { setLoading(false); }
    }, [id]);

    useEffect(() => { initData(); }, [initData]);

    const filteredItems = useMemo(() => {
        return menuItems.filter(item => {
            const matchesSearch = item.name.toLowerCase().includes(search.toLowerCase());
            const matchesCat = activeCategory === 'ALL' || item.category === activeCategory;
            return matchesSearch && matchesCat;
        });
    }, [menuItems, search, activeCategory]);

    const updateCart = (itemId: string, delta: number) => {
        setCart(prev => {
            const newQty = (prev[itemId] || 0) + delta;
            if (newQty <= 0) {
                const { [itemId]: _, ...rest } = prev;
                return rest;
            }
            return { ...prev, [itemId]: newQty };
        });
    };

    const totalItems = Object.values(cart).reduce((a, b) => a + b, 0);

    const commitOrder = async () => {
        if (!orderId || totalItems === 0 || committing) return;
        setCommitting(true);
        try {
            const items = Object.entries(cart).map(([menuItemId, quantity]) => ({ menuItemId, quantity }));
            await fetch(`/api/orders/${orderId}/items`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ items })
            });
            router.push(`/waiter/table/${id}`);
        } catch (err) {
            alert('Error committing order');
            setCommitting(false);
        }
    };

    if (loading) return (
        <div className="h-full flex items-center justify-center bg-white">
            <div className="w-8 h-8 border-2 border-zinc-100 border-t-[#111111] rounded-full animate-spin" />
        </div>
    );

    return (
        <div className="h-full flex flex-col bg-white overflow-hidden">

            <div className="px-6 py-6 border-b border-zinc-100 shrink-0">
                <div className="flex items-center gap-4 mb-4">
                    <button onClick={() => router.back()} className="text-zinc-400 hover:text-[#111111]">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="15 18 9 12 15 6"></polyline></svg>
                    </button>
                    <h1 className="text-xl font-bold text-[#111111] tracking-tight">Add Items</h1>
                </div>
                <input
                    type="text"
                    placeholder="Search menu..."
                    className="w-full h-10 bg-zinc-50 border border-zinc-100 rounded-lg px-4 text-sm focus:outline-none focus:border-zinc-300 transition-all font-medium"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
            </div>

            <div className="bg-white border-b border-zinc-100 shrink-0">
                <div className="flex overflow-x-auto no-scrollbar p-3 gap-2">
                    {categories.map(cat => (
                        <button
                            key={cat}
                            onClick={() => setActiveCategory(cat)}
                            className={`px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all whitespace-nowrap ${activeCategory === cat ? 'bg-[#111111] text-white' : 'bg-zinc-50 text-zinc-400'}`}
                        >
                            {cat}
                        </button>
                    ))}
                </div>
            </div>

            <div className="grow overflow-y-auto px-6 py-6 no-scrollbar pb-32">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredItems.map(item => {
                        const qty = cart[item.id] || 0;
                        return (
                            <div key={item.id} className={`p-4 rounded-xl border transition-all ${qty > 0 ? 'border-[#111111] bg-zinc-50/50' : 'border-zinc-100 bg-white'}`}>
                                <div className="flex items-center justify-between">
                                    <div className="grow">
                                        <h3 className="text-sm font-bold text-[#111111]">{item.name}</h3>
                                        <span className="text-[10px] font-medium text-zinc-400 uppercase tracking-widest">{item.category}</span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        {qty > 0 && (
                                            <>
                                                <button onClick={() => updateCart(item.id, -1)} className="w-6 h-6 rounded-md bg-white border border-zinc-100 flex items-center justify-center text-zinc-400">
                                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M5 12h14" /></svg>
                                                </button>
                                                <span className="text-sm font-bold tabular-nums min-w-[12px] text-center">{qty}</span>
                                            </>
                                        )}
                                        <button onClick={() => updateCart(item.id, 1)} className={`w-6 h-6 rounded-md flex items-center justify-center transition-all ${qty > 0 ? 'bg-[#111111] text-white' : 'bg-zinc-50 border border-zinc-100 text-zinc-400'}`}>
                                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M12 5v14M5 12h14" /></svg>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            <AnimatePresence>
                {totalItems > 0 && (
                    <motion.div initial={{ y: 100 }} animate={{ y: 0 }} exit={{ y: 100 }} className="fixed bottom-6 left-6 right-6">
                        <button
                            onClick={commitOrder}
                            disabled={committing}
                            className="w-full h-14 bg-green-600 text-white rounded-2xl flex items-center justify-between px-6 shadow-sm disabled:opacity-50"
                        >
                            <span className="text-[11px] font-bold uppercase tracking-widest">{committing ? 'Sending...' : 'Confirm Order'}</span>
                            <span className="text-xs font-bold bg-white/20 px-2 py-1 rounded-lg">{totalItems} items</span>
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>

            <style jsx global>{`
                .no-scrollbar::-webkit-scrollbar { display: none; }
                .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
            `}</style>
        </div>
    );
}
