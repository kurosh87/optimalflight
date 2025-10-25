/**
 * Data Quality Badge Component
 * Shows verification level of airport intelligence data
 */

import { Badge } from '@/components/ui/badge';
import { CheckCircle2, AlertCircle, Info } from 'lucide-react';

interface DataQualityBadgeProps {
  quality: 'verified' | 'partial' | 'minimal';
  lastUpdated?: string;
}

export function DataQualityBadge({ quality, lastUpdated }: DataQualityBadgeProps) {
  const config = {
    verified: {
      icon: CheckCircle2,
      label: 'Verified Data',
      variant: 'default' as const,
      description: 'Information verified from official sources',
      color: 'text-green-600 dark:text-green-400',
    },
    partial: {
      icon: AlertCircle,
      label: 'Partial Data',
      variant: 'secondary' as const,
      description: 'Mix of official and user-reported information',
      color: 'text-yellow-600 dark:text-yellow-400',
    },
    minimal: {
      icon: Info,
      label: 'Limited Data',
      variant: 'outline' as const,
      description: 'Basic information only',
      color: 'text-gray-600 dark:text-gray-400',
    },
  };

  const { icon: Icon, label, variant, description, color } = config[quality];

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <Badge variant={variant} className="flex items-center gap-1">
        <Icon className={`h-3 w-3 ${color}`} />
        {label}
      </Badge>
      {lastUpdated && (
        <span className="text-xs text-muted-foreground">
          Updated {new Date(lastUpdated).toLocaleDateString()}
        </span>
      )}
      <span className="text-xs text-muted-foreground hidden sm:inline">
        • {description}
      </span>
    </div>
  );
}
