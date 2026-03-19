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
  const cardRefs = useRef([]); // This holds the refs for the fade animation
  const proxy = useRef(document.createElement("div"));
  
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState({ country: 'All', category: 'All' });

  // 1. Filter Logic
  const filteredProfiles = useMemo(() => {
    return profilesData.filter(p => {
      const matchSearch = p.name.toLowerCase().includes(search.toLowerCase());
      const matchCountry = filters.country === 'All' || p.country === filters.country;
      return matchSearch && matchCountry;
    });
  }, [search, filters]);

  // 2. STOP REPETITION: Split data into 4 unique rows
  const rowData = useMemo(() => {
    const rows = [[], [], [], []];
    filteredProfiles.forEach((p, i) => {
      rows[i % 4].push(p);
    });
    return rows;
  }, [filteredProfiles]);

  useEffect(() => {
    const grid = gridRef.current;
    const WORLD_SIZE = 4000;
    const setGridX = gsap.quickSetter(grid, "x", "px");
    const setGridY = gsap.quickSetter(grid, "y", "px");

    const dragInstance = Draggable.create(proxy.current, {
      type: "x,y",
      trigger: containerRef.current,
      inertia: true,
      onDrag: () => update(dragInstance[0].x, dragInstance[0].y),
      onThrowUpdate: () => update(dragInstance[0].x, dragInstance[0].y)
    });

    function update(x, y) {
      setGridX(gsap.utils.wrap(-WORLD_SIZE, 0, x));
      setGridY(gsap.utils.wrap(-WORLD_SIZE, 0, y));
    }

    // 3. FADE ANIMATION ENGINE (The request)
    const onTick = () => {
      const vw = window.innerWidth;
      const vh = window.innerHeight;

      cardRefs.current.forEach((card) => {
        if (!card) return;
        const b = card.getBounds();
        if (!b) return;

        const cX = b.left + b.width / 2;
        const cY = b.top + b.height / 2;

        // Calculate Edge Fade
        const pad = 250; // Distance from edge to start fading
        const opX = gsap.utils.mapRange(0, pad, 0, 1, gsap.utils.clamp(0, pad, cX)) * 
                   gsap.utils.mapRange(vw - pad, vw, 1, 0, gsap.utils.clamp(vw - pad, vw, cX));
        const opY = gsap.utils.mapRange(0, pad, 0, 1, gsap.utils.clamp(0, pad, cY)) * 
                   gsap.utils.mapRange(vh - pad, vh, 1, 0, gsap.utils.clamp(vh - pad, vh, cY));
        
        card.setOpacity(opX * opY);
      });
    };

    gsap.ticker.add(onTick);
    const onMouseMove = (e) => gsap.to(cursorRef.current, { x: e.clientX, y: e.clientY, duration: 0.6 });
    
    window.addEventListener("mousemove", onMouseMove);
    return () => {
      gsap.ticker.remove(onTick);
      window.removeEventListener("mousemove", onMouseMove);
    };
  }, [filteredProfiles]);

  return (
    <div ref={containerRef} className="fixed inset-0 bg-[#0a0a0a] overflow-hidden cursor-none select-none">
      
      {/* FILTER PART - SPACED OUT */}
      <div className="fixed top-8 left-0 w-full z-[100] flex justify-center">
        <div className="flex items-center gap-16 bg-black/60 backdrop-blur-xl border border-white/10 p-4 px-12 rounded-full">
          <input 
            type="text" 
            placeholder="SEARCH..."
            onChange={(e) => setSearch(e.target.value)}
            className="bg-transparent text-[10px] tracking-[0.4em] outline-none w-40 border-r border-white/10"
          />
          <div className="flex gap-10">
            <select className="bg-transparent text-[10px] uppercase tracking-[0.2em] outline-none text-white/50">
              <option>COUNTRY</option>
            </select>
            <button className="text-[10px] tracking-[0.2em] text-[#d4af37]">FOR SALE</button>
          </div>
        </div>
      </div>

      {/* CURSOR */}
      <div ref={cursorRef} className="fixed top-0 left-0 w-8 h-8 border border-[#d4af37] rounded-full z-[101] pointer-events-none" />

      {/* THE GRID - NO REPETITION */}
      <div ref={gridRef} className="absolute flex flex-col gap-20 p-[500px]">
        {rowData.map((row, rowIndex) => (
          <div key={rowIndex} className="flex gap-12" style={{ paddingLeft: rowIndex % 2 === 0 ? '0' : '120px' }}>
            {row.map((p, i) => (
              <LuxuryCard 
                key={p.id} 
                // This logic ensures every card has a unique index for the cardRefs array
                ref={el => cardRefs.current[filteredProfiles.indexOf(p)] = el}
                profile={p} 
                index={i} 
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

export default Canvas;