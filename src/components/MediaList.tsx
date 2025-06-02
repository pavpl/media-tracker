import React, { useEffect, useState } from 'react';
import { collection, getDocs, addDoc, deleteDoc, doc, query, where } from 'firebase/firestore';
import { db } from '../config/firebase';
import { 
  List, 
  ListItem, 
  ListItemText, 
  IconButton, 
  Button,
  TextField,
  Box,
  CircularProgress,
  Alert,
  Snackbar,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Checkbox,
  FormControlLabel,
  Autocomplete,
  Slider,
  Typography,
  Card,
  CardContent,
  CardActions,
  Fade,
  Chip,
  Tooltip,
  Grid,
  CardMedia
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import { useNavigate } from 'react-router-dom';
import { AddMediaForm } from './AddMediaForm';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';

interface MediaItem {
  id: string;
  title: string;
  type: string;
  userId: string;
  tags?: string[];
  status?: string;
  watchedDate?: string;
  favorite?: boolean;
  createdAt?: string;
  rating?: number;
  imageUrl?: string;
}

interface MediaListProps {
  userId: string;
}

export const MediaList: React.FC<MediaListProps> = ({ userId }) => {
  const [items, setItems] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<string | null>(null);
  const [filterRating, setFilterRating] = useState<number | null>(null);
  const [addDialogOpen, setAddDialogOpen] = useState(false);

  useEffect(() => {
    fetchItems();
    // eslint-disable-next-line
  }, [userId]);

  const fetchItems = async () => {
    try {
      setLoading(true);
      const q = query(collection(db, 'media'), where('userId', '==', userId));
      const querySnapshot = await getDocs(q);
      const mediaItems = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as MediaItem));
      setItems(mediaItems);
    } catch (err) {
      setError('Ошибка при загрузке данных');
      console.error('Error fetching items:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddMedia = async (data: any) => {
    try {
      setLoading(true);
      await addDoc(collection(db, 'media'), {
        ...data,
        userId,
        createdAt: new Date().toISOString(),
        status: 'planned',
      });
      await fetchItems();
    } catch (err) {
      setError('Ошибка при добавлении элемента');
      console.error('Error adding item:', err);
    } finally {
      setLoading(false);
    }
  };

  const deleteItem = async (id: string) => {
    try {
      setLoading(true);
      await deleteDoc(doc(db, 'media', id));
      await fetchItems();
    } catch (err) {
      setError('Ошибка при удалении элемента');
      console.error('Error deleting item:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredItems = items.filter(item => {
    if (search && !item.title.toLowerCase().includes(search.toLowerCase())) return false;
    if (filterStatus && item.status !== filterStatus) return false;
    if (filterRating !== null && (typeof item.rating !== 'number' || item.rating < filterRating)) return false;
    return true;
  });

  return (
    <Box sx={{ maxWidth: 900, margin: '0 auto', padding: 2 }}>
      <Box sx={{ mb: 2, display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center' }}>
        <TextField
          label="Поиск по названию"
          value={search}
          onChange={e => setSearch(e.target.value)}
          sx={{ minWidth: 180 }}
        />
        <FormControl sx={{ minWidth: 140 }}>
          <InputLabel id="filter-status-label">Статус</InputLabel>
          <Select
            labelId="filter-status-label"
            value={filterStatus || ''}
            label="Статус"
            onChange={e => setFilterStatus(e.target.value || null)}
          >
            <MenuItem value="">Все</MenuItem>
            <MenuItem value="planned">Запланировано</MenuItem>
            <MenuItem value="watching">Смотрю</MenuItem>
            <MenuItem value="completed">Просмотрено</MenuItem>
            <MenuItem value="dropped">Брошено</MenuItem>
          </Select>
        </FormControl>
        <Box sx={{ minWidth: 180, display: 'flex', alignItems: 'center' }}>
          <Typography sx={{ mr: 1 }}>Оценка от:</Typography>
          <Slider
            value={filterRating ?? 0}
            onChange={(_, v) => setFilterRating(Number(v))}
            min={0}
            max={10}
            step={1}
            marks
            valueLabelDisplay="auto"
            sx={{ width: 100 }}
          />
          <Button size="small" onClick={() => setFilterRating(null)} sx={{ ml: 1 }}>Сбросить</Button>
        </Box>
        <Button variant="contained" color="primary" sx={{ ml: 'auto' }} onClick={() => setAddDialogOpen(true)}>
          Добавить фильм
        </Button>
      </Box>

      <Dialog open={addDialogOpen} onClose={() => setAddDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Добавить фильм</DialogTitle>
        <DialogContent>
          <AddMediaForm onSubmit={async (data) => { await handleAddMedia(data); setAddDialogOpen(false); }} type="movie" />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddDialogOpen(false)}>Отмена</Button>
        </DialogActions>
      </Dialog>

      <Grid container spacing={2}>
        {filteredItems.map((item) => (
          <Grid item xs={12} sm={6} md={4} key={item.id}>
            <Fade in timeout={500}>
              <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column', boxShadow: 3, position: 'relative', cursor: 'pointer', transition: 'box-shadow 0.2s', '&:hover': { boxShadow: 8 } }} onClick={() => navigate(`/media/${item.id}`)}>
                <CardMedia
                  component="img"
                  height="200"
                  image={item.imageUrl || 'https://via.placeholder.com/300x200?text=No+Image'}
                  alt={item.title}
                  sx={{ objectFit: 'cover' }}
                />
                <CardContent sx={{ flexGrow: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <Typography variant="h6" sx={{ fontWeight: 700, flexGrow: 1 }}>{item.title}</Typography>
                    {item.favorite && <Tooltip title="Избранное"><span style={{ color: '#FFD600', fontSize: 22, marginLeft: 4 }}>★</span></Tooltip>}
                  </Box>
                  <Typography color="text.secondary" sx={{ mb: 1 }}>{item.type}</Typography>
                  {item.status && <Chip label={statusLabel(item.status)} color={statusColor(item.status)} size="small" sx={{ mr: 1, mb: 1 }} />}
                  {item.watchedDate && <Chip label={`Дата: ${item.watchedDate}`} size="small" sx={{ mr: 1, mb: 1 }} />}
                  {typeof item.rating === 'number' && <Chip label={`Оценка: ${item.rating}`} color="warning" size="small" sx={{ mr: 1, mb: 1 }} />}
                  <Box sx={{ mt: 1, display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {Array.isArray(item.tags) && item.tags.map(tag => (
                      <Chip key={tag} label={tag} size="small" variant="outlined" />
                    ))}
                  </Box>
                </CardContent>
                <CardActions sx={{ justifyContent: 'flex-end' }}>
                  <Tooltip title="Удалить">
                    <IconButton edge="end" onClick={e => { e.stopPropagation(); deleteItem(item.id); }} disabled={loading}>
                      <DeleteIcon />
                    </IconButton>
                  </Tooltip>
                </CardActions>
              </Card>
            </Fade>
          </Grid>
        ))}
      </Grid>

      <Snackbar 
        open={!!error} 
        autoHideDuration={6000} 
        onClose={() => setError(null)}
      >
        <Alert onClose={() => setError(null)} severity="error">
          {error}
        </Alert>
      </Snackbar>
    </Box>
  );
};

function statusLabel(status: string): string {
  switch (status) {
    case 'planned': return 'Запланировано';
    case 'watching': return 'Смотрю';
    case 'completed': return 'Просмотрено';
    case 'dropped': return 'Брошено';
    default: return status;
  }
}

function statusColor(status: string): 'default' | 'info' | 'success' | 'error' {
  switch (status) {
    case 'planned': return 'default';
    case 'watching': return 'info';
    case 'completed': return 'success';
    case 'dropped': return 'error';
    default: return 'default';
  }
} 