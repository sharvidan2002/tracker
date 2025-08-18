import React from 'react'
import { clsx } from 'clsx'

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl'
  color?: 'primary' | 'secondary' | 'white'
  className?: string
  label?: string
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  color = 'primary',
  className,
  label,
}) => {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8',
    xl: 'h-12 w-12',
  }

  const colorClasses = {
    primary: 'border-gray-300 border-t-black',
    secondary: 'border-gray-200 border-t-gray-600',
    white: 'border-gray-400 border-t-white',
  }

  const borderWidth = {
    sm: 'border-2',
    md: 'border-2',
    lg: 'border-3',
    xl: 'border-4',
  }

  return (
    <div className={clsx('flex items-center justify-center', className)}>
      <div
        className={clsx(
          'animate-spin rounded-full',
          sizeClasses[size],
          colorClasses[color],
          borderWidth[size]
        )}
        role="status"
        aria-label={label || 'Loading'}
      />
      {label && (
        <span className="ml-2 text-sm text-gray-600">{label}</span>
      )}
    </div>
  )
}

export default LoadingSpinner