import React, { useEffect } from 'react';
import Canvas from './assets/data/components/Canvas';

function App() {

  useEffect(() => {
    const handleKeyDown = (e) => {
      const scrollAmount = 120;

      if (e.key === "ArrowDown") {
        e.preventDefault();
        window.scrollBy({ top: scrollAmount, behavior: "smooth" });
      }

      if (e.key === "ArrowUp") {
        e.preventDefault();
        window.scrollBy({ top: -scrollAmount, behavior: "smooth" });
      }

      if (e.key === "ArrowRight") {
        e.preventDefault();
        window.scrollBy({ left: scrollAmount, behavior: "smooth" });
      }

      if (e.key === "ArrowLeft") {
        e.preventDefault();
        window.scrollBy({ left: -scrollAmount, behavior: "smooth" });
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  return (
    <div className="font-sans text-platinum-gray bg-deep-navy">
      <Canvas />
    </div>
  );
}

export default App;