import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, updateDoc, arrayUnion } from 'firebase/firestore';
import { db } from '../config/firebase';
import { Box, Typography, Chip, TextField, Button, Rating, CircularProgress, Alert, Stack, FormControl, InputLabel, Select, MenuItem, Checkbox, FormControlLabel, IconButton, Card, CardMedia, Grid } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';

interface MediaItem {
  id: string;
  title: string;
  type: string;
  tags?: string[];
  userId: string;
  rating?: number;
  comments?: { text: string; created: string; }[];
  status?: string;
  watchedDate?: string;
  favorite?: boolean;
  createdAt?: string;
  imageUrl?: string;
  description?: string;
}

export const MediaDetails: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [item, setItem] = useState<MediaItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [comment, setComment] = useState('');
  const [rating, setRating] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState(item?.status || 'planned');
  const [watchedDate, setWatchedDate] = useState(item?.watchedDate || '');
  const [favorite, setFavorite] = useState(item?.favorite || false);
  const [editIndex, setEditIndex] = useState<number | null>(null);
  const [editText, setEditText] = useState('');

  useEffect(() => {
    const fetchItem = async () => {
      try {
        setLoading(true);
        const ref = doc(db, 'media', id!);
        const snap = await getDoc(ref);
        if (snap.exists()) {
          const data = snap.data() as MediaItem;
          setItem({ ...data, id: snap.id });
          setRating(data.rating || null);
          setStatus(data.status || 'planned');
          setWatchedDate(data.watchedDate || '');
          setFavorite(data.favorite || false);
        } else {
          setError('Элемент не найден');
        }
      } catch (err) {
        setError('Ошибка загрузки элемента');
      } finally {
        setLoading(false);
      }
    };
    fetchItem();
  }, [id]);

  const handleAddComment = async () => {
    if (!comment.trim() || !item) return;
    setSaving(true);
    try {
      const ref = doc(db, 'media', item.id);
      const newComment = { text: comment.trim(), created: new Date().toISOString() };
      await updateDoc(ref, {
        comments: arrayUnion(newComment)
      });
      setItem({ ...item, comments: [...(item.comments || []), newComment] });
      setComment('');
    } catch (err) {
      setError('Ошибка при добавлении комментария');
    } finally {
      setSaving(false);
    }
  };

  const handleSetRating = async (value: number | null) => {
    if (!item) return;
    setSaving(true);
    try {
      const ref = doc(db, 'media', item.id);
      await updateDoc(ref, { rating: value });
      setItem({ ...item, rating: value || undefined });
      setRating(value);
    } catch (err) {
      setError('Ошибка при сохранении оценки');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateField = async (field: string, value: any) => {
    if (!item) return;
    setSaving(true);
    try {
      const ref = doc(db, 'media', item.id);
      await updateDoc(ref, { [field]: value });
      setItem({ ...item, [field]: value });
      if (field === 'status') setStatus(value);
      if (field === 'watchedDate') setWatchedDate(value);
      if (field === 'favorite') setFavorite(value);
    } catch (err) {
      setError('Ошибка при обновлении');
    } finally {
      setSaving(false);
    }
  };

  const handleEditComment = (idx: number, text: string) => {
    setEditIndex(idx);
    setEditText(text);
  };

  const handleSaveEdit = async () => {
    if (!item || editIndex === null) return;
    setSaving(true);
    try {
      const updatedComments = (item.comments || []).map((c, idx) => idx === editIndex ? { ...c, text: editText } : c);
      const ref = doc(db, 'media', item.id);
      await updateDoc(ref, { comments: updatedComments });
      setItem({ ...item, comments: updatedComments });
      setEditIndex(null);
      setEditText('');
    } catch (err) {
      setError('Ошибка при редактировании комментария');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteComment = async (idx: number) => {
    if (!item) return;
    setSaving(true);
    try {
      const updatedComments = (item.comments || []).filter((_, i) => i !== idx);
      const ref = doc(db, 'media', item.id);
      await updateDoc(ref, { comments: updatedComments });
      setItem({ ...item, comments: updatedComments });
    } catch (err) {
      setError('Ошибка при удалении комментария');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Box sx={{ mt: 4, textAlign: 'center' }}><CircularProgress /></Box>;
  if (error) return <Alert severity="error" sx={{ mt: 4 }}>{error}</Alert>;
  if (!item) return null;

  return (
    <Box sx={{ maxWidth: 800, margin: '0 auto', mt: 4 }}>
      <Button variant="outlined" onClick={() => navigate(-1)} sx={{ mb: 2 }}>Назад</Button>
      
      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Card sx={{ height: '100%' }}>
            <CardMedia
              component="img"
              image={item.imageUrl || 'https://via.placeholder.com/300x450?text=No+Image'}
              alt={item.title}
              sx={{ height: '100%', objectFit: 'cover' }}
            />
          </Card>
        </Grid>
        
        <Grid item xs={12} md={8}>
          <Typography variant="h5" gutterBottom>{item.title}</Typography>
          <Typography color="text.secondary" gutterBottom>{item.type}</Typography>
          
          {item.description && (
            <Typography variant="body1" sx={{ mb: 2 }}>
              {item.description}
            </Typography>
          )}
          
          <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
            {item.tags && item.tags.map(tag => (
              <Chip key={tag} label={tag} size="small" />
            ))}
          </Stack>

          <Box sx={{ mb: 2 }}>
            <Typography>Ваша оценка:</Typography>
            <Rating
              name="media-rating"
              value={rating}
              onChange={(_, value) => handleSetRating(value)}
              max={10}
              disabled={saving}
            />
          </Box>

          <Box sx={{ mb: 2 }}>
            <FormControl sx={{ mr: 2, minWidth: 120 }}>
              <InputLabel id="status-label">Статус</InputLabel>
              <Select
                labelId="status-label"
                value={status}
                label="Статус"
                onChange={e => handleUpdateField('status', e.target.value)}
                disabled={saving}
              >
                <MenuItem value="planned">Запланировано</MenuItem>
                <MenuItem value="watching">Смотрю</MenuItem>
                <MenuItem value="completed">Просмотрено</MenuItem>
                <MenuItem value="dropped">Брошено</MenuItem>
              </Select>
            </FormControl>

            <TextField
              label="Дата просмотра"
              type="date"
              value={watchedDate}
              onChange={e => handleUpdateField('watchedDate', e.target.value)}
              sx={{ mr: 2 }}
              InputLabelProps={{ shrink: true }}
              disabled={saving}
            />

            <FormControlLabel
              control={<Checkbox checked={favorite} onChange={e => handleUpdateField('favorite', e.target.checked)} disabled={saving} />}
              label="Избранное"
            />

            {item.createdAt && (
              <Typography variant="caption" color="text.secondary" sx={{ ml: 2 }}>
                Добавлено: {new Date(item.createdAt).toLocaleString()}
              </Typography>
            )}
          </Box>

          <Box sx={{ mb: 2 }}>
            <Typography>Комментарии / заметки:</Typography>
            <Stack spacing={1} sx={{ mt: 1, mb: 1 }}>
              {(item.comments || []).map((c, idx) => (
                <Box key={idx} sx={{ p: 1, bgcolor: '#f5f5f5', borderRadius: 1, display: 'flex', alignItems: 'center' }}>
                  {editIndex === idx ? (
                    <>
                      <TextField
                        value={editText}
                        onChange={e => setEditText(e.target.value)}
                        size="small"
                        fullWidth
                        sx={{ mr: 1 }}
                      />
                      <Button onClick={handleSaveEdit} disabled={saving || !editText.trim()} size="small">Сохранить</Button>
                      <Button onClick={() => { setEditIndex(null); setEditText(''); }} size="small">Отмена</Button>
                    </>
                  ) : (
                    <>
                      <Box sx={{ flexGrow: 1 }}>
                        <Typography variant="body2">{c.text}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          {new Date(c.created).toLocaleString()}
                        </Typography>
                      </Box>
                      <IconButton onClick={() => handleEditComment(idx, c.text)} size="small" sx={{ ml: 1 }} disabled={saving}>
                        <EditIcon fontSize="small" />
                      </IconButton>
                      <IconButton onClick={() => handleDeleteComment(idx)} size="small" sx={{ ml: 1 }} disabled={saving}>
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </>
                  )}
                </Box>
              ))}
            </Stack>

            <TextField
              label="Добавить комментарий или заметку"
              value={comment}
              onChange={e => setComment(e.target.value)}
              fullWidth
              multiline
              minRows={2}
              sx={{ mb: 1 }}
            />
            <Button variant="contained" onClick={handleAddComment} disabled={saving || !comment.trim()}>
              Добавить
            </Button>
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
}; 