import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import { getNames } from 'country-list';
import { gsap } from 'gsap';
import { Draggable } from 'gsap/all';
import { motion, AnimatePresence } from 'framer-motion';
import LuxuryCard from './LuxuryCard';
import profilesData from '../profile';

gsap.registerPlugin(Draggable);

const CATEGORIES = ['Sculpture', 'Painting', 'Digital Art', 'Photography'];
const ARTIST_TYPES = [
  'Emerging Artist', 
  'Bestseller Artist', 
  'Featured Artist', 
  'Famous Artist', 
  'Master Artist'
];
const STYLES = ['Minimalism', 'Baroque', 'Contemporary', 'Abstract'];

const DEFAULT_FILTERS = { 
  country: 'All', 
  category: 'All', 
  medium: 'All', 
  style: 'All' 
};

const LERP_FACTOR = 0.072;

const Canvas = () => {
  const containerRef = useRef(null);
  const gridRef     = useRef(null);
  const cardRefs    = useRef(new Map());
  const proxy       = useRef(null);
  const tickerAdded = useRef(false);
  const smoothPos   = useRef({ x: 0, y: 0 }); 
  const targetPos   = useRef({ x: 0, y: 0 });

  const [isSidebarOpen, setIsSidebarOpen]   = useState(false);
  const [search, setSearch]                 = useState('');
  const [filters, setFilters]               = useState(DEFAULT_FILTERS);
  const [tempFilters, setTempFilters]       = useState(DEFAULT_FILTERS);
  const [isDragging, setIsDragging]         = useState(false);

  const countries = useMemo(() => getNames().sort(), []);

  const activeFilterCount = useMemo(() =>
    Number(filters.country !== 'All') + 
    Number(filters.category !== 'All') + 
    Number(filters.medium !== 'All') + 
    Number(filters.style !== 'All'),
  [filters]);

  /* ─── filtered + infinite rows ─── */
  const rowData = useMemo(() => {
    const term = search.toLowerCase();
    const filtered = profilesData.filter(p => {
      const matchSearch =
        p.name.toLowerCase().includes(term) ||
        p.location.toLowerCase().includes(term) ||
        p.category.toLowerCase().includes(term);
      const matchCountry   = filters.country === 'All' || p.country.trim() === filters.country;
      const matchCategory  = filters.category === 'All' || p.category === filters.category;
      const matchMedium    = filters.medium === 'All' || p.medium === filters.medium;
      const matchStyle     = filters.style === 'All' || p.style === filters.style;
      
      return matchSearch && matchCountry && matchCategory && matchMedium && matchStyle;
    });

    if (!filtered.length) return { rows: [], totalCount: 0 };

    const baseRows = [[], [], [], []];
    filtered.forEach((p, i) => baseRows[i % 4].push(p));
    const infiniteRows = baseRows.map(row => {
      const tripled = [...row, ...row, ...row];
      return tripled.map((item, idx) => ({ ...item, uniqueId: `${item.name}-${idx}-${Math.random()}` }));
    });
    return { rows: infiniteRows, totalCount: infiniteRows.reduce((acc, r) => acc + r.length, 0) };
  }, [search, filters]);

  const openSidebar  = useCallback(() => { setTempFilters(filters); setIsSidebarOpen(true); }, [filters]);
  const closeSidebar = useCallback(() => setIsSidebarOpen(false), []);
  const applyFilters = useCallback(() => { setFilters(tempFilters); closeSidebar(); }, [tempFilters, closeSidebar]);
  const clearTemp    = useCallback(() => setTempFilters(DEFAULT_FILTERS), []);

  /* ─── GSAP drag + lerp ticker ─── */
  useEffect(() => {
    if (!rowData.totalCount) return;
    const grid = gridRef.current;
    if (!grid) return;
    if (!proxy.current) proxy.current = document.createElement('div');

    let loopX = grid.offsetWidth  / 3;
    let loopY = grid.offsetHeight / 3;

    const setGridX = gsap.quickSetter(grid, 'x', 'px');
    const setGridY = gsap.quickSetter(grid, 'y', 'px');

    const updateCardOpacity = (gx, gy) => {
      const vw  = window.innerWidth;
      const vh  = window.innerHeight;
      const pad = 90;
      cardRefs.current.forEach((card) => {
        if (!card?.getBounds) return;
        const b = card.getBounds();
        if (!b) return;
        const cX = b.left + b.width  / 2;
        const cY = b.top  + b.height / 2;
        const op =
          gsap.utils.mapRange(0, pad, 0, 1, gsap.utils.clamp(0, pad, cX)) *
          gsap.utils.mapRange(vw - pad, vw, 1, 0, gsap.utils.clamp(vw - pad, vw, cX)) *
          gsap.utils.mapRange(0, pad, 0, 1, gsap.utils.clamp(0, pad, cY)) *
          gsap.utils.mapRange(vh - pad, vh, 1, 0, gsap.utils.clamp(vh - pad, vh, cY));
        card.setOpacity(op);
      });
    };

    const tick = () => {
      const raw   = proxy.current;
      const rawX  = gsap.getProperty(raw, 'x');
      const rawY  = gsap.getProperty(raw, 'y');
      smoothPos.current.x += (rawX - smoothPos.current.x) * LERP_FACTOR;
      smoothPos.current.y += (rawY - smoothPos.current.y) * LERP_FACTOR;
      const wrappedX = gsap.utils.wrap(-loopX, 0, smoothPos.current.x);
      const wrappedY = gsap.utils.wrap(-loopY, 0, smoothPos.current.y);
      setGridX(wrappedX);
      setGridY(wrappedY);
      updateCardOpacity(wrappedX, wrappedY);
    };

    if (!tickerAdded.current) {
      gsap.ticker.add(tick);
      tickerAdded.current = true;
    }

    gsap.set(proxy.current, { x: -loopX / 2, y: -loopY / 2 });
    smoothPos.current = { x: -loopX / 2, y: -loopY / 2 };

    const dragInstance = Draggable.create(proxy.current, {
      type: 'x,y',
      trigger: containerRef.current,
      inertia: true,
      throwResistance: 1800,
      onDragStart: () => setIsDragging(true),
      onDragEnd:   () => setIsDragging(false),
      allowNativeTouchScrolling: true,
      dragClickables: false,
      clickableTest: (el) => el.tagName === 'INPUT' || el.tagName === 'SELECT' || !!el.closest('button'),
    });

    const onResize = () => {
      if (!grid) return;
      loopX = grid.offsetWidth  / 3;
      loopY = grid.offsetHeight / 3;
    };
    window.addEventListener('resize', onResize);

    return () => {
      window.removeEventListener('resize', onResize);
      if (dragInstance[0]) dragInstance[0].kill();
      gsap.ticker.remove(tick);
      tickerAdded.current = false;
    };
  }, [rowData]);

  return (
    <main
      ref={containerRef}
      className="fixed inset-0 bg-[#070707] overflow-hidden touch-none select-none"
      style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
    >
      <style>{`
        .sidebar-scroll::-webkit-scrollbar { width: 2px; }
        .sidebar-scroll::-webkit-scrollbar-track { background: transparent; }
        .sidebar-scroll::-webkit-scrollbar-thumb { background: #d4af37; border-radius: 99px; }
        
        .cat-checkbox { appearance: none; -webkit-appearance: none; width: 16px; height: 16px;
          border: 1px solid rgba(255,255,255,0.1); background: transparent; cursor: pointer;
          position: relative; flex-shrink: 0; transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); }
        .cat-checkbox:checked { background: #d4af37; border-color: #d4af37; box-shadow: 0 0 15px rgba(212,175,55,0.3); }
        .cat-checkbox:checked::after { content: ''; position: absolute; left: 5px; top: 2px;
          width: 4px; height: 8px; border: 2px solid #000; border-top: none; border-left: none;
          transform: rotate(45deg); }
        
        /* Text Polish */
        .luxury-text { text-shadow: 0 2px 10px rgba(0,0,0,0.5); }
        .card-description { line-height: 1.6; letter-spacing: 0.05em; color: rgba(255,255,255,0.5); }
      `}</style>

      {/* ── UI CONTROLS ── */}
      <div className="fixed bottom-8 left-1/2 -translate-x-1/2 md:translate-x-0 md:bottom-auto md:top-8 md:right-8 md:left-auto z-[110] flex flex-col md:flex-row items-center gap-3 w-[90%] md:w-auto pointer-events-none">
        <div className="pointer-events-auto w-full md:w-auto flex items-center bg-black/70 backdrop-blur-2xl border border-white/[0.06] rounded-full px-5 py-3 group focus-within:border-[#d4af37]/40 transition-all duration-300 shadow-2xl">
          <svg className="w-3.5 h-3.5 text-white/20 group-focus-within:text-[#d4af37] transition-colors shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>
          </svg>
          <input
            type="text"
            placeholder="Search Artist"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="bg-transparent text-white text-[10px] outline-none mx-4 w-full md:w-48 placeholder:text-white/10 uppercase tracking-[0.22em] font-light"
          />
        </div>

        <button
          onClick={openSidebar}
          className="pointer-events-auto w-full md:w-auto relative flex items-center justify-center gap-2.5 px-7 py-3.5 rounded-full bg-white text-black text-[10px] font-bold uppercase tracking-[0.22em] hover:bg-[#d4af37] transition-all duration-300 shadow-xl"
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M4 6h16M7 12h10M10 18h4"/>
          </svg>
          Filters
          <AnimatePresence>
            {activeFilterCount > 0 && (
              <motion.span
                initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}
                className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-[#d4af37] text-black text-[8px] font-black flex items-center justify-center"
              >
                {activeFilterCount}
              </motion.span>
            )}
          </AnimatePresence>
        </button>
      </div>

      {/* ── SIDEBAR ── */}
      <AnimatePresence>
        {isSidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={closeSidebar}
              className="fixed inset-0 bg-black/80 backdrop-blur-md z-[150]"
            />

            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 40, stiffness: 280 }}
              className="fixed top-0 left-0 h-full w-full sm:w-[350px] bg-[#0a0a0a] z-[160] flex flex-col"
              style={{ borderRight: '1px solid rgba(255,255,255,0.04)' }}
            >
              <div className="flex items-center justify-between px-7 py-7" style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                <div>
                  
                  <h2 className="text-white text-base font-serif italic tracking-wide leading-none">SEARCH</h2>
                </div>
                <button onClick={closeSidebar} className="text-white/30 hover:text-white transition-colors">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M18 6 6 18M6 6l12 12"/></svg>
                </button>
              </div>

              <div className="flex-1 overflow-y-auto sidebar-scroll px-7 py-8">
                
                {/* 1. Category Section */}
                <div className="mb-10">
                  <p className="text-[8px] uppercase tracking-[0.45em] text-white/20 font-semibold mb-5"> Select Special Category</p>
                  <div className="flex flex-col gap-2">
                    {CATEGORIES.map(cat => (
                      <label key={cat} className="flex items-center gap-4 cursor-pointer py-3 px-4 border border-white/[0.03] hover:bg-white/[0.02] transition-all">
                        <input
                          type="checkbox"
                          className="cat-checkbox"
                          checked={tempFilters.category === cat}
                          onChange={() => setTempFilters(prev => ({ ...prev, category: prev.category === cat ? 'All' : cat }))}
                        />
                        <span className={`text-[10px] uppercase tracking-[0.2em] ${tempFilters.category === cat ? 'text-[#d4af37]' : 'text-white/40'}`}>{cat}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* 2. Artwork Category */}
                <div className="mb-10">
                  <p className="text-[8px] uppercase tracking-[0.45em] text-white/20 font-semibold mb-5">Select Artist Status</p>
                  <div className="flex flex-col gap-2">
                    {ARTIST_TYPES.map(type => (
                      <label key={type} className="flex items-center gap-4 cursor-pointer py-3 px-4 border border-white/[0.03] hover:bg-white/[0.02] transition-all">
                        <input
                          type="checkbox"
                          className="cat-checkbox"
                          checked={tempFilters.artistType === type}
                          onChange={() => setTempFilters(prev => ({ ...prev, artistType: prev.artistType === type ? 'All' : type }))}
                        />
                        <span className={`text-[10px] uppercase tracking-[0.2em] ${tempFilters.artistType === type ? 'text-[#d4af37]' : 'text-white/40'}`}>{type}</span>
                      </label>
                    ))}
                  </div>
                </div>

                

                {/* Region Section */}
                <div className="mb-6">
                  <p className="text-[8px] uppercase tracking-[0.45em] text-white/20 font-semibold mb-5">Select Artist Country</p>
                  <div className="relative border border-white/10 bg-white/[0.02]">
                    <select
                      value={tempFilters.country}
                      onChange={e => setTempFilters(prev => ({ ...prev, country: e.target.value }))}
                      className="w-full bg-transparent px-4 py-3.5 text-white text-[10px] uppercase tracking-[0.18em] outline-none appearance-none cursor-pointer"
                    >
                      <option value="All">All Regions</option>
                      {countries.map(c => <option key={c} value={c} className="bg-[#111]">{c}</option>)}
                    </select>
                  </div>
                </div>
              </div>

              <div className="px-7 py-6 flex gap-3 bg-[#0c0c0c]" style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}>
                <button onClick={clearTemp} className="flex-1 py-3.5 text-[9px] uppercase tracking-[0.2em] text-white/20 border border-white/5 hover:text-white transition-colors">Clear</button>
                <button onClick={applyFilters} className="flex-[2] py-3.5 bg-white text-black text-[9px] font-black uppercase tracking-[0.22em] hover:bg-[#d4af37] transition-colors">Apply Filters</button>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* ── INFINITE GRID ── */}
      <section ref={gridRef} className="absolute top-0 left-0 flex flex-col gap-8 md:gap-16 p-10 md:p-20 pt-32 md:pt-64 w-max will-change-transform">
        {rowData.rows.map((row, rowIndex) => (
          <div key={rowIndex} className="flex gap-8 md:gap-16" style={{ paddingLeft: rowIndex % 2 !== 0 ? '60px' : '0' }}>
            {row.map((profile, i) => (
              <LuxuryCard
                key={profile.uniqueId}
                profile={profile}
                ref={el => {
                  if (el) cardRefs.current.set(`${rowIndex}-${i}`, el);
                  else cardRefs.current.delete(`${rowIndex}-${i}`);
                }}
              />
            ))}
          </div>
        ))}
        {rowData.totalCount === 0 && (
          <div className="flex flex-col items-center justify-center w-screen h-screen gap-6 pointer-events-none">
            <div className="w-[1px] h-16 bg-[#d4af37]/30" />
            <p className="text-[9px] uppercase tracking-[0.5em] text-white/20">No matching results</p>
          </div>
        )}
      </section>

      <div className="fixed inset-0 pointer-events-none shadow-[inset_0_0_180px_rgba(0,0,0,0.95)] z-50" />
      <div className="fixed inset-0 pointer-events-none bg-gradient-to-b from-[#070707] via-transparent to-[#070707] opacity-80 z-40" />
    </main>
  );
};

export default Canvas;