import Image from "next/image";
import { STORE_DETAILS } from "@/lib/storeDetails";

export default function AppLoaderOverlay() {
  return (
    <div className="app-loader-overlay" role="status" aria-live="polite" aria-label="Loading page">
      <div className="app-loader-panel">
        <div className="app-loader-logo-shell">
          <Image
            src="/images/st-micheals-logo.png"
            alt={STORE_DETAILS.displayName}
            width={88}
            height={88}
            className="app-loader-logo"
            priority
          />
        </div>
        <p className="app-loader-title">{STORE_DETAILS.displayName}</p>
        <p className="app-loader-copy">Preparing your experience...</p>
        <div className="app-loader-progress" aria-hidden="true">
          <span />
        </div>
      </div>
    </div>
  );
}