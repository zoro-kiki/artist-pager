import React, { useRef, useImperativeHandle, forwardRef } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { gsap } from "gsap";

const LuxuryCard = forwardRef(({ profile, index }, ref) => {
  const cardInternalRef = useRef(null);
  const glowRef = useRef(null);
  const overlayRef = useRef(null);

  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotateX = useSpring(useTransform(y, [-0.5, 0.5], [7, -7]), { stiffness: 100, damping: 20 });
  const rotateY = useSpring(useTransform(x, [-0.5, 0.5], [-7, 7]), { stiffness: 100, damping: 20 });

  useImperativeHandle(ref, () => ({
    getBounds: () => cardInternalRef.current?.getBoundingClientRect(),
    setGlow: gsap.quickSetter(glowRef.current, "opacity"),
    setBrightness: gsap.quickSetter(cardInternalRef.current, "filter", (v) => `brightness(${1 + v})`),
    setOpacity: gsap.quickSetter(cardInternalRef.current, "opacity")
  }));

  return (
    <motion.div
      ref={cardInternalRef}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, delay: index * 0.02 }}
      onMouseMove={(e) => {
        const rect = cardInternalRef.current.getBoundingClientRect();
        x.set((e.clientX - rect.left) / rect.width - 0.5);
        y.set((e.clientY - rect.top) / rect.height - 0.5);
      }}
      onMouseLeave={() => { x.set(0); y.set(0); }}
      style={{ rotateX, rotateY, perspective: 1000, transformStyle: "preserve-3d" }}
      className="flex flex-col group flex-shrink-0 cursor-pointer"
    >
      <div className="relative aspect-[4/5] w-[180px] md:w-[230px] overflow-hidden bg-[#1a1a1a] border border-white/5 shadow-2xl transition-all duration-500 group-hover:border-[#d4af37]/50">
        <motion.img
          src={profile.image}
          className="w-full h-full object-cover transition-transform duration-1000 ease-out group-hover:scale-110"
          alt={profile.name}
          draggable="false"
        />
        {/* Luxury Glow Overlay */}
        <div ref={glowRef} className="absolute inset-0 bg-gradient-to-tr from-[#d4af37]/20 to-transparent opacity-0 pointer-events-none" />
        
        {/* Status Badge */}
        {/* {profile.status === "Artwork for Sale" && (
          <div className="absolute bottom-0 right-0 bg-[#d4af37] text-black text-[8px] font-bold px-3 py-1 uppercase tracking-[0.2em]">
            On Sale
          </div>
        )} */}
      </div>

      <div className="mt-4 px-1">
        <h3 className="text-[14px] font-serif italic text-[#f7f3f0] group-hover:text-[#d4af37] transition-colors duration-500 tracking-wide">
          {profile.name}
        </h3>
        <div className="flex justify-between items-center mt-1 border-t border-white/5 pt-1">
          <p className="text-[9px] uppercase tracking-[0.3em] text-white/30">{profile.location}</p>
          <span className="text-[7px] text-[#d4af37]/50 font-mono">#{index + 1}</span>
        </div>
      </div>
    </motion.div>
  );
});

export default LuxuryCard;