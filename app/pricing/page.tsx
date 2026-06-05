import { Navbar } from "@/components/layouts/navbar";
import { Footer } from "@/components/layouts/footer";
import { PricingSection } from "@/components/features/pricing-section";
import { FAQSection } from "@/components/features/faq-section";
import { CTASection } from "@/components/features/cta-section";

export default function PricingPage() {
  return (
    <main className="min-h-screen bg-[#F5F5EE]">
      <Navbar />
      <div className="pt-24">
        <PricingSection />
        <FAQSection />
        <CTASection />
      </div>
      <Footer />
    </main>
  );
}
