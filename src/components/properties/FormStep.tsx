import React from 'react';
import { CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

interface FormStepProps {
  title: string;
  description?: string;
  completed?: boolean;
  isActive?: boolean;
  isLoading?: boolean;
  error?: string;
  children: React.ReactNode;
  className?: string;
}

export const FormStep: React.FC<FormStepProps> = ({
  title,
  description,
  completed = false,
  isActive = false,
  isLoading = false,
  error,
  children,
  className = ''
}) => {
  const getStatusIcon = () => {
    if (error) return <AlertCircle className="h-5 w-5 text-red-500" />;
    if (isLoading) return <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />;
    if (completed) return <CheckCircle className="h-5 w-5 text-green-500" />;
    return null;
  };

  const getStatusColor = () => {
    if (error) return 'border-red-200 bg-red-50';
    if (completed) return 'border-green-200 bg-green-50';
    if (isActive) return 'border-blue-200 bg-blue-50';
    return 'border-gray-200 bg-white';
  };

  return (
    <div className={`border rounded-lg transition-all duration-200 ${getStatusColor()} ${className}`}>
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {getStatusIcon()}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                {title}
                {error && (
                  <span className="ml-2 text-sm text-red-600 font-normal">
                    (Error)
                  </span>
                )}
              </h3>
              {description && (
                <p className="text-sm text-gray-600 mt-1">{description}</p>
              )}
            </div>
          </div>

          {completed && !error && (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
              Completado
            </span>
          )}
        </div>

        {error && (
          <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-6">
        {children}
      </div>
    </div>
  );
};

interface FormStepHeaderProps {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  completed?: boolean;
  isActive?: boolean;
  error?: string;
  className?: string;
}

export const FormStepHeader: React.FC<FormStepHeaderProps> = ({
  title,
  description,
  icon,
  completed,
  isActive,
  error,
  className = ''
}) => {
  const getStatusIcon = () => {
    if (error) return <AlertCircle className="h-5 w-5 text-red-500" />;
    if (completed) return <CheckCircle className="h-5 w-5 text-green-500" />;
    return icon;
  };

  return (
    <div className={`flex items-center space-x-3 p-4 ${className}`}>
      {getStatusIcon()}
      <div>
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        {description && (
          <p className="text-sm text-gray-600">{description}</p>
        )}
      </div>
    </div>
  );
};

export default FormStep;


