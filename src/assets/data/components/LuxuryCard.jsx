import React, { useRef, useImperativeHandle, forwardRef, useState, memo } from "react";
import { motion, useMotionValue, useSpring, useTransform, AnimatePresence } from "framer-motion";
import { gsap } from "gsap";

// We use React.memo to prevent unnecessary re-renders during the GSAP infinite scroll 
const LuxuryCard = memo(forwardRef(({ profile }, ref) => {
  const cardInternalRef = useRef(null);
  const [isHovered, setIsHovered] = useState(false);
  const [isClicked, setIsClicked] = useState(false);
  
  // High-fidelity spring settings for a "heavy", premium feel
  const springConfig = { stiffness: 80, damping: 20, mass: 1 };
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  // Optical tilt effect
  const rotateX = useSpring(useTransform(mouseY, [-0.5, 0.5], [10, -10]), springConfig);
  const rotateY = useSpring(useTransform(mouseX, [-0.5, 0.5], [-10, 10]), springConfig);
  
  // Interactive reflection/glare following the mouse
  const glareX = useSpring(useTransform(mouseX, [-0.5, 0.5], ["0%", "100%"]), springConfig);
  const glareY = useSpring(useTransform(mouseY, [-0.5, 0.5], ["0%", "100%"]), springConfig);

  useImperativeHandle(ref, () => ({
    getBounds: () => cardInternalRef.current?.getBoundingClientRect(),
    setOpacity: (val) => {
      if (cardInternalRef.current) {
        gsap.set(cardInternalRef.current, { 
            opacity: val,
            visibility: val < 0.01 ? "hidden" : "visible"
        });
      }
    }
  }));

  const handleMouseMove = (e) => {
    if (!cardInternalRef.current) return;
    const rect = cardInternalRef.current.getBoundingClientRect();
    // Normalize coordinates to -0.5 to 0.5
    mouseX.set((e.clientX - rect.left) / rect.width - 0.5);
    mouseY.set((e.clientY - rect.top) / rect.height - 0.5);
  };

  return (
    <motion.article
      ref={cardInternalRef}
      style={{ rotateX, rotateY, perspective: 1200 }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false);
        mouseX.set(0);
        mouseY.set(0);
      }}
      onClick={() => setIsClicked(!isClicked)}
      onMouseMove={handleMouseMove}
      className="flex flex-col group flex-shrink-0 cursor-pointer w-[200px] md:w-[240px] select-none will-change-transform"
    >
      {/* IMAGE CONTAINER */}
      <div className="relative aspect-[3/4] overflow-hidden bg-[#0a0a0a] border border-white/[0.07] transition-colors duration-700 group-hover:border-[#d4af37]/50">
        
        {/* Sublte Grain Overlay for texture */}
        <div className="absolute inset-0 z-10 pointer-events-none opacity-[0.03] mix-blend-overlay bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />

        <motion.img
          src={profile.image}
          alt={profile.name}
          animate={{ scale: isHovered ? 1.1 : 1 }}
          transition={{ duration: 1.2, ease: [0.33, 1, 0.68, 1] }}
          className="w-full h-full object-cover brightness-[0.7] contrast-[1.1] grayscale-[0.2] group-hover:brightness-[0.9] group-hover:grayscale-0 transition-all duration-1000"
          draggable="false"
          loading="lazy"
        />

        {/* Dynamic Glare Reflection Overlay */}
        <motion.div 
          style={{ 
            background: `radial-gradient(circle at ${glareX} ${glareY}, rgba(255,255,255,0.12) 0%, transparent 60%)` 
          }}
          className="absolute inset-0 z-20 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500"
        />

        {/* Bottom Vignette */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-90" />
      </div>

      {/* METADATA SECTION */}
      <div className="mt-5 px-1 relative">
        <div className="flex items-end justify-between">
            <h3 className="text-[12px] font-serif italic text-[#f7f3f0] group-hover:text-[#d4af37] transition-colors duration-500 tracking-[0.05em] uppercase">
            {profile.name}
            </h3>
            
        </div>
        
        {/* Refined Animated Line */}
        <div className="relative w-full h-[1px] bg-white/5 my-3 overflow-hidden">
             <motion.div 
                initial={{ x: "-100%" }}
                animate={{ x: isClicked ? "0%" : "-100%" }}
                transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                className="absolute inset-0 bg-[#d4af37] z-10"
             />
             <div className="absolute inset-0 translate-x-[-100%] group-hover:translate-x-0 transition-transform duration-1000 ease-in-out bg-white/20" />
        </div>

        <div className="flex flex-col gap-1.5">
          <div className="flex justify-between items-center">
            <div className="flex flex-col">
                <p className="text-[7px] uppercase tracking-[0.3em] text-white/40 font-medium">
                {profile.location}
                </p>
            </div>
            <p className="text-[7px] uppercase tracking-[0.2em] text-white/30 group-hover:text-[#d4af37]/80 transition-colors">
              {profile.category}
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            {/* Status dot with pulsing animation */}
            <div className="relative flex items-center justify-center">
                <div className="w-1 h-1 rounded-full bg-[#d4af37]" />
                <motion.div 
                    animate={{ scale: [1, 2, 1], opacity: [0.5, 0, 0.5] }}
                    transition={{ repeat: Infinity, duration: 2 }}
                    className="absolute w-1 h-1 rounded-full bg-[#d4af37]" 
                />
            </div>
            <p className="text-[7px] uppercase tracking-[0.2em] text-[#d4af37] font-bold">
               {profile.status}
            </p>
          </div>
        </div>
      </div>
    </motion.article>
  );
}));

LuxuryCard.displayName = "LuxuryCard";
export default LuxuryCard;