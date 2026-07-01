// src/pages/member/cn/CNMessages.tsx
import { useState, useEffect, useCallback } from 'react';
import api from '../../../services/api';
import {
  Mail, MailOpen, Trash2, RefreshCw, Search,
  Clock, Tag, Phone, User, ChevronRight, X,
  CheckCheck, Circle,
} from 'lucide-react';

interface ContactMessage {
  id: number;
  name: string;
  email: string;
  phone?: string;
  subject: string;
  subject_label: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

const SUBJECT_COLORS: Record<string, string> = {
  apprentice: 'bg-blue-100 text-blue-700 border-blue-200',
  mentor:     'bg-green-100 text-green-700 border-green-200',
  partner:    'bg-purple-100 text-purple-700 border-purple-200',
  press:      'bg-orange-100 text-orange-700 border-orange-200',
  other:      'bg-slate-100 text-slate-600 border-slate-200',
};

function formatDate(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffH = diffMs / (1000 * 60 * 60);
  if (diffH < 24) return d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  if (diffH < 48) return 'Hier';
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });
}

export function CNMessages() {
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<ContactMessage | null>(null);
  const [search, setSearch] = useState('');
  const [filterSubject, setFilterSubject] = useState('');
  const [filterRead, setFilterRead] = useState<'all' | 'unread' | 'read'>('all');
  const [deleting, setDeleting] = useState<number | null>(null);

  const fetchMessages = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (filterSubject) params.subject = filterSubject;
      if (filterRead === 'unread') params.is_read = 'false';
      if (filterRead === 'read') params.is_read = 'true';
      const res = await api.get('/cn/messages/', { params });
      setMessages(res.data.messages ?? []);
      setUnreadCount(res.data.unread_count ?? 0);
    } catch {
    } finally {
      setLoading(false);
    }
  }, [filterSubject, filterRead]);

  useEffect(() => { fetchMessages(); }, [fetchMessages]);

  const markRead = async (msg: ContactMessage, isRead: boolean) => {
    try {
      await api.patch(`/cn/messages/${msg.id}/`, { is_read: isRead });
      const updated = { ...msg, is_read: isRead };
      setMessages(prev => prev.map(m => m.id === msg.id ? updated : m));
      if (selected?.id === msg.id) setSelected(updated);
      setUnreadCount(prev => prev + (isRead ? -1 : 1));
    } catch {
    }
  };

  const handleSelect = async (msg: ContactMessage) => {
    setSelected(msg);
    if (!msg.is_read) await markRead(msg, true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Supprimer ce message définitivement ?')) return;
    setDeleting(id);
    try {
      await api.delete(`/cn/messages/${id}/`);
      setMessages(prev => prev.filter(m => m.id !== id));
      if (selected?.id === id) setSelected(null);
    } catch {
    } finally {
      setDeleting(null);
    }
  };

  const filtered = messages.filter(m => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      m.name.toLowerCase().includes(q) ||
      m.email.toLowerCase().includes(q) ||
      m.message.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
            <Mail className="w-7 h-7 text-amber-500" />
            Messages de contact
            {unreadCount > 0 && (
              <span className="bg-red-500 text-white text-sm font-bold px-2.5 py-0.5 rounded-full">
                {unreadCount} non lu{unreadCount > 1 ? 's' : ''}
              </span>
            )}
          </h1>
          <p className="text-slate-500 text-sm mt-1">Gérez les messages reçus via le formulaire de contact</p>
        </div>
        <button
          onClick={fetchMessages}
          className="flex items-center gap-2 px-4 py-2 text-sm bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors text-slate-700"
        >
          <RefreshCw className="w-4 h-4" />
          Actualiser
        </button>
      </div>

      {/* Filters bar */}
      <div className="flex flex-wrap gap-3 bg-white p-3 rounded-xl border border-slate-200">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Rechercher..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-amber-400 focus:border-transparent"
          />
        </div>

        <select
          value={filterSubject}
          onChange={e => setFilterSubject(e.target.value)}
          className="px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-amber-400 bg-white"
        >
          <option value="">Tous les sujets</option>
          <option value="apprentice">Apprenti(e)</option>
          <option value="mentor">Mentor</option>
          <option value="partner">Partenariat</option>
          <option value="press">Presse</option>
          <option value="other">Autre</option>
        </select>

        <div className="flex gap-1 bg-slate-100 p-1 rounded-lg">
          {(['all', 'unread', 'read'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilterRead(f)}
              className={`px-3 py-1.5 text-sm rounded-md font-medium transition-colors ${
                filterRead === f ? 'bg-white shadow text-slate-900' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {f === 'all' ? 'Tous' : f === 'unread' ? 'Non lus' : 'Lus'}
            </button>
          ))}
        </div>
      </div>

      {/* Main layout: list + detail */}
      <div className="flex gap-4 min-h-[500px]">
        {/* Message list */}
        <div className={`bg-white rounded-xl border border-slate-200 overflow-hidden flex flex-col ${selected ? 'w-2/5 hidden md:flex' : 'flex-1'}`}>
          {loading ? (
            <div className="flex items-center justify-center flex-1 py-16">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center flex-1 py-16 text-slate-400">
              <MailOpen className="w-12 h-12 mb-3 opacity-40" />
              <p>Aucun message</p>
            </div>
          ) : (
            <ul className="divide-y divide-slate-100 overflow-y-auto flex-1">
              {filtered.map(msg => (
                <li
                  key={msg.id}
                  onClick={() => handleSelect(msg)}
                  className={`flex items-start gap-3 px-4 py-3 cursor-pointer hover:bg-slate-50 transition-colors ${
                    selected?.id === msg.id ? 'bg-amber-50 border-l-4 border-amber-400' : ''
                  } ${!msg.is_read ? 'bg-blue-50/40' : ''}`}
                >
                  {/* Read dot */}
                  <div className="mt-1 shrink-0">
                    {msg.is_read
                      ? <Circle className="w-2.5 h-2.5 text-slate-300" />
                      : <Circle className="w-2.5 h-2.5 fill-blue-500 text-blue-500" />
                    }
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-0.5">
                      <p className={`text-sm truncate ${!msg.is_read ? 'font-bold text-slate-900' : 'font-medium text-slate-700'}`}>
                        {msg.name}
                      </p>
                      <span className="text-xs text-slate-400 shrink-0">{formatDate(msg.created_at)}</span>
                    </div>
                    <span className={`inline-block text-xs px-2 py-0.5 rounded-full border mb-1 ${SUBJECT_COLORS[msg.subject] ?? SUBJECT_COLORS.other}`}>
                      {msg.subject_label}
                    </span>
                    <p className="text-xs text-slate-500 truncate">{msg.message}</p>
                  </div>

                  <ChevronRight className="w-4 h-4 text-slate-300 mt-1 shrink-0" />
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Detail panel */}
        {selected ? (
          <div className="flex-1 bg-white rounded-xl border border-slate-200 flex flex-col overflow-hidden">
            {/* Detail header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center">
                  <User className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <p className="font-bold text-slate-900">{selected.name}</p>
                  <p className="text-sm text-slate-500">{selected.email}</p>
                </div>
              </div>
              <button
                onClick={() => setSelected(null)}
                className="p-2 hover:bg-slate-200 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>

            {/* Detail body */}
            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
              {/* Meta */}
              <div className="flex flex-wrap gap-3 text-sm">
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border font-medium ${SUBJECT_COLORS[selected.subject] ?? SUBJECT_COLORS.other}`}>
                  <Tag className="w-3.5 h-3.5" />
                  {selected.subject_label}
                </span>
                {selected.phone && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-100 text-slate-600 rounded-full">
                    <Phone className="w-3.5 h-3.5" />
                    {selected.phone}
                  </span>
                )}
                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-100 text-slate-600 rounded-full">
                  <Clock className="w-3.5 h-3.5" />
                  {new Date(selected.created_at).toLocaleString('fr-FR')}
                </span>
              </div>

              {/* Message content */}
              <div className="bg-slate-50 rounded-xl p-5 border border-slate-100">
                <p className="text-slate-800 whitespace-pre-wrap leading-relaxed">{selected.message}</p>
              </div>

              {/* Reply shortcut */}
              <a
                href={`mailto:${selected.email}?subject=Re: ${encodeURIComponent(selected.subject_label)}`}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-sm font-semibold transition-colors"
              >
                <Mail className="w-4 h-4" />
                Répondre par email
              </a>
            </div>

            {/* Detail footer actions */}
            <div className="flex items-center justify-between px-6 py-3 border-t border-slate-100 bg-slate-50">
              <button
                onClick={() => markRead(selected, !selected.is_read)}
                className="flex items-center gap-2 px-3 py-2 text-sm text-slate-600 hover:bg-slate-200 rounded-lg transition-colors"
              >
                <CheckCheck className="w-4 h-4" />
                {selected.is_read ? 'Marquer non lu' : 'Marquer lu'}
              </button>
              <button
                onClick={() => handleDelete(selected.id)}
                disabled={deleting === selected.id}
                className="flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
              >
                <Trash2 className="w-4 h-4" />
                Supprimer
              </button>
            </div>
          </div>
        ) : (
          <div className="flex-1 hidden md:flex items-center justify-center bg-white rounded-xl border border-slate-200 border-dashed text-slate-400 flex-col gap-3">
            <MailOpen className="w-12 h-12 opacity-30" />
            <p className="text-sm">Sélectionnez un message pour le lire</p>
          </div>
        )}
      </div>
    </div>
  );
}
