import React, { useState, useEffect } from 'react';
import { Container, Typography, CssBaseline, Button, Box, AppBar, Toolbar, IconButton, Chip, CircularProgress, Card, CardContent } from '@mui/material';
import { MediaList } from './components/MediaList.tsx';
import { AuthForm } from './components/AuthForm.tsx';
import { onAuthStateChanged, signOut, User, updateProfile, updatePassword, EmailAuthProvider, reauthenticateWithCredential, deleteUser, GoogleAuthProvider, linkWithPopup, unlink } from 'firebase/auth';
import { auth } from './config/firebase.ts';
import { Routes, Route } from 'react-router-dom';
import { MediaDetails } from './components/MediaDetails.tsx';
import { useTheme } from '@mui/material/styles';
import { Brightness4, Brightness7 } from '@mui/icons-material';
import { useColorMode } from './theme.tsx';
import Avatar from '@mui/material/Avatar';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import CloseIcon from '@mui/icons-material/Close';
import TextField from '@mui/material/TextField';
import FormControlLabel from '@mui/material/FormControlLabel';
import Checkbox from '@mui/material/Checkbox';
import Snackbar from '@mui/material/Snackbar';
import MuiAlert from '@mui/material/Alert';
import GoogleIcon from '@mui/icons-material/Google';
import { doc as firestoreDoc, getDoc as firestoreGetDoc, collection, getDocs, setDoc, deleteDoc, query, where, updateDoc } from 'firebase/firestore';
import { db } from './config/firebase.ts';

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const theme = useTheme();
  const colorMode = useColorMode();
  const [profileOpen, setProfileOpen] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (user) {
      const syncUser = async () => {
        // Добавляем/обновляем пользователя в users
        await setDoc(firestoreDoc(db, 'users', user.uid), {
          email: user.email || '',
          displayName: user.displayName || '',
          uid: user.uid
        }, { merge: true });
      };
      syncUser();
    }
  }, [user]);

  if (loading) {
    return null;
  }

  if (!user) {
    return <AuthForm onAuth={setUser} />;
  }

  return (
    <>
      <CssBaseline />
      <AppBar position="static" color="default" elevation={1} sx={{ mb: 3 }}>
        <Toolbar>
          <Typography variant="h5" sx={{ fontWeight: 700 }}>
            Медиа Трекер
          </Typography>
          <Chip label="beta 0.1" color="info" size="small" sx={{ ml: 2, fontWeight: 600, letterSpacing: 1, fontSize: 14 }} />
          <Box sx={{ flexGrow: 1 }} />
          <IconButton sx={{ ml: 1 }} onClick={colorMode.toggleColorMode} color="inherit">
            {theme.palette.mode === 'dark' ? <Brightness7 /> : <Brightness4 />}
          </IconButton>
          <IconButton sx={{ ml: 2 }} onClick={() => setProfileOpen(true)} color="inherit">
            <Avatar sx={{ width: 32, height: 32 }}>{user.displayName ? user.displayName[0] : user.email ? user.email[0] : '?'}</Avatar>
          </IconButton>
          <Button variant="outlined" color="secondary" onClick={() => signOut(auth)} sx={{ ml: 2 }}>
            Выйти
          </Button>
        </Toolbar>
      </AppBar>
      <ProfileDialog open={profileOpen} onClose={() => setProfileOpen(false)} user={user} />
      <Container maxWidth="md" sx={{ pb: 4 }}>
        <Routes>
          <Route path="/" element={<MediaList userId={user.uid} />} />
          <Route path="/media/:id" element={<MediaDetails />} />
        </Routes>
      </Container>
    </>
  );
}

function ProfileDialog({ open, onClose, user }: { open: boolean, onClose: () => void, user: User }) {
  const [displayName, setDisplayName] = useState(user.displayName || '');
  const [newPassword, setNewPassword] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState<{ open: boolean, message: string, severity: 'success' | 'error' }>({ open: false, message: '', severity: 'success' });
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [googleLinked, setGoogleLinked] = useState(user.providerData.some(p => p.providerId === 'google.com'));

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
      setNewPassword(''); setCurrentPassword('');
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
      setTimeout(() => window.location.reload(), 1500);
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

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        Профиль
        <IconButton onClick={onClose}><CloseIcon /></IconButton>
      </DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 2 }}>
          <Avatar sx={{ width: 64, height: 64, mb: 1 }}>{user.displayName ? user.displayName[0] : user.email ? user.email[0] : '?'}</Avatar>
          <Typography variant="h6">{user.displayName || 'Без ника'}</Typography>
          <Typography color="text.secondary">{user.email}</Typography>
        </Box>
        <TextField label="Ник" value={displayName} onChange={e => setDisplayName(e.target.value)} fullWidth sx={{ mb: 2 }} />
        <Button onClick={handleUpdateName} variant="contained" fullWidth disabled={loading || !displayName.trim()}>Сохранить ник</Button>
        <Box sx={{ my: 2 }}>
          <Typography variant="subtitle2" sx={{ mb: 1 }}>Смена пароля</Typography>
          <TextField label="Текущий пароль" type={showPassword ? 'text' : 'password'} value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} fullWidth sx={{ mb: 1 }} />
          <TextField label="Новый пароль" type={showPassword ? 'text' : 'password'} value={newPassword} onChange={e => setNewPassword(e.target.value)} fullWidth sx={{ mb: 1 }} />
          <FormControlLabel control={<Checkbox checked={showPassword} onChange={e => setShowPassword(e.target.checked)} />} label="Показать пароль" />
          <Button onClick={handleChangePassword} variant="outlined" fullWidth disabled={loading || !newPassword || !currentPassword}>Сменить пароль</Button>
        </Box>
        <Box sx={{ my: 2 }}>
          <Typography variant="subtitle2" sx={{ mb: 1 }}>Google-аккаунт</Typography>
          {googleLinked ? (
            <Button startIcon={<GoogleIcon />} color="success" variant="outlined" fullWidth onClick={handleUnlinkGoogle} disabled={loading} sx={{ mb: 1 }}>
              Отвязать Google
            </Button>
          ) : (
            <Button startIcon={<GoogleIcon />} color="primary" variant="outlined" fullWidth onClick={handleLinkGoogle} disabled={loading} sx={{ mb: 1 }}>
              Привязать Google
            </Button>
          )}
          <Typography variant="body2" color="text.secondary">
            {googleLinked ? 'Google-аккаунт привязан' : 'Google-аккаунт не привязан'}
          </Typography>
        </Box>
        <Typography variant="body2" color="text.secondary">UID: {user.uid}</Typography>
        <Button color="error" variant="outlined" fullWidth sx={{ mt: 2 }} onClick={() => setDeleteConfirm(true)}>Удалить аккаунт</Button>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Закрыть</Button>
      </DialogActions>
      <Dialog open={deleteConfirm} onClose={() => setDeleteConfirm(false)}>
        <DialogTitle>Удалить аккаунт?</DialogTitle>
        <DialogContent>Вы уверены, что хотите удалить аккаунт? Это действие необратимо.</DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteConfirm(false)}>Отмена</Button>
          <Button color="error" onClick={handleDeleteAccount}>Удалить</Button>
        </DialogActions>
      </Dialog>
      <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={() => setSnackbar({ ...snackbar, open: false })}>
        <MuiAlert elevation={6} variant="filled" severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })}>
          {snackbar.message}
        </MuiAlert>
      </Snackbar>
    </Dialog>
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