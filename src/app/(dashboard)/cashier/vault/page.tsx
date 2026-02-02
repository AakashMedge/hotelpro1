'use client';

import { motion } from 'framer-motion';

export default function CashierVault() {
    return (
        <div className="h-full bg-white flex flex-col overflow-hidden">
            <div className="px-6 py-6 border-b border-zinc-100 shrink-0">
                <h1 className="text-xl font-bold text-[#111111] tracking-tight">Vault</h1>
                <p className="text-[10px] text-zinc-400 font-medium uppercase tracking-widest mt-1">Cash & Balances</p>
            </div>

            <div className="grow flex flex-col items-center justify-center opacity-20 text-center gap-4 px-6">
                <div className="w-12 h-12 bg-zinc-50 border border-zinc-100 rounded-lg flex items-center justify-center">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#111111" strokeWidth="2.5"><path d="M3 10h18M7 15h1m4 0h1m4 0h1M5 5h14a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2 2V7a2 2 0 012-2z" /></svg>
                </div>
                <p className="text-[10px] text-zinc-400 font-semibold uppercase tracking-widest leading-relaxed">Vault is synchronized <br /> and secured</p>
            </div>
        </div>
    );
}
