-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Profiles Table
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Rooms Table
CREATE TABLE IF NOT EXISTS public.rooms (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  owner_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert Default Rooms
INSERT INTO public.rooms (name, slug) VALUES 
('genel', 'genel'),
('mizah', 'mizah'),
('oyun', 'oyun'),
('yazilim', 'yazilim')
ON CONFLICT (slug) DO NOTHING;

-- Room Members Table
CREATE TABLE IF NOT EXISTS public.room_members (
  room_id UUID REFERENCES public.rooms(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'member', -- 'owner', 'admin', 'member'
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (room_id, user_id)
);

-- Enable Realtime
alter publication supabase_realtime add table public.rooms;
alter publication supabase_realtime add table public.room_members;

-- Posts Table
CREATE TABLE IF NOT EXISTS public.posts (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  room_id UUID REFERENCES public.rooms(id) ON DELETE SET NULL,
  caption TEXT NOT NULL,
  video_url TEXT NOT NULL,
  video_type TEXT NOT NULL CHECK (video_type IN ('youtube', 'tiktok')),
  video_id TEXT NOT NULL,
  upvotes INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Comments Table
CREATE TABLE IF NOT EXISTS public.comments (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES public.comments(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Votes Table
CREATE TABLE IF NOT EXISTS public.votes (
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE,
  vote_type INTEGER CHECK (vote_type IN (1, -1)),
  PRIMARY KEY (user_id, post_id)
);

-- Enable Realtime
alter publication supabase_realtime add table public.posts;
alter publication supabase_realtime add table public.votes;
alter publication supabase_realtime add table public.comments;

-- RLS (Row Level Security)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.votes ENABLE ROW LEVEL SECURITY;

-- Allow public read access
CREATE POLICY "Public read access on profiles" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Public read access on rooms" ON public.rooms FOR SELECT USING (true);
CREATE POLICY "Public read access on posts" ON public.posts FOR SELECT USING (true);
CREATE POLICY "Public read access on comments" ON public.comments FOR SELECT USING (true);
CREATE POLICY "Public read access on votes" ON public.votes FOR SELECT USING (true);

-- Allow authenticated users to insert/update their own data
CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert posts" ON public.posts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can insert comments" ON public.comments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can manage their own votes" ON public.votes FOR ALL USING (auth.uid() = user_id);

-- Automatic Profile Creation Trigger
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, username)
  VALUES (new.id, COALESCE(new.raw_user_meta_data->>'username', 'user_' || substr(new.id::text, 1, 8)));
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Trigger to auto-update posts upvotes count
CREATE OR REPLACE FUNCTION public.update_post_upvotes()
RETURNS trigger AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.posts SET upvotes = upvotes + NEW.vote_type WHERE id = NEW.post_id;
  ELSIF TG_OP = 'UPDATE' THEN
    UPDATE public.posts SET upvotes = upvotes - OLD.vote_type + NEW.vote_type WHERE id = NEW.post_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.posts SET upvotes = upvotes - OLD.vote_type WHERE id = OLD.post_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_vote_changed ON public.votes;
CREATE TRIGGER on_vote_changed
  AFTER INSERT OR UPDATE OR DELETE ON public.votes
  FOR EACH ROW EXECUTE PROCEDURE public.update_post_upvotes();
