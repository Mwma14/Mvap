import { useNavigate } from 'react-router-dom';
import { Film, Tv, Star, TrendingUp, Award, UserCheck, MousePointerClick, Clapperboard, Sparkles, Popcorn, Radio, Trophy, CalendarDays, MessageCircleQuestion, Package, Download, Headphones } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

interface CategoryItem {
  icon: React.ReactNode;
  labelEn: string;
  labelMm: string;
  filter?: string;
  path?: string;
  color: string;
}

interface CategorySection {
  titleEn: string;
  titleMm: string;
  emoji: string;
  items: CategoryItem[];
}

const categorySections: CategorySection[] = [
  {
    titleEn: 'Entertainment',
    titleMm: 'Entertainment',
    emoji: '🎬',
    items: [
      {
        icon: <Popcorn className="w-8 h-8" />,
        labelEn: 'Movies',
        labelMm: 'ရုပ်ရှင်',
        filter: 'movie',
        color: 'text-rose-500',
      },
      {
        icon: <Tv className="w-8 h-8" />,
        labelEn: 'Series',
        labelMm: 'စီးရီး',
        filter: 'series',
        color: 'text-blue-500',
      },
      {
        icon: <Clapperboard className="w-8 h-8" />,
        labelEn: 'K-Drama',
        labelMm: 'K-Drama',
        filter: 'K-Drama',
        color: 'text-purple-500',
      },
      {
        icon: <Star className="w-8 h-8" />,
        labelEn: 'Trending Movies',
        labelMm: 'ခေတ်စား ရုပ်ရှင်',
        filter: 'trending',
        color: 'text-amber-500',
      },
      {
        icon: <TrendingUp className="w-8 h-8" />,
        labelEn: 'Trending Series',
        labelMm: 'ခေတ်စား စီးရီး',
        filter: 'trending-series',
        color: 'text-orange-500',
      },
      {
        icon: <Award className="w-8 h-8" />,
        labelEn: 'Hollywood',
        labelMm: 'Hollywood',
        filter: 'Hollywood',
        color: 'text-yellow-600',
      },
      {
        icon: <UserCheck className="w-8 h-8" />,
        labelEn: 'Action',
        labelMm: 'Action',
        filter: 'Action',
        color: 'text-red-500',
      },
      {
        icon: <Sparkles className="w-8 h-8" />,
        labelEn: "Editor's Choice",
        labelMm: "Editor's Choice",
        filter: 'featured',
        color: 'text-pink-500',
      },
      {
        icon: <Film className="w-8 h-8" />,
        labelEn: 'Comedy',
        labelMm: 'Comedy',
        filter: 'Comedy',
        color: 'text-green-500',
      },
      {
        icon: <Radio className="w-8 h-8" />,
        labelEn: 'TV Channels',
        labelMm: 'TV Channels',
        path: '/tv-channels',
        color: 'text-cyan-500',
      },
      {
        icon: <MousePointerClick className="w-8 h-8" />,
        labelEn: 'Movie Request',
        labelMm: 'ရုပ်ရှင်တောင်းဆို',
        path: '/request',
        color: 'text-yellow-500',
      },
    ],
  },
  {
    titleEn: 'Football',
    titleMm: 'ဘောလုံး',
    emoji: '⚽',
    items: [
      {
        icon: <Trophy className="w-8 h-8" />,
        labelEn: 'Football Replay',
        labelMm: 'ဘောလုံးပြန်ကြည့်',
        path: '/football',
        color: 'text-emerald-500',
      },
      {
        icon: <CalendarDays className="w-8 h-8" />,
        labelEn: 'Highlight',
        labelMm: 'Highlight',
        path: '/football-highlights',
        color: 'text-orange-500',
      },
    ],
  },
  {
    titleEn: 'User Interaction',
    titleMm: 'User Interaction',
    emoji: '🧑‍💻',
    items: [
      {
        icon: <MessageCircleQuestion className="w-8 h-8" />,
        labelEn: 'Ask AI',
        labelMm: 'AI ကိုမေးမယ်',
        path: '/ask-ai',
        color: 'text-violet-500',
      },
      {
        icon: <Package className="w-8 h-8" />,
        labelEn: 'Mystery Box',
        labelMm: 'Mystery Box',
        filter: 'mystery',
        color: 'text-amber-600',
      },
      {
        icon: <Download className="w-8 h-8" />,
        labelEn: 'Download Manager',
        labelMm: 'Download Manager',
        path: '/downloads',
        color: 'text-blue-600',
      },
      {
        icon: <Headphones className="w-8 h-8" />,
        labelEn: 'AI Support',
        labelMm: 'AI Support',
        path: '/support',
        color: 'text-teal-500',
      },
    ],
  },
];

export function CategoryGrid() {
  const navigate = useNavigate();
  const { language } = useLanguage();

  const handleClick = (item: CategoryItem) => {
    if (item.path) {
      navigate(item.path);
    } else if (item.filter) {
      navigate(`/browse/${item.filter}`);
    }
  };

  return (
    <div className="py-4 px-4 md:px-8 space-y-8">
      {categorySections.map((section) => (
        <section key={section.titleEn}>
          <h2 className="text-xl font-bold text-foreground mb-5 flex items-center gap-2">
            {section.emoji} {language === 'mm' ? section.titleMm : section.titleEn}
          </h2>
          <div className="grid grid-cols-4 sm:grid-cols-5 lg:grid-cols-6 gap-4 md:gap-6">
            {section.items.map((item) => (
              <button
                key={item.labelEn}
                onClick={() => handleClick(item)}
                className="flex flex-col items-center gap-2 group transition-transform hover:scale-105"
              >
                <div className={`w-14 h-14 md:w-16 md:h-16 rounded-2xl bg-card border border-border flex items-center justify-center transition-all group-hover:shadow-md group-hover:border-primary/30 ${item.color}`}>
                  {item.icon}
                </div>
                <span className="text-xs md:text-sm font-medium text-foreground text-center leading-tight">
                  {language === 'mm' ? item.labelMm : item.labelEn}
                </span>
              </button>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
