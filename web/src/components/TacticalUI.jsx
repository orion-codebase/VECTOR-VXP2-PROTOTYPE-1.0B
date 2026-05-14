import React from 'react';
import { cn } from '@/lib/utils';

export const TacticalCard = ({ children, title, className, hot = false }) => {
  return (
    <div className={cn(
      "relative bg-vector-panel border border-vector-line rounded-sm overflow-hidden",
      hot && "border-t-2 border-t-vector-red",
      className
    )}>
      {title && (
        <div className="px-4 py-2 border-b border-vector-line flex justify-between items-center bg-white/5">
          <h3 className="text-[10px] uppercase tracking-[0.2em] font-bold text-vector-text-dim font-mono">
            {title}
          </h3>
          <div className="w-1.5 h-1.5 rounded-full bg-vector-red animate-pulse" />
        </div>
      )}
      <div className="p-4">
        {children}
      </div>
    </div>
  );
};

export const StatusKPI = ({ label, value, subtext, trend = "nominal" }) => {
  const isHot = trend === "critical";
  const color = isHot ? "text-vector-red" : "text-vector-gold";
  
  return (
    <TacticalCard className="min-h-[100px]" hot={isHot}>
      <div className="text-[9px] uppercase tracking-widest text-vector-text-low mb-1 font-mono">
        {label}
      </div>
      <div className={cn("text-2xl font-bold tracking-tight", color)}>
        {value}
      </div>
      {subtext && (
        <div className="text-[10px] text-vector-text-low mt-1 font-mono italic">
          {subtext}
        </div>
      )}
    </TacticalCard>
  );
};

export const CommandButton = ({ children, onClick, className, variant = "primary" }) => {
  return (
    <button
      onClick={onClick}
      className={cn(
        "px-6 py-3 font-bold uppercase tracking-[0.15em] text-xs transition-all duration-200 rounded-sm active:scale-95",
        variant === "primary" 
          ? "bg-vector-red text-white hover:bg-vector-red-dim shadow-[0_0_15px_rgba(255,0,0,0.2)] hover:shadow-[0_0_25px_rgba(255,0,0,0.4)]"
          : "bg-transparent border border-vector-line text-vector-text-dim hover:bg-white/5",
        className
      )}
    >
      {children}
    </button>
  );
};
