export interface SponsorItem {
  id: string;
  name: string;
  banglaName?: string;
  tagline: string;
  logoUrl: string;
  tier: string;
  badgeBg: string;
  badgeText: string;
  glowBorder: string;
  shadowColor: string;
  accentColor: string;
}

export const SPONSORS: SponsorItem[] = [
  {
    id: 'zainmahal',
    name: 'ZAINMAHAL',
    banglaName: 'জাইনমহল',
    tagline: 'Royal Elegance & Modest Collection',
    logoUrl: '/sponsors/zain-mahal.png',
    tier: 'Platinum Sponsor',
    badgeBg: 'bg-rose-950/80 border-rose-500/40',
    badgeText: 'text-rose-300',
    glowBorder: 'hover:border-[#7A162B] hover:shadow-[#7A162B]/30',
    shadowColor: 'from-[#7A162B]/10',
    accentColor: '#7A162B',
  },
  {
    id: 'kholzis-treasure',
    name: "KHOLZI'S TREASURE",
    banglaName: "খলজি'স ট্রেজার",
    tagline: 'Eminence of Tradition',
    logoUrl: '/sponsors/kholzis-treasure.png',
    tier: 'Gold Sponsor',
    badgeBg: 'bg-amber-950/80 border-amber-500/40',
    badgeText: 'text-amber-300',
    glowBorder: 'hover:border-[#F5BA13] hover:shadow-[#F5BA13]/30',
    shadowColor: 'from-[#F5BA13]/10',
    accentColor: '#F5BA13',
  },
  {
    id: 'shilpaholic',
    name: 'SHILPAHOLIC',
    banglaName: 'শিল্পাহলিক',
    tagline: 'Painting Life',
    logoUrl: '/sponsors/shilpaholic.png',
    tier: 'Gold Sponsor',
    badgeBg: 'bg-emerald-950/80 border-emerald-500/40',
    badgeText: 'text-emerald-300',
    glowBorder: 'hover:border-[#388E3C] hover:shadow-[#388E3C]/30',
    shadowColor: 'from-[#388E3C]/10',
    accentColor: '#388E3C',
  },
  {
    id: 'chumuk',
    name: 'চুমুক (CHUMUK)',
    banglaName: 'চুমুক',
    tagline: 'চুমুকেই প্রশান্তি...',
    logoUrl: '/sponsors/chumuk.png',
    tier: 'Refreshment Partner',
    badgeBg: 'bg-sky-950/80 border-sky-500/40',
    badgeText: 'text-sky-300',
    glowBorder: 'hover:border-[#18B4E7] hover:shadow-[#18B4E7]/30',
    shadowColor: 'from-[#18B4E7]/10',
    accentColor: '#18B4E7',
  },
];
