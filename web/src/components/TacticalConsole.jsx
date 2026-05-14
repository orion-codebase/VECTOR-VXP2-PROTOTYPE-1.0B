'use client';

import React from 'react';
import { Upload, Settings, Play, ShieldAlert, Square, Pause, RotateCcw } from 'lucide-react';
import { CommandButton, TacticalCard } from './TacticalUI';
import { cn } from '@/lib/utils';

export const TacticalConsole = ({ 
  onUpload, 
  simStatus, 
  onToggleSim, 
  onReset,
  params, 
  setParams,
  selectedUnit,
  units,
  setSelectedUnit
}) => {
  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (file) onUpload(file);
  };

  const isRunning = simStatus === 'RUNNING';
  const isPaused = simStatus === 'PAUSED';
  const isStandby = simStatus === 'STANDBY';

  return (
    <div className="grid grid-cols-12 gap-4 w-full h-[110px]">
      {/* Upload Column */}
      <div className="col-span-2">
        <div className="relative group h-full cursor-pointer">
          <TacticalCard className="h-full flex flex-col items-center justify-center border-dashed border-vector-text-low/30 group-hover:border-vector-red transition-colors">
            <Upload className="w-5 h-5 text-vector-text-low group-hover:text-vector-red mb-1" />
            <span className="text-[8px] font-mono tracking-widest text-vector-text-dim group-hover:text-white uppercase font-bold text-center px-2">
              {units.length > 0 ? `LOD: ${units.length} UNT` : 'Load CSV'}
            </span>
          </TacticalCard>
          <input type="file" onChange={handleFileChange} className="absolute inset-0 opacity-0 cursor-pointer" />
        </div>
      </div>

      {/* Control Console (Selector + Slider) */}
      <div className="col-span-5 h-full">
        <TacticalCard className="h-full flex flex-col justify-between p-3">
          <div className="flex items-center gap-2">
            <Settings className="w-3 h-3 text-vector-red" />
            <select 
              value={params.activeParam}
              onChange={(e) => setParams({...params, activeParam: e.target.value})}
              className="bg-black border border-vector-line text-vector-text-dim text-[10px] font-mono p-1 rounded-sm focus:outline-none focus:border-vector-red flex-1"
            >
              <option>Playback Speed</option>
              <option>Buffer Size</option>
              <option>Noise Level</option>
            </select>
            {units.length > 0 && (
              <select 
                value={selectedUnit}
                onChange={(e) => setSelectedUnit(parseInt(e.target.value))}
                className="bg-black border border-vector-line text-vector-red text-[10px] font-mono p-1 rounded-sm focus:outline-none w-20"
              >
                {units.map(u => <option key={u} value={u}>ID:{u}</option>)}
              </select>
            )}
          </div>

          <div className="flex flex-col gap-1 mt-1">
            <div className="flex justify-between items-end">
              <span className="text-[8px] text-vector-text-low font-mono uppercase tracking-wider">
                {params.activeParam}
              </span>
              <span className="text-[10px] font-bold text-vector-red font-mono">
                {params.activeParam === 'Playback Speed' ? params.speed : 
                 params.activeParam === 'Buffer Size' ? params.buffer : params.noise}
              </span>
            </div>
            <input 
              type="range" 
              min={params.activeParam === 'Playback Speed' ? "0.03" : params.activeParam === 'Buffer Size' ? "20" : "0"}
              max={params.activeParam === 'Playback Speed' ? "0.6" : params.activeParam === 'Buffer Size' ? "220" : "15"}
              step={params.activeParam === 'Playback Speed' ? "0.01" : "1"}
              value={params.activeParam === 'Playback Speed' ? params.speed : 
                     params.activeParam === 'Buffer Size' ? params.buffer : params.noise}
              onChange={(e) => {
                const val = parseFloat(e.target.value);
                if (params.activeParam === 'Playback Speed') setParams({...params, speed: val});
                else if (params.activeParam === 'Buffer Size') setParams({...params, buffer: val});
                else setParams({...params, noise: val});
              }}
              className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-vector-red"
            />
          </div>
        </TacticalCard>
      </div>

      {/* Playback Controls */}
      <div className="col-span-5 grid grid-cols-3 gap-2">
        <CommandButton 
          onClick={onToggleSim}
          className={cn(
            "h-full flex flex-col items-center justify-center gap-1.5",
            isStandby ? "bg-vector-red" : "bg-black border border-vector-line"
          )}
        >
          {isStandby ? <Play className="w-5 h-5 fill-white" /> : isPaused ? <Play className="w-5 h-5 fill-vector-red text-vector-red" /> : <Pause className="w-5 h-5 fill-vector-red text-vector-red" />}
          <span className="text-[8px] uppercase tracking-tighter">
            {isStandby ? 'Engage' : isPaused ? 'Resume' : 'Pause'}
          </span>
        </CommandButton>

        <CommandButton 
          onClick={onReset}
          variant="secondary"
          className="h-full flex flex-col items-center justify-center gap-1.5 border-vector-line text-vector-text-dim hover:text-white"
        >
          <RotateCcw className="w-5 h-5" />
          <span className="text-[8px] uppercase tracking-tighter">Reset</span>
        </CommandButton>

        <CommandButton 
          onClick={() => onToggleSim('TERMINATE')}
          variant="secondary"
          className={cn(
            "h-full flex flex-col items-center justify-center gap-1.5 border-vector-line text-vector-text-dim hover:text-vector-red",
            isRunning && "hover:border-vector-red"
          )}
        >
          <Square className="w-5 h-5 fill-current" />
          <span className="text-[8px] uppercase tracking-tighter">Term</span>
        </CommandButton>
      </div>
    </div>
  );
};
