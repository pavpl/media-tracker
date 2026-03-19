import React, { useEffect, useMemo, useState } from 'react';
import { Route, Routes, useNavigate } from 'react-router-dom';
import {
  User,
  onAuthStateChanged,
  signOut,
  updateProfile,
  updatePassword,
  EmailAuthProvider,
  reauthenticateWithCredential,
  deleteUser,
  GoogleAuthProvider,
  linkWithPopup,
  unlink,
} from 'firebase/auth';
import { collection, deleteDoc, doc as firestoreDoc, getDocs, query, setDoc, where } from 'firebase/firestore';
import { auth, db, firebaseInitError } from './config/firebase';
import { MediaList } from './components/MediaList';
import { AuthForm } from './components/AuthForm';
import { MediaDetails } from './components/MediaDetails';

function App() {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [profileOpen, setProfileOpen] = useState(false);
  const [toast, setToast] = useState<{ open: boolean; message: string; tone: 'success' | 'error' }>({
    open: false,
    message: '',
    tone: 'success',
  });

  const [isDark, setIsDark] = useState(() => {
    if (typeof document === 'undefined') return true;
    return document.documentElement.classList.contains('dark');
  });

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark);
  }, [isDark]);

  useEffect(() => {
    if (firebaseInitError) return;
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (firebaseInitError) return;
    if (!user) return;
    const syncUser = async () => {
      await setDoc(
        firestoreDoc(db, 'users', user.uid),
        {
          email: user.email || '',
          displayName: user.displayName || '',
          uid: user.uid,
        },
        { merge: true },
      );
    };
    syncUser();
  }, [user]);

  const avatarLetter = useMemo(() => {
    if (!user) return '?';
    if (user.displayName) return user.displayName[0]?.toUpperCase() || '?';
    if (user.email) return user.email[0]?.toUpperCase() || '?';
    return '?';
  }, [user]);

  if (firebaseInitError) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-background">
        <div className="w-full max-w-xl bg-surface-container-low rounded-xl p-6 md:p-8 shadow-2xl border border-white/5">
          <div className="flex items-start gap-3 mb-4">
            <span className="material-symbols-outlined text-error" style={{ fontSize: 28 }}>
              error
            </span>
            <div>
              <h1 className="text-2xl font-headline font-extrabold mb-1">Ошибка Firebase</h1>
              <p className="text-on-surface-variant text-sm">{firebaseInitError.message}</p>
            </div>
          </div>
          <p className="text-on-surface-variant text-sm">
            Проверь переменные окружения в файле{' '}
            <code className="px-2 py-1 bg-surface-container-highest rounded">{'.env.local'}</code>. Для CRA они должны
            начинаться с <code className="px-2 py-1 bg-surface-container-highest rounded">REACT_APP_</code>.
          </p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="fixed inset-0 z-[999] flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="inline-block animate-spin rounded-full border-4 border-primary/30 border-t-primary w-12 h-12" />
          <div className="text-on-surface-variant text-sm">Загрузка...</div>
        </div>
      </div>
    );
  }
  if (!user) return <AuthForm onAuth={setUser} />;

  return (
    <>
      {toast.open && (
        <div className="fixed top-4 right-4 z-[100] w-full max-w-md">
          <div className="mb-8 flex items-center justify-between p-4 bg-error-container/20 border-l-4 border-error rounded-r-xl">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-error">error</span>
              <p className="text-sm text-on-error-container">{toast.message}</p>
            </div>
            <button className="text-on-error-container/60 hover:text-on-error-container" onClick={() => setToast((t) => ({ ...t, open: false }))}>
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>
        </div>
      )}

      <header className="fixed top-0 w-full flex justify-between items-center px-8 h-16 bg-[#131313]/70 backdrop-blur-xl z-50 shadow-2xl shadow-black/20">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <span className="text-2xl font-black text-white tracking-tighter font-headline">Media Tracker</span>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-surface-container-highest text-primary tracking-widest uppercase">
              beta 0.2
            </span>
          </div>
          <nav className="hidden md:flex items-center gap-8 ml-8">
            <button type="button" className="font-headline font-bold tracking-tight text-white border-b-2 border-[#b89fff] pb-1" onClick={() => navigate('/')}>
              Dashboard
            </button>
            <button type="button" className="font-headline font-bold tracking-tight text-gray-400 hover:text-white transition-colors" onClick={() => navigate('/')}>
              Library
            </button>
            <button type="button" className="font-headline font-bold tracking-tight text-gray-400 hover:text-white transition-colors" onClick={() => navigate('/')}>
              Analytics
            </button>
            <button type="button" className="font-headline font-bold tracking-tight text-gray-400 hover:text-white transition-colors" onClick={() => setProfileOpen(true)}>
              Settings
            </button>
          </nav>
        </div>

        <div className="flex items-center gap-4">
          <button
            type="button"
            className="p-2 rounded-full hover:bg-[#262626] transition-all duration-300 scale-95 active:scale-90 text-on-surface-variant"
            onClick={() => setIsDark((v) => !v)}
            aria-label="Переключить тему"
          >
            <span className="material-symbols-outlined">dark_mode</span>
          </button>
          <button
            type="button"
            className="p-2 rounded-full hover:bg-[#262626] transition-all duration-300 scale-95 active:scale-90 text-on-surface-variant relative"
            aria-label="Уведомления"
          >
            <span className="material-symbols-outlined">notifications</span>
            <span className="absolute top-2 right-2 w-2 h-2 bg-primary rounded-full" />
          </button>
          <div className="h-8 w-[1px] bg-outline-variant/20 mx-2" />
          <button
            type="button"
            className="flex items-center gap-3 pl-2 pr-4 py-1.5 rounded-full hover:bg-[#262626] transition-all duration-300"
            onClick={() => setProfileOpen(true)}
          >
            <div className="w-8 h-8 rounded-full border border-primary/20 flex items-center justify-center bg-primary/10">
              <span className="text-white text-sm font-black">{avatarLetter}</span>
            </div>
            <span className="text-sm font-medium text-white hidden sm:block">Profile</span>
          </button>
          <button type="button" className="text-on-surface-variant hover:text-error transition-colors p-2" onClick={() => signOut(auth)} aria-label="Выйти">
            <span className="material-symbols-outlined">logout</span>
          </button>
        </div>
      </header>

      <aside className="fixed left-0 top-0 h-full w-64 bg-[#131313] border-r border-white/5 hidden lg:flex flex-col py-6 z-40 pt-24">
        <div className="px-6 mb-8">
          <div className="flex items-center gap-3 p-3 rounded-xl bg-surface-container">
            <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center text-primary">
              <span className="material-symbols-outlined filled-icon">workspace_premium</span>
            </div>
            <div>
              <p className="text-xs font-bold text-primary uppercase tracking-wider">Premium Access</p>
              <p className="text-sm text-on-surface-variant">Pro Plan</p>
            </div>
          </div>
        </div>
        <nav className="flex-1 px-4 space-y-1">
          <button
            type="button"
            className="flex items-center gap-4 px-4 py-3 rounded-lg bg-[#b89fff]/10 text-[#b89fff] border-r-4 border-[#b89fff] translate-x-1 duration-200"
            onClick={() => navigate('/')}
          >
            <span className="material-symbols-outlined filled-icon">movie</span>
            <span className="font-medium text-sm">Media List</span>
          </button>
          <button type="button" className="flex items-center gap-4 px-4 py-3 rounded-lg text-gray-500 hover:bg-[#1a1a1a] hover:text-gray-200 transition-colors" onClick={() => navigate('/')}>
            <span className="material-symbols-outlined">star</span>
            <span className="font-medium text-sm">Favorites</span>
          </button>
          <button type="button" className="flex items-center gap-4 px-4 py-3 rounded-lg text-gray-500 hover:bg-[#1a1a1a] hover:text-gray-200 transition-colors" onClick={() => navigate('/')}>
            <span className="material-symbols-outlined">library_books</span>
            <span className="font-medium text-sm">Collections</span>
          </button>
          <button type="button" className="flex items-center gap-4 px-4 py-3 rounded-lg text-gray-500 hover:bg-[#1a1a1a] hover:text-gray-200 transition-colors" onClick={() => navigate('/')}>
            <span className="material-symbols-outlined">history</span>
            <span className="font-medium text-sm">Recent</span>
          </button>
        </nav>
        <div className="px-4 mt-auto space-y-1">
          <button type="button" onClick={() => setProfileOpen(true)} className="w-full text-left flex items-center gap-4 px-4 py-3 rounded-lg text-gray-500 hover:bg-[#1a1a1a] hover:text-gray-200 transition-colors">
            <span className="material-symbols-outlined">settings</span>
            <span className="font-medium text-sm">Settings</span>
          </button>
          <button type="button" className="flex w-full items-center gap-4 px-4 py-3 rounded-lg text-gray-500 hover:bg-[#1a1a1a] hover:text-gray-200 transition-colors" onClick={() => navigate('/')}>
            <span className="material-symbols-outlined">help</span>
            <span className="font-medium text-sm">Support</span>
          </button>
        </div>
      </aside>

      <main className="lg:ml-64 pt-24 px-4 md:px-8 pb-20 md:pb-12">
        <Routes>
          <Route path="/" element={<MediaList userId={user.uid} />} />
          <Route path="/media/:id" element={<MediaDetails />} />
        </Routes>
      </main>

      <nav className="md:hidden fixed bottom-0 left-0 w-full bg-[#131313]/90 backdrop-blur-xl border-t border-white/5 flex justify-around items-center h-16 px-4 z-50">
        <button type="button" className="flex flex-col items-center gap-1 text-primary" onClick={() => navigate('/')}>
          <span className="material-symbols-outlined filled-icon">dashboard</span>
          <span className="text-[10px] font-bold">Главная</span>
        </button>
        <button type="button" className="flex flex-col items-center gap-1 text-on-surface-variant" onClick={() => navigate('/')}>
          <span className="material-symbols-outlined">movie</span>
          <span className="text-[10px] font-medium">Список</span>
        </button>
        <button type="button" className="flex flex-col items-center gap-1 text-on-surface-variant" onClick={() => navigate('/')}>
          <span className="material-symbols-outlined">analytics</span>
          <span className="text-[10px] font-medium">Статистика</span>
        </button>
        <button type="button" className="flex flex-col items-center gap-1 text-on-surface-variant" onClick={() => setProfileOpen(true)}>
          <span className="material-symbols-outlined">settings</span>
          <span className="text-[10px] font-medium">Настройки</span>
        </button>
      </nav>

      <ProfileModal open={profileOpen} onClose={() => setProfileOpen(false)} user={user} onSignedOut={() => window.location.reload()} />
    </>
  );
}

function ProfileModal({
  open,
  onClose,
  user,
  onSignedOut,
}: {
  open: boolean;
  onClose: () => void;
  user: User;
  onSignedOut: () => void;
}) {
  const [displayName, setDisplayName] = useState(user.displayName || '');
  const [newPassword, setNewPassword] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success',
  });
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [googleLinked, setGoogleLinked] = useState(user.providerData.some((p) => p.providerId === 'google.com'));

  useEffect(() => {
    if (!open) return;
    setDisplayName(user.displayName || '');
    setGoogleLinked(user.providerData.some((p) => p.providerId === 'google.com'));
  }, [open, user]);

  const handleUpdateName = async () => {
    setLoading(true);
    try {
      await updateProfile(user, { displayName });
      setSnackbar({ open: true, message: 'Ник обновлён', severity: 'success' });
    } catch {
      setSnackbar({ open: true, message: 'Ошибка обновления ника', severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async () => {
    setLoading(true);
    try {
      if (user.email && currentPassword) {
        const cred = EmailAuthProvider.credential(user.email, currentPassword);
        await reauthenticateWithCredential(user, cred);
      }
      await updatePassword(user, newPassword);
      setSnackbar({ open: true, message: 'Пароль обновлён', severity: 'success' });
      setNewPassword('');
      setCurrentPassword('');
    } catch {
      setSnackbar({ open: true, message: 'Ошибка смены пароля', severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    setLoading(true);
    try {
      await deleteUserCompletely(user.uid);
      await deleteUser(user);
      setSnackbar({ open: true, message: 'Аккаунт удалён', severity: 'success' });
      setTimeout(onSignedOut, 1500);
    } catch {
      setSnackbar({ open: true, message: 'Ошибка удаления аккаунта', severity: 'error' });
    } finally {
      setLoading(false);
      setDeleteConfirm(false);
    }
  };

  const handleLinkGoogle = async () => {
    setLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      await linkWithPopup(user, provider);
      setSnackbar({ open: true, message: 'Google-аккаунт привязан', severity: 'success' });
      setGoogleLinked(true);
    } catch {
      setSnackbar({ open: true, message: 'Ошибка привязки Google', severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleUnlinkGoogle = async () => {
    setLoading(true);
    try {
      await unlink(user, 'google.com');
      setSnackbar({ open: true, message: 'Google-аккаунт отвязан', severity: 'success' });
      setGoogleLinked(false);
    } catch {
      setSnackbar({ open: true, message: 'Ошибка отвязки Google', severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  const avatarLetter = user.displayName
    ? user.displayName[0]?.toUpperCase()
    : user.email
      ? user.email[0]?.toUpperCase()
      : '?';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-2xl bg-surface-container-low rounded-xl p-6 md:p-8 shadow-2xl border border-white/5 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-primary to-primary-dim" />

        <div className="relative">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-headline font-extrabold tracking-tight">Профиль</h2>
              <p className="text-on-surface-variant text-sm font-body">Настройте свою учетную запись</p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-full hover:bg-surface-container-highest transition-colors disabled:opacity-50"
              disabled={loading}
            >
              <span className="material-symbols-outlined text-on-surface-variant">close</span>
            </button>
          </div>

          <div className="flex flex-col items-center gap-3 mb-6">
            <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center text-primary font-headline font-black text-3xl">
              {avatarLetter}
            </div>
            <div className="text-center">
              <div className="text-white font-headline font-extrabold text-xl">{user.displayName || 'Без ника'}</div>
              <div className="text-on-surface-variant text-sm">{user.email}</div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-label text-on-surface-variant text-sm font-medium">Никнейм</label>
              <input
                className="w-full bg-surface-container border-none border-l-2 border-transparent focus:border-primary-dim rounded-lg px-4 py-3 text-on-surface focus:ring-0 transition-all outline-none"
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                disabled={loading}
              />
              <button
                type="button"
                onClick={handleUpdateName}
                className="w-full mt-3 py-3 bg-gradient-to-br from-primary to-primary-dim text-on-primary-fixed font-headline font-black rounded-xl hover:shadow-xl hover:shadow-primary/20 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={loading || !displayName.trim()}
              >
                Сохранить ник
              </button>
            </div>

            <div className="space-y-4 pt-4 border-t border-outline-variant/10">
              <h3 className="text-sm font-headline font-bold uppercase tracking-widest text-on-surface-variant/70">
                Изменение пароля
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="relative">
                  <input
                    className="w-full bg-surface-container border-none rounded-lg px-4 py-3 text-on-surface focus:ring-0 outline-none"
                    placeholder="Текущий пароль"
                    type={showPassword ? 'text' : 'password'}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    disabled={loading}
                  />
                  <span
                    className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant cursor-pointer hover:text-white"
                    onClick={() => setShowPassword((v) => !v)}
                    role="button"
                    aria-label="Показать пароль"
                  >
                    visibility
                  </span>
                </div>
                <input
                  className="w-full bg-surface-container border-none rounded-lg px-4 py-3 text-on-surface focus:ring-0 outline-none"
                  placeholder="Новый пароль"
                  type={showPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  disabled={loading}
                />
              </div>

              <label className="flex items-center gap-3 cursor-pointer select-none">
                <input
                  className="w-4 h-4 rounded border-outline-variant/30 bg-surface-container text-primary focus:ring-offset-background focus:ring-primary"
                  type="checkbox"
                  checked={showPassword}
                  onChange={(e) => setShowPassword(e.target.checked)}
                  disabled={loading}
                />
                <span className="text-xs text-on-surface-variant">Показать пароль</span>
              </label>

              <button
                type="button"
                onClick={handleChangePassword}
                className="w-full py-3 bg-surface-container-highest rounded-xl border border-white/5 text-white font-headline font-bold hover:bg-surface-container-high transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={loading || !newPassword || !currentPassword}
              >
                Сменить пароль
              </button>
            </div>

            <div className="flex items-center justify-between p-4 bg-surface-container rounded-lg border border-outline-variant/5">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center">
                  <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                  </svg>
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-medium">Google Account</span>
                  <span className="text-xs text-on-surface-variant">{googleLinked ? 'Подключено' : 'Не подключено'}</span>
                </div>
              </div>

              {googleLinked ? (
                <button
                  type="button"
                  onClick={handleUnlinkGoogle}
                  disabled={loading}
                  className="px-4 py-1.5 rounded-lg border border-outline-variant/20 text-xs font-semibold hover:bg-surface-container-highest transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Отвязать
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleLinkGoogle}
                  disabled={loading}
                  className="px-4 py-1.5 rounded-lg bg-gradient-to-br from-primary to-primary-dim text-on-primary-fixed text-xs font-semibold hover:shadow-xl hover:shadow-primary/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Привязать
                </button>
              )}
            </div>

            <div>
              <div className="text-xs text-on-surface-variant">UID: {user.uid}</div>
            </div>

            <div className="pt-6 border-t border-outline-variant/10">
              <button
                type="button"
                onClick={() => setDeleteConfirm(true)}
                disabled={loading}
                className="w-full py-3 bg-error-container/10 border border-error-container/30 text-error hover:bg-error-container/20 rounded-xl font-headline font-bold flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span className="material-symbols-outlined text-xl">delete_forever</span>
                Удалить аккаунт
              </button>
              <p className="text-[10px] text-center mt-3 text-on-surface-variant uppercase tracking-widest">Действие необратимо</p>
            </div>
          </div>
        </div>
      </div>

      {deleteConfirm && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-sm bg-surface-container-low rounded-xl p-6 border border-white/5 shadow-2xl">
            <div className="text-white font-headline font-extrabold text-xl mb-3">Удалить аккаунт?</div>
            <div className="text-on-surface-variant text-sm mb-6">Вы уверены, что хотите удалить аккаунт? Это действие необратимо.</div>
            <div className="flex gap-3">
              <button
                type="button"
                className="flex-1 py-2 rounded-xl bg-surface-container-highest border border-white/5 hover:bg-surface-container-high transition-colors"
                onClick={() => setDeleteConfirm(false)}
                disabled={loading}
              >
                Отмена
              </button>
              <button
                type="button"
                className="flex-1 py-2 rounded-xl bg-error-container/10 border border-error-container/30 text-error hover:bg-error-container/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={handleDeleteAccount}
                disabled={loading}
              >
                Удалить
              </button>
            </div>
          </div>
        </div>
      )}

      {snackbar.open && (
        <div className="fixed top-4 right-4 z-[70] w-full max-w-md">
          <div className="mb-8 flex items-center justify-between p-4 rounded-r-xl bg-error-container/20 border-l-4 border-error">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-error">{snackbar.severity === 'success' ? 'check_circle' : 'error'}</span>
              <p className="text-sm text-on-error-container">{snackbar.message}</p>
            </div>
            <button className="text-on-error-container/60 hover:text-on-error-container" onClick={() => setSnackbar((s) => ({ ...s, open: false }))}>
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

async function deleteUserCompletely(uid: string) {
  // Удалить из users
  await deleteDoc(firestoreDoc(db, 'users', uid));
  // Удалить все посты
  const postsSnap = await getDocs(query(collection(db, 'media'), where('userId', '==', uid)));
  for (const docu of postsSnap.docs) {
    await deleteDoc(docu.ref);
  }
}

export default App;