import { useState } from 'react';
import { supabase } from '../lib/supabase';

export function Auth({ onAuthSuccess }: { onAuthSuccess: () => void }) {
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [loading, setLoading] = useState(false);
  const [identity, setIdentity] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      if (isLoginMode) {
        // Simple login using email
        const { error } = await supabase.auth.signInWithPassword({
          email: identity,
          password,
        });
        if (error) throw error;
        onAuthSuccess();
      } else {
        // Register using email
        const { data, error } = await supabase.auth.signUp({
          email: identity,
          password,
          options: {
            data: {
              username,
            }
          }
        });
        if (error) throw error;
        
        if (data.session) {
           onAuthSuccess();
        } else {
           setSuccessMessage('Kayıt başarılı! Lütfen e-posta adresinize gelen doğrulama bağlantısına tıklayın.');
           setIsLoginMode(true);
        }
      }
    } catch (err: any) {
      console.error(err);
      let msg = err.message || 'Bir hata oluştu.';
      if (msg.includes('Password should be')) msg = 'Şifre en az 6 karakter olmalıdır.';
      else if (msg.includes('User already registered')) msg = 'Bu e-posta adresi zaten kayıtlı.';
      else if (msg.includes('Invalid login credentials')) msg = 'E-posta veya şifre hatalı.';
      else if (msg.includes('Unable to validate email address')) msg = 'Geçerli bir e-posta adresi giriniz.';
      else if (msg.toLowerCase().includes('rate limit')) msg = 'Çok fazla deneme yaptınız. Lütfen farklı bir e-posta deneyin veya Supabase ayarlarından e-posta doğrulamasını kapatın.';
      else if (msg.toLowerCase().includes('signups are disabled')) msg = 'E-posta ile kayıt olma özelliği şu anda kapalı. Lütfen Supabase ayarlarından aktifleştirin.';
      
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col w-full items-center justify-center relative py-space-xl px-margin">
      <div className="absolute w-[560px] h-[560px] rounded-full bg-primary/10 blur-[130px] pointer-events-none -top-16"></div>
      <div className="absolute w-[360px] h-[360px] rounded-full bg-secondary-container/25 blur-[100px] pointer-events-none -bottom-10"></div>
      
      <div className="relative w-full max-w-[490px] bg-surface-container-low rounded-xl shadow-2xl p-space-lg sm:p-space-xl flex flex-col items-center backdrop-blur-xl">
        <div className="flex flex-col items-center text-center w-full mb-space-lg">
          <div className="flex items-center justify-center gap-space-sm mb-space-sm group cursor-pointer">
            <div className="w-11 h-11 rounded-xl bg-surface-container-high flex items-center justify-center text-primary shadow-lg transition-transform duration-300 group-hover:scale-105">
              <span className="material-symbols-outlined text-[28px]" style={{ fontVariationSettings: "'FILL' 1" }}>mood</span>
            </div>
            <div className="flex flex-col text-left">
              <span className="font-headline-lg text-headline-lg tracking-tight text-on-surface">
                Meme<span className="text-primary">Versene</span>
              </span>
              <span className="font-label-sm text-label-sm tracking-widest text-on-surface-variant uppercase">Community Portal</span>
            </div>
          </div>
          <div className="mt-space-md flex flex-col items-center">
            <span className="font-label-sm text-label-sm tracking-[0.2em] text-primary uppercase font-bold">
              {isLoginMode ? 'Tekrar Hoş Geldin !' : 'Aramıza Katıl !'}
            </span>
            <h1 className="font-display-lg text-display-lg text-on-surface tracking-tight mt-space-xs font-bold leading-none select-none">
              <span className="inline-block">Free MEME</span> <span className="text-primary inline-block">;)</span>
            </h1>
            <p className="font-body-md text-body-md text-on-surface-variant mt-space-sm max-w-[340px]">
              En taze meme akışına, ödüllü topluluklara ve gece kulübüne hemen bağlan.
            </p>
          </div>
        </div>

        <div className="w-full bg-surface-container rounded-xl p-space-xs flex items-center mb-space-lg">
          <button
            onClick={() => setIsLoginMode(true)}
            className={`flex-1 py-space-sm rounded-lg font-label-lg text-label-lg transition-all duration-200 ${
              isLoginMode ? 'bg-surface-container-high text-primary shadow-md' : 'text-on-surface-variant hover:text-on-surface'
            }`}
            type="button"
          >
            Giriş Yap
          </button>
          <button
            onClick={() => setIsLoginMode(false)}
            className={`flex-1 py-space-sm rounded-lg font-label-lg text-label-lg transition-all duration-200 ${
              !isLoginMode ? 'bg-surface-container-high text-primary shadow-md' : 'text-on-surface-variant hover:text-on-surface'
            }`}
            type="button"
          >
            Kayıt Ol
          </button>
        </div>

        <form className="w-full flex flex-col gap-space-md" onSubmit={handleSubmit}>
          {!isLoginMode && (
            <div className="flex flex-col gap-space-xs">
              <label className="font-label-md text-label-md text-on-surface-variant">Kullanıcı Adı</label>
              <div className="relative flex items-center">
                <span className="material-symbols-outlined absolute left-space-md text-[20px] text-on-surface-variant pointer-events-none">alternate_email</span>
                <input
                  required={!isLoginMode}
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full bg-surface-container rounded-xl pl-11 pr-space-md py-space-sm font-body-md text-body-md text-on-surface placeholder:text-outline focus:bg-surface-container-high focus:outline-none transition-all"
                  placeholder="memelord42"
                  type="text"
                />
              </div>
            </div>
          )}

          <div className="flex flex-col gap-space-xs">
            <label className="font-label-md text-label-md text-on-surface-variant">
              {isLoginMode ? 'E-posta' : 'E-posta Adresi'}
            </label>
            <div className="relative flex items-center">
              <span className="material-symbols-outlined absolute left-space-md text-[20px] text-on-surface-variant pointer-events-none">person</span>
              <input
                required
                value={identity}
                onChange={(e) => setIdentity(e.target.value)}
                className="w-full bg-surface-container rounded-xl pl-11 pr-space-md py-space-sm font-body-md text-body-md text-on-surface placeholder:text-outline focus:bg-surface-container-high focus:outline-none transition-all"
                placeholder="ornek@memeversene.com"
                type="email"
              />
            </div>
          </div>

          <div className="flex flex-col gap-space-xs">
            <label className="font-label-md text-label-md text-on-surface-variant">Şifre</label>
            <div className="relative flex items-center">
              <span className="material-symbols-outlined absolute left-space-md text-[20px] text-on-surface-variant pointer-events-none">lock</span>
              <input
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-surface-container rounded-xl pl-11 pr-11 py-space-sm font-body-md text-body-md text-on-surface placeholder:text-outline focus:bg-surface-container-high focus:outline-none transition-all"
                placeholder="••••••••••••"
                type={showPassword ? 'text' : 'password'}
              />
              <button
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-space-md text-on-surface-variant hover:text-primary transition-colors flex items-center justify-center"
                type="button"
              >
                <span className="material-symbols-outlined text-[20px]">{showPassword ? 'visibility_off' : 'visibility'}</span>
              </button>
            </div>
          </div>

          {error && (
            <div className="text-error font-body-sm text-center">
              {error}
            </div>
          )}

          {successMessage && (
            <div className="text-primary font-body-sm text-center">
              {successMessage}
            </div>
          )}

          {isLoginMode && (
            <div className="flex items-center justify-between mt-space-xs">
              <label className="flex items-center gap-space-sm cursor-pointer select-none">
                <div className="relative flex items-center justify-center">
                  <input defaultChecked className="peer sr-only" type="checkbox" />
                  <div className="w-5 h-5 rounded-lg bg-surface-container peer-checked:bg-primary transition-colors"></div>
                  <span className="material-symbols-outlined absolute text-[16px] text-on-primary opacity-0 peer-checked:opacity-100 pointer-events-none font-bold">check</span>
                </div>
                <span className="font-body-sm text-body-sm text-on-surface">Beni Hatırla</span>
              </label>
              <a className="font-label-md text-label-md text-primary hover:underline" href="#">Şifremi Unuttum?</a>
            </div>
          )}

          <button
            disabled={loading}
            className="w-full mt-space-sm py-space-sm px-space-lg rounded-xl font-label-lg text-label-lg font-bold bg-primary text-on-primary shadow-xl hover:opacity-95 active:scale-[0.99] transition-all flex items-center justify-center gap-space-sm disabled:opacity-50"
            type="submit"
          >
            <span>{loading ? 'Yükleniyor...' : isLoginMode ? 'Giriş Yap' : 'Topluluğa Katıl'}</span>
            {!loading && <span className="material-symbols-outlined text-[18px]">arrow_forward</span>}
          </button>
        </form>

        <div className="w-full mt-space-lg pt-space-md flex flex-col items-center gap-space-sm text-center">
          <div className="font-body-sm text-body-sm text-on-surface-variant">
            <span>{isLoginMode ? 'Hesabın yok mu?' : 'Zaten hesabın var mı?'}</span>
            <button onClick={() => setIsLoginMode(!isLoginMode)} type="button" className="text-primary font-label-md text-label-md ml-space-xs hover:underline">
              {isLoginMode ? 'Hemen Kaydol' : 'Giriş Yap'}
            </button>
          </div>
          <p className="font-label-sm text-label-sm text-on-surface-variant/70 max-w-[360px] leading-relaxed">
            Devam ederek <a className="text-primary hover:underline" href="#">Kullanım Şartları</a> ve <a className="text-primary hover:underline" href="#">Gizlilik Politikasını</a> kabul etmiş olursunuz.
          </p>
        </div>
      </div>
      <div className="mt-space-lg flex items-center gap-space-md text-on-surface-variant font-label-sm text-label-sm">
        <div className="flex items-center gap-space-xs">
          <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
          <span>Live MemeVersene Network</span>
        </div>
        <span>•</span>
        <span>v1.0</span>
      </div>
    </div>
  );
}
