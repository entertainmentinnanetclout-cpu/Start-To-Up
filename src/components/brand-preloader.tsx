import { useEffect, useState } from "react";

export function BrandPreloader() {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    if (window.sessionStorage.getItem("start-to-up-intro-seen")) {
      setVisible(false);
      return;
    }
    window.sessionStorage.setItem("start-to-up-intro-seen", "true");
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const delay = reducedMotion ? 120 : 1450;
    const timer = window.setTimeout(() => setVisible(false), delay);
    return () => window.clearTimeout(timer);
  }, []);

  if (!visible) return null;
  return (
    <div className="brand-preloader" role="status" aria-label="Loading Start To Up">
      <div className="preloader-aura" />
      <img src="/brand/start-to-up-symbol.png" alt="" />
      <div className="preloader-wordmark">
        <strong>START TO UP</strong>
        <span>CONNECT · BUILD · LAUNCH · UPSCALE</span>
      </div>
      <div className="preloader-line">
        <i />
      </div>
    </div>
  );
}
