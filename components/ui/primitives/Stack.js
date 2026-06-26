export default function Stack({
  as: Component = 'div',
  children,
  className = '',
  gap = 'md',
  ...props
}) {
  return (
    <Component className={`cmc-stack cmc-stack--${gap}${className ? ` ${className}` : ''}`} {...props}>
      {children}
    </Component>
  )
}
