import React, { useEffect, useState } from 'react';
import { GoogleAuthProvider, createUserWithEmailAndPassword, signInWithEmailAndPassword, signInWithPopup } from 'firebase/auth';
import { auth } from '../config/firebase';

interface AuthFormProps {
  onAuth: (user: any) => void;
}

export const AuthForm: React.FC<AuthFormProps> = ({ onAuth }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isRegister, setIsRegister] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const [isDark, setIsDark] = useState(() => {
    if (typeof document === 'undefined') return true;
    return document.documentElement.classList.contains('dark');
  });

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark);
  }, [isDark]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const userCredential = isRegister
        ? await createUserWithEmailAndPassword(auth, email, password)
        : await signInWithEmailAndPassword(auth, email, password);
      onAuth(userCredential.user);
    } catch (err: any) {
      setError(err.message || 'Ошибка аутентификации');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError(null);
    setLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      const userCredential = await signInWithPopup(auth, provider);
      onAuth(userCredential.user);
    } catch (err: any) {
      setError(err.message || 'Ошибка Google авторизации');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-background text-on-background font-body min-h-screen flex flex-col">
      <div className="fixed inset-0 bg-cinematic z-0" aria-hidden="true" />

      <header className="relative z-10 flex justify-between items-center px-8 h-16">
        <div className="flex items-center gap-2">
          <span className="font-headline font-black text-2xl tracking-tighter text-white">Media Tracker</span>
        </div>
        <div className="flex items-center gap-4">
          <button
            type="button"
            className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-surface-container transition-colors"
            onClick={() => setIsDark((v) => !v)}
            aria-label="Переключить тему"
          >
            <span className="material-symbols-outlined text-on-surface-variant">dark_mode</span>
          </button>
        </div>
      </header>

      <main className="relative z-10 flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-[440px]">
          <div className="glass-panel border-none rounded-xl p-8 shadow-2xl shadow-black/50">
            <div className="text-center mb-8">
              <h1 className="font-headline text-3xl font-extrabold tracking-tight mb-2">Добро пожаловать</h1>
              <p className="text-on-surface-variant text-sm">Управляйте вашей медиа-библиотекой в одном месте</p>
            </div>

            <button
              type="button"
              className="w-full flex items-center justify-center gap-3 py-3 px-4 bg-white text-black font-semibold rounded-lg hover:bg-gray-100 active:scale-95 transition-all mb-6 disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={handleGoogleSignIn}
              disabled={loading}
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" aria-hidden="true">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
              </svg>
              <span>Войти через Google</span>
            </button>

            <div className="relative flex items-center mb-6">
              <div className="flex-grow border-t border-outline-variant/20" />
              <span className="flex-shrink mx-4 text-xs text-on-surface-variant font-medium uppercase tracking-widest">Или через почту</span>
              <div className="flex-grow border-t border-outline-variant/20" />
            </div>

            <form className="space-y-5" onSubmit={handleSubmit}>
              <div>
                <label className="block text-xs font-medium text-on-surface-variant mb-1.5 px-1 uppercase tracking-wider">Email</label>
                <input
                  className="w-full bg-surface-container-highest border border-outline-variant/15 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all text-on-surface placeholder:text-on-surface-variant/40"
                  placeholder="example@mail.com"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-on-surface-variant mb-1.5 px-1 uppercase tracking-wider">Пароль</label>
                <div className="relative">
                  <input
                    className="w-full bg-surface-container-highest border border-outline-variant/15 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all text-on-surface placeholder:text-on-surface-variant/40"
                    placeholder="••••••••"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={loading}
                  />
                  <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-white" disabled>
                    <span className="material-symbols-outlined">visibility</span>
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between py-1">
                <label className="flex items-center gap-2 cursor-pointer group select-none">
                  <input
                    className="w-4 h-4 rounded border-outline-variant/30 bg-surface-container text-primary focus:ring-offset-background focus:ring-primary"
                    type="checkbox"
                    disabled={loading}
                    readOnly
                  />
                  <span className="text-xs text-on-surface-variant group-hover:text-on-surface transition-colors">Запомнить меня</span>
                </label>
                <button type="button" className="text-xs text-primary font-medium hover:underline" onClick={() => setError('Функция восстановления пароля пока не реализована.')}>
                  Забыли пароль?
                </button>
              </div>

              {error && (
                <div className="bg-error/10 border-l-4 border-error p-3 rounded-r-lg">
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-error text-xl">error</span>
                    <p className="text-xs text-error font-medium">{error}</p>
                  </div>
                </div>
              )}

              <button
                className="w-full py-3.5 bg-gradient-to-br from-primary to-primary-dim text-on-primary-fixed font-bold rounded-lg hover:shadow-[0_0_20px_rgba(184,159,255,0.3)] active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                type="submit"
                disabled={loading}
              >
                <span className="hidden" aria-hidden="true">
                  {/* место под спиннер, если потребуется */}
                </span>
                <span>{isRegister ? 'Зарегистрироваться' : 'Войти'}</span>
              </button>
            </form>

            <div className="mt-8 pt-6 border-t border-outline-variant/10 text-center">
              <p className="text-on-surface-variant text-sm">
                Нет аккаунта?{' '}
                <button
                  type="button"
                  className="text-primary font-bold hover:text-primary-fixed-dim transition-colors ml-1"
                  onClick={() => setIsRegister(true)}
                  disabled={loading}
                >
                  Регистрация
                </button>
              </p>
              {isRegister && (
                <p className="text-on-surface-variant text-sm mt-3">
                  Уже есть аккаунт?{' '}
                  <button
                    type="button"
                    className="text-primary font-bold hover:text-primary-fixed-dim transition-colors ml-1"
                    onClick={() => setIsRegister(false)}
                    disabled={loading}
                  >
                    Войти
                  </button>
                </p>
              )}
            </div>
          </div>
        </div>
      </main>

      <div className="fixed top-0 left-0 w-full h-full pointer-events-none opacity-20 z-0 bg-[radial-gradient(circle_at_20%_30%,#b89fff_0%,transparent_30%),radial-gradient(circle_at_80%_70%,#4af8e3_0%,transparent_30%)]" />
    </div>
  );
};