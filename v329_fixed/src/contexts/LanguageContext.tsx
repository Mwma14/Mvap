import { createContext, useContext, useState, ReactNode } from 'react';

export type Language = 'en' | 'mm';

const translations = {
  en: {
    // Navigation
    home: 'Home',
    movies: 'Movies',
    series: 'Series',
    watchlist: 'Watchlist',
    profile: 'Profile',
    admin: 'Admin',
    search: 'Search',
    searchMovies: 'Search movies...',
    signIn: 'Sign In',
    signOut: 'Sign Out',
    
    // Auth
    login: 'Log In',
    loginTitle: 'Login to your account',
    loginSubtitle: 'Enter your Email and Password',
    email: 'Email',
    password: 'Password',
    emailPlaceholder: 'example@gmail.com',
    passwordPlaceholder: '********',
    createAccount: 'Create Account',
    signUp: 'Sign Up',
    or: 'Or',
    noAccount: "Don't have an account?",
    hasAccount: 'Already have an account?',
    signUpLink: 'Sign up',
    signInLink: 'Sign in',
    displayName: 'Display Name',
    yourName: 'Your name',
    backToHome: '← Back to Home',
    followUs: 'Follow us on',
    browseFirst: 'Browse First',
    loginRequired: 'Login Required',
    loginRequiredDesc: 'feature ကို အသုံးပြုရန် Login ဝင်ရန် (သို့) အကောင့်သစ်ဖွင့်ရန် လိုအပ်ပါသည်။',
    cancel: 'Cancel',
    registerNow: 'Register Now',
    
    // Home page
    entertainment: '🎬 Entertainment',
    trendingMovies: 'Trending Movies',
    trendingSeries: 'Trending Series',
    editorChoice: "Editor's Choice",
    movieRequest: 'Movie Request',
    allCategories: 'All Categories',
    continueWatching: 'Continue Watching',
    trendingThisWeek: '🔥 Trending This Week',
    myWatchlist: 'My Watchlist',
    recentlyAdded: 'Recently Added',
    seeAll: 'See all',
    
    // Premium
    premium: 'Premium',
    premiumContent: 'Premium Content',
    upgradeToPremium: 'Upgrade to Premium',
    renewPremium: 'Renew Premium',
    paymentAccounts: 'Payment Accounts',
    accountNumber: 'Account Number',
    uploadScreenshot: 'Upload Screenshot',
    tapToUpload: 'Tap to upload screenshot',
    transactionId: 'Transaction ID',
    transactionPlaceholder: 'Enter Transaction ID...',
    submitRenewal: 'Submit Renewal',
    
    // Profile
    myProfile: 'My Profile',
    accountInfo: 'Account Information',
    memberSince: 'Member Since',
    subscriptionStatus: 'Subscription Status',
    administrator: 'Administrator',
    premiumMember: 'Premium Member',
    freeUser: 'Free User',
    logout: 'Log Out',
    activeDevices: 'Active Devices',
    close: 'Close',
    
    // Footer
    allRightsReserved: 'All rights reserved.',
    version: 'Version',
    
    // Movie Details
    play: 'Play',
    favorite: 'Favorite',
    download: 'Download',
    storyline: 'Storyline',
    readMore: '...Read more',
    readLess: 'Show less',
    castAndActors: 'Cast & Actors',
    youMayAlsoLike: 'You May Also Like',
    chooseServer: 'Choose Server',
    choosePlayer: 'Choose Player',
    chooseDownloader: 'Choose Downloader',
    mainServer: 'Main Server',
    backServer: 'Back Server',
    backServer2: 'Back Server 2',
    allEpisodes: 'All Episodes',
    episode: 'Episode',
    complete: 'Complete',
    ongoing: 'Ongoing',
    episodes: 'Episodes',
    seasonsAndEpisodes: 'Seasons and Episodes',
    views: 'views',
    downloads: 'downloads',
    
    // Movie Request
    requestHistory: 'Request History',
    movieRequestTitle: 'Movie Request',
    chooseContentType: 'Choose content type',
    movieOrSeries: 'Movie or Series',
    enterMovieName: 'Enter the movie name you want to request',
    movieNamePlaceholder: 'e.g. Iron Man',
    dontRequestIfAvailable: "Don't request if it's already available in the app",
    next: 'Next',
    submit: 'Submit',
    requestSubmitted: 'Request Submitted',
    noRequestsYet: 'No requests yet',
    addRequest: 'Add Request',
    pending: 'Pending',
    approved: 'Approved',
    rejected: 'Rejected',
    
    // TV Channels
    tvChannels: 'TV Channels',
    searchChannels: 'Search channels or categories...',
    allTvChannels: 'All TV Channels',
    sportsChannels: 'Sports Channels',
    entertainmentChannels: 'Entertainment Channels',
    newsChannels: 'News Channels',
    noChannels: 'No channels available yet.',
    
    // General
    loading: 'Loading...',
    tryAgain: 'Try Again',
    refresh: 'Refresh',
    copied: 'Copied!',
    noMovies: 'No movies available yet. Check back soon!',
    noResults: 'No movies match your filters. Try adjusting your search.',
    downloadManager: 'Download Manager',
    noDownloads: 'No downloads yet',
    loginSuccess: 'Login Successful',
    browseMoviesBtn: 'Browse Movies',
    plan: 'Plan',
    expiresOn: 'Expires',
  },
  mm: {
    // Navigation
    home: 'ပင်မ',
    movies: 'ရုပ်ရှင်များ',
    series: 'စီးရီးများ',
    watchlist: 'ကြည့်မည်',
    profile: 'ပရိုဖိုင်',
    admin: 'အက်ဒ်မင်',
    search: 'ရှာဖွေ',
    searchMovies: 'ရုပ်ရှင်ရှာဖွေ...',
    signIn: 'ဝင်ရောက်',
    signOut: 'ထွက်ရန်',
    
    // Auth
    login: 'ဝင်ရောက်ရန်',
    loginTitle: 'သင့်အကောင့် Login ဝင်ပေးပါ',
    loginSubtitle: 'ဝယ်ယူထားတဲ့ Email , Password ရိုက်ထည့်ပေးပါ',
    email: 'Email',
    password: 'Password',
    emailPlaceholder: 'example@gmail.com',
    passwordPlaceholder: '********',
    createAccount: 'အကောင့်ဖွင့်ပါ',
    signUp: 'အကောင့်ဖွင့်ပါ',
    or: 'Or',
    noAccount: 'အကောင့်မရှိဘူးလား ?',
    hasAccount: 'အကောင့်ရှိဘူးလား ?',
    signUpLink: 'အကောင့်ဖွင့်ပါ',
    signInLink: 'ဝင်ရောက်ပါ',
    displayName: 'အမည်',
    yourName: 'သင့်အမည်',
    backToHome: '← ပင်မသို့',
    followUs: 'Follow us on',
    browseFirst: 'ဘာတွေရှိလဲကြည့်မယ်',
    loginRequired: 'Login Required',
    loginRequiredDesc: 'feature ကို အသုံးပြုရန် Login ဝင်ရန် (သို့) အကောင့်သစ်ဖွင့်ရန် လိုအပ်ပါသည်။',
    cancel: 'Cancel',
    registerNow: 'Register Now',
    
    // Home page
    entertainment: '🎬 Entertainment',
    trendingMovies: 'ခေတ်စားရုပ်ရှင်',
    trendingSeries: 'ခေတ်စားစီးရီး',
    editorChoice: "Editor's Choice",
    movieRequest: 'ရုပ်ရှင်တောင်းဆို',
    allCategories: 'အမျိုးအစားအားလုံး',
    continueWatching: 'ဆက်ကြည့်ရန်',
    trendingThisWeek: '🔥 ဒီအပတ်ခေတ်စား',
    myWatchlist: 'ကျွန်ုပ်၏ Watchlist',
    recentlyAdded: 'အသစ်ထည့်ထား',
    seeAll: 'အားလုံးကြည့်',
    
    // Premium
    premium: 'Premium',
    premiumContent: 'Premium ကွန်တန့်',
    upgradeToPremium: 'Premium အဆင့်မြှင့်ရန်',
    renewPremium: 'Premium သက်တမ်းတိုးရန်',
    paymentAccounts: 'ငွေလွှဲရန်အချက်အလက်များ',
    accountNumber: 'Account Number',
    uploadScreenshot: 'Screenshot ထည့်ပါ',
    tapToUpload: 'Tap to upload screenshot',
    transactionId: 'Transaction ID',
    transactionPlaceholder: 'ငွေလွှဲပြေစာမှ Transaction ID ကို...',
    submitRenewal: 'Submit Renewal',
    
    // Profile
    myProfile: 'ကျွန်ုပ်၏ ပရိုဖိုင်',
    accountInfo: 'အကောင့်အချက်အလက်',
    memberSince: 'အဖွဲ့ဝင်ဖြစ်သည်',
    subscriptionStatus: 'စာရင်းသွင်းမှုအခြေအနေ',
    administrator: 'အက်ဒ်မင်',
    premiumMember: 'Premium အဖွဲ့ဝင်',
    freeUser: 'အခမဲ့အသုံးပြုသူ',
    logout: 'ထွက်ရန်',
    activeDevices: 'Active Devices',
    close: 'ပိတ်ရန်',
    
    // Footer
    allRightsReserved: 'မူပိုင်ခွင့်ရယူထားသည်။',
    version: 'Version',
    
    // Movie Details
    play: 'Play',
    favorite: 'Favorite',
    download: 'Download',
    storyline: 'Storyline',
    readMore: '...Read more',
    readLess: 'Show less',
    castAndActors: 'Cast & Actors',
    youMayAlsoLike: 'You May Also Like',
    chooseServer: 'Server ရွေးချယ်ပါ',
    choosePlayer: 'Player ရွေးချယ်ပါ',
    chooseDownloader: 'Downloader ရွေးချယ်ပါ',
    mainServer: 'Main Server',
    backServer: 'Back Server',
    backServer2: 'Back Server 2',
    allEpisodes: 'All Episodes',
    episode: 'Episode',
    complete: 'Complete',
    ongoing: 'Ongoing',
    episodes: 'Episodes',
    seasonsAndEpisodes: 'Seasons and Episodes',
    views: 'ကြည့်ရှုမှု',
    downloads: 'ဒေါင်းလုဒ်',
    
    // Movie Request
    requestHistory: 'ဇာတ်ကားတောင်းဆိုရန်',
    movieRequestTitle: 'ဇာတ်ကားတောင်းဆိုရန်',
    chooseContentType: 'ဘာကြည့်ချင်တာလဲ ရွေးချယ်ပါ',
    movieOrSeries: 'ရုပ်ရှင် လား၊ ဇာတ်လမ်းတွဲ လား',
    enterMovieName: 'တောင်းချင်သော Movie Name ရေးပေးပါ',
    movieNamePlaceholder: 'ဥပမာ - Iron Man',
    dontRequestIfAvailable: 'မတောင်းခင် App ထဲကြည့်ပေးပါ မရှိမှတောင်းပေးပါ',
    next: 'Next',
    submit: 'Submit',
    requestSubmitted: 'တောင်းဆိုမှု ပို့ပြီးပါပြီ',
    noRequestsYet: 'တောင်းဆိုထားသော ဇာတ်လမ်းများ မရှိသေးပါ',
    addRequest: 'ဇာတ်ကား တောင်းဆိုရန်',
    pending: 'စောင့်ဆိုင်းနေ',
    approved: 'အတည်ပြုပြီး',
    rejected: 'ငြင်းပယ်ပြီး',
    
    // TV Channels
    tvChannels: 'TV Channels',
    searchChannels: 'ချန်နယ် ရှာဖွေ...',
    allTvChannels: 'TV Channels အားလုံး',
    sportsChannels: 'Sports Channels',
    entertainmentChannels: 'Entertainment Channels',
    newsChannels: 'News Channels',
    noChannels: 'ချန်နယ်များ မရှိသေးပါ',
    
    // General
    loading: 'ခဏစောင့်ပါ...',
    tryAgain: 'ထပ်ကြိုးစား',
    refresh: 'ပြန်လည်ခေါ်ယူ',
    copied: 'ကူးယူပြီး!',
    noMovies: 'ရုပ်ရှင်များမရှိသေးပါ။ နောက်မှပြန်စစ်ကြည့်ပါ!',
    noResults: 'ရှာဖွေမှုနှင့်ကိုက်ညီသောရုပ်ရှင်မရှိပါ။',
    downloadManager: 'Download Manager',
    noDownloads: 'ဒေါင်းလုဒ်များ မရှိသေးပါ',
    loginSuccess: 'Login Successful',
    browseMoviesBtn: 'ရုပ်ရှင်ကြည့်မယ်',
    plan: 'Plan',
    expiresOn: 'သက်တမ်း',
  },
} as const;

export type TranslationKey = keyof typeof translations.en;

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: TranslationKey) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>(() => {
    const saved = localStorage.getItem('app-language');
    if (saved === 'en' || saved === 'mm') return saved;
    return 'mm';
  });

  const handleSetLanguage = (lang: Language) => {
    setLanguage(lang);
    localStorage.setItem('app-language', lang);
  };

  const t = (key: TranslationKey): string => {
    return translations[language][key] || translations.en[key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage: handleSetLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
