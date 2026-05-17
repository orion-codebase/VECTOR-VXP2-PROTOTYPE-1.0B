'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { TacticalConsole } from '@/components/TacticalConsole';
import { StatusKPI, TacticalCard } from '@/components/TacticalUI';
import { TelemetryChart } from '@/components/TelemetryChart';
import { Activity, ShieldAlert } from 'lucide-react';
import { uploadTelemetry, getUnitData, getPrediction } from '@/lib/api';
import { EngineSchematic } from '@/components/EngineSchematic';

export default function Home() {
  // --- Simulation State ---
  const [simStatus, setSimStatus] = useState('STANDBY'); // STANDBY, RUNNING, PAUSED
  const [units, setUnits] = useState([]);
  const [selectedUnit, setSelectedUnit] = useState(null);
  const [filename, setFilename] = useState(null);
  const [fullData, setFullData] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [history, setHistory] = useState([]);
  const [prediction, setPrediction] = useState({
    rul: "--",
    health_percent: 0,
    risk_level: "STANDBY",
    message: "Awaiting telemetry stream...",
    is_valid: true
  });
  const [alerts, setAlerts] = useState([]);
  const [activeSensor, setActiveSensor] = useState({ key: 's8', label: 'HPC Outlet Pressure (P30)' });

  // --- Parameters ---
  const [params, setParams] = useState({
    activeParam: 'Playback Speed',
    speed: 0.12,
    buffer: 60,
    noise: 0
  });

  // Use a ref to track the latest data without triggering effect re-runs
  const stateRef = useRef({ currentIndex, simStatus, fullData, params });
  useEffect(() => {
    stateRef.current = { currentIndex, simStatus, fullData, params };
  }, [currentIndex, simStatus, fullData, params]);

  // --- File Upload Handler ---
  const handleUpload = async (file) => {
    try {
      const res = await uploadTelemetry(file);
      setFilename(res.filename);
      setUnits(res.units);
      setSelectedUnit(res.units[0]);
    } catch (err) {
      console.error("Upload Error:", err);
    }
  };

  // --- Load Unit Data ---
  useEffect(() => {
    if (filename && selectedUnit) {
      getUnitData(filename, selectedUnit).then(data => {
        setFullData(data);
        setCurrentIndex(0);
        setHistory([]);
        setAlerts([]);
        setSimStatus('STANDBY');
      });
    }
  }, [filename, selectedUnit]);

  // --- Reset Handler ---
  const handleReset = useCallback(() => {
    setCurrentIndex(0);
    setHistory([]);
    setAlerts([]);
    setSimStatus('STANDBY');
  }, []);

  // --- Toggle Handler ---
  const toggleSim = useCallback((action) => {
    if (action === 'TERMINATE') {
      handleReset();
      return;
    }
    setSimStatus(prev => prev === 'RUNNING' ? 'PAUSED' : 'RUNNING');
  }, [handleReset]);

  // --- Simulation Step Logic ---
  const runStep = useCallback(async () => {
    const { currentIndex: idx, fullData: data, params: p } = stateRef.current;
    
    if (idx >= data.length) {
      setSimStatus('PAUSED');
      return;
    }

    const row = data[idx];
    const { history: hist } = stateRef.current;
    
    try {
      const res = await getPrediction(row, hist);
      setPrediction(res);
      
      if (res.risk_level === 'CRITICAL' && !res.is_valid) {
        setAlerts(prev => {
          const newAlert = {
            id: crypto.randomUUID(),
            type: 'CRITICAL',
            msg: res.message,
            cycle: row.cycle
          };
          return [newAlert, ...prev].slice(0, 5);
        });
      }
    } catch (err) {
      console.error("Prediction API Error:", err);
    }

    setHistory(prev => {
      const newHist = [...prev, row];
      return newHist.slice(-p.buffer);
    });

    setCurrentIndex(prev => prev + 1);
  }, []);

  // --- Optimized Simulation Loop ---
  useEffect(() => {
    let timer;
    if (simStatus === 'RUNNING' && fullData.length > 0) {
      timer = setInterval(runStep, params.speed * 1000);
    }
    return () => clearInterval(timer);
  }, [simStatus, params.speed, fullData.length, runStep]);

  return (
    <main className="min-h-screen p-6 bg-vector-bg relative overflow-hidden">
      <div className="scanline" />
      <div className="absolute inset-0 bg-[linear-gradient(rgba(26,26,26,0.5)_1px,transparent_1px),linear-gradient(90deg,rgba(26,26,26,0.5)_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_at_center,black,transparent_80%)] pointer-events-none" />

      <div className="relative z-10 max-w-7xl mx-auto space-y-6">
        <header className="flex justify-between items-end border-b border-vector-line pb-4 mb-8">
          <div>
            <h1 className="text-3xl font-black tracking-tighter text-white flex items-center gap-3">
              VECTOR <span className="bg-vector-red text-[10px] px-2 py-0.5 rounded-sm font-mono tracking-widest align-middle">VXP2 PROTOTYPE</span>
            </h1>
            <p className="text-vector-text-low text-xs mt-1 font-mono uppercase tracking-[0.2em]">
              Orion Spacetech • Optimized Industry Console
            </p>
          </div>
          <div className="text-right font-mono">
            <div className="text-[10px] text-vector-text-low uppercase tracking-widest">Active Stream</div>
            <div className={`text-xs font-bold flex items-center justify-end gap-1.5 ${simStatus === 'RUNNING' ? 'text-green-500' : simStatus === 'PAUSED' ? 'text-vector-gold' : 'text-vector-red'}`}>
              <div className={`w-1.5 h-1.5 rounded-full ${simStatus === 'RUNNING' ? 'bg-green-500 animate-pulse' : simStatus === 'PAUSED' ? 'bg-vector-gold' : 'bg-vector-red'}`} />
              {simStatus === 'RUNNING' ? 'SYSTEM LIVE' : simStatus === 'PAUSED' ? 'SYSTEM PAUSED' : 'SYSTEM STANDBY'}
            </div>
          </div>
        </header>

        <section>
          <TacticalConsole 
            onUpload={handleUpload}
            simStatus={simStatus}
            onToggleSim={toggleSim}
            onReset={handleReset}
            params={params}
            setParams={setParams}
            units={units}
            selectedUnit={selectedUnit}
            setSelectedUnit={setSelectedUnit}
          />
        </section>

        <section className="grid grid-cols-6 gap-4">
          <StatusKPI label="Remaining Useful Life" value={prediction.rul} subtext="Predicted Cycles" trend={prediction.risk_level.toLowerCase()} />
          <StatusKPI label="Health Index" value={`${parseFloat(prediction.health_percent || 0).toFixed(1)}%`} subtext="Integrity Score" />
          <StatusKPI label="Risk Analysis" value={prediction.risk_level} subtext="Real-time Guardrail" trend={prediction.risk_level.toLowerCase()} />
          <StatusKPI label="Simulation Cycle" value={Math.min(currentIndex, fullData.length)} subtext={`of ${fullData.length}`} />
          <StatusKPI label="Processing Lag" value="< 2ms" subtext="API Response Time" />
          <StatusKPI label="Active Unit" value={selectedUnit || "--"} subtext="Turbofan Identifier" />
        </section>

        <div className="grid grid-cols-12 gap-6">
          <div className="col-span-8 space-y-6">
            <TacticalCard title="Telemetry Analytics Stream" className="h-[400px] relative">
              <div className="absolute top-10 left-4 flex gap-2 z-30">
                {[
                  { id: 's4', name: 'Core Temp (T30)', full: 'Total Temperature at HPC Outlet' },
                  { id: 's8', name: 'Pressure (P30)', full: 'Total Pressure at HPC Outlet' },
                  { id: 's16', name: 'Fuel Flow', full: 'Fuel Flow Ratio to Ps30' }
                ].map(s => (
                  <button
                    key={s.id}
                    onClick={() => setActiveSensor({ key: s.id, label: s.full })}
                    className={`px-3 py-1 text-[9px] font-mono border transition-all ${activeSensor.key === s.id ? 'bg-vector-red border-vector-red text-white' : 'bg-black border-vector-line text-vector-text-dim hover:border-vector-red/50'}`}
                  >
                    {s.name}
                  </button>
                ))}
              </div>

              {history.length > 0 ? (
                <div className="mt-8 h-[300px]">
                  <TelemetryChart data={history} sensorKey={activeSensor.key} label={activeSensor.label} />
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-vector-text-low font-mono text-sm border border-dashed border-vector-line/50 rounded-sm">
                  <Activity className="w-8 h-8 mb-2 opacity-20" />
                  [ Awaiting System Engagement ]
                </div>
              )}
            </TacticalCard>
          </div>

          <div className="col-span-4 space-y-6">
            <TacticalCard title="Tactical Alert Center" className="h-[210px] overflow-y-auto">
              <div className="space-y-3">
                {alerts.length === 0 ? (
                  <div className="text-[10px] text-vector-text-low italic font-mono">No anomalies detected.</div>
                ) : (
                  alerts.map(alert => (
                    <div key={alert.id} className="p-2 border-l-2 border-vector-red bg-vector-red/5 rounded-r-sm">
                      <div className="flex justify-between items-start mb-1">
                        <span className="text-[10px] font-bold text-vector-red font-mono">CRITICAL ANOMALY</span>
                        <span className="text-[8px] text-vector-text-low font-mono">CYC: {alert.cycle}</span>
                      </div>
                      <div className="text-[9px] leading-tight text-white/80 font-mono">{alert.msg}</div>
                    </div>
                  ))
                )}
              </div>
            </TacticalCard>

            <TacticalCard title="Digital Twin: Diagnostic Readout" className="h-[230px]">
              <EngineSchematic isValid={prediction.is_valid} message={prediction.message} />
            </TacticalCard>
          </div>
        </div>

        <footer className="pt-8 text-center text-[9px] text-vector-text-low font-mono tracking-[0.3em] uppercase">
          © 2026 Orion Spacetech • VECTOR VXP2 Optimized Engine
        </footer>
      </div>
    </main>
  );
}
