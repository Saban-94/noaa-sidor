import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  MessageSquare, 
  Send, 
  ChevronRight,
  Volume2,
  VolumeX,
  Speaker,
  Settings,
  Waves,
  Sparkles
} from 'lucide-react';
import { Order } from '../types';
import { parseItems } from '../lib/utils';

interface NoaChatProps {
  chatHistory: any[];
  chatScrollRef: React.RefObject<HTMLDivElement>;
  onBack: () => void;
  onAction: (action: string) => void;
  orders: Order[];
}

export const NoaChat = ({ 
  chatHistory, 
  chatScrollRef, 
  onBack, 
  onAction,
  orders 
}: NoaChatProps) => {
  const [isAutoVoice, setIsAutoVoice] = useState(() => localStorage.getItem('noa_auto_voice') === 'true');
  const [currentlySpeaking, setCurrentlySpeaking] = useState<number | null>(null);
  const synthRef = useRef<SpeechSynthesis | null>(window.speechSynthesis);

  // Persistence of auto voice setting
  useEffect(() => {
    localStorage.setItem('noa_auto_voice', String(isAutoVoice));
  }, [isAutoVoice]);

  const cleanTextForSpeech = (text: string) => {
    // 1. Detect if it's an item list
    const items = parseItems(text);
    if (items.length > 0) {
      let speech = "הנה הפריטים שנמצאו: ";
      items.forEach((item, index) => {
        speech += `פריט ${index + 1}: ${item.name}, כמות: ${item.quantity}. `;
      });
      return speech;
    }

    // 2. Regular cleaning
    return text
      .replace(/[*_#]/g, '') // remove markdown
      .replace(/[^\u0590-\u05FF0-9\s,.?!]/g, ' ') // keep hebrew, numbers, basic punctuation
      .trim();
  };

  const stopSpeaking = () => {
    if (synthRef.current) {
      synthRef.current.cancel();
      setCurrentlySpeaking(null);
    }
  };

  const speak = (text: string, index: number) => {
    if (!synthRef.current) return;

    // If already speaking this message, stop
    if (currentlySpeaking === index) {
      stopSpeaking();
      return;
    }

    // Stop anything else
    stopSpeaking();

    const utterance = new SpeechSynthesisUtterance(cleanTextForSpeech(text));
    const voices = synthRef.current.getVoices();
    const hebrewVoice = voices.find(v => v.lang.includes('he')) || voices[0];
    
    utterance.voice = hebrewVoice;
    utterance.lang = 'he-IL';
    utterance.rate = 1.0;
    utterance.pitch = 1.0;

    utterance.onstart = () => setCurrentlySpeaking(index);
    utterance.onend = () => setCurrentlySpeaking(null);
    utterance.onerror = () => setCurrentlySpeaking(null);

    synthRef.current.speak(utterance);
  };

  // Auto-voice effect
  useEffect(() => {
    if (isAutoVoice && chatHistory.length > 0) {
      const lastMessage = chatHistory[chatHistory.length - 1];
      if (lastMessage.role === 'model' || lastMessage.role === 'assistant') {
        speak(lastMessage.parts[0].text, chatHistory.length - 1);
      }
    }
  }, [chatHistory.length]);

  const dynamicSuggestions = [
    { label: 'סנכרון דרייב 📂', action: 'סרוק את תיקיית SabanOS ותחלץ נתונים מהקובץ האחרון' },
    { label: 'הזמנה חדשה ✍️', action: 'הזמנה חדשה' },
    { label: 'סטטוס הפצה 📊', action: 'מה סטטוס ההפצה כרגע?' },
    { label: 'דוח בוקר 📋', action: 'תכיני לי דוח בוקר 📋' },
    { label: 'סטטוס נהגים 🚛', action: 'סטטוס נהגים 🚛' },
    { label: 'חריגות בטון/ריצופית ⚠️', action: 'חריגות בטון/ריצופית ⚠️' },
    { label: 'סיכום עמוסים 📈', action: 'סיכום עמוסים' },
    { label: 'תיעוד מסירה 📜', action: 'תיעוד מסירה' },
    ...orders.filter(o => o.status === 'preparing').slice(0, 2).map(o => ({
      label: `צפי ל${o.customerName.split(' ')[0]} ⏱️`,
      action: `מה ה-ETA של ${o.customerName}?`
    }))
  ];

  return (
    <div className="h-[100dvh] bg-white flex flex-col md:flex-row overflow-hidden" dir="rtl">
      {/* Left Sidebar for Desktop (Quick Info) */}
      <div className="hidden md:flex w-72 bg-gray-50 border-l border-gray-100 flex-col p-6 overflow-y-auto shrink-0">
        <div className="flex items-center gap-3 mb-8">
          <button onClick={onBack} className="p-2 hover:bg-gray-200 rounded-xl transition-colors">
            <ChevronRight size={20} />
          </button>
          <h1 className="text-xl font-bold">נועה (SabanOS)</h1>
        </div>
        
          <div className="space-y-6">
            <div>
              <p className="text-[10px] font-black text-gray-400 mb-2 uppercase tracking-widest text-right">סטטוס מערכת</p>
              <div className="bg-white p-4 rounded-2xl border border-gray-100 flex items-center gap-3">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(34,197,94,0.5)]"></div>
                <span className="text-sm font-bold">זמינה לראמי</span>
              </div>
            </div>

            <div>
              <p className="text-[10px] font-black text-gray-400 mb-2 uppercase tracking-widest text-right">הגדרות קול</p>
              <div className="bg-white p-4 rounded-2xl border border-gray-100 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-gray-600">נועה מדברת</span>
                  <button 
                    onClick={() => setIsAutoVoice(!isAutoVoice)}
                    className={`relative w-10 h-5 rounded-full transition-colors ${isAutoVoice ? 'bg-sky-600' : 'bg-gray-200'}`}
                  >
                    <motion.div 
                      animate={{ x: isAutoVoice ? 20 : 2 }}
                      className="absolute top-1 left-0 w-3 h-3 bg-white rounded-full shadow-sm"
                    />
                  </button>
                </div>
                <p className="text-[9px] text-gray-400 leading-tight">במצב פעיל, נועה תקריא כל תשובה חדשה באופן אוטומטי.</p>
              </div>
            </div>
          </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col h-full bg-slate-950/20 relative overflow-hidden backdrop-blur-3xl">
        <header className="p-6 border-b border-white/10 flex items-center justify-between md:hidden z-30 shrink-0 glass-panel">
          <div className="flex items-center gap-4">
             <button onClick={onBack} className="p-2.5 hover:bg-white/10 rounded-2xl transition-all">
               <ChevronRight size={24} className="text-white" />
             </button>
             <h1 className="font-black text-xl text-white italic uppercase tracking-tighter">Noa Hub</h1>
          </div>
          <div className="flex items-center gap-4">
             <button 
               onClick={() => setIsAutoVoice(!isAutoVoice)}
               className={`p-2.5 rounded-2xl transition-all ${isAutoVoice ? 'bg-sky-500/20 text-sky-400 border border-sky-400/20 shadow-[0_0_10px_rgba(14,165,233,0.2)]' : 'text-slate-500 border border-transparent'}`}
             >
               <Volume2 size={20} />
             </button>
             <div className="flex items-center gap-2">
               <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
               <span className="text-[10px] font-black text-emerald-500 tracking-widest uppercase">Live</span>
             </div>
          </div>
        </header>

        {/* Message List */}
        <div 
          ref={chatScrollRef}
          className="flex-1 overflow-y-auto p-4 md:p-10 space-y-8 max-w-full md:max-w-4xl mx-auto w-full scroll-smooth custom-scrollbar"
        >
          {chatHistory.length === 0 && (
            <div className="text-center py-24 px-6">
              <div className="bg-sky-500/10 w-28 h-28 rounded-[3.5rem] flex items-center justify-center mx-auto mb-8 shadow-inner border border-sky-400/10 backdrop-blur-xl">
                 <MessageSquare className="text-sky-400" size={56} />
              </div>
              <h2 className="text-3xl font-black mb-2 italic text-white uppercase tracking-tighter">Operational Hub</h2>
              <p className="text-sm font-bold text-slate-500 mb-12 max-w-[280px] mx-auto uppercase tracking-widest leading-relaxed">System standby. Awaiting mission parameters or fleet queries.</p>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-lg mx-auto">
                 {dynamicSuggestions.slice(0, 6).map(suggestion => (
                   <button 
                     key={suggestion.label}
                     onClick={() => onAction(suggestion.action)}
                     className="p-5 glass-panel rounded-[2rem] text-[11px] font-black text-slate-400 hover:text-sky-400 border-white/5 hover:border-sky-400/30 transition-all text-right group flex items-center justify-between shadow-xl"
                   >
                     <span className="uppercase tracking-widest italic">{suggestion.label}</span>
                     <ChevronRight size={16} className="opacity-0 group-hover:opacity-100 transition-all transform group-hover:translate-x-[-4px]" />
                   </button>
                 ))}
              </div>
            </div>
          )}
          
          {chatHistory.map((chat, idx) => (
            <motion.div 
              key={idx} 
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex w-full ${chat.role === 'user' ? 'justify-start' : 'justify-end'}`}
            >
              <div className={`max-w-[90%] md:max-w-md p-6 rounded-[2.5rem] text-sm md:text-base font-black leading-relaxed shadow-2xl backdrop-blur-2xl relative group/msg italic tracking-tight ${
                chat.role === 'user' 
                  ? 'bg-sky-600/90 text-white rounded-tr-none border border-sky-400/30 shadow-sky-600/20' 
                  : 'bg-white/10 text-white rounded-tl-none border border-white/10'
              }`}>
                {chat.parts[0].text}
                
                {chat.role !== 'user' && (
                  <div className="flex items-center gap-3 mt-4 pt-4 border-t border-white/10">
                    <button 
                      onClick={() => speak(chat.parts[0].text, idx)}
                      className={`p-2.5 rounded-xl transition-all active:scale-90 ${currentlySpeaking === idx ? 'bg-sky-500/20 text-sky-400 border border-sky-400/20' : 'hover:bg-white/10 text-slate-500 border border-transparent'}`}
                    >
                      {currentlySpeaking === idx ? <VolumeX size={18} /> : <Volume2 size={18} />}
                    </button>
                    
                    {currentlySpeaking === idx && (
                      <div className="flex items-center gap-1 h-5">
                        {[1, 2, 3, 4, 3, 2, 1].map((h, i) => (
                          <motion.div 
                            key={i}
                            animate={{ height: [4, h * 5, 4] }}
                            transition={{ duration: 0.5, repeat: Infinity, delay: i * 0.1 }}
                            className="w-1 bg-sky-400 rounded-full shadow-[0_0_8px_rgba(56,189,248,0.6)]"
                          />
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Input Area */}
        <div className="bg-gradient-to-t from-slate-950 via-slate-950 to-transparent pt-8 pb-[calc(1.5rem+env(safe-area-inset-bottom))] md:pb-10 px-6 md:px-10 z-20 shrink-0 border-t border-white/5">
          <div className="max-w-full md:max-w-4xl mx-auto space-y-6">
            {/* Quick Actions Scrollable */}
            <div className="flex gap-3 overflow-x-auto no-scrollbar py-2 scroll-smooth">
              {dynamicSuggestions.map((btn, i) => (
                <button 
                  key={i}
                  onClick={() => onAction(btn.action)}
                  className="whitespace-nowrap glass-panel hover:bg-sky-500/20 hover:text-sky-400 text-slate-400 text-[10px] font-black px-5 py-3.5 rounded-full transition-all border border-white/5 shadow-xl hover:shadow-sky-500/10 active:scale-95 flex items-center gap-3 uppercase tracking-widest italic"
                >
                  <Sparkles size={14} className="text-sky-400 opacity-60" />
                  {btn.label}
                </button>
              ))}
            </div>

            <form 
              onSubmit={(e) => {
                e.preventDefault();
                const form = e.target as HTMLFormElement;
                const input = form.elements.namedItem('message') as HTMLInputElement;
                const val = input.value;
                if (!val) return;
                onAction(val);
                input.value = '';
              }}
              className="flex gap-4 items-center"
            >
              <div className="flex-1 relative group">
                <div className="absolute inset-0 bg-sky-500 rounded-[2.5rem] blur-xl opacity-0 group-focus-within:opacity-10 transition-opacity" />
                <input 
                  name="message"
                  autoComplete="off"
                  placeholder="Awaiting Input..."
                  className="w-full bg-white/5 backdrop-blur-2xl border-2 border-white/10 rounded-[2.5rem] px-8 py-4 md:py-5 text-sm md:text-base focus:border-sky-500/50 transition-all outline-none shadow-2xl font-black text-white italic tracking-tight relative z-10"
                />
              </div>
              <button 
                type="submit"
                className="bg-sky-500 text-white p-4 md:p-5 rounded-full hover:bg-sky-400 transition-all shadow-[0_0_30px_rgba(14,165,233,0.4)] hover:scale-105 active:scale-95 flex items-center justify-center shrink-0 border border-white/20"
              >
                <Send size={24} strokeWidth={3} />
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
