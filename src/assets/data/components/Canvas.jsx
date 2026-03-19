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
  
  // States
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState({ country: 'All', category: 'All', status: 'All' });

  // Luxury Country List
  const countries = ["All", "India", "USA", "France", "United Kingdom", "Italy", "Japan", "Germany"];

  // Filter Logic
  const filteredProfiles = useMemo(() => {
    return profilesData.filter(p => {
      const matchSearch = p.name.toLowerCase().includes(search.toLowerCase());
      const matchCountry = filters.country === 'All' || p.country === filters.country;
      const matchCat = filters.category === 'All' || p.category === filters.category;
      const matchStatus = filters.status === 'All' || p.status === filters.status;
      return matchSearch && matchCountry && matchCat && matchStatus;
    });
  }, [search, filters]);

  useEffect(() => {
    const grid = gridRef.current;
    const WORLD_SIZE = 4000;
    const setGridX = gsap.quickSetter(grid, "x", "px");
    const setGridY = gsap.quickSetter(grid, "y", "px");

    // Draggable with Inertia
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

    // Proximity Fade + Spotlight Engine
    const onTick = () => {
      const mX = gsap.getProperty(cursorRef.current, "x");
      const mY = gsap.getProperty(cursorRef.current, "y");
      const vw = window.innerWidth;
      const vh = window.innerHeight;

      cardRefs.current.forEach((card) => {
        if (!card) return;
        const b = card.getBounds();
        if (!b) return;
        const cX = b.left + b.width / 2;
        const cY = b.top + b.height / 2;

        // Mouse Lighting
        const dist = Math.hypot(mX - cX, mY - cY);
        const light = gsap.utils.mapRange(0, 500, 1, 0, gsap.utils.clamp(0, 500, dist));
        card.setGlow(light * 0.4);
        card.setBrightness(light * 0.2);

        // EDGE FADING (The request)
        const pad = 200; // Distance from edge where fading starts
        const opX = gsap.utils.mapRange(0, pad, 0, 1, gsap.utils.clamp(0, pad, cX)) * 
                   gsap.utils.mapRange(vw - pad, vw, 1, 0, gsap.utils.clamp(vw - pad, vw, cX));
        const opY = gsap.utils.mapRange(0, pad, 0, 1, gsap.utils.clamp(0, pad, cY)) * 
                   gsap.utils.mapRange(vh - pad, vh, 1, 0, gsap.utils.clamp(vh - pad, vh, cY));
        
        card.setOpacity(opX * opY);
      });
    };

    gsap.ticker.add(onTick);
    
    const onMouseMove = (e) => gsap.to(cursorRef.current, { x: e.clientX, y: e.clientY, duration: 0.6, ease: "power3.out" });
    const onWheel = (e) => {
      gsap.to(proxy.current, {
        x: `+=${-e.deltaX * 1.5}`, y: `+=${-e.deltaY * 1.5}`, duration: 1, ease: "power2.out",
        onUpdate: () => update(gsap.getProperty(proxy.current, "x"), gsap.getProperty(proxy.current, "y"))
      });
    };

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("wheel", onWheel);
    return () => {
      gsap.ticker.remove(onTick);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("wheel", onWheel);
    };
  }, [filteredProfiles]);

  return (
    <div ref={containerRef} className="fixed inset-0 bg-[#0a0a0a] overflow-hidden cursor-none select-none text-[#f7f3f0]">
      
      {/* LUXURY COMMAND BAR */}
      <div className="fixed top-8 left-0 w-full z-[100] px-10 flex justify-center">
        <div className="flex items-center gap-8 bg-black/60 backdrop-blur-3xl border border-white/10 p-3 px-10 rounded-full shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
          
          {/* Search Box */}
          <div className="relative border-r border-white/10 pr-6">
            <input 
              type="text" 
              placeholder="SEARCH ARTIST..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-transparent text-[10px] tracking-[0.3em] uppercase outline-none w-40 placeholder:text-white/20 focus:w-60 transition-all duration-500"
            />
          </div>

          {/* Filter: Country */}
          <select 
            onChange={(e) => setFilters({...filters, country: e.target.value})}
            className="bg-transparent text-[10px] uppercase tracking-[0.2em] outline-none cursor-pointer hover:text-[#d4af37] transition-colors"
          >
            {countries.map(c => <option key={c} value={c} className="bg-[#0a0a0a]">{c}</option>)}
          </select>

          {/* Filter: Category */}
          <select 
            onChange={(e) => setFilters({...filters, category: e.target.value})}
            className="bg-transparent text-[10px] uppercase tracking-[0.2em] outline-none cursor-pointer hover:text-[#d4af37] transition-colors"
          >
            <option className="bg-[#0a0a0a]" value="All">CATEGORY</option>
            <option className="bg-[#0a0a0a]" value="Sculpture">SCULPTURE</option>
            <option className="bg-[#0a0a0a]" value="Painting">PAINTING</option>
          </select>

          {/* Toggle: Status */}
          <button 
            onClick={() => setFilters({...filters, status: filters.status === 'All' ? 'Artwork for Sale' : 'All'})}
            className={`text-[10px] uppercase tracking-[0.2em] transition-all ${filters.status !== 'All' ? 'text-[#d4af37]' : 'text-white/40'}`}
          >
            FOR SALE
          </button>
        </div>
      </div>

      {/* CUSTOM LUXURY CURSOR */}
      <div ref={cursorRef} className="fixed top-0 left-0 w-10 h-10 border border-[#d4af37]/30 rounded-full z-[101] pointer-events-none flex items-center justify-center">
          <div className="w-1 h-1 bg-[#d4af37] shadow-[0_0_15px_#d4af37]" />
      </div>

      {/* ART GRID */}
      <div ref={gridRef} className="absolute flex flex-col gap-10 md:gap-14 p-60 will-change-transform">
        {[...Array(4)].map((_, rowIndex) => (
          <div key={rowIndex} className="flex gap-8 md:gap-12" style={{ paddingLeft: rowIndex % 2 === 0 ? '0' : '100px' }}>
            {filteredProfiles.map((p, i) => (
              <LuxuryCard 
                key={`${rowIndex}-${i}`} 
                ref={el => cardRefs.current[i + rowIndex * filteredProfiles.length] = el}
                profile={p} 
                index={i} 
              />
            ))}
          </div>
        ))}
      </div>

      {/* AESTHETIC VIGNETTE */}
      <div className="fixed inset-0 pointer-events-none shadow-[inset_0_0_200px_black] z-[90]" />
      <div className="fixed bottom-10 left-10 text-[8px] tracking-[1em] text-white/10 uppercase">
        Infinite Gallery Archive // 2024
      </div>
    </div>
  );
};

export default Canvas;