import React, { useEffect, useState } from 'react';
import { arrayUnion, doc, getDoc, updateDoc } from 'firebase/firestore';
import { useNavigate, useParams } from 'react-router-dom';
import { db } from '../config/firebase';

type MediaStatus = 'planned' | 'watching' | 'completed' | 'dropped';

interface MediaComment {
  text: string;
  created: string;
}

interface MediaItem {
  id: string;
  title: string;
  type: string;
  tags?: string[];
  userId: string;
  rating?: number;
  comments?: MediaComment[];
  status?: MediaStatus;
  watchedDate?: string;
  favorite?: boolean;
  createdAt?: string;
  imageUrl?: string;
  description?: string;
}

function StatusChip({ status }: { status?: MediaStatus }) {
  if (!status) return null;

  if (status === 'watching') {
    return (
      <span className="px-3 py-1 bg-secondary-container text-on-secondary-container rounded-full text-xs font-bold flex items-center gap-1.5 shadow-lg">
        <span className="w-2 h-2 rounded-full bg-secondary animate-pulse" />
        {status === 'watching' ? 'Смотрю' : status}
      </span>
    );
  }

  if (status === 'completed') {
    return (
      <span className="bg-primary-container/20 backdrop-blur-md text-primary-fixed text-[10px] font-bold px-2 py-1 rounded">
        ПРОСМОТРЕНО
      </span>
    );
  }

  if (status === 'dropped') {
    return (
      <span className="bg-error/20 backdrop-blur-md text-error text-[10px] font-bold px-2 py-1 rounded">БРОШЕНО</span>
    );
  }

  return (
    <span className="bg-surface-container-highest text-on-surface-variant text-[10px] font-bold px-2 py-1 rounded">
      В ПЛАНАХ
    </span>
  );
}

function formatDateTime(iso?: string) {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleString();
}

export const MediaDetails: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [item, setItem] = useState<MediaItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [comment, setComment] = useState('');

  const [rating, setRating] = useState<number>(0);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<MediaStatus>('planned');
  const [watchedDate, setWatchedDate] = useState('');
  const [favorite, setFavorite] = useState(false);

  const [editIndex, setEditIndex] = useState<number | null>(null);
  const [editText, setEditText] = useState('');

  useEffect(() => {
    const fetchItem = async () => {
      try {
        setLoading(true);
        setError(null);
        const ref = doc(db, 'media', id!);
        const snap = await getDoc(ref);
        if (snap.exists()) {
          const data = snap.data() as Omit<MediaItem, 'id'>;
          const loaded: MediaItem = { ...data, id: snap.id };
          setItem(loaded);
          setRating(typeof loaded.rating === 'number' ? loaded.rating : 0);
          setStatus((loaded.status as MediaStatus) || 'planned');
          setWatchedDate(loaded.watchedDate || '');
          setFavorite(!!loaded.favorite);
        } else {
          setError('Элемент не найден');
        }
      } catch (err) {
        setError('Ошибка загрузки элемента');
      } finally {
        setLoading(false);
      }
    };

    if (id) void fetchItem();
  }, [id]);

  const handleSaveMain = async () => {
    if (!item) return;
    setSaving(true);
    try {
      const ref = doc(db, 'media', item.id);
      await updateDoc(ref, { rating, status, watchedDate, favorite });
      setItem({ ...item, rating, status, watchedDate, favorite });
    } catch {
      setError('Ошибка при сохранении изменений');
    } finally {
      setSaving(false);
    }
  };

  const handleAddComment = async () => {
    if (!comment.trim() || !item) return;
    setSaving(true);
    try {
      const ref = doc(db, 'media', item.id);
      const newComment = { text: comment.trim(), created: new Date().toISOString() };
      await updateDoc(ref, {
        comments: arrayUnion(newComment),
      });
      setItem({ ...item, comments: [...(item.comments || []), newComment] });
      setComment('');
    } catch {
      setError('Ошибка при добавлении комментария');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveEdit = async () => {
    if (!item || editIndex === null) return;
    if (!editText.trim()) return;
    setSaving(true);
    try {
      const updatedComments = (item.comments || []).map((c, idx) => (idx === editIndex ? { ...c, text: editText } : c));
      const ref = doc(db, 'media', item.id);
      await updateDoc(ref, { comments: updatedComments });
      setItem({ ...item, comments: updatedComments });
      setEditIndex(null);
      setEditText('');
    } catch {
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
    } catch {
      setError('Ошибка при удалении комментария');
    } finally {
      setSaving(false);
    }
  };

  const commentsCount = item?.comments?.length || 0;

  const stars = Array.from({ length: 10 }).map((_, idx) => {
    const starValue = idx + 1;
    const filled = rating >= starValue;
    return (
      <button
        key={starValue}
        type="button"
        className="text-tertiary hover:scale-125 transition-transform"
        onClick={() => setRating(starValue)}
        disabled={saving}
        aria-label={`Оценка ${starValue}`}
      >
        <span
          className="material-symbols-outlined"
          style={{ fontVariationSettings: filled ? "'FILL' 1" : "'FILL' 0" }}
        >
          star
        </span>
      </button>
    );
  });

  // Простой вариант: setRating(0) кнопкой, т.к. в дизайне без нее неочевидно.
  const setRatingZero = () => setRating(0);

  const statusSelectOptions: Array<{ id: MediaStatus; label: string }> = [
    { id: 'watching', label: 'Смотрю' },
    { id: 'completed', label: 'Просмотрено' },
    { id: 'planned', label: 'В планах' },
    { id: 'dropped', label: 'Брошено' },
  ];

  if (loading) {
    return (
      <div className="mt-10 text-center">
        <div className="inline-block animate-spin rounded-full border-4 border-primary/30 border-t-primary w-10 h-10" />
      </div>
    );
  }
  if (error) {
    return (
      <div className="mt-10">
        <div className="flex items-center justify-between p-4 bg-error-container/20 border-l-4 border-error rounded-r-xl">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-error">error</span>
            <p className="text-sm text-on-error-container">{error}</p>
          </div>
        </div>
      </div>
    );
  }
  if (!item) return null;

  return (
    <div className="max-w-7xl mx-auto flex flex-col gap-8">
      <nav className="flex items-center gap-2 text-sm text-on-surface-variant font-label mt-4">
        <button type="button" className="hover:text-primary transition-colors" onClick={() => navigate('/')}>
          Главная
        </button>
        <span className="material-symbols-outlined text-xs">chevron_right</span>
        <button type="button" className="hover:text-primary transition-colors">
          Библиотека
        </button>
        <span className="material-symbols-outlined text-xs">chevron_right</span>
        <span className="text-white">{item.title}</span>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-16">
        {/* Left: Poster */}
        <div className="lg:col-span-4 group relative">
          <div className="aspect-[2/3] rounded-xl overflow-hidden shadow-2xl shadow-black/50 border border-white/5 relative">
            <img
              className="w-full h-full object-cover scale-100 group-hover:scale-[1.03] transition-transform duration-700"
              data-alt="Cinematic movie poster"
              src={item.imageUrl || 'https://via.placeholder.com/300x450?text=No+Image'}
              alt={item.title}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

            <div className="absolute top-4 left-4 flex gap-2">
              <StatusChip status={status} />
            </div>
          </div>
        </div>

        {/* Right: Details & Controls */}
        <div className="lg:col-span-8 flex flex-col gap-8">
          <section>
            <div className="flex flex-wrap items-baseline gap-4 mb-2">
              <h1 className="text-5xl md:text-6xl font-headline font-black tracking-tight text-white leading-none">{item.title}</h1>
              <span className="text-2xl font-headline font-bold text-on-surface-variant">{item.type}</span>
            </div>

            <div className="flex items-center gap-4 mb-6">
              <div className="flex items-center gap-1 text-tertiary">
                <span className="material-symbols-outlined filled-icon" style={{ fontVariationSettings: "'FILL' 1" }}>
                  star
                </span>
                <span className="text-xl font-headline font-bold text-tertiary">
                  {rating.toFixed(1)}
                </span>
              </div>
              {typeof rating === 'number' ? (
                <span className="text-on-surface-variant font-label text-sm">{` / 10`}</span>
              ) : null}
            </div>

            {item.description ? (
              <p className="text-on-surface-variant text-lg leading-relaxed max-w-3xl font-body">{item.description}</p>
            ) : null}

            {Array.isArray(item.tags) && item.tags.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">
                {item.tags.slice(0, 10).map((t) => (
                  <span key={t} className="px-3 py-1 rounded-full border border-outline-variant/15 text-[10px] text-on-surface-variant">
                    {t}
                  </span>
                ))}
              </div>
            )}
          </section>

          <div className="bg-surface-container-low p-8 rounded-xl flex flex-col gap-8 border border-white/5">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {/* Rating selection */}
              <div className="flex flex-col gap-3">
                <label className="text-xs font-bold text-on-surface-variant uppercase tracking-widest font-label">Ваша оценка</label>
                <div className="flex flex-wrap gap-1">
                  {stars}
                  <button
                    type="button"
                    className="text-on-surface-variant hover:text-primary transition-colors text-xs font-bold px-2 py-1 rounded-lg border border-outline-variant/15"
                    onClick={setRatingZero}
                    disabled={saving}
                  >
                    0
                  </button>
                </div>
              </div>

              {/* Status dropdown */}
              <div className="flex flex-col gap-3">
                <label className="text-xs font-bold text-on-surface-variant uppercase tracking-widest font-label">Статус</label>
                <div className="relative group">
                  <select
                    className="w-full bg-surface-container-highest border-none text-on-surface rounded-lg py-2.5 px-4 focus:ring-1 focus:ring-primary appearance-none cursor-pointer"
                    value={status}
                    onChange={(e) => setStatus(e.target.value as MediaStatus)}
                    disabled={saving}
                  >
                    {statusSelectOptions.map((o) => (
                      <option key={o.id} value={o.id}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                  <span className="material-symbols-outlined absolute right-3 top-2.5 pointer-events-none text-on-surface-variant">
                    expand_more
                  </span>
                </div>
              </div>

              {/* Date field */}
              <div className="flex flex-col gap-3">
                <label className="text-xs font-bold text-on-surface-variant uppercase tracking-widest font-label">Дата просмотра</label>
                <input
                  className="w-full bg-surface-container-highest border-none text-on-surface rounded-lg py-2.5 px-4 focus:ring-1 focus:ring-primary"
                  type="date"
                  value={watchedDate}
                  onChange={(e) => setWatchedDate(e.target.value)}
                  disabled={saving}
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-white/5">
              <label className="flex items-center gap-3 cursor-pointer group select-none">
                <input
                  checked={favorite}
                  className="w-6 h-6 rounded border-outline-variant bg-surface-container text-primary focus:ring-primary focus:ring-offset-background cursor-pointer"
                  type="checkbox"
                  onChange={(e) => setFavorite(e.target.checked)}
                  disabled={saving}
                />
                <span className="text-on-surface font-medium group-hover:text-primary transition-colors font-label">В избранном</span>
              </label>
              <button
                type="button"
                onClick={() => void handleSaveMain()}
                disabled={saving}
                className="bg-gradient-to-br from-primary to-primary-dim text-on-primary-fixed font-headline font-extrabold px-8 py-3 rounded-lg hover:shadow-xl hover:shadow-primary/20 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Сохранить изменения
              </button>
            </div>
          </div>

          {/* Comments Section */}
          <div className="mt-8">
            <div className="flex items-center gap-3 mb-8">
              <h2 className="text-3xl font-headline font-black text-white">Комментарии</h2>
              <span className="text-on-surface-variant font-medium text-lg">{commentsCount}</span>
            </div>

            <div className="bg-surface-container p-6 rounded-xl mb-12 flex flex-col md:flex-row gap-4 items-start border border-white/5 shadow-inner">
              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-white font-black font-headline">
                {item.title?.[0]?.toUpperCase()}
              </div>
              <div className="flex-1 w-full flex flex-col gap-4">
                <textarea
                  className="w-full bg-surface-container-low border-none rounded-lg p-4 text-on-surface placeholder:text-on-surface-variant focus:ring-1 focus:ring-primary-container resize-none"
                  placeholder="Добавить комментарий..."
                  rows={3}
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  disabled={saving}
                />
                <div className="flex justify-end">
                  <button
                    type="button"
                    className="bg-surface-container-highest text-white font-headline font-bold px-6 py-2 rounded-lg hover:bg-white hover:text-black transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    onClick={() => void handleAddComment()}
                    disabled={saving || !comment.trim()}
                  >
                    Отправить
                  </button>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              {(item.comments || []).map((c, idx) => (
                <div
                  key={`${c.created}-${idx}`}
                  className={`flex gap-6 rounded-xl ${
                    editIndex === idx ? 'bg-surface-container p-6 border border-primary/20' : 'bg-surface-container p-6 hover:bg-surface-container-high transition-colors group'
                  }`}
                >
                  <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center text-on-surface-variant">
                    <span className="material-symbols-outlined filled-icon">person</span>
                  </div>

                  <div className="flex-1 flex flex-col gap-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-headline font-bold text-white text-lg">Комментарий</h4>
                        <p className="text-xs text-on-surface-variant font-label">{formatDateTime(c.created)}</p>
                      </div>

                      {editIndex === idx ? null : (
                        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            type="button"
                            className="p-2 hover:bg-surface-container-highest rounded-lg text-on-surface-variant hover:text-primary transition-colors"
                            onClick={() => {
                              setEditIndex(idx);
                              setEditText(c.text);
                            }}
                            disabled={saving}
                          >
                            <span className="material-symbols-outlined text-sm">edit</span>
                          </button>
                          <button
                            type="button"
                            className="p-2 hover:bg-error-container/20 rounded-lg text-on-surface-variant hover:text-error transition-colors"
                            onClick={() => void handleDeleteComment(idx)}
                            disabled={saving}
                          >
                            <span className="material-symbols-outlined text-sm">delete</span>
                          </button>
                        </div>
                      )}
                    </div>

                    {editIndex === idx ? (
                      <>
                        <textarea
                          className="w-full bg-surface-container-low border-none rounded-lg p-3 text-on-surface focus:ring-1 focus:ring-primary font-body"
                          value={editText}
                          onChange={(e) => setEditText(e.target.value)}
                          rows={3}
                          disabled={saving}
                        />
                        <div className="flex gap-3 justify-end">
                          <button
                            type="button"
                            className="px-4 py-2 rounded-lg text-on-surface-variant hover:text-white transition-colors text-sm font-bold uppercase tracking-wider font-label"
                            onClick={() => {
                              setEditIndex(null);
                              setEditText('');
                            }}
                            disabled={saving}
                          >
                            Отмена
                          </button>
                          <button
                            type="button"
                            className="bg-primary text-on-primary px-4 py-2 rounded-lg text-sm font-bold uppercase tracking-wider font-label shadow-lg shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed"
                            onClick={() => void handleSaveEdit()}
                            disabled={saving || !editText.trim()}
                          >
                            Сохранить
                          </button>
                        </div>
                      </>
                    ) : (
                      <p className="text-on-surface-variant font-body leading-relaxed whitespace-pre-wrap">{c.text}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};