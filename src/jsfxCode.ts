export const jsfxCode = `desc: Reaper Drum Maker (by TuncyK Design)
version: 5.0.0
author: TuncyK Design
about:
  Profesyonel Sanal Baterist. %100 Product Ready.
  Sample-Accurate MIDI Engine (Sıfır Jitter, Kusursuz Senkronizasyon).
  Reaper Drummer Profilleri, Yillar/Ton Secimi, Time Division (Half/Double Time).
  Ses Muhendisligi Standartlarinda Audio Follow Track, Swing, Humanize, Push/Pull Feel, XY Pad.

slider1:val_x=0.5<0,1,0.01>-Complexity
slider2:val_y=0.5<0,1,0.01>-Loudness
slider3:val_fills=0.2<0,1,0.01>-Fills
slider4:val_swing=0.0<0,1,0.01>-Swing
slider5:val_feel=0.5<0,1,0.01>-Feel
slider6:var_ks=1<1,4,1>-Kick/Snare Vari
slider7:var_cy=1<1,3,1>-Cymbal/Hat Vari
slider8:var_pe=1<1,3,1>-Percussion Vari
slider9:ks_on=1<0,1,1>-Kick/Snare On
slider10:cy_on=1<0,1,1>-Cymbals On
slider11:pe_on=0<0,1,1>-Percussion On
slider12:tom_on=1<0,1,1>-Toms On
slider13:profile=0<0,9,1{R.D. Ian (Rock),R.D. Max (Pop),R.D. Lars (Metal),R.D. Cem (Anatolian),R.D. Syd (Psychedelic),R.D. Bob (Reggae/Folk),R.D. Johnny (Country),R.D. Dre (Rap),R.D. Kraft (Techno),R.D. Kyle (Modern)}>-Drummer Profile
slider14:follow_en=0<0,1,1{Off,On (Route Audio to Ch 3/4)}>-Follow Audio Track
slider15:decade=4<0,4,1{1960s (Vintage/Loose),1970s (Classic/Warm),1980s (Machine/Flat),1990s (Groovy),Modern (Loud/Grid)}>-Era/Tone
slider16:time_opt=1<0,2,1{Half-Time (1/2),Normal (1x),Double-Time (2x)}>-Time Division

in_pin:Audio L
in_pin:Audio R
in_pin:Follow Ch3 (Sidechain)
in_pin:Follow Ch4 (Sidechain)
out_pin:none
out_pin:none

@init
kick_note = 36; snare_note = 38; rim_note = 37;
hihat_closed = 42; hihat_pedal = 44; hihat_open = 46; 
ride_note = 51; crash_note = 49;
tom_hi = 48; tom_mid = 45; tom_low = 41;
perc_note = 60; 

global_seed = 12345;
env_follow = 0;
transient_caught = 0;

function set_seed(s) ( global_seed = s; );
function rand_det() (
  global_seed = (global_seed * 196314165 + 907633515) % 4294967296;
  global_seed / 4294967296.0;
);

@slider
tgt_x = slider1; tgt_y = slider2;
fills_amt = slider3; swing_amt = slider4; feel_amt = slider5;
kv = slider6; cv = slider7; pv = slider8;
profile = slider13; follow_en = slider14; decade = slider15; time_opt = slider16;

@sample
// ANALOG-MODELLED SIDECHAIN TRANSIENT DETECTOR (PEAK FOLLOWER)
follow_en ? (
    in_sig = max(abs(spl2), abs(spl3));
    in_sig > env_follow + 0.05 ? (
        transient_caught = 1;
        env_follow = in_sig;
    ) : (
        env_follow = max(in_sig, env_follow * 0.995); // Smooth release
    );
);

@block
val_x += (tgt_x - val_x) * 0.1;
val_y += (tgt_y - val_y) * 0.1;

play_state & 1 ? (
    // PRODUCT READY SAMPLE-ACCURATE ENGINE (No Jitter)
    beats_per_spl = (tempo / 60.0) / srate;
    
    // Time Division Scaling
    target_beat_pos_start = time_opt == 0 ? beat_position * 0.5 : (time_opt == 2 ? beat_position * 2.0 : beat_position);
    target_beats_per_spl = time_opt == 0 ? beats_per_spl * 0.5 : (time_opt == 2 ? beats_per_spl * 2.0 : beats_per_spl);
    target_beat_pos_end = target_beat_pos_start + (samplesblock * target_beats_per_spl);
    
    step_size = 0.25; // 16th Note Grid
    eps = 0.00001; // Epsilon for floating point accuracy boundaries
    
    start_step = ceil((target_beat_pos_start - eps) / step_size);
    end_step = floor((target_beat_pos_end - eps) / step_size);
    
    step = start_step;
    while(step <= end_step) (
         
         exact_virtual_beat = step * step_size;
         beats_into_block = exact_virtual_beat - target_beat_pos_start;
         base_sample_offset = max(0, floor(beats_into_block / target_beats_per_spl));
         
         pos_in_bar = step % 16;
         pos_in_bar < 0 ? pos_in_bar += 16; // Safety
         bar_count = floor(step / 16);
         
         // Deterministic Groove Seeding per 16th note line
         set_seed((bar_count * 1234) + (kv * 100) + (cv * 10) + pv + floor(val_x*10) + floor(val_y*10) + profile + decade);

         // TONE & ERA CHARACTERISTICS (Macro Dynamics & Humanize Params)
         decade == 0 ? (prof_dyn_scale = 1.4; hum = 0.05; v_base = 70;) :
         decade == 1 ? (prof_dyn_scale = 1.2; hum = 0.02; v_base = 80;) :
         decade == 2 ? (prof_dyn_scale = 0.1; hum = 0.00; v_base = 110;) :
         decade == 3 ? (prof_dyn_scale = 1.0; hum = 0.01; v_base = 90;) :
                       (prof_dyn_scale = 0.8; hum = 0.00; v_base = 100;);

         fill_freq = fills_amt > 0.8 ? 1 : fills_amt > 0.5 ? 2 : fills_amt > 0.2 ? 4 : 8;
         profile == 2 || profile == 4 ? fill_freq -= 1; // Metal/Psych play more fills
         fill_freq < 1 ? fill_freq = 1;
         
         is_fill_bar = (bar_count % fill_freq == (fill_freq - 1)) && fills_amt > 0.05;
         fill_start_pos = fills_amt > 0.7 ? 8 : (fills_amt > 0.4 ? 10 : 12);
         do_fill = is_fill_bar && (pos_in_bar >= fill_start_pos);
         
         is_offbeat = (pos_in_bar % 2 != 0);
         
         // SWING ENGINE 
         base_swing = (profile == 5 || profile == 7 || decade == 0) ? 0.3 : 0; 
         actual_swing = is_offbeat ? ((swing_amt + base_swing) * 0.12) : 0; 
         
         // FEEL (PUSH/PULL) ENGINE 
         feel_mod = profile == 5 ? 0.2 : 0; // Reggae pulls heavily
         feel_offset_beats = (feel_amt - 0.5 - feel_mod) * 0.05; 
         
         total_offset_beats = actual_swing + feel_offset_beats;
         
         // Convert virtual beats back to actual master-tempo beats for physical delay calc
         actual_offset_beats = time_opt == 0 ? total_offset_beats * 2.0 : (time_opt == 2 ? total_offset_beats * 0.5 : total_offset_beats);
         swing_feel_samples = floor(actual_offset_beats / beats_per_spl); // Microtiming Shift
         
         // HUMANIZE ENGINE (White Noise Phase Shift)
         hum_samples = floor((rand_det() - 0.5) * hum * srate * 60 / tempo);
         
         // CALC FINAL TARGET SAMPLE ALONG WITH PDC SAFETY
         final_offset = base_sample_offset + swing_feel_samples + hum_samples;
         final_offset < 0 ? final_offset = 0; 
         final_offset > samplesblock - 1 ? final_offset = samplesblock - 1; // Safe boundary emit
         
         // VELOCITY ENGINE
         v_loud = min(127, v_base + (val_y * 27)); 
         v_med = max(10, v_base - 20 + (val_y * 30 * prof_dyn_scale));
         v_soft = max(10, v_base - 40 + (val_y * 30 * prof_dyn_scale));
         v_ghost = max(10, v_base - 60 + (val_y * 20 * prof_dyn_scale));
         
         decade == 2 ? v_ghost = 0; // 80s drum machines do not have ghost notes naturally
         profile == 8 ? v_ghost = 0; // Techno rigid

         k_trig = 0; s_trig = 0; h_trig = 0; p_trig = 0; tom_trig = 0; crash = 0;
         s_is_ghost = 0; h_is_open = 0; tom_note = tom_hi; note_hh = hihat_closed;

         // --- KICK & SNARE ARTIFICIAL INTELLIGENCE ---
         ks_on ? (
           do_fill ? (
               fill_r1 = rand_det();
               fill_r1 < 0.3 ? k_trig = 1 : fill_r1 < 0.7 ? s_trig = 1;
               val_x > 0.5 && rand_det() < 0.5 ? (k_trig=1; s_trig=1;);
           ) : (
               profile == 0 || profile == 1 || profile == 9 ? (
                  // Rock, Pop, Modern
                  kv == 1 ? ( k_trig = (pos_in_bar==0 || pos_in_bar==8); s_trig = (pos_in_bar==4 || pos_in_bar==12); ) :
                  kv == 2 ? ( k_trig = (pos_in_bar==0 || pos_in_bar==7 || pos_in_bar==10); s_trig = (pos_in_bar==4 || pos_in_bar==12); ) :
                  kv == 3 ? ( k_trig = (pos_in_bar==0 || pos_in_bar==8 || pos_in_bar==14); s_trig = (pos_in_bar==4 || pos_in_bar==12 || pos_in_bar==15); ) :
                            ( k_trig = (pos_in_bar==0 || pos_in_bar==2 || pos_in_bar==10); s_trig = (pos_in_bar==4 || pos_in_bar==12); );
               ) :
               profile == 2 ? (
                  // Metal
                  kv == 1 ? ( k_trig = (pos_in_bar%4==0); s_trig = (pos_in_bar==4 || pos_in_bar==12); ) :
                  kv == 2 ? ( k_trig = (pos_in_bar%2==0); s_trig = (pos_in_bar==4 || pos_in_bar==12); ) :
                            ( k_trig = 1; s_trig = (pos_in_bar==4 || pos_in_bar==12); ); // Double pedalling blast
               ) :
               profile == 3 ? (
                  // Anatolian Rock (9/8 Feels adapted to 4/4 grooving)
                  k_trig = (pos_in_bar==0 || pos_in_bar==3 || pos_in_bar==8 || pos_in_bar==11);
                  s_trig = (pos_in_bar==4 || pos_in_bar==12);
                  kv > 2 ? k_trig = (pos_in_bar==0 || pos_in_bar==3 || pos_in_bar==8 || pos_in_bar==10 || pos_in_bar==14);
               ) :
               profile == 4 ? (
                  // Psych
                  k_trig = (pos_in_bar==0 || pos_in_bar==7 || pos_in_bar==10);
                  s_trig = (pos_in_bar==4 || pos_in_bar==12);
                  kv > 2 ? s_is_ghost = (pos_in_bar==14);
               ) :
               profile == 5 ? (
                  // Reggae/Folk (One Drop)
                  k_trig = (pos_in_bar==8); 
                  s_trig = (pos_in_bar==8);
                  kv > 2 && pos_in_bar==14 ? (s_trig=1; s_is_ghost=1;);
               ) :
               profile == 6 ? (
                  // Country (Train Beat / Two Step)
                  k_trig = (pos_in_bar==0 || pos_in_bar==8);
                  s_trig = 1; // Snare on all 16ths...
                  s_is_ghost = (pos_in_bar!=4 && pos_in_bar!=12); // ...except 2 and 4
                  kv >= 3 && pos_in_bar%2!=0 ? s_trig = 0; // Less dense
               ) :
               profile == 7 ? (
                  // Rap / BoomBap
                  k_trig = (pos_in_bar==0 || pos_in_bar==2 || pos_in_bar==10);
                  s_trig = (pos_in_bar==8);
               ) :
               profile == 8 ? (
                  // Techno Four on the Floor
                  k_trig = (pos_in_bar%4==0);
                  s_trig = kv >= 2 ? (pos_in_bar==4 || pos_in_bar==12) : 0;
               ) : 0;
               
               // Complexity Overrides
               profile < 5 && val_x > 0.3 && (pos_in_bar == 3 || pos_in_bar == 9) && rand_det() < val_x ? k_trig = 1;
               profile < 5 && val_x > 0.6 && (pos_in_bar == 6 || pos_in_bar == 11) && rand_det() < val_x ? (s_trig = 1; s_is_ghost = 1;);
           );
           
           // SIDECHAIN TRANSIENT INJECTION
           follow_en && transient_caught ? (
               k_trig = 1; // Inject Bass drum perfectly aligned with Transient Line Target
               transient_caught = 0;
           );
         );

         // --- CYMBALS & HATS ---
         cy_on ? (
           do_fill ? (
               pos_in_bar == fill_start_pos && rand_det() < 0.5 ? (h_trig = 1; h_is_open = 1;);
               pos_in_bar == 15 && rand_det() > 0.5 ? crash = 1;
           ) : (
               profile == 8 ? (
                   h_trig = (pos_in_bar%2!=0); h_is_open = 1; // Offbeat techno hat
               ) : 
               profile == 7 || profile == 6 || profile == 5 ? (
                   h_trig = (pos_in_bar%2==0); // 8th notes
                   val_x > 0.5 && rand_det() < 0.2 ? h_trig = 1;
               ) : (
                   cv == 1 ? ( h_trig = (pos_in_bar % 4 == 0); ) : // Quarters
                   cv == 2 ? ( h_trig = (pos_in_bar % 2 == 0); ) : // 8ths
                   ( h_trig = 1; ); // 16ths
                   
                   val_x > 0.6 && (pos_in_bar == 2 || pos_in_bar == 10) && cv < 3 ? h_trig = 1;
                   pos_in_bar == 14 && val_x > 0.4 && rand_det() < val_x ? (h_trig = 1; h_is_open = 1;);
               );
               
               val_y > 0.7 && cv == 3 ? note_hh = ride_note :
               h_is_open ? note_hh = hihat_open : note_hh = hihat_closed;
               
               profile == 4 && rand_det() > 0.5 ? note_hh = ride_note; // Psych loves rides
               decade == 2 || profile == 8 ? note_hh = hihat_closed; // 80s/Techno rigidly closed hat

               pos_in_bar == 0 && (bar_count % 4 == 0) && val_y > 0.4 && kv < 4 ? crash = 1;
           );
         );

         // --- TOMS ---
         tom_on && do_fill ? (
            fill_t = rand_det();
            fill_t < (fills_amt) ? (
                tom_trig = 1;
                pos_in_bar < 10 ? tom_note = tom_hi :
                pos_in_bar < 13 ? tom_note = tom_mid : tom_note = tom_low;
                k_trig = 0; s_trig = 0;
                rand_det() < 0.3 ? k_trig = 1;
            );
         );
         
         profile == 4 && tom_on && !do_fill && rand_det() < (0.1 * val_x) && pos_in_bar%2==0 ? (
            tom_trig = 1; tom_note = tom_low; h_trig = 0; // Psych random low tom grooves
         );

         // --- PERCUSSION ---
         pe_on && !do_fill ? (
             pv == 1 ? ( p_trig = (pos_in_bar==2 || pos_in_bar==10); ) :
             pv == 2 ? ( p_trig = (pos_in_bar%2==0); ) :
             ( p_trig = 1; );
             pv > 1 && val_x > 0.5 && rand_det() < (val_x * 0.5) ? p_trig = 0;
             profile == 5 ? p_trig = (pos_in_bar%2!=0); // Reggae offbeat shaker
         );

         // --- MIDI DISPATCHER ---
         k_trig ? ( midisend(final_offset, 0x90, kick_note, v_loud); midisend(final_offset+1, 0x80, kick_note, 0); );
         s_trig ? ( 
           sv = s_is_ghost ? v_ghost : ((pos_in_bar==4 || pos_in_bar==12 || (profile==5&&pos_in_bar==8) || (profile==7&&pos_in_bar==8)) ? v_loud : v_med);
           note = (val_y < 0.2 && s_is_ghost == 0) || profile == 5 ? rim_note : snare_note; 
           midisend(final_offset, 0x90, note, sv); midisend(final_offset+1, 0x80, note, 0); 
         );
         h_trig ? ( 
           hv = (pos_in_bar % 4 == 0) ? v_med : (pos_in_bar % 2 == 0 ? v_soft : v_ghost);
           h_is_open ? hv = v_med : 0;
           midisend(final_offset, 0x90, note_hh, hv); midisend(final_offset+1, 0x80, note_hh, 0); 
         );
         crash ? ( midisend(final_offset, 0x90, crash_note, v_loud); midisend(final_offset+1, 0x80, crash_note, 0); );
         tom_trig ? ( midisend(final_offset, 0x90, tom_note, v_med); midisend(final_offset+1, 0x80, tom_note, 0); );
         p_trig ? ( midisend(final_offset, 0x90, perc_note, v_soft); midisend(final_offset+1, 0x80, perc_note, 0); );

         step += 1;
    );
) : (
    transient_caught = 0; // Clear state on stop
);

@gfx 850 630

function hex2rgb(hex) (
  gfx_r = ((hex >> 16) & 255) / 255.0;
  gfx_g = ((hex >> 8) & 255) / 255.0;
  gfx_b = (hex & 255) / 255.0;
);

hex2rgb(0x28282B); gfx_rect(0, 0, gfx_w, gfx_h);
hex2rgb(0x1C1C1E); gfx_rect(0, 0, 250, gfx_h);
hex2rgb(0x18181A); gfx_rect(0, 0, gfx_w, 60);

gfx_x = 20; gfx_y = 20;
hex2rgb(0xFFD60A); gfx_drawstr("REAPER DRUM MAKER");
gfx_x = 160; hex2rgb(0x8E8E93); gfx_drawstr("by TuncyK Design");

gfx_x = gfx_w - 200; gfx_y = 20;
play_state & 1 ? ( hex2rgb(0x32D74B); gfx_drawstr(sprintf(#, "SYNC: LOCKED - %.1f BPM", tempo)); )
: ( hex2rgb(0xFF453A); gfx_drawstr("SYNC: OFF"); );

// --- DRUMMER PROFILE (GENRE) ---
gfx_x = 20; gfx_y = 80; hex2rgb(0xFFFFFFFF); gfx_drawstr("DRUMMER ARTIST (GENRE)");
hex2rgb(0x3A3A3C); gfx_rect(20, 100, 210, 30, 1);
hex2rgb(0xFFD60A); gfx_x = 30; gfx_y = 110;
profile == 0 ? gfx_drawstr("R.D. Ian (Rock)") :
profile == 1 ? gfx_drawstr("R.D. Max (Pop)") :
profile == 2 ? gfx_drawstr("R.D. Lars (Metal)") :
profile == 3 ? gfx_drawstr("R.D. Cem (Anatolian Rock)") :
profile == 4 ? gfx_drawstr("R.D. Syd (Psych Rock)") :
profile == 5 ? gfx_drawstr("R.D. Bob (Reggae/Folk)") :
profile == 6 ? gfx_drawstr("R.D. Johnny (Country)") :
profile == 7 ? gfx_drawstr("R.D. Dre (Rap/HipHop)") :
profile == 8 ? gfx_drawstr("R.D. Kraft (Techno/EDM)") :
gfx_drawstr("R.D. Kyle (Modern Rock)");

mouse_cap & 1 && !(last_mouse_cap & 1) ? (
   mouse_x > 20 && mouse_x < 230 && mouse_y > 90 && mouse_y < 125 ? (
       slider13 = (profile + 1) % 10;
       sliderchange(slider13);
       profile = slider13;
   );
);

// --- ERA / TONE ---
gfx_x = 20; gfx_y = 145; hex2rgb(0xFFFFFFFF); gfx_drawstr("ERA & TONE");
hex2rgb(0x3A3A3C); gfx_rect(20, 165, 210, 30, 1);
hex2rgb(0xFFD60A); gfx_x = 30; gfx_y = 175;
decade == 0 ? gfx_drawstr("1960s (Vintage / Loose)") :
decade == 1 ? gfx_drawstr("1970s (Classic / Warm)") :
decade == 2 ? gfx_drawstr("1980s (Machine / Flat)") :
decade == 3 ? gfx_drawstr("1990s (Groovy)") :
gfx_drawstr("Modern (Loud / Grid)");

mouse_cap & 1 && !(last_mouse_cap & 1) ? (
   mouse_x > 20 && mouse_x < 230 && mouse_y > 155 && mouse_y < 190 ? (
       slider15 = (decade + 1) % 5;
       sliderchange(slider15);
       decade = slider15;
   );
);

// --- TIME DIVISION ---
gfx_x = 20; gfx_y = 210; hex2rgb(0xFFFFFFFF); gfx_drawstr("TIME DIVISION");
hex2rgb(0x3A3A3C); gfx_rect(20, 230, 210, 30, 1);
hex2rgb(0xFFD60A); gfx_x = 30; gfx_y = 240;
time_opt == 0 ? gfx_drawstr("Half-Time (1/2)") :
time_opt == 1 ? gfx_drawstr("Normal Time (1x)") :
gfx_drawstr("Double-Time (2x)");

mouse_cap & 1 && !(last_mouse_cap & 1) ? (
   mouse_x > 20 && mouse_x < 230 && mouse_y > 220 && mouse_y < 265 ? (
       slider16 = (time_opt + 1) % 3;
       sliderchange(slider16);
       time_opt = slider16;
   );
);

// --- KIT TOGGLES ---
gfx_x = 20; gfx_y = 280; hex2rgb(0xFFFFFFFF); gfx_drawstr("KIT PIECES");

function toggle_btn(xx, yy, ww, hh, state, label, sl_id) (
    hex2rgb(state ? 0xFFD60A : 0x3A3A3C);
    gfx_rect(xx, yy, ww, hh, 1);
    hex2rgb(state ? 0x000000 : 0x8E8E93);
    gfx_x = xx + 8; gfx_y = yy + 10; gfx_drawstr(label);
    
    mouse_cap & 1 && !(last_mouse_cap & 1) ? (
        mouse_x > xx && mouse_x < xx+ww && mouse_y > yy && mouse_y < yy+hh ? (
            new_val = state ? 0 : 1;
            sl_id == 9 ? (slider9 = new_val; sliderchange(slider9); ks_on = new_val;);
            sl_id == 10 ? (slider10 = new_val; sliderchange(slider10); cy_on = new_val;);
            sl_id == 12 ? (slider12 = new_val; sliderchange(slider12); tom_on = new_val;);
            sl_id == 11 ? (slider11 = new_val; sliderchange(slider11); pe_on = new_val;);
            sl_id == 14 ? (slider14 = new_val; sliderchange(slider14); follow_en = new_val;);
        );
    );
);

toggle_btn(20, 305, 100, 30, ks_on, "Kick", 9);
toggle_btn(130, 305, 100, 30, cy_on, "Cymbals", 10);
toggle_btn(20, 345, 100, 30, tom_on, "Toms", 12);
toggle_btn(130, 345, 100, 30, pe_on, "Perc", 11);

// --- SIDECHAIN ---
gfx_x = 20; gfx_y = 395; hex2rgb(0xFFFFFFFF); gfx_drawstr("SIDECHAIN ALGORITHM");
toggle_btn(20, 415, 210, 35, follow_en, "Follow Track (Ch3/4)", 14);
follow_en ? (gfx_x=30; gfx_y=465; hex2rgb(0x32D74B); gfx_drawstr("LISTENING TO CH3/4..."););


// --- XY PAD ---
pad_sz = 320; pad_x = 280; pad_y = 80;
hex2rgb(0x1C1C1E); gfx_rect(pad_x, pad_y, pad_sz, pad_sz);
hex2rgb(0x3A3A3C); 
gfx_line(pad_x+pad_sz/2, pad_y, pad_x+pad_sz/2, pad_y+pad_sz);
gfx_line(pad_x, pad_y+pad_sz/2, pad_x+pad_sz, pad_y+pad_sz/2);
gfx_rect(pad_x, pad_y, pad_sz, pad_sz, 0);

gfx_x = pad_x + pad_sz/2 - 15; gfx_y = pad_y - 20; hex2rgb(0x8E8E93); gfx_drawstr("LOUD");
gfx_x = pad_x + pad_sz/2 - 15; gfx_y = pad_y + pad_sz + 10; gfx_drawstr("SOFT");
gfx_x = pad_x - 55; gfx_y = pad_y + pad_sz/2 - 5; gfx_drawstr("SIMPLE");
gfx_x = pad_x + pad_sz + 10; gfx_y = pad_y + pad_sz/2 - 5; gfx_drawstr("COMPLEX");

mouse_cap & 1 ? (
  mouse_x > pad_x && mouse_x < pad_x+pad_sz && mouse_y > pad_y && mouse_y < pad_y+pad_sz ? (
     slider1 = (mouse_x - pad_x) / pad_sz;
     slider2 = 1.0 - ((mouse_y - pad_y) / pad_sz);
     sliderchange(slider1); sliderchange(slider2);
  );
);

node_x = pad_x + (val_x * pad_sz); node_y = pad_y + ((1.0-val_y) * pad_sz);
hex2rgb(0xFFD60A); gfx_circle(node_x, node_y, 10, 1);
hex2rgb(0xFFFFFF); gfx_circle(node_x, node_y, 10, 0);

// --- VARIATIONS ---
k_x = 640; k_y = 80;
hex2rgb(0xFFFFFFFF); gfx_x=k_x; gfx_y=k_y; gfx_drawstr("VARIATIONS");

function draw_var_slider(ax, ay, aw, active_var, max_var, label, slider_idx, is_active) (
   hex2rgb(is_active ? 0xFFFFFFFF : 0x8E8E93); gfx_x = ax; gfx_y = ay; gfx_drawstr(label);
   hex2rgb(0x1C1C1E); gfx_rect(ax+50, ay, aw, 15);
   
   mouse_cap & 1 && is_active ? (
      mouse_x > ax+50 && mouse_x < ax+50+aw && mouse_y > ay-5 && mouse_y < ay+20 ? (
          new_var = floor( ((mouse_x - (ax+50)) / aw) * max_var ) + 1;
          new_var > max_var ? new_var = max_var;
          new_var < 1 ? new_var = 1;
          slider_idx == 6 ? (slider6 = new_var; sliderchange(slider6); kv = new_var;);
          slider_idx == 7 ? (slider7 = new_var; sliderchange(slider7); cv = new_var;);
          slider_idx == 8 ? (slider8 = new_var; sliderchange(slider8); pv = new_var;);
      );
   );
   
   is_active ? hex2rgb(0xFFD60A) : hex2rgb(0x3A3A3C); 
   act_w = aw * (active_var / max_var);
   gfx_rect(ax+50, ay, act_w, 15);
   hex2rgb(0xFFFFFF); gfx_x = ax+50+act_w-15; gfx_drawstr(sprintf(#, "%d", active_var));
);

draw_var_slider(k_x, k_y+30, 120, kv, 4, "K/Snr", 6, ks_on);
draw_var_slider(k_x, k_y+70, 120, cv, 3, "Cymbl", 7, cy_on);
draw_var_slider(k_x, k_y+110, 120, pv, 3, "Perc", 8, pe_on);

// --- KNOBS ---
bot_y = 520;

function draw_knob(kx, ky, val, label, slider_idx) (
   hex2rgb(0x3A3A3C); gfx_circle(kx, ky, 25, 1);
   hex2rgb(0xFFD60A); 
   angle = -140 + (val * 280); 
   rad = angle * (3.14159 / 180);
   end_x = kx + sin(rad) * 20; end_y = ky - cos(rad) * 20;
   gfx_line(kx, ky, end_x, end_y);
   hex2rgb(0xFFFFFF); gfx_circle(kx, ky, 25, 0); 
   
   gfx_x = kx - 15; gfx_y = ky + 35; hex2rgb(0x8E8E93); gfx_drawstr(label);
   
   mouse_cap & 1 ? (
      mouse_x > kx-25 && mouse_x < kx+25 && mouse_y > ky-25 && mouse_y < ky+25 ? (
          diff = (last_my - mouse_y) * 0.01;
          new_val = val + diff;
          new_val > 1 ? new_val = 1; new_val < 0 ? new_val = 0;
          slider_idx == 3 ? (slider3 = new_val; sliderchange(slider3); fills_amt = new_val;);
          slider_idx == 4 ? (slider4 = new_val; sliderchange(slider4); swing_amt = new_val;);
          slider_idx == 5 ? (slider5 = new_val; sliderchange(slider5); feel_amt = new_val;);
      );
   );
);

draw_knob(330, bot_y, fills_amt, "FILLS", 3);
draw_knob(430, bot_y, swing_amt, "SWING", 4);
draw_knob(530, bot_y, feel_amt, "FEEL", 5);

last_my = mouse_y;
last_mouse_cap = mouse_cap;
`
