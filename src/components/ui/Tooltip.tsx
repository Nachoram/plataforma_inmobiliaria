import React, { useState } from 'react';
import { clsx } from 'clsx';

interface TooltipProps {
  content: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
  children: React.ReactElement;
  className?: string;
  tooltipClassName?: string;
}

const Tooltip: React.FC<TooltipProps> = ({
  content,
  position = 'top',
  children,
  className,
  tooltipClassName
}) => {
  const [isVisible, setIsVisible] = useState(false);

  const positionStyles = {
    top: 'bottom-full left-1/2 transform -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 transform -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 transform -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 transform -translate-y-1/2 ml-2',
  };

  const arrowStyles = {
    top: 'top-full left-1/2 transform -translate-x-1/2 border-l-transparent border-r-transparent border-b-gray-900',
    bottom: 'bottom-full left-1/2 transform -translate-x-1/2 border-l-transparent border-r-transparent border-t-gray-900',
    left: 'left-full top-1/2 transform -translate-y-1/2 border-t-transparent border-b-transparent border-r-gray-900',
    right: 'right-full top-1/2 transform -translate-y-1/2 border-t-transparent border-b-transparent border-l-gray-900',
  };

  return (
    <div
      className={clsx('relative inline-block', className)}
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
    >
      {children}
      {isVisible && (
        <div
          className={clsx(
            'absolute z-50 px-3 py-2 text-sm text-white bg-gray-900 rounded-md shadow-lg whitespace-nowrap transition-opacity duration-200',
            positionStyles[position],
            tooltipClassName
          )}
        >
          {content}
          <div
            className={clsx(
              'absolute w-0 h-0 border-solid border-4',
              arrowStyles[position]
            )}
          />
        </div>
      )}
    </div>
  );
};

export default Tooltip;








