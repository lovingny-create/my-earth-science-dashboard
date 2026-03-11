import React, { useState, useEffect } from 'react';
import Papa from 'papaparse';
import { Clock, Radio, CheckCircle2, Cloud, Sun, Utensils, Calendar, LayoutGrid, AlertCircle } from 'lucide-react';

export default function App() {
  const [grid, setGrid] = useState([]);
  const [todos, setTodos] = useState([]);
  const [weather, setWeather] = useState(null);
  const [meal, setMeal] = useState({ label: "급식", menu: "로딩 중..." });
  const [now, setNow] = useState(new Date());
  const [currentPos, setCurrentPos] = useState({ dayIdx: -1, periodIdx: -1 });

  // --- [환경 설정] ---
  const NEIS_API_KEY = "5bfe4967b9b64a3fb1693f1cc5371d50"; // 선생님의 인증키를 확인해 주세요
  const TIMETABLE_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vSfFMWDov9yz7QPfJOrdu15kgAdzhpJ-kMkn1zW6QjiRUzAecmNh4sPO9C3HzYmmlhl5xS5su3EWQSy/pub?gid=0&single=true&output=csv";
  const TODO_URL = "  const TODO_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQFJ5d-I901hCCEPOA8awuxvJNpIbTWQjSt7_L0-fg6LzrEuQUDP2HoKAOHwE7YeTdnLVQ3devIeRf6/pub?gid=0&single=true&output=csv";
";
  const WEATHER_API_KEY = "9addde09be74cdb63aab8481a0a207a0"; 
  const CITY = "Gwangju";

  useEffect(() => {
    const fetchData = () => {
      const cb = `&t=${Date.now()}`;
      Papa.parse(`${TIMETABLE_URL}${cb}`, { download: true, complete: (res) => { if (res.data) setGrid(res.data); } });
      Papa.parse(`${TODO_URL}${cb}`, { download: true, complete: (res) => {
        if (res.data) {
          const fetched = res.data.filter(row => row[0]?.trim()).map((row, idx) => ({ id: `todo-${idx}`, text: row[0] }));
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
      let code = "2", label = "점심";
      if (hour < 9) { code = "1"; label = "아침"; } else if (hour >= 14) { code = "3"; label = "저녁"; }

      fetch(`https://open.neis.go.kr/hub/mealServiceDietInfo?KEY=${NEIS_API_KEY}&Type=json&ATPT_OFCDC_SC_CODE=F10&SD_SCHUL_CODE=7380024&MLSV_YMD=${yyyymmdd}`)
        .then(res => res.json()).then(data => {
          if (data.mealServiceDietInfo) {
            const row = data.mealServiceDietInfo[1].row.find(r => r.MMEAL_SC_CODE === code) || data.mealServiceDietInfo[1].row[0];
            setMeal({ label: row.MMEAL_SC_NM, menu: row.DDISH_NM.replace(/[0-9.()]/g, "").replace(/<br\/>/g, ", ") });
          } else { setMeal({ label, menu: "식단 정보가 없습니다.🍱" }); }
        }).catch(() => setMeal({ label, menu: "급식 로딩 실패" }));
    };

    const updateTime = () => {
      const d = new Date(); setNow(d);
      const time = d.getHours() * 100 + d.getMinutes();
      let p = -1;
      if (time >= 850 && time < 950) p = 1; else if (time >= 950 && time < 1050) p = 2;
      else if (time >= 1050 && time < 1150) p = 3; else if (time >= 1150 && time < 1320) p = 4;
      else if (time >= 1320 && time < 1420) p = 5; else if (time >= 1420 && time < 1510) p = 6;
      else if (time >= 1510 && time < 1610) p = 7;
      setCurrentPos({ dayIdx: d.getDay(), periodIdx: p });
    };

    fetchData(); updateTime();
    const t1 = setInterval(fetchData, 60000); const t2 = setInterval(updateTime, 1000);
    return () => { clearInterval(t1); clearInterval(t2); };
  }, []);

  return (
    <div className="min-h-screen bg-[#020617] text-slate-200 p-8 grid grid-cols-12 gap-8 font-sans overflow-hidden relative">
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-900/10 rounded-full blur-[120px] pointer-events-none"></div>

      {/* 1단 (좌측): 시간 -> 날씨 -> 시간표 -> 급식표 */}
      <div className="col-span-4 flex flex-col gap-6 z-10 overflow-hidden h-full">
        {/* 1. 시간 */}
        <section className="bg-white/5 backdrop-blur-xl p-8 rounded-[2rem] border border-white/10 shadow-2xl text-center">
          <h1 className="text-6xl font-black text-white tracking-tighter italic">
            {now.toLocaleTimeString('ko-KR', { hour12: false, hour: '2-digit', minute: '2-digit' })}
          </h1>
          <p className="text-blue-400 font-bold mt-2 uppercase tracking-[0.2em]">{now.toLocaleDateString('ko-KR', { dateStyle: 'full' })}</p>
        </section>

        {/* 2. 날씨 */}
        <section className="bg-white/5 backdrop-blur-md p-6 rounded-[2rem] border border-white/10 flex items-center justify-around shadow-lg transition-all hover:bg-white/10">
          <Cloud size={40} className="text-sky-400" />
          <div className="text-right">
            <p className="text-3xl font-black text-white">{weather?.main ? Math.round(weather.main.temp) : '--'}°C</p>
            <p className="text-slate-400 text-sm font-bold uppercase">{weather?.weather?.[0]?.description || "Loading"}</p>
          </div>
        </section>

        {/* 3. 시간표 (1단 메인) */}
        <section className="bg-white/5 backdrop-blur-md p-6 rounded-[2.5rem] border border-white/10 shadow-xl flex-1 flex flex-col min-h-0 overflow-hidden">
          <h3 className="text-lg font-black text-white mb-6 flex items-center gap-3">
            <LayoutGrid size={20} className="text-indigo-400" /> WEEKLY SCHEDULE
          </h3>
          <div className="flex-1 grid grid-cols-6 gap-2 text-[11px]">
            <div />
            {["월", "화", "수", "목", "금"].map((d, i) => (
              <div key={d} className={`text-center font-black pb-2 ${currentPos.dayIdx === i + 1 ? "text-blue-400" : "text-slate-600"}`}>{d}</div>
            ))}
            {[1, 2, 3, 4, 5, 6, 7].map(p => (
              <React.Fragment key={p}>
                <div className="flex items-center justify-center bg-white/5 rounded-lg font-black text-slate-500">{p}</div>
                {[1, 2, 3, 4, 5].map(d => {
                  const teacher = grid[p]?.[d] || "";
                  const isActive = currentPos.dayIdx === d && currentPos.periodIdx === p;
                  return (
                    <div key={`${d}-${p}`} className={`flex items-center justify-center rounded-xl font-bold border-2 transition-all ${isActive ? "bg-white text-black border-white shadow-lg scale-110 z-10" : "bg-black/20 border-white/5 text-slate-500"}`}>
                      {teacher}
                    </div>
                  );
                })}
              </React.Fragment>
            ))}
          </div>
        </section>

        {/* 4. 급식표 */}
        <section className="bg-gradient-to-br from-indigo-500/10 to-purple-600/5 backdrop-blur-md p-7 rounded-[2rem] border border-indigo-500/20 shadow-xl">
          <h3 className="text-lg font-black text-indigo-400 mb-3 flex items-center gap-2">
            <Utensils size={20} /> {meal.label}
          </h3>
          <p className="text-base font-bold leading-relaxed text-slate-200">{meal.menu}</p>
        </section>
      </div>

      {/* 2단: 할 일 목록 (우측 대화면) */}
      <aside className="col-span-8 bg-white/5 backdrop-blur-2xl rounded-[3rem] border border-white/10 p-12 flex flex-col shadow-2xl z-10">
        <header className="flex justify-between items-center mb-10 border-b border-white/10 pb-8">
          <h3 className="text-4xl font-black text-white flex items-center gap-5">
            <CheckCircle2 size={40} className="text-emerald-400" /> TODO LIST
          </h3>
          <span className="bg-emerald-500/10 text-emerald-400 px-6 py-2 rounded-full text-sm font-black tracking-widest border border-emerald-500/20 uppercase">Station Tasks</span>
        </header>
        
        <div className="flex-1 overflow-y-auto space-y-6 pr-4 custom-scrollbar">
          {todos.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center opacity-20">
              <Calendar size={100} className="text-slate-600 mb-6" />
              <p className="text-2xl font-black">새로운 할 일을 추가해 보세요.</p>
            </div>
          ) : (
            todos.map(t => (
              <div key={t.id} className="p-8 rounded-[2.5rem] bg-white/5 border border-white/5 hover:border-emerald-500/30 hover:bg-white/10 transition-all shadow-md group">
                <p className="text-3xl font-bold text-slate-200 group-hover:text-white transition-colors">{t.text}</p>
              </div>
            ))
          )}
        </div>
        <footer className="mt-10 text-[10px] text-slate-700 font-black text-center tracking-[0.5em] uppercase">Smart Lab Station v3.1</footer>
      </aside>
    </div>
  );
}
