import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import ReactPlayer from 'react-player';

interface Post {
  id: string;
  user_id: string;
  room_id: string;
  caption: string;
  video_url: string;
  video_type: 'youtube' | 'tiktok' | 'tiktok_native' | 'image';
  video_id: string;
  upvotes: number;
  created_at: string;
  profiles?: { username: string };
  rooms?: { name: string, slug: string };
}

interface Comment {
  id: string;
  post_id: string;
  user_id: string;
  parent_id: string | null;
  content: string;
  created_at: string;
  profiles?: { username: string };
}

export function PostDetail() {
  const { id } = useParams<{ id: string }>();
  const [post, setPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [userVote, setUserVote] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      fetchPost();
      fetchComments();
      fetchUserVote();
    }
    
    // Subscribe to comments
    const channel = supabase
      .channel('public:comments')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'comments', filter: `post_id=eq.${id}` }, () => {
        fetchComments();
      })
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [id]);

  const fetchPost = async () => {
    const { data, error } = await supabase
      .from('posts')
      .select('*, profiles!posts_user_id_fkey(username), rooms(name, slug)')
      .eq('id', id)
      .single();
    if (!error && data) {
      setPost(data as Post);
      fetchPermissions(data.room_id);
    }
    setLoading(false);
  };

  const fetchPermissions = async (roomId: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    setCurrentUserId(user.id);
    if (!roomId) return;
    const { data } = await supabase.from('room_members').select('role').eq('room_id', roomId).eq('user_id', user.id).single();
    if (data) {
      setUserRole(data.role);
    }
  };

  const fetchComments = async () => {
    const { data, error } = await supabase
      .from('comments')
      .select('*, profiles!comments_user_id_fkey(username)')
      .eq('post_id', id)
      .order('created_at', { ascending: false });
    if (!error && data) {
      setComments(data as Comment[]);
    }
  };

  const fetchUserVote = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase
      .from('votes')
      .select('vote_type')
      .eq('post_id', id)
      .eq('user_id', user.id)
      .single();
    if (data) {
      setUserVote(data.vote_type);
    }
  };

  const handleVote = async (voteType: number) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return alert('Oy vermek için giriş yapmalısınız!');

    let newVoteType = voteType;
    if (userVote === voteType) newVoteType = 0;

    const previousVote = userVote;
    setUserVote(newVoteType);
    setPost(prev => {
      if (!prev) return prev;
      return { ...prev, upvotes: prev.upvotes - previousVote + newVoteType };
    });

    try {
      if (newVoteType === 0) {
        await supabase.from('votes').delete().match({ user_id: user.id, post_id: id });
      } else {
        await supabase.from('votes').upsert({ user_id: user.id, post_id: id, vote_type: newVoteType });
      }
    } catch (err) {
      console.error(err);
      fetchPost();
      fetchUserVote();
    }
  };

  const handlePostComment = async () => {
    if (!newComment.trim()) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return alert('Yorum yapmak için giriş yapmalısınız!');

    // Get current profile
    // Wait for the next block to handle profile data if needed

    const newCommentData = {
      post_id: id as string,
      user_id: user.id,
      content: newComment.trim()
    };

    const { data: insertedComment, error } = await supabase
      .from('comments')
      .insert(newCommentData)
      .select('*, profiles!comments_user_id_fkey(username)')
      .single();

    if (!error && insertedComment) {
      setNewComment('');
      // Optimistic UI for comments
      setComments(prev => [insertedComment as Comment, ...prev]);
    }
  };

  const handleDeletePost = async () => {
    if (!confirm('Bu postu silmek istediğinize emin misiniz?')) return;
    const { error } = await supabase.from('posts').delete().eq('id', id);
    if (!error) {
      // Redirect to home or room
      window.location.href = post?.rooms?.slug ? `/rooms/${post.rooms.slug}` : '/';
    } else {
      alert('Hata: ' + error.message);
    }
  };

  if (loading) return <div className="p-10 text-center text-on-surface">Yükleniyor...</div>;
  if (!post) return <div className="p-10 text-center text-on-surface">Gönderi bulunamadı.</div>;

  return (
    <>
      <div className="flex flex-col w-full">
        <div className="w-full mb-space-md">
          <Link to={`/rooms/${post.rooms?.slug || 'genel'}`} className="inline-flex items-center gap-space-xs text-on-surface-variant hover:text-primary transition-colors text-body-sm font-body-sm group">
            <span className="material-symbols-outlined text-headline-sm transition-transform group-hover:-translate-x-1">arrow_back</span>
            <span>m/{post.rooms?.slug || 'genel'} akışına dön</span>
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-lg w-full">
          <div className="lg:col-span-8 flex flex-col gap-space-lg">
            
            {/* Post Detail Article */}
            <article className="bg-surface-container rounded-xl shadow-xl overflow-hidden">
              <div className="p-space-md sm:p-space-lg flex flex-col gap-space-sm">
                <div className="flex items-center justify-between gap-space-sm flex-wrap">
                  <div className="flex items-center gap-space-xs text-body-sm font-body-sm text-outline">
                    <span className="font-headline-sm text-label-md text-primary font-bold bg-secondary-container/50 px-2 py-0.5 rounded-full">
                      m/{post.rooms?.slug}
                    </span>
                    <span>•</span>
                    <span className="text-on-surface-variant">
                      Paylaşan <Link to={`/u/${post.profiles?.username}`} className="text-on-surface hover:text-primary font-label-md">u/{post.profiles?.username}</Link>
                    </span>
                    <span>•</span>
                    <span>
                      {new Date(post.created_at).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })}
                    </span>
                    <span className="bg-primary/20 text-primary text-label-sm font-label-sm px-1.5 py-0.5 rounded">OC</span>
                  </div>
                  <div className="flex items-center gap-space-xs">
                    <button aria-label="Takip et" className="text-on-surface-variant hover:text-primary p-1 rounded-lg hover:bg-surface-container-high transition-colors" type="button">
                      <span className="material-symbols-outlined text-headline-sm">notifications</span>
                    </button>
                    <button aria-label="Daha fazla" className="text-on-surface-variant hover:text-on-surface p-1 rounded-lg hover:bg-surface-container-high transition-colors" type="button">
                      <span className="material-symbols-outlined text-headline-sm">more_horiz</span>
                    </button>
                  </div>
                </div>
                <h1 className="text-headline-lg font-headline-lg text-on-surface font-bold leading-tight">
                  {post.caption}
                </h1>
              </div>

              {/* Media Content */}
              <div className="relative bg-surface-container-lowest w-full group overflow-hidden flex justify-center bg-black/5">
                <div className={`relative w-full flex items-center justify-center bg-surface-container-lowest ${(post.video_type === 'image' || post.video_type === 'tiktok_native') ? 'bg-transparent' : 'aspect-video'}`}>
                  {post.video_type === 'image' ? (
                    <img 
                      src={post.video_id} 
                      alt={post.caption} 
                      className="w-full h-auto max-h-[700px] object-contain" 
                    />
                  ) : post.video_type === 'tiktok_native' ? (
                    <video 
                      src={post.video_url} 
                      className="w-full h-auto max-h-[700px] object-contain" 
                      controls
                      preload="metadata"
                      loop
                      playsInline
                    />
                  ) : (() => {
                    const Player = ReactPlayer as any;
                    return (
                      <Player 
                        url={post.video_url}
                        width="100%"
                        height="100%"
                        controls={true}
                        light={false}
                        className="absolute top-0 left-0"
                      />
                    );
                  })()}
                </div>
              </div>

              {/* Post Action Bar */}
              <div className="p-space-md sm:p-space-lg flex items-center justify-between gap-space-sm flex-wrap bg-surface-container">
                <div className="flex items-center bg-surface-container-low rounded-full p-1 shadow-inner border border-outline-variant/20">
                  <button 
                    onClick={() => handleVote(1)}
                    className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${userVote === 1 ? 'bg-secondary-container text-on-secondary-container' : 'text-primary hover:bg-secondary-container hover:text-on-secondary-container active:scale-95'}`} 
                    type="button"
                  >
                    <span className="material-symbols-outlined text-headline-sm" style={{ fontVariationSettings: "'FILL' 1" }}>arrow_upward</span>
                  </button>
                  <span className="font-label-lg text-label-lg font-bold text-primary px-2">{post.upvotes}</span>
                  <button 
                    onClick={() => handleVote(-1)}
                    className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${userVote === -1 ? 'bg-surface-container-high text-error' : 'text-outline hover:text-error hover:bg-surface-container-high active:scale-95'}`} 
                    type="button"
                  >
                    <span className="material-symbols-outlined text-headline-sm">arrow_downward</span>
                  </button>
                </div>
                
                <div className="flex items-center gap-space-xs text-on-surface-variant">
                  <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-surface-container-low hover:bg-surface-container-high text-on-surface hover:text-primary transition-colors border border-outline-variant/20" type="button">
                    <span className="material-symbols-outlined text-headline-sm">chat_bubble</span>
                    <span className="font-label-md text-label-md font-bold">{comments.length} Yorum</span>
                  </button>
                  <button 
                    onClick={() => {
                      navigator.clipboard.writeText(window.location.href);
                      alert('Bağlantı kopyalandı!');
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-surface-container-low hover:bg-surface-container-high text-on-surface hover:text-primary transition-colors border border-outline-variant/20" 
                    type="button"
                  >
                    <span className="material-symbols-outlined text-headline-sm">share</span>
                    <span className="font-label-md text-label-md hidden sm:inline">Paylaş</span>
                  </button>
                  <button 
                    onClick={() => alert('Post kaydedildi! (Yakında profilinize eklenecek)')}
                    className="p-2 rounded-xl bg-surface-container-low hover:bg-surface-container-high text-on-surface hover:text-primary transition-colors border border-outline-variant/20" 
                    title="Kaydet" 
                    type="button"
                  >
                    <span className="material-symbols-outlined text-headline-sm">bookmark</span>
                  </button>
                  <button 
                    onClick={() => alert('Post bildirildi. Moderatörler en kısa sürede inceleyecek.')}
                    className="p-2 rounded-xl bg-surface-container-low hover:bg-surface-container-high text-outline hover:text-error transition-colors border border-outline-variant/20" 
                    title="Bildir" 
                    type="button"
                  >
                    <span className="material-symbols-outlined text-headline-sm">flag</span>
                  </button>
                  {(post.user_id === currentUserId || userRole === 'owner' || userRole === 'admin') && (
                    <button 
                      onClick={handleDeletePost}
                      className="p-2 rounded-xl bg-surface-container-low hover:bg-error-container/50 text-outline hover:text-error transition-colors border border-outline-variant/20" 
                      title="Sil" 
                      type="button"
                    >
                      <span className="material-symbols-outlined text-headline-sm">delete</span>
                    </button>
                  )}
                </div>
              </div>
            </article>

            {/* Comments Section */}
            <section className="bg-surface-container rounded-xl p-space-md sm:p-space-lg shadow-xl flex flex-col gap-space-md">
              <div className="flex items-start gap-space-md">
                <div className="w-10 h-10 rounded-full bg-primary-container flex items-center justify-center shrink-0 mt-1 font-bold text-on-primary-container">
                  S
                </div>
                <div className="flex-1 flex flex-col bg-surface-container-low rounded-xl p-space-sm focus-within:ring-2 focus-within:ring-primary shadow-inner">
                  <textarea 
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    className="w-full bg-transparent resize-none text-on-surface placeholder:text-outline text-body-md font-body-md p-2 focus:outline-none" 
                    placeholder="Düşüncelerini veya bir karşı-meme patlat..." 
                    rows={3}
                  />
                  <div className="flex items-center justify-between gap-space-sm pt-space-xs mt-space-xs border-t border-surface-container-highest">
                    <div className="flex items-center gap-1 text-outline">
                      <button className="p-1.5 rounded hover:bg-surface-container-high hover:text-on-surface transition-colors" title="GIF Seç" type="button"><span className="material-symbols-outlined text-headline-sm">gif_box</span></button>
                    </div>
                    <button onClick={handlePostComment} className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-on-primary font-label-lg text-label-lg font-bold hover:scale-[1.02] active:scale-[0.98] shadow-[0_0_16px_rgba(255,178,191,0.4)] transition-all" type="button">
                      <span>Yorum Gönder</span>
                      <span className="material-symbols-outlined text-headline-sm">send</span>
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between py-space-xs border-b border-surface-container-highest mt-2">
                <div className="flex items-center gap-2">
                  <span className="text-label-md font-label-md text-outline">Sırala:</span>
                  <div className="relative inline-block">
                    <button className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-surface-container-low hover:bg-surface-container-high text-on-surface font-label-md text-label-md transition-colors" type="button">
                      <span className="text-primary font-bold">🔥 En İyiler</span>
                      <span className="material-symbols-outlined text-body-sm">expand_more</span>
                    </button>
                  </div>
                </div>
                <span className="text-label-sm font-label-sm text-outline uppercase tracking-wider font-semibold">{comments.length} Yanıt</span>
              </div>

              {/* Comments List (Flat for now, matching exact aesthetic) */}
              <div className="flex flex-col gap-space-lg mt-space-xs">
                {comments.length === 0 ? (
                  <div className="text-center text-outline py-8">Henüz yorum yok. İlk sen yaz!</div>
                ) : (
                  comments.map(comment => (
                    <div key={comment.id} className="flex items-start gap-space-sm">
                      <div className="w-9 h-9 rounded-full bg-surface-container-high flex items-center justify-center shrink-0 mt-0.5 text-on-surface font-bold text-label-sm">
                        {comment.profiles?.username?.slice(0, 2).toUpperCase() || 'U'}
                      </div>
                      <div className="flex-1 flex flex-col gap-1">
                        <div className="flex items-center gap-2 flex-wrap text-label-sm font-label-sm">
                          <Link to={`/u/${comment.profiles?.username}`} className="font-bold text-on-surface hover:text-primary transition-colors">
                            u/{comment.profiles?.username}
                          </Link>
                          <span className="text-outline">• {new Date(comment.created_at).toLocaleDateString('tr-TR')}</span>
                        </div>
                        <p className="text-body-md font-body-md text-on-surface leading-relaxed mt-1">
                          {comment.content}
                        </p>
                        <div className="flex items-center gap-space-sm mt-space-xs text-on-surface-variant">
                          <div className="flex items-center bg-surface-container-low rounded-lg p-0.5">
                            <button className="p-1 rounded text-primary hover:bg-surface-container-high transition-colors" type="button">
                              <span className="material-symbols-outlined text-headline-sm">keyboard_arrow_up</span>
                            </button>
                            <span className="font-label-md text-label-md font-bold text-primary px-1.5">0</span>
                            <button className="p-1 rounded text-outline hover:text-error hover:bg-surface-container-high transition-colors" type="button">
                              <span className="material-symbols-outlined text-headline-sm">keyboard_arrow_down</span>
                            </button>
                          </div>
                          <button className="flex items-center gap-1 text-label-md font-label-md hover:text-primary transition-colors py-1 px-2 rounded-lg hover:bg-surface-container-low" type="button">
                            <span className="material-symbols-outlined text-headline-sm">reply</span>
                            <span>Yanıtla</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </section>
          </div>

          {/* Right Sidebar Details */}
          <div className="lg:col-span-4 flex flex-col gap-space-lg">
            <div className="bg-surface-container rounded-xl p-space-md shadow-xl flex flex-col gap-space-md border border-outline-variant/20">
              <div className="flex items-center gap-2 text-headline-sm font-headline-sm text-on-surface">
                <span className="material-symbols-outlined text-primary">analytics</span>
                <span>Post İstatistikleri</span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="bg-surface-container-low p-space-sm rounded-xl border border-outline-variant/20">
                  <span className="block text-headline-md font-headline-md font-bold text-primary">%98</span>
                  <span className="text-label-sm font-label-sm text-outline">Upvote Oranı</span>
                </div>
                <div className="bg-surface-container-low p-space-sm rounded-xl border border-outline-variant/20">
                  <span className="block text-headline-md font-headline-md font-bold text-on-surface">1.2K</span>
                  <span className="text-label-sm font-label-sm text-outline">Görüntülenme</span>
                </div>
                <div className="bg-surface-container-low p-space-sm rounded-xl border border-outline-variant/20">
                  <span className="block text-headline-md font-headline-md font-bold text-secondary">24</span>
                  <span className="text-label-sm font-label-sm text-outline">Paylaşım</span>
                </div>
              </div>
            </div>

            <div className="bg-surface-container rounded-xl p-space-md shadow-xl flex flex-col gap-space-sm border border-outline-variant/20">
              <div className="flex items-center gap-space-sm">
                <div className="w-12 h-12 rounded-xl bg-secondary-container flex items-center justify-center text-on-secondary-container font-headline-md font-bold">m/</div>
                <div className="flex-1 min-w-0">
                  <h2 className="text-headline-sm font-headline-sm text-on-surface font-bold truncate">m/{post.rooms?.slug}</h2>
                  <p className="text-label-sm font-label-sm text-outline">{post.rooms?.name}</p>
                </div>
              </div>
              <p className="text-body-sm font-body-sm text-on-surface-variant leading-relaxed">Yerli ve milli mizah fabrikası. Günlük kaliteli memeler, yazılımcı krizleri ve internet kültürü.</p>
              <button className="w-full mt-space-xs py-2 rounded-xl bg-primary hover:bg-primary-container text-on-primary hover:text-on-primary-container font-label-lg text-label-lg font-bold shadow-[0_0_16px_rgba(255,178,191,0.25)] transition-all" type="button">Topluluğa Katıl</button>
            </div>

            <div className="bg-surface-container rounded-xl p-space-md shadow-xl flex flex-col gap-space-md border border-outline-variant/20">
              <div className="flex items-center justify-between">
                <span className="text-headline-sm font-headline-sm text-on-surface font-bold">Benzer Memeler</span>
                <a className="text-label-sm font-label-sm text-primary hover:underline font-bold" href="#">Tümü</a>
              </div>
              <div className="flex flex-col gap-space-sm">
                <a className="flex items-center gap-space-sm p-2 rounded-xl bg-surface-container-low hover:bg-surface-container-high transition-colors group border border-outline-variant/20" href="#">
                  <div className="w-14 h-14 rounded-lg bg-surface-container-highest shrink-0"></div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-label-md font-label-md font-bold text-on-surface group-hover:text-primary transition-colors line-clamp-2">Cuma akşamı saat 18:00'da canlıya deploy alan cesur yürek</h3>
                    <div className="flex items-center gap-2 mt-1 text-label-sm font-label-sm text-outline">
                      <span>19.1k upvote</span><span>•</span><span>m/yazilimci-cilesi</span>
                    </div>
                  </div>
                </a>
              </div>
            </div>

            <div className="bg-surface-container rounded-xl p-space-md shadow-xl flex flex-col gap-space-sm border border-outline-variant/20">
              <div className="flex items-center justify-between">
                <span className="text-label-lg font-label-lg font-bold text-on-surface">Aylık Ödül Havuzu</span>
                <span className="material-symbols-outlined text-primary text-headline-sm">emoji_events</span>
              </div>
              <p className="text-body-sm font-body-sm text-on-surface-variant">Bu ayın en çok upvote alan meme üreticilerine toplam 50.000 TL ödül dağıtılıyor!</p>
              <a className="inline-flex items-center gap-1.5 text-primary text-label-md font-label-md hover:underline" href="#">
                <span>Sıralamayı Gör</span>
                <span className="material-symbols-outlined text-body-sm">arrow_forward</span>
              </a>
            </div>

            <div className="bg-surface-container rounded-xl p-space-md shadow-xl flex flex-col gap-space-sm border border-outline-variant/20">
              <div className="flex items-center justify-between mb-space-xs">
                <span className="text-label-lg font-label-lg font-bold text-on-surface">Topluluk Kuralları</span>
                <span className="material-symbols-outlined text-outline text-headline-sm">info</span>
              </div>
              <p className="text-body-sm font-body-sm text-on-surface-variant leading-relaxed">Saygılı ol, özgün mizah paylaş ve spoiler etiketlerini kullanmayı unutma.</p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
