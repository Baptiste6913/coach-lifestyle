type StatProps = {
  label: string
  value: string
  sub?: string
  mono?: boolean
}

export function Stat({ label, value, sub, mono }: StatProps) {
  return (
    <div className="rounded-lg border border-neutral-200 bg-white p-3 text-center dark:border-neutral-800 dark:bg-neutral-900">
      <div className="text-xs uppercase tracking-wider text-neutral-500">
        {label}
      </div>
      <div
        className={`text-lg font-semibold ${mono ? 'font-mono tabular-nums' : ''}`}
      >
        {value}
      </div>
      {sub && <div className="mt-0.5 text-[10px] text-neutral-500">{sub}</div>}
    </div>
  )
}
