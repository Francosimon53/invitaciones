import "../../panel.css";

export default function HostPanelLayout({ children }: { children: React.ReactNode }) {
  return <div className="admin-body">{children}</div>;
}
