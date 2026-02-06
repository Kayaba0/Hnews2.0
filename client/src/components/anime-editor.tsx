import { useState, useRef, useEffect } from 'react';
import { useStore, Anime } from '@/lib/data';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { Upload, X, Save, Trash2, Plus, Check, Search, ChevronDown, Video } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

const animeSchema = z.object({
  title: z.string().min(1, "Title is required"),
  studio: z.string().min(1, "Studio is required"),
  releaseDate: z.string().min(1, "Date is required"),
  description: z.string().optional(),
  episodes: z.number().optional().or(z.string().transform(v => v === '' ? undefined : Number(v))),
});

export function AnimeEditor({ anime, onClose, onModeChange }: { anime?: Anime | null; onClose: () => void; onModeChange?: (mode: 'anime' | 'episode') => void }) {
  const { 
    animes, 
    upcomingEpisodes, 
    addAnime, 
    updateAnime, 
    deleteAnime, 
    language, 
    availableGenres, 
    availableStudios, 
    addUpcomingEpisode, 
    updateUpcomingEpisode, 
	addGenre,
    addStudio,
    deleteUpcomingEpisode 
  } = useStore();
  const { toast } = useToast();
  
  const isEditingEpisode = anime && (anime as any).isEpisode;
  const [mode, setMode] = useState<'anime' | 'episode'>(isEditingEpisode ? 'episode' : 'anime');

  useEffect(() => {
    onModeChange?.(mode);
  }, [mode, onModeChange]);
  
  // Episode states
  const [epAnimeId, setEpAnimeId] = useState('');
  const [epNumber, setEpNumber] = useState('');
  const [epDate, setEpDate] = useState('');
  const [epDesc, setEpDesc] = useState('');
  const [epTrailer, setEpTrailer] = useState('');

  // Common states
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [galleryPreviews, setGalleryPreviews] = useState<string[]>([]);
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [genreInput, setGenreInput] = useState('');
  const [studioInput, setStudioInput] = useState('');
  const [isGenrePopoverOpen, setIsGenrePopoverOpen] = useState(false);
  const [isStudioPopoverOpen, setIsStudioPopoverOpen] = useState(false);

  const form = useForm<z.infer<typeof animeSchema>>({
    resolver: zodResolver(animeSchema),
    defaultValues: {
      title: '',
      studio: '',
      releaseDate: '',
      description: '',
      episodes: undefined,
    }
  });
  
  const uploadFile = async (file: File): Promise<string> => {
  const fd = new FormData();
  fd.append("file", file);

  const res = await fetch("/api/upload", {
    method: "POST",
    credentials: "include",
    body: fd,
  });

  if (!res.ok) throw new Error("Upload failed");
  const data = await res.json();
  return data.url as string;
};

  useEffect(() => {
    if (anime) {
      if ((anime as any).isEpisode) {
        setMode('episode');
        const episodeId = (anime as any).episodeId;
        const currentEp = upcomingEpisodes.find(e => e.id === episodeId);
        
        if (currentEp) {
          setEpAnimeId(currentEp.animeId);
          setEpNumber(currentEp.episodeNumber.toString());
          setEpDate(currentEp.releaseDate);
          setEpDesc(currentEp.description || '');
          setEpTrailer(currentEp.trailerUrl || '');
          setGalleryPreviews(currentEp.gallery || []);
          
          // Prioritize current episode's genres
          const parentAnime = animes.find(a => a.id === currentEp.animeId);
          if (currentEp.genre && currentEp.genre.length > 0) {
            setSelectedGenres(currentEp.genre);
          } else if (parentAnime && parentAnime.genre) {
            setSelectedGenres(parentAnime.genre);
          }
          
          // Prioritize episode's own cover image, fallback to parent anime's cover
          if (currentEp.coverImage) {
            setCoverPreview(currentEp.coverImage);
          } else if (parentAnime) {
            setCoverPreview(parentAnime.coverImage || null);
          }
        }
      } else {
        setMode('anime');
        setCoverPreview(anime.coverImage || null);
        setGalleryPreviews(anime.gallery || []);
        setSelectedGenres(anime.genre || []);
        form.reset({
          title: anime.title || '',
          studio: anime.studio || '',
          releaseDate: anime.releaseDate || '',
          description: anime.description || '',
          episodes: anime.episodes || undefined,
        });
      }
    }
  }, [anime, upcomingEpisodes, animes, form]);

  const [isUploading, setIsUploading] = useState(false);

  const uploadToCloudinary = async (base64Image: string): Promise<string> => {
    const response = await fetch('/api/upload', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ image: base64Image })
    });
    if (!response.ok) throw new Error('Upload failed');
    const data = await response.json();
    return data.url;
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, target: 'cover' | 'gallery') => {
    const files = e.target.files;
    if (!files) return;
    
    setIsUploading(true);
    try {
      for (const file of Array.from(files)) {
        const reader = new FileReader();
        const base64 = await new Promise<string>((resolve) => {
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(file);
        });
        
        const cloudinaryUrl = await uploadToCloudinary(base64);
        
        if (target === 'cover') {
          setCoverPreview(cloudinaryUrl);
        } else {
          setGalleryPreviews(prev => [...prev, cloudinaryUrl]);
        }
      }
      toast({ title: language === 'it' ? "Immagine caricata" : "Image uploaded" });
    } catch (error) {
      console.error('Upload error:', error);
      toast({ 
        title: language === 'it' ? "Errore upload" : "Upload error", 
        variant: "destructive" 
      });
    } finally {
      setIsUploading(false);
    }
  };

  const removeGalleryImage = (index: number) => {
    setGalleryPreviews(prev => prev.filter((_, i) => i !== index));
  };

  const onSubmit = (data: z.infer<typeof animeSchema>) => {
    const animeData: Anime = {
      id: anime?.id || crypto.randomUUID(),
      ...data,
      genre: selectedGenres,
      coverImage: coverPreview || '',
      gallery: galleryPreviews,
      description: data.description || '',
      episodes: typeof data.episodes === 'number' ? data.episodes : undefined,
    };
    if (anime) updateAnime(anime.id, animeData);
    else addAnime(animeData);
    toast({ title: language === 'it' ? "Successo" : "Success" });
    onClose();
  };

  const onSubmitEpisode = () => {
    if (!epAnimeId || !epNumber || !epDate) {
      toast({ title: language === 'it' ? "Campi obbligatori mancanti" : "Required fields missing", variant: "destructive" });
      return;
    }
    const epData = {
      id: isEditingEpisode ? (anime as any).episodeId : crypto.randomUUID(),
      animeId: epAnimeId,
      episodeNumber: parseInt(epNumber),
      releaseDate: epDate,
      description: epDesc,
      gallery: galleryPreviews,
      trailerUrl: epTrailer,
      genre: selectedGenres,
      title: '',
      coverImage: coverPreview || '' // Ensure cover is saved for episodes
    };
    
    if (isEditingEpisode) {
      updateUpcomingEpisode(epData.id, epData);
    } else {
      addUpcomingEpisode(epData as any);
    }
    toast({ title: language === 'it' ? "Successo" : "Success" });
    onClose();
  };

  useEffect(() => {
    if (mode === 'episode' && epAnimeId) {
      const parentAnime = animes.find(a => a.id === epAnimeId);
      if (parentAnime && !isEditingEpisode) {
        setSelectedGenres(parentAnime.genre || []);
        // Don't pre-fill coverPreview with parent's cover anymore
        // setCoverPreview(parentAnime.coverImage || null);
      }
    }
  }, [epAnimeId, mode, animes, isEditingEpisode]);

  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string, type: 'anime' | 'episode', name: string } | null>(null);

  const isAnime = mode === 'anime';

  return (
    <div className="max-h-[80vh] overflow-y-auto px-1 custom-scrollbar">
      {/* Custom Delete Confirmation Dialog for Editor */}
      <Dialog open={!!deleteConfirm} onOpenChange={(open) => !open && setDeleteConfirm(null)}>
        <DialogContent className="sm:max-w-[400px] glass-panel border-white/20 p-8 rounded-[2.5rem] shadow-2xl outline-none z-[100]">
          <div className="text-center space-y-6">
            <div className="mx-auto w-20 h-20 rounded-full bg-destructive/10 flex items-center justify-center border border-destructive/20 shadow-[0_0_30px_rgba(var(--destructive),0.1)]">
              <Trash2 className="size-10 text-destructive" />
            </div>
            
            <div className="space-y-2">
              <h3 className="text-2xl font-display font-bold text-white">
                {language === 'it' ? 'Conferma Eliminazione' : 'Confirm Deletion'}
              </h3>
              <p className="text-muted-foreground text-sm leading-relaxed px-4">
                {language === 'it' 
                  ? `Sei sicuro di voler eliminare "${deleteConfirm?.name}"? Questa azione non può essere annullata.`
                  : `Are you sure you want to delete "${deleteConfirm?.name}"? This action cannot be undone.`}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Button 
                variant="ghost" 
                onClick={() => setDeleteConfirm(null)}
                className="h-14 rounded-2xl border border-white/5 bg-white/5 hover:bg-white/10 font-bold"
              >
                {language === 'it' ? 'Annulla' : 'Cancel'}
              </Button>
              <Button 
                variant="destructive"
                onClick={() => {
                  if (deleteConfirm) {
                    if (deleteConfirm.type === 'anime') deleteAnime(deleteConfirm.id);
                    else deleteUpcomingEpisode(deleteConfirm.id);
                    setDeleteConfirm(null);
                    onClose();
                    toast({ 
                      title: language === 'it' ? "Eliminato" : "Deleted",
                      description: language === 'it' ? "Elemento rimosso con successo" : "Item removed successfully"
                    });
                  }
                }}
                className="h-14 rounded-2xl bg-destructive hover:bg-destructive/90 font-bold shadow-lg shadow-destructive/20"
              >
                {language === 'it' ? 'Elimina' : 'Delete'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      {!anime && (
        <div className="flex justify-center mb-8">
          <div className="bg-white/5 backdrop-blur-md p-1 rounded-2xl border border-white/10 flex gap-1">
            <Button variant={isAnime ? 'default' : 'ghost'} onClick={() => setMode('anime')} className="rounded-xl px-6">
              {language === 'it' ? 'Nuovo Anime' : 'New Anime'}
            </Button>
            <Button variant={!isAnime ? 'default' : 'ghost'} onClick={() => setMode('episode')} className="rounded-xl px-6">
              {language === 'it' ? 'Nuovo Episodio' : 'New Episode'}
            </Button>
          </div>
        </div>
      )}

      {isAnime ? (
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            {/* Top layout: Cover | Gallery | Fields */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Cover */}
              <div className="space-y-3">
                <label className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
                  {language === 'it' ? 'Copertina' : 'Cover Image'}
                </label>
                <div className="relative aspect-[3/4] w-full rounded-[2rem] border-2 border-dashed border-white/10 bg-black/20 overflow-hidden group hover:border-primary/50 transition-all">
                  {coverPreview ? (
                    <>
                      <img src={coverPreview} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                        <Button variant="destructive" size="sm" onClick={() => setCoverPreview(null)} className="rounded-xl">
                          <X className="size-4 mr-2" /> {language === 'it' ? 'Rimuovi' : 'Remove'}
                        </Button>
                      </div>
                    </>
                  ) : (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-4">
                      {isUploading ? (
                        <>
                          <div className="size-12 mb-2 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
                          <p className="text-sm font-bold text-primary uppercase tracking-wider">{language === 'it' ? 'Caricamento...' : 'Uploading...'}</p>
                        </>
                      ) : (
                        <>
                          <Plus className="size-12 mb-2 text-muted-foreground" />
                          <p className="text-sm font-bold text-muted-foreground uppercase tracking-wider">{language === 'it' ? 'Clicca per caricare' : 'Click to upload'}</p>
                        </>
                      )}
                      <input
                        type="file"
                        accept="image/*"
                        className="absolute inset-0 opacity-0 cursor-pointer"
                        onChange={(e) => handleImageUpload(e, 'cover')}
                        disabled={isUploading}
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Gallery */}
              <div className="space-y-3">
                <label className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Gallery</label>
                <div className="grid grid-cols-2 gap-3">
                  {galleryPreviews.map((img, idx) => (
                    <div key={idx} className="relative aspect-video rounded-2xl overflow-hidden group border border-white/10 shadow-xl">
                      <img src={img} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <Button variant="destructive" size="icon" onClick={() => removeGalleryImage(idx)} className="rounded-full h-10 w-10">
                          <Trash2 className="size-5" />
                        </Button>
                      </div>
                    </div>
                  ))}
                  <div className="relative aspect-video rounded-2xl border-2 border-dashed border-white/10 bg-black/20 hover:border-primary/50 hover:bg-primary/5 transition-all flex flex-col items-center justify-center cursor-pointer group">
                    <div className="bg-white/5 p-3 rounded-full mb-2 group-hover:bg-primary/20 transition-colors">
                      <Plus className="size-6 text-muted-foreground group-hover:text-primary transition-colors" />
                    </div>
                    <span className="text-[10px] font-bold text-muted-foreground group-hover:text-primary transition-colors uppercase tracking-wider">AGGIUNGI</span>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      className="absolute inset-0 opacity-0 cursor-pointer"
                      onChange={(e) => handleImageUpload(e, 'gallery')}
                      disabled={isUploading}
                    />
                  </div>
                </div>
              </div>

              {/* Fields */}
              <div className="space-y-6">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{language === 'it' ? 'Titolo' : 'Title'}</FormLabel>
                      <FormControl>
                        <Input {...field} className="bg-black/20 border border-white/10 h-14 rounded-2xl" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="studio"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Studio</FormLabel>
                      <FormControl>
                        <div className="flex flex-wrap gap-2 p-3 min-h-[56px] rounded-2xl border border-white/5 bg-black/20">
                          {field.value && (
                            <Badge
                              variant="secondary"
                              className="gap-1 px-3 py-2 rounded-xl bg-primary/20 text-primary border-primary/20"
                            >
                              {field.value}
                              <X className="size-3 cursor-pointer" onClick={() => field.onChange('')} />
                            </Badge>
                          )}
                          <Popover open={isStudioPopoverOpen} onOpenChange={setIsStudioPopoverOpen}>
                            <PopoverTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-10 px-4 rounded-xl text-xs border border-dashed border-white/20 hover:border-primary/50"
                              >
                                <Plus className="size-4 mr-2" /> {language === 'it' ? 'Seleziona studio' : 'Select studio'}
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-[300px] p-0 glass-panel border-white/10" align="start">
                              <Command className="bg-transparent border-none">
                                <CommandInput placeholder={language === 'it' ? 'Cerca...' : 'Search...'} value={studioInput} onValueChange={setStudioInput} />
                                <CommandList className="max-h-[200px] custom-scrollbar overflow-y-auto">
                                  <CommandEmpty className="p-2">
                                    <Button
                                      variant="ghost"
                                      className="w-full justify-start text-xs h-10"
                                      onClick={async () => {
                                        const name = studioInput.trim();
                                        if (!name) return;

                                        try {
                                          const exists = availableStudios.some(
                                            s => s.name.toLowerCase() === name.toLowerCase()
                                          );

                                          if (!exists) {
                                            await addStudio(name);
                                          }

                                          field.onChange(name);
                                          setStudioInput('');
                                          setIsStudioPopoverOpen(false);
                                        } catch (e) {
                                          console.error(e);
                                          toast({
                                            title: language === 'it' ? 'Errore' : 'Error',
                                            description: language === 'it'
                                              ? 'Impossibile salvare lo studio'
                                              : 'Could not save studio',
                                            variant: 'destructive',
                                          });
                                        }
                                      }}
                                    >
                                      <Plus className="size-4 mr-2" />
                                      {language === 'it' ? `Aggiungi "${studioInput}"` : `Add "${studioInput}"`}
                                    </Button>
                                  </CommandEmpty>

                                  <CommandGroup>
                                    {availableStudios
                                      .filter(s => s.name.toLowerCase().includes(studioInput.toLowerCase()))
                                      .map(studio => (
                                        <CommandItem
                                          key={studio.id}
                                          onSelect={() => {
                                            field.onChange(studio.name);
                                            setStudioInput('');
                                            setIsStudioPopoverOpen(false);
                                          }}
                                          className="text-sm cursor-pointer"
                                        >
                                          {studio.name}
                                        </CommandItem>
                                      ))
                                    }
                                  </CommandGroup>
                                </CommandList>
                              </Command>
                            </PopoverContent>
                          </Popover>
                        </div>
                      </FormControl>
                    </FormItem>
                  )}
                />

                <div className="space-y-3">
                  <label className="text-sm font-medium">{language === 'it' ? 'Generi' : 'Genres'}</label>
                  <div className="flex flex-wrap gap-2 p-3 min-h-[56px] rounded-2xl border border-white/5 bg-black/20">
                    {selectedGenres.map(genre => (
                      <Badge key={genre} variant="secondary" className="gap-1 px-3 py-2 rounded-xl bg-primary/20 text-primary border-primary/20">
                        {genre}
                        <X className="size-3 cursor-pointer" onClick={() => setSelectedGenres(prev => prev.filter(g => g !== genre))} />
                      </Badge>
                    ))}
                    <Popover open={isGenrePopoverOpen} onOpenChange={setIsGenrePopoverOpen}>
                      <PopoverTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-10 px-4 rounded-xl text-xs border border-dashed border-white/20 hover:border-primary/50">
                          <Plus className="size-4 mr-2" /> {language === 'it' ? 'Aggiungi genere' : 'Add genre'}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-[300px] p-0 glass-panel" align="start">
                        <Command className="bg-transparent border-none">
                          <CommandInput placeholder={language === 'it' ? 'Cerca...' : 'Search...'} value={genreInput} onValueChange={setGenreInput} />
                          <CommandList className="max-h-[200px] custom-scrollbar overflow-y-auto">
                            <CommandEmpty className="p-2">
                              <Button
                                variant="ghost"
                                className="w-full justify-start text-xs h-10"
                                onClick={async () => {
                                  const name = genreInput.trim();
                                  if (!name) return;

                                  try {
                                    const exists = availableGenres.some(
                                      g => g.name.toLowerCase() === name.toLowerCase()
                                    );

                                    if (!exists) {
                                      await addGenre(name);
                                    }

                                    setSelectedGenres(prev =>
                                      prev.some(g => g.toLowerCase() === name.toLowerCase())
                                        ? prev
                                        : [...prev, name]
                                    );

                                    setGenreInput('');
                                    setIsGenrePopoverOpen(false);
                                  } catch (e) {
                                    console.error(e);
                                    toast({
                                      title: language === 'it' ? 'Errore' : 'Error',
                                      description: language === 'it'
                                        ? 'Impossibile salvare il genere'
                                        : 'Could not save genre',
                                      variant: 'destructive',
                                    });
                                  }
                                }}
                              >
                                <Plus className="size-4 mr-2" /> {language === 'it' ? `Aggiungi "${genreInput}"` : `Add "${genreInput}"`}
                              </Button>
                            </CommandEmpty>
                            <CommandGroup>
                              {availableGenres
                                .filter(g => !selectedGenres.includes(g.name))
                                .filter(g => g.name.toLowerCase().includes(genreInput.toLowerCase()))
                                .map(genre => (
                                  <CommandItem
                                    key={genre.id}
                                    onSelect={() => {
                                      setSelectedGenres(prev => [...prev, genre.name]);
                                      setGenreInput('');
                                      setIsGenrePopoverOpen(false);
                                    }}
                                    className="text-sm cursor-pointer"
                                  >
                                    {genre.name}
                                  </CommandItem>
                                ))
                              }
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>

                <FormField
                    control={form.control}
                    name="episodes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{language === 'it' ? 'Episodi' : 'Episodes'}</FormLabel>
                        <FormControl>
                          <Input type="number" {...field} className="bg-black/20 border border-white/10 h-14 rounded-2xl" />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="releaseDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{language === 'it' ? 'Data di uscita' : 'Release Date'}</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} className="bg-black/20 border border-white/10 h-14 rounded-2xl block" />
                        </FormControl>
                      </FormItem>
                    )}
                  />
              </div>
            </div>

            {/* Bottom: Description + actions */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{language === 'it' ? 'Descrizione' : 'Description'}</FormLabel>
                  <FormControl>
                    <Textarea {...field} className="bg-black/20 border border-white/10 min-h-[150px] rounded-2xl p-6" />
                  </FormControl>
                </FormItem>
              )}
            />

            <div className="flex gap-4 pt-6 border-t border-white/5">
              <Button type="submit" className="flex-1 bg-gradient-to-r from-primary to-secondary text-white font-bold h-16 rounded-[1.5rem] shadow-xl shadow-primary/20 hover:shadow-primary/40 transition-all">
                <Save className="mr-2 size-6" /> {anime ? (language === 'it' ? 'Aggiorna Anime' : 'Update Anime') : (language === 'it' ? 'Crea Anime' : 'Create Anime')}
              </Button>
              {anime && (
                <Button
                  type="button"
                  variant="destructive"
                  className="h-16 w-16 rounded-[1.5rem] p-0 shadow-xl shadow-destructive/20 hover:shadow-destructive/40 transition-all"
                  onClick={() => setDeleteConfirm({ id: anime.id, type: 'anime', name: anime.title })}
                >
                  <Trash2 className="size-6" />
                </Button>
              )}
            </div>
          </form>
        </Form>
      ) : (
        <div className="space-y-6">
          <div className="space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="space-y-6">
              <div className="space-y-3">
          <label className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
            {language === 'it' ? 'Copertina' : 'Cover Image'}
          </label>
          <div className="relative aspect-[3/4] w-full rounded-[2rem] border-2 border-dashed border-white/10 bg-black/20 overflow-hidden group hover:border-primary/50 transition-all">
            {coverPreview ? (
              <>
                <img src={coverPreview} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                  <Button variant="destructive" size="sm" onClick={() => setCoverPreview(null)} className="rounded-xl">
                    <X className="size-4 mr-2" /> {language === 'it' ? 'Rimuovi' : 'Remove'}
                  </Button>
                </div>
              </>
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-4">
                {isUploading ? (
                  <>
                    <div className="size-12 mb-2 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
                    <p className="text-sm font-bold text-primary uppercase tracking-wider">{language === 'it' ? 'Caricamento...' : 'Uploading...'}</p>
                  </>
                ) : (
                  <>
                    <Plus className="size-12 mb-2 text-muted-foreground" />
                    <p className="text-sm font-bold text-muted-foreground uppercase tracking-wider">{language === 'it' ? 'Clicca per caricare' : 'Click to upload'}</p>
                  </>
                )}
                <input type="file" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer" onChange={(e) => handleImageUpload(e, 'cover')} disabled={isUploading} />
              </div>
            )}
          </div>
        </div>
            </div>

            <div className="space-y-6">
              <div className="space-y-3">
                <label className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
                  Trailer Video (MP4)
                </label>
                <div className="relative aspect-video w-full rounded-2xl border-2 border-dashed border-white/10 bg-black/20 hover:border-primary/50 transition-all flex flex-col items-center justify-center cursor-pointer overflow-hidden group">
                  {epTrailer ? (
                    <div className="absolute inset-0 flex flex-col items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
                      <Video className="size-8 text-primary mb-2" />
                      <span className="text-xs font-bold text-white uppercase tracking-wider mb-2 line-clamp-1 px-4">{epTrailer.startsWith('data:') ? (language === 'it' ? 'Video Caricato' : 'Video Uploaded') : epTrailer}</span>
                      <Button variant="destructive" size="sm" onClick={() => setEpTrailer('')} className="h-8 rounded-lg px-4">
                        <X className="size-3 mr-1" /> {language === 'it' ? 'Rimuovi' : 'Remove'}
                      </Button>
                    </div>
                  ) : (
                    <>
                      <Upload className="size-8 mb-2 text-muted-foreground group-hover:text-primary transition-colors" />
                      <span className="text-xs font-bold text-muted-foreground group-hover:text-primary transition-colors uppercase tracking-wider">
                        {language === 'it' ? 'Carica Video MP4' : 'Upload MP4 Video'}
                      </span>
                      <input
  type="file"
  accept="video/mp4"
  className="absolute inset-0 opacity-0 cursor-pointer"
  onChange={async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploading(true);
      const url = await uploadFile(file);
      setEpTrailer(url);
    } catch (err) {
      console.error(err);
      toast({
        title: language === 'it' ? 'Errore' : 'Error',
        description: language === 'it'
          ? 'Upload video fallito'
          : 'Video upload failed',
        variant: 'destructive',
      });
    } finally {
      setIsUploading(false);
      e.currentTarget.value = ""; // utile: permette di ricaricare lo stesso file
    }
  }}
/>
                    </>
                  )}
                </div>
                <div className="pt-2">
                  <Input 
                    placeholder={language === 'it' ? 'Oppure incolla il link del video (URL)...' : 'Or paste video link (URL)...'}
                    value={epTrailer.startsWith('data:') ? '' : epTrailer}
                    onChange={(e) => setEpTrailer(e.target.value)}
                    className="bg-black/20 border border-white/10 h-10 rounded-xl text-xs"
                  />
                </div>
              </div>

          <div className="space-y-3">
            <label className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Gallery</label>
            <div className="grid grid-cols-2 gap-3">
              {galleryPreviews.map((img, idx) => (
                <div key={idx} className="relative aspect-video rounded-2xl overflow-hidden group border border-white/10 shadow-xl">
                  <img src={img} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Button variant="destructive" size="icon" onClick={() => removeGalleryImage(idx)} className="rounded-full h-10 w-10">
                      <Trash2 className="size-5" />
                    </Button>
                  </div>
                </div>
              ))}
              <div className="relative aspect-video rounded-2xl border-2 border-dashed border-white/10 bg-black/20 hover:border-primary/50 hover:bg-primary/5 transition-all flex flex-col items-center justify-center cursor-pointer group">
                <div className="bg-white/5 p-3 rounded-full mb-2 group-hover:bg-primary/20 transition-colors">
                  <Plus className="size-6 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
                <span className="text-[10px] font-bold text-muted-foreground group-hover:text-primary transition-colors uppercase tracking-wider">AGGIUNGI</span>
                <input type="file" accept="image/*" multiple className="absolute inset-0 opacity-0 cursor-pointer" onChange={(e) => handleImageUpload(e, 'gallery')} disabled={isUploading} />
              </div>
            </div>
          </div>
        </div>

            <div className="space-y-6">
          <div className="grid grid-cols-1 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-medium">{language === 'it' ? 'Seleziona Anime' : 'Select Anime'}</label>
              <select value={epAnimeId} onChange={e => setEpAnimeId(e.target.value)} className="w-full bg-black/20 border border-white/10 rounded-2xl p-4 h-14 text-sm focus:border-primary/50 outline-none transition-all text-white">
                <option value="" className="bg-background text-white">{language === 'it' ? 'Seleziona...' : 'Select...'}</option>
                {animes.map(a => <option key={a.id} value={a.id} className="bg-background text-white">{a.title}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">{language === 'it' ? 'Numero Episodio' : 'Episode Number'}</label>
              <Input type="number" value={epNumber} onChange={e => setEpNumber(e.target.value)} className="bg-black/20 border border-white/10 h-14 rounded-2xl" />
            </div>
          </div>
          <div className="space-y-3">
            <label className="text-sm font-bold uppercase tracking-wider text-muted-foreground">{language === 'it' ? 'Generi' : 'Genres'}</label>
            <div className="flex flex-wrap gap-2 p-3 min-h-[56px] rounded-2xl border border-white/5 bg-black/20">
              {selectedGenres.map(genre => (
                <Badge key={genre} variant="secondary" className="gap-1 px-3 py-2 rounded-xl bg-primary/20 text-primary border-primary/20">
                  {genre}
                  <X className="size-3 cursor-pointer" onClick={() => setSelectedGenres(prev => prev.filter(g => g !== genre))} />
                </Badge>
              ))}
              <Popover open={isGenrePopoverOpen} onOpenChange={setIsGenrePopoverOpen}>
                <PopoverTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-10 px-4 rounded-xl text-xs border border-dashed border-white/20 hover:border-primary/50">
                    <Plus className="size-4 mr-2" /> {language === 'it' ? 'Aggiungi genere' : 'Add genre'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[300px] p-0 glass-panel" align="start">
                  <Command className="bg-transparent border-none">
                    <CommandInput placeholder={language === 'it' ? 'Cerca...' : 'Search...'} value={genreInput} onValueChange={setGenreInput} />
                    <CommandList className="max-h-[200px] custom-scrollbar">
                      <CommandEmpty className="p-2">
                        <Button variant="ghost" className="w-full justify-start text-xs h-10" onClick={() => { if (genreInput && !selectedGenres.includes(genreInput)) setSelectedGenres(prev => [...prev, genreInput]); setGenreInput(''); setIsGenrePopoverOpen(false); }}>
                          <Plus className="size-4 mr-2" /> {language === 'it' ? `Aggiungi "${genreInput}"` : `Add "${genreInput}"`}
                        </Button>
                      </CommandEmpty>
                        <CommandGroup>
                          {availableGenres
                            .filter(g => !selectedGenres.includes(g.name))
                            .filter(g => g.name.toLowerCase().includes(genreInput.toLowerCase()))
                            .map(genre => (
                              <CommandItem 
                                key={genre.id} 
                                onSelect={() => { 
                                  setSelectedGenres(prev => [...prev, genre.name]); 
                                  setGenreInput(''); 
                                  setIsGenrePopoverOpen(false); 
                                }} 
                                className="text-sm cursor-pointer"
                              >
                                {genre.name}
                              </CommandItem>
                            ))
                          }
                        </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>
          </div>
<div className="grid grid-cols-1 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-bold uppercase tracking-wider text-muted-foreground">{language === 'it' ? 'Data di uscita' : 'Release Date'}</label>
              <Input type="date" value={epDate} onChange={e => setEpDate(e.target.value)} className="bg-black/20 border border-white/10 h-14 rounded-2xl block" />
            </div>
          </div>
          </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold uppercase tracking-wider text-muted-foreground">{language === 'it' ? 'Trama Episodio' : 'Episode Plot'}</label>
            <Textarea value={epDesc} onChange={e => setEpDesc(e.target.value)} className="bg-black/20 border border-white/10 min-h-[150px] rounded-2xl p-6 w-full focus:border-primary/50 outline-none transition-all" />
          </div>

          <div className="flex gap-4 pt-6 border-t border-white/5">
            <Button onClick={onSubmitEpisode} className="flex-1 bg-gradient-to-r from-primary to-secondary text-white font-bold h-16 rounded-[1.5rem] shadow-xl shadow-primary/20 hover:shadow-primary/40 transition-all">
              <Save className="mr-2 size-6" /> {isEditingEpisode ? (language === 'it' ? 'Aggiorna Episodio' : 'Update Episode') : (language === 'it' ? 'Crea Episodio' : 'Create Episode')}
            </Button>
            {isEditingEpisode && (
              <Button
                type="button"
                variant="destructive"
                className="h-16 w-16 rounded-[1.5rem] p-0 shadow-xl shadow-destructive/20 hover:shadow-destructive/40 transition-all"
                onClick={() =>
                  setDeleteConfirm({
                    id: (anime as any).episodeId,
                    type: 'episode',
                    name: `${animes.find(a => a.id === epAnimeId)?.title} Ep ${epNumber}`,
                  })
                }
              >
                <Trash2 className="size-6" />
              </Button>
            )}
          </div>
        </div>
        </div>
      )}
    </div>
  );
}