/**
 * SkeletonLoader.tsx
 *
 * Componentes avanzados de skeleton loading con diferentes variantes
 * y animaciones personalizables para mejor UX durante la carga
 */

import React, { useMemo } from 'react';
import { cn } from '../../lib/utils';

interface BaseSkeletonProps {
  className?: string;
  animation?: 'pulse' | 'wave' | 'shimmer' | 'fade' | 'bounce';
  speed?: 'slow' | 'normal' | 'fast';
  rounded?: boolean | 'sm' | 'md' | 'lg' | 'xl' | 'full';
  variant?: 'default' | 'subtle' | 'dark';
}

interface SkeletonProps extends BaseSkeletonProps {
  width?: string | number;
  height?: string | number;
  as?: React.ElementType;
}

/**
 * Componente base de skeleton con diferentes animaciones
 */
export const Skeleton: React.FC<SkeletonProps> = ({
  className,
  animation = 'shimmer',
  speed = 'normal',
  rounded = false,
  variant = 'default',
  width,
  height,
  as: Component = 'div',
  ...props
}) => {
  const skeletonClasses = useMemo(() => {
    const baseClasses = 'relative overflow-hidden bg-gray-200 dark:bg-gray-700';

    // Animations
    const animationClasses = {
      pulse: 'animate-pulse',
      wave: 'animate-pulse', // Simplified wave animation
      shimmer: 'before:absolute before:inset-0 before:-translate-x-full before:bg-gradient-to-r before:from-transparent before:via-white before:to-transparent before:animate-shimmer',
      fade: 'animate-pulse opacity-60',
      bounce: 'animate-bounce'
    };

    // Speed variations
    const speedClasses = {
      slow: animation === 'shimmer' ? 'before:animate-duration-3000' : 'animate-duration-2000',
      normal: animation === 'shimmer' ? 'before:animate-duration-2000' : 'animate-duration-1000',
      fast: animation === 'shimmer' ? 'before:animate-duration-1000' : 'animate-duration-500'
    };

    // Rounded corners
    const roundedClasses = {
      false: '',
      true: 'rounded',
      sm: 'rounded-sm',
      md: 'rounded-md',
      lg: 'rounded-lg',
      xl: 'rounded-xl',
      full: 'rounded-full'
    };

    // Variants
    const variantClasses = {
      default: '',
      subtle: 'bg-gray-100 dark:bg-gray-800',
      dark: 'bg-gray-300 dark:bg-gray-600'
    };

    return cn(
      baseClasses,
      animationClasses[animation],
      speedClasses[speed],
      roundedClasses[rounded as keyof typeof roundedClasses],
      variantClasses[variant],
      className
    );
  }, [animation, speed, rounded, variant, className]);

  const style = useMemo(() => ({
    width: width ? (typeof width === 'number' ? `${width}px` : width) : undefined,
    height: height ? (typeof height === 'number' ? `${height}px` : height) : undefined
  }), [width, height]);

  return (
    <Component
      className={skeletonClasses}
      style={style}
      {...props}
    />
  );
};

/**
 * Skeleton para texto con líneas variables
 */
interface TextSkeletonProps extends BaseSkeletonProps {
  lines?: number;
  lineHeight?: number;
  lastLineWidth?: string | number;
}

export const TextSkeleton: React.FC<TextSkeletonProps> = ({
  lines = 3,
  lineHeight = 1.5,
  lastLineWidth = '60%',
  ...props
}) => {
  const lineElements = useMemo(() => {
    return Array.from({ length: lines }, (_, index) => {
      const isLastLine = index === lines - 1;
      const width = isLastLine ? lastLineWidth : '100%';

      return (
        <Skeleton
          key={index}
          height={`${lineHeight}rem`}
          width={width}
          className="mb-2 last:mb-0"
          {...props}
        />
      );
    });
  }, [lines, lineHeight, lastLineWidth, props]);

  return <div>{lineElements}</div>;
};

/**
 * Skeleton para tarjetas de contenido
 */
interface CardSkeletonProps extends BaseSkeletonProps {
  showAvatar?: boolean;
  showActions?: boolean;
  contentLines?: number;
}

export const CardSkeleton: React.FC<CardSkeletonProps> = ({
  showAvatar = false,
  showActions = false,
  contentLines = 3,
  ...props
}) => {
  return (
    <div className="border border-gray-200 rounded-lg p-4 space-y-3">
      {/* Header con avatar opcional */}
      <div className="flex items-center space-x-3">
        {showAvatar && (
          <Skeleton width={40} height={40} rounded="full" {...props} />
        )}
        <div className="flex-1 space-y-2">
          <Skeleton width="60%" height={16} {...props} />
          <Skeleton width="40%" height={12} {...props} />
        </div>
      </div>

      {/* Contenido */}
      <TextSkeleton lines={contentLines} {...props} />

      {/* Acciones opcionales */}
      {showActions && (
        <div className="flex justify-between items-center pt-2">
          <div className="flex space-x-2">
            <Skeleton width={60} height={24} rounded="full" {...props} />
            <Skeleton width={60} height={24} rounded="full" {...props} />
          </div>
          <Skeleton width={80} height={24} rounded="full" {...props} />
        </div>
      )}
    </div>
  );
};

/**
 * Skeleton para tablas
 */
interface TableSkeletonProps extends BaseSkeletonProps {
  rows?: number;
  columns?: number;
  showHeader?: boolean;
}

export const TableSkeleton: React.FC<TableSkeletonProps> = ({
  rows = 5,
  columns = 4,
  showHeader = true,
  ...props
}) => {
  const tableRows = useMemo(() => {
    return Array.from({ length: rows + (showHeader ? 1 : 0) }, (_, rowIndex) => {
      const isHeader = showHeader && rowIndex === 0;

      return (
        <tr key={rowIndex} className={isHeader ? 'border-b-2' : ''}>
          {Array.from({ length: columns }, (_, colIndex) => (
            <td key={colIndex} className="px-4 py-3">
              <Skeleton
                width={isHeader ? '80%' : '100%'}
                height={isHeader ? 16 : 14}
                variant={isHeader ? 'dark' : 'default'}
                {...props}
              />
            </td>
          ))}
        </tr>
      );
    });
  }, [rows, columns, showHeader, props]);

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <tbody>{tableRows}</tbody>
      </table>
    </div>
  );
};

/**
 * Skeleton para formularios
 */
interface FormSkeletonProps extends BaseSkeletonProps {
  fields?: number;
  showButtons?: boolean;
  buttonCount?: number;
}

export const FormSkeleton: React.FC<FormSkeletonProps> = ({
  fields = 4,
  showButtons = true,
  buttonCount = 2,
  ...props
}) => {
  const fieldElements = useMemo(() => {
    return Array.from({ length: fields }, (_, index) => {
      const fieldType = index % 3; // 0: text, 1: textarea, 2: select

      return (
        <div key={index} className="space-y-2 mb-4">
          <Skeleton width="30%" height={14} {...props} />
          {fieldType === 1 ? (
            <Skeleton width="100%" height={80} {...props} />
          ) : (
            <Skeleton width="100%" height={40} {...props} />
          )}
        </div>
      );
    });
  }, [fields, props]);

  return (
    <div className="space-y-6">
      {fieldElements}

      {showButtons && (
        <div className="flex justify-end space-x-3">
          {Array.from({ length: buttonCount }, (_, index) => (
            <Skeleton
              key={index}
              width={80 + (index * 20)}
              height={36}
              rounded="md"
              {...props}
            />
          ))}
        </div>
      )}
    </div>
  );
};

/**
 * Skeleton para listas de elementos
 */
interface ListSkeletonProps extends BaseSkeletonProps {
  items?: number;
  itemHeight?: number;
  showDividers?: boolean;
  variant?: 'default' | 'compact' | 'detailed';
}

export const ListSkeleton: React.FC<ListSkeletonProps> = ({
  items = 5,
  itemHeight = 60,
  showDividers = true,
  variant = 'default',
  ...props
}) => {
  const listItems = useMemo(() => {
    return Array.from({ length: items }, (_, index) => {
      const isLast = index === items - 1;

      let content;
      switch (variant) {
        case 'compact':
          content = (
            <div className="flex items-center space-x-3">
              <Skeleton width={32} height={32} rounded="full" {...props} />
              <div className="flex-1">
                <Skeleton width="70%" height={14} {...props} />
              </div>
              <Skeleton width={60} height={20} rounded="full" {...props} />
            </div>
          );
          break;

        case 'detailed':
          content = (
            <div className="space-y-2">
              <div className="flex items-center space-x-3">
                <Skeleton width={40} height={40} rounded="full" {...props} />
                <div className="flex-1 space-y-1">
                  <Skeleton width="60%" height={16} {...props} />
                  <Skeleton width="40%" height={12} {...props} />
                </div>
              </div>
              <Skeleton width="90%" height={12} {...props} />
            </div>
          );
          break;

        default:
          content = (
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Skeleton width={itemHeight * 0.6} height={itemHeight * 0.6} rounded="full" {...props} />
                <div className="space-y-1">
                  <Skeleton width={150} height={14} {...props} />
                  <Skeleton width={100} height={12} {...props} />
                </div>
              </div>
              <Skeleton width={80} height={24} rounded="full" {...props} />
            </div>
          );
      }

      return (
        <div
          key={index}
          className={cn(
            "px-4 py-3",
            showDividers && !isLast && "border-b border-gray-200"
          )}
        >
          {content}
        </div>
      );
    });
  }, [items, itemHeight, showDividers, variant, props]);

  return <div>{listItems}</div>;
};

/**
 * Skeleton animado con gradiente
 */
export const ShimmerSkeleton: React.FC<SkeletonProps> = (props) => {
  return <Skeleton animation="shimmer" {...props} />;
};

/**
 * Skeleton con placeholder de imagen
 */
interface ImageSkeletonProps extends BaseSkeletonProps {
  aspectRatio?: number;
  showPlaceholder?: boolean;
}

export const ImageSkeleton: React.FC<ImageSkeletonProps> = ({
  aspectRatio = 1,
  showPlaceholder = true,
  className,
  ...props
}) => {
  return (
    <div className={cn("relative overflow-hidden", className)}>
      <Skeleton
        width="100%"
        height={0}
        style={{ paddingBottom: `${(1 / aspectRatio) * 100}%` }}
        {...props}
      />
      {showPlaceholder && (
        <div className="absolute inset-0 flex items-center justify-center">
          <svg
            className="w-12 h-12 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1}
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
        </div>
      )}
    </div>
  );
};

/**
 * Skeleton compuesto para páginas completas
 */
interface PageSkeletonProps extends BaseSkeletonProps {
  header?: boolean;
  sidebar?: boolean;
  content?: boolean;
  footer?: boolean;
}

export const PageSkeleton: React.FC<PageSkeletonProps> = ({
  header = true,
  sidebar = false,
  content = true,
  footer = true,
  ...props
}) => {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      {header && (
        <header className="bg-white border-b border-gray-200 px-4 py-3">
          <div className="flex items-center justify-between">
            <Skeleton width={150} height={24} {...props} />
            <div className="flex items-center space-x-4">
              <Skeleton width={32} height={32} rounded="full" {...props} />
              <Skeleton width={32} height={32} rounded="full" {...props} />
              <Skeleton width={80} height={32} rounded="md" {...props} />
            </div>
          </div>
        </header>
      )}

      <div className="flex">
        {/* Sidebar */}
        {sidebar && (
          <aside className="w-64 bg-white border-r border-gray-200 p-4">
            <div className="space-y-4">
              {Array.from({ length: 6 }, (_, i) => (
                <Skeleton key={i} width="100%" height={40} rounded="md" {...props} />
              ))}
            </div>
          </aside>
        )}

        {/* Main Content */}
        <main className="flex-1 p-6">
          {content && (
            <div className="space-y-6">
              {/* Page Title */}
              <div>
                <Skeleton width={300} height={32} {...props} />
                <Skeleton width={500} height={16} className="mt-2" {...props} />
              </div>

              {/* Content Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {Array.from({ length: 6 }, (_, i) => (
                  <CardSkeleton key={i} {...props} />
                ))}
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Footer */}
      {footer && (
        <footer className="bg-white border-t border-gray-200 px-4 py-3 mt-12">
          <div className="flex items-center justify-between">
            <Skeleton width={200} height={16} {...props} />
            <div className="flex space-x-4">
              <Skeleton width={60} height={16} {...props} />
              <Skeleton width={60} height={16} {...props} />
              <Skeleton width={60} height={16} {...props} />
            </div>
          </div>
        </footer>
      )}
    </div>
  );
};

/**
 * Hook para controlar skeletons dinámicamente
 */
export const useSkeletonState = (initialLoading = true) => {
  const [isLoading, setIsLoading] = React.useState(initialLoading);
  const [skeletonVariant, setSkeletonVariant] = React.useState<'default' | 'subtle' | 'dark'>('default');

  const showSkeleton = React.useCallback(() => setIsLoading(true), []);
  const hideSkeleton = React.useCallback(() => setIsLoading(false), []);
  const setVariant = React.useCallback((variant: 'default' | 'subtle' | 'dark') => setSkeletonVariant(variant), []);

  return {
    isLoading,
    skeletonVariant,
    showSkeleton,
    hideSkeleton,
    setVariant,
    SkeletonComponent: isLoading ? (props: any) => <Skeleton variant={skeletonVariant} {...props} /> : () => null
  };
};
