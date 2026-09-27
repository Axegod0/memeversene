import { useState } from 'react';

export function Messages() {
  const [activeTab, setActiveTab] = useState('tümü');

  const dummyConversations: any[] = [];

  return (
    <div className="w-full max-w-[1440px] mx-auto min-h-[calc(100vh-64px)] flex gap-space-lg">
      
      {/* Conversations List Sidebar */}
      <div className="w-80 shrink-0 border-r border-surface-container-highest flex flex-col h-[calc(100vh-64px)] bg-surface-container-low/30">
        <div className="p-4 border-b border-surface-container-highest">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-headline-sm font-headline-sm font-bold text-on-surface">Mesajlar</h1>
            <button className="w-8 h-8 rounded-full bg-surface-container hover:bg-surface-container-high flex items-center justify-center transition-colors">
              <span className="material-symbols-outlined text-body-lg text-on-surface">edit_square</span>
            </button>
          </div>
          
          <div className="relative">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-body-lg">search</span>
            <input 
              type="text" 
              placeholder="Mesajlarda ara..." 
              className="w-full h-10 pl-10 pr-4 rounded-xl bg-surface-container-high text-on-surface text-body-sm focus:outline-none focus:ring-1 focus:ring-primary border border-transparent focus:border-primary transition-all"
            />
          </div>
        </div>

        <div className="flex gap-2 p-2 border-b border-surface-container-highest">
          <button 
            onClick={() => setActiveTab('tümü')}
            className={`flex-1 py-1.5 rounded-lg text-label-sm font-bold transition-all ${activeTab === 'tümü' ? 'bg-surface-container-highest text-on-surface shadow-sm' : 'text-outline hover:bg-surface-container-high hover:text-on-surface-variant'}`}
          >
            Tümü
          </button>
          <button 
            onClick={() => setActiveTab('okunmamis')}
            className={`flex-1 py-1.5 rounded-lg text-label-sm font-bold transition-all ${activeTab === 'okunmamis' ? 'bg-surface-container-highest text-on-surface shadow-sm' : 'text-outline hover:bg-surface-container-high hover:text-on-surface-variant'}`}
          >
            Okunmamış
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {dummyConversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center p-6 gap-2">
              <span className="material-symbols-outlined text-[48px] text-outline opacity-20">chat_bubble</span>
              <p className="text-body-sm font-medium text-outline">Henüz hiç mesajın yok.</p>
            </div>
          ) : (
            dummyConversations.map((chat) => (
              <div key={chat.id} className="flex items-center gap-3 p-4 hover:bg-surface-container-high cursor-pointer transition-colors border-b border-surface-container-highest/50 group">
                <div className="relative shrink-0">
                  <div className="w-12 h-12 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center font-bold text-headline-sm">
                    {chat.avatar}
                  </div>
                  {chat.unread > 0 && (
                    <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-secondary ring-2 ring-background rounded-full border border-background"></span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-baseline mb-1">
                    <h3 className="font-label-lg font-bold text-on-surface truncate group-hover:text-primary transition-colors">u/{chat.name}</h3>
                    <span className={`text-label-sm ${chat.unread > 0 ? 'text-secondary font-bold' : 'text-outline'}`}>{chat.time}</span>
                  </div>
                  <p className={`text-body-sm truncate ${chat.unread > 0 ? 'text-on-surface font-semibold' : 'text-on-surface-variant'}`}>
                    {chat.lastMessage}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Active Chat Window */}
      <div className="flex-1 flex flex-col h-[calc(100vh-64px)] bg-surface-container-lowest relative">
        {/* Empty Active Chat Window */}
        <div className="flex-1 flex flex-col items-center justify-center p-6">
          <span className="material-symbols-outlined text-[64px] text-outline opacity-20 mb-4">forum</span>
          <h2 className="text-headline-sm font-bold text-on-surface mb-2">Mesajlaşmaya Başla</h2>
          <p className="text-body-md text-outline text-center max-w-sm">Sol taraftan bir sohbet seç veya yeni bir mesaj başlatmak için oluştur ikonuna tıkla.</p>
        </div>

      </div>
    </div>
  );
}
