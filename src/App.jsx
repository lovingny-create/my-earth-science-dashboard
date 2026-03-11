import React, { useState, useEffect } from 'react';
import Papa from 'papaparse';
import { Clock, Radio, CheckCircle2, Cloud, Sun, Utensils, Calendar, AlertCircle } from 'lucide-react';

export default function App() {
  const [grid, setGrid] = useState([]);
  const [todos, setTodos] = useState([]);
  const [weather, setWeather] = useState(null);
  const [meal, setMeal] = useState({ label: "급식", menu: "로딩 중..." });
  const [now, setNow] = useState(new Date());
  const [currentPos, setCurrentPos] = useState({ dayIdx: -1, periodIdx: -1 });

  // --- [환경 설정: 인증키를 반드시 따옴표 안에 넣으세요] ---
  const NEIS_API_KEY = "여기에_나이스_인증키를_넣으세요"; // 이 부분이 빠져있었습니다!
  
  // 시간표 시트 주소 (gid=0)
  const TIMETABLE_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vSfFMWDov9yz7QPfJOrdu15kgAdzhpJ-kMkn1zW6QjiRUzAecmNh4sPO9C3HzYmmlhl5xS5su3EWQSy/pub?gid=0&single=true&output=csv";
  
  // 할일 목록 시트 주소 
    const TODO_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQFJ5d-I901hCCEPOA8awuxvJNpIbTWQjSt7_L0-fg6LzrEuQUDP2HoKAOHwE7YeTdnLVQ3devIeRf6/pub?gid=0&single=true&output=csv";
  
  const WEATHER_API_KEY = "9addde09be74cdb63aab8481a0a207a0"; 
  const CITY = "Gwangju";
  const SUN_IMAGE_URL = "https://suntoday.lmsal.com/suntoday/images/latest_171.jpg";

  useEffect(() => {
    const fetchData = () => {
      const cb = `&t=${Date.now()}`;

      // 1. 시간표 데이터
      Papa.parse(`${TIMETABLE_URL}${cb}`, {
        download: true,
        complete: (res) => { if (res.data) setGrid(res.data); }
      });
      
      // 2. 할일 목록 데이터
      Papa.parse(`${TODO_URL}${cb}`, {
        download: true,
        complete: (res) => {
          if (res.data) {
            const fetched = res.data
              .filter(row => row[0]?.trim())
              .map((row, idx) => ({ id: `todo-${idx}`, text: row[0] }));
            setTodos(fetched);
          }
        }
      });

      // 3. 기상청 데이터
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

      // 인증키가 정의되었으므로 이제 정상 작동합니다.
      fetch(`https://open.neis.go.kr/hub/mealServiceDietInfo?KEY=${NEIS_API_KEY}&Type=json&ATPT_OFCDC_SC_CODE=F10&SD_SCHUL_CODE=7380024&MLSV_YMD=${yyyymmdd}`)
        .then(res => res.json())
        .then(data => {
          if (data.mealServiceDietInfo) {
            const row = data.mealServiceDietInfo[1].row.find(r => r.MMEAL_SC_CODE === code) || data.mealServiceDietInfo[1].row[0];
            setMeal({ label: row.MMEAL_SC_NM, menu: row.DDISH_NM.replace(/[0-9.()]/g, "").replace(/<br\/>/g, ", ") });
          } else {
            setMeal({ label, menu: "식단 정보가 등록되지 않았습니다.🍱" });
          }
        }).catch(() => setMeal({ label, menu: "급식 정보를 불러올 수 없습니다." }));
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
    const t1 = setInterval(fetchData, 60000); 
    const t2 = setInterval(updateTime, 1000);
    return () => { clearInterval(t1); clearInterval(t2); };
  }, []);

  return (
    <div className="min-h-screen bg-[#0A0C10] text-slate-200 p-8 grid grid-cols-12 gap-8 font-sans overflow-hidden">
      <div className="col-span-3 flex flex-col gap-6">
        <section className="bg-[#161B22] p-8 rounded-3xl border border-slate-800 shadow-2xl text-center transition-all hover:bg-[#1C2128]">
          <h1 className="text-6xl font-black text-white leading-none">{now.toLocaleTimeString('ko-KR', { hour12: false, hour: '2-digit', minute: '2-digit' })}</h1>
          <p className="text-slate-500 font-bold mt-4 uppercase tracking-widest">{now.toLocaleDateString('ko-KR', { dateStyle: 'full' })}</p>
        </section>

        <section className="bg-[#161B22] p-6 rounded-3xl border border-slate-800 flex items-center justify-around shadow-lg">
          <Cloud size={50} className="text-sky-400" />
          <div className="text-right">
            <p className="text-3xl font-black text-white">{weather?.main ? Math.round(weather.main.temp) : '--'}°C</p>
            <p className="text-slate-400 text-sm font-bold">{weather?.weather?.[0]?.description || "로딩 중"}</p>
          </div>
        </section>

        <section className="bg-[#161B22] p-8 rounded-3xl border border-slate-800 flex-1 flex flex-col justify-center">
          <h3 className="text-xl font-black text-amber-400 mb-4 flex items-center gap-2 border-b border-slate-800 pb-2"><Utensils size={20} /> {meal.label}</h3>
          <p className="text-base font-bold leading-relaxed text-slate-300">{meal.menu}</p>
        </section>

        <section className="bg-black p-4 rounded-3xl border border-slate-800 overflow-hidden shadow-inner flex flex-col aspect-square max-h-[300px]">
          <h3 className="text-[10px] font-black text-red-500 mb-3 flex items-center gap-2 tracking-tighter uppercase">
            <Sun size={12} /> Real-time Sun (AIA 171)
          </h3>
          <div className="rounded-xl overflow-hidden bg-slate-900 flex-1 relative group">
            <img 
              src={`${SUN_IMAGE_URL}?t=${Date.now()}`} 
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
              alt="Sun"
              onError={(e) => {
                e.target.style.display = 'none';
                e.target.parentNode.innerHTML = '<div class="text-[10px] text-slate-600 font-bold text-center p-4">NASA 서버 이전 작업 중</div>';
              }}
            />
          </div>
        </section>
      </div>

      <main className="col-span-6 bg-[#161B22] rounded-[2.5rem] border border-slate-800 p-10 flex flex-col shadow-2xl relative overflow-hidden">
        <header className="flex justify-between items-center mb-10 border-b border-slate-800 pb-6">
          <h2 className="text-3xl font-black text-white flex items-center gap-4">
            <Radio className="text-red-500 animate-pulse" size={32} /> 실시간 스테이션
          </h2>
          <span className="text-[10px] font-black text-slate-500 bg-slate-800/50 px-4 py-2 rounded-full border border-slate-700 uppercase tracking-widest">Live Sync Enabled</span>
        </header>

        <div className="flex-1 grid grid-cols-6 gap-5">
          <div />
          {["MON", "TUE", "WED", "THU", "FRI"].map((d, i) => (
            <div key={d} className={`text-center text-sm font-black tracking-widest ${currentPos.dayIdx === i + 1 ? "text-blue-400" : "text-slate-600"}`}>{d}</div>
          ))}
          {[1, 2, 3, 4, 5, 6, 7].map(p => (
            <React.Fragment key={p}>
              <div className="flex items-center justify-center bg-slate-800/20 rounded-xl font-black text-xl text-slate-500">{p}</div>
              {[1, 2, 3, 4, 5].map(d => {
                const teacher = grid[p]?.[d] || "";
                const isActive = currentPos.dayIdx === d && currentPos.periodIdx === p;
                return (
                  <div key={`${d}-${p}`} className={`flex items-center justify-center rounded-2xl text-lg font-bold border-2 transition-all duration-300 ${isActive ? "bg-white text-black border-white shadow-[0_0_30px_rgba(255,255,255,0.15)] z-10 scale-105" : "bg-black/20 border-slate-800 text-slate-600 hover:border-slate-700 hover:bg-black/40"}`}>
                    {teacher}
                  </div>
                );
              })}
            </React.Fragment>
          ))}
        </div>
      </main>

      <aside className="col-span-3 bg-[#161B22] rounded-3xl border border-slate-800 p-8 flex flex-col shadow-xl overflow-hidden">
        <h3 className="text-xl font-black text-slate-500 mb-8 flex items-center gap-3 uppercase tracking-tighter"><CheckCircle2 size={24} /> Tasks</h3>
        <div className="flex-1 overflow-y-auto space-y-4 pr-2 custom-scrollbar">
          {todos.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center opacity-20 text-slate-500 text-center">
              <AlertCircle size={40} className="mb-2" />
              <p className="font-bold text-sm">No Pending Tasks</p>
            </div>
          ) : (
            todos.map(t => (
              <div key={t.id} className="p-6 rounded-2xl bg-black/30 border border-slate-800 text-slate-200 font-bold text-lg hover:border-blue-500/50 transition-all shadow-sm">
                {t.text}
              </div>
            ))
          )}
        </div>
        <div className="mt-8 pt-6 border-t border-slate-800 text-[9px] text-slate-700 font-black text-center tracking-[0.3em] uppercase">
          Station Dashboard v2.6
        </div>
      </aside>
    </div>
  );
}
