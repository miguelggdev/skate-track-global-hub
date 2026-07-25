import LandingNav from '@/components/landing/LandingNav';
import HeroSection from '@/components/landing/HeroSection';
import StatsSection from '@/components/landing/StatsSection';
import FeaturesSection from '@/components/landing/FeaturesSection';
import AgentsSection from '@/components/landing/AgentsSection';
import AutomationsSection from '@/components/landing/AutomationsSection';
import DashboardPreview from '@/components/landing/DashboardPreview';
import PricingSection from '@/components/landing/PricingSection';
import CTASection from '@/components/landing/CTASection';
import Footer from '@/components/landing/Footer';

export default function Landing() {
  return (
    <div className="landing-page bg-[#020817] min-h-screen">
      <LandingNav />
      <HeroSection />
      <StatsSection />
      <FeaturesSection />
      <AgentsSection />
      <AutomationsSection />
      <DashboardPreview />
      <PricingSection />
      <CTASection />
      <Footer />
    </div>
  );
}
