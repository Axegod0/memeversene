import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { PostCard } from '../components/PostCard';

interface Post {
  id: string;
  user_id: string;
  room_id: string;
  caption: string;
  video_url: string;
  video_type: 'youtube' | 'tiktok';
  video_id: string;
  upvotes: number;
  created_at: string;
  profiles?: { username: string };
  rooms?: { name: string, slug: string };
}

interface Profile {
  id: string;
  username: string;
  created_at: string;
}

export function Profile() {
  const { username } = useParams<{ username?: string }>();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [userVotes, setUserVotes] = useState<Record<string, number>>({});

  useEffect(() => {
    if (username) {
      fetchProfileAndPosts(username);
      fetchUserVotes();
    }
  }, [username]);

  const fetchProfileAndPosts = async (uname: string) => {
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('username', uname)
      .single();

    if (profileError || !profileData) return;
    setProfile(profileData);

    const { data: postsData, error: postsError } = await supabase
      .from('posts')
      .select('*, profiles(username), rooms(name, slug)')
      .eq('user_id', profileData.id)
      .order('created_at', { ascending: false });

    if (!postsError && postsData) {
      setPosts(postsData as Post[]);
    }
  };

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

  const handleVote = async (postId: string, voteType: number) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return alert('Oy vermek için giriş yapmalısınız!');

    const currentVote = userVotes[postId] || 0;
    
    let newVoteType = voteType;
    if (currentVote === voteType) {
      newVoteType = 0;
    }

    try {
      if (newVoteType === 0) {
        await supabase.from('votes').delete().match({ user_id: user.id, post_id: postId });
      } else {
        await supabase.from('votes').upsert({ user_id: user.id, post_id: postId, vote_type: newVoteType });
      }

      setUserVotes(prev => ({ ...prev, [postId]: newVoteType }));
      fetchProfileAndPosts(username as string);
    } catch (err) {
      console.error(err);
    }
  };

  if (!profile) return <div className="text-on-surface p-10">Profil yükleniyor veya bulunamadı...</div>;

  const getDaysAgo = (dateStr: string) => {
    const diff = new Date().getTime() - new Date(dateStr).getTime();
    return Math.floor(diff / (1000 * 3600 * 24));
  };

  const totalUpvotes = posts.reduce((sum, post) => sum + post.upvotes, 0);

  return (
    <>
      {/* Profile Stage Container */}
      <div className="relative w-full rounded-2xl overflow-hidden bg-surface-container-low shadow-xl">
        {/* Atmospheric Ambient Glows behind Banner */}
        <div className="absolute -top-24 -left-20 w-96 h-96 rounded-full bg-primary-container/15 blur-3xl pointer-events-none"></div>
        <div className="absolute top-10 right-0 w-80 h-80 rounded-full bg-secondary-container/20 blur-3xl pointer-events-none"></div>
        
        {/* Banner Graphic Area */}
        <div className="relative w-full h-48 md:h-64 overflow-hidden bg-gradient-to-r from-surface-container-lowest via-surface-container to-surface-container-low">
          <svg className="absolute inset-0 w-full h-full opacity-40 mix-blend-screen" fill="none" preserveAspectRatio="none" viewBox="0 0 1200 320" xmlns="http://www.w3.org/2000/svg">
            <path d="M0 240C160 190 320 280 480 230C640 180 800 290 960 210C1080 150 1140 220 1200 200V320H0V240Z" fill="url(#roseGrad1)" fillOpacity="0.35"></path>
            <path d="M0 270C200 220 380 310 560 250C740 190 920 300 1100 240C1150 225 1180 235 1200 230V320H0V270Z" fill="url(#roseGrad2)" fillOpacity="0.45"></path>
            <line stroke="rgba(255,178,191,0.08)" strokeDasharray="6 6" strokeWidth="1" x1="0" x2="1200" y1="90" y2="90"></line>
            <line stroke="rgba(255,178,191,0.08)" strokeDasharray="6 6" strokeWidth="1" x1="0" x2="1200" y1="180" y2="180"></line>
            <defs>
              <linearGradient gradientUnits="userSpaceOnUse" id="roseGrad1" x1="0" x2="1200" y1="0" y2="320">
                <stop stopColor="#ffb2bf"></stop>
                <stop offset="0.6" stopColor="#e08798"></stop>
                <stop offset="1" stopColor="#6f3443"></stop>
              </linearGradient>
              <linearGradient gradientUnits="userSpaceOnUse" id="roseGrad2" x1="0" x2="1200" y1="100" y2="300">
                <stop stopColor="#e68497"></stop>
                <stop offset="1" stopColor="#111317"></stop>
              </linearGradient>
            </defs>
          </svg>

        </div>
        
        {/* User Header Core Info */}
        <div className="relative px-6 pb-6 pt-0">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 -mt-16 md:-mt-20">
            {/* Avatar and Identity */}
            <div className="flex items-end gap-5">
              <div className="relative group shrink-0">
                <div className="w-28 h-28 md:w-36 md:h-36 rounded-2xl overflow-hidden shadow-2xl bg-surface-container-highest ring-4 ring-surface-container-lowest flex items-center justify-center">
                  <span className="text-display-lg font-bold text-on-surface">{profile.username.charAt(0).toUpperCase()}</span>
                </div>
                <span className="absolute bottom-2 right-2 w-4 h-4 rounded-full bg-emerald-400 ring-4 ring-surface-container-lowest shadow-[0_0_12px_#34d399]" title="Şu an Aktif"></span>
              </div>
              <div className="flex flex-col pb-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="font-headline-lg text-headline-lg font-bold text-on-surface tracking-tight">{profile.username}</h1>
                  <span className="px-2 py-0.5 rounded-md bg-surface-container-high text-on-surface-variant text-label-sm font-label-sm uppercase">Yeni Üye</span>
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <span className="font-label-md text-label-md text-primary font-medium">u/{profile.username}</span>
                </div>
              </div>
            </div>
            
            {/* Action Controls */}
            <div className="flex items-center gap-3 shrink-0">
              <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-surface-container-high hover:bg-surface-container-highest text-on-surface text-label-lg font-label-lg transition-all shadow-md active:scale-95" type="button">
                <span className="material-symbols-outlined text-headline-sm">edit</span>
                <span>Profili Düzenle</span>
              </button>
              <button className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-primary-container to-secondary text-on-primary-container text-label-lg font-label-lg font-bold shadow-[0_0_20px_rgba(224,135,152,0.35)] hover:shadow-[0_0_28px_rgba(224,135,152,0.55)] hover:scale-102 active:scale-95 transition-all" type="button">
                <span className="material-symbols-outlined text-headline-sm" style={{ fontVariationSettings: "'FILL' 1" }}>person_add</span>
                <span>Takip Et</span>
              </button>
              <button aria-label="Profili Paylaş" className="w-10 h-10 rounded-xl bg-surface-container-high hover:bg-surface-container-highest flex items-center justify-center text-on-surface-variant hover:text-on-surface transition-colors shadow-md" type="button">
                <span className="material-symbols-outlined text-headline-sm">share</span>
              </button>
            </div>
          </div>
          
          {/* Bio statement */}
          <div className="mt-5 max-w-3xl">
            <p className="font-body-lg text-body-lg text-outline italic">
              Bu kullanıcı henüz bir biyografi eklemedi.
            </p>
          </div>
          
          {/* User Stats Bento Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6">
            <div className="p-3.5 rounded-xl bg-surface-container/70 backdrop-blur-md shadow-sm flex flex-col justify-between">
              <div className="flex items-center justify-between text-outline text-label-sm font-label-sm">
                <span>Post Karması</span>
                <span className="material-symbols-outlined text-primary text-headline-sm">local_fire_department</span>
              </div>
              <div className="mt-2">
                <span className="font-headline-md text-headline-md font-bold text-on-surface">{totalUpvotes}</span>
              </div>
            </div>
            <div className="p-3.5 rounded-xl bg-surface-container/70 backdrop-blur-md shadow-sm flex flex-col justify-between">
              <div className="flex items-center justify-between text-outline text-label-sm font-label-sm">
                <span>Yorum Karması</span>
                <span className="material-symbols-outlined text-secondary text-headline-sm">forum</span>
              </div>
              <div className="mt-2">
                <span className="font-headline-md text-headline-md font-bold text-on-surface">0</span>
              </div>
            </div>
            <div className="p-3.5 rounded-xl bg-surface-container/70 backdrop-blur-md shadow-sm flex flex-col justify-between">
              <div className="flex items-center justify-between text-outline text-label-sm font-label-sm">
                <span>Ödül Madalyaları</span>
                <span className="material-symbols-outlined text-primary-container text-headline-sm" style={{ fontVariationSettings: "'FILL' 1" }}>military_tech</span>
              </div>
              <div className="mt-2">
                <span className="font-headline-md text-headline-md font-bold text-on-surface">0</span>
              </div>
            </div>
            <div className="p-3.5 rounded-xl bg-surface-container/70 backdrop-blur-md shadow-sm flex flex-col justify-between">
              <div className="flex items-center justify-between text-outline text-label-sm font-label-sm">
                <span>Meme Versene Yaşı</span>
                <span className="material-symbols-outlined text-outline text-headline-sm">calendar_month</span>
              </div>
              <div className="mt-2">
                <span className="font-headline-md text-headline-md font-bold text-on-surface">{getDaysAgo(profile.created_at)} Gün</span>
                <span className="text-label-sm font-label-sm text-outline ml-1">
                  {new Date(profile.created_at).toLocaleDateString('tr-TR', { year: 'numeric', month: 'long' })}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>


    </>
  );
}
