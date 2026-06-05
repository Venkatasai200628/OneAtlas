import { Navbar } from "@/components/layouts/navbar";
import { Footer } from "@/components/layouts/footer";
import { HeroSection } from "@/components/features/hero-section";
import { HowItWorksSection } from "@/components/features/how-it-works";
import { FeaturesSection } from "@/components/features/features-section";
import { UseCasesSection } from "@/components/features/use-cases-section";
import { IntegrationsSection } from "@/components/features/integrations-section";
import { ComparisonSection } from "@/components/features/comparison-section";
import { ModelsSection } from "@/components/features/models-section";
import { PricingSection } from "@/components/features/pricing-section";
import { FAQSection } from "@/components/features/faq-section";
import { CTASection } from "@/components/features/cta-section";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-[#F5F5EE]">
      <Navbar />
      <HeroSection />
      <HowItWorksSection />
      <FeaturesSection />
      <UseCasesSection />
      <ModelsSection />
      <IntegrationsSection />
      <ComparisonSection />
      <PricingSection />
      <FAQSection />
      <CTASection />
      <Footer />
    </main>
  );
}
