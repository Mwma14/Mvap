import { useNavigate } from 'react-router-dom';
import { useMovieCast } from '@/hooks/useCast';
import { useLanguage } from '@/contexts/LanguageContext';

interface CastSectionProps {
  movieId: string;
  fallbackActors?: string[];
}

export function CastSection({ movieId, fallbackActors }: CastSectionProps) {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { data: castData, isLoading } = useMovieCast(movieId);

  // Use new cast system if data exists, otherwise fall back to old actors array
  const hasNewCast = castData && castData.length > 0;

  if (isLoading) {
    return (
      <div className="px-4 mb-6">
        <h2 className="text-xl font-bold text-foreground mb-4">{t('castAndActors')}</h2>
        <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-2">
          {[1, 2, 3].map(i => (
            <div key={i} className="flex flex-col items-center min-w-[100px]">
              <div className="w-20 h-20 rounded-full bg-muted animate-pulse mb-2" />
              <div className="h-3 w-16 bg-muted rounded animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (hasNewCast) {
    return (
      <div className="px-4 mb-6">
        <h2 className="text-xl font-bold text-foreground mb-4">{t('castAndActors')}</h2>
        <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-2">
          {castData.map((entry) => (
            <div
              key={entry.id}
              className="flex flex-col items-center min-w-[100px] cursor-pointer"
              onClick={() => navigate(`/actor/${entry.cast_member_id}`)}
            >
              <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-2 overflow-hidden border-2 border-transparent hover:border-primary transition-colors">
                {entry.cast_member?.photo_url ? (
                  <img
                    src={entry.cast_member.photo_url}
                    alt={entry.cast_member.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-2xl font-bold text-muted-foreground">
                    {entry.cast_member?.name?.charAt(0).toUpperCase()}
                  </span>
                )}
              </div>
              <span className="text-sm font-semibold text-foreground text-center leading-tight">
                {entry.cast_member?.name}
              </span>
              {entry.character_name && (
                <span className="text-xs text-muted-foreground text-center leading-tight mt-0.5">
                  {entry.character_name}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Fallback to old actors array
  if (!fallbackActors || fallbackActors.length === 0) return null;

  return (
    <div className="px-4 mb-6">
      <h2 className="text-xl font-bold text-foreground mb-4">{t('castAndActors')}</h2>
      <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-2">
        {fallbackActors.map((actor, index) => (
          <div key={index} className="flex flex-col items-center min-w-[100px]">
            <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-2 overflow-hidden">
              <span className="text-2xl font-bold text-muted-foreground">
                {actor.charAt(0).toUpperCase()}
              </span>
            </div>
            <span className="text-sm font-semibold text-foreground text-center leading-tight">
              {actor}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
