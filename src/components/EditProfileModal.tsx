import { useState } from 'react';
import { supabase } from '../lib/supabase';

interface EditProfileModalProps {
  onClose: () => void;
  currentUsername: string;
  currentBio: string;
  onSuccess: (newUsername: string, newBio: string) => void;
}

export function EditProfileModal({ onClose, currentUsername, currentBio, onSuccess }: EditProfileModalProps) {
  const [username, setUsername] = useState(currentUsername);
  const [bio, setBio] = useState(currentBio || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) {
      setError('Kullanıcı adı boş olamaz.');
      return;
    }
    setLoading(true);
    setError('');

    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) {
      setError('Oturum bulunamadı.');
      setLoading(false);
      return;
    }

    // Kullanıcı adının başkası tarafından kullanılıp kullanılmadığını kontrol et
    if (username !== currentUsername) {
      const { data: existingUser } = await supabase
        .from('profiles')
        .select('id')
        .eq('username', username)
        .single();
        
      if (existingUser) {
        setError('Bu kullanıcı adı zaten alınmış.');
        setLoading(false);
        return;
      }
    }

    const { error: updateError } = await supabase
      .from('profiles')
      .update({ username, bio })
      .eq('id', userData.user.id);

    if (updateError) {
      setError(updateError.message);
      setLoading(false);
    } else {
      setLoading(false);
      onSuccess(username, bio);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-surface/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="absolute inset-0" onClick={onClose}></div>
      <div className="relative w-full max-w-md bg-surface-container rounded-3xl shadow-2xl overflow-hidden border border-outline-variant/30 animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-surface-container-highest">
          <h2 className="text-title-lg font-title-lg font-bold text-on-surface">Profili Düzenle</h2>
          <button 
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-surface-container-highest hover:bg-surface-container-highest flex items-center justify-center text-on-surface-variant hover:text-on-surface transition-colors"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 sm:p-6 flex flex-col gap-6">
          {error && (
            <div className="p-3 rounded-xl bg-error-container/20 border border-error/20 text-error text-body-sm font-bold flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px]">error</span>
              {error}
            </div>
          )}

          <div className="flex flex-col gap-2">
            <label htmlFor="username" className="text-label-md font-label-md font-bold text-on-surface">Kullanıcı Adı</label>
            <input 
              id="username"
              type="text" 
              value={username}
              onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
              placeholder="Benzersiz bir isim"
              className="w-full h-12 px-4 rounded-xl bg-surface-container-lowest text-on-surface placeholder:text-outline border border-outline-variant/30 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all text-body-lg"
              maxLength={20}
              required
            />
            <span className="text-label-sm text-outline px-1">Sadece küçük harf, rakam ve alt çizgi.</span>
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="bio" className="text-label-md font-label-md font-bold text-on-surface">Hakkında (Bio)</label>
            <textarea 
              id="bio"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Kendinden biraz bahset..."
              className="w-full h-24 p-4 rounded-xl bg-surface-container-lowest text-on-surface placeholder:text-outline border border-outline-variant/30 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all text-body-md resize-none"
              maxLength={150}
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button 
              type="button" 
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl font-label-lg font-bold text-on-surface hover:bg-surface-container-highest transition-colors"
            >
              İptal
            </button>
            <button 
              type="submit" 
              disabled={loading}
              className="px-6 py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-on-primary font-label-lg font-bold shadow-md disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Kaydediliyor...' : 'Kaydet'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
