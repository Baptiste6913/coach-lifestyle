import { forwardRef } from 'react'

type Variant = 'primary' | 'accent' | 'success' | 'ghost' | 'danger'
type Size = 'sm' | 'md' | 'lg'

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant
  size?: Size
}

const BASE =
  'inline-flex items-center justify-center gap-2 rounded-md font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-50 dark:focus-visible:ring-offset-neutral-950'

const SIZES: Record<Size, string> = {
  sm: 'min-h-10 px-3 text-xs',
  md: 'min-h-12 px-4 text-sm',
  lg: 'min-h-14 px-4 text-base',
}

const VARIANTS: Record<Variant, string> = {
  primary:
    'bg-neutral-900 text-white hover:bg-neutral-800 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-200',
  accent:
    'bg-orange-500 text-white hover:bg-orange-600 dark:hover:bg-orange-400',
  success:
    'bg-green-600 text-white hover:bg-green-700 dark:hover:bg-green-500',
  ghost:
    'border border-neutral-300 bg-white hover:bg-neutral-100 dark:border-neutral-700 dark:bg-neutral-900 dark:hover:bg-neutral-800',
  danger: 'bg-red-500 text-white hover:bg-red-600',
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  function Button(
    { variant = 'primary', size = 'md', className = '', ...rest },
    ref,
  ) {
    return (
      <button
        ref={ref}
        className={`${BASE} ${SIZES[size]} ${VARIANTS[variant]} ${className}`}
        {...rest}
      />
    )
  },
)
