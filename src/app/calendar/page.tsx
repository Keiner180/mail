"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import JabvoxAppLayout from "@/components/layout/JabvoxAppLayout";
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Plus,
  Video,
  Clock,
  MapPin,
  Users,
  X,
  Trash2,
  Edit2,
  ExternalLink,
  Check,
  AlertCircle,
  CalendarDays,
  ListFilter,
  CheckCircle2,
  RefreshCw,
  Search,
  Sparkles,
} from "lucide-react";
import { CalendarEventSummary, CreateEventInput } from "@/lib/calendar/service";

type ViewMode = "month" | "week" | "day" | "agenda";

const MONTH_NAMES = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
];

const DAY_NAMES = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
const FULL_DAY_NAMES = [
  "Domingo",
  "Lunes",
  "Martes",
  "Miércoles",
  "Jueves",
  "Viernes",
  "Sábado",
];

const COLOR_PALETTE = [
  { id: "1", name: "Lavanda", bg: "bg-indigo-100 text-indigo-800 border-indigo-300" },
  { id: "2", name: "Salvia", bg: "bg-emerald-100 text-emerald-800 border-emerald-300" },
  { id: "3", name: "Uva", bg: "bg-purple-100 text-purple-800 border-purple-300" },
  { id: "4", name: "Flamenco", bg: "bg-rose-100 text-rose-800 border-rose-300" },
  { id: "5", name: "Plátano", bg: "bg-amber-100 text-amber-800 border-amber-300" },
  { id: "6", name: "Mandarina", bg: "bg-orange-100 text-orange-800 border-orange-300" },
  { id: "7", name: "Pavo Real", bg: "bg-sky-100 text-sky-800 border-sky-300" },
];

export default function CalendarPage() {
  const [user, setUser] = useState<any>(null);
  const [account, setAccount] = useState<any>(null);
  const [events, setEvents] = useState<CalendarEventSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Calendar navigation state
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>("month");
  const [selectedEvent, setSelectedEvent] = useState<CalendarEventSummary | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Create/Edit form state
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");
  const [eventTitle, setEventTitle] = useState("");
  const [startDate, setStartDate] = useState("");
  const [startTime, setStartTime] = useState("09:00");
  const [endDate, setEndDate] = useState("");
  const [endTime, setEndTime] = useState("10:00");
  const [isAllDay, setIsAllDay] = useState(false);
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");
  const [createMeetLink, setCreateMeetLink] = useState(true);
  const [attendeesInput, setAttendeesInput] = useState("");
  const [attendeeChips, setAttendeeChips] = useState<string[]>([]);
  const [selectedColor, setSelectedColor] = useState("7");
  const [submitting, setSubmitting] = useState(false);

  // Load user and events
  const loadInitialData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch("/api/auth/me");
      if (!res.ok) {
        window.location.href = "/auth/login";
        return;
      }
      const data = await res.json();
      setUser(data.user);

      // Fetch calendar events
      await fetchEvents();
    } catch (err: any) {
      console.error(err);
      setError("Error al cargar datos del usuario y calendario");
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/calendar/events");
      const data = await res.json();

      if (!res.ok) {
        if (data.noAccount) {
          setError(
            "Para utilizar el Calendario, debes vincular una cuenta de Google en la sección de Correo o Perfil."
          );
        } else {
          setError(data.error || "No se pudieron sincronizar los eventos de Google Calendar.");
        }
        return;
      }

      setEvents(data.events || []);
      setAccount(data.account || null);
    } catch (err: any) {
      console.error(err);
      setError("Error de red al consultar Google Calendar");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  // Navigation handlers
  const handlePrev = () => {
    const d = new Date(currentDate);
    if (viewMode === "month") d.setMonth(d.getMonth() - 1);
    else if (viewMode === "week") d.setDate(d.getDate() - 7);
    else if (viewMode === "day") d.setDate(d.getDate() - 1);
    setCurrentDate(d);
  };

  const handleNext = () => {
    const d = new Date(currentDate);
    if (viewMode === "month") d.setMonth(d.getMonth() + 1);
    else if (viewMode === "week") d.setDate(d.getDate() + 7);
    else if (viewMode === "day") d.setDate(d.getDate() + 1);
    setCurrentDate(d);
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  // Open creation modal with default selected date
  const openCreateModal = (targetDate?: Date) => {
    const base = targetDate || new Date();
    const dateStr = base.toISOString().split("T")[0] || "";

    setModalMode("create");
    setEventTitle("");
    setStartDate(dateStr);
    setEndDate(dateStr);
    setStartTime("10:00");
    setEndTime("11:00");
    setIsAllDay(false);
    setLocation("");
    setDescription("");
    setCreateMeetLink(true);
    setAttendeeChips([]);
    setAttendeesInput("");
    setSelectedColor("7");
    setIsCreateModalOpen(true);
  };

  const openEditModal = (evt: CalendarEventSummary) => {
    setModalMode("edit");
    setEventTitle(evt.summary);

    const s = new Date(evt.start);
    const e = new Date(evt.end);

    setStartDate(s.toISOString().split("T")[0] || "");
    setEndDate(e.toISOString().split("T")[0] || "");

    setStartTime(
      s.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false })
    );
    setEndTime(
      e.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false })
    );

    setIsAllDay(evt.isAllDay);
    setLocation(evt.location || "");
    setDescription(evt.description || "");
    setCreateMeetLink(Boolean(evt.meetUrl));
    setAttendeeChips(evt.attendees?.map((a) => a.email) || []);
    setAttendeesInput("");
    setSelectedColor(evt.colorId || "7");
    setSelectedEvent(evt);
    setIsCreateModalOpen(true);
  };

  const handleSaveEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventTitle.trim()) return;

    try {
      setSubmitting(true);

      const startDateTime = isAllDay
        ? `${startDate}T00:00:00Z`
        : `${startDate}T${startTime}:00Z`;

      const endDateTime = isAllDay
        ? `${endDate}T23:59:59Z`
        : `${endDate}T${endTime}:00Z`;

      const payload = {
        summary: eventTitle.trim(),
        description: description.trim() || undefined,
        location: location.trim() || undefined,
        start: startDateTime,
        end: endDateTime,
        isAllDay,
        createMeetLink,
        colorId: selectedColor,
        attendees: attendeeChips,
      };

      if (modalMode === "create") {
        const res = await fetch("/api/calendar/events", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Error al crear el evento");
      } else if (modalMode === "edit" && selectedEvent) {
        const res = await fetch(`/api/calendar/events/${selectedEvent.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Error al actualizar el evento");
      }

      setIsCreateModalOpen(false);
      setSelectedEvent(null);
      await fetchEvents();
    } catch (err: any) {
      console.error(err);
      alert(err.message || "Error al guardar el evento");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteEvent = async (eventId: string) => {
    if (!confirm("¿Estás seguro de que deseas eliminar este evento de Google Calendar?")) {
      return;
    }
    try {
      setLoading(true);
      const res = await fetch(`/api/calendar/events/${eventId}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "No se pudo eliminar el evento");
      }
      setSelectedEvent(null);
      await fetchEvents();
    } catch (err: any) {
      console.error(err);
      alert(err.message || "Error al eliminar");
    } finally {
      setLoading(false);
    }
  };

  // Filter events by search query
  const filteredEvents = useMemo(() => {
    if (!searchQuery.trim()) return events;
    const q = searchQuery.toLowerCase();
    return events.filter(
      (e) =>
        e.summary.toLowerCase().includes(q) ||
        e.description?.toLowerCase().includes(q) ||
        e.location?.toLowerCase().includes(q)
    );
  }, [events, searchQuery]);

  // Calendar matrix calculation for Month View
  const calendarDays = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    const days = [];
    const startingDayIndex = firstDay.getDay(); // 0 is Sunday

    // Previous month padding
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    for (let i = startingDayIndex - 1; i >= 0; i--) {
      const d = new Date(year, month - 1, prevMonthLastDay - i);
      days.push({ date: d, isCurrentMonth: false });
    }

    // Current month days
    for (let i = 1; i <= lastDay.getDate(); i++) {
      const d = new Date(year, month, i);
      days.push({ date: d, isCurrentMonth: true });
    }

    // Next month padding to complete 35 or 42 cells
    const remaining = (7 - (days.length % 7)) % 7;
    for (let i = 1; i <= remaining; i++) {
      const d = new Date(year, month + 1, i);
      days.push({ date: d, isCurrentMonth: false });
    }

    return days;
  }, [currentDate]);

  // Check if date is today
  const isToday = (d: Date) => {
    const today = new Date();
    return (
      d.getDate() === today.getDate() &&
      d.getMonth() === today.getMonth() &&
      d.getFullYear() === today.getFullYear()
    );
  };

  // Get events on a specific day
  const getEventsForDate = (date: Date) => {
    const dateStr = date.toISOString().split("T")[0];
    return filteredEvents.filter((evt) => {
      const eventStartStr = evt.start.split("T")[0];
      return eventStartStr === dateStr;
    });
  };

  return (
    <JabvoxAppLayout user={user}>
      <div className="flex-1 flex flex-col h-full bg-white overflow-hidden">
        {/* Top Header Bar */}
        <header className="h-16 border-b border-slate-200/90 px-6 flex items-center justify-between bg-white flex-shrink-0 select-none">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#15605A] to-[#258f86] text-white flex items-center justify-center shadow-sm">
                <CalendarIcon className="w-5 h-5" />
              </div>
              <span className="font-extrabold text-slate-800 text-lg tracking-tight">
                Google Calendar
              </span>
            </div>

            <div className="h-5 w-px bg-slate-200 mx-1 hidden sm:block" />

            {/* Today and Arrows */}
            <div className="flex items-center gap-1.5">
              <button
                onClick={handleToday}
                className="px-3.5 py-1.5 rounded-xl border border-slate-300 hover:bg-slate-50 text-xs font-semibold text-slate-700 transition-colors shadow-2xs"
              >
                Hoy
              </button>
              <div className="flex items-center">
                <button
                  onClick={handlePrev}
                  className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-600 transition-colors"
                  title="Anterior"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={handleNext}
                  className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-600 transition-colors"
                  title="Siguiente"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              <span className="text-sm font-bold text-slate-800 ml-2">
                {MONTH_NAMES[currentDate.getMonth()]} {currentDate.getFullYear()}
              </span>
            </div>
          </div>

          {/* Right Toolbar: Search, View Switcher, Create Event */}
          <div className="flex items-center gap-3">
            {/* Quick search */}
            <div className="relative hidden md:block">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar eventos..."
                className="pl-9 pr-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50/70 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#15605A]/30 w-48"
              />
            </div>

            {/* View Mode Toggle */}
            <div className="flex items-center p-1 rounded-xl bg-slate-100 text-xs font-semibold text-slate-600">
              <button
                onClick={() => setViewMode("month")}
                className={`px-3 py-1 rounded-lg transition-all ${
                  viewMode === "month"
                    ? "bg-white text-slate-900 shadow-2xs"
                    : "hover:text-slate-900"
                }`}
              >
                Mes
              </button>
              <button
                onClick={() => setViewMode("agenda")}
                className={`px-3 py-1 rounded-lg transition-all ${
                  viewMode === "agenda"
                    ? "bg-white text-slate-900 shadow-2xs"
                    : "hover:text-slate-900"
                }`}
              >
                Agenda
              </button>
            </div>

            {/* Refresh Button */}
            <button
              onClick={fetchEvents}
              disabled={loading}
              className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 transition-colors"
              title="Sincronizar con Google Calendar"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-[#15605A]" : ""}`} />
            </button>

            {/* Create Event Button */}
            <button
              onClick={() => openCreateModal()}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#15605A] hover:bg-[#114b46] text-white text-xs font-bold shadow-md shadow-[#15605A]/25 transition-all active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Nuevo evento</span>
            </button>
          </div>
        </header>

        {/* Error or Alert banner */}
        {error && (
          <div className="px-6 py-3 bg-amber-50 border-b border-amber-200 text-amber-900 text-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0" />
              <span>{error}</span>
            </div>
            <a
              href="/mail"
              className="text-xs font-bold text-[#15605A] hover:underline flex-shrink-0"
            >
              Ir a vincular cuenta de Google &rarr;
            </a>
          </div>
        )}

        {/* Calendar Body Area */}
        <div className="flex-1 flex overflow-hidden">
          {/* Main Calendar Matrix / View */}
          <main className="flex-1 flex flex-col h-full overflow-y-auto">
            {viewMode === "month" && (
              <div className="flex-1 flex flex-col min-w-[700px]">
                {/* Day of Week Header */}
                <div className="grid grid-cols-7 border-b border-slate-200/80 bg-slate-50/70 text-center py-2 text-xs font-bold text-slate-500 uppercase tracking-wider select-none">
                  {DAY_NAMES.map((d, idx) => (
                    <div key={idx}>{d}</div>
                  ))}
                </div>

                {/* Day Cells Grid */}
                <div className="flex-1 grid grid-cols-7 grid-rows-5 divide-x divide-y divide-slate-100 bg-white">
                  {calendarDays.map((cell, idx) => {
                    const dayEvents = getEventsForDate(cell.date);
                    const today = isToday(cell.date);

                    return (
                      <div
                        key={idx}
                        onClick={() => openCreateModal(cell.date)}
                        className={`min-h-[105px] p-1.5 flex flex-col group hover:bg-slate-50/60 transition-colors cursor-pointer ${
                          !cell.isCurrentMonth ? "bg-slate-50/40 text-slate-400" : "text-slate-800"
                        }`}
                      >
                        {/* Date Number Header */}
                        <div className="flex items-center justify-between mb-1 px-1">
                          <span
                            className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold ${
                              today
                                ? "bg-[#15605A] text-white font-bold shadow-2xs"
                                : cell.isCurrentMonth
                                ? "text-slate-800"
                                : "text-slate-400"
                            }`}
                          >
                            {cell.date.getDate()}
                          </span>

                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              openCreateModal(cell.date);
                            }}
                            className="opacity-0 group-hover:opacity-100 p-1 rounded-md text-slate-400 hover:text-[#15605A] hover:bg-slate-100 transition-opacity"
                            title="Añadir evento aquí"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>

                        {/* Events list inside cell */}
                        <div className="flex-1 space-y-1 overflow-hidden">
                          {dayEvents.slice(0, 3).map((evt) => (
                            <div
                              key={evt.id}
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedEvent(evt);
                              }}
                              className={`px-2 py-0.5 rounded-md text-[11px] font-medium truncate flex items-center gap-1.5 border shadow-2xs hover:shadow-xs transition-all ${
                                evt.meetUrl
                                  ? "bg-blue-50 text-blue-900 border-blue-200"
                                  : "bg-emerald-50 text-emerald-900 border-emerald-200"
                              }`}
                            >
                              {evt.meetUrl && (
                                <Video className="w-3 h-3 text-blue-600 flex-shrink-0" />
                              )}
                              <span className="truncate">{evt.summary}</span>
                            </div>
                          ))}

                          {dayEvents.length > 3 && (
                            <div className="text-[10px] text-slate-400 font-semibold px-1">
                              +{dayEvents.length - 3} más
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Agenda View */}
            {viewMode === "agenda" && (
              <div className="max-w-4xl w-full mx-auto p-6 space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                  <h3 className="text-base font-bold text-slate-800">
                    Próximos eventos y reuniones
                  </h3>
                  <span className="text-xs text-slate-400">
                    {filteredEvents.length} evento(s) programado(s)
                  </span>
                </div>

                {filteredEvents.length === 0 ? (
                  <div className="text-center py-16 text-slate-400">
                    <CalendarDays className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                    <p className="text-sm font-semibold text-slate-700">No hay eventos próximos</p>
                    <p className="text-xs text-slate-400 mt-1">
                      Crea un evento nuevo o sincroniza con tu cuenta de Google Calendar.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filteredEvents.map((evt) => {
                      const startDateObj = new Date(evt.start);

                      return (
                        <div
                          key={evt.id}
                          onClick={() => setSelectedEvent(evt)}
                          className="p-4 rounded-2xl border border-slate-200/90 hover:border-[#15605A]/40 bg-white shadow-2xs hover:shadow-sm transition-all flex items-start justify-between gap-4 cursor-pointer group"
                        >
                          <div className="flex items-start gap-4">
                            {/* Date Badge */}
                            <div className="w-12 h-12 rounded-xl bg-slate-50 border border-slate-200 flex flex-col items-center justify-center flex-shrink-0 text-slate-800">
                              <span className="text-[10px] font-bold uppercase text-slate-400">
                                {MONTH_NAMES[startDateObj.getMonth()]?.substring(0, 3)}
                              </span>
                              <span className="text-base font-black">
                                {startDateObj.getDate()}
                              </span>
                            </div>

                            <div className="space-y-1">
                              <h4 className="text-sm font-bold text-slate-900 group-hover:text-[#15605A] transition-colors">
                                {evt.summary}
                              </h4>

                              <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                                <span className="flex items-center gap-1">
                                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                                  {evt.isAllDay
                                    ? "Todo el día"
                                    : startDateObj.toLocaleTimeString([], {
                                        hour: "2-digit",
                                        minute: "2-digit",
                                      })}
                                </span>

                                {evt.location && (
                                  <span className="flex items-center gap-1">
                                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                                    {evt.location}
                                  </span>
                                )}

                                {evt.attendees && evt.attendees.length > 0 && (
                                  <span className="flex items-center gap-1">
                                    <Users className="w-3.5 h-3.5 text-slate-400" />
                                    {evt.attendees.length} invitado(s)
                                  </span>
                                )}
                              </div>

                              {evt.description && (
                                <p className="text-xs text-slate-500 line-clamp-1 pt-1">
                                  {evt.description}
                                </p>
                              )}
                            </div>
                          </div>

                          {/* Quick Google Meet Join Button */}
                          {evt.meetUrl && (
                            <a
                              href={evt.meetUrl}
                              target="_blank"
                              rel="noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-2xs transition-colors flex-shrink-0"
                            >
                              <Video className="w-4 h-4" />
                              <span>Unirse con Meet</span>
                            </a>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </main>
        </div>

        {/* Event Detail View Modal */}
        {selectedEvent && !isCreateModalOpen && (
          <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4 backdrop-blur-2xs">
            <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
              {/* Header */}
              <div className="h-12 bg-slate-50 px-5 flex items-center justify-between border-b border-slate-200">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Detalles del evento
                </span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => openEditModal(selectedEvent)}
                    className="p-1.5 hover:bg-slate-200 rounded-lg text-slate-600 transition-colors"
                    title="Editar evento"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteEvent(selectedEvent.id)}
                    className="p-1.5 hover:bg-red-100 rounded-lg text-slate-600 hover:text-red-600 transition-colors"
                    title="Eliminar evento"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setSelectedEvent(null)}
                    className="p-1.5 hover:bg-slate-200 rounded-lg text-slate-600 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Modal Content */}
              <div className="p-6 space-y-5">
                <div>
                  <h3 className="text-xl font-bold text-slate-900 leading-snug">
                    {selectedEvent.summary}
                  </h3>
                  <div className="flex items-center gap-2 text-xs text-slate-500 mt-2">
                    <Clock className="w-4 h-4 text-slate-400" />
                    <span>
                      {selectedEvent.isAllDay
                        ? "Todo el día"
                        : `${new Date(selectedEvent.start).toLocaleString()} - ${new Date(
                            selectedEvent.end
                          ).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`}
                    </span>
                  </div>
                </div>

                {/* Google Meet link banner */}
                {selectedEvent.meetUrl && (
                  <div className="p-4 rounded-2xl bg-blue-50/80 border border-blue-200 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center">
                        <Video className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="block text-xs font-bold text-blue-900">
                          Google Meet
                        </span>
                        <span className="block text-[11px] text-blue-700 truncate max-w-[200px]">
                          {selectedEvent.meetUrl}
                        </span>
                      </div>
                    </div>

                    <a
                      href={selectedEvent.meetUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-2xs transition-colors flex items-center gap-1"
                    >
                      <span>Unirse</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                )}

                {selectedEvent.location && (
                  <div className="flex items-start gap-2.5 text-xs text-slate-600">
                    <MapPin className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
                    <span>{selectedEvent.location}</span>
                  </div>
                )}

                {selectedEvent.description && (
                  <div className="text-xs text-slate-600 whitespace-pre-wrap bg-slate-50 p-3 rounded-xl border border-slate-100">
                    {selectedEvent.description}
                  </div>
                )}

                {selectedEvent.attendees && selectedEvent.attendees.length > 0 && (
                  <div className="pt-2">
                    <span className="text-xs font-bold text-slate-700 block mb-2">
                      Invitados ({selectedEvent.attendees.length})
                    </span>
                    <div className="space-y-1.5 max-h-36 overflow-y-auto">
                      {selectedEvent.attendees.map((att, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between text-xs py-1 px-2 rounded-lg bg-slate-50"
                        >
                          <span className="truncate text-slate-800">{att.email}</span>
                          <span className="text-[10px] text-slate-400 font-medium">
                            {att.responseStatus || "pendiente"}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Create / Edit Modal */}
        {isCreateModalOpen && (
          <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4 backdrop-blur-2xs">
            <div className="max-w-lg w-full bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
              <div className="h-12 bg-gradient-to-r from-[#15605A] to-[#1e7a72] px-5 flex items-center justify-between text-white">
                <span className="text-xs font-bold tracking-tight">
                  {modalMode === "create" ? "Nuevo Evento de Google Calendar" : "Editar Evento"}
                </span>
                <button
                  onClick={() => setIsCreateModalOpen(false)}
                  className="p-1 hover:bg-white/20 rounded-lg transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSaveEvent} className="p-6 space-y-4">
                {/* Title */}
                <div>
                  <input
                    type="text"
                    value={eventTitle}
                    onChange={(e) => setEventTitle(e.target.value)}
                    placeholder="Título del evento (ej. Reunión de equipo)"
                    required
                    className="w-full text-base font-bold text-slate-900 border-b border-slate-200 pb-2 focus:outline-none focus:border-[#15605A] placeholder-slate-400"
                  />
                </div>

                {/* Dates & Times */}
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                      Inicio
                    </label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      required
                      className="w-full p-2 rounded-xl border border-slate-200 bg-slate-50/50"
                    />
                    {!isAllDay && (
                      <input
                        type="time"
                        value={startTime}
                        onChange={(e) => setStartTime(e.target.value)}
                        className="w-full p-2 mt-1 rounded-xl border border-slate-200 bg-slate-50/50"
                      />
                    )}
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                      Fin
                    </label>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      required
                      className="w-full p-2 rounded-xl border border-slate-200 bg-slate-50/50"
                    />
                    {!isAllDay && (
                      <input
                        type="time"
                        value={endTime}
                        onChange={(e) => setEndTime(e.target.value)}
                        className="w-full p-2 mt-1 rounded-xl border border-slate-200 bg-slate-50/50"
                      />
                    )}
                  </div>
                </div>

                {/* All day toggle & Google Meet toggle */}
                <div className="flex items-center justify-between pt-1">
                  <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isAllDay}
                      onChange={(e) => setIsAllDay(e.target.checked)}
                      className="rounded text-[#15605A] focus:ring-[#15605A]"
                    />
                    <span>Todo el día</span>
                  </label>

                  <label className="flex items-center gap-2 text-xs font-semibold text-blue-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={createMeetLink}
                      onChange={(e) => setCreateMeetLink(e.target.checked)}
                      className="rounded text-blue-600 focus:ring-blue-600"
                    />
                    <Video className="w-3.5 h-3.5" />
                    <span>Videollamada Google Meet</span>
                  </label>
                </div>

                {/* Location */}
                <div>
                  <div className="flex items-center gap-2 p-2 rounded-xl border border-slate-200 bg-slate-50/50 text-xs">
                    <MapPin className="w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      placeholder="Ubicación o enlace de reunión"
                      className="flex-1 bg-transparent focus:outline-none"
                    />
                  </div>
                </div>

                {/* Attendees */}
                <div>
                  <div className="p-2 rounded-xl border border-slate-200 bg-slate-50/50 text-xs space-y-1.5">
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-slate-400" />
                      <input
                        type="text"
                        value={attendeesInput}
                        onChange={(e) => setAttendeesInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === ",") {
                            e.preventDefault();
                            const val = attendeesInput.trim().replace(/,$/, "");
                            if (val && val.includes("@") && !attendeeChips.includes(val)) {
                              setAttendeeChips([...attendeeChips, val]);
                              setAttendeesInput("");
                            }
                          }
                        }}
                        placeholder="Añadir invitados (escribe y presiona Enter)..."
                        className="flex-1 bg-transparent focus:outline-none text-slate-800"
                      />
                    </div>

                    {attendeeChips.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {attendeeChips.map((chip, idx) => (
                          <span
                            key={idx}
                            className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-200 text-slate-800 text-[11px]"
                          >
                            <span>{chip}</span>
                            <button
                              type="button"
                              onClick={() =>
                                setAttendeeChips(attendeeChips.filter((_, i) => i !== idx))
                              }
                            >
                              <X className="w-3 h-3 text-slate-500 hover:text-red-600" />
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Description */}
                <div>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Descripción o notas del evento..."
                    rows={2}
                    className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-xs text-slate-800 focus:outline-none resize-none"
                  />
                </div>

                {/* Color Selector */}
                <div className="flex items-center gap-2 pt-1">
                  <span className="text-[11px] font-semibold text-slate-500">Color:</span>
                  <div className="flex items-center gap-1.5">
                    {COLOR_PALETTE.map((col) => (
                      <button
                        key={col.id}
                        type="button"
                        onClick={() => setSelectedColor(col.id)}
                        className={`w-5 h-5 rounded-full border-2 transition-transform ${
                          col.bg.split(" ")[0]
                        } ${selectedColor === col.id ? "scale-125 border-slate-800" : "border-transparent"}`}
                        title={col.name}
                      />
                    ))}
                  </div>
                </div>

                {/* Submit button */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsCreateModalOpen(false)}
                    className="px-4 py-2 rounded-xl hover:bg-slate-100 text-slate-600 text-xs font-semibold transition-colors"
                  >
                    Cancelar
                  </button>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-5 py-2.5 rounded-xl bg-[#15605A] hover:bg-[#114b46] text-white text-xs font-bold shadow-md shadow-[#15605A]/25 transition-all disabled:opacity-60"
                  >
                    {submitting ? "Guardando en Google..." : "Guardar Evento"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </JabvoxAppLayout>
  );
}

