/**
 * SidePanel.jsx — contenedor común de los paneles laterales (300 px, borde
 * izquierdo). La cabecera lleva título, contador y botones de acción.
 */
export default function SidePanel({ title, subtitle, actions, children, onClose }) {
  return (
    <aside className="side-panel" aria-label={title}>
      <header className="side-panel__head">
        <span className="truncate">{title}</span>
        {subtitle && <span className="dim" style={{ fontWeight: 400, fontSize: 10.5 }}>{subtitle}</span>}
        <span className="spacer" />
        {actions}
        <button className="icon-btn icon-btn--sm" title="Cerrar panel" onClick={onClose}>✕</button>
      </header>
      <div className="side-panel__body">{children}</div>
    </aside>
  );
}
