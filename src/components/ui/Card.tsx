import React from 'react';
import { clsx } from 'clsx';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  clickable?: boolean;
  hover?: boolean;
  onClick?: () => void;
}

const Card: React.FC<CardProps> = ({
  children,
  className,
  clickable = false,
  hover = false,
  onClick
}) => {
  const baseStyles = 'bg-white rounded-xl shadow-lg p-6 border border-gray-200';

  const interactiveStyles = clickable || hover
    ? 'transition-all duration-200 cursor-pointer hover:shadow-xl hover:shadow-gray-300/25'
    : '';

  const clickableStyles = clickable ? 'hover:border-blue-300' : '';

  return (
    <div
      className={clsx(
        baseStyles,
        interactiveStyles,
        clickableStyles,
        className
      )}
      onClick={onClick}
    >
      {children}
    </div>
  );
};

export default Card;



