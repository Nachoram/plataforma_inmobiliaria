import React from 'react';
import { clsx } from 'clsx';
import {
  AlertCircle,
  CheckCircle,
  Info,
  AlertTriangle
} from 'lucide-react';

interface AlertProps {
  type?: 'info' | 'success' | 'warning' | 'error';
  title?: string;
  message: string;
  className?: string;
}

const Alert: React.FC<AlertProps> = ({
  type = 'info',
  title,
  message,
  className
}) => {
  const baseStyles = 'flex items-start p-4 rounded-lg border';

  const typeStyles = {
    info: 'bg-blue-50 border-blue-200 text-blue-800',
    success: 'bg-green-50 border-green-200 text-green-800',
    warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
    error: 'bg-red-50 border-red-200 text-red-800',
  };

  const iconStyles = {
    info: 'text-blue-600',
    success: 'text-green-600',
    warning: 'text-yellow-600',
    error: 'text-red-600',
  };

  const icons = {
    info: Info,
    success: CheckCircle,
    warning: AlertTriangle,
    error: AlertCircle,
  };

  const Icon = icons[type];

  return (
    <div className={clsx(baseStyles, typeStyles[type], className)}>
      <div className="flex-shrink-0">
        <Icon className={clsx('h-5 w-5', iconStyles[type])} />
      </div>
      <div className="ml-3 flex-1">
        {title && (
          <h3 className="text-sm font-medium mb-1">
            {title}
          </h3>
        )}
        <div className="text-sm">
          {message}
        </div>
      </div>
    </div>
  );
};

export default Alert;





