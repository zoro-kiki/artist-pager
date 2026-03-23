import React, { useEffect, useRef, useState, useMemo } from 'react';
import { gsap } from 'gsap';
import { Draggable } from 'gsap/Draggable';
import LuxuryCard from './LuxuryCard';
import profilesData from '../profile'; 

gsap.registerPlugin(Draggable);

const Canvas = () => {
  const containerRef = useRef(null);
  const gridRef = useRef(null);
  const cursorRef = useRef(null);
  const cardRefs = useRef([]);
  const proxy = useRef(document.createElement("div"));
  
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState({ 
    country: 'All', 
    category: 'All', 
    special: 'All' 
  });

  const rowData = useMemo(() => {
    const filtered = profilesData.filter(p => {
      const matchSearch = p.name.toLowerCase().includes(search.toLowerCase());
      const matchCountry = filters.country === 'All' || p.country.trim() === filters.country;
      const matchCategory = filters.category === 'All' || p.category === filters.category;
      const matchSpecial = filters.special === 'All' || 
                           (filters.special === 'For Sale' && p.status.toLowerCase().includes('sale')) ||
                           (filters.special === 'Private' && p.status.toLowerCase().includes('private'));

      return matchSearch && matchCountry && matchCategory && matchSpecial;
    });

    if (filtered.length === 0) return { rows: [], totalCount: 0 };
    const baseRows = [[], [], [], []];
    filtered.forEach((p, i) => baseRows[i % 4].push(p));
    const infiniteRows = baseRows.map(row => {
      const tripled = [...row, ...row, ...row];
      return tripled.map((item, idx) => ({
        ...item,
        uniqueId: `${item.name}-${idx}-${Math.random()}` 
      }));
    });
    return { 
      rows: infiniteRows, 
      totalCount: infiniteRows.reduce((acc, row) => acc + row.length, 0) 
    };
  }, [search, filters]);

  useEffect(() => {
    if (rowData.totalCount === 0) return;
    const grid = gridRef.current;
    cardRefs.current = [];

    const getLoopPoints = () => ({
      loopX: grid.offsetWidth / 3,
      loopY: grid.offsetHeight / 3
    });

    let { loopX, loopY } = getLoopPoints();
    const setGridX = gsap.quickSetter(grid, "x", "px");
    const setGridY = gsap.quickSetter(grid, "y", "px");

    const update = () => {
      const x = gsap.getProperty(proxy.current, "x");
      const y = gsap.getProperty(proxy.current, "y");
      setGridX(gsap.utils.wrap(-loopX, 0, x));
      setGridY(gsap.utils.wrap(-loopY, 0, y));
    };

    const dragInstance = Draggable.create(proxy.current, {
      type: "x,y",
      trigger: containerRef.current,
      inertia: true,
      onDrag: update,
      onThrowUpdate: update,
      allowNativeTouchScrolling: false,
      // ✅ FIX: This prevents Draggable from stopping clicks on <select> and <input>
      dragClickables: false, 
    });

    const onTick = () => {
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const pad = 240;
      cardRefs.current.forEach((card) => {
        if (!card || !card.getBounds) return;
        const b = card.getBounds();
        if (!b) return;
        const cX = b.left + b.width / 2;
        const cY = b.top + b.height / 2;
        const opX = gsap.utils.mapRange(0, pad, 0, 1, gsap.utils.clamp(0, pad, cX)) * 
                   gsap.utils.mapRange(vw - pad, vw, 1, 0, gsap.utils.clamp(vw - pad, vw, cX));
        const opY = gsap.utils.mapRange(0, pad, 0, 1, gsap.utils.clamp(0, pad, cY)) * 
                   gsap.utils.mapRange(vh - pad, vh, 1, 0, gsap.utils.clamp(vh - pad, vh, cY));
        card.setOpacity(opX * opY);
      });
    };

    gsap.ticker.add(onTick);
    gsap.set(proxy.current, { x: -100, y: -100 });
    update();

    const onMouseMove = (e) => gsap.to(cursorRef.current, { x: e.clientX, y: e.clientY, duration: 0.8, ease: "power3.out" });
    const onResize = () => { const p = getLoopPoints(); loopX = p.loopX; loopY = p.loopY; update(); };

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("resize", onResize);
    return () => {
      gsap.ticker.remove(onTick);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("resize", onResize);
      if (dragInstance[0]) dragInstance[0].kill();
    };
  }, [rowData]);

  return (
    <main ref={containerRef} className="fixed inset-0 bg-[#070707] overflow-hidden cursor-none select-none">
      
      {/* LUXURY FILTERS */}
      <nav className="fixed top-10 left-0 w-full z-[100] flex justify-center items-center gap-4 pointer-events-none px-6">
        
        {/* SEARCH */}
        <div className="pointer-events-auto bg-white/5 backdrop-blur-2xl border border-white/10 p-3 px-8 rounded-full shadow-xl">
          <input 
            type="text" 
            placeholder="SEARCH ARTIST..."
            onChange={(e) => setSearch(e.target.value)}
            className="bg-transparent text-[11px] tracking-[0.3em] uppercase outline-none w-32 md:w-48 text-white placeholder:text-white/20"
          />
        </div>

        {/* CATEGORY */}
        <div className="pointer-events-auto bg-white/5 backdrop-blur-2xl border border-white/10 p-3 px-6 rounded-full shadow-xl">
          <select 
            className="bg-transparent text-[11px] tracking-[0.2em] outline-none text-white/70 hover:text-[#d4af37] cursor-pointer uppercase transition-colors"
            onChange={(e) => setFilters({ ...filters, category: e.target.value })}
          >
            <option className="bg-[#111] text-white" value="All">CATEGORY</option>
            <option className="bg-[#111] text-white" value="Sculpture">Sculpture</option>
            <option className="bg-[#111] text-white" value="Painting">Painting</option>
            <option className="bg-[#111] text-white" value="Digital">Digital Art</option>
          </select>
        </div>

        {/* COUNTRY */}
        <div className="pointer-events-auto bg-white/5 backdrop-blur-2xl border border-white/10 p-3 px-6 rounded-full shadow-xl">
          <select 
            className="bg-transparent text-[11px] tracking-[0.2em] outline-none text-white/70 hover:text-[#d4af37] cursor-pointer uppercase transition-colors"
            onChange={(e) => setFilters({ ...filters, country: e.target.value })}
          >
            <option className="bg-[#111] text-white" value="All">COUNTRY</option>
            <option className="bg-[#111] text-white" value="India">India</option>
            <option className="bg-[#111] text-white" value="USA">USA</option>
            <option className="bg-[#111] text-white" value="France">France</option>
          </select>
        </div>

        {/* SPECIALTY */}
        <div className="pointer-events-auto bg-white/5 backdrop-blur-2xl border border-white/10 p-3 px-6 rounded-full shadow-xl">
          <select 
            className="bg-transparent text-[11px] tracking-[0.2em] outline-none text-white/70 hover:text-[#d4af37] cursor-pointer uppercase transition-colors"
            onChange={(e) => setFilters({ ...filters, special: e.target.value })}
          >
            <option className="bg-[#111] text-white" value="All">SPECIALTY</option>
            <option className="bg-[#111] text-white" value="For Sale">For Sale</option>
            <option className="bg-[#111] text-white" value="Private">Private</option>
          </select>
        </div>

      </nav>

      {/* LUXURY CURSOR */}
      <div ref={cursorRef} className="fixed top-0 left-0 w-12 h-12 border border-[#d4af37]/40 rounded-full z-[101] pointer-events-none flex items-center justify-center -translate-x-1/2 -translate-y-1/2">
        <div className="w-1.5 h-1.5 bg-[#d4af37] rounded-full shadow-[0_0_12px_#d4af37]" />
      </div>

      <section ref={gridRef} className="absolute top-0 left-0 flex flex-col gap-10 p-20 pt-44 w-max" style={{ willChange: "transform" }}>
        {rowData.rows.map((row, rowIndex) => (
          <div key={rowIndex} className="flex gap-10" style={{ paddingLeft: rowIndex % 2 === 0 ? '0' : '50px' }}>
            {row.map((profile) => (
              <LuxuryCard 
                key={profile.uniqueId} 
                profile={profile} 
                ref={el => { if(el) cardRefs.current.push(el) }} 
              />
            ))}
          </div>
        ))}
      </section>
      
      <div className="fixed inset-0 pointer-events-none shadow-[inset_0_0_300px_black] z-50" />
      <div className="fixed inset-0 pointer-events-none bg-gradient-to-b from-[#070707] via-transparent to-[#070707] opacity-90 z-40" />
    </main>
  );
};

export default Canvas;