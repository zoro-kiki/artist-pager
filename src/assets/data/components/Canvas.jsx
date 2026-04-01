import React, { useEffect, useRef, useState, useMemo } from 'react';
import { getNames } from 'country-list';
import { gsap } from 'gsap';
import { Draggable } from 'gsap/Draggable';
import { motion, AnimatePresence } from 'framer-motion';
import LuxuryCard from './LuxuryCard';
import profilesData from '../profile';

gsap.registerPlugin(Draggable);

const Canvas = () => {
    const containerRef = useRef(null);
    const gridRef = useRef(null);
    const cardRefs = useRef([]);
    const proxy = useRef(document.createElement("div"));

    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [search, setSearch] = useState(""); 
    const [filters, setFilters] = useState({ country: 'All', category: 'All', special: 'All' });
    const [tempFilters, setTempFilters] = useState({ country: 'All', category: 'All', special: 'All' });

    const countries = useMemo(() => getNames().sort(), []);

    const rowData = useMemo(() => {
        const filtered = profilesData.filter(p => {
            const searchTerm = search.toLowerCase();
            const matchSearch = 
                p.name.toLowerCase().includes(searchTerm) || 
                p.location.toLowerCase().includes(searchTerm) || 
                p.category.toLowerCase().includes(searchTerm);

            const matchCountry = filters.country === 'All' || p.country.trim() === filters.country;
            const matchCategory = filters.category === 'All' || p.category === filters.category;
            return matchSearch && matchCountry && matchCategory;
        });

        if (filtered.length === 0) return { rows: [], totalCount: 0 };
        const baseRows = [[], [], [], []];
        filtered.forEach((p, i) => baseRows[i % 4].push(p));
        const infiniteRows = baseRows.map(row => {
            const tripled = [...row, ...row, ...row];
            return tripled.map((item, idx) => ({ ...item, uniqueId: `${item.name}-${idx}-${Math.random()}` }));
        });
        return { rows: infiniteRows, totalCount: infiniteRows.reduce((acc, row) => acc + row.length, 0) };
    }, [search, filters]);

    const handleApplyFilters = () => {
        setFilters(tempFilters);
        setIsSidebarOpen(false);
    };

    useEffect(() => {
        if (rowData.totalCount === 0) return;
        cardRefs.current = [];
        const grid = gridRef.current;
        let loopX = grid.offsetWidth / 3;
        let loopY = grid.offsetHeight / 3;

        const setGridX = gsap.quickSetter(grid, "x", "px");
        const setGridY = gsap.quickSetter(grid, "y", "px");

        const update = () => {
            const x = gsap.getProperty(proxy.current, "x");
            const y = gsap.getProperty(proxy.current, "y");
            setGridX(gsap.utils.wrap(-loopX, 0, x));
            setGridY(gsap.utils.wrap(-loopY, 0, y));

            const vw = window.innerWidth;
            const vh = window.innerHeight;
            const pad = 80;
            cardRefs.current.forEach((card) => {
                if (!card?.getBounds) return;
                const b = card.getBounds();
                if (!b) return;
                const cX = b.left + b.width / 2;
                const cY = b.top + b.height / 2;
                const op = gsap.utils.mapRange(0, pad, 0, 1, gsap.utils.clamp(0, pad, cX)) *
                           gsap.utils.mapRange(vw - pad, vw, 1, 0, gsap.utils.clamp(vw - pad, vw, cX)) *
                           gsap.utils.mapRange(0, pad, 0, 1, gsap.utils.clamp(0, pad, cY)) *
                           gsap.utils.mapRange(vh - pad, vh, 1, 0, gsap.utils.clamp(vh - pad, vh, cY));
                card.setOpacity(op);
            });
        };

        const dragInstance = Draggable.create(proxy.current, {
            type: "x,y",
            trigger: containerRef.current,
            inertia: true,
            onDrag: update,
            onThrowUpdate: update,
            allowNativeTouchScrolling: true,
            dragClickables: false,
            clickableTest: (el) => el.tagName === "INPUT" || el.tagName === "SELECT" || el.closest('button')
        });

        gsap.set(proxy.current, { x: -20, y: -20 });
        update();

        const onResize = () => { if(grid) { loopX = grid.offsetWidth / 3; loopY = grid.offsetHeight / 3; update(); } };
        window.addEventListener("resize", onResize);
        return () => {
            window.removeEventListener("resize", onResize);
            if (dragInstance[0]) dragInstance[0].kill();
        };
    }, [rowData]);

    return (
        <main ref={containerRef} className="fixed inset-0 bg-[#070707] overflow-hidden touch-none select-none">
            
            <style>{`.custom-sidebar-scroll::-webkit-scrollbar { width: 3px; } .custom-sidebar-scroll::-webkit-scrollbar-thumb { background: #d4af37; border-radius: 10px; }`}</style>

            {/* RESPONSIVE UI CONTROLS */}
            <div className="fixed bottom-10 left-1/2 -translate-x-1/2 md:translate-x-0 md:bottom-auto md:top-10 md:right-10 md:left-auto z-[110] flex flex-col md:flex-row items-center gap-4 w-[90%] md:w-auto pointer-events-none">
                <div className="pointer-events-auto w-full md:w-auto flex items-center bg-black/60 backdrop-blur-xl border border-white/5 rounded-full px-6 py-3.5 group focus-within:border-[#d4af37]/50 transition-all shadow-2xl">
                    <svg className="w-4 h-4 text-white/20 group-focus-within:text-[#d4af37]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
                    <input 
                        type="text" 
                        placeholder="Search Artist"
                        value={search}
                        className="bg-transparent text-white text-[11px] outline-none ml-4 flex-1 md:w-56 placeholder:text-white/10 uppercase tracking-[0.2em] font-light"
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>

                <button 
                    onClick={() => { setTempFilters(filters); setIsSidebarOpen(true); }}
                    className="pointer-events-auto w-full md:w-auto flex items-center justify-center gap-3 px-8 py-4 rounded-full bg-white text-black text-[10px] font-bold uppercase tracking-[0.2em] hover:bg-[#d4af37] transition-all shadow-xl"
                >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M4 6h16M4 12h16M4 18h16"/></svg>
                    Filters
                </button>
            </div>

            {/* SIDEBAR - Responsive width */}
            <AnimatePresence>
                {isSidebarOpen && (
                    <>
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsSidebarOpen(false)} className="fixed inset-0 bg-black/80 backdrop-blur-md z-[150]" />
                        <motion.aside initial={{ x: "-100%" }} animate={{ x: 0 }} exit={{ x: "-100%" }} transition={{ type: "spring", damping: 35 }} className="fixed top-0 left-0 h-full w-full sm:w-[420px] bg-[#0c0c0c] z-[160] border-r border-white/5 flex flex-col overflow-hidden">
                            <div className="p-8 md:p-10 flex justify-between items-center border-b border-white/5">
                                <h2 className="text-white text-xl font-serif italic tracking-wide"> Search</h2>
                                <button onClick={() => setIsSidebarOpen(false)} className="text-white/10 hover:text-white transition-colors">
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M18 6L6 18M6 6l12 12"/></svg>
                                </button>
                            </div>
                            <div className="flex-1 overflow-y-auto p-8 md:p-10 custom-sidebar-scroll">
                                <div className="mb-14">
                                    <h3 className="text-[#d4af37] text-[9px] uppercase tracking-[0.5em] font-bold mb-10">Select Artwork Category</h3>
                                    <div className="grid grid-cols-1 gap-4">
                                        {['Sculpture', 'Painting', 'Digital Art', 'Photography'].map((cat) => (
                                            <label key={cat} className="flex items-center gap-5 cursor-pointer group bg-white/[0.02] p-4 border border-white/5 hover:border-[#d4af37]/30 transition-all">
                                                <input type="checkbox" checked={tempFilters.category === cat} onChange={() => setTempFilters({ ...tempFilters, category: tempFilters.category === cat ? 'All' : cat })} className="w-4 h-4 rounded-none border-white/20 bg-transparent checked:bg-[#d4af37] appearance-none border transition-all" />
                                                <span className="text-white/40 text-[11px] uppercase tracking-[0.2em] group-hover:text-white transition-colors">{cat}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                                <div className="mb-14">
                                    <h3 className="text-[#d4af37] text-[9px] uppercase tracking-[0.5em] font-bold mb-10">Select Artist Country</h3>
                                    <div className="relative">
                                        <select value={tempFilters.country} onChange={(e) => setTempFilters({ ...tempFilters, country: e.target.value })} className="w-full bg-white/[0.03] border border-white/10 p-5 text-white text-[11px] uppercase tracking-widest outline-none appearance-none">
                                            <option value="All">All Regions</option>
                                            {countries.map(c => <option key={c} className="bg-[#111]" value={c}>{c}</option>)}
                                        </select>
                                        <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-white/20">
                                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m6 9 6 6 6-6"/></svg>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="p-8 md:p-10 border-t border-white/5 flex gap-4 bg-[#0c0c0c]">
                                <button onClick={() => setTempFilters({ country: 'All', category: 'All', special: 'All' })} className="flex-1 py-5 text-white/20 text-[10px] uppercase tracking-widest border border-white/5 hover:text-white transition-colors">Clear</button>
                                <button onClick={handleApplyFilters} className="flex-[2.5] py-5 bg-white text-black text-[10px] font-bold uppercase tracking-[0.2em] hover:bg-[#d4af37] transition-colors">Apply Selection</button>
                            </div>
                        </motion.aside>
                    </>
                )}
            </AnimatePresence>

            {/* GRID SECTION */}
            <section ref={gridRef} className="absolute top-0 left-0 flex flex-col gap-8 md:gap-12 p-10 md:p-20 pt-32 md:pt-64 w-max will-change-transform">
                {rowData.rows.map((row, rowIndex) => (
                    <div key={rowIndex} className="flex gap-8 md:gap-12" style={{ paddingLeft: rowIndex % 2 === 0 ? '0' : '40px' }}>
                        {row.map((profile, i) => (
                            <LuxuryCard key={profile.uniqueId} profile={profile} ref={el => { cardRefs.current[rowIndex * row.length + i] = el }} />
                        ))}
                    </div>
                ))}
            </section>

            {/* VIGNETTE OVERLAYS */}
            <div className="fixed inset-0 pointer-events-none shadow-[inset_0_0_150px_rgba(0,0,0,0.9)] z-50" />
            <div className="fixed inset-0 pointer-events-none bg-gradient-to-b from-[#070707] via-transparent to-[#070707] opacity-80 z-40" />
        </main>
    );
};

export default Canvas;