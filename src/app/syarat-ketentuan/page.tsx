import type { Metadata } from "next";
import { LegalPage } from "@/components/legal/legal-page";
import { TERMS_SECTIONS } from "@/lib/legal-content";
import { UI } from "@/lib/ui-strings";

export const metadata: Metadata = { title: UI.legal.termsTitle };

export default function TermsPage() {
  return <LegalPage title={UI.legal.termsTitle} sections={TERMS_SECTIONS} />;
}
