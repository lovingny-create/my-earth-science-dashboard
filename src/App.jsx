import React, { useState, useEffect } from 'react';
import Papa from 'papaparse';
import { Clock, Radio, CheckCircle2, Cloud, Sun, Utensils, Calendar } from 'lucide-react';

export default function App() {
  const [grid, setGrid] = useState([]);
  const [todos, setTodos] = useState([]);
  const [weather, setWeather] = useState(null);
  const [meal, setMeal] = useState({ label: "급식", menu: "로딩 중..." });
  const [now, setNow] = useState(new Date());
  const [currentPos, setCurrentPos] = useState({ dayIdx: -1, periodIdx: -1 });

  // --- [환경 설정: 인증키 및 주소] ---
  const NEIS_API_KEY = "여기에_선생님의_인증키를_넣으세요"; 
  const TIMETABLE_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQFJ5d-I901hCCEP0A8awuxVJNplbTWQjSt7_LO-fg6LzrEuQUDP2HoKAOHwE7YeTdnLVQ3devIeRf6/pub?gid=0&output=csv";
  const TODO_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQFJ5d-I901hCCEP0A8awuxVJNplbTWQjSt7_LO-fg6LzrEuQUDP2HoKAOHwE7YeTdnLVQ3devIeRf6/pub?gid=210287103&output=csv";
  const WEATHER_API_KEY = "9addde09be74cdb63aab8481a0a207a0"; 
  const CITY = "Gwangju";

  useEffect(() => {
    const fetchData = () => {
      const cb = `&t=${Date.now()}`; // 캐시 방지용 타임스탬프

      // 1. 시간표 데이터
      Papa.parse(`${TIMETABLE_URL}${cb}`, {
        download: true,
        complete: (res) => setGrid(res.data)
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

      // 3. 실시간 기상 데이터
      fetch(`https://api.openweathermap.org/data/2.5/weather?q=${CITY}&appid=${WEATHER_API_KEY}&units=metric&lang=kr`)
        .then(res => res.json()).then(data => setWeather(data));

      fetchMeal();
    };

    const fetchMeal = () => {
      const d = new Date();
      const yyyymmdd = d.getFullYear() + String(d.getMonth() + 1).padStart(2, '0') + String(d.getDate()).padStart(2, '0');
      const hour = d.getHours();
      let targetCode = "2", label = "점심";
      if (hour < 9) { targetCode = "1"; label = "아침"; }
      else if (hour >= 14) { targetCode = "3"; label = "저녁"; }

      fetch(`https://open.neis.go.kr/hub/mealServiceDietInfo?KEY=${NEIS_API_KEY}&Type=json&ATPT_OFCDC_SC_CODE=F10&SD_SCHUL_CODE=7380024&MLSV_YMD=${yyyymmdd}`)
        .then(res => res.json())
        .then(data => {
          if (data.mealServiceDietInfo) {
            const row = data.mealServiceDietInfo[1].row.find(r => r.MMEAL_SC_CODE === targetCode) || data.mealServiceDietInfo[1].row[0];
            setMeal({ label: row.MMEAL_SC_NM, menu: row.DDISH_NM.replace(/[0-9.()]/g, "").replace(/<br\/>/g, ", ") });
          } else {
            setMeal({ label, menu: "오늘 급식 정보가 없습니다.🍱" });
          }
        });
    };

    const updateTime = () => {
      const d = new Date();
      setNow(d);
      const time = d.getHours() * 100 + d.getMinutes();
      let p = -1;
      if (time >= 850 && time < 950) p = 1;
      else if (time >= 950 && time < 1050) p = 2;
      else if (time >= 1050 && time < 1150) p = 3;
      else if (time >= 1150 && time < 1330) p = 4;
      else if (time >= 1330 && time < 1430) p = 5;
      else if (time >= 1430 && time < 1520) p = 6;
      else if (time >= 1520 && time < 1620) p = 7;
      setCurrentPos({ dayIdx: d.getDay(), periodIdx: p });
    };

    fetchData(); updateTime();
    const timer = setInterval(fetchData, 60000); 
    const timer2 = setInterval(updateTime, 1000);
    return () => { clearInterval(timer); clearInterval(timer2); };
  }, []);

  return (
    <div className="min-h-screen bg-[#0F1115] text-slate-200 p-8 font-sans overflow-hidden grid grid-cols-12 gap-8">
      
      {/* 1. 사이드바: 시간, 날씨, 급식, 태양 */}
      <div className="col-span-3 space-y-8 flex flex-col h-full">
        <section className="bg-slate-900/50 p-8 rounded-[2rem] border border-slate-800 text-center shadow-2xl backdrop-blur-md">
          <h1 className="text-7xl font-black text-white tracking-tighter">{now.toLocaleTimeString('ko-KR', { hour12: false, hour: '2-digit', minute: '2-digit' })}</h1>
          <p className="text-slate-500 font-bold mt-2 text-lg">{now.toLocaleDateString('ko-KR', { dateStyle: 'full' })}</p>
        </section>

        <section className="bg-slate-900/50 p-6 rounded-[2rem] border border-slate-800 flex items-center justify-around shadow-lg">
          <Cloud size={60} className="text-sky-400" />
          <div className="text-right">
            <p className="text-4xl font-black text-white">{weather?.main ? Math.round(weather.main.temp) : '--'}°C</p>
            <p className="text-slate-400 font-bold">{weather?.weather?.[0]?.description || "날씨 로딩"}</p>
          </div>
        </section>

        <section className="bg-slate-900/50 p-8 rounded-[2rem] border border-slate-800 flex-1 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <Utensils size={100} />
          </div>
          <h3 className="text-xl font-black text-amber-400 mb-4 flex items-center gap-2">🍴 {meal.label} 메뉴</h3>
          <p className="text-lg font-bold leading-relaxed text-slate-100">{meal.menu}</p>
        </section>

        {/* [전문가용] 오늘의 태양 고해상도 이미지 */}
        <section className="bg-slate-900/50 p-4 rounded-[2rem] border border-slate-800 overflow-hidden shadow-inner">
          <h3 className="text-sm font-black text-red-400 mb-3 text-center flex items-center justify-center gap-2 uppercase tracking-widest">
            <Sun size={16} /> 실시간 태양 (SDO-AIA 171)
          </h3>
          <img 
            src={`https://sdo.gsfc.nasa.gov/assets/img/latest/latest_1024_0171.jpg?t=${now.getTime()}`} 
            className="w-full h-auto rounded-2xl hover:scale-110 transition-transform duration-1000 cursor-zoom-in"
            alt="Real-time Sun" 
          />
        </section>
      </div>

      {/* 2. 메인: 시간표 */}
      <main className="col-span-6 bg-slate-900/30 rounded-[2.5rem] border border-slate-800 p-10 shadow-2xl flex flex-col backdrop-blur-sm">
        <header className="flex justify-between items-center mb-8">
          <h2 className="text-3xl font-black text-white flex items-center gap-4">
            <Radio className="text-red-500 animate-pulse" size={32} /> 지구과학실 현황
          </h2>
          <div className="bg-slate-800/50 px-6 py-2 rounded-full text-slate-400 font-bold text-sm border border-slate-700">
            광주과학고등학교 실시간 데이터 연동
          </div>
        </header>

        <div className="flex-1 grid grid-cols-6 gap-4">
          <div />
          {["월", "화", "수", "목", "금"].map((d, i) => (
            <div key={d} className={`text-center text-2xl font-black ${currentPos.dayIdx === i + 1 ? "text-white scale-110" : "text-slate-600"}`}>{d}</div>
          ))}
          {[1, 2, 3, 4, 5, 6, 7].map(p => (
            <React.Fragment key={p}>
              <div className="flex items-center justify-center bg-slate-800/50 rounded-2xl font-black text-2xl text-slate-300 border border-slate-700 shadow-inner">{p}</div>
              {[1, 2, 3, 4, 5].map(d => {
                const teacher = grid[p]?.[d] || "";
                const isActive = currentPos.dayIdx === d && currentPos.periodIdx === p;
                return (
                  <div key={`${d}-${p}`} className={`flex items-center justify-center rounded-2xl text-xl font-bold border-2 transition-all duration-300 ${isActive ? "bg-white text-slate-950 shadow-[0_0_30px_rgba(255,255,255,0.2)] border-white z-10 scale-105" : "bg-slate-900/50 border-slate-800 text-slate-500 hover:border-slate-700"}`}>
                    {teacher}
                  </div>
                );
              })}
            </React.Fragment>
          ))}
        </div>
      </main>

      {/* 3. 우측: TODO LIST */}
      <aside className="col-span-3 bg-slate-900/50 rounded-[2rem] border border-slate-800 p-8 shadow-xl flex flex-col h-full">
        <h3 className="text-2xl font-black text-slate-400 mb-8 flex items-center gap-3"><CheckCircle2 size={28} /> TODO LIST</h3>
        <div className="flex-1 overflow-y-auto space-y-4 pr-2 custom-scrollbar">
          {todos.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-600 opacity-50">
              <Calendar size={48} className="mb-4" />
              <p className="font-bold">오늘 예정된 일정이 없습니다.</p>
            </div>
          ) : (
            todos.map(todo => (
              <div key={todo.id} className="p-5 rounded-2xl bg-slate-800/50 border border-slate-700 text-slate-100 font-bold text-lg hover:border-sky-500/50 transition-colors shadow-sm">
                {todo.text}
              </div>
            ))
          )}
        </div>
        <div className="mt-8 pt-8 border-t border-slate-800">
           <p className="text-xs text-slate-600 font-bold text-center uppercase tracking-widest">Smart Dashboard v2.0 for Laptop</p>
        </div>
      </aside>
    </div>
  );
}
