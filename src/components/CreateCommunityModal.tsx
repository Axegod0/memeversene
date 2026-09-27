import React, { useState } from 'react';
import { supabase } from '../lib/supabase';

interface CreateCommunityModalProps {
  onClose: () => void;
  onSuccess: (roomSlug: string) => void;
}

export function CreateCommunityModal({ onClose, onSuccess }: CreateCommunityModalProps) {
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !slug) return;
    
    // Sadece harf, rakam, tire ve alt çizgiye izin ver
    const validSlug = /^[a-z0-9-_]+$/.test(slug);
    if (!validSlug) {
      setError('Uzantı sadece küçük harf, rakam, tire (-) ve alt çizgi (_) içerebilir.');
      return;
    }

    setLoading(true);
    setError(null);

    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) {
      setError('Oturum açmanız gerekiyor.');
      setLoading(false);
      return;
    }

    // 1. Odayı oluştur
    const { data: roomData, error: roomError } = await supabase
      .from('rooms')
      .insert([
        { 
          name, 
          slug,
          is_public: isPublic,
          owner_id: userData.user.id
        }
      ])
      .select()
      .single();

    if (roomError) {
      if (roomError.code === '23505') { // Unique violation
        setError('Bu uzantı (slug) başka bir topluluk tarafından kullanılıyor.');
      } else {
        setError(roomError.message);
      }
      setLoading(false);
      return;
    }

    // 2. Oluşturan kişiyi otomatik olarak "owner" olarak room_members tablosuna ekle
    if (roomData) {
      await supabase.from('room_members').insert([
        {
          room_id: roomData.id,
          user_id: userData.user.id,
          role: 'owner'
        }
      ]);
    }

    setLoading(false);
    onSuccess(slug);
  };

  return (
    <div className="fixed inset-0 z-[100] bg-surface-container-lowest/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="relative w-full max-w-lg rounded-3xl bg-surface-container-low shadow-[0_24px_64px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col border border-outline-variant/10">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-surface-container-highest">
          <div className="flex items-center gap-3">
            <span className="w-10 h-10 rounded-xl bg-primary-container text-on-primary-container flex items-center justify-center">
              <span className="material-symbols-outlined">add_business</span>
            </span>
            <h2 className="text-headline-sm font-bold text-on-surface">Topluluk Kur</h2>
          </div>
          <button 
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-surface-container hover:bg-surface-container-highest flex items-center justify-center text-on-surface-variant transition-colors"
          >
            <span className="material-symbols-outlined text-body-lg">close</span>
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-5">
          {error && (
            <div className="p-3 rounded-lg bg-error-container/20 border border-error/50 text-error text-body-sm font-bold flex items-center gap-2">
              <span className="material-symbols-outlined text-body-lg">error</span>
              {error}
            </div>
          )}

          <div className="flex flex-col gap-2">
            <label className="font-label-md font-bold text-on-surface">Topluluk Adı</label>
            <input 
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Örn: Türk Oyuncular"
              className="w-full h-12 px-4 rounded-xl bg-surface-container text-body-md text-on-surface placeholder:text-outline border border-outline-variant/30 focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-all"
              required
              maxLength={30}
            />
            <span className="text-label-sm text-outline">Görünen büyük isim. (Maksimum 30 karakter)</span>
          </div>

          <div className="flex flex-col gap-2">
            <label className="font-label-md font-bold text-on-surface">URL Uzantısı (Slug)</label>
            <div className="relative flex items-center">
              <span className="absolute left-4 font-bold text-outline">m/</span>
              <input 
                value={slug}
                onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-_]/g, ''))}
                placeholder="turk-oyuncular"
                className="w-full h-12 pl-10 pr-4 rounded-xl bg-surface-container text-body-md text-on-surface placeholder:text-outline border border-outline-variant/30 focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-all"
                required
                maxLength={20}
              />
            </div>
            <span className="text-label-sm text-outline">Sadece küçük harf, rakam, tire ve alt çizgi. (Örn: m/turk-oyuncular)</span>
          </div>

          <div className="flex flex-col gap-2 p-3 bg-surface-container-low rounded-xl border border-outline-variant/30 mt-2">
            <label className="flex items-center gap-3 cursor-pointer">
              <input 
                type="checkbox" 
                checked={isPublic}
                onChange={(e) => setIsPublic(e.target.checked)}
                className="w-5 h-5 rounded border-outline-variant text-primary focus:ring-primary bg-surface-container"
              />
              <div className="flex flex-col">
                <span className="font-label-lg font-bold text-on-surface">Açık Topluluk (Public)</span>
                <span className="text-body-sm text-on-surface-variant leading-tight">Bu topluluktaki paylaşımlar ana sayfada (Keşfet) görünür. Kapatılırsa sadece doğrudan bu topluluğa girenler görebilir.</span>
              </div>
            </label>
          </div>

          <div className="pt-2">
            <button 
              type="submit" 
              disabled={loading}
              className="w-full h-12 rounded-xl bg-gradient-to-r from-secondary to-primary-container hover:from-secondary-fixed hover:to-primary text-on-primary-container font-bold text-label-lg shadow-lg hover:shadow-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? 'Oluşturuluyor...' : 'Topluluğu Kur'}
              <span className="material-symbols-outlined text-headline-sm">rocket_launch</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
