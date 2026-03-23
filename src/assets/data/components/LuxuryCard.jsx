import React, { useRef, useImperativeHandle, forwardRef } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { gsap } from "gsap";

const LuxuryCard = forwardRef(({ profile, index }, ref) => {
  const cardInternalRef = useRef(null);
  
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const rotateX = useSpring(useTransform(mouseY, [-0.5, 0.5], [8, -8]), { stiffness: 100, damping: 25 });
  const rotateY = useSpring(useTransform(mouseX, [-0.5, 0.5], [-8, 8]), { stiffness: 100, damping: 25 });

  useImperativeHandle(ref, () => ({
    getBounds: () => cardInternalRef.current?.getBoundingClientRect(),
    setOpacity: (val) => {
      if (cardInternalRef.current) gsap.set(cardInternalRef.current, { opacity: val });
    }
  }));

  return (
    <motion.article
      ref={cardInternalRef}
      style={{ rotateX, rotateY, perspective: 1000 }}
      onMouseMove={(e) => {
        const rect = cardInternalRef.current.getBoundingClientRect();
        mouseX.set((e.clientX - rect.left) / rect.width - 0.5);
        mouseY.set((e.clientY - rect.top) / rect.height - 0.5);
      }}
      onMouseLeave={() => { mouseX.set(0); mouseY.set(0); }}
      className="flex flex-col group flex-shrink-0 cursor-pointer w-[200px] md:w-[240px]"
    >
      {/* THE IMAGE FRAME */}
      <div className="relative aspect-[3/4] overflow-hidden bg-[#111] border border-white/5 transition-all duration-700 group-hover:border-[#d4af37]/40 shadow-2xl">
        <motion.img
          src={profile.image}
          alt={profile.name}
          className="w-full h-full object-cover grayscale-[0.3] group-hover:grayscale-0 transition-all duration-1000 group-hover:scale-110"
          draggable="false"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-40 group-hover:opacity-100 transition-opacity duration-500" />
      </div>

      {/* THE INFO SECTION */}
      <div className="mt-4 px-1">
        <h3 className="text-[12px] font-serif italic text-[#f7f3f0] group-hover:text-[#d4af37] transition-colors duration-500 tracking-wide uppercase">
          {profile.name}
        </h3>
        
        <div className="w-full h-[1px] bg-gradient-to-r from-white/20 via-white/5 to-transparent my-2" />

        <div className="flex flex-col gap-1">
          <p className="text-[7px] uppercase tracking-[0.3em] text-white/40">
            {profile.location}
          </p>
          <div className="flex items-center gap-1.5 mt-1">
            <div className="w-1 h-1 rounded-full bg-[#d4af37] animate-pulse shadow-[0_0_5px_#d4af37]" />
            <p className="text-[7px] uppercase tracking-[0.2em] text-[#d4af37] font-bold">
               {profile.status}
            </p>
          </div>
        </div>
      </div>
    </motion.article>
  );
});

LuxuryCard.displayName = "LuxuryCard";
export default LuxuryCard;