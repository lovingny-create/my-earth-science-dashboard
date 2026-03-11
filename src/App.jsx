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

  // --- [환경 설정: 본인의 데이터로 교체하세요] ---
  const NEIS_API_KEY = "여기에_나이스_인증키를_넣으세요"; 
  const TIMETABLE_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQFJ5d-I901hCCEP0A8awuxVJNplbTWQjSt7_LO-fg6LzrEuQUDP2HoKAOHwE7YeTdnLVQ3devIeRf6/pub?gid=0&output=csv";
  const TODO_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQFJ5d-I901hCCEP0A8awuxVJNplbTWQjSt7_LO-fg6LzrEuQUDP2HoKAOHwE7YeTdnLVQ3devIeRf6/pub?gid=210287103&output=csv";
  const WEATHER_API_KEY = "9addde09be74cdb63aab8481a0a207a0"; 
  const CITY = "Gwangju";
  const SUN_IMAGE_URL = "https://suntoday.lmsal.com/suntoday/images/latest_171.jpg"; // SDO 점검 대비 미러 서버

  useEffect(() => {
    const fetchData = () => {
      const cb = `&t=${Date.now()}`; // 구글 시트 즉시 반영을 위한 캐시 방지

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
      // 학교 종소리 시간표 연동
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
    <div className="min-h-screen bg-[#0A0C10] text-slate-200 p-8 grid grid-cols-12 gap-8 font-sans overflow-hidden">
      
      {/* 1. 사이드바: 시간, 날씨, 급식, 태양 */}
      <div className="col-span-3 flex flex-col gap-6">
        <section className="bg-[#161B22] p-8 rounded-3xl border border-slate-800 shadow-2xl text-center">
          <h1 className="text-6xl font-black text-white">{now.toLocaleTimeString('ko-KR', { hour12: false, hour: '2-digit', minute: '2-digit' })}</h1>
          <p className="text-slate-500 font-bold mt-2 uppercase tracking-widest">{now.toLocaleDateString('ko-KR', { dateStyle: 'full' })}</p>
        </section>

        <section className="bg-[#161B22] p-6 rounded-3xl border border-slate-800 flex items-center justify-around shadow-lg">
          <Cloud size={50} className="text-sky-400" />
          <div className="text-right">
            <p className="text-3xl font-black text-white">{weather?.main ? Math.round(weather.main.temp) : '--'}°C</p>
            <p className="text-slate-400 text-sm font-bold">{weather?.weather?.[0]?.description || "로딩 중"}</p>
          </div>
        </section>

        <section className="bg-[#161B22] p-6 rounded-3xl border border-slate-800 flex-1 flex flex-col justify-center">
          <h3 className="text-lg font-black text-amber-400 mb-4 flex items-center gap-2"><Utensils size={20} /> {meal.label}</h3>
          <p className="text-base font-bold leading-relaxed text-slate-300">{meal.menu}</p>
        </section>

        {/* 태양 사진 카드: 나사 서버 점검 시 우회 로직 포함 */}
        <section className="bg-black p-4 rounded-3xl border border-slate-800 overflow-hidden shadow-inner">
          <h3 className="text-xs font-black text-red-500 mb-3 flex items-center gap-2 tracking-tighter uppercase">
            <Sun size={14} /> Real-time Sun (AIA 171)
          </h3>
          <div className="rounded-xl overflow-hidden bg-slate-900 aspect-square flex items-center justify-center">
            <img 
              src={`${SUN_IMAGE_URL}?t=${Date.now()}`} 
              className="w-full h-full object-cover hover:scale-105 transition-transform" 
              alt="Sun"
              onError={(e) => {
                e.target.style.display = 'none';
                e.target.parentNode.innerHTML = '<div class="text-[10px] text-slate-600 font-bold text-center p-4 uppercase">NASA 서버 데이터 센터 이전 중입니다.</div>';
              }}
            />
          </div>
        </section>
      </div>

      {/* 2. 중앙 메인: 시간표 */}
      <main className="col-span-6 bg-[#161B22] rounded-[2rem] border border-slate-800 p-10 flex flex-col shadow-2xl relative overflow-hidden">
        <div className="flex justify-between items-center mb-10">
          <h2 className="text-3xl font-black text-white flex items-center gap-4">
            <Radio className="text-red-500 animate-pulse" size={32} /> 지구과학실 현황
          </h2>
          <span className="text-xs font-bold text-slate-500 bg-slate-800/50 px-4 py-2 rounded-full border border-slate-700 uppercase tracking-widest">Live Data Sync</span>
        </div>

        <div className="flex-1 grid grid-cols-6 gap-4">
          <div />
          {["월", "화", "수", "목", "금"].map((d, i) => (
            <div key={d} className={`text-center text-xl font-black ${currentPos.dayIdx === i + 1 ? "text-white" : "text-slate-700"}`}>{d}</div>
          ))}
          {[1, 2, 3, 4, 5, 6, 7].map(p => (
            <React.Fragment key={p}>
              <div className="flex items-center justify-center bg-slate-800/30 rounded-xl font-black text-xl text-slate-500 border border-slate-800">{p}</div>
              {[1, 2, 3, 4, 5].map(d => {
                const teacher = grid[p]?.[d] || "";
                const isActive = currentPos.dayIdx === d && currentPos.periodIdx === p;
                return (
                  <div key={`${d}-${p}`} className={`flex items-center justify-center rounded-xl text-lg font-bold border-2 transition-all ${isActive ? "bg-white text-black border-white shadow-[0_0_40px_rgba(255,255,255,0.2)] z-10 scale-105" : "bg-[#0A0C10]/50 border-slate-800 text-slate-600 hover:border-slate-700"}`}>
                    {teacher}
                  </div>
                );
              })}
            </React.Fragment>
          ))}
        </div>
      </main>

      {/* 3. 오른쪽: TODO LIST */}
      <aside className="col-span-3 bg-[#161B22] rounded-3xl border border-slate-800 p-8 flex flex-col shadow-xl">
        <h3 className="text-xl font-black text-slate-500 mb-8 flex items-center gap-3 uppercase tracking-tighter"><CheckCircle2 size={24} /> Todo List</h3>
        <div className="flex-1 overflow-y-auto space-y-4">
          {todos.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center opacity-20 text-slate-500 text-center">
              <AlertCircle size={48} className="mb-2" />
              <p className="font-bold">목록이 비어있거나 <br/> 시트 주소를 확인 중입니다.</p>
            </div>
          ) : (
            todos.map(t => (
              <div key={t.id} className="p-5 rounded-2xl bg-[#0A0C10] border border-slate-800 text-slate-200 font-bold text-lg hover:border-sky-500/50 transition-all shadow-sm">{t.text}</div>
            ))
          )}
        </div>
        <div className="mt-6 pt-6 border-t border-slate-800 text-[10px] text-slate-700 font-black text-center tracking-[0.2em] uppercase">
          Smart Dashboard v2.5 for Laptop
        </div>
      </aside>
    </div>
  );
}
