import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { createClient } from '@supabase/supabase-js';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ShieldCheck, Lock, Calendar, Clock, 
  AlertTriangle, CheckCircle, 
  LogOut, Loader2, Users, Settings, User
} from 'lucide-react';

export default function AdminHijama() {
  const [activeTab, setActiveTab] = useState('planning'); // 'planning' ou 'clients'
  const [dateDebut, setDateDebut] = useState('');
  const [dateFin, setDateFin] = useState('');
  const [heure, setHeure] = useState('');
  const [motif, setMotif] = useState('CONGÉS / FERMÉ');
  const [statut, setStatut] = useState({ msg: '', type: '' });
  const [autorise, setAutorise] = useState(false);
  const [motDePasse, setMotDePasse] = useState('');
  const [loading, setLoading] = useState(false);
  const [rendezVous, setRendezVous] = useState([]);

  const obtenirClient = () => {
    return createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY
    );
  };

  // Charger les rendez-vous clients
  const chargerRendezVous = async () => {
    setLoading(true);
    const supabase = obtenirClient();
    const { data, error } = await supabase
      .from('rendez_vous')
      .select('*')
      .order('date', { ascending: true })
      .order('time_slot', { ascending: true });

    if (!error) {
      // On filtre pour ne garder que les vrais clients (on exclut tes blocages admin)
      const clientsSeulement = data.filter(rdv => !rdv.nom.includes('🚫'));
      setRendezVous(clientsSeulement);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (autorise && activeTab === 'clients') {
      chargerRendezVous();
    }
  }, [autorise, activeTab]);

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
    const supabase = obtenirClient();
    let entrees = [];

    if (mode === 'unique') {
      if (!heure) { setLoading(false); return setStatut({ msg: "Heure requise", type: 'error' }); }
      entrees = [{ nom: '🚫 ADMIN_BLOQUÉ', date: dateDebut, time_slot: heure, prestation: motif, telephone: '0000', email: 'admin@hijama.com' }];
    } else {
      const debut = new Date(dateDebut);
      let fin = dateFin ? new Date(dateFin) : debut;
      let d = new Date(debut);
      while (d <= fin) {
        const dateActuelle = d.toISOString().split('T')[0];
        const horaires = d.getDay() === 0 || d.getDay() === 6 
          ? ["09:00", "09:30", "10:00", "10:30", "11:00", "11:30", "12:00", "12:30", "13:00", "13:30", "14:00", "14:30", "15:00", "15:30", "16:00", "16:30", "17:00", "17:30", "18:00"]
          : ["18:00", "18:30", "19:00", "19:30", "20:00"];
        horaires.forEach(h => entrees.push({ nom: '🚫 PÉRIODE_BLOQUÉE', date: dateActuelle, time_slot: h, prestation: motif, telephone: '0000', email: 'admin@hijama.com' }));
        d.setDate(d.getDate() + 1);
      }
    }

    const { error } = await supabase.from('rendez_vous').insert(entrees);
    setLoading(false);
    if (error) setStatut({ msg: 'Erreur : ' + error.message, type: 'error' });
    else setStatut({ msg: `${entrees.length} créneaux bloqués`, type: 'success' });
  };

  if (!autorise) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-6 font-sans text-white">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md bg-[#111] border border-white/10 p-8 rounded-3xl">
          <div className="flex justify-center mb-6"><Lock className="w-10 h-10 text-[#8b9d83]" /></div>
          <h1 className="text-xl font-bold text-center mb-8">ADMINISTRATION</h1>
          <input type="password" placeholder="Code secret" value={motDePasse} onChange={(e) => setMotDePasse(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && verifierMotDePasse()} className="w-full bg-black border border-white/10 rounded-xl p-4 text-center mb-4 outline-none focus:border-[#8b9d83]" />
          <button onClick={verifierMotDePasse} className="w-full bg-[#8b9d83] text-black font-bold py-4 rounded-xl">DÉVERROUILLER</button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] text-gray-200 p-4 md:p-8 font-sans">
      <Head><title>Admin Dashboard</title></Head>
      <div className="max-w-5xl mx-auto">
        
        {/* HEADER & NAV */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-6">
          <div className="flex bg-[#111] p-1 rounded-2xl border border-white/5">
            <button 
              onClick={() => setActiveTab('planning')}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl transition-all text-sm font-bold ${activeTab === 'planning' ? 'bg-[#8b9d83] text-black' : 'text-gray-500 hover:text-white'}`}
            >
              <Settings className="w-4 h-4" /> PLANNING
            </button>
            <button 
              onClick={() => setActiveTab('clients')}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl transition-all text-sm font-bold ${activeTab === 'clients' ? 'bg-[#8b9d83] text-black' : 'text-gray-500 hover:text-white'}`}
            >
              <Users className="w-4 h-4" /> RENDEZ-VOUS
            </button>
          </div>
          <button onClick={() => window.location.reload()} className="text-gray-500 hover:text-red-400 flex items-center gap-2 text-xs uppercase tracking-widest transition-colors">
            <LogOut className="w-4 h-4" /> Quitter
          </button>
        </div>

        {/* CONTENU : GESTION PLANNING */}
        {activeTab === 'planning' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-[#111] border border-white/5 rounded-[2rem] p-6 md:p-10 shadow-2xl">
            <div className="grid md:grid-cols-2 gap-10">
              <div className="space-y-6">
                <h2 className="text-[#8b9d83] text-xs font-bold uppercase tracking-widest flex items-center gap-2"><Calendar className="w-4 h-4"/> Dates de fermeture</h2>
                <div className="space-y-4">
                  <input type="date" value={dateDebut} onChange={(e) => setDateDebut(e.target.value)} className="w-full bg-black border border-white/10 rounded-xl p-4 outline-none focus:border-[#8b9d83]" />
                  <input type="date" value={dateFin} onChange={(e) => setDateFin(e.target.value)} className="w-full bg-black border border-white/10 rounded-xl p-4 outline-none focus:border-[#8b9d83]" />
                </div>
              </div>
              <div className="space-y-6">
                <h2 className="text-[#8b9d83] text-xs font-bold uppercase tracking-widest flex items-center gap-2"><Clock className="w-4 h-4"/> Motif & Heure</h2>
                <div className="space-y-4">
                  <input type="time" value={heure} onChange={(e) => setHeure(e.target.value)} className="w-full bg-black border border-white/10 rounded-xl p-4 outline-none focus:border-[#8b9d83]" />
                  <input type="text" value={motif} onChange={(e) => setMotif(e.target.value)} className="w-full bg-black border border-white/10 rounded-xl p-4 outline-none focus:border-[#8b9d83]" />
                </div>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-10">
              <button onClick={() => executerBlocage('unique')} className="border border-white/10 hover:bg-white/5 p-5 rounded-2xl font-bold transition-all">BLOQUER UN CRÉNEAU</button>
              <button onClick={() => executerBlocage('periode')} className="bg-[#8b9d83] text-black p-5 rounded-2xl font-bold hover:bg-[#9eb096] transition-all">BLOQUER LA PÉRIODE</button>
            </div>
          </motion.div>
        )}

        {/* CONTENU : LISTE DES RENDEZ-VOUS CLIENTS */}
        {activeTab === 'clients' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
            <div className="flex justify-between items-center mb-4 px-2">
              <h2 className="text-xl font-bold">Prochains Rendez-vous</h2>
              <button onClick={chargerRendezVous} className="text-[#8b9d83] text-xs hover:underline">Actualiser</button>
            </div>
            
            {loading ? (
              <div className="flex justify-center py-20"><Loader2 className="animate-spin text-[#8b9d83]" /></div>
            ) : rendezVous.length > 0 ? (
              <div className="grid gap-3">
                {rendezVous.map((rdv) => (
                  <div key={rdv.id} className="bg-[#111] border border-white/5 p-5 rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:border-white/20 transition-all">
                    <div className="flex items-center gap-4">
                      <div className="bg-[#8b9d83]/10 p-3 rounded-full text-[#8b9d83]"><User className="w-5 h-5"/></div>
                      <div>
                        <p className="font-bold text-white uppercase">{rdv.nom}</p>
                        <p className="text-xs text-gray-500 font-mono italic">{rdv.prestation}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-8 w-full md:w-auto justify-between border-t border-white/5 md:border-none pt-3 md:pt-0">
                      <div className="text-right">
                        <p className="text-sm font-bold text-[#8b9d83]">{new Date(rdv.date).toLocaleDateString('fr-FR', {day: 'numeric', month: 'long'})}</p>
                        <p className="text-xs text-gray-400">{rdv.time_slot.replace(':', 'H')}</p>
                      </div>
                      <div className="text-right">
                         <p className="text-[10px] text-gray-600 uppercase tracking-widest mb-1">Contact</p>
                         <p className="text-xs font-mono">{rdv.telephone}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-20 bg-[#111] rounded-[2rem] border border-dashed border-white/10">
                <p className="text-gray-500">Aucun rendez-vous client trouvé.</p>
              </div>
            )}
          </motion.div>
        )}

        {/* STATUS BAR MESSAGE */}
        <AnimatePresence>
          {statut.msg && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={`fixed bottom-8 left-1/2 -translate-x-1/2 px-6 py-3 rounded-full border text-xs font-bold shadow-2xl flex items-center gap-3 ${statut.type === 'error' ? 'bg-red-500/20 border-red-500/50 text-red-400' : 'bg-[#8b9d83]/20 border-[#8b9d83]/50 text-[#8b9d83]'}`}>
              {statut.msg} <button onClick={() => setStatut({msg:''})} className="ml-2 opacity-50 hover:opacity-100">✕</button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
