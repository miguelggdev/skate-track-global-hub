import React from 'react';
import { Button } from '@/components/ui/button';
import { 
  Instagram, 
  Facebook, 
  Phone, 
  Mail, 
  MessageCircle,
  Youtube,
  Twitter
} from 'lucide-react';
import { AthleteSocials } from '@/hooks/useAthleteSocials';

// TikTok icon component
const TikTokIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
  </svg>
);

interface AthleteSocialLinksProps {
  socials: AthleteSocials | null;
  email?: string | null;
  phone?: string | null;
}

const AthleteSocialLinks: React.FC<AthleteSocialLinksProps> = ({ socials, email, phone }) => {
  const links = [
    {
      key: 'instagram',
      value: socials?.instagram,
      icon: Instagram,
      color: 'hover:bg-pink-500/10 hover:text-pink-500',
      href: (v: string) => v.startsWith('http') ? v : `https://instagram.com/${v.replace('@', '')}`
    },
    {
      key: 'facebook',
      value: socials?.facebook,
      icon: Facebook,
      color: 'hover:bg-blue-600/10 hover:text-blue-600',
      href: (v: string) => v.startsWith('http') ? v : `https://facebook.com/${v}`
    },
    {
      key: 'tiktok',
      value: socials?.tiktok,
      icon: TikTokIcon,
      color: 'hover:bg-foreground/10',
      href: (v: string) => v.startsWith('http') ? v : `https://tiktok.com/@${v.replace('@', '')}`
    },
    {
      key: 'youtube',
      value: socials?.youtube,
      icon: Youtube,
      color: 'hover:bg-red-500/10 hover:text-red-500',
      href: (v: string) => v.startsWith('http') ? v : `https://youtube.com/@${v.replace('@', '')}`
    },
    {
      key: 'twitter',
      value: socials?.twitter,
      icon: Twitter,
      color: 'hover:bg-sky-500/10 hover:text-sky-500',
      href: (v: string) => v.startsWith('http') ? v : `https://twitter.com/${v.replace('@', '')}`
    },
    {
      key: 'whatsapp',
      value: socials?.whatsapp || phone,
      icon: MessageCircle,
      color: 'hover:bg-green-500/10 hover:text-green-500',
      href: (v: string) => `https://wa.me/${v.replace(/\D/g, '')}`
    },
    {
      key: 'email',
      value: email,
      icon: Mail,
      color: 'hover:bg-primary/10 hover:text-primary',
      href: (v: string) => `mailto:${v}`
    },
    {
      key: 'phone',
      value: phone,
      icon: Phone,
      color: 'hover:bg-primary/10 hover:text-primary',
      href: (v: string) => `tel:${v}`
    }
  ];

  const activeLinks = links.filter(l => l.value);

  if (activeLinks.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2">
      {activeLinks.map(({ key, value, icon: Icon, color, href }) => (
        <Button
          key={key}
          variant="ghost"
          size="icon"
          className={`h-9 w-9 rounded-full transition-colors ${color}`}
          asChild
        >
          <a href={href(value!)} target="_blank" rel="noopener noreferrer">
            <Icon className="h-4 w-4" />
          </a>
        </Button>
      ))}
    </div>
  );
};

export default AthleteSocialLinks;
