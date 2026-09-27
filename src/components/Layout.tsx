import { useState } from 'react';
import type { ReactNode } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { CreatePostModal } from './CreatePostModal';
import { CreateCommunityModal } from './CreateCommunityModal';
import { AdSlot } from './AdSlot';
import { supabase } from '../lib/supabase';

export function Layout({ children, onLogout, username }: { children: ReactNode, onLogout: () => void, username?: string }) {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isCreateCommunityModalOpen, setIsCreateCommunityModalOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const location = useLocation();
  const [myRooms, setMyRooms] = useState<any[]>([]);

  // Toplulukları getir
  useEffect(() => {
    const fetchMyRooms = async () => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) return;
      
      const { data, error } = await supabase
        .from('room_members')
        .select('rooms(id, name, slug)')
        .eq('user_id', userData.user.id);
        
      if (!error && data) {
        // @ts-ignore
        setMyRooms(data.map(item => item.rooms).filter(Boolean));
      }
    };
    
    fetchMyRooms();
  }, [isCreateCommunityModalOpen]); // Modal kapanınca yenile


  // Extract roomSlug from /rooms/:slug URL to pass it automatically to modal
  const match = location.pathname.match(/\/rooms\/([^/]+)/);
  const currentRoomSlug = match ? match[1] : null;

  return (
    <div className="bg-background font-body-md text-on-surface antialiased selection:bg-primary-container selection:text-on-primary-container">
      <header className="fixed top-0 left-0 right-0 z-50 w-full bg-surface-container-lowest/90 backdrop-blur-xl border-b border-surface-container-highest shadow-[0_4px_24px_rgba(0,0,0,0.6)]">
        <div className="h-16 w-full max-w-[1440px] mx-auto px-4 flex items-center justify-between gap-space-md">
          <div className="flex items-center gap-space-md shrink-0">
            <Link to="/" className="flex items-center gap-2.5 group">
              <span className="font-display-lg text-[24px] font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-on-surface to-on-surface-variant group-hover:to-primary transition-all">
                MemeVersene
              </span>
            </Link>
          </div>
          <div className="flex-1 max-w-xl mx-auto hidden md:block">
            <div className="relative flex items-center w-full">
              <span className="material-symbols-outlined absolute left-3.5 text-outline pointer-events-none text-headline-sm">search</span>
              <input 
                className="w-full h-10 pl-11 pr-4 bg-surface-container-low rounded-xl text-on-surface placeholder:text-outline text-body-sm border border-outline-variant/30 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary focus:bg-surface-container transition-all shadow-inner" 
                placeholder="Meme, topluluk veya etiket ara... (⌘K)" 
                type="text" 
              />
            </div>
          </div>
          <div className="flex items-center gap-space-sm shrink-0">
            <Link to="/messages" aria-label="Mesajlar" className="relative w-9 h-9 rounded-xl bg-surface-container flex items-center justify-center text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high transition-colors">
              <span className="material-symbols-outlined text-headline-sm">chat</span>
              {false && <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-secondary ring-2 ring-surface-container-lowest shadow-[0_0_8px_rgba(113,202,201,0.8)]"></span>}
            </Link>
            
            <Link to="/notifications" aria-label="Bildirimler" className="relative w-9 h-9 rounded-xl bg-surface-container flex items-center justify-center text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high transition-colors">
              <span className="material-symbols-outlined text-headline-sm">notifications</span>
              {false && <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-primary ring-2 ring-surface-container-lowest shadow-[0_0_8px_rgba(255,178,191,0.8)]"></span>}
            </Link>
            
            <button 
              onClick={() => setIsCreateModalOpen(true)}
              className="hidden sm:flex items-center gap-2 h-9 px-4 rounded-xl bg-gradient-to-r from-secondary to-primary-container hover:from-secondary-fixed hover:to-primary text-on-primary-container font-headline-sm text-label-lg font-bold shadow-[0_0_16px_rgba(224,135,152,0.35)] hover:shadow-[0_0_24px_rgba(224,135,152,0.55)] hover:scale-[1.02] active:scale-[0.98] transition-all shrink-0" 
              type="button"
            >
              <span className="material-symbols-outlined text-headline-sm">add</span>
              <span>Post Oluştur</span>
            </button>

            <div className="flex items-center pl-2 ml-1 border-l border-surface-container-highest relative">
              <button 
                onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                className="flex items-center justify-center w-9 h-9 cursor-pointer group transition-transform hover:scale-105" 
                title="Profil Menüsü"
                type="button"
              >
                <div className="relative">
                  <div className="w-8 h-8 rounded-full bg-primary-container flex items-center justify-center text-on-primary-container font-bold text-label-md ring-2 ring-transparent group-hover:ring-primary transition-all">
                    {(username || 'U').charAt(0).toUpperCase()}
                  </div>
                  <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-surface-container-lowest shadow-[0_0_6px_rgba(16,185,129,0.6)]"></span>
                </div>
              </button>

              {/* Profile Dropdown Menu */}
              {isProfileMenuOpen && (
                <>
                  {/* Backdrop for closing */}
                  <div className="fixed inset-0 z-40" onClick={() => setIsProfileMenuOpen(false)}></div>
                  <div className="absolute right-0 top-12 w-56 rounded-2xl bg-surface-container-high border border-outline-variant/30 shadow-[0_8px_32px_rgba(0,0,0,0.5)] z-50 overflow-hidden py-2 flex flex-col animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="px-4 py-2 border-b border-surface-container-highest mb-1">
                      <p className="text-label-sm text-outline font-medium">Giriş yapıldı</p>
                      <p className="text-body-md font-bold text-on-surface truncate">u/{username || 'kullanici'}</p>
                    </div>
                    
                    <Link 
                      to={`/u/${username || 'kullanici'}`} 
                      onClick={() => setIsProfileMenuOpen(false)}
                      className="flex items-center gap-3 px-4 py-2.5 text-on-surface hover:bg-surface-container-highest hover:text-primary transition-colors"
                    >
                      <span className="material-symbols-outlined text-headline-sm">person</span>
                      <span className="font-label-md text-label-md font-bold">Profilim</span>
                    </Link>

                    <button 
                      onClick={() => {
                        setIsProfileMenuOpen(false);
                        setIsCreateCommunityModalOpen(true);
                      }}
                      className="flex items-center gap-3 px-4 py-2.5 text-on-surface hover:bg-surface-container-highest hover:text-secondary transition-colors w-full text-left"
                      type="button"
                    >
                      <span className="material-symbols-outlined text-headline-sm">add_business</span>
                      <span className="font-label-md text-label-md font-bold">Topluluk Kur</span>
                    </button>
                    
                    <button 
                      onClick={() => {
                        setIsProfileMenuOpen(false);
                        alert("Ayarlar sayfası henüz geliştirme aşamasındadır. Yakında şifre, tema ve kullanıcı adı değişikliklerinizi buradan yapabileceksiniz.");
                      }}
                      className="flex items-center gap-3 px-4 py-2.5 text-on-surface hover:bg-surface-container-highest hover:text-primary transition-colors w-full text-left"
                      type="button"
                    >
                      <span className="material-symbols-outlined text-headline-sm">settings</span>
                      <span className="font-label-md text-label-md font-bold">Ayarlar</span>
                    </button>
                    
                    <button 
                      onClick={() => {
                        document.documentElement.classList.toggle('dark');
                        setIsProfileMenuOpen(false);
                      }}
                      className="flex items-center gap-3 px-4 py-2.5 text-on-surface hover:bg-surface-container-highest hover:text-primary transition-colors w-full text-left"
                      type="button"
                    >
                      <span className="material-symbols-outlined text-headline-sm">dark_mode</span>
                      <span className="font-label-md text-label-md font-bold">Tema Değiştir</span>
                    </button>
                    
                    <div className="h-px bg-surface-container-highest my-1"></div>
                    
                    <button 
                      onClick={() => {
                        setIsProfileMenuOpen(false);
                        onLogout();
                      }}
                      className="flex items-center gap-3 px-4 py-2.5 text-error hover:bg-error-container/20 transition-colors w-full text-left"
                      type="button"
                    >
                      <span className="material-symbols-outlined text-headline-sm">logout</span>
                      <span className="font-label-md text-label-md font-bold">Çıkış Yap</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </header>
      
      <div className="w-full max-w-[1440px] mx-auto px-4 pt-16">
        <div className="flex items-start gap-space-lg" id="main-layout-container">
          <aside className="w-64 shrink-0 hidden lg:block sticky top-[64px] h-[calc(100vh-64px)] overflow-y-auto py-space-md" id="left-sidebar">
            <div className="p-space-md rounded-xl bg-surface-container-low/70 border border-outline-variant/20 backdrop-blur-md mb-space-md">
              <div className="text-label-sm font-label-sm uppercase tracking-wider text-outline mb-space-sm px-2">Gezinme</div>
              <nav className="flex flex-col gap-1">
                <NavLink to="/" end className={({isActive}) => `flex items-center gap-2.5 px-3 py-2 rounded-lg text-body-md font-body-md transition-colors ${isActive ? 'bg-primary-container text-on-primary-container font-bold shadow-sm' : 'text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface'}`}>
                  <span className="material-symbols-outlined text-body-lg">dynamic_feed</span>
                  <span>Akış</span>
                </NavLink>
                <NavLink to="/popular" className={({isActive}) => `flex items-center gap-2.5 px-3 py-2 rounded-lg text-body-md font-body-md transition-colors ${isActive ? 'bg-primary-container text-on-primary-container font-bold shadow-sm' : 'text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface'}`}>
                  <span className="material-symbols-outlined text-body-lg">local_fire_department</span>
                  <span>Popüler</span>
                </NavLink>
                <NavLink to="/saved" className={({isActive}) => `flex items-center gap-2.5 px-3 py-2 rounded-lg text-body-md font-body-md transition-colors ${isActive ? 'bg-primary-container text-on-primary-container font-bold shadow-sm' : 'text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface'}`}>
                  <span className="material-symbols-outlined text-body-lg">bookmark</span>
                  <span>Kaydedilenler</span>
                </NavLink>
                <NavLink to="/liked" className={({isActive}) => `flex items-center gap-2.5 px-3 py-2 rounded-lg text-body-md font-body-md transition-colors ${isActive ? 'bg-primary-container text-on-primary-container font-bold shadow-sm' : 'text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface'}`}>
                  <span className="material-symbols-outlined text-body-lg">favorite</span>
                  <span>Beğenilenler</span>
                </NavLink>
              </nav>
            </div>
            
            <div className="p-space-md rounded-xl bg-surface-container-low/70 border border-outline-variant/20 backdrop-blur-md flex flex-col gap-2">
                <div className="flex items-center justify-between px-2 pt-1 pb-1">
                  <span className="text-label-sm font-label-sm uppercase tracking-wider text-outline">Topluluklar / Odalar</span>
                  <button 
                    onClick={() => setIsCreateCommunityModalOpen(true)}
                    className="w-6 h-6 rounded-full bg-surface-container hover:bg-surface-container-high flex items-center justify-center text-on-surface-variant hover:text-primary transition-colors"
                    title="Yeni Topluluk Kur"
                  >
                    <span className="material-symbols-outlined text-[16px]">add</span>
                  </button>
                </div>
                
                {myRooms.length > 0 ? (
                  <div className="flex flex-col gap-1 mt-1">
                    {myRooms.map(room => (
                      <NavLink 
                        key={room.id}
                        to={`/rooms/${room.slug}`} 
                        className={({isActive}) => `flex items-center gap-2.5 px-3 py-2 rounded-lg text-body-md font-body-md transition-colors ${isActive ? 'bg-primary-container text-on-primary-container font-bold shadow-sm' : 'text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface'}`}
                      >
                        <div className="w-6 h-6 rounded-md bg-surface-container-highest flex items-center justify-center text-outline text-[12px] font-bold">
                          {room.name.substring(0, 2).toUpperCase()}
                        </div>
                        <span className="truncate">{room.name}</span>
                      </NavLink>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-6 px-2 text-center gap-2 bg-surface-container-lowest/50 rounded-xl border border-outline-variant/10">
                    <span className="material-symbols-outlined text-outline text-[32px] opacity-50 mb-1">mark_email_unread</span>
                    <p className="text-body-sm font-body-sm text-on-surface-variant leading-snug">
                      Henüz hiçbir topluluğa katılmadın.
                    </p>
                    <p className="text-label-sm font-label-sm text-primary font-bold">
                      Sadece davet ile katılabilirsin!
                    </p>
                  </div>
                )}
              </div>
          </aside>

          <main className="flex-1 min-w-0 min-h-[calc(100vh-64px)] pb-space-xl py-space-md">
            <div className="flex flex-col w-full">
              <div className="grid grid-cols-1 gap-space-lg w-full items-start">
                <div className="w-full flex flex-col gap-space-md min-w-0">
                  {children}
                </div>
              </div>
            </div>
          </main>

          {!location.pathname.startsWith('/post/') && (
            <aside className="w-80 shrink-0 hidden xl:block sticky top-16 h-[calc(100vh-64px)] overflow-y-auto py-space-md" id="right-sidebar">
              <div className="flex flex-col gap-space-md">
                {location.pathname.startsWith('/u/') ? (
                <>
                  <div className="p-5 rounded-2xl bg-surface-container shadow-lg border border-outline-variant/20">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-primary text-headline-md" style={{ fontVariationSettings: "'FILL' 1" }}>military_tech</span>
                        <h3 className="font-headline-sm text-headline-sm font-bold text-on-surface">Başarımlar &amp; Rozetler</h3>
                      </div>
                      <span className="font-label-sm text-label-sm text-outline">4/12 Açıldı</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2.5">
                      <div className="p-3 rounded-xl bg-surface-container-high flex flex-col gap-1.5 hover:bg-surface-container-highest transition-colors">
                        <span className="text-headline-md">🏆</span>
                        <span className="font-label-md text-label-md font-bold text-on-surface">Ayın Şampiyonu</span>
                        <p className="font-body-sm text-body-sm text-outline leading-tight">Ekim 2024 en yüksek upvote</p>
                      </div>
                      <div className="p-3 rounded-xl bg-surface-container-high flex flex-col gap-1.5 hover:bg-surface-container-highest transition-colors">
                        <span className="text-headline-md">⚡</span>
                        <span className="font-label-md text-label-md font-bold text-primary">Viral Üretici</span>
                        <p className="font-body-sm text-body-sm text-outline leading-tight">100k+ görüntülenen tekil meme</p>
                      </div>
                      <div className="p-3 rounded-xl bg-surface-container-high flex flex-col gap-1.5 hover:bg-surface-container-highest transition-colors">
                        <span className="text-headline-md">🔥</span>
                        <span className="font-label-md text-label-md font-bold text-secondary">100k Upvote</span>
                        <p className="font-body-sm text-body-sm text-outline leading-tight">Platform geneli 100k barajı</p>
                      </div>
                      <div className="p-3 rounded-xl bg-surface-container-high flex flex-col gap-1.5 hover:bg-surface-container-highest transition-colors">
                        <span className="text-headline-md">💎</span>
                        <span className="font-label-md text-label-md font-bold text-on-surface">Kurucu Üye</span>
                        <p className="font-body-sm text-body-sm text-outline leading-tight">İlk 1000 beta kullanıcısı</p>
                      </div>
                    </div>
                    <button className="w-full mt-3 py-2 rounded-lg bg-surface-container-lowest/60 text-primary hover:text-on-surface font-label-sm text-label-sm font-semibold transition-colors text-center" type="button">Tüm 12 Rozeti Görüntüle →</button>
                  </div>

                  <div className="p-5 rounded-2xl bg-surface-container shadow-lg border border-outline-variant/20">
                    <div className="flex items-center gap-2 mb-4">
                      <span className="material-symbols-outlined text-secondary text-headline-md">shield_person</span>
                      <h3 className="font-headline-sm text-headline-sm font-bold text-on-surface">Yönettiği Odalar</h3>
                    </div>
                    {myRooms.length > 0 ? (
                      <div className="flex flex-col gap-2">
                        {myRooms.map(room => (
                          <Link key={room.id} to={`/rooms/${room.slug}`} className="flex items-center gap-3 p-2 rounded-lg hover:bg-surface-container-high transition-colors">
                            <div className="w-8 h-8 rounded-lg bg-surface-container-highest flex items-center justify-center text-outline text-[14px] font-bold">
                              {room.name.substring(0, 2).toUpperCase()}
                            </div>
                            <span className="text-body-sm font-bold text-on-surface flex-1 truncate">{room.name}</span>
                            <span className="material-symbols-outlined text-[16px] text-outline">chevron_right</span>
                          </Link>
                        ))}
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center p-4 text-center rounded-xl bg-surface-container-low/50 border border-outline-variant/10">
                        <span className="text-body-sm font-body-sm text-outline">Henüz yönetilen bir oda yok.</span>
                      </div>
                    )}
                  </div>

                  <div className="p-5 rounded-2xl bg-surface-container shadow-lg border border-outline-variant/20">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-headline-sm text-headline-sm font-bold text-on-surface">Karma &amp; Sosyal</h3>
                    </div>
                    <div className="flex flex-col items-center justify-center p-4 text-center rounded-xl bg-surface-container-low/50 border border-outline-variant/10">
                      <span className="text-body-sm font-body-sm text-outline">Topluluk verisi bulunamadı.</span>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-surface-container-low/70 border border-outline-variant/20 text-body-sm text-outline flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <span className="text-label-sm font-label-sm font-bold text-on-surface">Topluluk Kuralları</span>
                      <span className="material-symbols-outlined text-headline-sm">gavel</span>
                    </div>
                    <p className="text-body-sm text-on-surface-variant">Saygılı ol, telifli içeriklerde kaynak belirt ve spoiler etiketlerini kullan.</p>
                    <div className="flex flex-wrap gap-2 text-label-sm text-outline pt-2 border-t border-outline-variant/20">
                      <a className="hover:text-primary transition-colors" href="#">Gizlilik</a><span>•</span>
                      <a className="hover:text-primary transition-colors" href="#">Kullanım Şartları</a><span>•</span>
                      <span>© 2026 MemeVersene</span>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  {location.pathname.startsWith('/rooms/') ? (
                    <>
                  {/* Room Specific Right Sidebar */}
                  <div className="p-space-md rounded-xl bg-surface-container-low/70 border border-outline-variant/20 backdrop-blur-md shadow-lg flex flex-col gap-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-headline-sm font-headline-sm font-bold text-on-surface">
                        <span className="material-symbols-outlined text-primary">info</span>
                        <span>Topluluk Hakkında</span>
                      </div>
                      <span className="text-label-sm font-label-sm text-outline">Ekim 2021</span>
                    </div>
                    <p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed">
                      m/{currentRoomSlug}, Türkiye'nin ve internet kültürünün en orijinal görsel ve video mizah topluluğudur. Günde binlerce yeni içerik, yüzbinlerce reaksiyon.
                    </p>
                    <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-surface-container shadow-inner border border-outline-variant/15">
                      <div className="flex flex-col">
                        <span className="font-headline-md text-headline-md font-bold text-on-surface">320,412</span>
                        <span className="font-label-sm text-label-sm text-outline">Kayıtlı Üye</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="font-headline-md text-headline-md font-bold text-primary flex items-center gap-1">
                          4,831
                          <span className="w-2 h-2 rounded-full bg-primary inline-block"></span>
                        </span>
                        <span className="font-label-sm text-label-sm text-outline">Çevrimiçi</span>
                      </div>
                    </div>
                    {/* Moderators */}
                    <div className="flex flex-col gap-2 pt-1 border-t border-outline-variant/20">
                      <div className="font-label-sm text-label-sm uppercase tracking-wider text-outline font-bold">Moderatörler</div>
                      <div className="flex flex-col gap-1.5">
                        <div className="flex items-center justify-between py-1">
                          <div className="flex items-center gap-2">
                            <span className="w-6 h-6 rounded-full bg-primary-container text-on-primary-container font-label-sm font-bold flex items-center justify-center">M</span>
                            <span className="font-label-md text-label-md text-on-surface">u/mizah_patronu</span>
                          </div>
                          <span className="font-label-sm text-label-sm text-outline">Baş Mod</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="p-space-md rounded-xl bg-surface-container-low/70 border border-outline-variant/20 backdrop-blur-md shadow-lg flex flex-col gap-3">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2 text-headline-sm font-headline-sm font-bold text-on-surface">
                        <span className="material-symbols-outlined text-secondary">gavel</span>
                        <span>Kurallar</span>
                      </div>
                    </div>
                    <div className="flex flex-col gap-2">
                      <div className="p-2.5 rounded-lg bg-surface-container/60 hover:bg-surface-container transition-colors border border-outline-variant/10">
                        <p className="font-label-md text-label-md font-bold text-on-surface">1. Özgün ve komik ol</p>
                        <p className="font-body-sm text-body-sm text-outline mt-0.5">Düşük eforlu veya bayatlamış şablonlar kaldırılır.</p>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  {/* General Right Sidebar is now empty or focused on ads */}
                </>
              )}

                  {/* Sidebar Ad Slot */}
                  <AdSlot type="sidebar" />

                  {/* Shared Reward Widget */}
                  <div className="relative p-5 rounded-xl bg-gradient-to-br from-surface-container-low via-surface-container to-secondary-container/20 border border-outline-variant/20 shadow-xl overflow-hidden mt-4">
                    <div className="absolute -right-6 -bottom-6 w-32 h-32 rounded-full bg-primary-container/10 blur-2xl pointer-events-none"></div>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-primary text-headline-lg">savings</span>
                        <h3 className="font-headline-sm text-headline-sm font-bold text-on-surface">Ödül Havuzu</h3>
                      </div>
                      <span className="px-2 py-0.5 rounded-full bg-primary/20 text-primary font-label-sm text-label-sm font-bold">Hedef: 200 ₺</span>
                    </div>
                    <p className="text-body-sm text-on-surface-variant mb-4 leading-tight">
                      Reklam gelirleri bu havuzu doldurur. Hedefe ulaşınca, en son dağıtımdan bu yana en çok upvote alan kullanıcı tüm ödülü kazanır!
                    </p>
                    <div className="p-3.5 rounded-xl bg-surface-container-lowest/80 backdrop-blur-md shadow-inner flex flex-col justify-between mb-4 border border-outline-variant/15">
                      <div className="flex justify-between items-end mb-1">
                        <span className="font-label-sm text-label-sm text-outline">Şu anki Havuz</span>
                        <span className="font-label-sm text-label-sm text-primary font-bold">42.50 ₺</span>
                      </div>
                      <div className="w-full h-2.5 rounded-full bg-surface-container-highest overflow-hidden mt-1 relative">
                        <div className="absolute top-0 left-0 h-full bg-gradient-to-r from-secondary to-primary-container rounded-full" style={{ width: '21.25%' }}></div>
                      </div>
                    </div>
                  </div>

                  {/* Footer Links */}
                  <footer className="px-2 py-3 text-label-sm font-label-sm text-outline/80 flex flex-wrap gap-x-3 gap-y-1.5 leading-relaxed">
                    <a className="hover:text-primary transition-colors" href="#">Hakkında</a>
                    <span>•</span>
                    <a className="hover:text-primary transition-colors" href="#">Gizlilik</a>
                    <span>•</span>
                    <a className="hover:text-primary transition-colors" href="#">Kurallar</a>
                    <span>•</span>
                    <span>© 2026 MemeVersene</span>
                  </footer>
                </>
              )}
            </div>
          </aside>
          )}
        </div>
      </div>

      {isCreateModalOpen && (
        <CreatePostModal onClose={() => setIsCreateModalOpen(false)} defaultRoomSlug={currentRoomSlug || undefined} />
      )}

      {isCreateCommunityModalOpen && (
        <CreateCommunityModal
          onClose={() => setIsCreateCommunityModalOpen(false)}
          onSuccess={(slug) => {
            setIsCreateCommunityModalOpen(false);
            window.location.href = `/rooms/${slug}`;
          }}
        />
      )}
    </div>
  );
}
