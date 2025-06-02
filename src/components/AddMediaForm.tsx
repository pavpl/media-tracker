import React, { useState, useEffect } from 'react';
import { 
  TextField, 
  Button, 
  Box, 
  Rating, 
  Chip, 
  Typography,
  Autocomplete,
  CircularProgress,
  Card,
  CardMedia,
  CardContent
} from '@mui/material';
import { tmdbService, TMDBMedia } from '../services/tmdbService';

interface AddMediaFormProps {
  onSubmit: (data: MediaFormData) => void;
  type: 'movie' | 'game' | 'book';
}

interface MediaFormData {
  title: string;
  description: string;
  rating: number;
  tags: string[];
  imageUrl: string;
  type: 'movie' | 'game' | 'book';
  tmdbId?: number;
}

export const AddMediaForm: React.FC<AddMediaFormProps> = ({ onSubmit, type }) => {
  const [formData, setFormData] = useState<MediaFormData>({
    title: '',
    description: '',
    rating: 0,
    tags: [],
    imageUrl: '',
    type
  });
  const [currentTag, setCurrentTag] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<TMDBMedia[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedMedia, setSelectedMedia] = useState<TMDBMedia | null>(null);

  useEffect(() => {
    const searchMedia = async () => {
      if (searchQuery.length < 2) {
        setSearchResults([]);
        return;
      }

      setLoading(true);
      try {
        const response = await tmdbService.searchMedia(searchQuery);
        setSearchResults(response.results);
      } catch (error) {
        console.error('Error searching media:', error);
      } finally {
        setLoading(false);
      }
    };

    const timeoutId = setTimeout(searchMedia, 500);
    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  const handleMediaSelect = (media: TMDBMedia) => {
    setSelectedMedia(media);
    setFormData({
      ...formData,
      title: media.media_type === 'movie' ? media.title : media.name,
      description: media.overview,
      imageUrl: tmdbService.getPosterUrl(media.poster_path),
      tmdbId: media.id
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const handleAddTag = () => {
    if (currentTag && !formData.tags.includes(currentTag)) {
      setFormData({
        ...formData,
        tags: [...formData.tags, currentTag]
      });
      setCurrentTag('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData({
      ...formData,
      tags: formData.tags.filter(tag => tag !== tagToRemove)
    });
  };

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ maxWidth: 600, mx: 'auto', p: 2 }}>
      <Typography variant="h5" gutterBottom>
        Добавить {type === 'movie' ? 'фильм' : type === 'game' ? 'игру' : 'книгу'}
      </Typography>

      {type === 'movie' && (
        <Box sx={{ mb: 3 }}>
          <Autocomplete
            freeSolo
            options={searchResults}
            getOptionLabel={(option) => 
              typeof option === 'string' 
                ? option 
                : option.media_type === 'movie' 
                  ? option.title 
                  : option.name
            }
            loading={loading}
            inputValue={searchQuery}
            onInputChange={(_, newValue) => setSearchQuery(newValue)}
            onChange={(_, value) => {
              if (value && typeof value !== 'string') {
                handleMediaSelect(value);
              }
            }}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Поиск фильма"
                InputProps={{
                  ...params.InputProps,
                  endAdornment: (
                    <>
                      {loading ? <CircularProgress color="inherit" size={20} /> : null}
                      {params.InputProps.endAdornment}
                    </>
                  ),
                }}
              />
            )}
            renderOption={(props, option) => (
              <Box component="li" {...props}>
                <Card sx={{ display: 'flex', width: '100%' }}>
                  <CardMedia
                    component="img"
                    sx={{ width: 100 }}
                    image={tmdbService.getPosterUrl(option.poster_path, 'w92')}
                    alt={option.media_type === 'movie' ? option.title : option.name}
                  />
                  <CardContent>
                    <Typography variant="subtitle1">
                      {option.media_type === 'movie' ? option.title : option.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {option.media_type === 'movie' ? 'Фильм' : 'Сериал'}
                    </Typography>
                  </CardContent>
                </Card>
              </Box>
            )}
          />
        </Box>
      )}
      
      <TextField
        fullWidth
        label="Название"
        value={formData.title}
        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
        margin="normal"
        required
      />

      <TextField
        fullWidth
        label="Описание"
        value={formData.description}
        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
        margin="normal"
        multiline
        rows={4}
        required
      />

      <TextField
        fullWidth
        label="URL изображения"
        value={formData.imageUrl}
        onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
        margin="normal"
        required
      />

      <Box sx={{ my: 2 }}>
        <Typography component="legend">Оценка</Typography>
        <Rating
          value={formData.rating}
          max={10}
          onChange={(_, newValue) => {
            setFormData({ ...formData, rating: newValue || 0 });
          }}
        />
      </Box>

      <Box sx={{ my: 2 }}>
        {formData.tags.map((tag) => (
          <Chip
            key={tag}
            label={tag}
            onDelete={() => handleRemoveTag(tag)}
            sx={{ mr: 1, mb: 1 }}
          />
        ))}
      </Box>

      <Button
        type="submit"
        variant="contained"
        color="primary"
        fullWidth
        sx={{ mt: 2 }}
      >
        Добавить
      </Button>
    </Box>
  );
}; 