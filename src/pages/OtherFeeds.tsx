import { Link } from 'react-router-dom';

export function OtherFeeds({ type }: { type: 'popular' | 'saved' | 'liked' }) {
  const content = {
    popular: {
      title: 'Popüler',
      icon: 'local_fire_department',
      iconColor: 'text-secondary',
      message: 'Popüler akış henüz hazırlanıyor. Şimdilik ana sayfadaki "Popüler" sekmesini kullanabilirsin.',
    },
    saved: {
      title: 'Kaydedilenler',
      icon: 'bookmark',
      iconColor: 'text-primary',
      message: 'Henüz hiçbir gönderiyi kaydetmedin. Gönderileri kaydederek burada biriktirebilirsin.',
    },
    liked: {
      title: 'Beğenilenler',
      icon: 'favorite',
      iconColor: 'text-rose-500',
      message: 'Beğendiğin gönderiler yakında burada listelenecek.',
    }
  };

  const current = content[type];

  return (
    <div className="w-full flex flex-col items-center justify-center min-h-[50vh] text-center p-8">
      <span className={`material-symbols-outlined text-[80px] mb-6 opacity-80 ${current.iconColor}`}>
        {current.icon}
      </span>
      <h1 className="text-display-sm font-bold text-on-surface mb-4">{current.title}</h1>
      <p className="text-body-lg text-outline max-w-md mb-8">{current.message}</p>
      
      <Link to="/" className="px-6 py-3 rounded-xl bg-surface-container-high hover:bg-surface-container-highest text-on-surface font-bold transition-colors">
        Ana Akışa Dön
      </Link>
    </div>
  );
}
