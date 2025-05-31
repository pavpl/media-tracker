import React, { useState } from 'react';
import { TextField, Button, Box, Typography, Alert } from '@mui/material';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { auth } from '../config/firebase.ts';
import GoogleIcon from '@mui/icons-material/Google';

interface AuthFormProps {
  onAuth: (user: any) => void;
}

export const AuthForm: React.FC<AuthFormProps> = ({ onAuth }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isRegister, setIsRegister] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      let userCredential;
      if (isRegister) {
        userCredential = await createUserWithEmailAndPassword(auth, email, password);
      } else {
        userCredential = await signInWithEmailAndPassword(auth, email, password);
      }
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
    <Box sx={{ maxWidth: 400, margin: '0 auto', mt: 8, p: 3, boxShadow: 3, borderRadius: 2 }}>
      <Button
        variant="outlined"
        startIcon={<GoogleIcon />}
        onClick={handleGoogleSignIn}
        fullWidth
        sx={{ mb: 2, fontWeight: 600 }}
        disabled={loading}
      >
        Войти через Google
      </Button>
      <Typography variant="h5" gutterBottom align="center">
        {isRegister ? 'Регистрация' : 'Вход'}
      </Typography>
      <form onSubmit={handleSubmit}>
        <TextField
          label="Email"
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          fullWidth
          margin="normal"
          required
        />
        <TextField
          label="Пароль"
          type="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          fullWidth
          margin="normal"
          required
        />
        {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
        <Button
          type="submit"
          variant="contained"
          color="primary"
          fullWidth
          sx={{ mt: 2 }}
          disabled={loading}
        >
          {isRegister ? 'Зарегистрироваться' : 'Войти'}
        </Button>
      </form>
      <Button
        color="secondary"
        fullWidth
        sx={{ mt: 2 }}
        onClick={() => setIsRegister(!isRegister)}
        disabled={loading}
      >
        {isRegister ? 'Уже есть аккаунт? Войти' : 'Нет аккаунта? Зарегистрироваться'}
      </Button>
    </Box>
  );
}; 