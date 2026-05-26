type CardProps = React.HTMLAttributes<HTMLDivElement> & {
  interactive?: boolean
}

export function Card({
  interactive,
  className = '',
  ...rest
}: CardProps) {
  const base =
    'rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900'
  const hover = interactive
    ? 'transition-colors hover:border-neutral-400 dark:hover:border-neutral-600'
    : ''
  return <div className={`${base} ${hover} ${className}`} {...rest} />
}
