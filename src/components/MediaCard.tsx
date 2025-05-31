import React from 'react';
import { Card, CardContent, CardMedia, Typography, Chip, Rating, Box } from '@mui/material';

interface MediaCardProps {
  title: string;
  imageUrl: string;
  rating: number;
  tags: string[];
  description: string;
  type: 'movie' | 'game' | 'book';
}

const MediaCard: React.FC<MediaCardProps> = ({ title, imageUrl, rating, tags, description, type }) => {
  return (
    <Card sx={{ maxWidth: 345, m: 2, height: '100%', display: 'flex', flexDirection: 'column' }}>
      <CardMedia
        component="img"
        height="200"
        image={imageUrl}
        alt={title}
      />
      <CardContent sx={{ flexGrow: 1 }}>
        <Typography gutterBottom variant="h5" component="div">
          {title}
        </Typography>
        <Box sx={{ mb: 1 }}>
          <Rating value={rating} precision={0.5} readOnly />
        </Box>
        <Box sx={{ mb: 1 }}>
          {tags.map((tag) => (
            <Chip
              key={tag}
              label={tag}
              size="small"
              sx={{ mr: 0.5, mb: 0.5 }}
            />
          ))}
        </Box>
        <Typography variant="body2" color="text.secondary">
          {description}
        </Typography>
      </CardContent>
    </Card>
  );
};

export default MediaCard; 