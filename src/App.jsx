// src/App.jsx
import React from 'react';
import Canvas from './assets/data/components/Canvas';


function App() {
  return (
    <div className="font-sans text-platinum-gray bg-deep-navy"> {/* Apply base styles from Tailwind.config.js */}
     <Canvas></Canvas>
    </div>
  );
}

export default App;
