import React from 'react';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  hoverEffect?: boolean;
  className?: string;
  key?: React.Key;
  children?: React.ReactNode;
}

export default function Card({
  hoverEffect = true,
  children,
  className = '',
  ...props
}: CardProps) {
  return (
    <div
      className={`rounded-2xl border-2 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-5 transition-all duration-300 ${
        hoverEffect ? 'hover:border-blue-500 dark:hover:border-blue-400 hover:shadow-lg hover:shadow-blue-500/5' : ''
      } ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
