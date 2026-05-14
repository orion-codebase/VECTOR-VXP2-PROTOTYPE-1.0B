'use client';

import React from 'react';
import { cn } from '@/lib/utils';

export const EngineSchematic = ({ isValid, message }) => {
  // Determine if the HPC section is "failing"
  const isHPCAnomaly = !isValid && message?.includes("P30/T30");

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center bg-black/40 rounded-sm border border-vector-line overflow-hidden p-4">
      {/* HUD Background Decoration */}
      <div className="absolute inset-0 opacity-10 pointer-events-none">
        <div className="absolute top-4 left-4 w-12 h-12 border-t border-l border-white" />
        <div className="absolute bottom-4 right-4 w-12 h-12 border-b border-r border-white" />
      </div>

      <svg viewBox="0 0 400 160" className="w-full h-auto drop-shadow-[0_0_15px_rgba(255,255,255,0.1)]">
        {/* --- Engine Outer Casing --- */}
        <path d="M40,40 L360,40 L360,120 L40,120 Z" fill="none" stroke="#2A2A2A" strokeWidth="1" />
        
        {/* --- Fan Section (Front) --- */}
        <g id="fan" className="animate-pulse">
          <ellipse cx="60" cy="80" rx="15" ry="35" fill="none" stroke="#4A4A4A" strokeWidth="2" />
          <line x1="60" y1="45" x2="60" y2="115" stroke="#4A4A4A" strokeWidth="1" />
        </g>

        {/* --- Low Pressure Compressor (LPC) --- */}
        <path d="M80,60 L140,55 L140,105 L80,100 Z" fill="rgba(255,255,255,0.02)" stroke="#3A3A3A" strokeWidth="1.5" />
        <text x="90" y="82" fontSize="6" fill="#7A7A7A" className="font-mono">LPC</text>

        {/* --- High Pressure Compressor (HPC) --- */}
        <g id="hpc">
          <path 
            d="M140,55 L210,50 L210,110 L140,105 Z" 
            fill={isHPCAnomaly ? "rgba(255,0,0,0.15)" : "rgba(255,255,255,0.03)"} 
            stroke={isHPCAnomaly ? "#FF0000" : "#5A5A5A"} 
            strokeWidth={isHPCAnomaly ? "2" : "1.5"}
            className={cn("transition-colors duration-300", isHPCAnomaly && "animate-pulse")}
          />
          <text x="160" y="82" fontSize="6" fill={isHPCAnomaly ? "#FF0000" : "#7A7A7A"} className="font-mono font-bold">HPC</text>
          
          {/* P30/T30 Sensor Node */}
          <circle cx="210" cy="80" r="3" fill={isHPCAnomaly ? "#FF0000" : "#D4A017"} className={isHPCAnomaly ? "animate-ping" : ""} />
          <text x="215" y="75" fontSize="5" fill="#D4A017" className="font-mono">P30/T30</text>
        </g>

        {/* --- Combustor --- */}
        <path d="M210,65 L260,65 L260,95 L210,95 Z" fill="rgba(255,100,0,0.05)" stroke="#6A3A1A" strokeWidth="1" />
        <text x="220" y="82" fontSize="6" fill="#6A3A1A" className="font-mono italic">COMB</text>

        {/* --- Turbines (HPT/LPT) --- */}
        <path d="M260,50 L340,55 L340,105 L260,110 Z" fill="rgba(255,255,255,0.02)" stroke="#3A3A3A" strokeWidth="1.5" />
        <text x="285" y="82" fontSize="6" fill="#7A7A7A" className="font-mono">TURBINE</text>

        {/* --- Exhaust --- */}
        <path d="M340,60 L380,50 L380,110 L340,100 Z" fill="none" stroke="#2A2A2A" strokeWidth="1" />
      </svg>

      <div className="mt-4 w-full flex justify-between items-end border-t border-vector-line/50 pt-3">
        <div className="space-y-1">
          <div className="text-[8px] text-vector-text-low font-mono uppercase tracking-widest">Active Section</div>
          <div className={cn("text-[10px] font-bold font-mono", isHPCAnomaly ? "text-vector-red" : "text-white")}>
            {isHPCAnomaly ? "⚠ HIGH PRESSURE COMPRESSOR OUTLET" : "ALL SECTIONS NOMINAL"}
          </div>
        </div>
        <div className="text-right">
          <div className="text-[8px] text-vector-text-low font-mono uppercase tracking-widest">Inference State</div>
          <div className="text-[10px] text-green-500 font-bold font-mono">STABLE</div>
        </div>
      </div>
    </div>
  );
};
