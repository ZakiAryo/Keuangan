import { Landmark } from "lucide-react";
import { PinForm } from "@/components/pin-form";

export default function PinPage() {
  return (
    <main className="flex min-h-screen items-center justify-center px-5 py-12">
      <section className="panel w-full max-w-md overflow-hidden">
        <div className="border-b border-line bg-gradient-to-br from-accent/10 to-blue-500/5 px-7 py-8">
          <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-2xl border border-accent/20 bg-accent/10 text-accent">
            <Landmark size={24} />
          </div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.24em] text-accent">
            Private workspace
          </p>
          <h1 className="text-2xl font-semibold tracking-tight">
            Personal Finance Tracker
          </h1>
          <p className="mt-2 text-sm leading-6 text-muted">
            Masukkan PIN untuk membuka dashboard keuangan pribadi Anda.
          </p>
        </div>
        <PinForm />
      </section>
    </main>
  );
}
