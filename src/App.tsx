/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  FileText,
  Plus, 
  Search, 
  Truck, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  User, 
  LogOut, 
  MessageSquare, 
  Send,
  Calendar as CalendarIcon,
  Trash2,
  X,
  ChevronRight,
  ChevronLeft,
  Settings,
  MoreVertical,
  Bell,
  BellOff,
  Pencil,
  Users,
  LayoutList,
  CalendarDays,
  Table,
  Trello,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Info,
  CheckCircle,
  AlertTriangle,
  Sparkles,
  Package,
  Menu,
  FileUp,
  Paperclip,
  Loader2,
  ListTodo,
  FileSpreadsheet
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { collection, onSnapshot, query, where, orderBy, deleteDoc, doc, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';
import { 
  format, 
  addDays, 
  subDays, 
  isSameDay, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  eachDayOfInterval, 
  isSameMonth,
  addMonths,
  subMonths
} from 'date-fns';
import { he } from 'date-fns/locale';
import { auth, loginWithGoogle, logout, db } from './lib/firebase';
import MorningReportSystem from './components/MorningReportSystem';
import { OrderCard, StatusBadge } from './components/OrderCard';
import { KanbanBoard } from './components/KanbanBoard';
import { highlightText, parseItems } from './lib/utils';
import { DriverList } from './components/DriverList';
import { DriverCard } from './components/DriverCard';
import { SearchSuggestions } from './components/SearchSuggestions';
import { NoaChat } from './components/NoaChat';
import { initOneSignal, sendOrderNotification } from './services/notificationService';
import { DeliveryImport } from './components/DeliveryImport';
import { InventoryManager } from './components/InventoryManager';
import { 
  createOrder, 
  updateOrder, 
  updateDriver,
  deleteOrder, 
  askNoa, 
  predictOrderEta,
  getPrivateChatHistory,
  createDriver,
  createReminder,
  updateReminder,
  deleteReminder,
  syncInventoryOnDelivery
} from './services/auraService';
import { Order, Driver, Customer, Reminder, InventoryItem } from './types';
import { useUserMemory } from './hooks/useUserMemory';
import { uploadFileToDrive } from './services/driveService';
import OperationalMap from './components/OperationalMap';

// --- Components ---

const SortIcon = ({ field, currentSort, direction }: { field: string, currentSort: string, direction: 'asc' | 'desc' }) => {
  if (currentSort !== field) return <ArrowUpDown size={12} className="inline mr-2 opacity-20" />;
  return direction === 'asc' ? <ArrowUp size={12} className="inline mr-2 text-sky-600" /> : <ArrowDown size={12} className="inline mr-2 text-sky-600" />;
};

const Header = ({ 
  user, 
  notificationsEnabled, 
  onToggleNotifications,
  onOpenSidebar,
  isUploading,
  onOpenReminders
}: { 
  user: FirebaseUser, 
  notificationsEnabled: boolean, 
  onToggleNotifications: () => void,
  onOpenSidebar: () => void,
  isUploading?: boolean,
  onOpenReminders: () => void
}) => (
  <header className="flex items-center justify-between px-6 py-4 glass-panel sticky top-0 z-40 light-stroke mb-8">
    <div className="flex items-center gap-4">
      <button 
        onClick={onOpenSidebar}
        className="p-2 hover:bg-white/10 rounded-xl text-sky-400 md:hidden transition-colors"
      >
        <Menu size={24} />
      </button>
      <div className="flex items-center gap-3">
        <div className="bg-sky-500/20 p-2 rounded-xl border border-sky-400/20 shadow-[0_0_20px_rgba(14,165,233,0.3)]">
          <Truck className="text-sky-400" size={24} />
        </div>
        <div className="hidden sm:block">
          <h1 className="text-lg font-black text-white leading-tight tracking-[0.2em] uppercase font-mono">SabanOS</h1>
          <p className="text-[9px] text-sky-400/70 font-black uppercase tracking-[0.3em] mt-0.5">Fleet Core: Ready</p>
        </div>
      </div>
    </div>
    
    <div className="flex items-center gap-4">
      <div className="hidden lg:flex items-center gap-2.5 px-4 py-1.5 bg-white/5 rounded-full border border-white/10">
        <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_12px_rgba(16,185,129,0.6)]" />
        <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest italic">Operational</span>
      </div>

      <div className="flex items-center gap-2">
        <button 
          onClick={onOpenReminders}
          className="p-2.5 rounded-xl bg-white/5 text-sky-400 border border-white/10 hover:bg-white/10 transition-all active:scale-95 shadow-lg"
        >
          <ListTodo size={20} />
        </button>

        <button 
          onClick={onToggleNotifications}
          className={`p-2.5 rounded-xl transition-all border shadow-lg active:scale-95 ${notificationsEnabled ? 'bg-sky-500/20 text-sky-400 border-sky-400/30 shadow-[0_0_10px_rgba(14,165,233,0.3)]' : 'bg-white/5 text-slate-500 border-white/10 opacity-70'}`}
        >
          {notificationsEnabled ? <Bell size={20} /> : <BellOff size={20} />}
        </button>
      </div>

      <div className="h-8 w-[1px] bg-white/10 mx-1 hidden sm:block" />

      <div className="flex items-center gap-4">
        <div className="hidden md:flex flex-col items-end">
          <span className="text-xs font-black text-white uppercase tracking-tighter italic">{user.displayName}</span>
          <button onClick={logout} className="text-[9px] font-bold text-rose-400/70 hover:text-red-400 transition-colors uppercase tracking-[0.1em]">Disconnect</button>
        </div>
        <div className="relative group">
          <div className="absolute inset-0 bg-sky-400 rounded-full blur-md opacity-0 group-hover:opacity-30 transition-opacity" />
          <img src={user.photoURL || ''} alt="" className="w-10 h-10 rounded-full border border-white/20 relative z-10 shadow-xl" referrerPolicy="no-referrer" />
        </div>
      </div>
    </div>
  </header>
);

const DashboardGauges = ({ orders, drivers }: { orders: Order[], drivers: Driver[] }) => {
  const activeOrders = orders.filter(o => o.status !== 'delivered' && o.status !== 'cancelled').length;
  const readyOrders = orders.filter(o => o.status === 'ready').length;
  const activeDrivers = drivers.filter(d => d.status === 'active').length;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12 px-6">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="cockpit-card p-8 border-sky-400/20 bg-gradient-to-br from-sky-950/40 to-slate-900/60 relative group"
      >
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-6">
            <span className="text-[11px] font-black text-sky-400 uppercase tracking-[0.2em] italic">Fleet Engagement</span>
            <div className="p-2 bg-sky-400/10 rounded-lg border border-sky-400/10">
              <Truck size={18} className="text-sky-400" />
            </div>
          </div>
          <div className="flex items-end gap-3">
            <h3 className="text-5xl font-black text-white font-mono tracking-tighter">{activeDrivers}</h3>
            <span className="text-xs font-black text-sky-400/60 pb-1.5 uppercase tracking-widest italic">Units Active</span>
          </div>
          <div className="mt-6 h-2 bg-slate-950/60 rounded-full overflow-hidden border border-white/5 p-[1px]">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: '75%' }}
              className="h-full bg-sky-400 shadow-[0_0_15px_rgba(56,189,248,0.6)] rounded-full"
            />
          </div>
        </div>
        <div className="absolute -right-8 -bottom-8 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity duration-500 text-white transform group-hover:scale-110">
          <Truck size={200} />
        </div>
      </motion.div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="cockpit-card p-8 border-emerald-400/20 bg-gradient-to-br from-emerald-950/40 to-slate-900/60 relative group"
      >
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-6">
            <span className="text-[11px] font-black text-emerald-400 uppercase tracking-[0.2em] italic">Payload Logistics</span>
            <div className="p-2 bg-emerald-400/10 rounded-lg border border-emerald-400/10">
              <Package size={18} className="text-emerald-400" />
            </div>
          </div>
          <div className="flex items-end gap-3">
            <h3 className="text-5xl font-black text-white font-mono tracking-tighter">{activeOrders}</h3>
            <span className="text-xs font-black text-emerald-400/60 pb-1.5 uppercase tracking-widest italic">Active Loads</span>
          </div>
          <div className="mt-6 flex gap-1.5">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className={`h-2.5 flex-1 rounded-sm border border-white/5 ${i < 6 ? 'bg-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.5)]' : 'bg-slate-950/60'}`} />
            ))}
          </div>
        </div>
        <div className="absolute -right-8 -bottom-8 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity duration-500 text-white transform group-hover:scale-110">
          <Package size={200} />
        </div>
      </motion.div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="cockpit-card p-8 border-amber-400/20 bg-gradient-to-br from-amber-950/40 to-slate-900/60 relative group"
      >
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-6">
            <span className="text-[11px] font-black text-amber-400 uppercase tracking-[0.2em] italic">Mission Readiness</span>
            <div className="p-2 bg-amber-400/10 rounded-lg border border-amber-400/10">
              <CheckCircle size={18} className="text-amber-400" />
            </div>
          </div>
          <div className="flex items-end gap-3">
            <h3 className="text-5xl font-black text-white font-mono tracking-tighter">{readyOrders}</h3>
            <span className="text-xs font-black text-amber-400/60 pb-1.5 uppercase tracking-widest italic">Ready Units</span>
          </div>
          <div className="mt-6 flex justify-between items-center text-[10px] font-black uppercase tracking-widest italic">
            <span className="text-amber-400/60">Efficiency Rating</span>
            <span className="text-amber-400 shadow-[0_0_8px_rgba(245,158,11,0.3)]">92% Optimal</span>
          </div>
          <div className="mt-2.5 h-1.5 bg-slate-950/60 rounded-full overflow-hidden border border-white/5 p-[1px]">
            <div className="w-[92%] h-full bg-amber-400 rounded-full shadow-[0_0_10px_rgba(245,158,11,0.5)]" />
          </div>
        </div>
        <div className="absolute -right-8 -bottom-8 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity duration-500 text-white transform group-hover:scale-110">
          <LayoutList size={200} />
        </div>
      </motion.div>
    </div>
  );
};

const EmptyState = () => (
  <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
    <div className="bg-gray-100 p-6 rounded-full mb-4">
      <CalendarIcon className="text-gray-400" size={48} />
    </div>
    <h3 className="text-lg font-bold text-gray-800">אין הזמנות ליום הזה</h3>
    <p className="text-gray-500 mt-2 max-w-xs text-sm">הסידור ריק בינתיים. אפשר להוסיף הזמנה חדשה או לבקש מ-Aura לעזור.</p>
  </div>
);

// Drawer and other UI components...

const Sidebar = ({ 
  isOpen, 
  onClose, 
  user, 
  viewMode, 
  setViewMode, 
  onOpenReminders,
  drivers
}: { 
  isOpen: boolean, 
  onClose: () => void, 
  user: FirebaseUser, 
  viewMode: string, 
  setViewMode: (v: any) => void,
  onOpenReminders: () => void,
  drivers: Driver[]
}) => (
  <AnimatePresence>
    {isOpen && (
      <>
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-slate-950/90 backdrop-blur-xl z-[60]"
        />
        
        {/* Layer 1: Core Navigation */}
        <motion.div 
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className="fixed inset-y-0 right-0 w-80 glass-panel z-[70] flex flex-col pt-24 p-8 border-l border-white/10"
          dir="rtl"
        >
          <div className="space-y-3">
            {[
              { id: 'reports', label: 'Morning Intel', icon: FileText },
              { id: 'list', label: 'Tactical Overview', icon: LayoutList },
              { id: 'kanban', label: 'Operational Board', icon: Trello },
              { id: 'calendar', label: 'Mission Schedule', icon: CalendarDays },
              { id: 'drivers', label: 'Fleet Registry', icon: Users },
              { id: 'table', label: 'Inventory Matrix', icon: Table },
              { id: 'import', label: 'ERP Data Sync', icon: FileSpreadsheet },
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => { setViewMode(item.id); onClose(); }}
                className={`w-full flex items-center gap-4 px-6 py-4 rounded-[1.5rem] transition-all border group ${
                  viewMode === item.id 
                    ? 'bg-sky-500/20 border-sky-400/30 text-white shadow-[0_0_20px_rgba(14,165,233,0.3)]' 
                    : 'text-slate-400 border-transparent hover:bg-white/10 hover:text-sky-400'
                }`}
              >
                <item.icon size={22} className="group-hover:scale-110 transition-transform" />
                <span className="font-black uppercase tracking-[0.05em] italic text-sm">{item.label}</span>
              </button>
            ))}
          </div>

          <div className="mt-auto pt-8 border-t border-white/10">
            <button 
              onClick={() => { onOpenReminders(); onClose(); }}
              className="w-full flex items-center gap-4 px-6 py-4 rounded-[1.5rem] text-amber-400 hover:bg-amber-400/10 transition-all border border-transparent hover:border-amber-400/20 mb-4"
            >
              <ListTodo size={22} />
              <span className="font-black uppercase tracking-[0.05em] italic text-sm">Active Briefs</span>
            </button>
          </div>
        </motion.div>

        {/* Layer 2: Team Quick-Access (WhatsApp style) */}
        <motion.div
           initial={{ x: '100%' }}
           animate={{ x: 320 }} // Offset by Layer 1 width
           exit={{ x: '100%' }}
           className="fixed inset-y-0 right-0 w-80 glass-panel z-[65] hidden lg:flex flex-col pt-24 p-8 bg-slate-950/40"
           dir="rtl"
        >
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-sm font-black text-white uppercase tracking-[0.2em] italic">Team Frequency</h3>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
              <span className="text-[10px] font-black text-emerald-500 uppercase">Live</span>
            </div>
          </div>

          <div className="flex-1 space-y-6 overflow-y-auto pr-2 custom-scrollbar">
            {drivers.map(driver => (
              <div key={driver.id} className="flex items-center gap-4 p-4 rounded-[1.25rem] hover:bg-white/5 cursor-pointer transition-all border border-transparent hover:border-white/10 group">
                <div className="relative">
                  <img src={driver.avatar} className="w-11 h-11 rounded-full border-2 border-sky-500/20 group-hover:border-sky-400/40 transition-colors" alt="" />
                  <div className="absolute -bottom-0.5 -left-0.5 w-3.5 h-3.5 bg-emerald-500 border-2 border-slate-950 rounded-full" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-center mb-1">
                    <h4 className="text-xs font-black text-white truncate uppercase tracking-tighter italic">{driver.name}</h4>
                    <span className="text-[9px] font-black text-slate-500">12:45</span>
                  </div>
                  <p className="text-[10px] text-slate-400 truncate font-bold italic tracking-tight opacity-70 group-hover:opacity-100 transition-opacity">Operational update pending...</p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8 pt-8 border-t border-white/10">
             <button className="w-full glass-button !py-4 text-[10px] tracking-[0.2em]">
                Secure Channel
             </button>
          </div>
        </motion.div>
      </>
    )}
  </AnimatePresence>
);

const MobileNav = ({ viewMode, setViewMode }: { viewMode: string, setViewMode: (v: string) => void }) => (
  <div className="md:hidden fixed bottom-6 left-6 right-6 h-20 glass-panel flex items-center justify-around px-6 z-50 rounded-[2rem] border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.6)]">
    {[
      { id: 'list', icon: LayoutList },
      { id: 'chat', icon: MessageSquare },
      { id: 'kanban', icon: Trello },
      { id: 'drivers', icon: Users },
    ].map((item) => (
      <button
        key={item.id}
        onClick={() => setViewMode(item.id)}
        className={`p-4 rounded-2xl transition-all active:scale-90 ${
          viewMode === item.id 
            ? 'bg-sky-500 text-white shadow-[0_0_25px_rgba(56,189,248,0.6)] border border-sky-400/50' 
            : 'text-slate-400 hover:text-sky-400'
        }`}
      >
        <item.icon size={26} strokeWidth={viewMode === item.id ? 2.5 : 2} />
      </button>
    ))}
  </div>
);

const VoiceWidget = ({ onVoiceInput }: { onVoiceInput: () => void }) => (
  <div className="fixed bottom-32 right-6 md:bottom-12 md:right-12 z-50">
    <motion.button
      whileHover={{ scale: 1.1, rotate: 5 }}
      whileTap={{ scale: 0.9 }}
      onClick={onVoiceInput}
      className="w-18 h-18 bg-sky-500 text-white rounded-full flex items-center justify-center shadow-[0_0_35px_rgba(56,189,248,0.4)] border-2 border-white/20 group relative backdrop-blur-md"
    >
      <div className="absolute inset-0 bg-sky-400 rounded-full animate-ping opacity-20 pointer-events-none group-hover:block hidden" />
      <Sparkles size={32} />
    </motion.button>
  </div>
);

const RemindersSidebar = ({ 
  isOpen, 
  onClose, 
  reminders,
  onToggleComplete,
  onDelete
}: { 
  isOpen: boolean, 
  onClose: () => void,
  reminders: Reminder[],
  onToggleComplete: (id: string, completed: boolean) => void,
  onDelete: (id: string) => void
}) => (
  <AnimatePresence>
    {isOpen && (
      <>
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-slate-950/90 backdrop-blur-xl z-[80]"
        />
        <motion.div 
          initial={{ x: '-100%' }}
          animate={{ x: 0 }}
          exit={{ x: '-100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className="fixed inset-y-0 left-0 w-96 glass-panel z-[90] flex flex-col p-10 overflow-y-auto"
          dir="rtl"
        >
          <div className="flex justify-between items-center mb-12">
            <div className="flex items-center gap-4">
              <div className="bg-sky-500/20 p-2.5 rounded-2xl text-sky-400 border border-sky-400/20 shadow-inner">
                <ListTodo size={24} />
              </div>
              <div>
                <h2 className="text-2xl font-black text-white italic tracking-widest uppercase">Protocol</h2>
                <p className="text-[10px] font-black text-sky-400/60 uppercase tracking-[0.2em] mt-1">Status: Active</p>
              </div>
            </div>
            <button onClick={onClose} className="p-3 hover:bg-white/10 rounded-2xl transition-all active:scale-90">
              <X size={28} className="text-slate-500" />
            </button>
          </div>

          <div className="flex-1 space-y-6">
            {reminders.length === 0 ? (
              <div className="text-center py-24 px-8 bg-white/5 rounded-[2rem] border border-white/5">
                <Sparkles size={48} className="mx-auto text-sky-400/10 mb-6" />
                <p className="text-slate-500 font-black uppercase text-[11px] tracking-[0.3em] leading-relaxed">No active protocols initialized.</p>
              </div>
            ) : (
              reminders.map((reminder) => (
                <div 
                  key={reminder.id}
                  className={`p-6 rounded-[2rem] border transition-all duration-300 ${
                    reminder.isCompleted 
                      ? 'bg-slate-950/20 border-white/5 opacity-40 grayscale scale-[0.98]' 
                      : 'bg-white/5 border-white/10 shadow-xl hover:border-sky-400/30'
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <button 
                      onClick={() => onToggleComplete(reminder.id!, !reminder.isCompleted)}
                      className={`p-3 rounded-xl transition-all shadow-lg active:scale-90 shrink-0 ${
                        reminder.isCompleted ? 'bg-emerald-500 text-white' : 'bg-slate-800 text-slate-400 hover:bg-sky-500 hover:text-white'
                      }`}
                    >
                      <CheckCircle size={20} />
                    </button>
                    <div className="flex-1 text-right min-w-0">
                      <h4 className={`font-black text-base uppercase tracking-tighter italic truncate ${reminder.isCompleted ? 'text-slate-500' : 'text-white'}`}>
                        {reminder.title}
                      </h4>
                      <div className="flex items-center gap-2 mt-2">
                        <Clock size={14} className="text-sky-400 opacity-60" />
                        <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest">{reminder.dueDate} <span className="mx-1 opacity-30">|</span> {reminder.dueTime}</span>
                      </div>
                    </div>
                    <button 
                      onClick={() => {
                        if (window.confirm('Terminate protocol?')) onDelete(reminder.id!);
                      }}
                      className="p-2 text-slate-600 hover:text-rose-500 transition-colors shrink-0"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </motion.div>
      </>
    )}
  </AnimatePresence>
);

const GridMatrix = ({ orders }: { orders: Order[] }) => {
  if (orders.length === 0) return <EmptyState />;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 p-6">
      {orders.map((order, i) => (
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.05 }}
          key={order.id}
          className={`cockpit-card p-6 group cursor-pointer border-white/10 hover:border-sky-400/40 transition-all ${
            order.status === 'delivered' ? 'status-glow-green border-emerald-500/20' : 
            order.status === 'ready' ? 'status-glow-sky border-sky-500/30' :
            order.status === 'preparing' ? 'status-glow-amber border-amber-500/20' : ''
          }`}
        >
          <div className="flex justify-between items-start mb-6">
            <span className="text-[11px] font-black text-sky-400/60 uppercase tracking-[0.1em] font-mono italic">
              {order.time} <span className="text-white/10 px-1">/</span> {order.warehouse}
            </span>
            <div className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border transition-colors ${
              order.status === 'delivered' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
              order.status === 'ready' ? 'bg-sky-500/10 text-sky-400 border-sky-500/20' :
              order.status === 'preparing' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
              'bg-white/5 text-slate-500 border-white/10'
            }`}>
              {order.status}
            </div>
          </div>
          <h4 className="text-white font-black text-xl mb-1 uppercase tracking-tighter italic truncate group-hover:text-sky-400 transition-colors">
            {order.customerName}
          </h4>
          <p className="text-slate-400 text-[11px] font-black mb-6 uppercase tracking-widest flex items-center gap-2 opacity-70">
             <Trello size={12} className="text-sky-400" /> {order.destination}
          </p>
          <div className="h-px bg-gradient-to-r from-white/10 via-white/5 to-transparent mb-6" />
          <div className="flex justify-between items-center bg-white/5 p-3 rounded-xl border border-white/5">
            <span className="text-[10px] font-black text-white/40 uppercase tracking-widest italic">Inventory Matrix</span>
            <span className="text-[11px] font-black text-sky-100 uppercase truncate max-w-[120px]">{order.items}</span>
          </div>
        </motion.div>
      ))}
    </div>
  );
};

// --- Main App ---

export default function App() {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<Order[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [isRemindersOpen, setIsRemindersOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [chatHistory, setChatHistory] = useState<any[]>([]);
  const [isAddingOrder, setIsAddingOrder] = useState(false);
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [isUploadingDoc, setIsUploadingDoc] = useState(false);
  const [toasts, setToasts] = useState<any[]>([]);
  const chatScrollRef = useRef<HTMLDivElement>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [selectedDriverId, setSelectedDriverId] = useState<string | null>(null);
  const [calendarMonth, setCalendarMonth] = useState(new Date());
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [installPrompt, setInstallPrompt] = useState<any>(null);
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());

  // --- User Memory Persistence ---
  const [settings, setSettings] = useUserMemory(user?.uid, 'ui_settings', {
    viewMode: 'kanban' as 'list' | 'calendar' | 'reports' | 'chat' | 'drivers' | 'kanban' | 'import',
    statusFilter: 'all',
    driverFilter: 'all',
    warehouseFilter: 'all',
    sortBy: 'time',
    sortDirection: 'asc' as 'asc' | 'desc',
    groupByDriver: false,
    notificationsEnabled: false,
    isRangeMode: false
  });

  const [draftOrder, setDraftOrder, clearDraftOrder] = useUserMemory(user?.uid, 'new_order_draft', {
    date: format(new Date(), 'yyyy-MM-dd'),
    time: '',
    driverId: '',
    customerName: '',
    destination: '',
    items: '',
    orderNumber: '',
    warehouse: 'החרש'
  });

  // Backward compatibility aliases for existing code
  const viewMode = settings.viewMode;
  const setViewMode = (v: any) => setSettings({ viewMode: v });

  // Load chat history from Firestore on login
  useEffect(() => {
    if (user && viewMode === 'chat' && chatHistory.length === 0) {
      getPrivateChatHistory(user.uid).then(history => {
        if (history.length > 0) setChatHistory(history);
      });
    }
  }, [user, viewMode]);
  const statusFilter = settings.statusFilter;
  const setStatusFilter = (v: any) => setSettings({ statusFilter: v });
  const driverFilter = settings.driverFilter;
  const setDriverFilter = (v: any) => setSettings({ driverFilter: v });
  const warehouseFilter = settings.warehouseFilter;
  const setWarehouseFilter = (v: any) => setSettings({ warehouseFilter: v });
  const sortBy = settings.sortBy;
  const setSortBy = (v: any) => setSettings({ sortBy: v });
  const sortDirection = settings.sortDirection;
  const setSortDirection = (v: any) => setSettings({ sortDirection: v });
  const groupByDriver = settings.groupByDriver;
  const setGroupByDriver = (v: any) => setSettings({ groupByDriver: v });
  const notificationsEnabled = settings.notificationsEnabled;
  const setNotificationsEnabled = (v: any) => setSettings({ notificationsEnabled: v });
  const isRangeMode = settings.isRangeMode;
  const setIsRangeMode = (v: any) => setSettings({ isRangeMode: v });
  const isNotificationListenerReady = useRef(false);

  useEffect(() => {
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      setInstallPrompt(e);
    });
  }, []);

  const handleInstallClick = async () => {
    if (!installPrompt) return;
    installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;
    if (outcome === 'accepted') {
      setInstallPrompt(null);
    }
  };

  const handleDriveFileUpload = async (file: File, orderId?: string, documentType: 'orderForm' | 'deliveryNote' = 'orderForm') => {
    addToast('העלאת קובץ', `מעלה את ${file.name} לדרייב...`, 'info');
    setIsUploadingDoc(true);
    try {
      const uploadResult = await uploadFileToDrive(file);
      const fileId = uploadResult?.fileId;
      
      if (!fileId) {
        const errorMsg = uploadResult?.message || uploadResult?.error || "לא התקבל מזהה קובץ מהדרייב.";
        throw new Error(errorMsg);
      }
      
      addToast('העלאה הצליחה', 'הקובץ נשמר בתיקיית SabanOS ✅', 'success');
      
      if (orderId) {
        addToast('עדכון הזמנה', 'משייכת את המסמך להזמנה...', 'info');
        const updateField = documentType === 'orderForm' ? { orderFormId: fileId } : { deliveryNoteId: fileId };
        await updateOrder(orderId, updateField);
      }

      // Suggest to Noa to analyze the new file
      handleAuraAction(`העליתי עכשיו את הקובץ ${file.name} לדרייב. ${orderId ? `זה שייך להזמנה ${orderId}.` : ''} סרקי אותו ותגידי לי מה נסגר.`);
    } catch (error: any) {
      console.error("Upload error:", error);
      addToast('שגיאת העלאה', `לא הצלחתי להעלות: ${error.message}`, 'warning');
      throw error;
    } finally {
      setIsUploadingDoc(false);
    }
  };

  const handleStatusUpdate = async (id: string, newStatus: Order['status']) => {
    try {
      await updateOrder(id, { status: newStatus });
      
      const order = orders.find(o => o.id === id);
      if (order) {
        const statusLabels: Record<string, string> = {
          pending: 'ממתין',
          preparing: 'בהכנה',
          ready: 'מוכן',
          delivered: 'סופק',
          cancelled: 'בוטל'
        };
        sendOrderNotification(
          'עדכון סטטוס! 🔄', 
          `ההזמנה של ${order.customerName} עודכנה ל-${statusLabels[newStatus] || newStatus}`
        );
      }

      // Auto-predict ETA when status changes to 'preparing'
      if (newStatus === 'preparing') {
        const order = orders.find(o => o.id === id);
        if (order) {
          addToast('מחשבת צפי הגעה', `מעדכנת צפי ל-${order.customerName}...`, 'info');
          const predictedEta = await predictOrderEta(order, orders.filter(o => o.status === 'delivered'));
          if (predictedEta) {
            await updateOrder(id, { eta: predictedEta });
            addToast('צפי עודכן אוטומטית', `צפי הגעה ל-${order.customerName}: ${predictedEta}`, 'success');
          }
        }
      }

      // Update driver metrics when delivered
      if (newStatus === 'delivered') {
        const order = orders.find(o => o.id === id);
        if (order) {
          await syncInventoryOnDelivery(order);
          
          if (order.driverId && order.driverId !== 'self') {
            const driver = drivers.find(d => d.id === order.driverId);
            if (driver) {
              await updateDriver(driver.id, { 
                totalDeliveries: (driver.totalDeliveries || 0) + 1 
              });
            }
          }
        }
      }
    } catch (error) {
      console.error(error);
      addToast('שגיאה', 'חלה שגיאה בעדכון הסטטוס. אנא נסה שוב.', 'warning');
    }
  };

  const handleRepeatOrder = async (order: Order) => {
    try {
      const newOrder: Partial<Order> = {
        customerName: order.customerName,
        destination: order.destination,
        items: order.items,
        warehouse: order.warehouse,
        driverId: order.driverId,
        date: format(new Date(), 'yyyy-MM-dd'),
        time: order.time,
        status: 'pending',
        orderNumber: order.orderNumber ? `${order.orderNumber}-RE` : '',
      };
      
      await createOrder(newOrder);
      addToast('הזמנה שוכפלה', `ההזמנה של ${order.customerName} שוכפלה בהצלחה.`, 'success');
      sendOrderNotification('הזמנה חוזרת! 🔄', `שוכפלה הזמנה עבור ${order.customerName}`);
    } catch (error) {
      console.error(error);
      addToast('שגיאה', 'לא הצלחתי לשכפל את ההזמנה.', 'warning');
    }
  };

  const handleDeleteOrder = async (id: string) => {
    if (!window.confirm('האם אתה בטוח שברצונך למחוק את המשימה?')) return;
    try {
      await deleteOrder(id);
      addToast('משימה נמחקה', 'המשימה הוסרה מהרשת בהצלחה.', 'success');
    } catch (error) {
      console.error(error);
      addToast('שגיאה', 'לא ניתן היה למחוק את המשימה.', 'warning');
    }
  };

  const handleDriverUpdate = async (id: string, updates: Partial<Driver>) => {
    try {
      await updateDriver(id, updates);
      addToast('נתוני נהג עודכנו', 'המערכת סונכרנה עם המידע החדש.', 'success');
    } catch (error) {
      console.error(error);
      addToast('שגיאה', 'עדכון נהג נכשל.', 'warning');
    }
  };

  const addToast = (title: string, message: string, type: 'info' | 'success' | 'warning' = 'info') => {
    const id = Math.random().toString(36).substr(2, 9);
    setToasts(prev => [...prev, { id, title, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 5000);
  };

  // --- Auth & Init ---
  useEffect(() => {
    initOneSignal();
    return onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
  }, []);

  // --- Background Notification Listener ---
  useEffect(() => {
    if (!user || !notificationsEnabled) {
      isNotificationListenerReady.current = false;
      return;
    }

    // Listen to all active/recent orders (from 2 days ago to forever)
    const recentDate = format(subDays(new Date(), 2), 'yyyy-MM-dd');
    const q = query(
      collection(db, 'orders'),
      where('date', '>=', recentDate)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (!isNotificationListenerReady.current) {
        if (!snapshot.metadata.fromCache) {
          isNotificationListenerReady.current = true;
        }
        return;
      }

      snapshot.docChanges().forEach((change) => {
        // Skip local changes
        if (change.doc.metadata.hasPendingWrites) return;

        const order = change.doc.data() as Order;
        
        if (change.type === 'added') {
          const title = 'הזמנה חדשה! 🚛';
          const msg = `${order.customerName} - ${order.items}`;
          addToast(title, msg, 'success');
          
          if (Notification.permission === 'granted') {
            new Notification(title, { body: msg });
          }
        }
        
        if (change.type === 'modified') {
          const oldData = change.oldIndex !== -1 ? null : null; // Snapshot changes don't easily provide previous fields without state tracking
          // We'll track previous status in a specialized hook/ref if we wanted perfection, 
          // but for now let's refine the message to be more specific.
          
          const title = 'עדכון סטטוס! 🔄';
          const statusLabels: Record<string, string> = {
            pending: 'ממתין',
            preparing: 'בהכנה',
            ready: 'מוכן',
            delivered: 'סופק',
            cancelled: 'בוטל'
          };
          const msg = `ההזמנה של ${order.customerName} עודכנה ל-${statusLabels[order.status] || order.status}`;
          
          addToast(title, msg, order.status === 'delivered' ? 'success' : 'info');
          
          if (Notification.permission === 'granted') {
            new Notification(title, { body: msg, icon: '/vite.svg' });
          }
        }
      });
    });

    return () => {
      unsubscribe();
      isNotificationListenerReady.current = false;
    };
  }, [user, notificationsEnabled]);

  const toggleNotifications = async () => {
    if (!notificationsEnabled) {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        setNotificationsEnabled(true);
      } else {
        alert('כדי לקבל התראות יש לאשר אותן בהגדרות הדפדפן.');
      }
    } else {
      setNotificationsEnabled(false);
    }
  };

  useEffect(() => {
    if (!user) return;
    
    let startStr, endStr;
    let actualIsRange = isRangeMode;

    if (viewMode === 'calendar') {
      startStr = format(startOfMonth(calendarMonth), 'yyyy-MM-dd');
      endStr = format(endOfMonth(calendarMonth), 'yyyy-MM-dd');
      actualIsRange = true;
    } else {
      startStr = format(startDate, 'yyyy-MM-dd');
      endStr = format(endDate, 'yyyy-MM-dd');
    }
    
    let q;
    if (!actualIsRange) {
      q = query(
        collection(db, 'orders'),
        where('date', '==', startStr),
        orderBy('time', 'asc')
      );
    } else {
      q = query(
        collection(db, 'orders'),
        where('date', '>=', startStr),
        where('date', '<=', endStr),
        orderBy('date', 'asc'),
        orderBy('time', 'asc')
      );
    }

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Order[];
      setOrders(docs);
    });

    return () => unsubscribe();
  }, [user, startDate, endDate, isRangeMode, viewMode, calendarMonth]);

  // --- Fetch Drivers ---
  useEffect(() => {
    if (!user) return;
    
    const q = query(collection(db, 'drivers'), orderBy('name', 'asc'));
    const unsubscribe = onSnapshot(q, async (snapshot) => {
      if (snapshot.empty) {
        // Seed default drivers if none exist
        const DEFAULT_DRIVERS = [
          { 
            id: 'hikmat', 
            name: 'חכמת (מנוף 🏗️)', 
            phone: '050-0000001', 
            vehicleType: 'crane', 
            plateNumber: '12-345-67', 
            vehicleModel: 'Volvo FM', 
            status: 'active',
            avatar: 'https://i.postimg.cc/d3S0NJJZ/Screenshot-20250623-200646-Facebook.jpg'
          },
          { 
            id: 'ali', 
            name: 'עלי (משאית 🚛)', 
            phone: '050-0000002', 
            vehicleType: 'truck', 
            plateNumber: '89-012-34', 
            vehicleModel: 'Scania R450', 
            status: 'active',
            avatar: 'https://i.postimg.cc/tCNbgXK3/Screenshot-20250623-200744-Tik-Tok.jpg'
          }
        ];
        
        const { setDoc, doc, serverTimestamp } = await import('firebase/firestore');
        for (const driverData of DEFAULT_DRIVERS) {
          const { id, ...data } = driverData;
          await setDoc(doc(db, 'drivers', id), {
            ...data,
            totalDeliveries: 0,
            onTimeRate: 100,
            rating: 5,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
        }
      } else {
        const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Driver[];
        setDrivers(docs);

        // One-time update for existing drivers missing avatars
        const driversMissingAvatars = docs.filter(d => (d.id === 'ali' || d.id === 'hikmat') && !d.avatar);
        if (driversMissingAvatars.length > 0) {
          const { updateDoc, doc } = await import('firebase/firestore');
          for (const d of driversMissingAvatars) {
             const avatarUrl = d.id === 'ali' 
               ? 'https://i.postimg.cc/tCNbgXK3/Screenshot-20250623-200744-Tik-Tok.jpg'
               : 'https://i.postimg.cc/d3S0NJJZ/Screenshot-20250623-200646-Facebook.jpg';
             await updateDoc(doc(db, 'drivers', d.id), { avatar: avatarUrl });
          }
        }
      }
    });

    return () => unsubscribe();
  }, [user]);

  // --- Fetch Reminders ---
  useEffect(() => {
    if (!user) return;
    
    const q = query(
      collection(db, 'reminders'),
      where('userId', '==', user.uid),
      orderBy('dueDate', 'asc'),
      orderBy('dueTime', 'asc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Reminder[];
      setReminders(docs);
    });

    return () => unsubscribe();
  }, [user]);

  // --- Fetch Inventory ---
  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'inventory'), orderBy('name', 'asc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as InventoryItem[];
      setInventoryItems(docs);
    });
    return () => unsubscribe();
  }, [user]);

  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [chatHistory]);

  // --- Aura AI Handlers ---
  const handleAuraAction = async (msg: string) => {
    if (!user) return;
    const userMsg = { role: 'user', parts: [{ text: msg }] };
    setChatHistory(prev => [...prev, userMsg]);
    
    // Save user message to Firestore
    addDoc(collection(db, `users/${user.uid}/messages`), {
      role: 'user',
      content: msg,
      timestamp: serverTimestamp()
    });

    try {
      const result = await askNoa(msg, chatHistory, user?.displayName || user?.email || 'אורח');
      
      const functionCalls = result.functionCalls;

      if (functionCalls) {
        for (const call of functionCalls) {
          if (call.name === 'create_order') {
            const args = call.args as any;
            sendOrderNotification('הזמנה חדשה! 🚛', `${args.customerName} - ${args.items}`);
          } else if (call.name === 'search_orders') {
            const { query: qStr } = call.args as any;
            setSearchQuery(qStr);
            setViewMode('list');
            addToast('חיפוש הזמנות', `מחפשת את "${qStr}" בלוח`, 'info');
          } else if (call.name === 'get_order_eta') {
            const { customerName, orderId } = call.args as any;
            let targetOrder = orders.find(o => 
              (orderId && o.id === orderId) || 
              (customerName && o.customerName.includes(customerName))
            );
            
            if (targetOrder) {
              const eta = await predictOrderEta(targetOrder, orders.filter(o => o.status === 'delivered'));
              if (eta) {
                await updateOrder(targetOrder.id!, { eta });
                addToast('צפי עודכן', `צפי הגעה ל-${targetOrder.customerName}: ${eta}`, 'success');
              }
            }
          } else if (call.name === 'create_reminder') {
            addToast('תזכורת נוצרה', 'הפעולה נרשמה בסידור ✅', 'success');
          } else if (call.name === 'search_drivers') {
            const { query: qStr } = call.args as any;
            setSearchQuery(qStr);
            setViewMode('drivers');
            addToast('חיפוש נהגים', `מחפשת נהגים בשם "${qStr}"`, 'info');
          }
        }
      }

      setChatHistory(prev => [...prev, { 
        role: 'model', 
        parts: [{ text: result.text }] 
      }]);

      // Save AI response to Firestore
      addDoc(collection(db, `users/${user.uid}/messages`), {
        role: 'model',
        content: result.text,
        timestamp: serverTimestamp()
      });
    } catch (error: any) {
      console.error(error);
      const errorMsg = "משהו השתבש בתקשורת עם נועה. נסה שוב בעוד רגע.";
      if (error.message?.includes('404')) {
        addToast('שגיאת תקשורת', 'השרת לא מגיב. וודא שהמערכת פועלת.', 'warning');
      } else {
        addToast('שגיאה', error.message || errorMsg, 'warning');
      }
    }
  };

  if (loading) return (
    <div className="h-screen w-full flex items-center justify-center bg-sky-50/30 backdrop-blur-sm">
      <motion.div 
        animate={{ rotate: 360 }} 
        transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
        className="text-sky-600"
      >
        <Truck size={40} />
      </motion.div>
    </div>
  );

  if (!user) return (
    <div className="h-screen w-full flex flex-col items-center justify-center bg-white p-6 relative overflow-hidden" dir="rtl">
      {/* Background Orbs */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-sky-100/30 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-100/20 rounded-full blur-3xl animate-pulse" />
      
      <div className="w-full max-w-md relative z-10">
        <div className="flex justify-center mb-8">
          <div className="bg-sky-600/10 p-6 rounded-3xl">
            <Truck className="text-sky-600" size={64} />
          </div>
        </div>
        <h1 className="text-4xl font-extrabold text-gray-900 text-center mb-2 tracking-tight">נועה - לוגיסטיקה חכמה</h1>
        <p className="text-center text-gray-500 mb-10 text-lg">המערכת המבצעית של ח. סבן חומרי בניין</p>
        
        <button 
          onClick={loginWithGoogle}
          className="w-full flex items-center justify-center gap-3 bg-gray-900 text-white py-4 rounded-2xl font-bold text-lg hover:bg-sky-600 transition-all shadow-xl shadow-sky-100"
        >
          <img src="https://www.google.com/favicon.ico" className="w-6 h-6" alt="" />
          כניסה עם Google
        </button>
        
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-400">© 2026 ח. סבן חומרי בניין - תפעול ולוגיסטיקה</p>
        </div>
      </div>
    </div>
  );

  if (viewMode === 'reports') {
    return <MorningReportSystem onBack={() => setViewMode('list')} drivers={drivers} />;
  }

  if (viewMode === 'chat') {
    return (
      <NoaChat 
        chatHistory={chatHistory}
        chatScrollRef={chatScrollRef}
        onBack={() => setViewMode('list')}
        onAction={handleAuraAction}
        orders={orders}
      />
    );
  }

  const filteredOrders = orders
    .filter(order => {
      const matchesSearch = 
        order.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.orderNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.destination.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.items.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesStatus = viewMode === 'kanban' ? true : (statusFilter === 'all' || order.status === statusFilter);
      const matchesDriver = driverFilter === 'all' || order.driverId === driverFilter;
      const matchesWarehouse = warehouseFilter === 'all' || order.warehouse === warehouseFilter;
      
      // Feature: Hide delivered from main board, keep in reports and kanban
      const isDelivered = order.status === 'delivered';
      const shouldHideDelivered = viewMode !== 'reports' && viewMode !== 'kanban' && isDelivered && statusFilter === 'all';
      
      return matchesSearch && matchesStatus && matchesDriver && matchesWarehouse && !shouldHideDelivered;
    })
    .sort((a: any, b: any) => {
      let comparison = 0;
      if (sortBy === 'time') {
        comparison = a.date.localeCompare(b.date);
        if (comparison === 0) comparison = a.time.localeCompare(b.time);
      } else {
        const valA = String(a[sortBy] || '');
        const valB = String(b[sortBy] || '');
        comparison = valA.localeCompare(valB, 'he', { numeric: true });
      }
      return sortDirection === 'asc' ? comparison : -comparison;
    });

  const toggleSort = (field: string) => {
    if (sortBy === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortDirection('asc');
    }
  };

  const pendingOrders = filteredOrders.filter(o => o.status === 'pending').length;
  const deliveredOrders = filteredOrders.filter(o => o.status === 'delivered').length;
  const totalOrders = filteredOrders.length;

  return (
    <div className="min-h-screen pb-20 md:pb-0 font-sans" dir="rtl">
      <AnimatePresence>
        {isAddingOrder && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => { setIsAddingOrder(false); setEditingOrder(null); }}
              className="absolute inset-0 bg-black/80 backdrop-blur-md"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-lg glass-panel rounded-[32px] overflow-hidden border border-white/10"
            >
              <div className="bg-slate-900/90 p-6 text-white flex justify-between items-center light-stroke">
                <h3 className="text-xl font-black uppercase tracking-tighter italic">{editingOrder ? 'Update Payload' : 'New Mission'}</h3>
                <button onClick={() => { setIsAddingOrder(false); setEditingOrder(null); }} className="p-2 hover:bg-white/5 rounded-xl">
                  <X size={24} className="text-sky-400" />
                </button>
              </div>
              
              <form 
                onSubmit={async (e) => {
                  e.preventDefault();
                  const form = e.target as any;
                  const data = {
                    date: form.date.value,
                    time: form.time.value,
                    driverId: form.driver.value,
                    orderNumber: form.orderNumber.value,
                    customerName: form.customer.value,
                    destination: form.destination.value,
                    items: form.items.value,
                    warehouse: form.warehouse.value as any,
                  };
                  
                  if (editingOrder) {
                    await updateOrder(editingOrder.id!, data);
                  } else {
                    await createOrder(data);
                    clearDraftOrder();
                  }
                  
                  setIsAddingOrder(false);
                  setEditingOrder(null);
                }}
                className="p-6 space-y-4 bg-slate-900/40"
              >
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-black text-sky-400 uppercase tracking-widest mb-1.5 ml-1">Arrival Date</label>
                    <input name="date" type="date" required defaultValue={editingOrder ? editingOrder.date : draftOrder.date} className="w-full bg-slate-800/40 border border-white/5 rounded-xl px-4 py-3 text-sm text-white focus:ring-2 focus:ring-sky-500/50 outline-none font-mono" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-sky-400 uppercase tracking-widest mb-1.5 ml-1">Target Time</label>
                    <input name="time" type="time" required defaultValue={editingOrder ? editingOrder.time : draftOrder.time} className="w-full bg-slate-800/40 border border-white/5 rounded-xl px-4 py-3 text-sm text-white focus:ring-2 focus:ring-sky-500/50 outline-none font-mono" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-black text-sky-400 uppercase tracking-widest mb-1.5 ml-1">Logistics Hub</label>
                    <select name="warehouse" required defaultValue={editingOrder ? editingOrder.warehouse : draftOrder.warehouse} className="w-full bg-slate-800/40 border border-white/5 rounded-xl px-4 py-3 text-sm text-white focus:ring-2 focus:ring-sky-500/50 outline-none appearance-none font-bold">
                      <option value="החרש">M-Harash</option>
                      <option value="התלמיד">M-Talmid</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-sky-400 uppercase tracking-widest mb-1.5 ml-1">Operator</label>
                    <select name="driver" required defaultValue={editingOrder ? editingOrder.driverId : (draftOrder.driverId || (drivers.length > 0 ? drivers[0].id : ''))} className="w-full bg-slate-800/40 border border-white/5 rounded-xl px-4 py-3 text-sm text-white focus:ring-2 focus:ring-sky-500/50 outline-none appearance-none font-bold">
                      {drivers.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                    </select>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-black text-sky-400 uppercase tracking-widest mb-1.5 ml-1">Target Account</label>
                    <input name="customer" required defaultValue={editingOrder ? editingOrder.customerName : draftOrder.customerName} placeholder="Client ID" className="w-full bg-slate-800/40 border border-white/5 rounded-xl px-4 py-3 text-sm text-white focus:ring-2 focus:ring-sky-500/50 outline-none font-bold" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-sky-400 uppercase tracking-widest mb-1.5 ml-1">Record ID</label>
                    <input name="orderNumber" defaultValue={editingOrder ? editingOrder.orderNumber : draftOrder.orderNumber} placeholder="Netor ID" className="w-full bg-slate-800/40 border border-white/5 rounded-xl px-4 py-3 text-sm text-white focus:ring-2 focus:ring-sky-500/50 outline-none font-mono" />
                  </div>
                </div>
                
                <div>
                  <label className="block text-[10px] font-black text-sky-400 uppercase tracking-widest mb-1.5 ml-1">Vector Destination</label>
                  <input name="destination" required defaultValue={editingOrder ? editingOrder.destination : draftOrder.destination} placeholder="Coordinates / Location" className="w-full bg-slate-800/40 border border-white/5 rounded-xl px-4 py-3 text-sm text-white focus:ring-2 focus:ring-sky-500/50 outline-none font-bold" />
                </div>
                
                <div>
                  <label className="block text-[10px] font-black text-sky-400 uppercase tracking-widest mb-1.5 ml-1">Load Specs</label>
                  <textarea 
                    name="items" 
                    required 
                    value={editingOrder ? editingOrder.items : draftOrder.items}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (editingOrder) { setEditingOrder({ ...editingOrder, items: val }); } else { setDraftOrder({ items: val }); }
                    }}
                    placeholder="Payload Data..." 
                    rows={3} 
                    className="w-full bg-slate-800/40 border border-white/5 rounded-xl px-4 py-3 text-sm text-white focus:ring-2 focus:ring-sky-500/50 outline-none resize-none font-mono" 
                  />
                </div>

                <div className="pt-4 flex items-center gap-3">
                  <button type="submit" className="flex-1 bg-sky-500 text-white py-4 rounded-2xl font-black text-lg hover:bg-sky-400 transition-all shadow-[0_0_20px_rgba(56,189,248,0.4)] h-[60px] uppercase tracking-tighter">
                    {editingOrder ? 'Update Protocol' : 'Deploy Mission'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <Sidebar 
        isOpen={isDrawerOpen} 
        onClose={() => setIsDrawerOpen(false)} 
        user={user} 
        viewMode={viewMode}
        setViewMode={setViewMode}
        onOpenReminders={() => setIsRemindersOpen(true)}
        drivers={drivers}
      />

      <RemindersSidebar 
        isOpen={isRemindersOpen} 
        onClose={() => setIsRemindersOpen(false)} 
        reminders={reminders}
        onToggleComplete={(id, completed) => updateReminder(id, { isCompleted: completed })}
        onDelete={deleteReminder}
      />

      <div className="flex flex-col min-h-screen">
        <Header 
          user={user} 
          notificationsEnabled={notificationsEnabled}
          onToggleNotifications={toggleNotifications}
          onOpenSidebar={() => setIsDrawerOpen(true)}
          onOpenReminders={() => setIsRemindersOpen(true)}
        />
        <main className="flex-1 overflow-x-hidden pt-8">

          <div className="max-w-[1600px] mx-auto">
            {/* Dashboard Controls */}
            <div className="px-6 mb-8 flex flex-col md:flex-row md:items-end justify-between gap-6">
              <div>
                <motion.div 
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex items-center gap-3 mb-2"
                >
                  <CalendarDays size={20} className="text-sky-400" />
                  <h2 className="text-2xl font-black text-white uppercase tracking-tighter font-mono italic">
                    {format(selectedDate, 'EEEE, d MMMM yyyy', { locale: he })}
                  </h2>
                </motion.div>
                <div className="flex items-center gap-2">
                  <button onClick={() => setSelectedDate(subDays(selectedDate, 1))} className="p-2 hover:bg-white/10 rounded-lg border border-white/5 text-sky-400 transition-colors"><ChevronRight size={18} /></button>
                  <button onClick={() => setSelectedDate(new Date())} className="px-4 py-2 text-[10px] font-black text-sky-400 uppercase tracking-[0.2em] hover:bg-white/10 rounded-lg border border-white/5 transition-all">Reset Clock</button>
                  <button onClick={() => setSelectedDate(addDays(selectedDate, 1))} className="p-2 hover:bg-white/10 rounded-lg border border-white/5 text-sky-400 transition-colors"><ChevronLeft size={18} /></button>
                </div>
              </div>

              <div className="flex items-center gap-3">
                 <div className="relative flex-1 md:w-80 group">
                  <div className="absolute inset-0 bg-sky-400/5 rounded-xl blur-md group-focus-within:bg-sky-400/10 transition-all" />
                  <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-sky-400/50" size={18} />
                  <input 
                    type="text" 
                    placeholder="SCAN OPERATIONAL GRID..." 
                    className="relative w-full bg-slate-900/40 border border-white/10 rounded-xl pr-12 pl-4 py-3 text-xs text-white focus:outline-none focus:border-sky-500/50 transition-all font-black uppercase tracking-widest placeholder:text-slate-700"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <button 
                  onClick={() => setIsAddingOrder(true)}
                  className="flex items-center gap-2 bg-sky-500 hover:bg-sky-400 text-white font-black px-6 py-3 rounded-xl shadow-[0_0_20px_rgba(56,189,248,0.4)] transition-all uppercase tracking-tighter"
                >
                  <Plus size={20} />
                  <span className="hidden sm:inline">New Dispatch</span>
                </button>
              </div>
            </div>

            {/* Live Gauges */}
            <DashboardGauges orders={orders} drivers={drivers} />

            <div className="px-6 pb-12">
              <AnimatePresence mode="wait">
                <motion.div
                  key={viewMode}
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 1.02 }}
                  transition={{ duration: 0.3 }}
                  className="cockpit-card min-h-[600px] border-white/5 p-0 overflow-hidden bg-slate-950/20 backdrop-blur-3xl"
                >
                  {viewMode === 'kanban' && (
                    <KanbanBoard 
                      orders={filteredOrders} 
                      drivers={drivers} 
                      searchQuery={searchQuery}
                      onOrderEdit={(o) => { setEditingOrder(o); setDraftOrder(o); setIsAddingOrder(true); }}
                      onOrderUpdateStatus={handleStatusUpdate}
                      onOrderUpdateEta={(id, eta) => updateOrder(id, { eta })}
                      onOrderDelete={handleDeleteOrder}
                      onOrderRepeat={handleRepeatOrder}
                      onAddToast={addToast}
                      onUploadDoc={handleDriveFileUpload}
                      inventoryItems={inventoryItems}
                    />
                  )}
                  {viewMode === 'list' && (
                    <div className="space-y-6 p-6">
                       <div className="h-[400px]">
                          <OperationalMap drivers={drivers} />
                       </div>
                       <div className="h-px bg-white/5" />
                       <GridMatrix orders={filteredOrders} />
                    </div>
                  )}
                  {viewMode === 'chat' && (
                    <NoaChat 
                      chatHistory={chatHistory} 
                      onAction={handleAuraAction} 
                      chatScrollRef={chatScrollRef}
                      onBack={() => setViewMode('list')}
                      orders={orders}
                    />
                  )}
                  {viewMode === 'table' && <InventoryManager items={inventoryItems} />}
                  {viewMode === 'drivers' && (
                    <DriverList 
                      drivers={drivers} 
                      orders={orders} 
                      onOrderEdit={setEditingOrder}
                      onOrderUpdateStatus={handleStatusUpdate}
                      onOrderUpdateEta={(id, eta) => updateOrder(id, { eta })}
                      onOrderDelete={handleDeleteOrder}
                      onOrderRepeat={handleRepeatOrder}
                      onAddToast={addToast}
                      onDriverSelect={setSelectedDriverId}
                      selectedDriverId={selectedDriverId}
                      searchQuery={searchQuery}
                    />
                  )}
                  {viewMode === 'calendar' && (
                    <div className="p-8 text-center">
                       <Clock size={48} className="mx-auto text-sky-400/20 mb-4" />
                       <p className="text-slate-500 font-black uppercase tracking-widest text-xs italic">Syncing with Temporal Matrix...</p>
                       <p className="text-slate-700 text-[10px] mt-2 uppercase">Switch to List or Kanban for active operations.</p>
                    </div>
                  )}
                  {viewMode === 'import' && <DeliveryImport onImportComplete={() => addToast('Import', 'ERP data synced', 'success')} />}
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </main>
      </div>

      <VoiceWidget onVoiceInput={() => setViewMode('chat')} />
      <MobileNav viewMode={viewMode} setViewMode={setViewMode} />

      <div className="fixed bottom-24 right-6 left-6 md:left-auto md:w-96 z-[100] space-y-3 pointer-events-none" dir="rtl">
        <AnimatePresence>
          {toasts.map(toast => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: 50, x: 20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, x: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className={`p-4 rounded-2xl glass-panel border pointer-events-auto flex items-center gap-4 ${
                toast.type === 'success' ? 'border-emerald-500/50' : 
                toast.type === 'warning' ? 'border-amber-500/50' : 'border-sky-500/50'
              }`}
            >
              <div className={`p-2 rounded-xl h-fit ${
                toast.type === 'success' ? 'bg-emerald-500/20 text-emerald-400' : 
                toast.type === 'warning' ? 'bg-amber-500/20 text-amber-400' : 'bg-sky-500/20 text-sky-400'
              }`}>
                {toast.type === 'success' ? <CheckCircle2 size={24} /> : 
                 toast.type === 'warning' ? <AlertTriangle size={24} /> : <Info size={24} />}
              </div>
              <div className="flex-1">
                <h4 className="font-black text-white text-[10px] uppercase tracking-widest">{toast.title}</h4>
                <p className="text-xs text-slate-400 mt-0.5 font-bold">{toast.message}</p>
              </div>
              <button 
                onClick={() => setToasts(prev => prev.filter(t => t.id !== toast.id))}
                className="text-slate-600 hover:text-white transition-colors"
              >
                <X size={18} />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
