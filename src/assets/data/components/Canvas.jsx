import React, { useEffect, useRef, useState, useMemo } from 'react';
import Select from 'react-select';
import { getNames } from 'country-list';
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

  const countryOptions = [
    { value: 'All', label: 'COUNTRY' },
    ...getNames().map(c => ({ value: c, label: c }))
  ];
  
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
    
    
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
    const rowCount = isMobile ? 2 : 4; 
    const baseRows = Array.from({ length: rowCount }, () => []);
    
    filtered.forEach((p, i) => baseRows[i % rowCount].push(p));

    return { 
      rows: baseRows.map(row => {
        const tripled = [...row, ...row, ...row];
        return tripled.map((item, idx) => ({
          ...item,
          uniqueId: `${item.name}-${idx}-${Math.random()}`
        }));
      }), 
      totalCount: filtered.length 
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
      allowNativeTouchScrolling: true,
      dragClickables: false,
      clickableTest: (el) => el.tagName === "SELECT" || el.tagName === "INPUT" || el.closest('.pointer-events-auto')
    });

    const onTick = () => {
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      // Mobile par fade effect thoda jaldi start hoga
      const pad = vw < 768 ? 100 : 240; 
      
      cardRefs.current.forEach((card) => {
        if (!card?.getBounds) return;
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

    const onMouseMove = (e) => {
        if(window.innerWidth > 1024 && cursorRef.current) {
            gsap.to(cursorRef.current, { x: e.clientX, y: e.clientY, duration: 0.6, ease: "power2.out" });
        }
    };
    
    const onResize = () => { 
        const p = getLoopPoints(); 
        loopX = p.loopX; 
        loopY = p.loopY; 
        update(); 
    };

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("resize", onResize);
    return () => {
      gsap.ticker.remove(onTick);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("resize", onResize);
      if (dragInstance[0]) dragInstance[0].kill();
    };
  }, [rowData]);

 const selectStyles = {
    control: (base) => ({
      ...base,
      background: 'rgba(255,255,255,0.05)',
      border: '1px solid rgba(255,255,255,0.1)',
      borderRadius: '999px',
      padding: '0 8px',
      minHeight: window.innerWidth < 768 ? '36px' : '44px', // Mobile par height kam
      backdropFilter: 'blur(20px)',
      boxShadow: 'none',
      '&:hover': { borderColor: 'rgba(255,255,255,0.2)' },
    }),
    valueContainer: (base) => ({ ...base, padding: '0 4px' }),
    placeholder: (base) => ({ 
      ...base, 
      color: 'rgba(255,255,255,0.7)', 
      fontSize: window.innerWidth < 768 ? '8px' : '10px', 
      letterSpacing: '0.1em' 
    }),
    singleValue: (base) => ({ 
      ...base, 
      color: '#fff', 
      fontSize: window.innerWidth < 768 ? '8px' : '10px' 
    }),
    indicatorSeparator: () => ({ display: 'none' }),
    dropdownIndicator: (base) => ({ ...base, padding: '2px' }),
    menu: (base) => ({ ...base, background: '#0a0a0a', zIndex: 9999 }),
  };

  return (
    <main ref={containerRef} className="fixed inset-0 bg-[#070707] overflow-hidden lg:cursor-none">
      
      {/* 3. Better Nav Wrapper */}
      <nav className="fixed top-4 md:top-10 left-0 w-full z-[100] flex flex-wrap justify-center items-center gap-2 md:gap-4 pointer-events-none px-2 md:px-6">
        
        {/* Search - Mobile par chhota */}
        <div className="pointer-events-auto bg-white/5 backdrop-blur-2xl border border-white/10 p-2 md:p-3 px-4 md:px-8 rounded-full">
          <input
            type="text"
            placeholder="SEARCH..."
            onChange={(e) => setSearch(e.target.value)}
            className="bg-transparent text-[9px] md:text-[11px] tracking-[0.1em] outline-none w-16 md:w-48 text-white placeholder:text-white/20"
          />
        </div>

        {/* Category - Mobile par chhota */}
        <div className="pointer-events-auto bg-white/5 backdrop-blur-2xl border border-white/10 p-2 md:p-3 px-3 md:px-6 rounded-full">
          <select
            className="bg-transparent text-[9px] md:text-[11px] tracking-[0.1em] outline-none text-white/70 uppercase"
            onChange={(e) => setFilters({ ...filters, category: e.target.value })}
          >
            <option className="bg-[#111]" value="All">CAT</option>
            <option className="bg-[#111]" value="Sculpture">Sculpture</option>
            {/* ... rest options */}
          </select>
        </div>

        {/* Country */}
        <div className="pointer-events-auto w-[100px] md:w-[200px]">
          <Select
            options={countryOptions}
            onChange={(s) => setFilters({ ...filters, country: s.value })}
            placeholder="COUNTRY"
            styles={selectStyles}
          />
        </div>
      </nav>

      {/* 4. Grid Section: Yahan responsive padding aur gaps */}
      <section ref={gridRef} className="absolute top-0 left-0 flex flex-col gap-10 md:gap-16 p-6 md:p-20 pt-40 md:pt-44 w-max">
        {rowData.rows.map((row, rowIndex) => (
          <div key={rowIndex} className="flex gap-10 md:gap-20" style={{ paddingLeft: rowIndex % 2 === 0 ? '0' : '30px' }}>
            {row.map((profile) => (
              // IMPORTANT: LuxuryCard ko container mein wrap karo jo mobile par width control kare
              <div key={profile.uniqueId} className="w-[280px] md:w-[350px] shrink-0">
                <LuxuryCard
                  profile={profile}
                  ref={el => { if (el) cardRefs.current.push(el) }}
                />
              </div>
            ))}
          </div>
        ))}
      </section>

      {/* Shadow layer adjustment for mobile */}
      <div className="fixed inset-0 pointer-events-none shadow-[inset_0_0_80px_black] md:shadow-[inset_0_0_300px_black] z-50" />
    </main>
  );
};

export default Canvas;