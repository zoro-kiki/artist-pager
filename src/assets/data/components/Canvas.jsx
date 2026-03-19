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
  const [filters, setFilters] = useState({ country: 'All' });

  // 1. Unique Data Logic (No repetition)
  const rowData = useMemo(() => {
    const filtered = profilesData.filter(p => 
      p.name.toLowerCase().includes(search.toLowerCase()) &&
      (filters.country === 'All' || p.country === filters.country)
    );
    const rows = [[], [], [], []];
    filtered.forEach((p, i) => rows[i % 4].push(p));
    return { rows, totalCount: filtered.length };
  }, [search, filters]);

  useEffect(() => {
    const WORLD_SIZE = 3000; // Total scrollable area
    const grid = gridRef.current;
    
    // Set initial position to the center/top area so it's not "at the bottom"
    gsap.set(proxy.current, { x: -100, y: -100 });
    
    const setGridX = gsap.quickSetter(grid, "x", "px");
    const setGridY = gsap.quickSetter(grid, "y", "px");

    const update = (x, y) => {
      // Wrapping logic creates the "Infinite" effect
      setGridX(gsap.utils.wrap(-WORLD_SIZE, 0, x));
      setGridY(gsap.utils.wrap(-WORLD_SIZE, 0, y));
    };

    const dragInstance = Draggable.create(proxy.current, {
      type: "x,y",
      trigger: containerRef.current,
      inertia: true,
      onDrag: () => update(dragInstance[0].x, dragInstance[0].y),
      onThrowUpdate: () => update(dragInstance[0].x, dragInstance[0].y)
    });

    // Fading logic for edges
    const onTick = () => {
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      cardRefs.current.forEach((card) => {
        if (!card) return;
        const b = card.getBounds();
        if (!b) return;
        const cX = b.left + b.width / 2;
        const cY = b.top + b.height / 2;
        const pad = 200;
        const opX = gsap.utils.mapRange(0, pad, 0, 1, gsap.utils.clamp(0, pad, cX)) * 
                   gsap.utils.mapRange(vw - pad, vw, 1, 0, gsap.utils.clamp(vw - pad, vw, cX));
        const opY = gsap.utils.mapRange(0, pad, 0, 1, gsap.utils.clamp(0, pad, cY)) * 
                   gsap.utils.mapRange(vh - pad, vh, 1, 0, gsap.utils.clamp(vh - pad, vh, cY));
        card.setOpacity(opX * opY);
      });
    };

    gsap.ticker.add(onTick);
    update(-100, -100); // Initial call to position grid

    const onMouseMove = (e) => gsap.to(cursorRef.current, { x: e.clientX, y: e.clientY, duration: 0.6 });
    window.addEventListener("mousemove", onMouseMove);

    return () => {
      gsap.ticker.remove(onTick);
      window.removeEventListener("mousemove", onMouseMove);
    };
  }, [rowData]);

  return (
    <div ref={containerRef} className="fixed inset-0 bg-[#0a0a0a] overflow-hidden cursor-none select-none">
      
      {/* FILTER BAR - Spaced correctly */}
      <div className="fixed top-10 left-0 w-full z-[100] flex justify-center pointer-events-none">
        <div className="flex items-center gap-12 bg-black/80 backdrop-blur-2xl border border-white/10 p-4 px-10 rounded-full pointer-events-auto shadow-2xl">
          <div className="border-r border-white/10 pr-8">
            <input 
              type="text" 
              placeholder="SEARCH ARTISTS..."
              onChange={(e) => setSearch(e.target.value)}
              className="bg-transparent text-[10px] tracking-[0.4em] uppercase outline-none w-48 text-white placeholder:text-white/20"
            />
          </div>
          <div className="flex gap-10 items-center">
             <select className="bg-transparent text-[10px] tracking-[0.2em] outline-none text-white/60 hover:text-[#d4af37] cursor-pointer">
                <option value="All">ALL COUNTRIES</option>
             </select>
             <button className="text-[10px] tracking-[0.2em] text-[#d4af37] font-bold">ARTWORK FOR SALE</button>
          </div>
        </div>
      </div>

      {/* CURSOR */}
      <div ref={cursorRef} className="fixed top-0 left-0 w-10 h-10 border border-[#d4af37]/50 rounded-full z-[101] pointer-events-none flex items-center justify-center">
        <div className="w-1 h-1 bg-[#d4af37]" />
      </div>

      {/* THE GRID - Starting position fixed */}
      <div 
        ref={gridRef} 
        className="absolute top-0 left-0 flex flex-col gap-24 p-20 pt-40" 
        style={{ willChange: "transform" }}
      >
        {rowData.rows.map((row, rowIndex) => (
          <div key={rowIndex} className="flex gap-16" style={{ paddingLeft: rowIndex % 2 === 0 ? '0' : '100px' }}>
            {row.map((p, i) => (
              <LuxuryCard 
                key={p.id} 
                ref={el => cardRefs.current[i + (rowIndex * 10)] = el} 
                profile={p} 
                index={i} 
              />
            ))}
          </div>
        ))}
      </div>
      
      {/* VIGNETTE */}
      <div className="fixed inset-0 pointer-events-none shadow-[inset_0_0_150px_black] z-50" />
    </div>
  );
};

export default Canvas;