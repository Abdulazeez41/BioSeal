import Link from "next/link";
import { PrimaryButton } from "@/components/ui/Buttons";
import { ShieldAlert } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center px-4 text-center">
      <div className="w-14 h-14 rounded-full bg-cream-100 flex items-center justify-center mb-6 border border-border">
        <ShieldAlert className="w-6 h-6 text-ink-muted" />
      </div>
      <span className="text-[12px] font-mono uppercase tracking-wider text-ink-muted mb-2">
        404 — Record Not Found
      </span>
      <h1 className="text-3xl font-heading font-semibold text-ink tracking-tight mb-3">
        Page does not exist
      </h1>
      <p className="text-[15px] text-ink-muted max-w-md mb-8">
        The escrow, verification record, or resource you are looking for does not exist or has been archived.
      </p>
      <Link href="/">
        <PrimaryButton>Return to BioSeal home</PrimaryButton>
      </Link>
    </div>
  );
}
