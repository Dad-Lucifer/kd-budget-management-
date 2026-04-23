export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatDateShort(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
  });
}

export function getWalletColor(name: string): string {
  switch (name) {
    case 'Roshan': return 'gold';
    case 'Anand': return 'teal';
    case 'KaamDone': return 'blue';
    default: return 'gold';
  }
}

export function getWalletColorClasses(name: string) {
  switch (name) {
    case 'Roshan':
      return {
        bg: 'bg-gold/10',
        border: 'border-gold/30',
        text: 'text-gold',
        glow: 'glow-gold',
        badge: 'bg-gold/20 text-gold',
        hover: 'hover:border-gold/50',
      };
    case 'Anand':
      return {
        bg: 'bg-teal/10',
        border: 'border-teal/30',
        text: 'text-teal',
        glow: 'glow-teal',
        badge: 'bg-teal/20 text-teal',
        hover: 'hover:border-teal/50',
      };
    case 'KaamDone':
      return {
        bg: 'bg-blue/10',
        border: 'border-blue/30',
        text: 'text-blue',
        glow: 'glow-blue',
        badge: 'bg-blue/20 text-blue',
        hover: 'hover:border-blue/50',
      };
    default:
      return {
        bg: 'bg-gold/10',
        border: 'border-gold/30',
        text: 'text-gold',
        glow: 'glow-gold',
        badge: 'bg-gold/20 text-gold',
        hover: 'hover:border-gold/50',
      };
  }
}

export function getPersonIcon(name: string): string {
  return name === 'Roshan' ? '👤' : '👨‍💼';
}
