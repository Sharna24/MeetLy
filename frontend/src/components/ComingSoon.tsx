import { NavItem } from '../routes/navItems';

// A temporary page. Replace it with the real page when you build that feature.
export default function ComingSoon({ item }: { item: NavItem }) {
  return (
    <div className="panel center">
      <div className="big-emoji">{item.icon}</div>
      <h1>{item.label}</h1>
      <p>{item.description}</p>
      <p className="muted small">Coming soon (plan feature {item.features})</p>
    </div>
  );
}