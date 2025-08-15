export const formatLastSaved = (lastSaved) => {
  if (!lastSaved) return 'Nunca';
  const now = new Date();
  const saved = new Date(lastSaved);
  const diffMinutes = Math.floor((now - saved) / (1000 * 60));
  if (diffMinutes < 1) return 'Ahora mismo';
  if (diffMinutes < 60) return `Hace ${diffMinutes} min`;
  const hours = saved.getHours().toString().padStart(2, '0');
  const minutes = saved.getMinutes().toString().padStart(2, '0');
  return `${hours}:${minutes}`;
};

export const formatTime = (time) => {
  const hours = time.getHours().toString().padStart(2, '0');
  const minutes = time.getMinutes().toString().padStart(2, '0');
  return `${hours}:${minutes}`;
};
