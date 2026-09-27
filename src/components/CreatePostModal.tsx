import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { parseVideoUrl } from '../lib/utils';

interface Room {
  id: string;
  name: string;
  slug: string;
}

interface CreatePostModalProps {
  onClose: () => void;
  defaultRoomSlug?: string | null;
}

export function CreatePostModal({ onClose, defaultRoomSlug }: CreatePostModalProps) {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [selectedRoomId, setSelectedRoomId] = useState<string>('');
  
  const [url, setUrl] = useState('');
  const [caption, setCaption] = useState('');
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [loadingStatus, setLoadingStatus] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > 50 * 1024 * 1024) { // 50MB limit
      alert('Dosya boyutu 50MB\'dan büyük olamaz.');
      return;
    }

    setLoading(true);
    setLoadingStatus('Dosya yükleniyor...');
    setProgress(20);

    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;
    const filePath = `${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('media')
      .upload(filePath, file);

    setProgress(80);

    if (uploadError) {
      alert('Dosya yüklenirken bir hata oluştu: ' + uploadError.message);
      setLoading(false);
      return;
    }

    const { data: publicUrlData } = supabase.storage
      .from('media')
      .getPublicUrl(filePath);

    setUrl(publicUrlData.publicUrl);
    setLoading(false);
    setProgress(100);
  };

  // Live preview parsing
  const parsedPreview = url ? parseVideoUrl(url) : null;

  useEffect(() => {
    async function fetchRooms() {
      if (defaultRoomSlug) {
        const { data } = await supabase.from('rooms').select('*');
        if (data) {
          setRooms(data);
          const defaultRoom = data.find(r => r.slug === defaultRoomSlug);
          if (defaultRoom) setSelectedRoomId(defaultRoom.id);
        }
      }
    }
    fetchRooms();
  }, [defaultRoomSlug]);

  if (!defaultRoomSlug) {
    return (
      <div className="fixed inset-0 z-[100] bg-surface-container-lowest/80 backdrop-blur-md flex items-center justify-center p-4">
        <div className="absolute w-[400px] h-[400px] rounded-full bg-error/10 blur-[100px] pointer-events-none"></div>
        <div className="relative w-full max-w-md rounded-3xl bg-surface-container-low shadow-[0_24px_64px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col p-8 text-center items-center">
          <div className="w-16 h-16 rounded-2xl bg-surface-container-high text-error flex items-center justify-center mb-6">
            <span className="material-symbols-outlined text-[32px]">group_off</span>
          </div>
          <h2 className="text-headline-sm font-bold text-on-surface mb-3">Topluluk Seçilmedi</h2>
          <p className="text-body-md text-on-surface-variant mb-8">
            Paylaşım yapmak için önce ana sayfadan bir topluluğa (örneğin m/mizah) girmeli ve o topluluğun içindeyken "Post Oluştur" butonuna basmalısınız.
          </p>
          <button 
            onClick={onClose}
            className="w-full py-3.5 rounded-xl bg-surface-container-high hover:bg-surface-container-highest text-on-surface font-bold transition-colors"
          >
            Anladım, Kapat
          </button>
        </div>
      </div>
    );
  }

  const handleSubmit = async () => {
    if (!url || !caption || !selectedRoomId) {
      alert('Lütfen oda, medya bağlantısı ve başlık alanlarını doldurun.');
      return;
    }

    setLoading(true);
    setLoadingStatus('Medya bağlantısı analiz ediliyor...');
    setProgress(10);
    const parsed = parseVideoUrl(url);
    if (!parsed || !parsed.type) {
      alert('Sadece YouTube, TikTok veya Resim bağlantıları desteklenmektedir.');
      setLoading(false);
      return;
    }

    setProgress(30);
    const { type, id } = parsed;
    
    setLoadingStatus('Hesap bilgileri doğrulanıyor...');
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) {
      alert('Oturumunuz bulunamadı.');
      setLoading(false);
      return;
    }

    let finalVideoUrl = url;
    let finalVideoType = type;

    if (type === 'tiktok') {
      setLoadingStatus('TikTok medyası indiriliyor...');
      setProgress(50);
      try {
        const res = await fetch(`https://tikwm.com/api/?url=${encodeURIComponent(url)}`);
        const data = await res.json();
        if (data && data.data && data.data.play) {
          finalVideoUrl = data.data.play;
          finalVideoType = 'tiktok_native';
        }
      } catch (err) {
        console.error('Failed to fetch native tiktok video', err);
        // Fallback to regular tiktok embed if api fails
      }
    }

    setProgress(80);
    setLoadingStatus('Gönderi yayınlanıyor...');

    const newPostData = {
      user_id: userData.user.id,
      room_id: selectedRoomId,
      caption,
      video_url: finalVideoUrl,
      video_type: finalVideoType,
      video_id: id,
      upvotes: 0,
    };

    const { data: insertedPost, error } = await supabase.from('posts').insert([newPostData]).select('*, profiles!posts_user_id_fkey(username), rooms(name, slug, is_public)').single();

    setProgress(100);
    setLoadingStatus('Yüklendi!');

    if (!error && insertedPost) {
      // Optimistic UI Dispatch
      window.dispatchEvent(new CustomEvent('postCreated', { detail: insertedPost }));
      setTimeout(() => {
        setLoading(false);
        onClose();
      }, 400); // Küçük bir gecikme ile tamamlandı hissi ver
    } else {
      setLoading(false);
      alert('Post paylaşılırken bir hata oluştu: ' + error?.message);
    }
  };

  const selectedRoom = rooms.find(r => r.id === selectedRoomId);

  return (
    <>
      <div className="fixed inset-0 z-[100] bg-surface-container-lowest/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
        <div className="absolute w-[560px] h-[560px] rounded-full bg-primary/10 blur-[130px] pointer-events-none -top-12"></div>
        <div className="absolute w-[440px] h-[440px] rounded-full bg-secondary-container/20 blur-[110px] pointer-events-none bottom-10"></div>
        
      
      <div className="relative w-full max-w-[740px] my-auto rounded-2xl bg-surface-container-low shadow-[0_24px_64px_rgba(0,0,0,0.85),0_0_40px_rgba(224,135,152,0.18)] overflow-hidden flex flex-col">
        {/* Top Subtle Rose Gold Accent Strip */}
        <div className="h-1 w-full bg-gradient-to-r from-secondary-container via-primary-container to-secondary"></div>
        
        {/* Modal Header */}
        <div className="px-6 py-5 flex items-center justify-between bg-surface-container-low/95">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary-container/20 flex items-center justify-center text-primary shadow-[0_0_16px_rgba(224,135,152,0.25)]">
              <span className="material-symbols-outlined text-headline-md" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
            </div>
            <div>
              <h2 className="font-headline-lg text-headline-lg font-bold text-on-surface tracking-tight flex items-center gap-2">
                Yeni Meme / Video Paylaş
              </h2>
              <p className="font-body-sm text-body-sm text-outline">Topluluğun ana sayfasına düşecek en taze içeriği oluştur</p>
            </div>
          </div>
          <button onClick={onClose} aria-label="Kapat" className="w-9 h-9 rounded-xl bg-surface-container hover:bg-surface-container-high text-outline hover:text-on-surface flex items-center justify-center transition-colors" type="button">
            <span className="material-symbols-outlined text-headline-sm">close</span>
          </button>
        </div>
        
        {/* Modal Body */}
        <div className="px-6 py-5 flex flex-col gap-5 overflow-y-auto max-h-[calc(88vh-140px)]">
          {/* Fixed Room Display */}
          <div className="flex flex-col gap-2 relative">
            <label className="font-label-lg text-label-lg font-bold text-on-surface flex items-center justify-between">
              <span>Hedef Topluluk</span>
              <span className="text-label-sm font-label-sm text-outline">Seçili topluluk</span>
            </label>
            <div className="w-full h-13 px-4 py-3 rounded-xl bg-surface-container-high flex items-center justify-between border border-outline-variant/10 cursor-not-allowed">
              <div className="flex items-center gap-3 min-w-0">
                <span className="w-7 h-7 rounded-lg bg-primary-container text-on-primary-container font-headline-sm text-label-md flex items-center justify-center font-bold shadow-sm">
                  {selectedRoom?.slug === 'genel' ? '⚡' : selectedRoom?.slug === 'mizah' ? '😂' : selectedRoom?.slug === 'oyun' ? '🎮' : '💻'}
                </span>
                <div className="flex flex-col min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-headline-sm text-headline-sm font-bold text-on-surface truncate">m/{selectedRoom?.slug}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 text-primary font-bold text-label-sm">
                <span className="material-symbols-outlined text-body-lg">lock</span>
              </div>
            </div>
          </div>
          
          {/* Tab Bar for Post Types */}
          <div className="p-1 rounded-xl bg-surface-container flex gap-1 shadow-inner">
            <input 
              type="file" 
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept="image/*,video/mp4,video/webm,image/gif"
              className="hidden" 
            />
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="flex-1 py-2.5 px-3 rounded-lg bg-surface-container-high hover:bg-surface-container-highest text-primary font-headline-sm text-label-lg font-bold flex items-center justify-center gap-2 shadow-[0_2px_12px_rgba(224,135,152,0.15)] transition-all" 
              type="button"
            >
              <span className="material-symbols-outlined text-headline-sm">upload_file</span>
              <span>Görsel / GIF / Video Yükle</span>
            </button>
          </div>
          
          {/* Video URL Input */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <label className="font-label-lg text-label-lg font-bold text-on-surface flex items-center gap-1.5" htmlFor="videoUrlInput">
                <span>Medya Bağlantısı</span>
                <span className="text-error font-bold">*</span>
              </label>
              <span className="text-label-sm font-label-sm text-outline flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></span>
                Otomatik video ayrıştırıcı
              </span>
            </div>
            <div className="relative flex items-center">
              <div className="absolute left-3.5 flex items-center gap-1.5 text-outline">
                <span className="material-symbols-outlined text-headline-sm text-primary">link</span>
              </div>
              <input 
                value={url}
                onChange={e => setUrl(e.target.value)}
                className="w-full h-11 pl-11 pr-4 rounded-xl bg-surface-container text-body-md font-body-md text-on-surface placeholder:text-outline focus:outline-none focus:bg-surface-container-high shadow-inner transition-all" 
                id="videoUrlInput" 
                placeholder="YouTube, TikTok veya Resim bağlantısı (Pinterest, vs) yapıştır..."
                type="text" 
              />
            </div>

            {/* Video Auto-Preview Card */}
            {parsedPreview && (
              <div className="p-3.5 rounded-xl bg-surface-container flex items-center gap-4 shadow-sm border border-primary/20">
                <div className="flex flex-col min-w-0 flex-1 gap-1">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-full bg-primary-container/20 text-primary text-label-sm font-label-sm font-bold flex items-center gap-1">
                      <span className="material-symbols-outlined text-[13px]" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                      Bağlantı algılandı
                    </span>
                    <span className="text-label-sm font-label-sm text-outline uppercase">• {parsedPreview.type}</span>
                  </div>
                  <p className="font-headline-sm text-body-sm font-bold text-on-surface truncate">
                    ID: {parsedPreview.id}
                  </p>
                </div>
              </div>
            )}
          </div>
          
          {/* Meme Başlığı / Açıklaması Input */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <label className="font-label-lg text-label-lg font-bold text-on-surface" htmlFor="postTitleInput">Meme Başlığı &amp; Vurgusu</label>
              <span className={`text-label-sm font-label-sm font-bold ${caption.length > 300 ? 'text-error' : 'text-primary'}`}>
                {caption.length} / 300
              </span>
            </div>
            <div className="relative">
              <textarea 
                value={caption}
                onChange={e => setCaption(e.target.value)}
                className="w-full p-3.5 rounded-xl bg-surface-container text-body-md font-body-md text-on-surface placeholder:text-outline focus:outline-none focus:bg-surface-container-high transition-all resize-none shadow-inner" 
                id="postTitleInput" 
                rows={3} 
                maxLength={300}
                placeholder="Videonun ruhunu yansıtacak başlığı yaz..."
              ></textarea>
            </div>
          </div>
        </div>
        
        {/* Modal Footer */}
        <div className="px-6 py-4 bg-surface-container-low/95 flex items-center justify-end gap-3 shadow-lg border-t border-surface-container">
          <div className="flex items-center gap-3">
            <button 
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2.5 rounded-xl bg-surface-container hover:bg-surface-container-high text-on-surface font-headline-sm text-label-lg transition-colors" 
              type="button"
            >
              Vazgeç
            </button>
            <button 
              onClick={handleSubmit}
              disabled={loading || !url || !caption || caption.length > 300}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-secondary to-primary-container hover:from-secondary-fixed hover:to-primary text-on-primary-container font-headline-sm text-label-lg font-bold shadow-[0_0_20px_rgba(224,135,152,0.45)] hover:shadow-[0_0_30px_rgba(224,135,152,0.65)] hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:pointer-events-none" 
              type="button"
            >
              <span className="material-symbols-outlined text-headline-sm" style={{ fontVariationSettings: "'FILL' 1" }}>rocket_launch</span>
              <span>{loading ? 'Gönderiliyor...' : 'Paylaş (Upvote Avına Başla!)'}</span>
            </button>
          </div>
        </div>
      </div>
      </div>

      {loading && (
        <div className="fixed inset-0 z-[200] bg-surface-container-lowest/70 backdrop-blur-xl flex flex-col items-center justify-center p-4">
          <div className="flex flex-col items-center justify-center p-8 rounded-3xl bg-surface-container-low shadow-2xl border border-outline-variant/30 w-full max-w-[320px] animate-in fade-in zoom-in-95 duration-300">
            <div className="relative w-24 h-24 mb-6 flex items-center justify-center">
              <svg className="absolute inset-0 w-full h-full -rotate-90 transform" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="45" fill="transparent" stroke="currentColor" strokeWidth="8" className="text-surface-container-highest" />
                <circle 
                  cx="50" cy="50" r="45" fill="transparent" stroke="currentColor" strokeWidth="8" 
                  className="text-primary drop-shadow-[0_0_8px_rgba(224,135,152,0.6)] transition-all duration-300 ease-out" 
                  strokeDasharray={`${2 * Math.PI * 45}`} 
                  strokeDashoffset={`${2 * Math.PI * 45 * (1 - progress / 100)}`} 
                  strokeLinecap="round" 
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="font-headline-md font-bold text-on-surface">{progress}%</span>
              </div>
            </div>
            
            <h3 className="font-headline-sm font-bold text-on-surface text-center mb-2">{progress === 100 ? 'Yüklendi!' : 'Yükleniyor'}</h3>
            <p className="text-body-sm text-on-surface-variant text-center max-w-[240px] h-5">{loadingStatus}</p>
          </div>
        </div>
      )}
    </>
  );
}
