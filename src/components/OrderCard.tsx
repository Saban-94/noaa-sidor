import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  Truck, 
  Info, 
  Clock, 
  CheckCircle2, 
  CheckCircle, 
  Sparkles, 
  Send, 
  User,
  LogOut,
  Pencil,
  AlertCircle,
  Trash2,
  Share2,
  RotateCcw,
  Eye,
  FileText,
  FileUp,
  Loader2,
  Paperclip,
  Package,
  X,
  ExternalLink,
  ChevronLeft
} from 'lucide-react';
import { AnimatePresence } from 'motion/react';
import { predictOrderEta } from '../services/auraService';
import { Order, Driver, InventoryItem } from '../types';
import { highlightText, parseItems, isKnownProduct, cn } from '../lib/utils';

export const StatusBadge = ({ status }: { status: Order['status'] }) => {
  const configs = {
    pending: { color: 'bg-amber-500/10 text-amber-400 border-amber-400/20 shadow-[0_0_10px_rgba(245,158,11,0.2)]', icon: Clock, label: 'PENDING' },
    preparing: { color: 'bg-sky-500/10 text-sky-400 border-sky-400/20 shadow-[0_0_10px_rgba(14,165,233,0.2)]', icon: Truck, label: 'ENGAGED' },
    ready: { color: 'bg-emerald-500/10 text-emerald-400 border-emerald-400/20 shadow-[0_0_10px_rgba(16,185,129,0.2)]', icon: CheckCircle2, label: 'READY' },
    delivered: { color: 'bg-emerald-500/20 text-emerald-300 border-emerald-400/30 shadow-[0_0_15px_rgba(16,185,129,0.3)]', icon: CheckCircle, label: 'EXECUTED' },
    cancelled: { color: 'bg-rose-500/10 text-rose-400 border-rose-400/20 shadow-[0_0_10px_rgba(244,63,94,0.2)]', icon: AlertCircle, label: 'ABORTED' },
  };

  const config = configs[status] || configs.pending;
  const Icon = config.icon;

  return (
    <span className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-[10px] font-black border backdrop-blur-md ${config.color} uppercase tracking-[0.1em] italic transition-all`}>
      <Icon size={12} strokeWidth={3} className="animate-pulse" />
      {config.label}
    </span>
  );
};

interface OrderCardProps {
  order: Order;
  drivers: Driver[];
  inventoryItems?: InventoryItem[];
  onEdit: (o: Order) => void;
  onUpdateStatus: (id: string, s: any) => void;
  onUpdateEta: (id: string, eta: string) => void;
  onDelete: (id: string) => void;
  onRepeat: (o: Order) => void;
  onAddToast: (title: string, msg: string, type?: any) => void;
  allOrders: Order[];
  searchQuery?: string;
  onUploadDoc?: (file: File, orderId?: string, docType?: any) => Promise<void>;
  isCompact?: boolean;
  key?: React.Key;
}

const ItemsModal = ({ 
  order, 
  inventoryItems = [],
  onClose 
}: { 
  order: Order, 
  inventoryItems?: InventoryItem[],
  onClose: () => void 
}) => {
  const parsedItems = parseItems(order.items);
  
  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4" dir="rtl">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm transition-opacity"
      />
      
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative w-full max-w-lg bg-white rounded-[2.5rem] shadow-2xl flex flex-col overflow-hidden max-h-[85vh]"
      >
        <div className="flex items-center justify-between p-6 bg-gray-900 text-white">
          <div className="flex items-center gap-3">
             <div className="p-3 bg-sky-500 rounded-2xl shadow-lg ring-4 ring-sky-500/20">
               <Package size={20} />
             </div>
             <div>
               <h2 className="text-xl font-black leading-tight">פירוט פריטי הזמנה</h2>
               <p className="text-[10px] font-bold text-sky-200 uppercase tracking-widest leading-none mt-1">
                 {order.customerName} | #{order.orderNumber || order.id?.slice(-4).toUpperCase()}
               </p>
             </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-xl transition-all"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-4">
          {parsedItems.length === 0 ? (
            <p className="text-center text-slate-500 font-bold uppercase text-[10px] tracking-widest py-12">No inventory data found</p>
          ) : (
            parsedItems.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between p-5 bg-white/5 rounded-[1.5rem] border border-white/10 hover:border-sky-400/30 transition-all group">
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-xl ${isKnownProduct(item.name) ? 'bg-sky-500/10 text-sky-400' : 'bg-slate-800 text-slate-500'} border border-white/5 group-hover:scale-110 transition-transform`}>
                    <Package size={20} />
                  </div>
                  <div>
                    <h5 className="text-white font-black text-sm uppercase tracking-tight">{item.name}</h5>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Matrix Verified</p>
                  </div>
                </div>
                <div className="text-left">
                  <span className="text-xl font-black text-sky-400 font-mono tracking-tighter italic">{item.quantity}</span>
                  <p className="text-[9px] text-slate-500 font-black uppercase tracking-widest mt-1">Units</p>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="p-8 bg-slate-950/40 border-t border-white/10">
           <button 
             onClick={onClose}
             className="w-full py-4 bg-white/5 border border-white/10 text-white rounded-[1.5rem] font-black text-xs flex items-center justify-center gap-3 hover:bg-white/10 transition-all active:scale-95 uppercase tracking-[0.2em] italic"
           >
             Close Matrix View
           </button>
        </div>
      </motion.div>
    </div>
  );
};

const DocumentSheet = ({ 
  order, 
  onClose, 
  onUpload 
}: { 
  order: Order, 
  onClose: () => void,
  onUpload?: (file: File, type: 'orderForm' | 'deliveryNote') => Promise<void>
}) => {
  const [isUploading, setIsUploading] = useState<'orderForm' | 'deliveryNote' | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const getDriveUrl = (id: string) => id === 'PENDING_SCAN' ? '#' : `https://drive.google.com/file/d/${id}/view`;
  const isPending = (id?: string) => id === 'PENDING_SCAN';
  
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>, type: 'orderForm' | 'deliveryNote') => {
    const file = e.target.files?.[0];
    if (file && onUpload) {
      setIsUploading(type);
      setUploadError(null);
      try {
        await onUpload(file, type);
      } catch (err: any) {
        console.error("Local upload error caught in DocumentSheet:", err);
        setUploadError(err.message || "נכשלה העלאת הקובץ לשרת");
      } finally {
        setIsUploading(null);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex overflow-hidden" dir="rtl">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-slate-950/90 backdrop-blur-xl transition-opacity"
      />
      
      <motion.div
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="relative w-full max-w-sm glass-panel shadow-2xl flex flex-col h-full ml-auto border-l border-white/10"
      >
        <div className="flex items-center justify-between p-8 border-b border-white/10 bg-white/5">
          <div className="flex items-center gap-4">
             <div className="p-3 bg-sky-500/20 text-sky-400 rounded-2xl shadow-lg border border-sky-400/20">
               <FileText size={24} />
             </div>
             <div>
               <h2 className="text-xl font-black text-white leading-tight uppercase italic tracking-tighter">Intel Hub</h2>
               <p className="text-[10px] font-black text-sky-400/60 uppercase tracking-widest mt-1">Order #{order.orderNumber || order.id?.slice(-4).toUpperCase()}</p>
             </div>
          </div>
          <button 
            onClick={onClose}
            className="p-3 text-slate-500 hover:text-white hover:bg-white/10 rounded-2xl transition-all active:scale-90"
          >
            <X size={24} />
          </button>
        </div>

        <div className="flex-1 p-8 space-y-8 overflow-y-auto custom-scrollbar">
          <AnimatePresence>
            {uploadError && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="flex items-center gap-4 p-5 bg-rose-500/10 border border-rose-500/20 rounded-2xl mb-6 shadow-inner"
              >
                <div className="p-2 bg-rose-500/20 rounded-xl">
                  <AlertCircle size={20} className="text-rose-400" />
                </div>
                <div className="flex-1">
                  <p className="text-xs font-black text-rose-400 uppercase tracking-widest italic">Uplink Failure</p>
                  <p className="text-[10px] font-bold text-rose-300 mt-1">{uploadError}</p>
                </div>
                <button onClick={() => setUploadError(null)} className="p-1 hover:bg-rose-500/10 rounded-lg text-rose-400 transition-colors">
                  <X size={16} />
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Order Details Summary */}
          <div className="p-6 bg-white/5 rounded-[2rem] border border-white/5 flex flex-col gap-1.5 shadow-xl">
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] italic">Mission Target / Registry</span>
            <p className="text-xl font-black text-white uppercase italic tracking-tighter">{order.customerName}</p>
            <div className="flex items-center gap-2 mt-1">
               <Truck size={12} className="text-sky-400" />
               <p className="text-xs font-bold text-slate-400 italic">{order.destination}</p>
            </div>
          </div>

          <div className="space-y-8">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-black text-white flex items-center gap-3 uppercase tracking-widest italic">
                <Paperclip size={18} className="text-sky-400" />
                Attached Intel
              </h3>
              <span className="text-[9px] font-black text-sky-400 px-2 py-0.5 bg-sky-500/10 rounded border border-sky-400/10">SECURE</span>
            </div>

            {/* Document Types */}
            {[
              { id: order.orderFormId, type: 'orderForm', label: 'Mission Specs', themeColor: 'sky' },
              { id: order.deliveryNoteId, type: 'deliveryNote', label: 'Transit Log', themeColor: 'emerald' }
            ].map((doc) => (
              <div key={doc.type} className="group relative">
                <div className={`p-6 rounded-[2.5rem] border transition-all duration-500 ${
                  doc.id ? 
                  `bg-white/5 border-white/10 shadow-2xl` : 
                  'bg-slate-950/20 border-dashed border-white/5 opacity-80'
                }`}>
                  <div className="flex items-start justify-between mb-6">
                    <div className="flex items-center gap-4">
                      <div className={`p-4 rounded-2xl ${
                        doc.id ? `bg-${doc.themeColor}-500/10 text-${doc.themeColor}-400` : 'bg-slate-800 text-slate-600'
                      } border border-white/5 shadow-inner`}>
                        <FileText size={28} />
                      </div>
                      <div>
                        <h4 className="text-sm font-black text-white uppercase tracking-tighter italic">{doc.label}</h4>
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Encrypted PDF Matrix</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-4">
                    {doc.id ? (
                      isPending(doc.id) ? (
                        <div className={`flex items-center gap-4 p-4 bg-sky-500/10 rounded-2xl border border-sky-400/20 animate-pulse shadow-inner`}>
                          <Loader2 size={18} className="animate-spin text-sky-400" />
                          <span className={`text-xs font-black text-sky-400 uppercase tracking-widest italic`}>Decrypting Intel Data...</span>
                        </div>
                      ) : (
                        <div className="flex gap-3">
                          <a 
                            href={getDriveUrl(doc.id!)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`flex-1 glass-button flex items-center justify-center gap-3 shadow-xl active:scale-95 transition-all !text-[11px]`}
                          >
                            <ExternalLink size={16} /> Open Data Stream
                          </a>
                        </div>
                      )
                    ) : (
                      <div className="p-4 rounded-xl border border-white/5 bg-slate-950/40 text-center">
                        <p className="text-[10px] font-bold text-slate-600 italic uppercase tracking-[0.1em]">No data records attached to this mission</p>
                      </div>
                    )}

                    <div className="pt-4 mt-2 border-t border-white/5 flex items-center justify-between">
                      <span className="text-[9px] font-black text-slate-500 uppercase tracking-[0.25em] italic">Data Uplink</span>
                      <label className={`flex items-center gap-3 px-5 py-2.5 rounded-xl border transition-all cursor-pointer shadow-lg active:scale-95 ${
                        isUploading === doc.type ? 
                        `bg-sky-500/20 border-sky-400/40 text-sky-400` : 
                        'bg-white/5 border-white/10 text-sky-400 hover:bg-white/10 hover:border-white/20'
                      }`}>
                        {isUploading === doc.type ? (
                          <Loader2 size={18} className="animate-spin" />
                        ) : (
                          <>
                            <FileUp size={16} />
                            <span className="text-[10px] font-black uppercase tracking-widest italic">New Upload</span>
                          </>
                        )}
                        <input 
                          type="file" 
                          accept="application/pdf" 
                          className="hidden" 
                          disabled={!!isUploading}
                          onChange={(e) => handleFileChange(e, doc.type as any)} 
                        />
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="p-8 bg-slate-950/40 border-t border-white/10">
           <button 
             onClick={onClose}
             className="w-full py-4 bg-white/5 border border-white/10 text-white rounded-[1.5rem] font-black text-xs flex items-center justify-center gap-3 hover:bg-white/10 transition-all active:scale-95 uppercase tracking-[0.2em] italic"
           >
             Terminate Connection
           </button>
        </div>
      </motion.div>
    </div>
  );
};

export const OrderCard = ({ 
  order, 
  drivers,
  inventoryItems = [],
  onEdit, 
  onUpdateStatus, 
  onUpdateEta,
  onDelete,
  onRepeat,
  onAddToast,
  allOrders,
  searchQuery = '',
  onUploadDoc,
  isCompact = false
}: OrderCardProps) => {
  const [isPredicting, setIsPredicting] = useState(false);
  const [showDocs, setShowDocs] = useState(false);
  const [showItems, setShowItems] = useState(false);
  const [isLocalUploading, setIsLocalUploading] = useState(false);
  const [uploadError, setUploadError] = useState(false);

  const parsedItemsCount = parseItems(order.items).length;

  const handleQuickUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && onUploadDoc) {
      setIsLocalUploading(true);
      setUploadError(false);
      try {
        await onUploadDoc(file, order.id, 'orderForm');
      } catch (err) {
        console.error("Local quick upload error:", err);
        setUploadError(true);
        setTimeout(() => setUploadError(false), 3000);
      } finally {
        setIsLocalUploading(false);
      }
    }
  };

  const handleSmartPredict = async () => {
    setIsPredicting(true);
    try {
      if ('geolocation' in navigator) {
        navigator.geolocation.getCurrentPosition(() => {});
      }
      const historicalOrders = allOrders.filter(o => o.status === 'delivered');
      const predictedEta = await predictOrderEta(order, historicalOrders);
      if (predictedEta) {
        onUpdateEta(order.id!, predictedEta);
        onAddToast('חיזוי ETA חכם', `נמצא זמן הגעה משוער: ${predictedEta} על סמך תנועה`, 'success');
      } else {
        onAddToast('שגיאה בחיזוי', 'לא הצלחתי לחשב זמן הגעה, אנא נסה שנית', 'warning');
      }
    } catch (error) {
      console.error(error);
      onAddToast('שגיאה', 'משהו השתבש בחיבור ל-AI', 'warning');
    } finally {
      setIsPredicting(false);
    }
  };

  const handleShare = () => {
    const driver = drivers.find(d => d.id === order.driverId);
    const driverName = driver?.name || order.driverId;
    const statusHebrew: Record<string, string> = {
      pending: 'ממתין',
      preparing: 'בהכנה',
      ready: 'מוכן',
      delivered: 'סופק',
      cancelled: 'בוטל'
    };
    const text = `📦 *הזמנה #${order.orderNumber || order.id?.slice(-4).toUpperCase()}*\n👤 לקוח: ${order.customerName}\n📍 יעד: ${order.destination}\n🚛 נהג: ${driverName}\n⏰ שעה: ${order.time}\n📊 סטטוס: ${statusHebrew[order.status] || order.status}`;
    
    if (navigator.share) {
      navigator.share({ title: 'שיתוף הזמנה', text }).catch(console.error);
    } else {
      navigator.clipboard.writeText(text);
      onAddToast('הועתק', 'פרטי ההזמנה הועתקו ללוח', 'success');
    }
  };

  const driver = drivers.find(d => d.id === order.driverId);

  return (
    <motion.div 
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "cockpit-card border-white/10 hover:border-sky-400/40 hover:shadow-2xl hover:shadow-sky-500/10 transition-all transition-duration-500 relative group overflow-hidden",
        isCompact ? "p-6" : "p-8"
      )}
    >
      <div className={cn(
        "absolute bg-slate-950/80 text-sky-100 px-4 py-1.5 rounded-xl text-[10px] font-black z-10 shadow-lg border border-white/10 font-mono uppercase tracking-[0.2em] italic",
        isCompact ? "top-3 left-3" : "top-6 left-6"
      )}>
        {order.orderNumber || order.id?.slice(-4).toUpperCase()}
      </div>

      {!isCompact && (
        <div className="absolute top-6 left-32 z-10 flex gap-3">
          {onUploadDoc && (
            <div className="flex items-center gap-3">
              {(order.orderFormId || order.deliveryNoteId) ? (
                <button 
                  onClick={() => setShowDocs(!showDocs)}
                  disabled={order.orderFormId === 'PENDING_SCAN' || order.deliveryNoteId === 'PENDING_SCAN'}
                  className={`p-2 rounded-xl shadow-xl border transition-all active:scale-90 ${
                    showDocs ? 'bg-sky-500 text-white border-sky-400' : 
                    (order.orderFormId === 'PENDING_SCAN' || order.deliveryNoteId === 'PENDING_SCAN') ? 'bg-slate-800 text-slate-600 border-white/5 cursor-not-allowed' :
                    'bg-slate-900/60 text-sky-400 border-white/10 hover:bg-white/10'
                  }`}
                  title={order.orderFormId === 'PENDING_SCAN' || order.deliveryNoteId === 'PENDING_SCAN' ? "Processing Intel..." : "Visual Insight"}
                >
                  {order.orderFormId === 'PENDING_SCAN' || order.deliveryNoteId === 'PENDING_SCAN' ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <Eye size={16} strokeWidth={3} />
                  )}
                </button>
              ) : (
                <label 
                  className={`p-2 rounded-xl shadow-xl border transition-all cursor-pointer active:scale-90 ${
                    isLocalUploading ? 'bg-sky-500/20 border-sky-400/40 text-sky-400' : 
                    uploadError ? 'bg-rose-500/20 border-rose-400/40 text-rose-500 animate-shake' : 
                    'bg-slate-900/60 text-sky-400 border-white/10 hover:bg-white/10'
                  }`}
                  title={uploadError ? "Transmission Failure" : "Data Uplink"}
                >
                  {isLocalUploading ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : uploadError ? (
                    <AlertCircle size={16} strokeWidth={3} />
                  ) : (
                    <FileUp size={16} strokeWidth={3} />
                  )}
                  <input 
                    type="file" 
                    accept="application/pdf" 
                    className="hidden" 
                    disabled={isLocalUploading}
                    onChange={handleQuickUpload}
                  />
                </label>
              )}
            </div>
          )}

          <AnimatePresence>
            {showDocs && (
              <DocumentSheet 
                order={order} 
                onClose={() => setShowDocs(false)} 
                onUpload={(file, type) => onUploadDoc ? onUploadDoc(file, order.id, type) : Promise.resolve()}
              />
            )}
          </AnimatePresence>
        </div>
      )}

      <div className={cn(
        "flex gap-6 pt-4",
        isCompact ? "mb-6" : "mb-8 text-right"
      )}>
        <div className={cn(
          "rounded-[2rem] h-fit border flex items-center justify-center relative transition-shadow",
          driver?.vehicleType === 'crane' ? 'bg-sky-500/10 text-sky-400 border-sky-400/30' : 'bg-blue-500/10 text-blue-400 border-blue-400/30',
          isCompact ? "p-4" : "p-6 shadow-[0_0_20px_rgba(14,165,233,0.15)]"
        )}>
          <Truck size={isCompact ? 24 : 36} strokeWidth={2.5} className="relative z-10" />
          <div className="absolute inset-0 bg-sky-400 blur-2xl opacity-10 rounded-full" />
        </div>
        <div className="flex-1 min-w-0 flex flex-col justify-center">
          <h3 className={cn(
            "font-black text-white leading-tight mb-2 truncate uppercase tracking-tighter italic",
            isCompact ? "text-xl" : "text-3xl"
          )}>
            {highlightText(order.customerName, searchQuery)}
          </h3>
          <div className="flex flex-wrap items-center gap-3">
            <p className="text-[11px] text-slate-400 font-black uppercase tracking-[0.1em] flex items-center gap-2 italic">
               <Info size={12} className="text-sky-400" /> {highlightText(order.destination, searchQuery)}
            </p>
          </div>
        </div>
      </div>

      <div className={cn(
        "flex items-center justify-between bg-white/5 rounded-[1.5rem] border border-white/5",
        isCompact ? "p-4 mb-6" : "p-6 mb-8"
      )} dir="rtl">
        <div className="flex flex-col gap-1.5">
          {!isCompact && <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] italic pr-1">Fleet / ETA</span>}
          <div className="flex items-center gap-3">
            {order.driverId === 'self' ? (
              <span className={cn("font-black text-white uppercase italic", isCompact ? "text-sm" : "text-base")}>Direct Retrieval</span>
            ) : (
              <div className="flex items-center gap-3">
                {driver?.avatar ? (
                  <div className="relative group">
                    <img 
                      src={driver.avatar} 
                      alt={driver.name} 
                      className={cn("rounded-full object-cover border-2 border-sky-400/30 shadow-lg", isCompact ? "w-6 h-6" : "w-10 h-10")}
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 bg-sky-400 rounded-full blur-md opacity-0 group-hover:opacity-30 transition-opacity" />
                  </div>
                ) : (
                  <div className={cn("rounded-full bg-slate-800 flex items-center justify-center border-2 border-white/10 shadow-lg text-sky-400", isCompact ? "w-6 h-6" : "w-10 h-10")}>
                    <User size={isCompact ? 12 : 20} />
                  </div>
                )}
                <span className={cn("font-black text-white leading-tight uppercase italic truncate max-w-[100px]", isCompact ? "text-sm" : "text-base")}>
                  {driver?.name.split(' ')[0]}
                </span>
              </div>
            )}
            <div className="h-4 w-[1px] bg-white/10 mx-1" />
            <span className={cn("font-black text-sky-400 font-mono tracking-tighter italic", isCompact ? "text-sm" : "text-xl")}>{order.time}</span>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1">
          <StatusBadge status={order.status} />
          {isPredicting ? (
            <div className="flex items-center gap-1.5 mt-1">
              <Sparkles size={12} className="text-sky-400 animate-pulse" />
              <div className="w-16 h-3 bg-sky-100/50 rounded-full overflow-hidden relative border border-sky-100">
                <div className="absolute inset-0 shimmer-anim" />
              </div>
            </div>
          ) : order.eta && (
            <span className="text-[10px] font-black text-sky-600 animate-pulse flex items-center gap-1">
              <Sparkles size={10} />
              צפי: {order.eta}
            </span>
          )}
        </div>
      </div>

      <div className="space-y-4">
        {!isCompact ? (
          <div className="bg-sky-50/30 p-4 rounded-[1.5rem] border border-sky-100/50 flex items-center justify-between group/items">
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm border border-sky-100 transition-transform group-hover/items:scale-110">
                  <Package size={20} className="text-sky-600" />
                </div>
                <div>
                  <span className="text-[10px] font-black text-sky-700/60 uppercase tracking-widest block leading-none mb-1">תכולת משלוח</span>
                  <p className="text-xs font-black text-gray-700 leading-none">
                    {parsedItemsCount} פריטים רשומים
                  </p>
                </div>
            </div>
            
            <button 
              onClick={() => setShowItems(true)}
              className="px-4 py-2 bg-white text-sky-600 border border-sky-200 rounded-xl font-black text-[11px] shadow-sm hover:bg-sky-600 hover:text-white hover:border-sky-600 transition-all active:scale-95"
            >
              צפייה בפריטים
            </button>
          </div>
        ) : (
          <button 
            onClick={() => setShowItems(true)}
            className="w-full flex items-center justify-between p-3 bg-sky-50/30 hover:bg-sky-100/50 rounded-xl border border-sky-100/50 transition-colors"
          >
            <div className="flex items-center gap-2">
              <Package size={14} className="text-sky-600" />
              <span className="text-[11px] font-black text-gray-700">{parsedItemsCount} פריטים</span>
            </div>
            <ChevronLeft size={14} className="text-sky-400" />
          </button>
        )}

        <AnimatePresence>
          {showItems && (
            <ItemsModal order={order} inventoryItems={inventoryItems} onClose={() => setShowItems(false)} />
          )}
        </AnimatePresence>

        <div className={cn(
          "flex items-center gap-2 pt-2 border-t border-gray-100",
          isCompact ? "flex-wrap justify-end" : ""
        )}>
          <button 
            onClick={() => {
              const nextStatusMap: Record<string, string> = {
                pending: 'preparing',
                preparing: 'ready',
                ready: 'delivered'
              };
              onUpdateStatus(order.id!, nextStatusMap[order.status] || order.status);
            }}
            className={cn(
              "bg-sky-600 text-white rounded-2xl font-black text-xs flex items-center justify-center gap-2 shadow-lg shadow-sky-600/20 active:scale-95 transition-all",
              isCompact ? "px-3 py-2" : "flex-1 py-3.5"
            )}
          >
            <CheckCircle2 size={isCompact ? 14 : 16} /> 
            {isCompact ? "קדם" : "עדכן סטטוס"}
          </button>
          
          {isCompact ? (
             <div className="flex items-center gap-1">
               <button onClick={() => onEdit(order)} className="p-2 text-gray-400 hover:text-sky-600 hover:bg-sky-50 rounded-xl">
                 <Pencil size={14} />
               </button>
               <button onClick={handleShare} className="p-2 text-gray-400 hover:text-sky-600 hover:bg-sky-50 rounded-xl">
                 <Share2 size={14} />
               </button>
               <button 
                onClick={() => {
                  if (window.confirm('האם למחוק הזמנה זו?')) onDelete(order.id!);
                }}
                className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl"
               >
                 <Trash2 size={14} />
               </button>
             </div>
          ) : (
            <>
              <button 
                onClick={handleSmartPredict}
                disabled={isPredicting}
                className="bg-gray-900 text-white p-3.5 rounded-2xl hover:bg-sky-700 transition-all flex items-center justify-center gap-2 shadow-lg shadow-gray-900/10 active:scale-95 disabled:opacity-50"
              >
                {isPredicting ? (
                  <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                ) : (
                  <Sparkles size={18} />
                )}
                <span className="hidden sm:inline text-xs font-bold">AI ETA</span>
              </button>

              <button 
                onClick={handleShare}
                title="שתף הזמנה"
                className="bg-white border-2 border-gray-100 text-gray-600 p-3.5 rounded-2xl hover:bg-sky-50 hover:text-sky-600 hover:border-sky-100 transition-all active:scale-95 shadow-sm"
              >
                <Share2 size={18} />
              </button>

              <button 
                onClick={() => onEdit(order)}
                title="ערוך הזמנה"
                className="p-3.5 text-gray-400 hover:text-sky-600 hover:bg-sky-50 rounded-2xl transition-all"
              >
                <Pencil size={18} />
              </button>

              <button 
                onClick={() => onRepeat(order)}
                title="הזמנה חוזרת (שכפול)"
                className="p-3.5 text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded-2xl transition-all"
              >
                <RotateCcw size={18} />
              </button>

              <button 
                onClick={() => {
                  if (window.confirm('האם אתה בטוח שברצונך למחוק את ההזמנה לצמיתות?')) {
                    onDelete(order.id!);
                  }
                }}
                className="p-3.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-2xl transition-all"
              >
                <Trash2 size={18} />
              </button>
            </>
          )}
        </div>
      </div>
    </motion.div>
  );
};
