const variantClassNames = {
  primary: 'cmc-button cmc-button--primary',
  secondary: 'cmc-button cmc-button--secondary',
  subtle: 'cmc-button cmc-button--subtle',
  paper: 'cmc-button cmc-button--paper',
  ink: 'cmc-button cmc-button--ink',
  danger: 'cmc-button cmc-button--danger'
}

const sizeClassNames = {
  sm: 'cmc-button--sm',
  md: '',
  lg: 'cmc-button--lg'
}

export default function Button({
  as: Component = 'button',
  children,
  className = '',
  size = 'md',
  variant = 'primary',
  type,
  ...props
}) {
  const variantClassName = variantClassNames[variant] || variantClassNames.primary
  const sizeClassName = sizeClassNames[size] || sizeClassNames.md
  const componentProps = Component === 'button' ? { type: type || 'button', ...props } : props
  const classes = [variantClassName, sizeClassName, className].filter(Boolean).join(' ')

  return (
    <Component className={classes} {...componentProps}>
      {children}
    </Component>
  )
}
