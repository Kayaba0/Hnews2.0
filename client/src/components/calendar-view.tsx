import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, parseISO } from 'date-fns';
import { it, enUS } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Anime, useStore } from '@/lib/data';
import { useState } from 'react';
import { motion } from 'framer-motion';

interface CalendarViewProps {
  onClose: () => void;
  onSelectAnime: (anime: Anime) => void;
}

export function CalendarView({ onClose, onSelectAnime }: CalendarViewProps) {
  const { language, animes } = useStore();
  const [currentDate, setCurrentDate] = useState(new Date());
  const locale = language === 'it' ? it : enUS;

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart, { weekStartsOn: 1 });
  const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });

  const calendarDays = eachDayOfInterval({
    start: startDate,
    end: endDate,
  });

  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));

  return (
    <div className="flex flex-col h-full bg-background/60 backdrop-blur-md">
      <div className="flex items-center justify-between p-6 border-b border-white/5">
        <div className="flex items-center gap-4">
          <h2 className="text-2xl font-display font-bold text-gradient">
            {format(currentDate, 'MMMM yyyy', { locale })}
          </h2>
          <div className="flex gap-1">
            <Button variant="ghost" size="icon" onClick={prevMonth} className="rounded-full h-8 w-8">
              <ChevronLeft className="size-5" />
            </Button>
            <Button variant="ghost" size="icon" onClick={nextMonth} className="rounded-full h-8 w-8">
              <ChevronRight className="size-5" />
            </Button>
          </div>
        </div>
        <Button size="icon" variant="ghost" onClick={onClose} className="rounded-full h-10 w-10">
          <X className="size-6" />
        </Button>
      </div>

      <div className="flex-1 overflow-auto p-4 lg:p-8">
        <div className="grid grid-cols-7 gap-px bg-white/5 border border-white/5 rounded-2xl overflow-hidden">
          {['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom'].map((day) => (
            <div key={day} className="bg-background/40 p-2 text-center text-xs font-bold text-muted-foreground uppercase tracking-widest">
              {language === 'it' ? day : day}
            </div>
          ))}
          {calendarDays.map((day, idx) => {
            const dayAnimes = animes.filter((anime) => isSameDay(parseISO(anime.releaseDate), day));
            return (
              <div
                key={idx}
                className={`min-h-[100px] lg:min-h-[140px] bg-background/20 p-2 border-t border-l border-white/5 transition-colors hover:bg-white/5 ${
                  !isSameMonth(day, monthStart) ? 'opacity-20' : ''
                }`}
              >
                <span className={`text-sm font-medium ${isSameDay(day, new Date()) ? 'text-primary' : 'text-muted-foreground'}`}>
                  {format(day, 'd')}
                </span>
                <div className="mt-2 space-y-1">
                  {dayAnimes.map((anime) => (
                    <motion.div
                      key={anime.id}
                      whileHover={{ scale: 1.05 }}
                      onClick={() => onSelectAnime(anime)}
                      className="group cursor-pointer relative aspect-video rounded-lg overflow-hidden border border-white/10 shadow-lg"
                    >
                      <img src={anime.coverImage} className="w-full h-full object-cover" alt={anime.title} />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent group-hover:from-black/60 transition-colors" />
                      <div className="absolute bottom-1.5 left-1.5 right-1.5">
                        <p className="text-[10px] leading-tight font-bold text-white line-clamp-2 drop-shadow-md">{anime.title}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
