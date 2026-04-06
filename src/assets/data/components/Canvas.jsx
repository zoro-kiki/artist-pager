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

const LERP_FACTOR = 0.09; // 🔥 smoother

const Canvas = () => {
  const containerRef = useRef(null);
  const gridRef = useRef(null);
  const cardRefs = useRef(new Map());
  const proxy = useRef(null);
  const tickerAdded = useRef(false);
  const smoothPos = useRef({ x: 0, y: 0 });

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [tempFilters, setTempFilters] = useState(DEFAULT_FILTERS);
  const [isDragging, setIsDragging] = useState(false);

  const countries = useMemo(() => getNames().sort(), []);

  const activeFilterCount = useMemo(() =>
    Number(filters.country !== 'All') + 
    Number(filters.category !== 'All') + 
    Number(filters.medium !== 'All') + 
    Number(filters.style !== 'All'),
  [filters]);

  const rowData = useMemo(() => {
    const term = search.toLowerCase();
    const filtered = profilesData.filter(p => {
      const matchSearch =
        p.name.toLowerCase().includes(term) ||
        p.location.toLowerCase().includes(term) ||
        p.category.toLowerCase().includes(term);

      const matchCountry = filters.country === 'All' || p.country.trim() === filters.country;
      const matchCategory = filters.category === 'All' || p.category === filters.category;
      const matchMedium = filters.medium === 'All' || p.medium === filters.medium;
      const matchStyle = filters.style === 'All' || p.style === filters.style;

      return matchSearch && matchCountry && matchCategory && matchMedium && matchStyle;
    });

    if (!filtered.length) return { rows: [], totalCount: 0 };

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
      totalCount: infiniteRows.reduce((acc, r) => acc + r.length, 0)
    };
  }, [search, filters]);

  const openSidebar = useCallback(() => {
    setTempFilters(filters);
    setIsSidebarOpen(true);
  }, [filters]);

  const closeSidebar = useCallback(() => setIsSidebarOpen(false), []);

  const applyFilters = useCallback(() => {
    setFilters(tempFilters);
    closeSidebar();
  }, [tempFilters, closeSidebar]);

  const clearTemp = useCallback(() => setTempFilters(DEFAULT_FILTERS), []);

  useEffect(() => {
    if (!rowData.totalCount) return;

    const grid = gridRef.current;
    if (!grid) return;

    if (!proxy.current) proxy.current = document.createElement('div');

    let loopX = grid.offsetWidth / 3;
    let loopY = grid.offsetHeight / 3;

    const setGridX = gsap.quickSetter(grid, 'x', 'px');
    const setGridY = gsap.quickSetter(grid, 'y', 'px');

    gsap.set(grid, { force3D: true }); // 🔥 GPU boost

    const updateCardOpacity = (gx, gy) => {
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const pad = 90;

      cardRefs.current.forEach((card) => {
        if (!card?.getBounds) return;

        const b = card.getBounds();
        if (!b) return;

        const cX = b.left + b.width / 2;
        const cY = b.top + b.height / 2;

        const op =
          gsap.utils.mapRange(0, pad, 0, 1, gsap.utils.clamp(0, pad, cX)) *
          gsap.utils.mapRange(vw - pad, vw, 1, 0, gsap.utils.clamp(vw - pad, vw, cX)) *
          gsap.utils.mapRange(0, pad, 0, 1, gsap.utils.clamp(0, pad, cY)) *
          gsap.utils.mapRange(vh - pad, vh, 1, 0, gsap.utils.clamp(vh - pad, vh, cY));

        card.setOpacity(op);
      });
    };

    const tick = () => {
      const raw = proxy.current;
      const rawX = gsap.getProperty(raw, 'x');
      const rawY = gsap.getProperty(raw, 'y');

      smoothPos.current.x += (rawX - smoothPos.current.x) * LERP_FACTOR;
      smoothPos.current.y += (rawY - smoothPos.current.y) * LERP_FACTOR;

      const wrappedX = gsap.utils.wrap(-loopX, 0, smoothPos.current.x);
      const wrappedY = gsap.utils.wrap(-loopY, 0, smoothPos.current.y);

      setGridX(wrappedX);
      setGridY(wrappedY);

      updateCardOpacity(wrappedX, wrappedY); // ✅ FIXED
    };

    if (!tickerAdded.current) {
      gsap.ticker.add(tick);
      tickerAdded.current = true;
    }

    gsap.set(proxy.current, { x: -loopX / 2, y: -loopY / 2 });
    smoothPos.current = { x: -loopX / 2, y: -loopY / 2 };

    const dragInstance = Draggable.create(proxy.current, {
      type: 'x,y',
      trigger: containerRef.current, // ✅ FIXED
      inertia: true,
      throwResistance: 1200, // smoother
      onDragStart: () => setIsDragging(true),
      onDragEnd: () => setIsDragging(false),
      allowNativeTouchScrolling: true,
      dragClickables: false,
      clickableTest: (el) =>
        el.tagName === 'INPUT' ||
        el.tagName === 'SELECT' ||
        !!el.closest('button'),
    });

    return () => {
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
      <section
        ref={gridRef}
        className="absolute top-0 left-0 flex flex-col gap-8 md:gap-16 p-10 md:p-20 pt-32 md:pt-64 w-max will-change-transform"
      >
        {rowData.rows.map((row, rowIndex) => (
          <div
            key={rowIndex}
            className="flex gap-8 md:gap-16"
            style={{ paddingLeft: rowIndex % 2 !== 0 ? '60px' : '0' }}
          >
            {row.map((profile, i) => (
              <LuxuryCard
                key={profile.uniqueId}
                profile={profile}
                ref={(el) => {
                  if (el) cardRefs.current.set(`${rowIndex}-${i}`, el);
                  else cardRefs.current.delete(`${rowIndex}-${i}`);
                }}
              />
            ))}
          </div>
        ))}
      </section>
    </main>
  );
};

export default Canvas;