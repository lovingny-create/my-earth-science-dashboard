import React, { useState, useEffect } from 'react';
import Papa from 'papaparse';
import { Clock, Radio, CheckCircle2, Cloud, Sun, Utensils, Calendar, AlertCircle, Zap } from 'lucide-react';

export default function App() {
  const [grid, setGrid] = useState([]);
  const [todos, setTodos] = useState([]);
  const [weather, setWeather] = useState(null);
  const [meal, setMeal] = useState({ label: "급식", menu: "로딩 중..." });
  const [now, setNow] = useState(new Date());
  const [currentPos, setCurrentPos] = useState({ dayIdx: -1, periodIdx: -1 });

  // --- [설정 정보] ---
  const NEIS_API_KEY = "여기에_나이스_인증키를_넣으세요"; 
  const TIMETABLE_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQFJ5d-I901hCCEP0A8awuxVJNplbTWQjSt7_LO-fg6LzrEuQUDP2HoKAOHwE7YeTdnLVQ3devIeRf6/pub?gid=0&output=csv";
  const TODO_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQFJ5d-I901hCCEP0A8awuxVJNplbTWQjSt7_LO-fg6LzrEuQUDP2HoKAOHwE7YeTdnLVQ3devIeRf6/pub?gid=210287103&output=csv";
  const WEATHER_API_KEY = "9addde09be74cdb63aab8481a0a207a0"; 
  const CITY = "Gwangju";
  const SUN_IMAGE_URL = "https://suntoday.lmsal.com/suntoday/images/latest_171.jpg"; 

  useEffect(() => {
    const fetchData = () => {
      const cb = `&t=${Date.now()}`;
      Papa.parse(`${TIMETABLE_URL}${cb}`, { download: true, complete: (res) => setGrid(res.data) });
      Papa.parse(`${TODO_URL}${cb}`, { download: true, complete: (res) => {
        if (res.data) {
          const fetched = res.data.filter(row => row[0]?.trim()).map((row, idx) => ({ id: `t-${idx}`, text: row[0] }));
          setTodos(fetched);
        }
      }});
      fetch(`https://api.openweathermap.org/data/2.5/weather?q=${CITY}&appid=${WEATHER_API_KEY}&units=metric&lang=kr`)
        .then(res => res.json()).then(data => setWeather(data));
      fetchMeal();
    };

    const fetchMeal = () => {
      const d = new Date();
      const yyyymmdd = d.getFullYear() + String(d.getMonth() + 1).padStart(2, '0') + String(d.getDate()).padStart(2, '0');
      const hour = d.getHours();
      let code = "2", label = "중식";
      if (hour < 9) { code = "1"; label = "조식"; } else if (hour >= 14) { code = "3"; label = "석식"; }

      fetch(`https://open.neis.go.kr/hub/mealServiceDietInfo?KEY=${NEIS_API_KEY}&Type=json&ATPT_OFCDC_SC_CODE=F10&SD_SCHUL_CODE=7380024&MLSV_YMD=${yyyymmdd}`)
        .then(res => res.json())
        .then(data => {
          if (data.mealServiceDietInfo) {
            const row = data.mealServiceDietInfo[1].row.find(r => r.MMEAL_SC_CODE === code) || data.mealServiceDietInfo[1].row[0];
            setMeal({ label: row.MMEAL_SC_NM, menu: row.DDISH_NM.replace(/[0-9.()]/g, "").replace(/<br\/>/g, ", ") });
          } else { setMeal({ label, menu: "식단 정보 대기 중🍱" }); }
        }).catch(() => setMeal({ label, menu: "급식 로딩 실패" }));
    };

    const updateTime = () => {
      const d = new Date(); setNow(d);
      const time = d.getHours() * 100 + d.getMinutes();
      let p = -1;
      if (time >= 850 && time < 950) p = 1;
      else if (time >= 950 && time < 1050) p = 2;
      else if (time >= 1050 && time < 1150) p = 3;
      else if (time >= 1150 && time < 1320) p = 4;
      else if (time >= 1320 && time < 1420) p = 5;
      else if (time >= 1420 && time < 1510) p = 6;
      else if (time >= 1510 && time < 1610) p = 7;
      setCurrentPos({ dayIdx: d.getDay(), periodIdx: p });
    };

    fetchData(); updateTime();
    const t1 = setInterval(fetchData, 60000); const t2 = setInterval(updateTime, 1000);
    return () => { clearInterval(t1); clearInterval(t2); };
  }, []);

  return (
    <div className="min-h-screen bg-[#020617] text-slate-200 p-10 grid grid-cols-12 gap-10 font-sans relative overflow-hidden">
      
      {/* 배경 장식: 우주 느낌의 그라데이션 */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-900/20 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-900/20 rounded-full blur-[120px] pointer-events-none"></div>

      {/* 1. 사이드바 (좌측) */}
      <div className="col-span-3 flex flex-col gap-8 z-10">
        <section className="bg-white/5 backdrop-blur-xl p-10 rounded-[2.5rem] border border-white/10 shadow-[0_8px_32px_0_rgba(0,0,0,0.8)] text-center transition-all hover:bg-white/10">
          <h1 className="text-7xl font-black text-white tracking-tighter drop-shadow-lg">
            {now.toLocaleTimeString('ko-KR', { hour12: false, hour: '2-digit', minute: '2-digit' })}
          </h1>
          <p className="text-blue-400 font-bold mt-4 text-lg uppercase tracking-[0.2em]">
            {now.toLocaleDateString('ko-KR', { month: 'long', day: 'numeric', weekday: 'short' })}
          </p>
        </section>

        <section className="bg-white/5 backdrop-blur-md p-8 rounded-[2rem] border border-white/10 flex items-center justify-between shadow-xl transition-all hover:scale-[1.02]">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-sky-500/20 rounded-2xl"><Cloud size={40} className="text-sky-400" /></div>
            <div>
              <p className="text-slate-400 text-sm font-bold uppercase tracking-widest">Weather</p>
              <p className="text-2xl font-black text-white capitalize">{weather?.weather?.[0]?.description || "맑음"}</p>
            </div>
          </div>
          <p className="text-5xl font-black text-white">{weather?.main ? Math.round(weather.main.temp) : '--'}°</p>
        </section>

        <section className="bg-gradient-to-br from-amber-500/10 to-orange-600/5 backdrop-blur-md p-8 rounded-[2rem] border border-amber-500/20 flex-1 flex flex-col shadow-xl">
          <h3 className="text-xl font-black text-amber-400 mb-6 flex items-center gap-3 underline decoration-amber-500/30 underline-offset-8">
            <Utensils size={24} /> {meal.label}
          </h3>
          <p className="text-lg font-bold leading-relaxed text-slate-200 italic">"{meal.menu}"</p>
        </section>

        <section className="bg-black/40 backdrop-blur-md p-5 rounded-[2rem] border border-red-500/20 shadow-2xl overflow-hidden group">
          <h3 className="text-xs font-black text-red-500/80 mb-4 flex items-center gap-2 tracking-[0.3em] uppercase">
            <Zap size={14} className="animate-pulse" /> SDO Live Monitor
          </h3>
          <div className="rounded-2xl overflow-hidden aspect-square border border-white/5">
            <img 
              src={`${SUN_IMAGE_URL}?t=${Date.now()}`} 
              className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-125"
              alt="Sun"
              onError={(e) => { e.target.style.display = 'none'; }}
            />
          </div>
        </section>
      </div>

      {/* 2. 중앙 (시간표) */}
      <main className="col-span-6 bg-white/5 backdrop-blur-2xl rounded-[3rem] border border-white/10 p-12 flex flex-col shadow-[-20px_20px_50px_rgba(0,0,0,0.5)] z-10">
        <header className="flex justify-between items-end mb-12">
          <div>
            <h2 className="text-4xl font-black text-white flex items-center gap-4 tracking-tight">
              <span className="w-4 h-4 bg-red-500 rounded-full animate-ping"></span> 지구과학실 스테이션
            </h2>
            <p className="text-slate-500 font-bold mt-2 ml-8 tracking-widest uppercase text-sm">Real-time Class Dashboard</p>
          </div>
          <div className="flex gap-2">
            {[1, 2, 3].map(i => <div key={i} className="w-2 h-2 rounded-full bg-slate-700"></div>)}
          </div>
        </header>

        <div className="flex-1 grid grid-cols-6 gap-6">
          <div />
          {["MON", "TUE", "WED", "THU", "FRI"].map((d, i) => (
            <div key={d} className={`text-center text-sm font-black tracking-[0.3em] ${currentPos.dayIdx === i + 1 ? "text-blue-400" : "text-slate-600"}`}>{d}</div>
          ))}
          {[1, 2, 3, 4, 5, 6, 7].map(p => (
            <React.Fragment key={p}>
              <div className="flex items-center justify-center font-black text-2xl text-slate-700">{p}</div>
              {[1, 2, 3, 4, 5].map(d => {
                const teacher = grid[p]?.[d] || "";
                const isActive = currentPos.dayIdx === d && currentPos.periodIdx === p;
                return (
                  <div key={`${d}-${p}`} className={`flex items-center justify-center rounded-3xl text-xl font-bold transition-all duration-500 border ${isActive ? "bg-white text-black border-white shadow-[0_0_50px_rgba(255,255,255,0.3)] z-20 scale-110 rotate-[-1deg]" : "bg-white/5 border-white/5 text-slate-500 hover:border-white/20 hover:bg-white/10"}`}>
                    {teacher}
                  </div>
                );
              })}
            </React.Fragment>
          ))}
        </div>
      </main>

      {/* 3. 우측 (TODO LIST) */}
      <aside className="col-span-3 bg-white/5 backdrop-blur-md rounded-[2.5rem] border border-white/10 p-10 flex flex-col shadow-2xl z-10">
        <h3 className="text-2xl font-black text-white mb-10 flex items-center gap-4">
          <div className="p-2 bg-indigo-500/20 rounded-xl"><CheckCircle2 size={28} className="text-indigo-400" /></div>
          TODO LIST
        </h3>
        <div className="flex-1 overflow-y-auto space-y-6 pr-2 custom-scrollbar">
          {todos.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center opacity-30">
              <Calendar size={60} className="text-slate-600 mb-4" />
              <p className="font-bold text-slate-500">No Pending Tasks</p>
            </div>
          ) : (
            todos.map(t => (
              <div key={t.id} className="group p-6 rounded-[1.5rem] bg-white/5 border border-white/5 transition-all hover:border-indigo-500/50 hover:bg-indigo-500/5 shadow-sm">
                <p className="text-slate-300 font-bold text-lg group-hover:text-white transition-colors">{t.text}</p>
                <div className="w-10 h-1 bg-indigo-500/30 mt-4 rounded-full transition-all group-hover:w-full"></div>
              </div>
            ))
          )}
        </div>
        <footer className="mt-8 pt-8 border-t border-white/5 text-[10px] text-slate-600 font-black text-center tracking-[0.4em] uppercase">
          Station Control v3.0
        </footer>
      </aside>
    </div>
  );
}
