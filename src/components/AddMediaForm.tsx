import React, { useEffect, useMemo, useState } from 'react';
import { tmdbService, TMDBMedia } from '../services/tmdbService';

type MediaStatus = 'planned' | 'watching' | 'completed' | 'dropped';

interface AddMediaFormProps {
  onSubmit: (data: MediaFormData) => void;
  type: 'movie' | 'game' | 'book';
}

export interface MediaFormData {
  title: string;
  description: string;
  rating: number;
  imageUrl: string;
  type: 'movie' | 'game' | 'book';
  tmdbId?: number;
  status: MediaStatus;
}

export const AddMediaForm: React.FC<AddMediaFormProps> = ({ onSubmit, type }) => {
  const [formData, setFormData] = useState<MediaFormData>({
    title: '',
    description: '',
    rating: 0,
    imageUrl: '',
    type,
    tmdbId: undefined,
    status: 'planned',
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<TMDBMedia[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [selectedMedia, setSelectedMedia] = useState<TMDBMedia | null>(null);

  const statusOptions = useMemo(
    () =>
      [
        { id: 'watching' as const, label: 'Смотрю', tone: 'watching' as const },
        { id: 'planned' as const, label: 'В планах', tone: 'planned' as const },
        { id: 'completed' as const, label: 'Просмотрено', tone: 'completed' as const },
        { id: 'dropped' as const, label: 'Брошено', tone: 'dropped' as const },
      ] as const,
    [],
  );

  useEffect(() => {
    const searchMedia = async () => {
      if (searchQuery.trim().length < 2) {
        setSearchResults([]);
        setSearchError(null);
        return;
      }
      setLoading(true);
      setSearchError(null);
      try {
        const response = await tmdbService.searchMedia(searchQuery.trim());
        setSearchResults(response.results);
      } catch (e) {
        const message = e instanceof Error ? e.message : 'Ошибка поиска TMDB';
        console.error('Error searching media:', e);
        setSearchError(message);
        setSearchResults([]);
      } finally {
        setLoading(false);
      }
    };

    const timeoutId = window.setTimeout(searchMedia, 500);
    return () => window.clearTimeout(timeoutId);
  }, [searchQuery]);

  const handleMediaSelect = (media: TMDBMedia) => {
    setSelectedMedia(media);
    setFormData((prev) => ({
      ...prev,
      title: media.media_type === 'movie' ? media.title : media.name,
      description: media.overview,
      imageUrl: tmdbService.getPosterUrl(media.poster_path),
      tmdbId: media.id,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.description.trim() || !formData.imageUrl.trim()) return;
    onSubmit(formData);
  };

  return (
    <form className="flex flex-col gap-6" onSubmit={handleSubmit}>
      {/* TMDB Search Box */}
      <div className="relative group/search">
        <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
          <span className="material-symbols-outlined text-primary">search</span>
        </div>

        <input
          className="w-full bg-surface-container border-none rounded-xl pl-12 pr-12 py-4 text-on-surface focus:ring-2 focus:ring-primary/20 outline-none font-medium transition-all"
          placeholder="Поиск фильмов или сериалов..."
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />

        <div className="absolute inset-y-0 right-4 flex items-center">
          {loading ? (
            <svg className="animate-spin h-5 w-5 text-primary" fill="none" viewBox="0 0 24 24" aria-hidden="true">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path
                className="opacity-75"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                fill="currentColor"
              ></path>
            </svg>
          ) : null}
        </div>

        {searchResults.length > 0 && (
          <div className="absolute top-full mt-2 w-full bg-surface-container-high rounded-xl overflow-hidden shadow-2xl z-20 border border-white/5">
            {searchResults.slice(0, 6).map((option) => {
              const title = option.media_type === 'movie' ? option.title : option.name;
              const subtitle = option.media_type === 'movie' ? 'Фильм' : 'Сериал';
              return (
                <button
                  type="button"
                  key={option.id}
                  className="p-3 hover:bg-primary/10 flex gap-4 cursor-pointer transition-colors text-left"
                  onClick={() => handleMediaSelect(option)}
                >
                  <img
                    className="w-12 h-16 rounded-lg object-cover"
                    alt={`${title} poster`}
                    src={tmdbService.getPosterUrl(option.poster_path, 'w92')}
                  />
                  <div className="flex flex-col justify-center">
                    <span className="font-bold text-on-surface">{title}</span>
                    <span className="text-xs text-on-surface-variant">{subtitle}</span>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {searchError && (
        <div className="bg-error-container/10 border-l-4 border-error p-3 rounded-r-xl text-on-error-container text-sm">
          {searchError}
        </div>
      )}

      {/* Pre-filled Preview Section */}
      {selectedMedia && (
        <div className="flex flex-col md:flex-row gap-6 p-4 bg-surface-container/50 rounded-xl border border-outline-variant/10">
          <div className="w-full md:w-32 h-48 rounded-xl overflow-hidden bg-surface-container flex-shrink-0 relative">
            <img className="w-full h-full object-cover" alt="Movie poster preview" src={formData.imageUrl} />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          </div>

          <div className="flex flex-col gap-3 flex-1">
            <input
              className="bg-transparent border-none p-0 text-xl font-headline font-black focus:ring-0 w-full"
              value={formData.title}
              readOnly
            />
            <textarea
              className="bg-transparent border-none p-0 text-sm text-on-surface-variant leading-relaxed focus:ring-0 w-full h-24 resize-none"
              value={formData.description}
              readOnly
            />
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-xs text-primary">link</span>
              <input
                className="bg-transparent border-none p-0 text-[10px] text-primary/60 font-mono focus:ring-0 w-full"
                value={formData.imageUrl}
                readOnly
              />
            </div>
          </div>
        </div>
      )}

      {/* Metadata & Action */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Rating */}
        <div className="space-y-3">
          <label className="text-label text-on-surface-variant text-sm font-medium">Ваша оценка (0-10)</label>
          <div className="flex items-center justify-between gap-4">
            <span className="text-2xl font-headline font-black text-tertiary">{formData.rating.toFixed(0)}</span>
            <div className="flex gap-0.5">
              {Array.from({ length: 10 }).map((_, idx) => {
                const starValue = idx + 1;
                const filled = formData.rating >= starValue;
                return (
                  <span
                    key={starValue}
                    className="material-symbols-outlined text-tertiary"
                    style={{ fontVariationSettings: filled ? "'FILL' 1" : "'FILL' 0" }}
                  >
                    star
                  </span>
                );
              })}
            </div>
          </div>
          <input
            className="w-full accent-tertiary h-1.5 bg-surface-container rounded-lg appearance-none cursor-pointer"
            min={0}
            max={10}
            step={1}
            type="range"
            value={formData.rating}
            onChange={(e) => setFormData((prev) => ({ ...prev, rating: Number(e.target.value) }))}
          />
        </div>

        {/* Status Tags */}
        <div className="space-y-3">
          <label className="text-label text-on-surface-variant text-sm font-medium">Статус</label>
          <div className="flex flex-wrap gap-2">
            {statusOptions.map((s) => {
              const active = formData.status === s.id;
              if (s.id === 'watching') {
                return (
                  <button
                    key={s.id}
                    type="button"
                    className={
                      active
                        ? 'px-3 py-1.5 rounded-lg bg-secondary-container text-on-secondary-container text-xs font-bold flex items-center gap-1.5 ring-2 ring-secondary/40'
                        : 'px-3 py-1.5 rounded-lg bg-surface-container-highest text-on-surface-variant text-xs font-bold hover:bg-primary/20 hover:text-primary transition-all'
                    }
                    onClick={() => setFormData((prev) => ({ ...prev, status: s.id }))}
                  >
                    <div className={active ? 'w-1.5 h-1.5 rounded-full bg-secondary animate-pulse' : 'hidden'} />
                    {s.label}
                  </button>
                );
              }
              const isError = s.id === 'dropped';
              return (
                <button
                  key={s.id}
                  type="button"
                  className={
                    active
                      ? isError
                        ? 'px-3 py-1.5 rounded-lg bg-error/20 text-error text-xs font-bold flex items-center gap-1'
                        : 'px-3 py-1.5 rounded-lg bg-surface-container-highest text-on-surface-variant text-xs font-bold'
                      : isError
                        ? 'px-3 py-1.5 rounded-lg bg-surface-container-highest text-on-surface-variant text-xs font-bold hover:bg-error/20 hover:text-error transition-all'
                        : 'px-3 py-1.5 rounded-lg bg-surface-container-highest text-on-surface-variant text-xs font-bold hover:bg-primary/20 hover:text-primary transition-all'
                  }
                  onClick={() => setFormData((prev) => ({ ...prev, status: s.id }))}
                >
                  {s.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="pt-4">
        <button
          type="submit"
          className="w-full py-4 bg-gradient-to-br from-primary to-primary-dim text-on-primary-fixed font-headline font-black rounded-xl text-lg shadow-xl shadow-primary/10 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={!formData.title.trim() || !formData.description.trim() || !formData.imageUrl.trim()}
        >
          Добавить в коллекцию
        </button>
      </div>
    </form>
  );
};