const LIST = ["Email (SMTP / Resend)", "WhatsApp Business", "Google Workspace", "Calendar", "Payment providers", "Accounting platforms", "Social media", "Webhooks"];
export default function Integrations() {
  return <><h2>Integrations</h2><p><small>Nothing is shown as connected until a real adapter is built, configured and verified. No adapters exist yet, so every message AI employees draft stays a draft.</small></p>
    {LIST.map(n => <div key={n} className="k row"><b>{n}</b><small>Not configured · adapter not built</small></div>)}</>;
}
