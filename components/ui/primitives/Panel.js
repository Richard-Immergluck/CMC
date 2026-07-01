const toneClassNames = {
  default: '',
  accent: 'cmc-panel--accent'
}

export default function Panel({
  as: Component = 'section',
  children,
  className = '',
  tone = 'default',
  ...props
}) {
  const toneClassName = toneClassNames[tone] || toneClassNames.default
  const classes = ['cmc-panel', toneClassName, className].filter(Boolean).join(' ')

  return (
    <Component className={classes} {...props}>
      {children}
    </Component>
  )
}
