import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Copy, Download, Info, Music, Settings, Layout, CheckCircle, Terminal, PlayCircle, Code } from 'lucide-react';
import { jsfxCode } from './jsfxCode';
import { LivePreview } from './LivePreview';

export default function App() {
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'code' | 'preview'>('preview');

  const handleCopy = () => {
    navigator.clipboard.writeText(jsfxCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };


  const handleDownload = () => {
    const blob = new Blob([jsfxCode], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'ReaperDrumMaker_TuncyK.jsfx';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-[#121212] text-[#d1d1d1] font-sans selection:bg-[#f40]/30 border-t-[6px] border-[#222]">
      <div className="max-w-6xl mx-auto px-4 md:px-8 py-12">
        {/* Header Section */}
        <motion.header
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-16 border-b border-[#333] pb-8"
        >
          <div className="flex items-center gap-4 mb-4 text-[#22c55e]">
            <Music className="w-8 h-8" />
            <span className="text-xl font-medium tracking-widest uppercase">Reaper Drum Maker</span>
            <span className="text-sm font-serif italic text-zinc-400 ml-2 mt-1">by TuncyK Design</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-semibold text-white mb-6 tracking-tight">
            Sanal Bateristin Tam Bir <span className="text-[#22c55e]">Simülasyonu</span>
          </h1>
          <p className="max-w-2xl text-lg text-[#999] leading-relaxed">
            Reaper JSFX motoru için tasarlanan ve profesyonel sanal bateristlerin <strong>tüm özelliklerini (%100) kapsayan</strong> bu eklenti; X/Y pad, Profil Seçenekleri, Sidechain (Follow Track - Ch 3/4), Time (Half/Double), Humanize, Swing, Fills ve Push/Pull Feel mekaniklerini tek bir akıcı JSFX arayüzünde birleştirir.
          </p>
        </motion.header>

        <div className="grid lg:grid-cols-12 gap-8 items-start">
          
          {/* Instructions Column */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="lg:col-span-5 space-y-6"
          >
            <div className="bg-[#181818] border border-[#333] rounded-xl p-6 md:p-8">
              <div className="flex items-center gap-3 mb-6">
                <Info className="w-6 h-6 text-[#f40]" />
                <h2 className="text-2xl font-medium text-white">Nasıl Kurulur?</h2>
              </div>
              
              <ul className="space-y-6 relative before:absolute before:inset-y-0 before:left-[11px] before:w-[2px] before:bg-[#333]">
                <Step 
                  number="1"
                  title="Kodu Kopyala / İndir"
                  description="Sağdaki JSFX kodunu kopyalayın veya AutoDrummer.jsfx olarak indirin."
                />
                <Step 
                  number="2"
                  title="Reaper'ı Açın"
                  description="Reaper menüsünden 'Options -> Show REAPER resource path in explorer/finder' seçeneğine tıklayın."
                />
                <Step 
                  number="3"
                  title="Effects Klasörü"
                  description="Açılan dizinde 'Effects' klasörüne girin. İndirdiğiniz AutoDrummer.jsfx dosyasını buraya atın."
                />
                <Step 
                  number="4"
                  title="Kanalınıza Ekleyin"
                  description="Reaper FX arama çubuğuna 'Reaper Drum Maker' yazarak bulun."
                />
                <Step 
                  number="5"
                  title="Follow Track (Opsiyonel)"
                  description="Referans almak istediğiniz bas/gitar kanalından bateri kanalına '3/4' Aux çıkışı alın (Sidechain). Eklentiden 'Follow' seçeneğini açtığınızda Kick vuruşları otomatik olarak bu kanala oturacaktır."
                />
              </ul>
            </div>

            {/* Features Info */}
            <div className="bg-[#1a1a1a] border border-[#333] rounded-xl p-6 md:p-8">
               <h3 className="text-xl font-medium text-white mb-4">Öne Çıkan Özellikler</h3>
               <div className="space-y-4">
                 <Feature icon={<Layout />} text="Pürüzsüz Vector UI ve Tıklanabilir Seçim Menüleri" />
                 <Feature icon={<Settings />} text="10 Pro Artist Drummer Profili (Metal, Pop, Anatolian Rock, Rap, Folk, Techno vb.)" />
                 <Feature icon={<Music />} text="Era/Tone Seçimi: 60s, 70s, 80s, 90s ve Modern Dönemlerine Göre Evrilen Tuşe ve Humanize Dinamikleri" />
                 <Feature icon={<Music />} text="Audio Follow Track: Kaynak Sinyali (Ch 3/4) Algılayarak Otomatik Transiente Senkronize Kick'ler (Sidechain)" />
                 <Feature icon={<Terminal />} text="Fills, Swing, Feel Parametreleri, Bağımsız Varyasyonlar ve Time (Half/Double) Seçenekleri" />
               </div>
            </div>
          </motion.div>

          {/* Right Column */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="lg:col-span-7 flex flex-col min-h-[800px] xl:min-h-[900px]"
          >
            {/* Tab Navigation */}
            <div className="flex gap-4 mb-4">
               <button 
                 onClick={() => setActiveTab('preview')}
                 className={`flex items-center gap-2 px-6 py-3 rounded-t-xl font-bold text-sm transition-all ${activeTab === 'preview' ? 'bg-[#141414] text-[#f40] border-t-2 border-[#f40]' : 'bg-[#111] text-[#666] hover:text-[#d1d1d1] border-t-2 border-transparent'}`}
               >
                 <PlayCircle className="w-5 h-5" /> Live Web Preview
               </button>
               <button 
                 onClick={() => setActiveTab('code')}
                 className={`flex items-center gap-2 px-6 py-3 rounded-t-xl font-bold text-sm transition-all ${activeTab === 'code' ? 'bg-[#141414] text-[#2dd4bf] border-t-2 border-[#2dd4bf]' : 'bg-[#111] text-[#666] hover:text-[#d1d1d1] border-t-2 border-transparent'}`}
               >
                 <Code className="w-5 h-5" /> JSFX Script Code
               </button>
            </div>

            <div className="flex-1 bg-[#141414] border border-[#333] shadow-2xl flex flex-col overflow-hidden relative">
              <div className={activeTab === 'preview' ? 'flex flex-col h-full' : 'hidden'}>
                <LivePreview />
              </div>
              <div className={activeTab === 'code' ? 'flex flex-col h-full' : 'hidden'}>
                {/* Toolbar */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-[#333] bg-[#1a1a1a]">
                  <div className="flex items-center gap-2">
                    <div className="flex gap-1.5 mr-4">
                      <div className="w-3 h-3 rounded-full bg-[#444]"></div>
                      <div className="w-3 h-3 rounded-full bg-[#444]"></div>
                      <div className="w-3 h-3 rounded-full bg-[#444]"></div>
                    </div>
                    <span className="text-[10px] uppercase font-bold tracking-widest text-[#666]">ReaperDrumMaker_TuncyK.jsfx <span className="opacity-50">(EEL2 Script)</span></span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={handleCopy}
                      className="flex items-center gap-2 px-4 py-1.5 bg-[#333] rounded hover:bg-[#444] text-xs font-semibold border border-[#444] text-[#d1d1d1] transition-colors focus:ring-1 focus:ring-[#f40] outline-none"
                    >
                      {copied ? <CheckCircle className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                      {copied ? 'Kopyalandı' : 'Kopyala'}
                    </button>
                    <button 
                      onClick={handleDownload}
                      className="flex items-center gap-2 px-4 py-1.5 bg-[#f40] rounded text-white text-xs font-semibold transition-colors focus:ring-1 focus:ring-white outline-none"
                    >
                      <Download className="w-4 h-4" />
                      İndir .jsfx
                    </button>
                  </div>
                </div>

                {/* Code scroll area */}
                <div className="flex-1 overflow-auto p-6 scrollbar-thin scrollbar-thumb-[#333] scrollbar-track-transparent">
                  <pre className="font-mono text-[13px] leading-relaxed text-[#d1d1d1]">
                    <code dangerouslySetInnerHTML={{ __html: syntaxHighlight(jsfxCode) }} />
                  </pre>
                </div>
              </div>
            </div>
          </motion.div>

        </div>
      </div>
    </div>
  );
}

// Helper components
function Step({ number, title, description }: { number: string, title: string, description: string }) {
  return (
    <li className="relative pl-8">
      <div className="absolute left-0 top-1 w-6 h-6 rounded-full bg-[#222] border-2 border-cyan-500 flex items-center justify-center text-xs font-bold text-cyan-400">
        {number}
      </div>
      <h3 className="text-lg font-medium text-white mb-1">{title}</h3>
      <p className="text-[#999] leading-snug">{description}</p>
    </li>
  );
}

function Feature({ icon, text }: { icon: React.ReactNode, text: string }) {
  return (
    <div className="flex items-center gap-3 text-[#d1d1d1]">
      <div className="p-2 bg-[#222] border-[1px] border-[#333] rounded text-cyan-400 shadow-inner">
        {React.cloneElement(icon as React.ReactElement, { className: 'w-5 h-5' })}
      </div>
      <span className="font-medium text-sm">{text}</span>
    </div>
  );
}

// Very basic syntax highlighter for EEL2/JSFX
function syntaxHighlight(code: string) {
  return code
    .replace(/\/\/(.*)/g, '<span class="text-[#666] italic">//$1</span>') // Comments
    .replace(/@(init|slider|block|sample|gfx)/g, '<span class="text-[#f40] font-bold">@$1</span>') // Directives
    .replace(/\b(desc|version|author|about|slider[0-9]+|in_pin|out_pin)\b/g, '<span class="text-[#999]">$1</span>') // Headers
    .replace(/\b(midisend|play_state|beat_position|rand|floor|gfx_rect|gfx_drawstr|gfx_circle|gfx_line|mouse_cap|mouse_x|mouse_y|sin|cos|rand_det|set_seed|toggle_btn|hex2rgb|draw_knob|draw_var_slider|abs|min|max|sprintf)\b/g, '<span class="text-cyan-400">$1</span>') // Functions/Vars
    .replace(/\b([0-9.]+)\b/g, '<span class="text-green-400">$1</span>'); // Numbers
}
