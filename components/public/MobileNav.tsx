'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function MobileNav() {
    const pathname = usePathname();
    const activeOrderId = typeof window !== 'undefined' ? localStorage.getItem('hp_active_order_id') : null;

    return (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-200 w-[90vw] max-w-sm">
            <nav className="bg-[#3D2329]/90 backdrop-blur-xl border border-[#D43425]/30 rounded-full p-2 flex items-center justify-between shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
                {/* THE LEDGER (MENU) */}
                <Link
                    href="/menu"
                    className={`flex-1 flex flex-col items-center gap-1 py-1 transition-all ${pathname === '/menu' ? 'text-[#C9A227]' : 'text-[#EFE7D9]/40'}`}
                >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-0.5-5" />
                        <polyline points="10 2 10 10 13 7 16 10 16 2" />
                    </svg>
                    <span className="text-[8px] font-black uppercase tracking-widest">The Ledger</span>
                </Link>

                {/* THE JOURNEY (STATUS) */}
                <Link
                    href={activeOrderId ? `/order-status?id=${activeOrderId}` : '#'}
                    onClick={(e) => {
                        if (!activeOrderId) {
                            e.preventDefault();
                            alert('No active order found. Please select your delicacies first.');
                        }
                    }}
                    className={`flex-2 flex flex-col items-center gap-1 py-1 transition-all relative ${pathname === '/order-status' ? 'text-[#D43425]' : 'text-[#EFE7D9]/40'} ${!activeOrderId ? 'opacity-20 grayscale' : ''}`}
                >
                    <div className="relative">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                        </svg>
                        {activeOrderId && pathname !== '/order-status' && (
                            <span className="absolute -top-1 -right-1 w-2 h-2 bg-[#D43425] rounded-full animate-pulse shadow-[0_0_8px_#D43425]" />
                        )}
                    </div>
                    <span className="text-[8px] font-black uppercase tracking-widest">The Journey</span>
                </Link>

                {/* THE CONCIERGE (AI) */}
                <Link
                    href="/ai-assistant"
                    className={`flex-1 flex flex-col items-center gap-1 py-1 transition-all ${pathname === '/ai-assistant' ? 'text-[#C9A227]' : 'text-[#EFE7D9]/40'}`}
                >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                        <circle cx="12" cy="11" r="2" />
                    </svg>
                    <span className="text-[8px] font-black uppercase tracking-widest">Concierge</span>
                </Link>
            </nav>
        </div>
    );
}
