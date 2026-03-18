import React, { useEffect, useMemo, useState } from 'react';
import { addDoc, collection, deleteDoc, doc, getDocs, query, where } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { db } from '../config/firebase';
import { AddMediaForm, type MediaFormData } from './AddMediaForm';

type MediaStatus = 'planned' | 'watching' | 'completed' | 'dropped';

interface MediaItem {
  id: string;
  title: string;
  type: string;
  userId: string;
  tags?: string[];
  status?: MediaStatus;
  watchedDate?: string;
  favorite?: boolean;
  createdAt?: string;
  rating?: number;
  imageUrl?: string;
}

interface MediaListProps {
  userId: string;
}

function formatShortDate(iso?: string) {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  return `${dd}.${mm}`;
}

function statusLabel(status?: string) {
  switch (status) {
    case 'planned':
      return 'В планах';
    case 'watching':
      return 'Смотрю';
    case 'completed':
      return 'Просмотрено';
    case 'dropped':
      return 'Брошено';
    default:
      return status || '';
  }
}

function StatusChip({ status }: { status?: MediaStatus }) {
  if (!status) return null;

  if (status === 'watching') {
    return (
      <span className="bg-secondary-container text-on-secondary-container text-[10px] font-bold px-2 py-1 rounded flex items-center gap-1 shadow-lg">
        <span className="w-1.5 h-1.5 bg-secondary rounded-full animate-pulse" />
        {statusLabel(status)}
      </span>
    );
  }

  if (status === 'completed') {
    return (
      <span className="bg-primary-container/20 backdrop-blur-md text-primary-fixed text-[10px] font-bold px-2 py-1 rounded">
        {statusLabel(status).toUpperCase()}
      </span>
    );
  }

  if (status === 'dropped') {
    return (
      <span className="bg-error/20 text-error backdrop-blur-md text-[10px] font-bold px-2 py-1 rounded">
        {statusLabel(status).toUpperCase()}
      </span>
    );
  }

  return (
    <span className="bg-surface-container-highest text-on-surface-variant text-[10px] font-bold px-2 py-1 rounded">
      {statusLabel(status).toUpperCase()}
    </span>
  );
}

export const MediaList: React.FC<MediaListProps> = ({ userId }) => {
  const navigate = useNavigate();
  const [items, setItems] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<MediaStatus | ''>('');
  const [filterRating, setFilterRating] = useState<number | null>(null);

  const [addDialogOpen, setAddDialogOpen] = useState(false);

  const fetchItems = async () => {
    try {
      setLoading(true);
      const q = query(collection(db, 'media'), where('userId', '==', userId));
      const querySnapshot = await getDocs(q);
      const mediaItems = querySnapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...(docSnap.data() as Omit<MediaItem, 'id'>),
      }));
      setItems(mediaItems);
    } catch (err) {
      setError('Ошибка при загрузке данных');
      console.error('Error fetching items:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchItems();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const handleAddMedia = async (data: MediaFormData) => {
    try {
      setLoading(true);
      await addDoc(collection(db, 'media'), {
        ...data,
        userId,
        createdAt: new Date().toISOString(),
        status: data.status ?? 'planned',
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

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      if (search && !item.title.toLowerCase().includes(search.toLowerCase())) return false;
      if (filterStatus && item.status !== filterStatus) return false;
      if (filterRating !== null) {
        if (typeof item.rating !== 'number') return false;
        if (item.rating < filterRating) return false;
      }
      return true;
    });
  }, [filterRating, filterStatus, items, search]);

  return (
    <div className="max-w-7xl mx-auto flex flex-col gap-10">
      {error && (
        <div className="flex items-center justify-between p-4 bg-error-container/20 border-l-4 border-error rounded-r-xl">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-error">error</span>
            <p className="text-sm text-on-error-container">{error}</p>
          </div>
          <button className="text-on-error-container/60 hover:text-on-error-container" onClick={() => setError(null)}>
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>
      )}

      <section className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-1">
              <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-2">Поиск</label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-lg">
                  search
                </span>
                <input
                  className="w-full bg-surface-container border-none rounded-xl pl-10 pr-4 py-3 focus:ring-2 focus:ring-primary/50 text-sm placeholder:text-outline outline-none"
                  placeholder="Название фильма..."
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-2">Статус</label>
              <select
                className="w-full bg-surface-container border-none rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary/50 text-sm appearance-none"
                value={filterStatus}
                onChange={(e) => setFilterStatus((e.target.value || '') as any)}
              >
                <option value="">Все статусы</option>
                <option value="watching">Смотрю</option>
                <option value="completed">Просмотрено</option>
                <option value="planned">В планах</option>
                <option value="dropped">Брошено</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-2">Оценка от</label>
              <div className="flex items-center gap-4 py-2.5">
                <input
                  className="w-full h-1.5 bg-surface-container-highest rounded-lg appearance-none cursor-pointer accent-primary"
                  max={10}
                  min={0}
                  step={1}
                  type="range"
                  value={filterRating ?? 0}
                  onChange={(e) => setFilterRating(Number(e.target.value))}
                />
                <span className="text-sm font-bold text-tertiary">{filterRating ?? 0}.0</span>
                <button
                  type="button"
                  className="text-xs font-bold text-primary hover:underline decoration-2 underline-offset-4"
                  onClick={() => setFilterRating(null)}
                >
                  Сбросить
                </button>
              </div>
            </div>
          </div>

          <button
            type="button"
            className="bg-gradient-to-br from-primary to-primary-dim text-on-primary-fixed px-6 py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:shadow-lg hover:shadow-primary/20 transition-all active:scale-95"
            onClick={() => setAddDialogOpen(true)}
          >
            <span className="material-symbols-outlined">add</span>
            Добавить фильм
          </button>
        </div>
      </section>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
        {loading ? (
          Array.from({ length: 6 }).map((_, idx) => (
            <div key={idx} className="bg-surface-container rounded-xl overflow-hidden animate-pulse">
              <div className="aspect-[2/3] bg-surface-container-highest" />
              <div className="p-4 space-y-3">
                <div className="h-4 bg-surface-container-highest rounded w-3/4" />
                <div className="h-3 bg-surface-container-highest rounded w-1/2" />
                <div className="h-2 bg-surface-container-highest rounded w-full" />
              </div>
            </div>
          ))
        ) : filteredItems.length === 0 ? (
          <div className="col-span-1 sm:col-span-2 lg:col-span-3 xl:col-span-2 border-2 border-dashed border-outline-variant/20 rounded-xl flex flex-col items-center justify-center p-12 text-center group">
            <div className="w-16 h-16 rounded-full bg-surface-container-highest flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <span className="material-symbols-outlined text-3xl text-on-surface-variant group-hover:text-primary">movie_filter</span>
            </div>
            <h4 className="font-headline font-bold text-white mb-2">У вас пока нет медиа в списке</h4>
            <p className="text-sm text-on-surface-variant max-w-xs mx-auto mb-6">
              Добавьте первый фильм или сериал, чтобы начать отслеживать свой прогресс.
            </p>
            <button
              type="button"
              className="text-primary font-bold text-sm hover:underline decoration-2 underline-offset-4"
              onClick={() => setAddDialogOpen(true)}
            >
              Добавить сейчас
            </button>
          </div>
        ) : (
          filteredItems.map((item) => {
            const year = item.watchedDate ? new Date(item.watchedDate).getFullYear() : null;
            return (
              <article
                key={item.id}
                className="group relative bg-surface-container rounded-xl overflow-hidden hover:bg-surface-container-high transition-all duration-300 cursor-pointer"
                onClick={() => navigate(`/media/${item.id}`)}
              >
                <div className="relative aspect-[2/3] overflow-hidden">
                  <img
                    alt={item.title}
                    src={item.imageUrl || 'https://via.placeholder.com/300x200?text=No+Image'}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />

                  <div className="absolute top-3 left-3">
                    <StatusChip status={item.status} />
                  </div>

                  <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      type="button"
                      className="bg-error/20 backdrop-blur-md text-error p-2 rounded-lg hover:bg-error hover:text-on-error transition-colors"
                      onClick={(e) => {
                        e.stopPropagation();
                        void deleteItem(item.id);
                      }}
                      disabled={loading}
                      aria-label="Удалить"
                    >
                      <span className="material-symbols-outlined text-sm">delete</span>
                    </button>
                  </div>

                  {typeof item.rating === 'number' && (
                    <div className="absolute bottom-3 left-3 right-3 flex justify-between items-center translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all">
                      <span className="bg-surface-container-highest/80 backdrop-blur-md text-tertiary px-2 py-1 rounded-lg text-sm font-black">
                        {item.rating.toFixed(1)}
                      </span>
                      <span className="material-symbols-outlined text-tertiary filled-icon">star</span>
                    </div>
                  )}
                </div>

                <div className="p-4">
                  <div className="flex justify-between items-start mb-1 gap-3">
                    <h3 className="font-headline font-bold text-white truncate text-base">{item.title}</h3>
                    {year ? <span className="text-[10px] text-on-surface-variant font-medium">{year}</span> : null}
                  </div>
                  <p className="text-xs text-on-surface-variant mb-3">
                    {item.type} • Добавлено {formatShortDate(item.createdAt)}
                  </p>

                  <div className="flex items-center gap-2 mb-2">
                    {item.favorite ? <span className="material-symbols-outlined text-tertiary filled-icon">star</span> : null}
                    {typeof item.rating === 'number' ? (
                      <span className="text-xs font-bold text-white">{item.rating.toFixed(1)}/10</span>
                    ) : null}
                  </div>

                  {Array.isArray(item.tags) && item.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {item.tags.slice(0, 6).map((tag) => (
                        <span
                          key={tag}
                          className="px-2 py-1 rounded-full border border-outline-variant/15 text-[10px] text-on-surface-variant"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </article>
            );
          })
        )}
      </div>

      {addDialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full lg:w-1/2 bg-surface-container-low rounded-xl p-6 md:p-8 flex flex-col gap-6 shadow-2xl border border-white/5 relative">
            <header className="flex flex-col gap-1">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-2xl font-headline font-extrabold tracking-tight">Добавить медиа</h2>
                  <p className="text-on-surface-variant text-sm font-body mt-1">Поиск через базу TMDB</p>
                </div>
                <button
                  type="button"
                  className="p-2 rounded-full hover:bg-surface-container-highest transition-colors"
                  onClick={() => setAddDialogOpen(false)}
                  aria-label="Закрыть"
                >
                  <span className="material-symbols-outlined text-on-surface-variant">close</span>
                </button>
              </div>
            </header>

            <AddMediaForm
              onSubmit={async (data) => {
                await handleAddMedia(data);
                setAddDialogOpen(false);
              }}
              type="movie"
            />
          </div>
        </div>
      )}
    </div>
  );
};