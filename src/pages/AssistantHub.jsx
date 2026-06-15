import { useContext, useState, useMemo } from "react";
import { FarmContext } from "../context/FarmContext";
import { ALERT_ICONS, ALERT_SEVERITY, formatAlertTime } from "../utils/farmAssistant.js";

/* ─── Calendar helpers (unchanged) ─── */
const DAYS = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];
const MONTHS = ["January","February","March","April","May","June",
                "July","August","September","October","November","December"];

function buildCalendarDays(year, month) {
  const firstDay  = new Date(year, month, 1);
  const lastDay   = new Date(year, month + 1, 0);
  const startDow  = (firstDay.getDay() + 6) % 7;
  const totalDays = lastDay.getDate();
  const days      = [];
  const prevLast  = new Date(year, month, 0).getDate();
  for (let i = startDow - 1; i >= 0; i--)
    days.push({ date: new Date(year, month - 1, prevLast - i), current: false });
  for (let d = 1; d <= totalDays; d++)
    days.push({ date: new Date(year, month, d), current: true });
  const remainder = (7 - (days.length % 7)) % 7;
  for (let d = 1; d <= remainder; d++)
    days.push({ date: new Date(year, month + 1, d), current: false });
  return days;
}

function toDateKey(date) {
  return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,"0")}-${String(date.getDate()).padStart(2,"0")}`;
}

function isToday(date) {
  const t = new Date();
  return date.getDate()===t.getDate() && date.getMonth()===t.getMonth() && date.getFullYear()===t.getFullYear();
}

function isPast(dateStr) {
  const t = new Date(); t.setHours(0,0,0,0);
  return new Date(dateStr+"T00:00:00") < t;
}

/* ─── Activity category config ─── */
const CATEGORIES = [
  { label:"General",       icon:"📋", dot:"bg-blue-500",    badge:"bg-blue-100 text-blue-700"      },
  { label:"Medical",       icon:"💊", dot:"bg-red-500",     badge:"bg-red-100 text-red-700"        },
  { label:"Vaccination",   icon:"💉", dot:"bg-purple-500",  badge:"bg-purple-100 text-purple-700"  },
  { label:"Feeding",       icon:"🌾", dot:"bg-green-500",   badge:"bg-green-100 text-green-700"    },
  { label:"Breeding",      icon:"🐄", dot:"bg-pink-500",    badge:"bg-pink-100 text-pink-700"      },
  { label:"Planting",      icon:"🌱", dot:"bg-lime-500",    badge:"bg-lime-100 text-lime-700"      },
  { label:"Harvesting",    icon:"🚜", dot:"bg-amber-500",   badge:"bg-amber-100 text-amber-700"    },
  { label:"Spraying",      icon:"💦", dot:"bg-cyan-500",    badge:"bg-cyan-100 text-cyan-700"      },
  { label:"Hoof/Shearing", icon:"✂️", dot:"bg-orange-500",  badge:"bg-orange-100 text-orange-700"  },
  { label:"Other",         icon:"⚙️", dot:"bg-gray-400",    badge:"bg-gray-100 text-gray-600"      },
];

function getCat(label) {
  return CATEGORIES.find((c) => c.label === label) || CATEGORIES[0];
}

const PRIORITIES = ["Low","Medium","High"];
const PRIORITY_STYLE = {
  Low:    "bg-green-100 text-green-700",
  Medium: "bg-yellow-100 text-yellow-700",
  High:   "bg-red-100 text-red-700",
};

const BORDER_COLORS = {
  General: "border-blue-500",
  Medical: "border-red-500",
  Vaccination: "border-purple-500",
  Feeding: "border-green-500",
  Breeding: "border-pink-500",
  Planting: "border-lime-500",
  Harvesting: "border-amber-500",
  Spraying: "border-cyan-500",
  "Hoof/Shearing": "border-orange-500",
  Other: "border-gray-400",
};

/* ─── Modal wrapper ─── */
function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[92vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b sticky top-0 bg-white z-10">
          <h3 className="text-lg font-bold text-gray-900">{title}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

const F = ({ label, children }) => (
  <div className="mb-4">
    <label className="block text-xs font-semibold text-gray-500 uppercase mb-1.5">{label}</label>
    {children}
  </div>
);

/* ═══════════════════════════════════════════
   MAIN COMPONENT
═══════════════════════════════════════════ */
export default function AssistantHub() {
  const {
    alerts, activities,
    dismissAlert, dismissedAlerts, undismissAlert,
    completeActivity, deleteActivity, addActivity,
  } = useContext(FarmContext);

  const [activeTab,     setActiveTab]     = useState("calendar");
  const [showDismissed, setShowDismissed] = useState(false);

  /* ─── Calendar state ─── */
  const today = new Date();
  const [viewYear,    setViewYear]    = useState(today.getFullYear());
  const [viewMonth,   setViewMonth]   = useState(today.getMonth());
  const [selectedDay, setSelectedDay] = useState(toDateKey(today));
  const [showAddModal,setShowAddModal]= useState(false);

  /* ─── Add activity form ─── */
  const EMPTY = { task:"", dueDate:"", category:"General", priority:"Medium", description:"" };
  const [form, setForm] = useState(EMPTY);
  const uf = (f) => (e) => setForm((p) => ({ ...p, [f]: e.target.value }));

  const openAdd = (dateKey) => {
    setForm({ ...EMPTY, dueDate: dateKey });
    setShowAddModal(true);
  };

  const submitAdd = () => {
    if (!form.task.trim() || !form.dueDate) return;
    addActivity({ ...form, task: form.task.trim() });
    setShowAddModal(false);
    setForm(EMPTY);
    setSelectedDay(form.dueDate);
  };

  /* ─── Alert helpers (unchanged) ─── */
  const activeAlerts       = alerts.filter((a) => !dismissedAlerts.includes(a.id));
  const dismissedAlertsList= alerts.filter((a) =>  dismissedAlerts.includes(a.id));
  const alertsBySeverity   = {
    critical: activeAlerts.filter((a) => a.severity === ALERT_SEVERITY.CRITICAL),
    high:     activeAlerts.filter((a) => a.severity === ALERT_SEVERITY.HIGH),
    medium:   activeAlerts.filter((a) => a.severity === ALERT_SEVERITY.MEDIUM),
    low:      activeAlerts.filter((a) => a.severity === ALERT_SEVERITY.LOW),
  };
  const pendingActivities   = activities.filter((a) => !a.completed);
  const completedActivities = activities.filter((a) =>  a.completed);

  const getSeverityColor = (s) =>
    s===ALERT_SEVERITY.CRITICAL?"bg-red-100 border-red-300":
    s===ALERT_SEVERITY.HIGH    ?"bg-orange-100 border-orange-300":
    s===ALERT_SEVERITY.MEDIUM  ?"bg-yellow-100 border-yellow-300":"bg-blue-100 border-blue-300";

  const getSeverityBadgeColor = (s) =>
    s===ALERT_SEVERITY.CRITICAL?"bg-red-500":
    s===ALERT_SEVERITY.HIGH    ?"bg-orange-500":
    s===ALERT_SEVERITY.MEDIUM  ?"bg-yellow-500":"bg-blue-500";

  /* ─── Calendar maps ─── */
  const activityMap = useMemo(() => {
    const map = {};
    activities.forEach((a) => {
      if (!a.dueDate) return;
      const key = a.dueDate.slice(0, 10);
      if (!map[key]) map[key] = [];
      map[key].push(a);
    });
    return map;
  }, [activities]);

  const calDays = useMemo(() => buildCalendarDays(viewYear, viewMonth), [viewYear, viewMonth]);

  const selectedDayActivities = activityMap[selectedDay] || [];

  const selectedDateLabel = selectedDay
    ? new Date(selectedDay+"T12:00:00").toLocaleDateString("en-US",
        { weekday:"long", day:"numeric", month:"long", year:"numeric" })
    : "";

  /* ─── Upcoming (next 14 days) ─── */
  const upcoming = useMemo(() => {
    const now = new Date(); now.setHours(0,0,0,0);
    const end = new Date(); end.setDate(end.getDate()+14);
    return [...activities]
      .filter((a) => !a.completed && a.dueDate && new Date(a.dueDate+"T00:00:00") >= now && new Date(a.dueDate+"T00:00:00") <= end)
      .sort((a,b) => a.dueDate.localeCompare(b.dueDate));
  }, [activities]);

  const prevMonth = () => viewMonth===0 ? (setViewMonth(11),setViewYear(y=>y-1)) : setViewMonth(m=>m-1);
  const nextMonth = () => viewMonth===11? (setViewMonth(0), setViewYear(y=>y+1)) : setViewMonth(m=>m+1);
  const goToday   = () => { setViewYear(today.getFullYear()); setViewMonth(today.getMonth()); setSelectedDay(toDateKey(today)); };

  /* ─── Month activities count ─── */
  const monthActCount = activities.filter((a) => {
    if (!a.dueDate) return false;
    const d = new Date(a.dueDate);
    return d.getMonth()===viewMonth && d.getFullYear()===viewYear;
  }).length;

  /* ─── Render helpers (unchanged logic, minor style tweaks) ─── */
  const renderAlertsList = (list) => {
    if (!list.length)
      return <div className="text-center py-8 text-gray-500"><p className="text-lg">No alerts</p></div>;
    return (
      <div className="space-y-3">
        {list.map((alert) => (
          <div key={alert.id} className={`border-l-4 p-4 rounded shadow-sm ${getSeverityColor(alert.severity)}`}>
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xl">{ALERT_ICONS[alert.type]||"ℹ️"}</span>
                  <h4 className="font-semibold text-gray-800">{alert.title}</h4>
                  <span className={`text-xs px-2 py-1 rounded text-white ${getSeverityBadgeColor(alert.severity)}`}>{alert.severity.toUpperCase()}</span>
                </div>
                <p className="text-sm text-gray-700">{alert.description}</p>
                <p className="text-xs text-gray-500 mt-2">{formatAlertTime(alert.createdAt)}</p>
              </div>
              <button onClick={()=>dismissAlert(alert.id)} className="px-3 py-1 text-sm bg-white border border-gray-300 rounded hover:bg-gray-100 transition whitespace-nowrap">Dismiss</button>
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderActivitiesList = (list) => {
    if (!list.length)
      return <div className="text-center py-8 text-gray-500"><p className="text-lg">No {list===completedActivities?"completed":"pending"} activities</p></div>;
    return (
      <div className="space-y-3">
        {list.map((activity) => {
          const isCompleted = activity.completed;
          const todayStr    = new Date().toISOString().split("T")[0];
          const isOverdue   = !isCompleted && activity.dueDate < todayStr;
          const cat         = getCat(activity.category);
          return (
            <div key={activity.id} className={`border-l-4 p-4 rounded shadow-sm ${isCompleted?"bg-green-50 border-green-300":isOverdue?"bg-red-50 border-red-300":"bg-blue-50 border-blue-300"}`}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="text-xl">{isCompleted?"✅":isOverdue?"⚠️":cat.icon}</span>
                    <h4 className={`font-semibold ${isCompleted?"line-through text-gray-500":"text-gray-800"}`}>{activity.task}</h4>
                    {activity.category&&<span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${cat.badge}`}>{activity.category}</span>}
                    {activity.priority&&<span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${PRIORITY_STYLE[activity.priority]||PRIORITY_STYLE.Medium}`}>{activity.priority} Priority</span>}
                  </div>
                  {activity.description&&<p className="text-sm text-gray-700 ml-7">{activity.description}</p>}
                  <div className="flex items-center gap-4 mt-2 ml-7 text-xs text-gray-600">
                    <span>📅 Due: <strong>{activity.dueDate}</strong></span>
                  </div>
                </div>
                <div className="flex gap-2">
                  {!isCompleted&&<button onClick={()=>completeActivity(activity.id)} className="px-3 py-1 text-sm bg-green-500 text-white rounded hover:bg-green-600 transition whitespace-nowrap">Complete</button>}
                  <button onClick={()=>deleteActivity(activity.id)} className="px-3 py-1 text-sm bg-red-500 text-white rounded hover:bg-red-600 transition whitespace-nowrap">Delete</button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  /* ══════════════════════════════════════════
     RENDER
  ══════════════════════════════════════════ */
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">🤖 Farm Assistant</h1>
          <p className="text-gray-600">Your intelligent farming companion. Monitoring activities, health, production, and more.</p>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4"><div className="text-2xl font-bold text-red-600">{alertsBySeverity.critical.length}</div><div className="text-sm text-gray-700">Critical Alerts</div></div>
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4"><div className="text-2xl font-bold text-orange-600">{alertsBySeverity.high.length}</div><div className="text-sm text-gray-700">High Priority</div></div>
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4"><div className="text-2xl font-bold text-yellow-600">{alertsBySeverity.medium.length}</div><div className="text-sm text-gray-700">Medium Priority</div></div>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4"><div className="text-2xl font-bold text-blue-600">{pendingActivities.length}</div><div className="text-sm text-gray-700">Pending Activities</div></div>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 mb-6 border-b border-gray-200">
          {[
            { id:"calendar",   label:`Calendar (${activities.length})` },
            { id:"alerts",     label:`Alerts (${activeAlerts.length})` },
            { id:"activities", label:`Activities (${pendingActivities.length})` },
          ].map((t)=>(
            <button key={t.id} onClick={()=>setActiveTab(t.id)}
              className={`px-4 py-3 font-semibold border-b-2 transition ${activeTab===t.id?"border-green-600 text-green-600":"border-transparent text-gray-600 hover:text-gray-900"}`}>
              {t.label}
            </button>
          ))}
        </div>

        {/* ══ CALENDAR TAB ══ */}
        {activeTab==="calendar"&&(
          <div className="grid xl:grid-cols-3 gap-6">

            {/* ── Calendar grid ── */}
            <div className="xl:col-span-2 bg-white rounded-2xl shadow overflow-hidden">

              {/* Month nav */}
              <div className="flex items-center justify-between px-5 py-4 bg-green-700 text-white">
                <button onClick={prevMonth} className="w-9 h-9 rounded-full hover:bg-white/20 flex items-center justify-center transition text-lg font-bold">←</button>
                <div className="text-center">
                  <h2 className="text-lg font-bold">{MONTHS[viewMonth]} {viewYear}</h2>
                  <p className="text-green-300 text-xs">{monthActCount} activit{monthActCount!==1?"ies":"y"} this month</p>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={goToday} className="text-xs bg-white/20 hover:bg-white/30 px-3 py-1 rounded-full font-semibold transition">Today</button>
                  <button onClick={nextMonth} className="w-9 h-9 rounded-full hover:bg-white/20 flex items-center justify-center transition text-lg font-bold">→</button>
                </div>
              </div>

              {/* Day headers */}
              <div className="grid grid-cols-7 border-b bg-gray-50">
                {DAYS.map((d)=>(
                  <div key={d} className="text-center text-xs font-bold text-gray-400 uppercase py-2.5">{d}</div>
                ))}
              </div>

              {/* Day grid */}
              <div className="grid grid-cols-7">
                {calDays.map(({date,current},idx)=>{
                  const key       = toDateKey(date);
                  const dayActs   = activityMap[key]||[];
                  const isSel     = key===selectedDay;
                  const isTod     = isToday(date);
                  const showDots  = dayActs.slice(0,3);
                  const extraCnt  = dayActs.length-3;

                  return (
                    <button key={idx} onClick={()=>setSelectedDay(key)}
                      className={`relative min-h-[80px] p-1.5 text-left border-b border-r border-gray-100 transition group
                        ${!current?"bg-gray-50/80":"bg-white hover:bg-green-50/60"}
                        ${isSel?"ring-2 ring-inset ring-green-500 bg-green-50":""}
                      `}>

                      {/* Date number */}
                      <div className={`w-7 h-7 flex items-center justify-center rounded-full text-sm font-semibold mb-1
                        ${isTod?"bg-green-600 text-white shadow":""}
                        ${!isTod&&isSel?"text-green-700 font-bold":""}
                        ${!isTod&&!isSel&&current?"text-gray-700":""}
                        ${!current?"text-gray-300":""}
                      `}>
                        {date.getDate()}
                      </div>

                      {/* Activity chips */}
                      <div className="flex flex-col gap-0.5">
                        {showDots.map((a,i)=>{
                          const c=getCat(a.category);
                          return (
                            <div key={i} className={`text-xs px-1 py-0.5 rounded truncate leading-tight font-medium ${c.badge}`}
                              style={{fontSize:"9px"}}>
                              {c.icon} {a.task}
                            </div>
                          );
                        })}
                        {extraCnt>0&&<div className="text-gray-400 font-semibold px-1" style={{fontSize:"9px"}}>+{extraCnt} more</div>}
                      </div>

                      {/* Quick-add "+" on hover */}
                      {current&&(
                        <div onClick={(e)=>{e.stopPropagation();openAdd(key);}}
                          className="absolute bottom-1 right-1 w-5 h-5 bg-green-500 text-white rounded-full flex items-center justify-center text-xs font-bold opacity-0 group-hover:opacity-100 transition hover:bg-green-600">
                          +
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Category legend */}
              <div className="px-5 py-3 border-t flex flex-wrap gap-3 bg-gray-50">
                {CATEGORIES.slice(0,8).map((c)=>(
                  <div key={c.label} className="flex items-center gap-1.5 text-xs text-gray-500">
                    <div className={`w-2 h-2 rounded-full ${c.dot}`}/>
                    {c.label}
                  </div>
                ))}
              </div>
            </div>

            {/* ── Right panel ── */}
            <div className="flex flex-col gap-4">

              {/* Selected day header */}
              <div className="bg-white rounded-2xl shadow p-5">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div>
                    <p className="text-xs font-bold text-gray-400 uppercase mb-0.5">Selected Day</p>
                    <h3 className="text-sm font-bold text-gray-900 leading-tight">{selectedDateLabel}</h3>
                    <p className="text-sm text-gray-400 mt-0.5">
                      {selectedDayActivities.length===0?"No activities planned":`${selectedDayActivities.length} activit${selectedDayActivities.length!==1?"ies":"y"}`}
                    </p>
                  </div>
                  <button onClick={()=>openAdd(selectedDay)}
                    className="shrink-0 bg-green-600 hover:bg-green-700 text-white text-xs font-bold px-4 py-2 rounded-xl transition flex items-center gap-1">
                    <span className="text-base leading-none">+</span> Add
                  </button>
                </div>

                {/* Day activities */}
                {selectedDayActivities.length===0
                  ? <div className="text-center py-6 text-gray-400">
                      <p className="text-3xl mb-2">📅</p>
                      <p className="text-sm">Nothing planned.</p>
                      <button onClick={()=>openAdd(selectedDay)} className="mt-2 text-green-600 hover:text-green-700 text-sm font-semibold">+ Plan an activity</button>
                    </div>
                  : <div className="space-y-2 max-h-72 overflow-y-auto">
                      {selectedDayActivities.map((a)=>{
                        const cat=getCat(a.category);
                        const overdue=!a.completed&&isPast(a.dueDate);
                        return (
                          <div key={a.id} className={`rounded-xl p-3 border-l-4 ${a.completed?"border-green-400 bg-green-50":overdue?"border-red-400 bg-red-50":`${BORDER_COLORS[a.category]||"border-blue-500"} bg-gray-50`}`}>
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-1.5 flex-wrap mb-0.5">
                                  <span className="text-sm">{a.completed?"✅":overdue?"⚠️":cat.icon}</span>
                                  <span className={`text-sm font-semibold ${a.completed?"line-through text-gray-400":"text-gray-800"} truncate`}>{a.task}</span>
                                </div>
                                <div className="flex gap-2 flex-wrap">
                                  {a.category&&<span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${cat.badge}`}>{a.category}</span>}
                                  {a.priority&&<span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${PRIORITY_STYLE[a.priority]||PRIORITY_STYLE.Medium}`}>{a.priority}</span>}
                                </div>
                                {a.description&&<p className="text-xs text-gray-500 mt-0.5 italic">{a.description}</p>}
                              </div>
                              <div className="flex flex-col gap-1 shrink-0">
                                {!a.completed&&<button onClick={()=>completeActivity(a.id)} className="text-xs bg-green-500 text-white px-2 py-1 rounded-lg hover:bg-green-600 transition">✓</button>}
                                <button onClick={()=>deleteActivity(a.id)} className="text-xs bg-red-400 text-white px-2 py-1 rounded-lg hover:bg-red-500 transition">✕</button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>}
              </div>

              {/* Upcoming 14 days */}
              <div className="bg-white rounded-2xl shadow p-4">
                <p className="text-xs font-bold text-gray-500 uppercase mb-3">Upcoming 14 days</p>
                {upcoming.length===0
                  ? <p className="text-gray-400 text-sm text-center py-4">Nothing coming up.</p>
                  : <div className="space-y-2 max-h-64 overflow-y-auto">
                      {upcoming.map((a)=>{
                        const cat=getCat(a.category);
                        const d=new Date(a.dueDate+"T12:00:00");
                        const isTod=isToday(d);
                        const daysAway=Math.ceil((d-new Date())/86400000);
                        return (
                          <button key={a.id} onClick={()=>{setSelectedDay(a.dueDate.slice(0,10));setViewMonth(d.getMonth());setViewYear(d.getFullYear());}}
                            className="w-full flex items-center gap-3 text-left hover:bg-gray-50 rounded-xl p-2 transition">
                            <div className={`w-2 h-2 rounded-full shrink-0 ${cat.dot}`}/>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold text-gray-800 truncate">{a.task}</p>
                              <p className="text-xs text-gray-400">{d.toLocaleDateString("en-US",{month:"short",day:"numeric"})}</p>
                            </div>
                            <span className={`text-xs font-bold shrink-0 ${isTod?"text-green-600":daysAway<=3?"text-amber-600":"text-gray-400"}`}>
                              {isTod?"Today":`${daysAway}d`}
                            </span>
                          </button>
                        );
                      })}
                    </div>}
              </div>
            </div>
          </div>
        )}

        {/* ══ ALERTS TAB (unchanged) ══ */}
        {activeTab==="alerts"&&(
          <div className="bg-white rounded-lg shadow p-6">
            {alertsBySeverity.critical.length>0&&<div className="mb-6"><h3 className="text-lg font-bold text-red-600 mb-4 flex items-center gap-2"><span>🚨</span> CRITICAL ALERTS</h3>{renderAlertsList(alertsBySeverity.critical)}</div>}
            {alertsBySeverity.high.length>0&&<div className="mb-6"><h3 className="text-lg font-bold text-orange-600 mb-4 flex items-center gap-2"><span>⚠️</span> High Priority</h3>{renderAlertsList(alertsBySeverity.high)}</div>}
            {alertsBySeverity.medium.length>0&&<div className="mb-6"><h3 className="text-lg font-bold text-yellow-600 mb-4">Medium Priority</h3>{renderAlertsList(alertsBySeverity.medium)}</div>}
            {alertsBySeverity.low.length>0&&<div className="mb-6"><h3 className="text-lg font-bold text-blue-600 mb-4">Low Priority</h3>{renderAlertsList(alertsBySeverity.low)}</div>}
            {activeAlerts.length===0&&<div className="text-center py-12"><div className="text-5xl mb-4">✨</div><p className="text-xl text-gray-600">All clear! No active alerts.</p></div>}
            {dismissedAlertsList.length>0&&(
              <div className="mt-8 border-t pt-6">
                <button onClick={()=>setShowDismissed(!showDismissed)} className="text-sm text-gray-600 hover:text-gray-900 font-semibold flex items-center gap-2">
                  <span>{showDismissed?"▼":"▶"}</span> Dismissed Alerts ({dismissedAlertsList.length})
                </button>
                {showDismissed&&(
                  <div className="mt-4 space-y-3 opacity-60">
                    {dismissedAlertsList.map((alert)=>(
                      <div key={alert.id} className="border-l-4 border-gray-300 p-4 rounded bg-gray-50 flex items-center justify-between">
                        <p className="text-sm text-gray-600 line-through">{alert.title}</p>
                        <button onClick={()=>undismissAlert(alert.id)} className="text-xs px-2 py-1 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 transition">Restore</button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ══ ACTIVITIES TAB (unchanged) ══ */}
        {activeTab==="activities"&&(
          <div className="space-y-8">
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4">📋 Pending Activities</h3>
              {renderActivitiesList(pendingActivities)}
            </div>
            {completedActivities.length>0&&(
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-4">✅ Completed Activities</h3>
                {renderActivitiesList(completedActivities)}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ══ ADD ACTIVITY MODAL ══ */}
      {showAddModal&&(
        <Modal title={`Plan Activity — ${form.dueDate ? new Date(form.dueDate+"T12:00:00").toLocaleDateString("en-US",{weekday:"long",month:"long",day:"numeric"}) : ""}`} onClose={()=>setShowAddModal(false)}>

          <F label="Task / Activity Name">
            <input value={form.task} onChange={uf("task")}
              placeholder="e.g. Vaccinate dairy herd, Feed lambs, Apply fertilizer"
              className="w-full border-2 border-gray-100 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-green-400 transition"/>
          </F>

          <F label="Due Date">
            <input type="date" value={form.dueDate} onChange={uf("dueDate")}
              className="w-full border-2 border-gray-100 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-green-400 transition"/>
          </F>

          <F label="Category">
            <div className="grid grid-cols-2 gap-2">
              {CATEGORIES.map((c)=>(
                <button key={c.label} type="button" onClick={()=>setForm(p=>({...p,category:c.label}))}
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-sm text-left transition
                    ${form.category===c.label?`${c.badge} border-current font-semibold`:"bg-gray-50 border-gray-200 hover:border-gray-400"}`}>
                  <span>{c.icon}</span><span className="truncate">{c.label}</span>
                </button>
              ))}
            </div>
          </F>

          <F label="Priority">
            <div className="flex gap-2">
              {PRIORITIES.map((p)=>(
                <button key={p} type="button" onClick={()=>setForm(prev=>({...prev,priority:p}))}
                  className={`flex-1 py-2 rounded-xl border text-sm font-semibold transition
                    ${form.priority===p?PRIORITY_STYLE[p]+" border-current":"bg-gray-50 border-gray-200 hover:border-gray-400"}`}>
                  {p}
                </button>
              ))}
            </div>
          </F>

          <F label="Description (optional)">
            <textarea value={form.description} onChange={uf("description")}
              placeholder="Additional details about this activity..."
              className="w-full border-2 border-gray-100 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-green-400 transition resize-none h-20"/>
          </F>

          {/* Preview */}
          {form.task&&form.dueDate&&(
            <div className={`${getCat(form.category).badge} rounded-xl p-3 mb-3 text-sm flex items-center gap-2`}>
              <span>{getCat(form.category).icon}</span>
              <span><strong>{form.task}</strong> — {new Date(form.dueDate+"T12:00:00").toLocaleDateString("en-US",{weekday:"short",month:"short",day:"numeric"})}</span>
              <span className={`ml-auto text-xs font-semibold px-2 py-0.5 rounded-full ${PRIORITY_STYLE[form.priority]}`}>{form.priority}</span>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button onClick={submitAdd} disabled={!form.task.trim()||!form.dueDate}
              className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold py-2.5 rounded-xl transition">
              Save Activity
            </button>
            <button onClick={()=>setShowAddModal(false)} className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-2.5 rounded-xl transition">
              Cancel
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
