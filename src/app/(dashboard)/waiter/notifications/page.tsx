'use client';

import { motion } from 'framer-motion';

export default function WaiterNotifications() {
    return (
        <div className="h-full flex flex-col bg-white overflow-hidden">

            <div className="px-6 py-6 border-b border-zinc-100 shrink-0">
                <h1 className="text-xl font-bold text-[#111111] tracking-tight">Alerts</h1>
                <p className="text-[10px] text-zinc-400 font-medium uppercase tracking-widest mt-1">Operational updates</p>
            </div>

            <div className="grow overflow-y-auto px-6 py-8 space-y-4">
                {/* INVENTORY ALERT: TIRAMISU */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="p-4 rounded-xl border border-amber-100 bg-amber-50/30"
                >
                    <div className="flex items-start gap-4">
                        <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center shrink-0">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#B45309" strokeWidth="2.5"><path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                        </div>
                        <div className="grow">
                            <h3 className="text-[11px] font-bold text-amber-900 uppercase tracking-wider mb-1">Inventory Low</h3>
                            <p className="text-xs text-amber-800/80 leading-relaxed font-medium">
                                Tiramisu stock is reaching critical levels. Please update inventory.
                            </p>
                            <div className="mt-3 flex gap-2">
                                <button className="text-[10px] font-bold text-amber-900 px-3 py-1 bg-amber-100 rounded-md">Update</button>
                                <button className="text-[10px] font-bold text-amber-900/40 px-3 py-1">Dismiss</button>
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* SYSTEM ALERT */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="p-4 rounded-xl border border-zinc-100 bg-white"
                >
                    <div className="flex items-start gap-4">
                        <div className="w-8 h-8 rounded-lg bg-zinc-50 flex items-center justify-center shrink-0">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#111111" strokeWidth="2.5"><path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        </div>
                        <div className="grow">
                            <h3 className="text-[11px] font-bold text-[#111111] uppercase tracking-wider mb-1">System Synced</h3>
                            <p className="text-xs text-zinc-500 leading-relaxed font-medium">
                                All tablet nodes are currently synchronized with the master ledger.
                            </p>
                        </div>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
