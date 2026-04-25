import * as Tone from 'tone';

export class DrumEngine {
  static instance: DrumEngine | null = null;
  private sampler: Tone.Sampler | null = null;
  public isPlaying: boolean = false;
  private loopId: number = 0;
  public isReady: boolean = false;

  // Parameters matching JSFX
  public p_complexity = 0.5;
  public p_loudness = 0.5;
  public p_fills = 0.2;
  public p_swing = 0.0;
  public p_swing_8th = true;
  public p_feel = 0.5;
  public p_ghost = 0.5; // 0=quiet, 1=loud
  public p_hihat = 0.0; // 0=closed, 1=open
  public p_hihat_auto = true;
  public p_kv = 1;
  public p_cv = 1;
  public p_pv = 1;
  public p_ks_on = true;
  public p_cy_on = true;
  public p_pe_on = false;
  public p_pe_type = 0; // 0=Tambourine, 1=Shaker, 2=Claps
  public p_tom_on = true;
  public p_profile = 0;
  public p_time_sig = "4/4";
  public p_decade = 4;
  public p_time_opt = 1;
  public tempo = 120;

  private stepPos = 0;
  private global_seed = 12345;

  public analyzer: Tone.Analyser | null = null;
  public volume: Tone.Volume | null = null;
  
  public masterComp: Tone.Compressor | null = null;
  public masterEQ: Tone.EQ3 | null = null;
  public masterDist: Tone.Distortion | null = null;

  static getInstance() {
    if (!this.instance) {
      this.instance = new DrumEngine();
    }
    return this.instance;
  }

  private set_seed(s: number) {
    this.global_seed = s;
  }

  private rand_det() {
    this.global_seed = (this.global_seed * 196314165 + 907633515) % 4294967296;
    return this.global_seed / 4294967296.0;
  }

  public kitIndex = 0; // 0=Acoustic, 1=Electronic, 2=Vintage

  private kitURLs = [
    // 0: Acoustic (Studio)
    {
      "C1": "https://raw.githubusercontent.com/Tonejs/audio/master/drum-samples/acoustic-kit/kick.mp3",          
      "D1": "https://raw.githubusercontent.com/Tonejs/audio/master/drum-samples/acoustic-kit/snare.mp3",         
      "F#1": "https://raw.githubusercontent.com/Tonejs/audio/master/drum-samples/acoustic-kit/hihat.mp3",        
      "A#1": "https://raw.githubusercontent.com/wesbos/JavaScript30/master/01%20-%20JavaScript%20Drum%20Kit/sounds/openhat.wav",      
      "D#2": "https://raw.githubusercontent.com/wesbos/JavaScript30/master/01%20-%20JavaScript%20Drum%20Kit/sounds/ride.wav",         
      "C#2": "https://raw.githubusercontent.com/wesbos/JavaScript30/master/01%20-%20JavaScript%20Drum%20Kit/sounds/boom.wav",        
      "C2": "https://raw.githubusercontent.com/Tonejs/audio/master/drum-samples/acoustic-kit/tom1.mp3",
      "A1": "https://raw.githubusercontent.com/Tonejs/audio/master/drum-samples/acoustic-kit/tom2.mp3",
      "F1": "https://raw.githubusercontent.com/Tonejs/audio/master/drum-samples/acoustic-kit/tom3.mp3",
      "D#1": "https://raw.githubusercontent.com/wesbos/JavaScript30/master/01%20-%20JavaScript%20Drum%20Kit/sounds/tink.wav",
      "E1": "https://raw.githubusercontent.com/wesbos/JavaScript30/master/01%20-%20JavaScript%20Drum%20Kit/sounds/clap.wav"
    },
    // 1: CR78 (Electronic)
    {
      "C1": "https://raw.githubusercontent.com/Tonejs/audio/master/drum-samples/CR78/kick.mp3",          
      "D1": "https://raw.githubusercontent.com/Tonejs/audio/master/drum-samples/CR78/snare.mp3",         
      "F#1": "https://raw.githubusercontent.com/Tonejs/audio/master/drum-samples/CR78/hihat.mp3",        
      "A#1": "https://raw.githubusercontent.com/wesbos/JavaScript30/master/01%20-%20JavaScript%20Drum%20Kit/sounds/openhat.wav",      
      "D#2": "https://raw.githubusercontent.com/wesbos/JavaScript30/master/01%20-%20JavaScript%20Drum%20Kit/sounds/ride.wav",         
      "C#2": "https://raw.githubusercontent.com/wesbos/JavaScript30/master/01%20-%20JavaScript%20Drum%20Kit/sounds/boom.wav",        
      "C2": "https://raw.githubusercontent.com/Tonejs/audio/master/drum-samples/CR78/tom1.mp3",
      "A1": "https://raw.githubusercontent.com/Tonejs/audio/master/drum-samples/CR78/tom2.mp3",
      "F1": "https://raw.githubusercontent.com/Tonejs/audio/master/drum-samples/CR78/tom3.mp3",
      "D#1": "https://raw.githubusercontent.com/wesbos/JavaScript30/master/01%20-%20JavaScript%20Drum%20Kit/sounds/tink.wav",
      "E1": "https://raw.githubusercontent.com/wesbos/JavaScript30/master/01%20-%20JavaScript%20Drum%20Kit/sounds/clap.wav"
    },
    // 2: LINN (Vintage 80s)
    {
      "C1": "https://raw.githubusercontent.com/Tonejs/audio/master/drum-samples/LINN/kick.mp3",          
      "D1": "https://raw.githubusercontent.com/Tonejs/audio/master/drum-samples/LINN/snare.mp3",         
      "F#1": "https://raw.githubusercontent.com/Tonejs/audio/master/drum-samples/LINN/hihat.mp3",        
      "A#1": "https://raw.githubusercontent.com/wesbos/JavaScript30/master/01%20-%20JavaScript%20Drum%20Kit/sounds/openhat.wav",      
      "D#2": "https://raw.githubusercontent.com/wesbos/JavaScript30/master/01%20-%20JavaScript%20Drum%20Kit/sounds/ride.wav",         
      "C#2": "https://raw.githubusercontent.com/wesbos/JavaScript30/master/01%20-%20JavaScript%20Drum%20Kit/sounds/boom.wav",        
      "C2": "https://raw.githubusercontent.com/Tonejs/audio/master/drum-samples/LINN/tom1.mp3",
      "A1": "https://raw.githubusercontent.com/Tonejs/audio/master/drum-samples/LINN/tom2.mp3",
      "F1": "https://raw.githubusercontent.com/Tonejs/audio/master/drum-samples/LINN/tom3.mp3",
      "D#1": "https://raw.githubusercontent.com/wesbos/JavaScript30/master/01%20-%20JavaScript%20Drum%20Kit/sounds/tink.wav",
      "E1": "https://raw.githubusercontent.com/wesbos/JavaScript30/master/01%20-%20JavaScript%20Drum%20Kit/sounds/clap.wav"
    }
  ];

  async setKit(index: number) {
    if (this.kitIndex === index && this.isReady) return;
    this.kitIndex = index;
    this.isReady = false;
    
    if (this.sampler) {
      this.sampler.dispose();
    }
    
    return this.initAndLoad();
  }

  async initAndLoad() {
    if (this.isReady) return true;
    await Tone.start();
    
    return new Promise<boolean>((resolve, reject) => {
      try {
        this.sampler = new Tone.Sampler({
          urls: this.kitURLs[this.kitIndex],
          onload: () => {
            this.isReady = true;
            
            if (!this.masterComp) this.masterComp = new Tone.Compressor(-12, 4);
            if (!this.masterEQ) this.masterEQ = new Tone.EQ3(0, 0, 0);
            if (!this.masterDist) this.masterDist = new Tone.Distortion(0);
            
            if (!this.analyzer) this.analyzer = new Tone.Analyser('waveform', 256);
            if (!this.volume) this.volume = new Tone.Volume(0);
            
            this.sampler?.chain(this.masterDist, this.masterEQ, this.masterComp, this.volume, this.analyzer, Tone.getDestination());
            
            this.updateEraFX();
            resolve(true);
          },
          onerror: (err) => {
            console.error("Failed to load drum samples", err);
            reject(false);
          }
        });
      } catch (err) {
        reject(false);
      }
    });
  }

  start() {
    if (!this.isReady || this.isPlaying) return;
    this.isPlaying = true;
    this.stepPos = 0;
    
    Tone.Transport.bpm.value = this.tempo;
    Tone.Transport.start();

    // Schedule 16th note loop
    this.loopId = Tone.Transport.scheduleRepeat((time) => {
      this.tick(time);
    }, "16n");
  }

  stop() {
    if (!this.isPlaying) return;
    Tone.Transport.stop();
    Tone.Transport.clear(this.loopId);
    this.isPlaying = false;
  }

  setDecade(decade: number) {
    this.p_decade = decade;
    this.updateEraFX();
  }

  updateEraFX() {
    if (!this.masterEQ || !this.masterDist || !this.masterComp) return;
    switch (this.p_decade) {
      case 0: // 1960s (Vintage)
        this.masterEQ.low.value = -2;
        this.masterEQ.mid.value = +3;
        this.masterEQ.high.value = -4;
        this.masterDist.distortion = 0.15;
        this.masterComp.threshold.value = -10;
        this.masterComp.ratio.value = 2;
        break;
      case 1: // 1970s (Classic)
        this.masterEQ.low.value = +2;
        this.masterEQ.mid.value = -1;
        this.masterEQ.high.value = +1;
        this.masterDist.distortion = 0.05;
        this.masterComp.threshold.value = -15;
        this.masterComp.ratio.value = 3;
        break;
      case 2: // 1980s (Machine)
        this.masterEQ.low.value = +4;
        this.masterEQ.mid.value = -2;
        this.masterEQ.high.value = +5;
        this.masterDist.distortion = 0.02;
        this.masterComp.threshold.value = -20;
        this.masterComp.ratio.value = 6;
        break;
      case 3: // 1990s (Groovy)
        this.masterEQ.low.value = +3;
        this.masterEQ.mid.value = 0;
        this.masterEQ.high.value = +2;
        this.masterDist.distortion = 0.08;
        this.masterComp.threshold.value = -18;
        this.masterComp.ratio.value = 4;
        break;
      case 4: // Modern (Loud)
        this.masterEQ.low.value = +5;
        this.masterEQ.mid.value = +2;
        this.masterEQ.high.value = +6;
        this.masterDist.distortion = 0.01;
        this.masterComp.threshold.value = -24;
        this.masterComp.ratio.value = 8;
        break;
    }
  }

  setTempo(bpm: number) {
    this.tempo = bpm;
    Tone.Transport.bpm.rampTo(bpm, 0.1);
  }

  setVolume(db: number) {
    if (this.volume) this.volume.volume.value = db;
  }

  setMute(mute: boolean) {
    if (this.volume) this.volume.mute = mute;
  }

  // Ported logic from JSFX Engine
  private tick(time: number) {
    if (!this.sampler) return;

    let target_step = this.stepPos;
    
    // Time opt: 0=half, 1=normal, 2=double (affects pos mapping but Transport remains same visually if we want, or we just remap)
    let multiplier = this.p_time_opt === 0 ? 0.5 : (this.p_time_opt === 2 ? 2.0 : 1.0);
    
    let effective_step = Math.floor(target_step * multiplier);
    
    let parts = this.p_time_sig.split("/");
    let num = parseInt(parts[0]) || 4;
    let den = parseInt(parts[1]) || 4;
    
    // Calculate steps per bar dynamically based on 16th note resolution
    let steps_per_beat = 16 / den;
    let max_pos = Math.floor(num * steps_per_beat);
    if (max_pos < 1) max_pos = 16; // Fallback
    
    let pos_in_bar = effective_step % max_pos;
    let bar_count = Math.floor(effective_step / max_pos);

    this.set_seed((bar_count * 1234) + (this.p_kv * 100) + (this.p_cv * 10) + this.p_pv + Math.floor(this.p_complexity*10) + Math.floor(this.p_loudness*10) + this.p_profile + this.p_decade);

    // TONE / ERA BASE DYNAMICS
    let prof_dyn_scale = 1.0, hum = 0.05, v_base = 70;
    if(this.p_decade === 0) { prof_dyn_scale = 1.4; hum = 0.05; v_base = 70; }
    else if(this.p_decade === 1) { prof_dyn_scale = 1.2; hum = 0.02; v_base = 80; }
    else if(this.p_decade === 2) { prof_dyn_scale = 0.1; hum = 0.00; v_base = 110; }
    else if(this.p_decade === 3) { prof_dyn_scale = 1.0; hum = 0.01; v_base = 90; }
    else { prof_dyn_scale = 0.8; hum = 0.00; v_base = 100; }

    let fill_freq = this.p_fills > 0.8 ? 1 : this.p_fills > 0.5 ? 2 : this.p_fills > 0.2 ? 4 : 8;
    if(this.p_profile === 2 || this.p_profile === 4) fill_freq -= 1;
    if(fill_freq < 1) fill_freq = 1;

    let is_fill_bar = (bar_count % fill_freq === (fill_freq - 1)) && this.p_fills > 0.05;
    let fill_start_pos = this.p_fills > 0.7 ? 8 : (this.p_fills > 0.4 ? 10 : 12);
    let do_fill = is_fill_bar && (pos_in_bar >= fill_start_pos);

    let is_offbeat = (pos_in_bar % 2 !== 0);

    // SWING & FEEL
    let base_swing = 0;
    // J Dilla (9), Purdie (3) high swing.
    if(this.p_profile === 9) base_swing = 0.5;
    else if(this.p_profile === 3 || this.p_profile === 5) base_swing = 0.4;
    else if(this.p_profile === 8 || this.p_profile === 1) base_swing = 0.1;

    let swing_amt = (this.p_swing + base_swing) * 0.12;
    let actual_swing = 0;
    
    if (this.p_swing_8th || this.p_profile === 3) {
        // Swing 8th notes (indices 2, 6, 10, 14)
        if (pos_in_bar % 4 === 2) actual_swing = swing_amt;
        else if (pos_in_bar % 4 === 3) actual_swing = swing_amt * 0.5; // Avoid crunching
    } else {
        // Swing 16th notes (indices 1, 3, 5, 7...)
        if (pos_in_bar % 2 !== 0) actual_swing = swing_amt;
    }

    let feel_mod = 0;
    if(this.p_profile === 9 || this.p_profile === 5) feel_mod = 0.2; // Dilla / Questlove late feel
    else if(this.p_profile === 4 || this.p_profile === 7) feel_mod = -0.15; // Barker / Lars pushing forward
    else if(this.p_profile === 0) feel_mod = 0.1; // Bonham behind the beat

    // FEEL: >0.5 Push (early), <0.5 Pull (late). 
    let feel_offset_seconds = (this.p_feel - 0.5 - feel_mod) * -0.04; // Max +/- 20ms

    let totalBeatOffset = actual_swing;
    let base_time = time + (totalBeatOffset * (60 / Tone.Transport.bpm.value));
    
    // PRO HUMANIZATION (Stable, structured, minimal pure randomness)
    let base_hum = 1.0;
    if (this.p_profile === 13) base_hum = 0.0; // Kraftwerk (machine)
    if (this.p_profile === 9) base_hum = 2.0; // Dilla (loose)
    
    // Subtle procedural velocity variation based on position to simulate stick dynamics
    let pos_vel_mod = (pos_in_bar % 2 === 0 ? 0.02 : -0.02);

    const hum_vel = (layer: string) => {
        let hf = base_hum;
        // Keep velocities mostly stable, just slight natural variation
        let rand_var = (Math.random() - 0.5) * 0.06;
        return (rand_var + pos_vel_mod) * prof_dyn_scale * hf;
    };
    
    const get_hit_time = (layer: string) => {
        let hf = base_hum;
        let layer_feel = 0;
        
        // Snare can be pushed/pulled by the feel knob. Kick stays anchored.
        if (layer === 'sn') { 
            layer_feel = feel_offset_seconds; 
        } else if (layer === 'cy' || layer === 'pe') { 
            // Cymbals/Percussion follow snare feel slightly, but mostly tight
            layer_feel = feel_offset_seconds * 0.3; 
        }
        
        // Very tight jitter, otherwise it sounds unstable/bad
        let jiggle = (Math.random() - 0.5) * 0.004 * hf; // max 2ms random jitter
        
        return base_time + layer_feel + jiggle;
    };

    // VELOCITIES (mapped 0-1 for Tone.js)
    let dyn_scale = prof_dyn_scale * (0.8 + ((this.p_kv + this.p_cv + this.p_pv) / 12.0)); // variations slightly push dynamics
    let vLoud = Math.min(1.0, (v_base + (this.p_loudness * 27)) / 127.0);
    let vMed = Math.max(0.1, (v_base - 20 + (this.p_loudness * 30 * dyn_scale)) / 127.0);
    let vSoft = Math.max(0.1, (v_base - 40 + (this.p_loudness * 30 * dyn_scale)) / 127.0);
    let vGhost = Math.max(0.01, Math.min(1.0, (v_base - 60 + (this.p_loudness * 20 * dyn_scale) + ((this.p_ghost - 0.5) * 60)) / 127.0));

    if (this.p_decade === 2 || this.p_profile === 13) vGhost = 0.0; // 80s/Techno


    let k_trig = false, s_trig = false, h_trig = false, p_trig = false, tom_trig = false, crash = false;
    let s_is_ghost = false, h_is_open = false;
    let note_hh = "F#1"; // Closed
    let tom_note = "C2"; // Hi Tom

    // --- KICK / SNARE Logic ---
    if (this.p_ks_on) {
       if (do_fill) {
           let r1 = this.rand_det();
           if(r1 < 0.3) k_trig = true;
           else if(r1 < 0.7) s_trig = true;
           if(this.p_complexity > 0.5 && this.rand_det() < 0.5) { k_trig = true; s_trig = true; }
       } else {
           let p = this.p_profile;
           let kv = this.p_kv;
           let k_pattern = false, s_pattern = false;
           
           if(p===0) { // Bonham (Heavy Rock): Big syncopated kicks, solid snare
               k_pattern = (pos_in_bar===0 || pos_in_bar===8 || (kv>1 && pos_in_bar===10) || (kv>2 && pos_in_bar===14));
               s_pattern = (pos_in_bar===4 || pos_in_bar===12);
           } else if(p===1) { // Chad Smith (Funk Rock): Ghost notes, funky kicks
               k_pattern = (pos_in_bar===0 || pos_in_bar===7 || pos_in_bar===10);
               s_pattern = (pos_in_bar===4 || pos_in_bar===12);
               if(kv>1) s_is_ghost = (pos_in_bar===9 || pos_in_bar===14);
           } else if(p===2) { // Danny Carey (Prog Metal): Polyrhythmic toms mixed with kick
               k_pattern = (pos_in_bar%3===0 && pos_in_bar!==12); // Odd kick pattern
               s_pattern = (pos_in_bar===12); // Backbeat displaced
           } else if(p===3) { // Purdie (Half-Time Shuffle): Ghost notes galore
               k_pattern = (pos_in_bar===0 || (kv>1 && pos_in_bar===7));
               s_pattern = (pos_in_bar===8); // half-time backbeat
               s_is_ghost = (pos_in_bar===2 || pos_in_bar===5 || pos_in_bar===11 || pos_in_bar===14);
           } else if(p===4) { // Travis Barker (Pop Punk): Fast, 4 on the floor or driving kicks
               k_pattern = (pos_in_bar===0 || pos_in_bar===8 || (kv>1 && pos_in_bar===6));
               s_pattern = (pos_in_bar===4 || pos_in_bar===12);
               if(kv>2 && pos_in_bar%4===2) k_pattern = true;
           } else if(p===5) { // Questlove (Neo-Soul): Minimal, tight, late
               k_pattern = (pos_in_bar===0 || pos_in_bar===8 || (kv>1 && pos_in_bar===10));
               s_pattern = (pos_in_bar===4 || pos_in_bar===12);
           } else if(p===6) { // Phil Collins (80s Pop): Huge reverby backbeats
               k_pattern = (pos_in_bar===0 || pos_in_bar===8);
               s_pattern = (pos_in_bar===4 || pos_in_bar===12);
               if(kv>2 && pos_in_bar===14) k_pattern = true;
           } else if(p===7) { // Lars Ulrich (Thrash Metal): Skank beats, double bass
               if(kv > 2) k_pattern = (pos_in_bar%2===0); // double bass
               else k_pattern = (pos_in_bar===0 || pos_in_bar===8 || pos_in_bar===10);
               s_pattern = (pos_in_bar===4 || pos_in_bar===12);
           } else if(p===8) { // Tony Royster (Gospel chops): Displaced snares, fast kicks
               k_pattern = (pos_in_bar===0 || pos_in_bar===3 || pos_in_bar===11);
               s_pattern = (pos_in_bar===4 || pos_in_bar===12);
               s_is_ghost = (pos_in_bar===7 || pos_in_bar===9 || pos_in_bar===14);
           } else if(p===9) { // J Dilla (Drunk Hip-Hop)
               k_pattern = (pos_in_bar===0 || pos_in_bar===10);
               s_pattern = (pos_in_bar===4 || pos_in_bar===12);
               if(kv>2 && pos_in_bar===2) k_pattern = true;
           } else if(p===10) { // Cem Aksel (Anatolian)
               k_pattern = (pos_in_bar===0 || pos_in_bar===3 || pos_in_bar===6 || pos_in_bar===11);
               s_pattern = (pos_in_bar===8);
               s_is_ghost = (pos_in_bar===5 || pos_in_bar===14);
           } else if(p===11) { // Dave Grohl (Grunge): Stompy, straightforward but loud
               k_pattern = (pos_in_bar===0 || pos_in_bar===8 || pos_in_bar===10);
               s_pattern = (pos_in_bar===4 || pos_in_bar===12);
               if(kv>1 && pos_in_bar===14) s_pattern = true; // snare hit on 4 and
           } else if(p===12) { // Gavin Harrison (Polyrhythmic)
               k_pattern = (pos_in_bar%5===0); // Poly 5 over 16
               s_pattern = (pos_in_bar===4 || pos_in_bar===12);
               s_is_ghost = (pos_in_bar===2 || pos_in_bar===7 || pos_in_bar===15);
           } else if(p===13) { // Kraftwerk (Machine)
               k_pattern = (pos_in_bar%4===0);
               s_pattern = (pos_in_bar===4 || pos_in_bar===12);
           }
           
           if(s_is_ghost) { s_trig=true; k_pattern=false; }
           else { k_trig = k_pattern; s_trig = s_pattern; }
           
           // Extra complexity magic
           if (this.p_complexity > 0.4 && p!==13) {
              if (this.rand_det() < (this.p_complexity-0.3)*0.5 && pos_in_bar===14) k_trig = true;
              if (this.rand_det() < (this.p_complexity-0.3)*0.5 && pos_in_bar===9) { s_trig=true; s_is_ghost=true; }
           }
       }
    }

    // --- CYMBALS Logic ---
    if(this.p_cy_on) {
        if(do_fill) {
            if(pos_in_bar === fill_start_pos && this.rand_det() < 0.5) { h_trig = true; h_is_open = true; }
            if(pos_in_bar === 15 && this.rand_det() > 0.5) crash = true;
        } else {
            let p = this.p_profile;
            let cv = this.p_cv;
            
            if(p===13) { // Kraftwerk
                h_trig = (pos_in_bar%2!==0); h_is_open = true;
            } else if (p===0 || p===11 || p===4) { // Bonham/Grohl/Barker: bashy
                h_trig = (pos_in_bar%4===0 || pos_in_bar%4===2); 
                if(cv>2) h_trig = true; // Washy
                if(this.p_loudness > 0.6) h_is_open = true;
            } else if (p===5 || p===9) { // Questlove/Dilla: tight 8ths or 16ths
                h_trig = (pos_in_bar%2===0);
                if(cv>2) h_trig = true;
            } else if (p===1) { // Chad Smith: Ghost open-close
                h_trig = true;
                if(cv>1 && pos_in_bar%4===2) h_is_open = true;
            } else if (p===3) { // Purdie: shuffle hat
                h_trig = (pos_in_bar%4===0 || pos_in_bar%4===2);
            } else if (p===7) { // Lars: crash riding
                h_trig = (cv>1 ? true : pos_in_bar%4===0);
                if(this.p_loudness > 0.7 && pos_in_bar%4===0) crash = true;
            } else {
                if(cv===1) h_trig = (pos_in_bar%4===0);
                else if(cv===2) h_trig = (pos_in_bar%2===0);
                else h_trig = true;
                
                if(this.p_complexity > 0.6 && (pos_in_bar===2 || pos_in_bar===10) && cv < 3) h_trig = true;
                if(pos_in_bar===14 && this.p_complexity > 0.4 && this.rand_det() < this.p_complexity) { h_trig = true; h_is_open = true; }
            }

            if(this.p_loudness > 0.7 && cv === 3) note_hh = "D#2"; // Ride
            else if(h_is_open) note_hh = "A#1"; // Open
            else note_hh = "F#1"; // Closed

            if(p===2 && this.rand_det() > 0.5) note_hh = "D#2"; // Danny Carey Loves Rides & bells
            if(this.p_decade===2 || p===13) note_hh = "F#1"; // Techno rigid closed hat
            
            if(!this.p_hihat_auto) {
                h_is_open = this.p_hihat > 0.5;
                note_hh = h_is_open ? "A#1" : "F#1";
            }
            
            if(pos_in_bar===0 && (bar_count%4===0) && this.p_loudness > 0.4 && this.p_kv < 4) crash = true;
        }
    }

    // --- PERCUSSION Logic ---
    if(this.p_pe_on && !do_fill) {
        let pv = this.p_pv;
        p_trig = (pos_in_bar % 2 === 0);
        if (pv === 2) p_trig = true;
        else if (pv === 3) p_trig = (pos_in_bar % 2 !== 0);
        else if (pv === 4) p_trig = (pos_in_bar % 4 === 0);
        
        if (this.p_profile < 5 && this.p_complexity > 0.6 && this.rand_det() < 0.3) p_trig = true;
    }

    // --- TOMS logic ---
    if(this.p_tom_on && do_fill) {
        let ft = this.rand_det();
        if(ft < this.p_fills) {
            tom_trig = true;
            if(pos_in_bar < 10) tom_note = "C2"; // Hi
            else if(pos_in_bar < 13) tom_note = "A1"; // Mid
            else tom_note = "F1"; // Low
            k_trig = false; s_trig = false;
            if(this.rand_det() < 0.3) k_trig = true;
        }
    }
    if(this.p_profile===4 && this.p_tom_on && !do_fill && this.rand_det() < (0.1 * this.p_complexity) && pos_in_bar%2===0) {
        tom_trig = true; tom_note = "F1"; h_trig = false;
    }

    // DISPATCH
    if(k_trig) this.sampler.triggerAttack("C1", get_hit_time('ks'), Math.max(0.01, Math.min(1.0, vLoud + hum_vel('ks'))));
    
    if(s_trig) {
        let sv = s_is_ghost ? vGhost : ((pos_in_bar===4 || pos_in_bar===12 || (this.p_profile===5 && pos_in_bar===8) || (this.p_profile===7 && pos_in_bar===8)) ? vLoud : vMed);
        sv = Math.max(0.01, Math.min(1.0, sv + hum_vel('ks')));
        if(sv > 0.01) this.sampler.triggerAttack("D1", get_hit_time('sn'), sv);
    }
    
    if(h_trig) {
        let hv = (pos_in_bar%4===0) ? vMed : (pos_in_bar%2===0 ? vSoft : vGhost);
        if(h_is_open) hv = vMed;
        hv = Math.max(0.01, Math.min(1.0, hv + hum_vel('cy')));
        
        let t_cy = get_hit_time('cy');

        if (!h_is_open && hv > 0.01) {
            // Choke open hat if closed hat plays
            this.sampler.triggerRelease(["A#1", "F#1"], t_cy + 0.02);
        }
        
        if(hv > 0.01) this.sampler.triggerAttack(note_hh, t_cy, hv);
    }
    
    if(crash) {
        this.sampler.triggerAttack("C#2", get_hit_time('cy'), Math.max(0.01, Math.min(1.0, vLoud + hum_vel('cy'))));
    }
    
    if(tom_trig) {
        this.sampler.triggerAttack(tom_note, get_hit_time('tom'), Math.max(0.01, Math.min(1.0, vMed + hum_vel('tom'))));
    }
    if(p_trig) {
        let perv = pos_in_bar % 4 === 0 ? vMed : vGhost;
        let pNote = "D#1"; // Tambourine (tink)
        if (this.p_pe_type === 1) pNote = "F#1"; // Shaker (closed hat, maybe lower velocity)
        else if (this.p_pe_type === 2) pNote = "E1"; // Clap
        
        let finalV = Math.max(0.01, Math.min(1.0, perv + hum_vel('pe')));
        if (this.p_pe_type === 1) finalV *= 0.5; // Shaker is a bit quieter
        
        this.sampler.triggerAttack(pNote, get_hit_time('pe'), finalV);
    }

    this.stepPos++;
  }
}
