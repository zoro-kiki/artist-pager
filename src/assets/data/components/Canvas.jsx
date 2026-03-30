import React, { useEffect, useRef, useState, useMemo } from 'react';
import { getNames } from 'country-list';
import { gsap } from 'gsap';
import { Draggable } from 'gsap/Draggable';
import Lenis from '@studio-freight/lenis'; 
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

    const countries = useMemo(() => getNames().sort(), []);

    // 1. LENIS + SUBTLE STAGGERED ENTRANCE
    useEffect(() => {
        const lenis = new Lenis({
            duration: 1.2,
            easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
            smoothWheel: true
        });

        function raf(time) {
            lenis.raf(time);
            requestAnimationFrame(raf);
        }
        requestAnimationFrame(raf);

        const timer = setTimeout(() => {
            const validCards = cardRefs.current.filter(Boolean);
            if (validCards.length > 0) {
                // REDUCED: blur (2px) and movement (15px) for a subtler feel
                gsap.fromTo(validCards, 
                    { opacity: 0, y: 15, filter: "blur(2px)" }, 
                    { 
                        opacity: 1, 
                        y: 0, 
                        filter: "blur(0px)", 
                        duration: 1.8, 
                        stagger: 0.02, 
                        ease: "power3.out" 
                    }
                );
            }
        }, 100);

        return () => {
            lenis.destroy();
            clearTimeout(timer);
        };
    }, [search, filters]); 

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
        return { rows: infiniteRows, totalCount: infiniteRows.reduce((acc, row) => acc + row.length, 0) };
    }, [search, filters]);

    useEffect(() => {
        if (rowData.totalCount === 0) return;
        const grid = gridRef.current;
        
        const getLoopPoints = () => ({ loopX: grid.offsetWidth / 3, loopY: grid.offsetHeight / 3 });
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
            // REDUCED: Padding from 240 to 100 so cards stay visible longer
            const pad = 100; 
            const validCards = cardRefs.current.filter(Boolean);
            validCards.forEach((card) => {
                if (!card.getBounds) return;
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
        <main ref={containerRef} className="fixed inset-0 bg-[#070707] overflow-hidden cursor-none touch-pan-x touch-pan-y">
            
            <div className="fixed inset-0 pointer-events-none z-[200] opacity-[0.04] mix-blend-overlay bg-[url('https://grainy-gradients.vercel.app/noise.svg')]"></div>

            <nav className="fixed bottom-6 md:bottom-8 left-1/2 -translate-x-1/2 z-[100] flex items-end justify-center w-full px-4 pointer-events-none">
                <div className="pointer-events-auto bg-[#2c2c2c]/90 backdrop-blur-md h-[58px] md:h-[64px] rounded-full flex items-center px-3 md:px-4 gap-2 md:gap-4 shadow-2xl border border-white/5 max-w-full overflow-x-auto no-scrollbar">
                    
                    <div className="w-8 h-8 md:w-10 md:h-10 bg-[#444] flex items-center justify-center rounded-full overflow-hidden shrink-0">
                        <img className="w-full h-full object-cover" src="https://zigguratss.com/assets/upload/b3756ef6fb55408a83bef1ae70acc759.png" alt="logo" />
                    </div>

                    <div className="relative group shrink-0">
                        <input 
                            type="text" 
                            placeholder="Name of Artist"
                            onChange={(e) => setSearch(e.target.value)}
                            className="bg-transparent text-white text-[10px] md:text-[14px] font-medium underline underline-offset-4 decoration-white/30 outline-none w-20 md:w-32 placeholder:text-gray-400 focus:text-[#d4af37] transition-all"
                        />
                    </div>

                    <div className="bg-[#3a3a3a] border border-white/10 rounded-[10px] md:rounded-[12px] px-3 md:px-4 py-1.5 md:py-2 flex items-center shrink-0">
                        <select 
                            className="bg-transparent text-white text-[12px] md:text-[14px] outline-none cursor-pointer appearance-none hover:text-[#d4af37] transition-colors"
                            onChange={(e) => setFilters({ ...filters, category: e.target.value })}
                        >
                            <option className="bg-[#222]" value="All">Category</option>
                            <option className="bg-[#222]" value="Sculpture">Sculpture</option>
                            <option className="bg-[#222]" value="Painting">Painting</option>
                            <option className="bg-[#222]" value="Digital">Digital Art</option>
                        </select>
                    </div>

                    <div className="bg-[#3a3a3a] border border-white/10 rounded-[10px] md:rounded-[12px] px-3 md:px-4 py-1.5 md:py-2 flex items-center w-[90px] md:w-[110px] shrink-0">
                        <select 
                            className="bg-transparent text-white text-[12px] md:text-[14px] outline-none cursor-pointer appearance-none w-full truncate hover:text-[#d4af37] transition-colors"
                            onChange={(e) => setFilters({ ...filters, country: e.target.value })}
                            value={filters.country}
                        >
                            <option className="bg-[#222]" value="All">Country</option>
                            {countries.map((name) => (
                                <option key={name} className="bg-[#222]" value={name}>{name}</option>
                            ))}
                        </select>
                    </div>

                    <div className="hidden sm:flex bg-[#3a3a3a] border border-white/10 rounded-[10px] md:rounded-[12px] px-3 md:px-4 py-1.5 md:py-2 items-center shrink-0">
                       <select
                        className="bg-transparent text-white text-[12px] md:text-[14px] outline-none cursor-pointer appearance-none hover:text-[#d4af37] transition-colors"
                        onChange={(e) => setFilters({ ...filters, special: e.target.value })}
                    >
                        <option className="bg-[#111]" value="All">Speciality</option>
                        <option className="bg-[#111]" value="For Sale">For Sale</option>
                        <option className="bg-[#111]" value="Private">Private</option>
                    </select>
                    </div>
                </div>
            </nav>

            <div ref={cursorRef} className="hidden md:flex custom-cursor fixed top-0 left-0 w-12 h-12 border border-[#d4af37]/40 rounded-full z-[101] pointer-events-none items-center justify-center -translate-x-1/2 -translate-y-1/2">
                <div className="w-1.5 h-1.5 bg-[#d4af37] rounded-full shadow-[0_0_12px_#d4af37]" />
            </div>

            <section ref={gridRef} className="absolute top-0 left-0 flex flex-col gap-6 md:gap-10 p-6 md:p-20 pt-32 md:pt-44 w-max">
                {rowData.rows.map((row, rowIndex) => (
                    <div key={rowIndex} className="flex gap-4 sm:gap-6 md:gap-10" style={{ paddingLeft: rowIndex % 2 === 0 ? '0' : window.innerWidth < 640 ? '20px' : '50px' }}>
                        {row.map((profile, i) => (
                            <LuxuryCard
                                key={profile.uniqueId}
                                profile={profile}
                                ref={el => { cardRefs.current[rowIndex * 100 + i] = el }}
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