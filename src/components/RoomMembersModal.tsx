import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

interface Member {
  user_id: string;
  role: string;
  joined_at: string;
  profiles?: { username: string };
}

interface RoomMembersModalProps {
  roomId: string;
  currentUserRole: string | null;
  onClose: () => void;
}

export function RoomMembersModal({ roomId, currentUserRole, onClose }: RoomMembersModalProps) {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMembers();
  }, [roomId]);

  const fetchMembers = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('room_members')
      .select('*, profiles!room_members_user_id_fkey(username)')
      .eq('room_id', roomId)
      .order('joined_at', { ascending: true });

    if (!error && data) {
      setMembers(data as Member[]);
    }
    setLoading(false);
  };

  const handleKick = async (userId: string) => {
    if (!confirm('Bu kullanıcıyı topluluktan çıkarmak istediğinize emin misiniz?')) return;
    
    const { error } = await supabase
      .from('room_members')
      .delete()
      .eq('room_id', roomId)
      .eq('user_id', userId);

    if (!error) {
      setMembers(prev => prev.filter(m => m.user_id !== userId));
    } else {
      alert('Hata: ' + error.message);
    }
  };

  const canKick = (memberRole: string) => {
    if (currentUserRole === 'owner') return memberRole !== 'owner';
    if (currentUserRole === 'admin') return memberRole === 'member';
    return false;
  };

  return (
    <div className="fixed inset-0 z-[100] bg-surface-container-lowest/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="relative w-full max-w-lg rounded-3xl bg-surface-container-low shadow-[0_24px_64px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-5 flex items-center justify-between bg-surface-container-low/95 border-b border-outline-variant/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary-container/20 flex items-center justify-center text-primary">
              <span className="material-symbols-outlined text-headline-md">group</span>
            </div>
            <div>
              <h2 className="font-headline-sm font-bold text-on-surface">Topluluk Üyeleri</h2>
              <p className="font-label-sm text-outline">{members.length} Üye</p>
            </div>
          </div>
          <button onClick={onClose} aria-label="Kapat" className="w-9 h-9 rounded-xl hover:bg-surface-container-high text-outline hover:text-on-surface flex items-center justify-center transition-colors">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Body */}
        <div className="flex flex-col overflow-y-auto max-h-[60vh] p-2">
          {loading ? (
            <div className="p-8 text-center text-outline">Yükleniyor...</div>
          ) : (
            members.map(member => (
              <div key={member.user_id} className="flex items-center justify-between p-3 hover:bg-surface-container-high rounded-xl transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-surface-container-highest flex items-center justify-center text-on-surface font-bold">
                    {member.profiles?.username?.substring(0, 2).toUpperCase() || 'U'}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-on-surface">u/{member.profiles?.username}</span>
                      {member.role === 'owner' && <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-error/20 text-error uppercase">Kurucu</span>}
                      {member.role === 'admin' && <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-primary/20 text-primary uppercase">Mod</span>}
                    </div>
                    <p className="text-label-sm text-outline">Katılım: {new Date(member.joined_at).toLocaleDateString('tr-TR')}</p>
                  </div>
                </div>

                {canKick(member.role) && (
                  <button 
                    onClick={() => handleKick(member.user_id)}
                    className="p-2 rounded-lg text-outline hover:text-error hover:bg-error-container/20 transition-colors"
                    title="Topluluktan At"
                  >
                    <span className="material-symbols-outlined text-body-lg">person_remove</span>
                  </button>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
