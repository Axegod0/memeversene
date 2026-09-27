import { formatDistanceToNow } from 'date-fns';
import { tr } from 'date-fns/locale';
import { Link } from 'react-router-dom';

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

interface PostCardProps {
  post: Post;
  onVote: (postId: string, voteType: number) => void;
  userVote?: number; // 1 for upvote, -1 for downvote, 0 for none
}

export function PostCard({ post, onVote, userVote = 0 }: PostCardProps) {
  const timeAgo = formatDistanceToNow(new Date(post.created_at), { addSuffix: true, locale: tr });
  
  return (
    <article className="rounded-2xl bg-surface-container-low/90 backdrop-blur-md shadow-xl overflow-hidden hover:shadow-2xl transition-all">
      <div className="p-space-md flex flex-col gap-3">
        
        {/* Post Header */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 flex-wrap min-w-0">
            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-secondary-container/40 text-secondary text-label-sm font-bold">
              m/{post.rooms?.name || 'genel'}
            </span>
            <span className="text-outline text-label-sm">•</span>
            <span className="text-label-sm text-outline">Paylaşan</span>
            <span className="text-label-sm font-semibold text-on-surface hover:text-primary transition-colors cursor-pointer">
              u/{post.profiles?.username || 'anon'}
            </span>
            <span className="text-outline text-label-sm">•</span>
            <span className="text-label-sm text-outline">{timeAgo}</span>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <button aria-label="Daha fazla" className="w-8 h-8 rounded-lg hover:bg-surface-container-high text-outline hover:text-on-surface flex items-center justify-center transition-colors">
              <span className="material-symbols-outlined text-headline-sm">more_horiz</span>
            </button>
          </div>
        </div>
        
        {/* Post Title */}
        <Link to={`/post/${post.id}`}>
          <h2 className="font-headline-md text-headline-md text-on-surface font-bold leading-snug hover:text-primary transition-colors cursor-pointer">
            {post.caption}
          </h2>
        </Link>
        
        {/* Media Container */}
        <div className="relative w-full rounded-xl bg-surface-container-lowest overflow-hidden shadow-2xl group border border-outline-variant/10">
          <div className={`relative w-full flex items-center justify-center bg-black/5 ${post.video_type === 'tiktok' ? 'h-[500px] max-w-md mx-auto' : post.video_type === 'image' ? 'max-h-[600px] bg-transparent' : 'aspect-video'}`}>
            {post.video_type === 'youtube' && (
              <iframe 
                className="w-full h-full"
                src={`https://www.youtube.com/embed/${post.video_id}?autoplay=0`}
                title="YouTube video player" 
                frameBorder="0" 
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                allowFullScreen
              ></iframe>
            )}
            {post.video_type === 'tiktok' && (
              <iframe 
                src={`https://www.tiktok.com/embed/v2/${post.video_id}`} 
                className="w-full h-full" 
                frameBorder="0" 
                allowFullScreen
              ></iframe>
            )}
            {post.video_type === 'image' && (
              <img 
                src={post.video_id} 
                alt={post.caption} 
                className="w-full h-auto max-h-[600px] object-contain" 
              />
            )}
          </div>
        </div>
        
        {/* Bottom Action Bar */}
        <div className="flex items-center justify-between pt-2 gap-2 border-t border-outline-variant/15 flex-wrap">
          <div className="flex items-center gap-2 flex-wrap">
            {/* Integrated Horizontal Upvote / Downvote Pill */}
            <div className="flex items-center rounded-xl bg-surface-container p-0.5 border border-outline-variant/20 shadow-inner">
              <button 
                onClick={() => onVote(post.id, 1)}
                className={`flex items-center justify-center w-8 h-8 rounded-lg transition-all ${userVote === 1 ? 'bg-primary-container/30 text-primary' : 'text-outline hover:text-primary'}`}
              >
                <span className="material-symbols-outlined text-headline-sm" style={{ fontVariationSettings: userVote === 1 ? "'FILL' 1" : "'FILL' 0" }}>thumb_up</span>
              </button>
              
              <span className={`px-2 font-headline-sm text-label-md font-bold tracking-tight select-none ${userVote === 1 ? 'text-primary' : userVote === -1 ? 'text-secondary' : 'text-on-surface'}`}>
                {post.upvotes}
              </span>
              
              <button 
                onClick={() => onVote(post.id, -1)}
                className={`flex items-center justify-center w-8 h-8 rounded-lg transition-colors ${userVote === -1 ? 'bg-secondary-container/30 text-secondary' : 'text-outline hover:text-secondary'}`}
              >
                <span className="material-symbols-outlined text-headline-sm" style={{ fontVariationSettings: userVote === -1 ? "'FILL' 1" : "'FILL' 0" }}>thumb_down</span>
              </button>
            </div>
            
            <Link to={`/post/${post.id}`} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-surface-container/70 hover:bg-surface-container-high text-on-surface-variant hover:text-on-surface text-label-md font-label-md transition-colors">
              <span className="material-symbols-outlined text-headline-sm">chat_bubble</span>
              <span>Yorum</span>
            </Link>
            <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-surface-container/70 hover:bg-surface-container-high text-on-surface-variant hover:text-on-surface text-label-md font-label-md transition-colors">
              <span className="material-symbols-outlined text-headline-sm">share</span>
              <span>Paylaş</span>
            </button>
          </div>
          
          <button aria-label="Kaydet" className="w-9 h-9 rounded-xl bg-surface-container/70 hover:bg-surface-container-high text-outline hover:text-primary flex items-center justify-center transition-colors">
            <span className="material-symbols-outlined text-headline-sm">bookmark</span>
          </button>
        </div>
      </div>
    </article>
  );
}
