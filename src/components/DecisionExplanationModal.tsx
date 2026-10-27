import React from 'react';
import { 
  HelpCircle, 
  X, 
  CheckCircle2, 
  Cpu, 
  Scale, 
  ShieldCheck, 
  FileText, 
  ArrowRight,
  TrendingUp,
  BrainCircuit
} from 'lucide-react';
import { DecisionExplanation } from '../types';

interface DecisionExplanationModalProps {
  isOpen: boolean;
  onClose: () => void;
  decision: DecisionExplanation | null;
}

export const DecisionExplanationModal: React.FC<DecisionExplanationModalProps> = ({
  isOpen,
  onClose,
  decision,
}) => {
  if (!isOpen || !decision) return null;

  return (
    <div 
      id="decision-explanation-modal-backdrop"
      className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
    >
      <div 
        id="decision-explanation-modal-card"
        className="glass-panel w-full max-w-2xl rounded-3xl p-6 sm:p-8 shadow-2xl border border-white/90 relative animate-in fade-in zoom-in-95 duration-200"
      >
        {/* Close Button */}
        <button
          id="btn-close-decision-modal"
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-start gap-4 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-500 to-sky-500 text-white flex items-center justify-center shadow-lg shadow-indigo-100 shrink-0">
            <BrainCircuit className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold tracking-wider uppercase px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100">
                Transparent Decision Audit
              </span>
              <span className="text-xs font-semibold text-emerald-600 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                {decision.confidenceScore}% Confidence
              </span>
            </div>
            <h2 className="text-xl font-bold text-slate-900 mt-1">
              How Was This Decision Made?
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Decision Target: <span className="font-semibold text-slate-800">{decision.targetTitle}</span> ({decision.targetId})
            </p>
          </div>
        </div>

        {/* Executive Summary */}
        <div className="p-4 rounded-2xl bg-indigo-50/70 border border-indigo-100 mb-6">
          <div className="flex items-center gap-2 text-xs font-bold text-indigo-900 mb-1">
            <FileText className="w-4 h-4 text-indigo-600" />
            Decision Rationale
          </div>
          <p className="text-xs text-indigo-950/80 leading-relaxed font-medium">
            {decision.summary}
          </p>
        </div>

        {/* Telemetry Inputs Fed into the Model */}
        <div className="mb-6">
          <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
            <Cpu className="w-3.5 h-3.5 text-indigo-600" />
            Active Signals & Telemetry Inputs
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            {Object.entries(decision.inputs).map(([key, value]) => (
              <div key={key} className="glass-card p-2.5 rounded-xl border border-slate-100">
                <span className="text-[10px] uppercase font-semibold text-slate-400 block truncate">
                  {key.replace(/([A-Z])/g, ' $1')}
                </span>
                <span className="text-xs font-bold text-slate-800 truncate block mt-0.5">
                  {String(value)}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Algorithmic Step-by-Step Breakdown */}
        <div className="mb-6">
          <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3 flex items-center gap-1.5">
            <Scale className="w-3.5 h-3.5 text-indigo-600" />
            Step-by-Step Algorithmic Logic
          </h3>
          <div className="space-y-3">
            {decision.steps.map((step) => (
              <div 
                key={step.stepNumber}
                className="p-3.5 rounded-2xl bg-white/80 border border-slate-100/90 shadow-sm flex items-start gap-3"
              >
                <div className="w-7 h-7 rounded-xl bg-slate-100 text-slate-700 font-bold text-xs flex items-center justify-center shrink-0">
                  {step.stepNumber}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-slate-900">
                      {step.phase}
                    </span>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                      Weight: {step.weightPct}%
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 mt-1 font-medium">
                    {step.explanation}
                  </p>
                  <div className="flex items-center gap-2 mt-2 text-[11px] text-slate-400 font-mono">
                    <span>Algorithm: <span className="text-indigo-600 font-semibold">{step.algorithmUsed}</span></span>
                    <span>•</span>
                    <span className="text-slate-500">{step.factor}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Human in the Loop Safeguard Note */}
        <div className="p-3 rounded-2xl bg-emerald-50/60 border border-emerald-100 flex items-center gap-3">
          <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
          <p className="text-[11px] text-emerald-900 font-medium">
            <span className="font-bold">Human-in-the-Loop Safeguard: </span>
            {decision.humanSafeguardNote || 'Incident commanders maintain absolute authority to manually override dispatch routes or priority queues at any time.'}
          </p>
        </div>

        {/* Footer */}
        <div className="mt-6 pt-4 border-t border-slate-100 flex justify-end">
          <button
            id="btn-confirm-decision-modal"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-200 transition"
          >
            Acknowledge & Close
          </button>
        </div>
      </div>
    </div>
  );
};
