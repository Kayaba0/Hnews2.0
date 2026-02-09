import { useState, useEffect } from 'react';
import { Anime, useStore } from '@/lib/data';
import { format, parseISO, getYear } from 'date-fns';
import { it, enUS } from 'date-fns/locale';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { X, Calendar, Building2, Layers, ChevronLeft, ChevronRight, Maximize2, Tv, Video, ChevronDown, ChevronUp, Wrench } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { motion, AnimatePresence } from 'framer-motion';
import { Dialog, DialogContent } from '@/components/ui/dialog';

interface AnimeDetailProps {
  anime: Anime | null;
  onClose: () => void;
  onQuickFilter: (type: 'studio' | 'genre' | 'year', value: string) => void;
  onEdit?: (anime: Anime) => void;
}

export function AnimeDetail({ anime, onClose, onQuickFilter, onEdit }: AnimeDetailProps) {
  const { language, animes, upcomingEpisodes, isAdmin } = useStore();
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
  
  const animeData = anime as any;
  const isEpisode = animeData?.isEpisode;
  const parentId = animeData?.parentId;
  
  // Find the latest episode data from the store to ensure we have the most recent edits
  const currentEpisode = isEpisode ? upcomingEpisodes.find(e => e.id === animeData.episodeId) : null;
  const displayEpisodeNumber = currentEpisode ? currentEpisode.episodeNumber : animeData.episodeNumber;

  const parentAnime = parentId ? animes.find(a => a.id === parentId) : null;

  useEffect(() => {
    if (anime) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [anime]);
  
  useEffect(() => {
  if (lightboxIndex === null) return;

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'ArrowRight') nextImage();
    if (e.key === 'ArrowLeft') prevImage();
    if (e.key === 'Escape') setLightboxIndex(null);
  };

  window.addEventListener('keydown', handleKeyDown);
  return () => window.removeEventListener('keydown', handleKeyDown);
}, [lightboxIndex]);


  if (!anime) return null;

  const galleryImages = [
    ...anime.gallery
  ];

  const nextImage = () => {
    if (lightboxIndex === null) return;
    setLightboxIndex((lightboxIndex + 1) % galleryImages.length);
  };

  const prevImage = () => {
    if (lightboxIndex === null) return;
    setLightboxIndex((lightboxIndex - 1 + galleryImages.length) % galleryImages.length);
  };

  const handleQuickFilterWithNavigation = (type: 'studio' | 'genre' | 'year', value: string) => {
    onQuickFilter(type, value);
    onClose();
    // Find and click the collection tab button
    const collectionBtn = Array.from(document.querySelectorAll('button')).find(
      b => b.textContent?.includes('Raccolta') || b.textContent?.includes('Collection')
    );
    if (collectionBtn) {
      (collectionBtn as HTMLElement).click();
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="flex flex-col md:flex-row h-full overflow-hidden md:overflow-visible">
      {/* Left Column: Sidebar with Image and Info */}
      <div className="w-full md:w-[30%] h-full flex flex-col p-6 space-y-6 bg-black/40 backdrop-blur-xl border-r border-white/5">
        <div className="relative aspect-[3/4] rounded-[2rem] overflow-hidden shadow-2xl border border-white/10 group">
          <img 
            src={anime.coverImage} 
            alt={anime.title} 
            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        </div>

        <div className="space-y-4">
          <div 
            className="flex items-center gap-3 p-4 rounded-2xl bg-white/5 border border-white/5 cursor-pointer group hover:bg-white/10 transition-all"
            onClick={() => handleQuickFilterWithNavigation('studio', anime.studio)}
          >
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              <Building2 className="size-5" />
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] text-muted-foreground uppercase tracking-widest">Studio</span>
              <span className="font-bold text-sm leading-tight">{anime.studio}</span>
            </div>
          </div>

          <div className="flex items-center gap-3 p-4 rounded-2xl bg-white/5 border border-white/5">
            <div className="p-2 rounded-lg bg-secondary/10 text-secondary">
              <Tv className="size-5" />
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] text-muted-foreground uppercase tracking-widest">{language === 'it' ? 'Episodio' : 'Episode'}</span>
              <span className="font-bold text-sm leading-tight">
                {isEpisode ? (displayEpisodeNumber || 'TBA') : (anime.episodes || 'TBA')}
              </span>
            </div>
          </div>

          <div className="space-y-3 pt-2">
            <div 
              className="flex items-center gap-2 cursor-pointer group w-fit"
              onClick={() => setIsDescriptionExpanded(!isDescriptionExpanded)}
            >
              <h3 className="text-sm font-bold flex items-center gap-2 text-primary/80 group-hover:text-primary transition-colors uppercase tracking-widest">
                 <Layers className="size-4" />
                 {language === 'it' ? 'Trama' : 'Plot'}
              </h3>
              <div className="p-1 text-primary group-hover:bg-white/5 transition-colors rounded-full">
                {isDescriptionExpanded ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
              </div>
            </div>
            <AnimatePresence>
              {isDescriptionExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <p className="text-muted-foreground leading-relaxed text-sm font-light">
                    {anime.description}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Right Column: Main Content */}
      <div className="flex-1 flex flex-col min-w-0 bg-background/60 backdrop-blur-md h-full overflow-hidden relative">
        <div className="absolute top-6 right-6 z-50 flex items-center gap-2">
          {isAdmin && onEdit && (
            <Button 
              size="icon" 
              variant="ghost" 
              className="rounded-full bg-white/5 hover:bg-white/10 text-white h-10 w-10 border border-white/10"
              onClick={() => anime && onEdit(anime)}
            >
              <Wrench className="size-5" />
            </Button>
          )}
          <Button 
            size="icon" 
            variant="ghost" 
            className="rounded-full bg-white/5 hover:bg-white/10 text-white h-10 w-10 border border-white/10"
            onClick={onClose}
          >
            <X className="size-5" />
          </Button>
        </div>

        <ScrollArea className="flex-1 h-full">
          <div className="p-8 lg:p-12 space-y-8">
            <div className="space-y-4">
              <h2 className="text-4xl lg:text-5xl font-display font-bold text-white leading-tight">
                {isEpisode && parentAnime ? `${parentAnime.title} - Episodio ${displayEpisodeNumber}` : anime.title}
              </h2>
              
              <div className="flex flex-wrap gap-2 items-center">
                <Badge 
                  variant="secondary" 
                  className="rounded-lg px-4 py-1.5 bg-secondary/10 text-secondary hover:bg-secondary/20 transition-all cursor-pointer border border-secondary/20 text-xs font-bold"
                  onClick={() => handleQuickFilterWithNavigation('year', new Date(anime.releaseDate).getFullYear().toString())}
                >
                  {isEpisode ? (
                    format(parseISO(anime.releaseDate), 'dd MMMM yyyy', { locale: language === 'it' ? it : enUS })
                  ) : (
                    new Date(anime.releaseDate).getFullYear()
                  )}
                </Badge>
              </div>

              <div className="flex flex-wrap gap-2">
                {anime.genre.map(g => (
                  <Badge 
                    key={g} 
                    variant="secondary" 
                    className="rounded-lg px-4 py-1.5 bg-white/5 hover:bg-primary/20 hover:text-primary transition-all cursor-pointer border-transparent text-xs font-medium"
                    onClick={() => handleQuickFilterWithNavigation('genre', g)}
                  >
                    {g}
                  </Badge>
                ))}
              </div>
            </div>

            {animeData.trailerUrl && (
              <div className="space-y-4 pt-2">
                <h3 className="text-sm font-bold flex items-center gap-2 text-muted-foreground uppercase tracking-widest">
                  <Video className="size-4 text-primary" />
                  Trailer
                </h3>
                <div className="relative aspect-video rounded-3xl overflow-hidden border border-white/10 bg-black shadow-2xl group">
                  {animeData.trailerUrl.includes('drive.google.com') ? (
                    <iframe
                      src={animeData.trailerUrl.replace('/view?usp=drive_link', '/preview').replace('/file/d/', '/file/d/').split('?')[0] + '/preview'}
                      className="w-full h-full border-none"
                      allow="autoplay"
                      allowFullScreen
                    ></iframe>
                  ) : (
                    <video 
                      src={animeData.trailerUrl} 
                      controls 
                      className="w-full h-full object-contain"
                    />
                  )}
                </div>
              </div>
            )}

            <div className="space-y-6 pt-4">
              <h3 className="text-xl font-bold font-display">{language === 'it' ? 'Galleria' : 'Gallery'}</h3>
              <div className="grid grid-cols-4 gap-4">
                {galleryImages.map((img, idx) => (
                  <motion.div 
                    key={idx} 
                    whileHover={{ scale: 1.02 }}
                    className="relative aspect-video rounded-2xl overflow-hidden cursor-pointer group bg-black/50 border border-white/5 shadow-lg"
                    onClick={() => setLightboxIndex(idx)}
                  >
                    <img 
                      src={img} 
                      className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110" 
                    />
                    <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                      <Maximize2 className="size-5 text-white" />
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </ScrollArea>
      </div>

      {/* Lightbox Modal */}
      <Dialog open={lightboxIndex !== null} onOpenChange={() => setLightboxIndex(null)}>
        <DialogContent className="max-w-[95vw] max-h-[95vh] p-0 border-none bg-black/95 backdrop-blur-2xl flex items-center justify-center overflow-hidden">
		<Button
			variant="ghost"
			size="icon"
			className="absolute top-6 right-6 z-50 rounded-full bg-white/10 text-white hover:bg-white/20 h-10 w-10"
			onClick={() => setLightboxIndex(null)}
		>
		<X className="size-5" />
		</Button>

          {lightboxIndex !== null && (
            <div className="w-full h-full flex flex-col items-center justify-center gap-4 p-4 md:p-6">
  {/* IMMAGINE */}
  <div className="relative flex items-center justify-center max-h-[80vh] w-full">
    <AnimatePresence mode="wait">
      <motion.img
        key={lightboxIndex}
        initial={{ opacity: 0, x: 100 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -100 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        src={galleryImages[lightboxIndex]}
        className="max-h-[80vh] max-w-[92vw] object-contain rounded-2xl shadow-2xl"
      />
    </AnimatePresence>

    {/* Frecce */}
    <Button
      variant="ghost"
      size="icon"
      className="absolute left-0 md:-left-16 rounded-full bg-white/10 text-white hover:bg-white/20 hidden md:flex"
      onClick={(e) => { e.stopPropagation(); prevImage(); }}
    >
      <ChevronLeft className="size-10" />
    </Button>

    <Button
      variant="ghost"
      size="icon"
      className="absolute right-0 md:-right-16 rounded-full bg-white/10 text-white hover:bg-white/20 hidden md:flex"
      onClick={(e) => { e.stopPropagation(); nextImage(); }}
    >
      <ChevronRight className="size-10" />
    </Button>
  </div>

  {/* THUMBNAIL SOTTO */}
  <div className="flex gap-2 px-4 py-2 bg-black/60 rounded-xl backdrop-blur-md overflow-x-auto max-w-full">
    {galleryImages.map((img, idx) => (
      <button
        key={idx}
        onClick={() => setLightboxIndex(idx)}
        className={`h-14 w-24 flex-shrink-0 overflow-hidden rounded-lg border transition
          ${idx === lightboxIndex
            ? 'border-primary'
            : 'border-white/20 opacity-60 hover:opacity-100'}
        `}
      >
        <img src={img} className="h-full w-full object-cover" />
      </button>
    ))}
  </div>

  {/* CONTATORE */}
  <div className="text-white bg-black/60 backdrop-blur-md px-4 py-1.5 rounded-full text-sm font-medium border border-white/10">
    {lightboxIndex + 1} / {galleryImages.length}
  </div>
</div>

          )}
		  
        </DialogContent>
      </Dialog>
    </div>
  );
}
