import React, { useState, useEffect } from 'react';
import Papa from 'papaparse';
import { Clock, Radio, CheckCircle2, Cloud, Sun, Calendar, LayoutGrid, Moon, ListChecks, Bell } from 'lucide-react';

export default function App() {
  const [grid, setGrid] = useState([]);
  const [todos, setTodos] = useState([]);
  const [monthlyPlan, setMonthlyPlan] = useState([]); // 월중계획 상태 추가
  const [weather, setWeather] = useState(null);
  const [now, setNow] = useState(new Date());
  const [currentPos, setCurrentPos] = useState({ dayIdx: -1, periodIdx: -1 });

  // --- [환경 설정: 구글 시트 주소를 확인해 주세요] ---
  const TIMETABLE_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vSfFMWDov9yz7QPfJOrdu15kgAdzhpJ-kMkn1zW6QjiRUzAecmNh4sPO9C3HzYmmlhl5xS5su3EWQSy/pub?gid=0&single=true&output=csv";
  const TODO_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQFJ5d-I901hCCEPOA8awuxVJNpIbTWQjSt7_LO-fg6LzrEuQUDP2HoKAOHwE7YeTdnLVQ3devIeRf6/pub?gid=210287103&single=true&output=csv";
  
  // 월중계획용 시트 주소 (필요시 시트3 등을 만들어 gid를 수정해 주세요)
  const PLAN_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQFJ5d-I901hCCEPOA8awuxVJNpIbTWQjSt7_LO-fg6LzrEuQUDP2HoKAOHwE7YeTdnLVQ3devIeRf6/pub?gid=시트GID번호&single=true&output=csv";
  
  const WEATHER_API_KEY = "9addde09be74cdb63aab8481a0a207a0"; 
  const CITY = "Gwangju";
  const SUN_IMAGE_URL = "https://suntoday.lmsal.com/suntoday/images/latest_171.jpg";

  // --- [월령 계산 로직] ---
  const getMoonPhase = (date) => {
    let year = date.getFullYear(); let month = date.getMonth() + 1; let day = date.getDate();
    if (month < 3) { year--; month += 12; }
    const a = Math.floor(year / 100); const b = Math.floor(a / 4);
    const c = 2 - a + b; const e = Math.floor(365.25 * (year + 4716));
    const f = Math.floor(30.6001 * (month + 1));
    const jd = c + day + e + f - 1524.5; // 율리우스 적일
    const cycle = 29.530588853;
    const phase = (jd - 2451550.1) / cycle;
    return (phase - Math.floor(phase)) * 30; // 0~30 사이의 월령 값
  };

  useEffect(() => {
    const fetchData = () => {
      const cb = `&t=${Date.now()}`;
      // 1. 시간표
      Papa.parse(`${TIMETABLE_URL}${cb}`, { download: true, complete: (res) => { if (res.data) setGrid(res.data); } });
      // 2. 할일 목록
      Papa.parse(`${TODO_URL}${cb}`, { download: true, complete: (res) => {
        if (res.data) {
          const fetched = res.data.filter(row => row[0]?.trim()).map((row, idx) => ({ id: `todo-${idx}`, text: row[0] }));
          setTodos(fetched);
        }
      }});
      // 3. 월중 계획
      Papa.parse(`${PLAN_URL}${cb}`, { download: true, complete: (res) => {
        if (res.data) {
          const fetched = res.data.filter(row => row[0]?.trim()).map((row, idx) => ({ id: `plan-${idx}`, text: row[0] }));
          setMonthlyPlan(fetched);
        }
      }});
      // 4. 날씨
      fetch(`https://api.openweathermap.org/data/2.5/weather?q=${CITY}&appid=${WEATHER_API_KEY}&units=metric&lang=kr`)
        .then(res => res.json()).then(data => setWeather(data));
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

  const moonAge = getMoonPhase(now).toFixed(1);

  return (
    <div className="min-h-screen bg-[#020617] text-slate-200 p-8 grid grid-cols-3 gap-8 font-sans overflow-hidden relative">
      <div className="absolute top-[-5%] left-[-5%] w-[30%] h-[30%] bg-blue-600/10 rounded-full blur-[100px] pointer-events-none"></div>

      {/* 1단 (좌측): 일시, 날씨, 시간표 */}
      <div className="flex flex-col gap-6 h-full overflow-hidden">
        <section className="bg-white/5 backdrop-blur-xl p-8 rounded-[2rem] border border-white/10 shadow-2xl text-center">
          <h1 className="text-6xl font-black text-white tracking-tighter italic">{now.toLocaleTimeString('ko-KR', { hour12: false, hour: '2-digit', minute: '2-digit' })}</h1>
          <p className="text-blue-400 font-bold mt-2 uppercase tracking-[0.2em]">{now.toLocaleDateString('ko-KR', { dateStyle: 'full' })}</p>
        </section>

        <section className="bg-white/5 backdrop-blur-md p-6 rounded-[2rem] border border-white/10 flex items-center justify-around shadow-lg">
          <Cloud size={40} className="text-sky-400" />
          <div className="text-right">
            <p className="text-3xl font-black text-white">{weather?.main ? Math.round(weather.main.temp) : '--'}°C</p>
            <p className="text-slate-400 text-sm font-bold uppercase">{weather?.weather?.[0]?.description || "Loading"}</p>
          </div>
        </section>

        <section className="bg-white/5 backdrop-blur-md p-6 rounded-[2rem] border border-white/10 shadow-xl flex-1 flex flex-col min-h-0 overflow-hidden">
          <h3 className="text-lg font-black text-white mb-6 flex items-center gap-3">
            <LayoutGrid size={20} className="text-indigo-400" /> WEEKLY SCHEDULE
          </h3>
          <div className="flex-1 grid grid-cols-6 gap-2 text-[10px]">
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
                    <div key={`${d}-${p}`} className={`flex items-center justify-center rounded-lg font-bold border ${isActive ? "bg-white text-black border-white shadow-lg scale-105 z-10" : "bg-black/20 border-white/5 text-slate-500"}`}>{teacher}</div>
                  );
                })}
              </React.Fragment>
            ))}
          </div>
        </section>
      </div>

      {/* 2단 (중앙): 실시간 태양 사진, 월령, 월중계획 */}
      <div className="flex flex-col gap-6 h-full overflow-hidden">
        <section className="bg-black/40 backdrop-blur-md p-5 rounded-[2rem] border border-red-500/20 shadow-2xl overflow-hidden group">
          <h3 className="text-xs font-black text-red-500/80 mb-4 flex items-center gap-2 tracking-[0.3em] uppercase"><Sun size={14} /> SDO Live Monitor</h3>
          <div className="rounded-2xl overflow-hidden aspect-square border border-white/5">
            <img src={`${SUN_IMAGE_URL}?t=${Date.now()}`} className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-125" alt="Sun" onError={(e) => { e.target.style.display = 'none'; }} />
          </div>
        </section>

        <section className="bg-white/5 backdrop-blur-md p-6 rounded-[2rem] border border-white/10 flex items-center justify-between shadow-xl">
          <div className="flex items-center gap-4">
            <Moon size={30} className="text-yellow-200" />
            <div>
              <p className="text-slate-400 text-[10px] font-black uppercase">Moon Phase</p>
              <p className="text-xl font-black text-white">오늘의 월령</p>
            </div>
          </div>
          <p className="text-4xl font-black text-yellow-200 tracking-tighter">{moonAge}<span className="text-sm ml-1 text-slate-500">days</span></p>
        </section>

        <section className="bg-white/5 backdrop-blur-md p-6 rounded-[2rem] border border-white/10 flex-1 flex flex-col min-h-0">
          <h3 className="text-lg font-black text-indigo-300 mb-4 flex items-center gap-3">
            <Bell size={20} /> MONTHLY PLAN
          </h3>
          <div className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
            {monthlyPlan.map(p => (
              <div key={p.id} className="p-4 rounded-xl bg-indigo-500/5 border border-indigo-500/10 text-sm font-bold text-slate-300 transition-all hover:bg-indigo-500/10">{p.text}</div>
            ))}
          </div>
        </section>
      </div>

      {/* 3단 (우측): TO DO LIST */}
      <aside className="bg-white/5 backdrop-blur-2xl rounded-[2.5rem] border border-white/10 p-8 flex flex-col shadow-2xl overflow-hidden h-full">
        <h3 className="text-2xl font-black text-white mb-8 flex items-center gap-4 border-b border-white/10 pb-6">
          <ListChecks size={30} className="text-emerald-400" /> TO DO LIST
        </h3>
        <div className="flex-1 overflow-y-auto space-y-4 pr-2 custom-scrollbar">
          {todos.map(t => (
            <div key={t.id} className="p-6 rounded-[1.5rem] bg-white/5 border border-white/5 hover:border-emerald-500/30 hover:bg-white/10 transition-all shadow-md group">
              <p className="text-xl font-bold text-slate-200 group-hover:text-white transition-colors">{t.text}</p>
            </div>
          ))}
        </div>
        <footer className="mt-8 pt-6 border-t border-white/5 text-[9px] text-slate-600 font-black text-center tracking-[0.4em] uppercase">Station Control v4.0</footer>
      </aside>
    </div>
  );
}
