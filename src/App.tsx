import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import type { Session } from '@supabase/supabase-js';
import { supabase } from './lib/supabase';
import { Auth } from './components/Auth';
import { Layout } from './components/Layout';
import { Home } from './pages/Home';
import { Profile } from './pages/Profile';
import { PostDetail } from './pages/PostDetail';
import { Messages } from './pages/Messages';
import { Notifications } from './pages/Notifications';
import { OtherFeeds } from './pages/OtherFeeds';

function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) fetchProfile(session.user.id, session.user.email);
      else setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event: any, session: Session | null) => {
      setSession(session);
      if (session) fetchProfile(session.user.id, session.user.email);
      else setProfile(null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchProfile = async (userId: string, email?: string) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('username')
      .eq('id', userId)
      .single();
    if (!error && data) {
      setProfile(data);
    } else if (error && error.code === 'PGRST116') {
      const fallbackUsername = email ? email.split('@')[0] : `user_${userId.substring(0,6)}`;
      const { data: newProfile, error: insertError } = await supabase
        .from('profiles')
        .insert([{ id: userId, username: fallbackUsername }])
        .select('username')
        .single();
      
      if (!insertError && newProfile) {
        setProfile(newProfile);
      }
    }
    setLoading(false);
  };

  if (loading) {
    return <div className="min-h-screen bg-background flex items-center justify-center text-primary">Yükleniyor...</div>;
  }

  if (!session) {
    return <Auth onAuthSuccess={() => {}} />;
  }

  return (
    <BrowserRouter>
      <Layout username={profile?.username} onLogout={() => supabase.auth.signOut()}>
        <Routes>
          <Route path="/" element={<Home currentUsername={profile?.username} />} />
          <Route path="/rooms/:roomSlug" element={<Home currentUsername={profile?.username} />} />
          <Route path="/u/:username" element={<Profile />} />
          <Route path="/post/:id" element={<PostDetail />} />
          <Route path="/messages" element={<Messages />} />
          <Route path="/notifications" element={<Notifications />} />
          <Route path="/popular" element={<OtherFeeds type="popular" />} />
          <Route path="/saved" element={<OtherFeeds type="saved" />} />
          <Route path="/liked" element={<OtherFeeds type="liked" />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}

export default App;
