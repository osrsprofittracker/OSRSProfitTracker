import { Bell, Clock, Trophy, User, Newspaper, MessageSquare, TrendingUp, TrendingDown } from 'lucide-react';

export function getTypeIcon(type) {
  switch (type) {
    case 'limitTimer':
      return <Clock size={16} />;
    case 'altAccountTimer':
      return <User size={16} />;
    case 'milestone':
      return <Trophy size={16} />;
    case 'osrsNews':
      return <Newspaper size={16} />;
    case 'jmodReddit':
      return <MessageSquare size={16} />;
    case 'priceAlert':
    case 'priceAlertHigh':
      return <TrendingUp size={16} />;
    case 'priceAlertLow':
      return <TrendingDown size={16} />;
    default:
      return <Bell size={16} />;
  }
}

export function getTypeColor(type) {
  switch (type) {
    case 'limitTimer':
      return 'var(--notification-timer-color, rgb(202, 138, 4))';
    case 'altAccountTimer':
      return 'var(--notification-alt-color, rgb(168, 85, 247))';
    case 'milestone':
      return 'var(--notification-milestone-color, rgb(34, 197, 94))';
    case 'osrsNews':
      return 'var(--notification-news-color, rgb(14, 165, 233))';
    case 'jmodReddit':
      return 'var(--notification-jmod-color, rgb(255, 149, 0))';
    case 'priceAlert':
    case 'priceAlertLow':
      return 'rgb(239, 68, 68)';
    case 'priceAlertHigh':
      return 'rgb(74, 222, 128)';
    default:
      return 'rgb(148, 163, 184)';
  }
}
