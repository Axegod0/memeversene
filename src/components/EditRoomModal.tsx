import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

interface EditRoomModalProps {
  room: any;
  onClose: () => void;
  onSuccess: (updatedRoom: any) => void;
}

export function EditRoomModal({ room, onClose, onSuccess }: EditRoomModalProps) {
  const [description, setDescription] = useState(room.description || '');
  const [avatarUrl, setAvatarUrl] = useState(room.avatar_url || '');
  const [bannerUrl, setBannerUrl] = useState(room.banner_url || '');
  const [rules, setRules] = useState<string[]>([]);
  const [newRule, setNewRule] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    try {
      const parsedRules = typeof room.rules === 'string' ? JSON.parse(room.rules) : room.rules;
      if (Array.isArray(parsedRules)) setRules(parsedRules);
    } catch {
      setRules([]);
    }
  }, [room]);

  const handleAddRule = () => {
    if (newRule.trim()) {
      setRules([...rules, newRule.trim()]);
      setNewRule('');
    }
  };

  const handleRemoveRule = (index: number) => {
    setRules(rules.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user || userData.user.id !== room.owner_id) {
      setError('Yetkiniz yok.');
      setLoading(false);
      return;
    }

    const { data, error: updateError } = await supabase
      .from('rooms')
      .update({
        description,
        avatar_url: avatarUrl,
        banner_url: bannerUrl,
        rules: JSON.stringify(rules)
      })
      .eq('id', room.id)
      .select()
      .single();

    if (updateError) {
      setError(updateError.message);
      setLoading(false);
    } else {
      setLoading(false);
      onSuccess(data);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-surface/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="absolute inset-0" onClick={onClose}></div>
      <div className="relative w-full max-w-lg bg-surface-container rounded-3xl shadow-2xl overflow-hidden border border-outline-variant/30 animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-surface-container-highest shrink-0">
          <h2 className="text-title-lg font-title-lg font-bold text-on-surface">Topluluğu Özelleştir</h2>
          <button 
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-surface-container-highest hover:bg-surface-container-highest flex items-center justify-center text-on-surface-variant hover:text-on-surface transition-colors"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 sm:p-6 flex flex-col gap-6 overflow-y-auto">
          {error && (
            <div className="p-3 rounded-xl bg-error-container/20 border border-error/20 text-error text-body-sm font-bold flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px]">error</span>
              {error}
            </div>
          )}

          <div className="flex flex-col gap-2">
            <label className="text-label-md font-label-md font-bold text-on-surface">Biyografi (Hakkında)</label>
            <textarea 
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Topluluğun amacı nedir? Kimlere hitap eder?"
              className="w-full h-24 p-4 rounded-xl bg-surface-container-lowest text-on-surface placeholder:text-outline border border-outline-variant/30 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all text-body-md resize-none"
              maxLength={300}
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-label-md font-label-md font-bold text-on-surface">Profil Resmi (Avatar URL)</label>
            <input 
              type="url" 
              value={avatarUrl}
              onChange={(e) => setAvatarUrl(e.target.value)}
              placeholder="https://.../resim.png"
              className="w-full h-12 px-4 rounded-xl bg-surface-container-lowest text-on-surface placeholder:text-outline border border-outline-variant/30 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all text-body-md"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-label-md font-label-md font-bold text-on-surface">Banner Görseli (URL)</label>
            <input 
              type="url" 
              value={bannerUrl}
              onChange={(e) => setBannerUrl(e.target.value)}
              placeholder="https://.../banner.jpg"
              className="w-full h-12 px-4 rounded-xl bg-surface-container-lowest text-on-surface placeholder:text-outline border border-outline-variant/30 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all text-body-md"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-label-md font-label-md font-bold text-on-surface">Topluluk Kuralları</label>
            <div className="flex items-center gap-2">
              <input 
                type="text" 
                value={newRule}
                onChange={(e) => setNewRule(e.target.value)}
                placeholder="Örn: Saygılı olun"
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddRule())}
                className="flex-1 h-12 px-4 rounded-xl bg-surface-container-lowest text-on-surface placeholder:text-outline border border-outline-variant/30 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all text-body-md"
              />
              <button 
                type="button" 
                onClick={handleAddRule}
                className="h-12 px-4 rounded-xl bg-surface-container-high hover:bg-primary hover:text-on-primary text-on-surface font-bold transition-colors"
              >
                Ekle
              </button>
            </div>
            
            {rules.length > 0 && (
              <div className="mt-2 flex flex-col gap-2">
                {rules.map((rule, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 rounded-lg bg-surface-container-lowest border border-outline-variant/20">
                    <span className="text-body-sm text-on-surface"><span className="font-bold mr-2">{idx + 1}.</span>{rule}</span>
                    <button 
                      type="button" 
                      onClick={() => handleRemoveRule(idx)}
                      className="w-8 h-8 rounded-full hover:bg-error-container/20 text-error flex items-center justify-center transition-colors"
                    >
                      <span className="material-symbols-outlined text-[16px]">delete</span>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-surface-container-highest">
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
