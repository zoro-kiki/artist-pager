import React, { useRef, useImperativeHandle, forwardRef, useState, memo } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { gsap } from 'gsap';

const springConfig = { stiffness: 80, damping: 20, mass: 1 };

const LuxuryCard = memo(forwardRef(({ profile }, ref) => {
  const cardInternalRef = useRef(null);
  const [isHovered,  setIsHovered]  = useState(false);
  const [isClicked,  setIsClicked]  = useState(false);

  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const rotateX = useSpring(useTransform(mouseY, [-0.5, 0.5], [8, -8]),  springConfig);
  const rotateY = useSpring(useTransform(mouseX, [-0.5, 0.5], [-8,  8]),  springConfig);
  const glareX  = useSpring(useTransform(mouseX, [-0.5, 0.5], ['0%', '100%']), springConfig);
  const glareY  = useSpring(useTransform(mouseY, [-0.5, 0.5], ['0%', '100%']), springConfig);

  useImperativeHandle(ref, () => ({
    getBounds:   () => cardInternalRef.current?.getBoundingClientRect(),
    setOpacity:  (val) => {
      if (!cardInternalRef.current) return;
      gsap.set(cardInternalRef.current, {
        opacity:    val,
        visibility: val < 0.01 ? 'hidden' : 'visible',
      });
    },
  }));

  const handleMouseMove = (e) => {
    if (!cardInternalRef.current) return;
    const rect = cardInternalRef.current.getBoundingClientRect();
    mouseX.set((e.clientX - rect.left) / rect.width  - 0.5);
    mouseY.set((e.clientY - rect.top)  / rect.height - 0.5);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    mouseX.set(0);
    mouseY.set(0);
  };

  return (
    /* perspectiveOrigin keeps the 3-D tilt anchored correctly */
    <div style={{ perspective: 1200, perspectiveOrigin: 'center center' }} className="flex-shrink-0">
      <motion.article
        ref={cardInternalRef}
        style={{ rotateX, rotateY, transformStyle: 'preserve-3d' }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={handleMouseLeave}
        onMouseMove={handleMouseMove}
        onClick={() => setIsClicked(v => !v)}
        className="flex flex-col group cursor-pointer w-[200px] md:w-[240px] select-none will-change-transform"
      >
        {/* IMAGE - Restored to original size/aspect */}
        <div className="relative aspect-[3/4] overflow-hidden bg-[#0a0a0a] border border-white/[0.07] group-hover:border-[#d4af37]/40 transition-colors duration-700">

          {/* Grain */}
          <div className="absolute inset-0 z-10 pointer-events-none opacity-[0.035] mix-blend-overlay bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />

          <motion.img
            src={profile.image}
            alt={profile.name}
            animate={{ scale: isHovered ? 1.08 : 1 }}
            transition={{ duration: 1.4, ease: [0.33, 1, 0.68, 1] }}
            className="w-full h-full object-cover brightness-[0.72] contrast-[1.08] grayscale-[0.15] group-hover:brightness-[0.9] group-hover:grayscale-0 transition-all duration-1000"
            draggable="false"
            loading="lazy"
          />

          {/* Glare */}
          <motion.div
            style={{
              background: `radial-gradient(circle at ${glareX} ${glareY}, rgba(255,255,255,0.1) 0%, transparent 58%)`,
            }}
            className="absolute inset-0 z-20 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500"
          />

          {/* Vignette */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
        </div>

        {/* META - Refined Font and Colors */}
        <div className="mt-4 px-1">
          <h3 className="text-[13px] font-serif italic text-[#f7f3f0] group-hover:text-[#d4af37] transition-colors duration-500 tracking-[0.06em] leading-none">
            {profile.name}
          </h3>

          {/* Animated divider line */}
          <div className="relative w-full h-[1px] bg-white/[0.04] my-3 overflow-hidden">
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: isClicked || isHovered ? '0%' : '-100%' }}
              transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
              className="absolute inset-0 bg-[#d4af37] z-10"
            />
            <div className="absolute inset-0 -translate-x-full group-hover:translate-x-0 transition-transform duration-1000 ease-out bg-white/15" />
          </div>

          <div className="flex justify-between items-center mb-2">
            <p className="text-[8px] uppercase tracking-[0.28em] text-white/35 font-medium group-hover:text-white/50 transition-colors">
              {profile.location}
            </p>
            <p className="text-[8px] uppercase tracking-[0.15em] text-[#d4af37]/60 italic font-light">
              {profile.category}
            </p>
          </div>

          <div className="flex items-center gap-2">
            {/* Pulsing dot */}
            <span className="relative flex items-center justify-center w-2 h-2">
              <span className="absolute w-1 h-1 rounded-full bg-[#d4af37]" />
              <motion.span
                animate={{ scale: [1, 2.2, 1], opacity: [0.5, 0, 0.5] }}
                transition={{ repeat: Infinity, duration: 2.2, ease: 'easeInOut' }}
                className="absolute w-1 h-1 rounded-full bg-[#d4af37]"
              />
            </span>
            <p className="text-[8px] uppercase tracking-[0.22em] text-[#d4af37] font-bold">
              {profile.status}
            </p>
          </div>
        </div>
      </motion.article>
    </div>
  );
}));

LuxuryCard.displayName = 'LuxuryCard';
export default LuxuryCard;