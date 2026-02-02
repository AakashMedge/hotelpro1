'use client';

import { motion } from 'framer-motion';

export default function WaiterHistory() {
    return (
        <div className="h-full flex flex-col bg-white overflow-hidden">
            <div className="px-6 py-6 border-b border-zinc-100 shrink-0">
                <h1 className="text-xl font-bold text-[#111111] tracking-tight">History</h1>
                <p className="text-[10px] text-zinc-400 font-medium uppercase tracking-widest mt-1">Operational ledger</p>
            </div>

            <div className="grow flex flex-col items-center justify-center opacity-20 text-center gap-4 px-6">
                <div className="w-12 h-12 bg-zinc-50 border border-zinc-100 rounded-lg flex items-center justify-center">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#111111" strokeWidth="2.5"><path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                </div>
                <p className="text-[10px] text-zinc-400 font-semibold uppercase tracking-widest leading-relaxed">No history recorded <br /> for this terminal</p>
            </div>
        </div>
    );
}
