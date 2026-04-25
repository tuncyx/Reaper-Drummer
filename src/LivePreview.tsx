import React, { useState, useEffect } from 'react';
import { Play, Square, Loader, Mic, Volume2, Settings2 } from 'lucide-react';
import { DrumEngine } from './DrumEngine';
import { WaveVisualizer } from './WaveVisualizer';

interface RotaryKnobProps {
  label: string;
  value: number; // 0 to 1
  onChange: (val: number) => void;
  size?: number;
  labelLeft?: string;
  labelRight?: string;
}

function RotaryKnob({ label, value, onChange, size = 64, labelLeft, labelRight }: RotaryKnobProps) {
  const handleDrag = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    const startY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;
    const startVal = value;

    const onMove = (moveEvent: MouseEvent | TouchEvent) => {
      const currentY = 'touches' in moveEvent ? moveEvent.touches[0].clientY : (moveEvent as MouseEvent).clientY;
      const delta = startY - currentY; // Up is positive
      let newVal = startVal + delta * 0.01;
      newVal = Math.max(0, Math.min(1, newVal));
      onChange(newVal);
    };

    const cleanup = () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', cleanup);
      window.removeEventListener('touchmove', onMove);
      window.removeEventListener('touchend', cleanup);
    };

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', cleanup);
    window.addEventListener('touchmove', onMove, { passive: false });
    window.addEventListener('touchend', cleanup);
  };

  const rotation = -135 + (value * 270); // From -135deg to +135deg

  return (
    <div className="flex flex-col items-center gap-2">
      <span className="text-[10px] uppercase font-bold text-[#888]">{label}</span>
      <div 
        className="relative rounded-full cursor-ns-resize shadow-lg flex items-center justify-center bg-gradient-to-b from-[#444] to-[#222] border border-[#111]"
        style={{ width: size, height: size }}
        onMouseDown={handleDrag}
        onTouchStart={handleDrag}
      >
        {/* Fill Arc */}
        <svg width={size} height={size} className="absolute inset-0 rotate-90" style={{ transform: 'rotate(135deg)' }}>
          <circle 
            cx={size/2} cy={size/2} r={size/2 - 4} 
            fill="none" stroke="#222" strokeWidth="4" 
            strokeDasharray={`${(270/360) * Math.PI * (size-8)} ${Math.PI * (size-8)}`}
          />
          <circle 
            cx={size/2} cy={size/2} r={size/2 - 4} 
            fill="none" stroke="#22c55e" strokeWidth="4" 
            strokeDasharray={`${value * (270/360) * Math.PI * (size-8)} ${Math.PI * (size-8)}`}
          />
        </svg>

        {/* Knob Body */}
        <div 
          className="absolute rounded-full bg-gradient-to-b from-[#555] to-[#333] shadow-inner top-2 left-2 right-2 bottom-2"
          style={{ transform: `rotate(${rotation}deg)` }}
        >
          {/* Indicator Dot */}
          <div className="absolute top-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-[#22c55e] shadow-[0_0_4px_#22c55e]"></div>
        </div>
      </div>
      {(labelLeft || labelRight) && (
        <div className="flex w-full justify-between px-1 -mt-1">
          <span className="text-[9px] font-medium text-[#777]">{labelLeft}</span>
          <span className="text-[9px] font-medium text-[#777]">{labelRight}</span>
        </div>
      )}
    </div>
  );
}

export function LivePreview() {
  const [engineReady, setEngineReady] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // States mapping to engine parameters
  const [tempo, setTempo] = useState(120);
  const [drumKit, setDrumKit] = useState(0); // 0=Acoustic, 1=CR78, 2=LINN
  const [profile, setProfile] = useState(0);
  const [decade, setDecade] = useState(4);
  const [complexity, setComplexity] = useState(0.5);
  const [loudness, setLoudness] = useState(0.5);
  const [fills, setFills] = useState(0.2);
  const [swing, setSwing] = useState(0.0);
  const [feel, setFeel] = useState(0.5);
  const [swing8th, setSwing8th] = useState(true);
  const [ghostNotes, setGhostNotes] = useState(0.5);
  const [hihat, setHihat] = useState(0.0);
  const [hihatAuto, setHihatAuto] = useState(true);

  const [timeNum, setTimeNum] = useState(4);
  const [timeDen, setTimeDen] = useState(4);
  const [hostSync, setHostSync] = useState(true);

  const [kv, setKv] = useState(1);
  const [cv, setCv] = useState(1);
  const [pv, setPv] = useState(1);

  const [percOn, setPercOn] = useState(false);
  const [percType, setPercType] = useState(0); // 0=Tambourine, 1=Shaker, 2=Claps
  const [ksFollow, setKsFollow] = useState(false);
  const [cyOn, setCyOn] = useState(true);
  const [ksOn, setKsOn] = useState(true);

  const [isMuted, setIsMuted] = useState(false);
  const [isSolo, setIsSolo] = useState(false); // If solo is true, we should mute the other dummy track
  const [isRec, setIsRec] = useState(true); // Default to record armed
  const [trackVolume, setTrackVolume] = useState(0);

  const engine = DrumEngine.getInstance();

  const handleInitAndPlay = async () => {
    if (isPlaying) {
      engine.stop();
      setIsPlaying(false);
      return;
    }
    
    if (!engineReady) {
      setLoading(true);
      const ready = await engine.initAndLoad();
      setEngineReady(ready);
      setLoading(false);
      if(!ready) return; // failed
    }

    engine.start();
    setIsPlaying(true);
  };

  useEffect(() => {
    if(!engine) return;
    engine.setTempo(tempo);
    engine.p_time_sig = `${timeNum}/${timeDen}`;
    engine.p_profile = profile;
    engine.setKit(drumKit);
    engine.p_decade = decade;
    engine.p_complexity = complexity;
    engine.p_loudness = loudness;
    engine.p_fills = fills;
    engine.p_swing = swing;
    engine.p_swing_8th = swing8th;
    engine.p_feel = feel;
    engine.p_ghost = ghostNotes;
    engine.p_hihat = hihat;
    engine.p_hihat_auto = hihatAuto;
    engine.p_kv = kv;
    engine.p_cv = cv;
    engine.p_pv = pv;
    engine.p_pe_on = percOn;
    engine.p_pe_type = percType;
    engine.p_ks_on = ksOn;
    engine.p_cy_on = cyOn;
    // Sidechain (Follow) mimics something
    if (ksFollow) { engine.p_kv = 1; engine.p_cv = 1; }
    
    engine.setMute(isMuted || (!isSolo && isMuted));
    engine.setVolume(trackVolume);
  }, [tempo, profile, decade, complexity, loudness, fills, swing, swing8th, feel, ghostNotes, hihat, hihatAuto, kv, cv, pv, percOn, percType, ksFollow, cyOn, ksOn, isMuted, isSolo, trackVolume, engine]);

  const PROFILES = [
    "John Bonham (Heavy Rock)",
    "Chad Smith (Funk Rock)",
    "Danny Carey (Prog Metal)",
    "Bernard Purdie (Half-Time Shuffle)",
    "Travis Barker (Pop Punk)",
    "Questlove (Neo-Soul)",
    "Phil Collins (80s Pop/Rock)",
    "Lars Ulrich (Thrash Metal)",
    "Tony Royster (Gospel/Chops)",
    "J Dilla (Drunk Hip-Hop)",
    "Cem Aksel (Anatolian)",
    "Dave Grohl (Grunge)",
    "Gavin Harrison (Polyrhythmic)",
    "Kraftwerk (Machine Techno)"
  ];
  const ERAS = ["1960s (Vintage)", "1970s (Classic)", "1980s (Machine)", "1990s (Groovy)", "Modern (Loud)"];

  return (
    <div className="flex flex-col h-full bg-[#111] p-6 text-white border border-[#333] rounded-xl relative">
      <div className="absolute top-0 left-0 w-full h-[6px] bg-gradient-to-r from-cyan-500 to-[#f40]"></div>
      
      <div className="flex justify-between items-center mb-6 border-b border-[#333] pb-6 mt-2">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-white flex items-center gap-3">
            Real Drum Engine <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#ef4444] text-white">LIVE WEB</span>
          </h2>
          <p className="text-[#888] text-sm mt-1">Acoustic WebAudio Drum Sampler</p>
        </div>
        
        <button 
          onClick={handleInitAndPlay}
          disabled={loading}
          className={`w-16 h-16 rounded-full flex items-center justify-center transition-all shadow-lg border-2 ${
            isPlaying 
              ? 'bg-[#333] text-[#f40] border-[#f40] hover:bg-[#444]' 
              : 'bg-gradient-to-tr from-green-500 to-green-400 text-black border-transparent hover:scale-105'
          }`}
        >
          {loading ? <Loader className="w-6 h-6 animate-spin" /> : isPlaying ? <Square className="w-6 h-6 fill-current" /> : <Play className="w-7 h-7 fill-current ml-1" />}
        </button>
      </div>

      {/* DAW Track View */}
      <div className="bg-[#1c1c1e] border border-[#333] rounded-lg mb-8 overflow-hidden flex flex-col shadow-inner">
        {/* Playhead Ruler */}
        <div className="h-6 bg-[#2c2c2e] border-b border-[#111] flex items-center px-4 relative overflow-hidden">
          {Array.from({length: 32}).map((_, i) => (
             <div key={i} className="absolute h-2 w-[1px] bg-[#444] bottom-0" style={{left: `${(i*100) / 16}%`}}></div>
          ))}
          <span className="text-[10px] text-[#888] font-mono relative z-10">{isPlaying ? "PLAYING" : "STOPPED"}</span>
        </div>
        
        {/* Drum Track */}
        <div className="flex h-24 border-b border-[#111]">
          {/* Track Header controls */}
          <div className={`w-48 bg-[#2c2c2e] border-r border-[#111] flex flex-col p-2 gap-2 ${isSolo ? 'bg-[#313123]' : ''} ${isMuted ? 'opacity-50' : ''}`}>
            <div className="flex items-center justify-between">
               <span className="text-xs font-bold text-gray-200 px-1 py-0.5 bg-[#444] rounded flex items-center gap-1">
                 <img src="https://img.icons8.com/color/48/drum-set.png" className="w-3 h-3 grayscale" alt="drum" />
                 Drum Maker
               </span>
               <div className="flex gap-1">
                 <button onClick={() => setIsMuted(!isMuted)} className={`w-5 h-5 rounded flex flex-col justify-center items-center text-[8px] font-bold ${isMuted ? 'bg-blue-500 text-white' : 'bg-[#444] hover:bg-blue-900'}`}>M</button>
                 <button onClick={() => setIsSolo(!isSolo)} className={`w-5 h-5 rounded flex flex-col justify-center items-center text-[8px] font-bold ${isSolo ? 'bg-yellow-500 text-white' : 'bg-[#444] hover:bg-yellow-900'}`}>S</button>
                 <button onClick={() => setIsRec(!isRec)} className={`w-5 h-5 rounded flex flex-col justify-center items-center text-[8px] font-bold ${isRec ? 'bg-red-500 text-white' : 'bg-[#444] hover:bg-red-900'}`}>R</button>
               </div>
            </div>
            <div className="flex items-center justify-between mt-auto px-1">
               <div className="flex items-center gap-1 text-[10px] text-[#aaa]">
                 <Volume2 className="w-3 h-3" /> 
                 <input type="range" min="-40" max="10" value={trackVolume} onChange={e=>setTrackVolume(Number(e.target.value))} className="w-16 h-1 bg-[#111] appearance-none" />
               </div>
               <Settings2 className="w-3 h-3 text-[#aaa]" />
            </div>
          </div>
          {/* Track Waveform Canvas */}
          <div className="flex-1 bg-[#1e1e1e] relative">
             <WaveVisualizer analyzer={engine.analyzer} isPlaying={isPlaying && !isMuted} />
          </div>
        </div>

        {/* Dummy Bass Track (Sidechain demo) */}
        <div className="flex h-16 opacity-50">
          <div className={`w-48 bg-[#2c2c2e] border-r border-[#111] flex flex-col p-2 gap-2`}>
            <div className="flex items-center justify-between">
               <span className="text-xs font-bold text-gray-400 px-1 py-0.5 bg-[#444] rounded">Bass DI (Ch 3/4)</span>
               <div className="flex gap-1">
                 <button className={`w-4 h-4 rounded bg-[#444] flex flex-col justify-center items-center text-[7px] font-bold ${isSolo ? 'bg-blue-500 text-white' : ''}`}>M</button>
                 <button className="w-4 h-4 rounded bg-[#444] flex flex-col justify-center items-center text-[7px] font-bold">S</button>
                 <button className={"w-4 h-4 rounded bg-[#444] flex flex-col justify-center items-center text-[7px] font-bold"}>R</button>
               </div>
            </div>
          </div>
          <div className="flex-1 bg-[#1e1e1e] relative p-1">
             <div className="w-full h-full bg-[#2a2a2d] border border-[#111] rounded shadow-inner flex flex-col justify-center overflow-hidden relative">
               <div className="absolute top-1 left-2 text-[8px] text-gray-500">Audio Region (dummy)</div>
               <div className="h-0.5 w-full bg-[#555] opacity-20"></div>
             </div>
          </div>
        </div>

      </div>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
        <label className="flex flex-col gap-2">
          <span className="text-[#999] text-xs font-bold uppercase tracking-wider h-[20px] flex items-center">Drummer Profile</span>
          <select value={profile} onChange={e => setProfile(Number(e.target.value))} className="bg-[#222] border border-[#444] text-white px-2 rounded outline-none focus:border-[#22c55e] text-sm h-9">
            {PROFILES.map((p, i) => <option key={i} value={i}>{p}</option>)}
          </select>
        </label>
        <label className="flex flex-col gap-2">
          <span className="text-[#999] text-xs font-bold uppercase tracking-wider h-[20px] flex items-center">Drum Kit</span>
          <select value={drumKit} onChange={e => setDrumKit(Number(e.target.value))} className="bg-[#222] border border-[#444] text-white px-2 rounded outline-none focus:border-[#22c55e] text-sm h-9">
            <option value={0}>Acoustic (Studio)</option>
            <option value={1}>CR-78 (Electronic)</option>
            <option value={2}>LinnDrum (Vintage 80s)</option>
          </select>
        </label>
        <label className="flex flex-col gap-2">
          <span className="text-[#999] text-xs font-bold uppercase tracking-wider h-[20px] flex items-center">Tone Era</span>
          <select value={decade} onChange={e => setDecade(Number(e.target.value))} className="bg-[#222] border border-[#444] text-white px-2 rounded outline-none focus:border-[#22c55e] text-sm h-9">
            {ERAS.map((e, i) => <option key={i} value={i}>{e}</option>)}
          </select>
        </label>
        <div className="flex flex-col gap-2 relative">
          <div className="flex justify-between items-center h-[20px]">
             <span className="text-[#999] text-xs font-bold uppercase tracking-wider">Tempo</span>
             <label className="flex items-center gap-2 cursor-pointer">
               <span className="text-[9px] text-[#22c55e] font-bold uppercase tracking-widest">Host Sync</span>
               <div className="relative">
                 <input type="checkbox" className="sr-only" checked={hostSync} onChange={(e) => setHostSync(e.target.checked)} />
                 <div className={`block w-6 h-3.5 rounded-full transition-colors ${hostSync ? 'bg-[#15803d]' : 'bg-[#444]'}`}></div>
                 <div className={`dot absolute left-0.5 top-0.5 bg-white w-2.5 h-2.5 rounded-full transition-transform ${hostSync ? 'translate-x-2.5' : ''}`}></div>
               </div>
             </label>
          </div>
          <div className={`flex gap-2 items-center transition-opacity h-9 ${hostSync ? 'opacity-40 pointer-events-none' : ''}`}>
             <span className="text-[#fff] font-mono text-sm w-8">{tempo}</span>
             <input type="range" min="60" max="220" value={tempo} onChange={e => setTempo(Number(e.target.value))} className="flex-1 h-2 bg-[#111] appearance-none rounded border border-[#333] accent-[#22c55e]" />
          </div>
        </div>
        <label className="flex flex-col gap-2">
          <span className="text-[#999] text-xs font-bold uppercase tracking-wider h-[20px] flex items-center">Signature</span>
          <div className={`flex items-center gap-2 h-9 ${hostSync ? 'opacity-40 pointer-events-none' : ''}`}>
             <input 
               type="number" min="1" max="16" 
               value={timeNum} onChange={e => setTimeNum(Number(e.target.value))} 
               className="w-12 bg-[#222] border border-[#444] text-white px-2 py-1 rounded outline-none focus:border-[#22c55e] text-center font-mono text-sm" 
             />
             <span className="text-[#888] font-bold">/</span>
             <select 
               value={timeDen} onChange={e => setTimeDen(Number(e.target.value))} 
               className="w-16 bg-[#222] border border-[#444] text-white px-2 py-1 rounded outline-none focus:border-[#22c55e] text-center font-mono text-sm appearance-none"
             >
                <option value={2}>2</option>
                <option value={4}>4</option>
                <option value={8}>8</option>
                <option value={16}>16</option>
             </select>
          </div>
        </label>
      </div>

      <div className="flex flex-col xl:flex-row gap-6 flex-1">
        
        {/* XY Pad Simulator (Left side) */}
        <div className="w-full xl:w-1/3 bg-[#18181a] border border-[#333] rounded-lg p-4 flex flex-col relative shrink-0 min-h-[250px]">
          <h3 className="text-[#999] text-xs font-bold uppercase tracking-wider mb-4">Groove Pad</h3>
          <div className="relative flex-1 bg-[#121212] border border-[#444] rounded overflow-hidden"
              onMouseMove={(e) => {
                if (e.buttons !== 1) return;
                const rect = e.currentTarget.getBoundingClientRect();
                let x = (e.clientX - rect.left) / rect.width;
                let y = 1.0 - ((e.clientY - rect.top) / rect.height);
                setComplexity(Math.max(0, Math.min(1, x)));
                setLoudness(Math.max(0, Math.min(1, y)));
              }}
              onMouseDown={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                let x = (e.clientX - rect.left) / rect.width;
                let y = 1.0 - ((e.clientY - rect.top) / rect.height);
                setComplexity(Math.max(0, Math.min(1, x)));
                setLoudness(Math.max(0, Math.min(1, y)));
              }}
          >
            {/* Grid Lines */}
            <div className="absolute top-1/2 left-0 w-full h-[1px] bg-[#333]"></div>
            <div className="absolute top-0 left-1/2 w-[1px] h-full bg-[#333]"></div>
            
            <div className="absolute text-[10px] text-[#666] font-bold top-2 left-1/2 -translate-x-1/2">LOUD</div>
            <div className="absolute text-[10px] text-[#666] font-bold bottom-2 left-1/2 -translate-x-1/2">SOFT</div>
            <div className="absolute text-[10px] text-[#666] font-bold top-1/2 left-2 -translate-y-1/2">SIMPLE</div>
            <div className="absolute text-[10px] text-[#666] font-bold top-1/2 right-2 -translate-y-1/2">COMPLEX</div>

            {/* Indicator */}
            <div 
              className="absolute w-5 h-5 bg-[#22c55e] rounded-full border-2 border-white shadow-[0_0_15px_#22c55e] pointer-events-none -ml-2.5 -mt-2.5 transition-transform duration-75"
              style={{ left: `${complexity * 100}%`, top: `${(1 - loudness) * 100}%` }}
            ></div>
          </div>
        </div>

        {/* Right Side Wrapper */}
        <div className="flex-1 flex flex-col gap-6">
           
           {/* Top Half: Variations + Fills/Swing */}
           <div className="flex flex-col sm:flex-row bg-[#272729] rounded-xl border border-[#111] shadow-2xl relative overflow-hidden flex-1">
             {/* Left side of panel: Variations */}
             <div className="flex-[3] flex flex-col justify-center p-6 gap-6 relative z-10 w-full">
                {/* Tambourine / Shaker Dummy Icon row */}
                 <div className="flex gap-4 pl-[112px] h-6 items-center">
                  <button 
                    onClick={() => { setPercOn(true); setPercType(0); }} 
                    className={`transition-opacity ${percOn && percType === 0 ? 'opacity-100 text-[#22c55e]' : 'opacity-40 hover:opacity-100 text-[#ccc]'}`}
                  >
                    {/* Tambourine SVG icon */}
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="8"></circle><circle cx="12" cy="4" r="2"></circle><circle cx="18" cy="6" r="2"></circle><circle cx="20" cy="12" r="2"></circle><circle cx="18" cy="18" r="2"></circle><circle cx="12" cy="20" r="2"></circle><circle cx="6" cy="18" r="2"></circle><circle cx="4" cy="12" r="2"></circle><circle cx="6" cy="6" r="2"></circle></svg>
                  </button>
                  <button 
                    onClick={() => { setPercOn(true); setPercType(1); }} 
                    className={`transition-opacity ${percOn && percType === 1 ? 'opacity-100 text-[#22c55e]' : 'opacity-40 hover:opacity-100 text-[#ccc]'}`}
                  >
                    {/* Shaker SVG icon */}
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="rotate-45"><rect x="8" y="2" width="8" height="20" rx="4"></rect><line x1="8" y1="10" x2="16" y2="10"></line><line x1="8" y1="14" x2="16" y2="14"></line></svg>
                  </button>
                  <button 
                    onClick={() => { setPercOn(true); setPercType(2); }} 
                    className={`transition-opacity ${percOn && percType === 2 ? 'opacity-100 text-[#22c55e]' : 'opacity-40 hover:opacity-100 text-[#ccc]'}`}
                  >
                    {/* Clap SVG icon */}
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 11V6a2 2 0 0 0-4 0v5"/><path d="M14 10V4a2 2 0 0 0-4 0v6"/><path d="M10 10.5V5a2 2 0 0 0-4 0v9"/><path d="M6 14.5V8a2 2 0 0 0-4 0v11.5a6 6 0 0 0 6 6h6a6 6 0 0 0 6-6V13a2 2 0 0 0-4 0v1.5"/></svg>
                  </button>
                </div>

                {/* Percussion Variation Slider */}
                <div className="flex items-center gap-4">
                   <button onClick={() => setPercOn(!percOn)} className={`w-24 text-right text-xs font-bold transition-colors ${percOn ? 'text-[#22c55e]' : 'text-[#555] hover:text-[#999]'}`}>Percussion</button>
                   <input type="range" min="1" max="4" value={pv} onChange={(e) => { setPv(Number(e.target.value)); setPercOn(true); }} className={`flex-1 h-3 bg-[#111] rounded appearance-none border border-[#333] ${percOn ? 'accent-[#22c55e]' : 'accent-[#555]'}`} />
                </div>
                {/* Cymbals Variation Slider */}
                <div className="flex items-center gap-4">
                   <button onClick={() => setCyOn(!cyOn)} className={`w-24 text-right text-xs font-bold transition-colors ${cyOn ? 'text-[#22c55e]' : 'text-[#555] hover:text-[#999]'}`}>Cymbals</button>
                   <input type="range" min="1" max="4" value={cv} onChange={(e) => { setCv(Number(e.target.value)); setCyOn(true); }} className={`flex-1 h-3 bg-[#111] rounded appearance-none border border-[#333] ${cyOn ? 'accent-[#22c55e]' : 'accent-[#555]'}`} />
                </div>
                {/* Kick & Snare Variation Slider */}
                <div className="flex items-center gap-4 relative">
                   <button onClick={() => setKsOn(!ksOn)} className={`w-24 text-right text-xs font-bold transition-colors ${ksOn ? 'text-[#22c55e]' : 'text-[#555] hover:text-[#999]'}`}>Kick & Snare</button>
                   <input type="range" min="1" max="4" value={kv} onChange={(e) => { setKv(Number(e.target.value)); setKsOn(true); }} className={`flex-1 h-3 bg-[#111] rounded appearance-none border border-[#333] ${ksOn ? 'accent-[#22c55e]' : 'accent-[#555]'}`} />
                   
                   {/* Follow Checkbox (Absolute Positioned above or next to it) */}
                   <label className="absolute -top-7 right-0 flex items-center gap-2 text-[10px] uppercase font-bold text-[#888] cursor-pointer hover:text-[#ccc]">
                      Follow
                      <div className={`w-3 h-3 rounded-sm border ${ksFollow ? 'bg-[#22c55e] border-[#16a34a]' : 'bg-[#222] border-[#555]'}`}></div>
                      <input type="checkbox" className="hidden" checked={ksFollow} onChange={e => setKsFollow(e.target.checked)} />
                   </label>
                </div>

                {/* Ghosted drum kit background */}
                <div className="absolute left-6 bottom-4 text-9xl leading-none opacity-5 blur-sm pointer-events-none select-none">🥁</div>
             </div>

             {/* Right side of panel: Main Knobs */}
             <div className="flex-1 bg-[#222224] border-l border-[#1a1a1c] p-4 flex flex-col items-center justify-around">
                <RotaryKnob label="Fills" value={fills} onChange={setFills} />
                <div className="flex flex-col items-center">
                  <RotaryKnob label="Swing" value={swing} onChange={setSwing} />
                  <div className="flex gap-2 mt-2 bg-[#111] rounded border border-[#333] p-0.5">
                    <button onClick={() => setSwing8th(true)} className={`text-[10px] font-bold px-2 py-0.5 rounded ${swing8th ? 'bg-[#444] text-[#22c55e]' : 'text-[#666]'}`}>8th</button>
                    <button onClick={() => setSwing8th(false)} className={`text-[10px] font-bold px-2 py-0.5 rounded ${!swing8th ? 'bg-[#444] text-[#22c55e]' : 'text-[#666]'}`}>16th</button>
                  </div>
                </div>
             </div>
           </div>

           {/* Bottom Half: Details */}
           <div className="flex flex-col sm:flex-row bg-[#272729] rounded-xl border border-[#111] shadow-2xl relative flex-1 overflow-hidden">
             
             <div className="flex-1 flex flex-wrap justify-center items-center gap-12 p-6 mt-2 w-full">
               <RotaryKnob label="Feel" value={feel} onChange={setFeel} labelLeft="Pull" labelRight="Push" />
               <RotaryKnob label="Ghost Notes" value={ghostNotes} onChange={setGhostNotes} labelLeft="Quiet" labelRight="Loud" />
               <div className="flex flex-col items-center">
                 <RotaryKnob label="Hi-Hat" value={hihat} onChange={setHihat} labelLeft="Closed" labelRight="Open" />
                 <label className="flex items-center gap-1 text-[10px] uppercase font-bold text-[#888] mt-2">
                    <input type="checkbox" checked={hihatAuto} onChange={e => setHihatAuto(e.target.checked)} className="w-3 h-3 appearance-none border border-[#666] bg-[#222] checked:bg-[#22c55e] rounded-sm" />
                    Automatic
                 </label>
               </div>
             </div>
           </div>

        </div>

      </div>
    </div>
  );
}
