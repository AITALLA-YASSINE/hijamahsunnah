import React, { useState } from 'react';
import Head from 'next/head';
import { createClient } from '@supabase/supabase-js';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ShieldCheck, Lock, Calendar, Clock, 
  Trash2, AlertTriangle, CheckCircle, 
  ArrowLeft, LogOut, Loader2 
} from 'lucide-react';

export default function AdminHijama() {
  const [dateDebut, setDateDebut] = useState('');
  const [dateFin, setDateFin] = useState('');
  const [heure, setHeure] = useState('');
  const [motif, setMotif] = useState('CONGÉS / FERMÉ');
  const [statut, setStatut] = useState({ msg: '', type: '' });
  const [autorise, setAutorise] = useState(false);
  const [motDePasse, setMotDePasse] = useState('');
  const [loading, setLoading] = useState(false);

  const obtenirClient = () => {
    return createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY
    );
  };

  const verifierMotDePasse = () => {
    const secret = process.env.NEXT_PUBLIC_ADMIN_PASS; 
    if (motDePasse === secret && secret !== undefined) {
      setAutorise(true);
      setStatut({ msg: 'Accès autorisé', type: 'success' });
    } else {
      setStatut({ msg: 'Mot de passe incorrect', type: 'error' });
    }
  };

  const executerBlocage = async (mode) => {
    if (!dateDebut) return setStatut({ msg: "Date de début manquante", type: 'error' });
    
    setLoading(true);
    setStatut({ msg: 'Traitement en cours...', type: 'info' });
    
    const supabase = obtenirClient();
    let entrees = [];

    if (mode === 'unique') {
      if (!heure) {
        setLoading(false);
        return setStatut({ msg: "Heure requise", type: 'error' });
      }
      entrees = [{ 
        nom: '🚫 ADMIN_BLOQUÉ', date: dateDebut, time_slot: heure, 
        prestation: motif, telephone: '0000', email: 'admin@hijama.com' 
      }];
    } else {
      const debut = new Date(dateDebut);
      let fin = dateFin ? new Date(dateFin) : debut;
      if (fin < debut) fin = debut;

      let d = new Date(debut);
      while (d <= fin) {
        const dateActuelle = d.toISOString().split('T')[0];
        const jourSemaine = d.getDay();
        const estWeekend = (jourSemaine === 0 || jourSemaine === 6);
        const horaires = estWeekend 
          ? ["09:00", "09:30", "10:00", "10:30", "11:00", "11:30", "12:00", "12:30", "13:00", "13:30", "14:00", "14:30", "15:00", "15:30", "16:00", "16:30", "17:00", "17:30", "18:00"]
          : ["18:00", "18:30", "19:00", "19:30", "20:00"];

        horaires.forEach(h => {
          entrees.push({ 
            nom: '🚫 PÉRIODE_BLOQUÉE', date: dateActuelle, time_slot: h, 
            prestation: motif, telephone: '0000', email: 'admin@hijama.com' 
          });
        });
        d.setDate(d.getDate() + 1);
      }
    }

    const { error } = await supabase.from('rendez_vous').insert(entrees);
    setLoading(false);
    
    if (error) {
      setStatut({ msg: 'Erreur Supabase : ' + error.message, type: 'error' });
    } else {
      setStatut({ msg: `${entrees.length} créneaux bloqués avec succès`, type: 'success' });
    }
  };

  // --- UI : ÉCRAN DE CONNEXION ---
  if (!autorise) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-6 font-sans">
        <motion.div 
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md bg-[#111] border border-white/10 p-8 rounded-3xl shadow-2xl"
        >
          <div className="flex justify-center mb-6">
            <div className="p-4 bg-[#8b9d83]/10 rounded-full">
              <Lock className="w-8 h-8 text-[#8b9d83]" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-center text-white mb-2">Console Sécurisée</h1>
          <p className="text-gray-400 text-center text-sm mb-8">Entrez votre clé d'accès pour gérer le planning</p>
          
          <input 
            type="password" 
            placeholder="Mot de passe"
            value={motDePasse}
            onChange={(e) => setMotDePasse(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && verifierMotDePasse()}
            className="w-full bg-black border border-white/10 rounded-xl px-4 py-4 text-white text-center focus:border-[#8b9d83] outline-none transition-all mb-4"
          />
          
          <button 
            onClick={verifierMotDePasse}
            className="w-full bg-[#8b9d83] hover:bg-[#7a8c72] text-black font-bold py-4 rounded-xl transition-all flex items-center justify-center gap-2"
          >
            <ShieldCheck className="w-5 h-5" /> DÉVERROUILLER
          </button>

          {statut.type === 'error' && (
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-red-400 text-center mt-4 text-sm font-mono">
              {statut.msg}
            </motion.p>
          )}
        </motion.div>
      </div>
    );
  }

  // --- UI : PANNEAU DE CONTRÔLE ---
  return (
    <div className="min-h-screen bg-[#050505] text-gray-200 p-4 md:p-12 font-sans">
      <Head><title>Admin | Hijama Sunnah</title></Head>
      
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-12 gap-4">
          <div className="text-center md:text-left">
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
              <span className="text-[#8b9d83]">●</span> GESTION PLANNING 
            </h1>
            <p className="text-gray-500 text-sm mt-1 uppercase tracking-widest">Hijama Sunnah v3.0</p>
          </div>
          <button 
            onClick={() => window.location.reload()}
            className="flex items-center gap-2 text-gray-500 hover:text-white transition-colors text-sm border border-white/10 px-4 py-2 rounded-full"
          >
            <LogOut className="w-4 h-4" /> Déconnexion
          </button>
        </div>

        {/* Main Card */}
        <div className="bg-[#111] border border-white/5 rounded-[2rem] p-6 md:p-10 shadow-2xl relative overflow-hidden">
          <div className="grid md:grid-cols-2 gap-8">
            
            {/* Section Dates */}
            <div className="space-y-6">
              <div className="flex items-center gap-3 text-[#8b9d83] mb-2">
                <Calendar className="w-5 h-5" />
                <h2 className="font-semibold uppercase text-xs tracking-tighter">Configuration Date</h2>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="text-[10px] text-gray-500 uppercase ml-2">Date de début</label>
                  <input type="date" value={dateDebut} onChange={(e) => setDateDebut(e.target.value)} className="w-full bg-black/50 border border-white/10 rounded-xl p-4 mt-1 focus:border-[#8b9d83] outline-none" />
                </div>
                <div>
                  <label className="text-[10px] text-gray-500 uppercase ml-2">Date de fin (Optionnel)</label>
                  <input type="date" value={dateFin} onChange={(e) => setDateFin(e.target.value)} className="w-full bg-black/50 border border-white/10 rounded-xl p-4 mt-1 focus:border-[#8b9d83] outline-none" />
                </div>
              </div>
            </div>

            {/* Section Détails */}
            <div className="space-y-6">
              <div className="flex items-center gap-3 text-[#8b9d83] mb-2">
                <Clock className="w-5 h-5" />
                <h2 className="font-semibold uppercase text-xs tracking-tighter">Détails du blocage</h2>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-[10px] text-gray-500 uppercase ml-2">Heure (Bloc unique uniquement)</label>
                  <input type="time" value={heure} onChange={(e) => setHeure(e.target.value)} className="w-full bg-black/50 border border-white/10 rounded-xl p-4 mt-1 focus:border-[#8b9d83] outline-none" />
                </div>
                <div>
                  <label className="text-[10px] text-gray-500 uppercase ml-2">Motif affiché</label>
                  <input type="text" value={motif} onChange={(e) => setMotif(e.target.value)} className="w-full bg-black/50 border border-white/10 rounded-xl p-4 mt-1 focus:border-[#8b9d83] outline-none" />
                </div>
              </div>
            </div>
          </div>

          {/* Actions Buttons */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-12">
            <button 
              disabled={loading}
              onClick={() => executerBlocage('unique')}
              className="group border border-white/10 hover:border-white/40 p-5 rounded-2xl flex items-center justify-between transition-all"
            >
              <div className="text-left">
                <p className="text-white font-bold text-sm">Bloquer un créneau</p>
                <p className="text-gray-500 text-[10px]">Un seul horaire précis</p>
              </div>
              <div className="bg-white/5 p-2 rounded-lg group-hover:bg-white/10 transition-colors">
                <Clock className="w-5 h-5 text-white" />
              </div>
            </button>

            <button 
              disabled={loading}
              onClick={() => executerBlocage('periode')}
              className="bg-[#8b9d83] hover:bg-[#9eb096] p-5 rounded-2xl flex items-center justify-between transition-all group shadow-[0_0_20px_rgba(139,157,131,0.2)]"
            >
              <div className="text-left">
                <p className="text-black font-extrabold text-sm uppercase">Bloquer Période</p>
                <p className="text-black/60 text-[10px]">Tous les créneaux des jours choisis</p>
              </div>
              <div className="bg-black/10 p-2 rounded-lg">
                <Calendar className="w-5 h-5 text-black" />
              </div>
            </button>
          </div>

          {/* Status Bar */}
          <AnimatePresence>
            {statut.msg && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                className={`mt-8 p-4 rounded-xl flex items-center gap-3 border ${
                  statut.type === 'error' ? 'bg-red-500/10 border-red-500/20 text-red-400' : 
                  statut.type === 'success' ? 'bg-green-500/10 border-green-500/20 text-green-400' : 
                  'bg-blue-500/10 border-blue-500/20 text-blue-400'
                }`}
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 
                 statut.type === 'error' ? <AlertTriangle className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
                <span className="text-xs font-mono uppercase font-bold tracking-tight">{statut.msg}</span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Note de sécurité */}
       
      </div>

      <style jsx global>{`
        input::-webkit-calendar-picker-indicator { filter: invert(1); opacity: 0.5; cursor: pointer; }
        input::-webkit-calendar-picker-indicator:hover { opacity: 1; }
      `}</style>
    </div>
  );
}
