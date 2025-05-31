import React, { useState } from 'react';
import { TextField, Button, Box, Rating, Chip, FormControl, InputLabel, Select, MenuItem, Typography } from '@mui/material';

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
}

const AddMediaForm: React.FC<AddMediaFormProps> = ({ onSubmit, type }) => {
  const [formData, setFormData] = useState<MediaFormData>({
    title: '',
    description: '',
    rating: 0,
    tags: [],
    imageUrl: '',
    type
  });
  const [currentTag, setCurrentTag] = useState('');

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
          onChange={(_, newValue) => {
            setFormData({ ...formData, rating: newValue || 0 });
          }}
        />
      </Box>

      <Box sx={{ my: 2 }}>
        <TextField
          label="Добавить тег"
          value={currentTag}
          onChange={(e) => setCurrentTag(e.target.value)}
          onKeyPress={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              handleAddTag();
            }
          }}
        />
        <Button onClick={handleAddTag} sx={{ ml: 1 }}>
          Добавить
        </Button>
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

export default AddMediaForm; 