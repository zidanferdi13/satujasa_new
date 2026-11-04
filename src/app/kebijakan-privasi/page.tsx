import type { Metadata } from "next";
import { LegalPage } from "@/components/legal/legal-page";
import { PRIVACY_SECTIONS } from "@/lib/legal-content";
import { UI } from "@/lib/ui-strings";

export const metadata: Metadata = { title: UI.legal.privacyTitle };

/**
 * Public while the demo runs on the build machine. "Published" means reachable at a domain on the
 * client's VPS, and the backup gate is enforced there: deployment waits if item 7 is still open.
 */
export default function PrivacyPage() {
  return <LegalPage title={UI.legal.privacyTitle} sections={PRIVACY_SECTIONS} />;
}
