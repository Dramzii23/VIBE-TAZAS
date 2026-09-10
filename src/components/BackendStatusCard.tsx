import React, { useEffect, useState } from 'react';
import { Server, CheckCircle2, AlertCircle, RefreshCw, KeyRound } from 'lucide-react';

interface BackendInfo {
  status: string;
  service: string;
  version: string;
  firebase: {
    projectId: string;
    firestoreDatabaseId: string;
    authDomain: string;
    authProviders: string[];
  };
}

export const BackendStatusCard: React.FC = () => {
  const [info, setInfo] = useState<BackendInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const checkStatus = async () => {
    setLoading(true);
    setError(false);
    try {
      const res = await fetch('/api/health');
      if (!res.ok) throw new Error('Backend HTTP error');
      const data = await res.json();
      setInfo(data);
    } catch (e) {
      console.warn('Backend status check:', e);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkStatus();
  }, []);

  return (
    <div id="backend-status-card" className="bg-white rounded-2xl border border-stone-200 p-4 shadow-xs">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
            <Server className="w-3.5 h-3.5" />
          </div>
          <div>
            <h4 className="font-display font-semibold text-xs text-stone-900">
              Servidor Backend & Firebase
            </h4>
            <p className="text-[10px] text-stone-400">Node/Express + Firebase Auth & Firestore</p>
          </div>
        </div>

        <div>
          {loading ? (
            <span className="flex items-center gap-1 text-[11px] text-stone-400">
              <RefreshCw className="w-3 h-3 animate-spin" /> Verificando...
            </span>
          ) : error ? (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-50 text-rose-700 border border-rose-100">
              <AlertCircle className="w-3 h-3" /> Error
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-100">
              <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Conectado
            </span>
          )}
        </div>
      </div>

      {info && (
        <div className="space-y-2 pt-2 border-t border-stone-100 text-[11px] text-stone-600">
          <div className="flex justify-between items-center">
            <span className="text-stone-400 text-[10px]">Proyecto Firebase:</span>
            <span className="font-mono text-stone-800 text-[10px] truncate max-w-[170px]" title={info.firebase.projectId}>
              {info.firebase.projectId}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-stone-400 text-[10px]">Proveedores Auth:</span>
            <div className="flex items-center gap-1">
              <span className="px-1.5 py-0.5 rounded bg-stone-100 font-mono text-[10px] text-stone-700">Email/Password</span>
              <span className="px-1.5 py-0.5 rounded bg-stone-100 font-mono text-[10px] text-stone-700">Google</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
