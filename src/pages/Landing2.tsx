import Nav2 from '@/components/landing2/Nav2';
import Hero2 from '@/components/landing2/Hero2';
import PainSection from '@/components/landing2/PainSection';
import PhotoGallery from '@/components/landing2/PhotoGallery';
import HowItWorks from '@/components/landing2/HowItWorks';
import BenefitsSection from '@/components/landing2/BenefitsSection';
import AISimple from '@/components/landing2/AISimple';
import AutoSimple from '@/components/landing2/AutoSimple';
import BeforeAfter from '@/components/landing2/BeforeAfter';
import Testimonials from '@/components/landing2/Testimonials';
import PricingSimple from '@/components/landing2/PricingSimple';
import CTAStrong from '@/components/landing2/CTAStrong';
import FAQSection from '@/components/landing2/FAQSection';
import Footer2 from '@/components/landing2/Footer2';

export default function Landing2() {
  return (
    <div className="landing-page min-h-screen">
      <Nav2 />
      <Hero2 />
      <PainSection />
      <PhotoGallery />
      <HowItWorks />
      <BenefitsSection />
      <AISimple />
      <AutoSimple />
      <BeforeAfter />
      <Testimonials />
      <PricingSimple />
      <CTAStrong />
      <FAQSection />
      <Footer2 />
    </div>
  );
}
