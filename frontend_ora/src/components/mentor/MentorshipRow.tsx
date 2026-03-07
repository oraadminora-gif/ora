// src/components/mentor/MentorshipRow.tsx
import { Mail, Calendar, CheckCircle, XCircle, MessageSquare } from 'lucide-react';
import type { Mentorship } from '../../pages/member/mentor/MentorDashboard';

interface MentorshipRowProps {
  mentorship: Mentorship;
  onClose: () => void;
  onStop: () => void;
}

export function MentorshipRow({ mentorship, onClose, onStop }: MentorshipRowProps) {
  const progressColor = 
    mentorship.objectives_progress >= 75 ? 'bg-green-500' :
    mentorship.objectives_progress >= 50 ? 'bg-yellow-500' : 'bg-red-500';

  return (
    <div className="border border-slate-200 rounded-lg p-4 hover:shadow-md transition-shadow bg-white">
      {/* Header */}
      <div className="flex justify-between items-start mb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-ora-blue rounded-full flex items-center justify-center text-white font-semibold">
            {mentorship.apprentice_name.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="font-semibold text-slate-900">
              {mentorship.apprentice_name}
            </p>
            <p className="text-xs text-slate-500 flex items-center gap-1">
              <Mail className="w-3 h-3" />
              {mentorship.apprentice_email}
            </p>
          </div>
        </div>
        <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">
          Actif
        </span>
      </div>

      {/* Progression */}
      <div className="mb-4">
        <div className="flex justify-between text-xs mb-1">
          <span className="text-slate-500">Progression des objectifs</span>
          <span className="font-medium text-slate-900">{mentorship.objectives_progress}%</span>
        </div>
        <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
          <div 
            className={`h-full ${progressColor} transition-all duration-500`}
            style={{ width: `${mentorship.objectives_progress}%` }}
          />
        </div>
      </div>

      {/* Stats */}
      <div className="flex gap-4 text-xs text-slate-500 mb-4">
        <div className="flex items-center gap-1">
          <Calendar className="w-3 h-3" />
          <span>Début: {new Date(mentorship.start_date).toLocaleDateString('fr-FR')}</span>
        </div>
        <div className="flex items-center gap-1">
          <MessageSquare className="w-3 h-3" />
          <span>{mentorship.total_meetings} réunion{mentorship.total_meetings > 1 ? 's' : ''}</span>
        </div>
        {mentorship.next_meeting && (
          <div className="flex items-center gap-1 text-ora-blue">
            <Calendar className="w-3 h-3" />
            <span>Prochaine: {new Date(mentorship.next_meeting).toLocaleDateString('fr-FR')}</span>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-2 pt-3 border-t border-slate-100">
        <button 
          onClick={onClose}
          className="flex-1 flex items-center justify-center gap-1 py-2 px-3 bg-green-50 hover:bg-green-100 text-green-700 rounded-lg text-xs font-medium transition-colors"
        >
          <CheckCircle className="w-4 h-4" />
          Clôturer (succès)
        </button>
        <button 
          onClick={onStop}
          className="flex-1 flex items-center justify-center gap-1 py-2 px-3 bg-red-50 hover:bg-red-100 text-red-700 rounded-lg text-xs font-medium transition-colors"
        >
          <XCircle className="w-4 h-4" />
          Arrêter
        </button>
      </div>
    </div>
  );
}