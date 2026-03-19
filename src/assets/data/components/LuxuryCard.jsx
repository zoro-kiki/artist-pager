import React, { useRef, useImperativeHandle, forwardRef } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { gsap } from "gsap";

const LuxuryCard = forwardRef(({ profile, index }, ref) => {
  const cardInternalRef = useRef(null);
  const glowRef = useRef(null);

  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotateX = useSpring(useTransform(y, [-0.5, 0.5], [10, -10]), { stiffness: 120, damping: 25 });
  const rotateY = useSpring(useTransform(x, [-0.5, 0.5], [-10, 10]), { stiffness: 120, damping: 25 });

  useImperativeHandle(ref, () => ({
    getBounds: () => cardInternalRef.current?.getBoundingClientRect(),
    setGlow: (val) => {
      if (glowRef.current) gsap.set(glowRef.current, { opacity: val });
    },
    setBrightness: (val) => {
      if (cardInternalRef.current) gsap.set(cardInternalRef.current, { filter: `brightness(${1 + val})` });
    },
    setOpacity: (val) => {
      if (cardInternalRef.current) gsap.set(cardInternalRef.current, { opacity: val });
    }
  }));

  return (
    <motion.div
      ref={cardInternalRef}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 1, delay: index * 0.05, ease: [0.19, 1, 0.22, 1] }}
      onMouseMove={(e) => {
        const rect = cardInternalRef.current.getBoundingClientRect();
        x.set((e.clientX - rect.left) / rect.width - 0.5);
        y.set((e.clientY - rect.top) / rect.height - 0.5);
      }}
      onMouseLeave={() => { x.set(0); y.set(0); }}
      style={{ rotateX, rotateY, perspective: 1200, transformStyle: "preserve-3d" }}
      className="flex flex-col group flex-shrink-0 cursor-pointer"
    >
      {/* IMAGE CONTAINER */}
      <div className="relative aspect-[4/5] w-[200px] md:w-[260px] overflow-hidden bg-[#121212] border border-white/5 shadow-2xl transition-all duration-700 group-hover:border-[#d4af37]/40">
        <motion.img
          src={profile.image}
          className="w-full h-full object-cover transition-transform duration-1000 ease-out group-hover:scale-110 opacity-80 group-hover:opacity-100"
          alt={profile.name}
          draggable="false"
        />
        <div ref={glowRef} className="absolute inset-0 bg-gradient-to-tr from-[#d4af37]/30 via-transparent to-transparent opacity-0 pointer-events-none transition-opacity duration-300" />
      </div>

      {/* TEXT CONTENT SECTION */}
      <div className="mt-5 px-1">
        {/* Name: Elegant Serif Style */}
        <h3 className="text-[14px] font-serif italic text-[#f7f3f0] group-hover:text-[#d4af37] transition-colors duration-500 tracking-[0.05em]">
          {profile.name}
        </h3>
        
        {/* Divider Line */}
        <div className="w-full h-[1px] bg-gradient-to-r from-white/20 via-white/5 to-transparent mt-2 mb-2" />

        {/* Info Row: Location | Sale Count | ID */}
        <div className="flex justify-between items-center">
          {/* Location */}
          <p className="text-[8px] uppercase tracking-[0.3em] text-white/30 group-hover:text-white/60 transition-colors">
            {profile.country || "GLOBAL"}
          </p>

          {/* NEW SECTION: Number of Artworks for Sale */}
          <div className="flex items-center gap-1.5">
            <span className="w-1 h-1 rounded-full bg-[#d4af37] animate-pulse" />
            <p className="text-[8px] uppercase tracking-[0.2em] text-[#d4af37]/80 font-medium">
               {profile.status} WORKS FOR SALE
            </p>
          </div>
          

          {/* Unique ID */}
          <span className="text-[7px] text-white/20 font-mono group-hover:text-[#d4af37]/40 transition-colors">
            #{profile.id || index + 1}
          </span>
        </div>
      </div>
    </motion.div>
  );
});

LuxuryCard.displayName = "LuxuryCard";
export default LuxuryCard;