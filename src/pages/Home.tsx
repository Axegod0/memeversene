import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { PostCard } from '../components/PostCard';
import { AdSlot } from '../components/AdSlot';

interface Post {
  id: string;
  user_id: string;
  room_id: string;
  caption: string;
  video_url: string;
  video_type: 'youtube' | 'tiktok' | 'image';
  video_id: string;
  upvotes: number;
  created_at: string;
  profiles?: { username: string };
  rooms?: { name: string };
}

export function Home() {
  const { roomSlug } = useParams<{ roomSlug?: string }>();
  const [posts, setPosts] = useState<Post[]>([]);
  const [sortBy, setSortBy] = useState<'hot' | 'new'>('new');
  const [userVotes, setUserVotes] = useState<Record<string, number>>({});
  const [currentRoom, setCurrentRoom] = useState<any>(null);

  useEffect(() => {
    if (roomSlug) {
      supabase.from('rooms').select('*').eq('slug', roomSlug).single().then(({data}) => setCurrentRoom(data));
    } else {
      setCurrentRoom(null);
    }
  }, [roomSlug]);

  useEffect(() => {
    fetchPosts();
    fetchUserVotes();

    // Set up realtime subscription
    const channel = supabase.channel('public:posts')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'posts' }, fetchPosts)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [roomSlug, sortBy]);

  const fetchUserVotes = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from('votes')
      .select('post_id, vote_type')
      .eq('user_id', user.id);

    if (data) {
      const votesMap: Record<string, number> = {};
      data.forEach(v => {
        votesMap[v.post_id] = v.vote_type;
      });
      setUserVotes(votesMap);
    }
  };

  const fetchPosts = async () => {
    let query = supabase
      .from('posts')
      .select('*, profiles!posts_user_id_fkey(username), rooms(name, slug)');

    if (roomSlug) {
      // Find room id first or join with rooms
      query = query.eq('rooms.slug', roomSlug);
    }

    if (sortBy === 'hot') {
      query = query.order('upvotes', { ascending: false }).order('created_at', { ascending: false });
    } else {
      query = query.order('created_at', { ascending: false });
    }

    const { data, error } = await query;
    
    if (!error && data) {
      // Supabase inner join workaround: if rooms.slug filter doesn't exclude nulls, we filter manually
      const filteredData = roomSlug ? data.filter(p => p.rooms?.slug === roomSlug) : data;
      setPosts(filteredData as Post[]);
    }
  };

  const handleVote = async (postId: string, voteType: number) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return alert('Oy vermek için giriş yapmalısınız!');

    const currentVote = userVotes[postId] || 0;
    
    let newVoteType = voteType;
    if (currentVote === voteType) {
      // Cancel vote
      newVoteType = 0;
    }

    // Call Supabase RPC or just delete/insert manually if RPC is not available
    // Assuming simple client-side handling for now:
    try {
      if (newVoteType === 0) {
        await supabase.from('votes').delete().match({ user_id: user.id, post_id: postId });
      } else {
        await supabase.from('votes').upsert({ user_id: user.id, post_id: postId, vote_type: newVoteType });
      }

      // Update local state optimistic
      setUserVotes(prev => ({ ...prev, [postId]: newVoteType }));
      fetchPosts(); // Refetch to get updated counts
    } catch (err) {
      console.error(err);
    }
  };



  return (
    <>
      {/* Room Header Banner (Only visible if inside a room) */}
      {roomSlug && (
        <div className="relative w-full rounded-2xl overflow-hidden bg-surface-container-low shadow-xl mb-6">
          <div className="relative h-44 sm:h-52 w-full overflow-hidden bg-surface-container-lowest">
            {currentRoom?.banner_url ? (
              <div className="absolute inset-0 bg-cover bg-center opacity-65" style={{ backgroundImage: `url('${currentRoom.banner_url}')` }}></div>
            ) : (
              <div className="absolute inset-0 bg-gradient-to-br from-primary-container/30 to-secondary-container/10"></div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-surface-container-low via-surface-container-low/40 to-transparent"></div>
            <div className="absolute -top-12 -right-12 w-64 h-64 rounded-full bg-primary-container/20 blur-3xl pointer-events-none"></div>
          </div>
          <div className="px-5 sm:px-8 pb-6 -mt-16 sm:-mt-12 relative flex flex-col md:flex-row md:items-end md:justify-between gap-6">
            <div className="flex items-start sm:items-end gap-4 sm:gap-6 min-w-0">
              <div className="relative shrink-0">
                <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl bg-surface-container-high flex items-center justify-center text-4xl sm:text-5xl shadow-2xl ring-4 ring-surface-container-low select-none overflow-hidden font-bold text-on-surface">
                  {currentRoom?.avatar_url ? (
                    <img src={currentRoom.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    roomSlug.substring(0, 2).toUpperCase()
                  )}
                </div>
                <span className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-emerald-500 ring-4 ring-surface-container-low flex items-center justify-center" title="Aktif Oda">
                  <span className="w-2 h-2 rounded-full bg-surface-container-lowest"></span>
                </span>
              </div>
              <div className="flex flex-col min-w-0 pt-2 sm:pt-0">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h1 className="font-headline-lg text-headline-lg font-bold text-on-surface tracking-tight">m/{roomSlug}</h1>
                  <span className="px-2.5 py-0.5 rounded-full bg-primary-container/20 text-primary font-label-sm text-label-sm uppercase tracking-wider font-bold">
                    Aktif Topluluk
                  </span>
                </div>
                <p className="font-body-md text-body-md text-on-surface-variant truncate max-w-xl mt-1">
                  {currentRoom?.description || `MemeVersene'nin ${roomSlug} topluluğu. Keşfet, paylaş, upvote topla!`}
                </p>
                <div className="flex items-center gap-4 sm:gap-6 text-label-md font-label-md text-outline mt-3">
                  <div className="flex items-center gap-1.5">
                    <span className="text-on-surface font-bold">{posts.length}</span>
                    <span>Gönderi</span>
                  </div>
                  <span className="w-1 h-1 rounded-full bg-outline-variant"></span>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
                    <span className="text-on-surface font-bold">Canlı</span>
                    <span>Bağlantı</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2.5 shrink-0 self-start md:self-end">
              <button 
                onClick={() => {
                  navigator.clipboard.writeText(window.location.href);
                  alert('Topluluk bağlantısı kopyalandı! Arkadaşlarınıza gönderebilirsiniz.');
                }}
                className="h-10 px-4 rounded-xl bg-surface-container-high hover:bg-surface-container-highest text-on-surface hover:text-primary transition-all flex items-center gap-2 shadow-sm font-label-lg font-bold"
              >
                <span className="material-symbols-outlined text-[20px]">share</span>
                <span className="hidden sm:inline">Davet Et</span>
              </button>
              <button aria-label="Bildirimleri Aç" className="w-10 h-10 rounded-xl bg-surface-container-high hover:bg-surface-bright text-on-surface-variant hover:text-primary transition-all flex items-center justify-center shadow-sm">
                <span className="material-symbols-outlined text-headline-sm">notifications_active</span>
              </button>
              <button className="h-10 px-5 rounded-xl bg-gradient-to-r from-secondary to-primary-container hover:from-secondary-fixed hover:to-primary text-on-primary-container font-label-lg text-label-lg font-bold shadow-lg shadow-primary-container/25 hover:shadow-primary-container/40 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-2">
                <span className="material-symbols-outlined text-headline-sm">check</span>
                <span>Katıldın</span>
              </button>
            </div>
          </div>
        </div>
      )}



      {/* Feed Filter Tab Bar */}
      <div className="flex items-center justify-between p-1.5 rounded-2xl bg-surface-container-low/80 backdrop-blur-md shadow-md overflow-x-auto mt-2">
        <div className="flex items-center gap-1.5 shrink-0">
          <button 
            onClick={() => setSortBy('hot')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all ${sortBy === 'hot' ? 'bg-gradient-to-r from-primary-container to-secondary text-on-primary-container shadow-[0_0_18px_rgba(224,135,152,0.35)]' : 'bg-surface-container/60 hover:bg-surface-container-high text-on-surface-variant hover:text-on-surface'}`}
          >
            <span className="text-sm">🔥</span>
            <span className="font-headline-sm text-label-md font-bold">Popüler</span>
          </button>
          <button 
            onClick={() => setSortBy('new')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl transition-all ${sortBy === 'new' ? 'bg-gradient-to-r from-primary-container to-secondary text-on-primary-container shadow-[0_0_18px_rgba(224,135,152,0.35)]' : 'bg-surface-container/60 hover:bg-surface-container-high text-on-surface-variant hover:text-on-surface'}`}
          >
            <span className="text-sm">✨</span>
            <span className="font-headline-sm text-label-md font-bold">En Yeni</span>
          </button>
        </div>
      </div>

      {/* Post List */}
      <div className="flex flex-col gap-space-lg mt-2 pb-10">
        {posts.length === 0 ? (
          <div className="p-space-xl text-center text-on-surface-variant rounded-2xl bg-surface-container-low/50">
            Henüz burada bir şey yok. İlk gönderiyi sen oluştur!
          </div>
        ) : (
          posts.map((post, idx) => (
            <React.Fragment key={post.id}>
              {idx > 0 && idx % 3 === 0 && <AdSlot type="feed" />}
              <PostCard 
                post={post} 
                onVote={handleVote}
                userVote={userVotes[post.id]}
              />
            </React.Fragment>
          ))
        )}
      </div>
    </>
  );
}
