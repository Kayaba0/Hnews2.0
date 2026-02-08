import { useState, useMemo, useEffect } from "react";
import { useStore, Anime } from "@/lib/data";
import { format, parseISO, isValid, type Locale } from "date-fns";
import { it, enUS } from "date-fns/locale";

const safeFormatDate = (dateStr: string, formatStr: string, options?: { locale?: Locale }) => {
  try {
    const date = parseISO(dateStr);
    if (!isValid(date)) return dateStr || 'N/A';
    return format(date, formatStr, options);
  } catch {
    return dateStr || 'N/A';
  }
};
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Plus,
  Trash2,
  Edit3,
  FilterX,
  ArrowLeft,
  Check,
  X,
  Tag,
  Building2,
  Calendar,
  Tv,
} from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { AnimeEditor } from "@/components/anime-editor";
import { useToast } from "@/hooks/use-toast";

export default function Admin() {
  const {
    animes,
    deleteAnime,
    language,
    isAdmin,
    login,
    availableGenres,
    availableStudios,
    addGenre,
    updateGenre,
    deleteGenre,
    addStudio,
    updateStudio,
    deleteStudio,
    upcomingEpisodes,
    addUpcomingEpisode,
    deleteUpcomingEpisode,
  } = useStore();
  const { toast } = useToast();

  useEffect(() => {
    const handleError = (e: any) => {
      if (e.detail?.message?.includes("quota exceeded")) {
        toast({
          title:
            language === "it" ? "Memoria Esaurita" : "Storage Quota Exceeded",
          description:
            language === "it"
              ? "Il video è troppo grande per essere salvato. Prova un file più piccolo (< 2-3MB)."
              : "The video is too large to save. Try a smaller file (< 2-3MB).",
          variant: "destructive",
        });
      }
    };
    window.addEventListener("app-error" as any, handleError);
    return () => window.removeEventListener("app-error" as any, handleError);
  }, [language, toast]);
  const [activeTab, setActiveTab] = useState<"animes" | "episodes">("animes");
  const [searchTerm, setSearchTerm] = useState("");
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingAnime, setEditingAnime] = useState<Anime | null>(null);

  const [newGenre, setNewGenre] = useState("");
  const [newStudio, setNewStudio] = useState("");
  const [editingItem, setEditingItem] = useState<{
    type: "genre" | "studio";
    id: string;
    newName: string;
  } | null>(null);

  const [isEpisodeModalOpen, setIsEpisodeModalOpen] = useState(false);
  const [epAnimeId, setEpAnimeId] = useState("");
  const [epNumber, setEpNumber] = useState("");
  const [epDate, setEpDate] = useState("");
  const [epDesc, setEpDesc] = useState("");
  const [epGallery, setEpGallery] = useState<string[]>([]);

  // Login state for simplicity in mockup
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const filteredAnimes = useMemo(() => {
    return [...animes]
      .filter((anime) =>
        anime.title.toLowerCase().includes(searchTerm.toLowerCase()),
      )
      .sort(
        (a, b) =>
          parseISO(b.releaseDate).getTime() - parseISO(a.releaseDate).getTime(),
      );
  }, [animes, searchTerm]);

  const [deleteConfirm, setDeleteConfirm] = useState<{
    id: string;
    type: "anime" | "episode" | "genre" | "studio";
    name: string;
  } | null>(null);

  const handleDelete = (id: string, name: string) => {
    setDeleteConfirm({ id, type: "anime", name });
  };

  // Sync admin status from the server cookie (so "logged in" actually means server-authenticated)
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/admin/me", { credentials: "include" });
        const data = await res.json().catch(() => ({ isAdmin: false }));
        if (data?.isAdmin) {
          login();
        }
      } catch {
        // ignore
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // optional: keep username field for UI, but only "admin" is valid
      if (username.trim() && username.trim() !== "admin") {
        toast({
          title: "Login failed",
          description: "Invalid credentials",
          variant: "destructive",
        });
        return;
      }

      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ password }),
      });

      if (!res.ok) {
        const msg = await res.json().catch(() => ({ error: "Invalid credentials" }));
        toast({
          title: "Login failed",
          description: msg?.error || "Invalid credentials",
          variant: "destructive",
        });
        return;
      }

      login();
      toast({ title: "Logged in" });
    } catch (err: any) {
      toast({
        title: "Login failed",
        description: err?.message || "Unexpected error",
        variant: "destructive",
      });
    }
  };

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md glass-panel p-10 rounded-[3rem] border border-white/10 shadow-2xl" + " -translate-y-12"
        >
          <h1 className="text-3xl font-display font-bold text-center mb-8 text-gradient">
            Admin Login
          </h1>
          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-medium ml-2">Username</label>
              <Input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="h-12 rounded-2xl glass-card border-white/5 focus:placeholder:text-transparent placeholder:transition-colors duration-300"
                placeholder="username"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium ml-2">Password</label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-12 rounded-2xl glass-card border-white/5 focus:placeholder:text-transparent placeholder:transition-colors duration-300"
                placeholder="password"
              />
            </div>
            <Button
              type="submit"
              className="w-full h-12 rounded-2xl bg-gradient-to-r from-primary to-secondary text-white font-bold text-lg mt-4"
            >
              Login
            </Button>
          </form>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20 overflow-x-hidden">
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl border-b border-white/5 px-6 py-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-8">
          <div className="flex items-center gap-6">
            <Link href="/">
              <Button
                variant="ghost"
                size="icon"
                className="rounded-2xl hover:bg-white/5 h-12 w-12 border border-white/5"
              >
                <ArrowLeft className="size-6" />
              </Button>
            </Link>
            <div>
              <h1 className="text-4xl font-display font-bold text-gradient">
                {language === "it"
                  ? "Gestione Contenuti"
                  : "Content Management"}
              </h1>
              <p className="text-muted-foreground text-sm mt-1">
                {language === "it"
                  ? `Gestisci ${animes.length} titoli anime`
                  : `Manage ${animes.length} anime titles`}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <div className="relative group flex-1 md:w-96">
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 size-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
              <Input
                placeholder={
                  language === "it" ? "Cerca anime..." : "Search anime..."
                }
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-12 h-14 rounded-[1.5rem] glass-card border-white/5 focus:border-primary/50 transition-all text-lg"
              />
            </div>

            <Button
              onClick={() => {
                setEditingAnime(null);
                setIsEditorOpen(true);
              }}
              className="h-14 px-8 rounded-[1.5rem] bg-gradient-to-r from-primary to-secondary text-white border-none shadow-xl shadow-primary/20 font-bold"
            >
              <Plus className="size-6 mr-2" />
              {language === "it" ? "Aggiungi" : "Add"}
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 mt-12">
        <div className="flex justify-center mb-12">
          <div className="bg-white/5 backdrop-blur-md p-1 rounded-2xl border border-white/10 flex gap-1">
            <Button
              variant={activeTab === "animes" ? "default" : "ghost"}
              onClick={() => setActiveTab("animes")}
              className={`rounded-xl px-8 h-12 ${activeTab === "animes" ? "bg-primary text-white" : "text-muted-foreground"}`}
            >
              {language === "it" ? "Anime" : "Anime"}
            </Button>
            <Button
              variant={activeTab === "episodes" ? "default" : "ghost"}
              onClick={() => setActiveTab("episodes")}
              className={`rounded-xl px-8 h-12 ${activeTab === "episodes" ? "bg-primary text-white" : "text-muted-foreground"}`}
            >
              {language === "it" ? "Episodi" : "Episodes"}
            </Button>
          </div>
        </div>

        {activeTab === "episodes" && (
          <section className="mb-16">
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
              {upcomingEpisodes.map((ep) => {
                const anime = animes.find((a) => a.id === ep.animeId);
                if (!anime) return null;
                return (
                  <motion.div
                    key={ep.id}
                    layout
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="group relative glass-panel rounded-[3rem] overflow-hidden border border-white/5 hover:border-primary/30 transition-all duration-500 shadow-xl cursor-pointer"
                    onClick={() => {
                      setEditingAnime({
                        ...anime,
                        title: `${anime.title} Ep ${ep.episodeNumber}`,
                        releaseDate: ep.releaseDate,
                        description: ep.description || "",
                        gallery: ep.gallery || [],
                        trailerUrl: ep.trailerUrl || "",
                        isEpisode: true,
                        episodeId: ep.id,
                        episodeNumber: ep.episodeNumber,
                        coverImage: ep.coverImage || anime.coverImage, // Use episode cover if exists
                      } as any);
                      setIsEditorOpen(true);
                    }}
                  >
                    <div className="relative overflow-hidden h-[240px]">
                      <img
                        src={ep.coverImage || anime.coverImage}
                        alt={anime.title}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                      />
                      <div className="absolute -inset-8 bg-gradient-to-t from-black via-transparent to-transparent opacity-95" />

                      <div className="absolute top-6 right-6 flex gap-3 translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300 z-20">
                        <Button
                          size="icon"
                          variant="secondary"
                          className="rounded-2xl h-12 w-12 bg-black/40 backdrop-blur-md border border-white/10 hover:bg-primary hover:border-primary text-white"
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingAnime({
                              ...anime,
                              title: `${anime.title} Ep ${ep.episodeNumber}`,
                              releaseDate: ep.releaseDate,
                              description: ep.description || "",
                              gallery: ep.gallery || [],
                              trailerUrl: ep.trailerUrl || "",
                              isEpisode: true,
                              episodeId: ep.id,
                              episodeNumber: ep.episodeNumber,
                              coverImage: ep.coverImage || anime.coverImage, // Use episode cover if exists
                            } as any);
                            setIsEditorOpen(true);
                          }}
                        >
                          <Edit3 className="size-5" />
                        </Button>
                        <Button
                          size="icon"
                          variant="destructive"
                          className="rounded-2xl h-12 w-12 bg-destructive/80 backdrop-blur-md border border-white/10 shadow-lg"
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeleteConfirm({
                              id: ep.id,
                              type: "episode",
                              name: `${anime.title} Ep ${ep.episodeNumber}`,
                            });
                          }}
                        >
                          <Trash2 className="size-5" />
                        </Button>
                      </div>
                    </div>
                    <div className="p-6 -mt-24 relative z-10">
                      <Badge className="mb-1 bg-primary/20 text-primary border-primary/20 backdrop-blur-md rounded-xl px-3 py-1 text-[10px] font-bold uppercase tracking-wider">
                        EPISODIO {ep.episodeNumber}
                      </Badge>
                      <h3 className="text-xl font-display font-bold text-white line-clamp-1 group-hover:text-primary transition-colors">
                        {anime.title}
                      </h3>
                      <p className="text-xs text-muted-foreground mt-2">
                        {format(parseISO(ep.releaseDate), "dd MMMM yyyy", {
                          locale: language === "it" ? it : enUS,
                        })}
                      </p>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </section>
        )}

        {activeTab === "animes" && (
          <>
            <section className="mb-16">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Genres Management */}
                <div className="glass-panel p-8 rounded-[3rem] border border-white/5">
                  <div className="flex items-center gap-3 mb-6">
                    <Tag className="size-6 text-primary" />
                    <h2 className="text-2xl font-display font-bold">
                      {language === "it" ? "Generi" : "Genres"}
                    </h2>
                  </div>

                  <div className="flex gap-2 mb-6">
                    <Input
                      placeholder={
                        language === "it" ? "Nuovo genere..." : "New genre..."
                      }
                      value={newGenre}
                      onChange={(e) => setNewGenre(e.target.value)}
                      className="rounded-xl glass-card border-white/5"
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && newGenre) {
                          addGenre(newGenre);
                          setNewGenre("");
                        }
                      }}
                    />
                    <Button
                      onClick={() => {
                        if (newGenre) {
                          addGenre(newGenre);
                          setNewGenre("");
                        }
                      }}
                      className="rounded-xl bg-primary/20 text-primary hover:bg-primary/30 border-none"
                    >
                      <Plus className="size-5" />
                    </Button>
                  </div>

                  <div className="flex flex-wrap gap-2 max-h-[200px] overflow-y-auto custom-scrollbar pr-2">
                    {availableGenres.map((genre) => (
                      <div key={genre.id} className="group relative">
                        {editingItem?.type === "genre" &&
                        editingItem.id === genre.id ? (
                          <div className="flex items-center gap-1 bg-primary/20 rounded-lg pl-2 pr-1 py-1 border border-primary/30">
                            <input
                              autoFocus
                              className="bg-transparent border-none outline-none text-xs w-20 text-primary font-medium"
                              value={editingItem.newName}
                              onChange={(e) =>
                                setEditingItem({
                                  ...editingItem,
                                  newName: e.target.value,
                                })
                              }
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  updateGenre(editingItem.id, editingItem.newName);
                                  setEditingItem(null);
                                }
                                if (e.key === "Escape") setEditingItem(null);
                              }}
                            />
                            <button
                              onClick={() => {
                                updateGenre(editingItem.id, editingItem.newName);
                                setEditingItem(null);
                              }}
                              className="p-1 hover:bg-primary/20 rounded"
                            >
                              <Check className="size-3 text-primary" />
                            </button>
                          </div>
                        ) : (
                          <Badge
                            variant="secondary"
                            className="pl-3 pr-2 py-1.5 rounded-lg bg-white/5 border-white/5 group-hover:border-primary/30 transition-all gap-2"
                          >
                            <span className="text-xs">{genre.name}</span>
                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button
                                onClick={() =>
                                  setEditingItem({
                                    type: "genre",
                                    id: genre.id,
                                    newName: genre.name,
                                  })
                                }
                                className="p-1 hover:text-primary"
                              >
                                <Edit3 className="size-3" />
                              </button>
                              <button
                                onClick={() => {
                                  setDeleteConfirm({
                                    id: genre.id,
                                    type: "genre",
                                    name: genre.name,
                                  });
                                }}
                                className="p-1 hover:text-destructive"
                              >
                                <Trash2 className="size-3" />
                              </button>
                            </div>
                          </Badge>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Studios Management */}
                <div className="glass-panel p-8 rounded-[3rem] border border-white/5">
                  <div className="flex items-center gap-3 mb-6">
                    <Building2 className="size-6 text-secondary" />
                    <h2 className="text-2xl font-display font-bold">Studio</h2>
                  </div>

                  <div className="flex gap-2 mb-6">
                    <Input
                      placeholder={
                        language === "it" ? "Nuovo studio..." : "New studio..."
                      }
                      value={newStudio}
                      onChange={(e) => setNewStudio(e.target.value)}
                      className="rounded-xl glass-card border-white/5"
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && newStudio) {
                          addStudio(newStudio);
                          setNewStudio("");
                        }
                      }}
                    />
                    <Button
                      onClick={() => {
                        if (newStudio) {
                          addStudio(newStudio);
                          setNewStudio("");
                        }
                      }}
                      className="rounded-xl bg-secondary/20 text-secondary hover:bg-secondary/30 border-none"
                    >
                      <Plus className="size-5" />
                    </Button>
                  </div>

                  <div className="flex flex-wrap gap-2 max-h-[200px] overflow-y-auto custom-scrollbar pr-2">
                    {availableStudios.map((studio) => (
                      <div key={studio.id} className="group relative">
                        {editingItem?.type === "studio" &&
                        editingItem.id === studio.id ? (
                          <div className="flex items-center gap-1 bg-secondary/20 rounded-lg pl-2 pr-1 py-1 border border-secondary/30">
                            <input
                              autoFocus
                              className="bg-transparent border-none outline-none text-xs w-24 text-secondary font-medium"
                              value={editingItem.newName}
                              onChange={(e) =>
                                setEditingItem({
                                  ...editingItem,
                                  newName: e.target.value,
                                })
                              }
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  updateStudio(
                                    editingItem.id,
                                    editingItem.newName,
                                  );
                                  setEditingItem(null);
                                }
                                if (e.key === "Escape") setEditingItem(null);
                              }}
                            />
                            <button
                              onClick={() => {
                                updateStudio(editingItem.id, editingItem.newName);
                                setEditingItem(null);
                              }}
                              className="p-1 hover:bg-secondary/20 rounded"
                            >
                              <Check className="size-3 text-secondary" />
                            </button>
                          </div>
                        ) : (
                          <Badge
                            variant="secondary"
                            className="pl-3 pr-2 py-1.5 rounded-lg bg-white/5 border-white/5 group-hover:border-secondary/30 transition-all gap-2"
                          >
                            <span className="text-xs">{studio.name}</span>
                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button
                                onClick={() =>
                                  setEditingItem({
                                    type: "studio",
                                    id: studio.id,
                                    newName: studio.name,
                                  })
                                }
                                className="p-1 hover:text-secondary"
                              >
                                <Edit3 className="size-3" />
                              </button>
                              <button
                                onClick={() => {
                                  setDeleteConfirm({
                                    id: studio.id,
                                    type: "studio",
                                    name: studio.name,
                                  });
                                }}
                                className="p-1 hover:text-destructive"
                              >
                                <Trash2 className="size-3" />
                              </button>
                            </div>
                          </Badge>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </section>

            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
              <AnimatePresence mode="popLayout">
                {filteredAnimes.map((anime) => (
                  <motion.div
                    key={anime.id}
                    layout
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="group relative glass-panel rounded-[3rem] overflow-hidden border border-white/5 hover:border-primary/30 transition-all duration-500 shadow-xl cursor-pointer"
                    onClick={() => {
                      setEditingAnime(anime);
                      setIsEditorOpen(true);
                    }}
                  >
                    <div className="relative overflow-hidden h-[240px]">
                      <img
                        src={anime.coverImage}
                        alt={anime.title}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                      />
                      <div className="absolute -inset-8 bg-gradient-to-t from-black via-transparent to-transparent opacity-95" />

                      <div className="absolute top-6 right-6 flex gap-3 translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300 z-20">
                        <Button
                          size="icon"
                          variant="secondary"
                          className="rounded-2xl h-12 w-12 bg-black/40 backdrop-blur-md border border-white/10 hover:bg-primary hover:border-primary text-white"
                          onClick={() => {
                            setEditingAnime(anime);
                            setIsEditorOpen(true);
                          }}
                        >
                          <Edit3 className="size-5" />
                        </Button>
                        <Button
                          size="icon"
                          variant="destructive"
                          className="rounded-2xl h-12 w-12 bg-destructive/80 backdrop-blur-md border border-white/10 shadow-lg"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(anime.id, anime.title);
                          }}
                        >
                          <Trash2 className="size-5" />
                        </Button>
                      </div>
                    </div>

                    <div className="p-6 -mt-32 relative z-10 flex flex-col justify-end min-h-[160px]">
                      <div className="mb-2">
                        <Badge className="mb-1 bg-primary/20 text-primary border-primary/20 backdrop-blur-md rounded-xl px-3 py-1 text-[10px] font-bold uppercase tracking-wider">
                          {anime.studio}
                        </Badge>
                        <h3 className="text-xl font-display font-bold text-white line-clamp-1 group-hover:text-primary transition-colors drop-shadow-lg">
                          {anime.title}
                        </h3>
                      </div>

                      <div className="flex items-center justify-start text-[13px] text-muted-foreground mb-3">
                        <span className="bg-white/5 px-3 py-1 rounded-full border border-white/5">
                          {anime.episodes || "?"} ep
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {anime.genre.map((g) => (
                          <Badge
                            key={g}
                            variant="outline"
                            className="text-[9px] uppercase tracking-widest border-white/10 py-0.5 px-2 rounded-lg bg-white/5"
                          >
                            {g}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </>
        )}

        {activeTab === "animes" && filteredAnimes.length === 0 && (
          <div className="flex flex-col items-center justify-center py-60 text-muted-foreground">
            <FilterX className="size-24 mb-8 opacity-10" />
            <p className="text-2xl font-display font-medium">
              {language === "it" ? "Nessun titolo trovato" : "No titles found"}
            </p>
            <Button
              variant="link"
              onClick={() => setSearchTerm("")}
              className="mt-4 text-primary text-lg"
            >
              {language === "it" ? "Resetta filtri" : "Reset filters"}
            </Button>
          </div>
        )}
      </main>

      <Dialog open={isEditorOpen} onOpenChange={setIsEditorOpen}>
        <DialogContent className="w-[95vw] sm:max-w-[1100px] lg:max-w-[1250px] glass-panel border-white/20 p-0 rounded-[4rem] overflow-hidden shadow-2xl outline-none">
          <div className="p-10 border-b border-white/5 bg-white/5 flex items-center justify-between relative">
            <DialogHeader>
              <DialogTitle className="text-4xl font-display font-bold text-gradient">
                {editingAnime
                  ? (editingAnime as any).isEpisode
                    ? language === "it"
                      ? "Modifica Episodio"
                      : "Edit Episode"
                    : language === "it"
                      ? "Modifica Anime"
                      : "Edit Anime"
                  : language === "it"
                    ? "Nuovo Anime"
                    : "New Anime"}
              </DialogTitle>
            </DialogHeader>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsEditorOpen(false)}
              className="rounded-2xl h-12 w-12 bg-gradient-to-br from-white/10 to-white/5 border border-white/10 hover:border-primary/50 text-white transition-all shadow-lg hover:shadow-primary/20"
            >
              <X className="size-6" />
            </Button>
          </div>
          <div className="p-10">
            <AnimeEditor
              anime={editingAnime}
              onClose={() => {
                setIsEditorOpen(false);
                setEditingAnime(null);
              }}
            />
          </div>
        </DialogContent>
      </Dialog>

      {/* Custom Delete Confirmation Dialog */}
      <Dialog
        open={!!deleteConfirm}
        onOpenChange={(open) => !open && setDeleteConfirm(null)}
      >
        <DialogContent className="sm:max-w-[400px] glass-panel border-white/20 p-8 rounded-[2.5rem] shadow-2xl outline-none">
          <div className="text-center space-y-6">
            <div className="mx-auto w-20 h-20 rounded-full bg-destructive/10 flex items-center justify-center border border-destructive/20 shadow-[0_0_30px_rgba(var(--destructive),0.1)]">
              <Trash2 className="size-10 text-destructive" />
            </div>

            <div className="space-y-2">
              <h3 className="text-2xl font-display font-bold text-white">
                {language === "it"
                  ? "Conferma Eliminazione"
                  : "Confirm Deletion"}
              </h3>
              <p className="text-muted-foreground text-sm leading-relaxed px-4">
                {language === "it"
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
                {language === "it" ? "Annulla" : "Cancel"}
              </Button>
              <Button
                variant="destructive"
                onClick={() => {
                  if (deleteConfirm) {
                    if (deleteConfirm.type === "anime")
                      deleteAnime(deleteConfirm.id);
                    else if (deleteConfirm.type === "episode")
                      deleteUpcomingEpisode(deleteConfirm.id);
                    else if (deleteConfirm.type === "genre")
                      deleteGenre(deleteConfirm.id);
                    else if (deleteConfirm.type === "studio")
                      deleteStudio(deleteConfirm.id);
                    setDeleteConfirm(null);
                    toast({
                      title: language === "it" ? "Eliminato" : "Deleted",
                      description:
                        language === "it"
                          ? "Elemento rimosso con successo"
                          : "Item removed successfully",
                    });
                  }
                }}
                className="h-14 rounded-2xl bg-destructive hover:bg-destructive/90 font-bold shadow-lg shadow-destructive/20"
              >
                {language === "it" ? "Elimina" : "Delete"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
