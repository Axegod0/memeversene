import { useState } from 'react';

export function Notifications() {
  const [activeFilter, setActiveFilter] = useState('tümü'); // 'tümü', 'yanitlar', 'begeniler', 'bahsetmeler'

  const dummyNotifications: any[] = [];

  return (
    <div className="w-full max-w-3xl mx-auto min-h-[calc(100vh-64px)] pt-space-lg pb-space-2xl px-4">
      
      <div className="flex items-center justify-between mb-space-lg">
        <h1 className="text-display-sm font-display-sm font-black text-on-surface">Bildirimler</h1>
        <button className="text-primary hover:text-primary-hover font-label-md text-label-md transition-colors font-bold">
          Tümünü okundu işaretle
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-space-md overflow-x-auto pb-2 scrollbar-hide">
        {['tümü', 'yanıtlar', 'beğeniler', 'bahsetmeler'].map((filter) => (
          <button 
            key={filter}
            onClick={() => setActiveFilter(filter)}
            className={`px-4 py-1.5 rounded-full text-label-md font-bold capitalize whitespace-nowrap transition-all ${
              activeFilter === filter 
                ? 'bg-primary text-on-primary shadow-sm' 
                : 'bg-surface-container-high text-on-surface hover:bg-surface-container-highest border border-outline-variant/20'
            }`}
          >
            {filter}
          </button>
        ))}
      </div>

      {/* Notifications List */}
      <div className="flex flex-col gap-2">
        {dummyNotifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
            <span className="material-symbols-outlined text-[64px] text-outline opacity-20 mb-4">notifications_off</span>
            <h2 className="text-headline-sm font-bold text-on-surface mb-2">Gösterilecek bildirim yok</h2>
            <p className="text-body-md text-outline">Burada bir hareketlilik olduğunda sana haber vereceğiz.</p>
          </div>
        ) : (
          dummyNotifications.map((notif) => (
            <div 
              key={notif.id} 
              className={`flex items-start gap-4 p-4 rounded-2xl border transition-all cursor-pointer ${
                notif.unread 
                  ? 'bg-surface-container-low border-primary/30 shadow-[0_4px_16px_rgba(255,178,191,0.05)] hover:border-primary/50' 
                  : 'bg-surface-container/50 border-outline-variant/10 hover:bg-surface-container-high'
              }`}
            >
              <div className="relative shrink-0">
                <div className="w-12 h-12 rounded-full bg-surface-container-highest flex items-center justify-center font-bold text-headline-sm text-on-surface">
                  {notif.avatar}
                </div>
                <div className={`absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-surface-container-lowest flex items-center justify-center shadow-sm`}>
                  <span className={`material-symbols-outlined text-[14px] ${notif.iconColor}`}>
                    {notif.icon}
                  </span>
                </div>
              </div>

              <div className="flex-1 min-w-0 pt-1">
                <p className="text-body-md text-on-surface">
                  <span className="font-bold text-on-surface hover:text-primary transition-colors cursor-pointer mr-1">
                    {notif.user === 'Sistem' ? 'Sistem' : `u/${notif.user}`}
                  </span>
                  <span className={notif.unread ? 'text-on-surface font-medium' : 'text-on-surface-variant'}>
                    {notif.content}
                  </span>
                </p>
                <span className="text-label-sm text-outline mt-1 block">{notif.time}</span>
              </div>

              {notif.unread && (
                <div className="w-2.5 h-2.5 rounded-full bg-primary mt-3 shrink-0 shadow-[0_0_8px_rgba(255,178,191,0.6)]"></div>
              )}
            </div>
          ))
        )}
      </div>

    </div>
  );
}
