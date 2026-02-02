'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// ============================================
// Types
// ============================================

type LineItem = {
    id: string;
    name: string;
    qty: number;
    price: number;
};

type PendingTable = {
    id: string;
    shortId: string;
    tableCode: string;
    guestName: string;
    items: LineItem[];
    requestedAt: number;
    total: number;
    version: number;
};

// ============================================
// Component
// ============================================

export default function CashierTerminal() {
    const [mounted, setMounted] = useState(false);
    const [orders, setOrders] = useState<PendingTable[]>([]);
    const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
    const [paymentMethod, setPaymentMethod] = useState<'UPI' | 'CARD' | 'CASH' | null>(null);
    const [showConfirm, setShowConfirm] = useState(false);
    const [loading, setLoading] = useState(true);
    const [isMobileDetailView, setIsMobileDetailView] = useState(false);
    const [committing, setCommitting] = useState(false);

    const fetchPendingOrders = useCallback(async () => {
        try {
            const res = await fetch('/api/orders?status=BILL_REQUESTED');
            const data = await res.json();
            if (!data.success) return;

            const pending = data.orders.map((o: any) => ({
                id: o.id,
                shortId: o.id.slice(0, 8).toUpperCase(),
                tableCode: o.tableCode.replace('T-', ''),
                guestName: o.customerName || `Guest @ ${o.tableCode}`,
                requestedAt: new Date(o.updatedAt).getTime(),
                version: o.version,
                total: o.total,
                items: o.items.map((item: any) => ({
                    id: item.id, name: item.itemName, qty: item.quantity, price: item.price
                }))
            }));
            setOrders(pending);
            if (pending.length > 0 && !selectedOrderId && window.innerWidth >= 1024) {
                setSelectedOrderId(pending[0].id);
            }
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    }, [selectedOrderId]);

    useEffect(() => {
        setMounted(true);
        fetchPendingOrders();
        const interval = setInterval(fetchPendingOrders, 10000);
        return () => clearInterval(interval);
    }, [fetchPendingOrders]);

    const handleSettlement = async () => {
        const order = orders.find(o => o.id === selectedOrderId);
        if (!order || !paymentMethod || committing) return;
        setCommitting(true);
        try {
            await fetch(`/api/orders/${order.id}/payment`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ method: paymentMethod, amount: order.total })
            });
            setSelectedOrderId(null);
            setShowConfirm(false);
            setPaymentMethod(null);
            setIsMobileDetailView(false);
            await fetchPendingOrders();
        } finally { setCommitting(false); }
    };

    if (!mounted) return null;

    const currentOrder = orders.find(o => o.id === selectedOrderId);

    if (loading && orders.length === 0) {
        return (
            <div className="h-full flex items-center justify-center bg-white">
                <div className="w-8 h-8 border-2 border-zinc-100 border-t-[#111111] rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="h-full bg-white flex flex-col lg:flex-row overflow-hidden relative">

            {/* INGRESS QUEUE */}
            <aside className={`w-full lg:w-80 border-r border-zinc-100 flex flex-col shrink-0 transition-transform duration-300 ${isMobileDetailView ? '-translate-x-full lg:translate-x-0' : 'translate-x-0'} absolute lg:relative inset-0 lg:inset-auto z-20 bg-white`}>
                <div className="px-6 py-6 border-b border-zinc-100 shrink-0">
                    <h1 className="text-xl font-bold text-[#111111] tracking-tight">Settlements</h1>
                    <p className="text-[10px] text-zinc-400 font-medium uppercase tracking-widest mt-1">{orders.length} Pending</p>
                </div>
                <div className="grow overflow-y-auto px-4 py-6 no-scrollbar pb-32">
                    <div className="space-y-3">
                        {orders.map(order => (
                            <button
                                key={order.id}
                                onClick={() => {
                                    setSelectedOrderId(order.id);
                                    if (window.innerWidth < 1024) setIsMobileDetailView(true);
                                }}
                                className={`w-full p-4 rounded-xl border transition-all text-left group ${selectedOrderId === order.id ? 'bg-[#111111] border-[#111111] shadow-sm' : 'bg-white border-zinc-100 hover:border-zinc-300'}`}
                            >
                                <div className="flex items-center justify-between mb-3">
                                    <span className={`text-xl font-bold tracking-tighter ${selectedOrderId === order.id ? 'text-white' : 'text-[#111111]'}`}>T-{order.tableCode}</span>
                                    <div className={`w-1.5 h-1.5 rounded-full ${selectedOrderId === order.id ? 'bg-red-500' : 'bg-red-400'}`} />
                                </div>
                                <div className="flex items-end justify-between">
                                    <span className={`text-[9px] font-bold uppercase tracking-widest ${selectedOrderId === order.id ? 'text-white/40' : 'text-zinc-300'}`}>₹{order.total.toLocaleString()}</span>
                                    <span className={`text-[8px] font-medium uppercase tracking-widest ${selectedOrderId === order.id ? 'text-white/20' : 'text-zinc-200'}`}>{order.shortId}</span>
                                </div>
                            </button>
                        ))}
                    </div>
                    {orders.length === 0 && (
                        <div className="py-24 text-center opacity-20">
                            <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">All Clear</p>
                        </div>
                    )}
                </div>
            </aside>

            {/* SETTLEMENT PANEL */}
            <main className={`grow flex flex-col bg-white transition-transform duration-300 ${isMobileDetailView ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'} absolute lg:relative inset-0 lg:inset-auto z-30`}>
                {currentOrder ? (
                    <div className="h-full flex flex-col overflow-hidden">
                        {/* HEADER */}
                        <div className="px-6 py-6 border-b border-zinc-100 shrink-0 flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <button onClick={() => setIsMobileDetailView(false)} className="lg:hidden p-2 -ml-2 text-zinc-400">
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="15 18 9 12 15 6"></polyline></svg>
                                </button>
                                <div>
                                    <h2 className="text-xl font-bold text-[#111111] tracking-tight uppercase">Table {currentOrder.tableCode}</h2>
                                    <p className="text-[10px] text-zinc-400 font-medium uppercase tracking-widest mt-1">{currentOrder.guestName}</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <span className="text-[9px] font-bold text-zinc-300 uppercase tracking-widest block">Ref</span>
                                <span className="text-xs font-bold text-[#111111] tabular-nums">{currentOrder.shortId}</span>
                            </div>
                        </div>

                        {/* CONTENT SPLIT */}
                        <div className="grow overflow-y-auto lg:flex no-scrollbar">
                            {/* BILL DETAILS */}
                            <div className="flex-1 p-6 lg:p-8 border-b lg:border-b-0 lg:border-r border-zinc-100">
                                <span className="text-[10px] font-bold text-zinc-300 uppercase tracking-widest block mb-6">Bill Selection</span>
                                <div className="space-y-4">
                                    {currentOrder.items.map((item, idx) => (
                                        <div key={idx} className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <span className="text-[10px] font-bold text-zinc-400 bg-zinc-50 px-1.5 py-0.5 rounded-md">{item.qty}</span>
                                                <span className="text-sm font-medium text-zinc-600">{item.name}</span>
                                            </div>
                                            <span className="text-sm font-bold text-[#111111] tabular-nums">₹{(item.price * item.qty).toLocaleString()}</span>
                                        </div>
                                    ))}
                                </div>

                                <div className="mt-8 pt-8 border-t border-zinc-50">
                                    <div className="flex justify-between items-baseline">
                                        <span className="text-xs font-bold text-zinc-300 uppercase tracking-widest">Total Amount</span>
                                        <span className="text-4xl font-bold tracking-tighter text-[#111111]">₹{currentOrder.total.toLocaleString()}</span>
                                    </div>
                                </div>
                            </div>

                            {/* PAYMENT METHODS */}
                            <div className="flex-1 p-6 lg:p-8 bg-zinc-50/30 pb-32 lg:pb-8">
                                <span className="text-[10px] font-bold text-zinc-300 uppercase tracking-widest block mb-6">Method</span>
                                <div className="space-y-3">
                                    {[
                                        { id: 'UPI', label: 'UPI Digital', icon: 'M5 13l4 4L19 7' },
                                        { id: 'CARD', label: 'Card Payment', icon: 'M3 10h18M7 15h1m4 0h1m4 0h1M5 5h14a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2z' },
                                        { id: 'CASH', label: 'Cash Entry', icon: 'M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z' }
                                    ].map(method => (
                                        <button
                                            key={method.id}
                                            onClick={() => setPaymentMethod(method.id as any)}
                                            className={`w-full p-4 rounded-xl border flex items-center justify-between transition-all ${paymentMethod === method.id ? 'bg-white border-[#111111] shadow-sm' : 'bg-white border-zinc-100 text-zinc-400 hover:border-zinc-200'}`}
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${paymentMethod === method.id ? 'bg-[#111111] text-white' : 'bg-zinc-50'}`}>
                                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d={method.icon} /></svg>
                                                </div>
                                                <span className={`text-xs font-bold uppercase tracking-wider ${paymentMethod === method.id ? 'text-[#111111]' : 'text-zinc-400'}`}>{method.label}</span>
                                            </div>
                                            <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${paymentMethod === method.id ? 'border-[#111111]' : 'border-zinc-100'}`}>
                                                {paymentMethod === method.id && <div className="w-1.5 h-1.5 rounded-full bg-[#111111]" />}
                                            </div>
                                        </button>
                                    ))}
                                </div>
                                <div className="mt-8">
                                    <button
                                        disabled={!paymentMethod || committing}
                                        onClick={() => setShowConfirm(true)}
                                        className={`w-full h-14 rounded-2xl text-[10px] font-bold uppercase tracking-[0.3em] transition-all shadow-sm ${paymentMethod ? 'bg-[#111111] text-white hover:bg-zinc-800 active:scale-95' : 'bg-zinc-100 text-zinc-300 cursor-not-allowed'}`}
                                    >
                                        {committing ? '...' : 'Complete Payment'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="h-full flex flex-col items-center justify-center p-12 text-center opacity-20">
                        <div className="w-12 h-12 bg-zinc-50 border border-zinc-100 rounded-lg flex items-center justify-center mb-4">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#111111" strokeWidth="2.5"><path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        </div>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Waiting for queue Ingress</p>
                    </div>
                )}
            </main>

            {/* CONFIRMATION OVERLAY */}
            <AnimatePresence>
                {showConfirm && currentOrder && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-white/80 backdrop-blur-sm z-200 flex items-center justify-center p-6">
                        <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} className="w-full max-w-sm bg-white rounded-2xl border border-zinc-100 shadow-xl p-8 text-center">
                            <div className="w-12 h-12 bg-green-50 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"></polyline></svg>
                            </div>
                            <h3 className="text-xl font-bold text-[#111111] tracking-tight mb-2">Authorize Table {currentOrder.tableCode}?</h3>
                            <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-8">{paymentMethod} &bull; ₹{currentOrder.total.toLocaleString()}</p>
                            <div className="grid grid-cols-2 gap-3">
                                <button onClick={() => setShowConfirm(false)} className="h-12 rounded-xl border border-zinc-100 text-[10px] font-bold uppercase tracking-widest text-[#111111]">Cancel</button>
                                <button onClick={handleSettlement} className="h-12 rounded-xl bg-[#111111] text-white text-[10px] font-bold uppercase tracking-widest">Confirm</button>
                            </div>
                        </motion.div>
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
