import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);

export const formatDate = (date: string | null | undefined, fmt = 'DD MMM YYYY'): string => {
  if (!date) return '—';
  return dayjs(date).format(fmt);
};

export const formatDateTime = (date: string | null | undefined): string => {
  if (!date) return '—';
  return dayjs(date).format('DD MMM YYYY, HH:mm');
};

export const formatRelative = (date: string | null | undefined): string => {
  if (!date) return '—';
  return dayjs(date).fromNow();
};

export const formatInitials = (name: string): string => {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
};