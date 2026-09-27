import { useEffect } from 'react';

export function AdSlot({ type = 'sidebar' }: { type?: 'sidebar' | 'feed' }) {
  // Google AdSense Publisher ID
  const GOOGLE_AD_CLIENT = 'ca-pub-1632502110857924';
  const GOOGLE_AD_SLOT_SIDEBAR = ''; // Opsiyonel reklam birimi numarası girilebilir
  const GOOGLE_AD_SLOT_FEED = ''; // Opsiyonel reklam birimi numarası girilebilir

  useEffect(() => {
    if (GOOGLE_AD_CLIENT) {
      try {
        // @ts-ignore
        (window.adsbygoogle = window.adsbygoogle || []).push({});
      } catch (err) {
        console.error('AdSense error', err);
      }
    }
  }, []);

  // Eğer henüz AdSense ID girilmediyse (Geliştirme aşaması) şık yer tutucularımızı gösterelim
  if (!GOOGLE_AD_CLIENT || window.location.hostname === 'localhost') {
    if (type === 'sidebar') {
      return (
        <div className="p-4 rounded-xl bg-surface-container shadow-sm border border-outline-variant/30 flex flex-col items-center justify-center text-center overflow-hidden relative group">
          <div className="absolute top-0 right-0 bg-surface-container-high text-outline text-[10px] font-bold px-2 py-0.5 rounded-bl-lg uppercase tracking-wider">Google Reklam Alanı</div>
          <div className="w-full h-32 bg-surface-container-high rounded-lg mb-3 flex items-center justify-center">
            <span className="material-symbols-outlined text-[40px] text-outline opacity-30 group-hover:scale-110 transition-transform duration-500">storefront</span>
          </div>
          <p className="text-label-sm font-bold text-on-surface-variant line-clamp-2">Google AdSense Bekleniyor...</p>
        </div>
      );
    }

    return (
      <div className="w-full p-4 rounded-2xl bg-surface-container-low shadow-md border border-outline-variant/20 flex gap-4 relative overflow-hidden group hover:bg-surface-container transition-colors">
        <div className="absolute top-0 right-0 bg-surface-container-highest text-on-surface-variant text-[10px] font-bold px-2 py-0.5 rounded-bl-lg uppercase tracking-wider z-10">Google Ads (Sponsorlu)</div>
        <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-xl bg-surface-container-highest shrink-0 flex items-center justify-center">
          <span className="material-symbols-outlined text-[48px] text-outline opacity-30 group-hover:rotate-12 transition-transform duration-500">rocket_launch</span>
        </div>
        <div className="flex flex-col flex-1 justify-center">
          <h3 className="text-headline-sm font-bold text-on-surface mb-1 group-hover:text-primary transition-colors">Google Ads Alanı</h3>
          <p className="text-body-md text-on-surface-variant line-clamp-2 mb-2">AdSense kodunuz eklendiğinde burada gerçek reklamlar dönecek ve ödül havuzu dolacak.</p>
        </div>
      </div>
    );
  }

  // Gerçek Google AdSense HTML Kodu
  if (type === 'sidebar') {
    return (
      <div className="w-full relative min-h-[250px] bg-surface-container-lowest rounded-xl overflow-hidden shadow-sm border border-outline-variant/10 flex items-center justify-center">
        <span className="absolute text-outline text-[10px] uppercase font-bold top-2 right-2 opacity-50 z-0">Reklam Alanı</span>
        <ins className="adsbygoogle relative z-10 w-full h-full"
            style={{ display: 'block' }}
            data-ad-client={GOOGLE_AD_CLIENT}
            data-ad-slot={GOOGLE_AD_SLOT_SIDEBAR}
            data-ad-format="auto"
            data-full-width-responsive="true"></ins>
      </div>
    );
  }

  return (
    <div className="w-full relative min-h-[120px] mb-6 bg-surface-container-lowest rounded-2xl overflow-hidden shadow-sm border border-outline-variant/10 flex items-center justify-center">
      <span className="absolute text-outline text-[10px] uppercase font-bold top-2 right-2 opacity-50 z-0">Sponsorlu Bağlantı</span>
      <ins className="adsbygoogle relative z-10 w-full h-full"
          style={{ display: 'block', textAlign: 'center' }}
          data-ad-layout="in-article"
          data-ad-format="fluid"
          data-ad-client={GOOGLE_AD_CLIENT}
          data-ad-slot={GOOGLE_AD_SLOT_FEED}></ins>
    </div>
  );
}
