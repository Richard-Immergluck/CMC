export default function Panel({ as: Component = 'section', children, className = '', ...props }) {
  return (
    <Component className={`cmc-panel${className ? ` ${className}` : ''}`} {...props}>
      {children}
    </Component>
  )
}
