'use client';

import React from 'react';
import { 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';

export const TelemetryChart = ({ data, sensorKey = "s2", label = "Sensor Reading" }) => {
  if (!data || data.length === 0) return null;

  return (
    <div className="w-full h-full min-h-[300px]">
      <div className="absolute top-2 right-4 flex items-center gap-2 z-20">
        <div className="w-2 h-2 rounded-full bg-vector-red animate-pulse" />
        <span className="text-[10px] font-mono text-vector-text-dim uppercase tracking-widest font-bold">
          LIVE: {label}
        </span>
      </div>
      
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data}>
          <defs>
            <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#FF0000" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="#FF0000" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#1A1A1A" vertical={false} />
          <XAxis 
            dataKey="cycle" 
            stroke="#4A4A4A" 
            fontSize={10} 
            tickLine={false} 
            axisLine={false}
            label={{ value: 'SIMULATION CYCLE', position: 'insideBottom', offset: -5, fill: '#4A4A4A', fontSize: 8, fontStyle: 'italic' }}
          />
          <YAxis 
            stroke="#4A4A4A" 
            fontSize={10} 
            tickLine={false} 
            axisLine={false}
            domain={['auto', 'auto']}
          />
          <Tooltip 
            contentStyle={{ backgroundColor: '#0A0A0A', border: '1px solid #2A2A2A', fontSize: '10px', fontFamily: 'monospace' }}
            itemStyle={{ color: '#FF0000' }}
            labelStyle={{ color: '#7A7A7A', marginBottom: '4px' }}
            cursor={{ stroke: '#FF0000', strokeWidth: 1 }}
          />
          <Area 
            type="monotone" 
            dataKey={sensorKey} 
            stroke="#FF0000" 
            strokeWidth={2}
            fillOpacity={1} 
            fill="url(#colorValue)" 
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};
