const variantClassNames = {
  primary: 'cmc-button cmc-button--primary',
  secondary: 'cmc-button cmc-button--secondary',
  subtle: 'cmc-button cmc-button--subtle'
}

export default function Button({
  as: Component = 'button',
  children,
  className = '',
  variant = 'primary',
  type,
  ...props
}) {
  const variantClassName = variantClassNames[variant] || variantClassNames.primary
  const componentProps = Component === 'button' ? { type: type || 'button', ...props } : props

  return (
    <Component className={`${variantClassName}${className ? ` ${className}` : ''}`} {...componentProps}>
      {children}
    </Component>
  )
}
