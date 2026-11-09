import "./globals.css";
export const metadata = { title: "Verath Business Manager" };
const init = `try{document.documentElement.dataset.theme=localStorage.getItem("vbm-theme")||"dark"}catch(e){document.documentElement.dataset.theme="dark"}`;
export default function L({ children }: { children: React.ReactNode }) {
  return <html lang="en" suppressHydrationWarning><head><script dangerouslySetInnerHTML={{ __html: init }} /></head><body>{children}</body></html>;
}
