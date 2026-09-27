import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

interface ManageMembersModalProps {
  room: any;
  onClose: () => void;
}

export function ManageMembersModal({ room, onClose }: ManageMembersModalProps) {
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchMembers = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('room_members')
      .select('*, profiles(username)')
      .eq('room_id', room.id)
      .order('role', { ascending: false }); // owner, admin, member

    if (error) {
      setError(error.message);
    } else {
      setMembers(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchMembers();
  }, [room.id]);

  const updateRole = async (userId: string, newRole: string) => {
    const { error } = await supabase
      .from('room_members')
      .update({ role: newRole })
      .eq('room_id', room.id)
      .eq('user_id', userId);
      
    if (error) {
      alert('Rol güncellenirken hata oluştu: ' + error.message);
    } else {
      fetchMembers();
    }
  };

  const kickMember = async (userId: string) => {
    if (!confirm('Bu üyeyi topluluktan çıkarmak istediğinize emin misiniz?')) return;
    
    const { error } = await supabase
      .from('room_members')
      .delete()
      .eq('room_id', room.id)
      .eq('user_id', userId);
      
    if (error) {
      alert('Üye çıkarılırken hata oluştu: ' + error.message);
    } else {
      fetchMembers();
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-surface/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="absolute inset-0" onClick={onClose}></div>
      <div className="relative w-full max-w-lg bg-surface-container rounded-3xl shadow-2xl overflow-hidden border border-outline-variant/30 animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-surface-container-highest shrink-0">
          <h2 className="text-title-lg font-title-lg font-bold text-on-surface">Üyeleri ve Rolleri Yönet</h2>
          <button 
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-surface-container-highest hover:bg-surface-container-highest flex items-center justify-center text-on-surface-variant hover:text-on-surface transition-colors"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        <div className="p-4 sm:p-6 flex flex-col gap-4 overflow-y-auto">
          {error && (
            <div className="p-3 rounded-xl bg-error-container/20 border border-error/20 text-error text-body-sm font-bold flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px]">error</span>
              {error}
            </div>
          )}

          {loading ? (
            <div className="flex justify-center p-8">
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {members.map(member => (
                <div key={member.user_id} className="flex items-center justify-between p-3 rounded-xl bg-surface-container-lowest border border-outline-variant/20">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-surface-container-high flex items-center justify-center text-on-surface font-bold">
                      {member.profiles?.username?.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex flex-col">
                      <span className="font-label-lg font-bold text-on-surface">{member.profiles?.username}</span>
                      <span className="font-label-sm text-outline capitalize">{member.role}</span>
                    </div>
                  </div>
                  
                  {member.role !== 'owner' && (
                    <div className="flex items-center gap-2">
                      <select 
                        value={member.role}
                        onChange={(e) => updateRole(member.user_id, e.target.value)}
                        className="h-9 px-2 rounded-lg bg-surface-container text-body-sm text-on-surface border border-outline-variant/30 focus:outline-none focus:border-primary"
                      >
                        <option value="member">Üye</option>
                        <option value="admin">Moderatör</option>
                      </select>
                      
                      <button 
                        onClick={() => kickMember(member.user_id)}
                        className="w-9 h-9 rounded-lg bg-error-container/20 hover:bg-error text-error hover:text-on-error flex items-center justify-center transition-colors"
                        title="Üyeyi Çıkar"
                      >
                        <span className="material-symbols-outlined text-[18px]">person_remove</span>
                      </button>
                    </div>
                  )}
                </div>
              ))}
              
              {members.length === 0 && (
                <p className="text-center text-outline text-body-sm py-4">Bu toplulukta henüz üye yok.</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
