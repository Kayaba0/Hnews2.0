import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { it, enUS } from 'date-fns/locale';
import { Calendar, Wrench } from 'lucide-react';
import { Anime, useStore } from '@/lib/data';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface AnimeCardProps {
  anime: Anime;
  onClick: () => void;
  onEdit?: () => void;
  compact?: boolean;
}

export function AnimeCard({ anime, onClick, onEdit, compact }: AnimeCardProps) {
  const { language } = useStore();
  
  return (
    <motion.div
      whileHover={{ y: -5, scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className="group relative cursor-pointer"
    >
      <div className="relative aspect-[3/4] overflow-hidden rounded-2xl bg-card border border-white/5 shadow-lg" onClick={onClick}>
        <img 
          src={anime.coverImage} 
          alt={anime.title} 
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
        />
        
        {/* Gradient Overlay */}
        <div className="absolute -inset-8 bg-gradient-to-t from-black via-black/40 to-transparent opacity-95 transition-opacity duration-300 group-hover:opacity-100" />
        
        {/* Content */}
        <div className="absolute bottom-0 left-0 right-0 p-4">
          <Badge variant="outline" className="mb-2 border-primary/50 text-primary bg-primary/10 backdrop-blur-md rounded-lg">
            {anime.studio}
          </Badge>
          
          <h3 className="font-display text-lg font-bold leading-tight text-white mb-2 line-clamp-1">
            {anime.title}
          </h3>
          
          <div className="flex flex-wrap gap-1 items-center">
            {anime.genre.map(g => (
              <span 
                key={g} 
                className="text-[8px] uppercase tracking-wider text-white/90 bg-white/10 backdrop-blur-md px-1.5 py-0.5 rounded border border-white/10 shadow-sm"
              >
                {g}
              </span>
            ))}
          </div>
        </div>

        {/* Floating Release Day Badge (Top Right) */}
        {!compact && (
          <div className="absolute top-3 right-3 flex flex-col items-center justify-center rounded-xl bg-background/40 backdrop-blur-md border border-white/10 p-2 min-w-[50px]">
            <span className="text-xs font-medium uppercase text-muted-foreground">
               {format(new Date(anime.releaseDate), 'MMM', { locale: language === 'it' ? it : enUS })}
            </span>
            <span className="text-xl font-bold text-secondary">
               {format(new Date(anime.releaseDate), 'dd')}
            </span>
          </div>
        )}
      </div>
      {onEdit && (
        <Button
          size="icon"
          variant="secondary"
          className="absolute top-3 left-3 size-10 rounded-xl bg-white/10 backdrop-blur-md border border-white/10 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white/20"
          onClick={(e) => {
            e.stopPropagation();
            onEdit();
          }}
        >
          <Wrench className="size-5 text-white" />
        </Button>
      )}
    </motion.div>
  );
}
