import React, { useState, useEffect } from 'react';
import Papa from 'papaparse';
import { Clock, Radio, CheckCircle2, Cloud, Sun, Calendar, LayoutGrid, Moon, ListChecks, Bell, Zap, ChevronRight } from 'lucide-react';

// --- [학사 일정 데이터베이스] ---
const ACADEMIC_CALENDAR = {
  "2026-3": ["2(월): 입사일, 1학기 시작일", "3(화): 1학기 개학일, 입학식", "9(월): 학급임원 선출, 학급자치회 편성", "13(금): 퇴사일", "18(수): 졸업논문계획서 제출", "20(금): 3학년 교육과정설명회", "25(수): 심화R&E계획서 제출, 자기소개서 특강(3학년)", "26(목): 학술동아리", "27(금): 1, 2학년 교육과정설명회, 퇴사일"],
  "2026-4": ["1(수): 수요일 수업", "2(목): 학술동아리", "3(금): 1인 1기 활동", "4(토): 과학나눔 페스티벌", "10(금): 퇴사일", "21(화)~24(금): 1차 지필평가", "24(금): 퇴사일", "28(화): 인문감성프로그램"],
  "2026-5": ["1(금): 퇴사일", "5(화): 어린이날", "7(목): 스포츠 문화축전", "8(금): 대학탐방, 퇴사일", "9(토): 과학아카데미 1차", "12(화): 화요일 수업", "14(목)~15(금): 도서관의 날", "15(금): 1인 1기 활동", "20(수)~22(금): 수업공개의 날", "21(목)~29(금): 수강신청 기간", "22(금): 퇴사일", "25(월): 석가탄신일 대체공휴일", "29(금): 1인 1기 활동"],
  "2026-6": ["3(수): 지방선거", "5(금): 퇴사일", "6(토): 현충일", "10(수): 연구활동보고서 제출", "11(목): 학술동아리", "12(금): 1인 1기 활동", "15(월): 상반기 모범학생 표창", "22(월)~26(금): 2차 지필평가", "23(화): 금요일 대체 수업, 퇴사일", "29(월): 학생회 선거"]
};

export default function App() {
  const [grid, setGrid] = useState([]);
  const [todos, setTodos] = useState([]);
  const [weather, setWeather] = useState(null);
  const [now, setNow] = useState(new Date());
  const [currentPos, setCurrentPos] = useState({ dayIdx: -1, periodIdx: -1 });

  // --- [설정 정보] ---
  const NEIS_API_KEY = "5bfe4967b9b64a3fb1693f1cc5371d50";
  const TIMETABLE_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vSfFMWDov9yz7QPfJOrdu15kgAdzhpJ-kMkn1zW6QjiRUzAecmNh4sPO9C3HzYmmlhl5xS5su3EWQSy/pub?gid=0&single=true&output=csv";
  const TODO_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQFJ5d-I901hCCEP0A8awuxVJNpIbTWQjSt7_LO-fg6LzrEuQUDP2HoKAOHwE7YeTdnLVQ3devIeRf6/pub?gid=210287103&single=true&output=csv";
  const WEATHER_API_KEY = "9addde09be74cdb63aab8481a0a207a0"; 
  const CITY = "Gwangju";
  const SUN_IMAGE_URL = "https://suntoday.lmsal.com/suntoday/images/latest_171.jpg";

  // --- [달력 생성 로직] ---
  const generateCalendar = () => {
    const year = now.getFullYear();
    const month = now.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const totalDays = new Date(year, month + 1, 0).getDate();
    const days = [];
    for (let i = 0; i < firstDay; i++) days.push(null);
    for (let i = 1; i <= totalDays; i++) days.push(i);
    return days;
  };

  useEffect(() => {
    const fetchData = () => {
      const cb = `&t=${Date.now()}`;
      Papa.parse(`${TIMETABLE_URL}${cb}`, { download: true, complete: (res) => { if (res.data) setGrid(res.data); } });
      Papa.parse(`${TODO_URL}${cb}`, { download: true, complete: (res) => {
        if (res.data) {
          const fetched = res.data.filter(row => row[0]?.trim()).map((row, idx) => ({ id: `t-${idx}`, text: row[0] }));
          setTodos(fetched);
        }
      }});
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

  const currentMonthKey = `${now.getFullYear()}-${now.getMonth() + 1}`;
  const currentMonthPlans = ACADEMIC_CALENDAR[currentMonthKey] || [];
  const moonAge = (((((2 - Math.floor(now.getFullYear()/100) + Math.floor(Math.floor(now.getFullYear()/100)/4)) + now.getDate() + Math.floor(365.25 * (now.getFullYear() + 4716)) + Math.floor(30.6001 * (now.getMonth() + 2)) - 1524.5) - 2451550.1) / 29.530588853 % 1 * 30).toFixed(1));

  return (
    <div className="min-h-screen bg-[#020617] text-slate-200 p-10 grid grid-cols-12 gap-8 font-sans overflow-hidden relative">
      <div className="absolute top-[-5%] left-[-5%] w-[30%] h-[30%] bg-indigo-600/10 rounded-full blur-[100px] pointer-events-none"></div>

      {/* 1단 (좌측): 일시, 날씨, 시간표 */}
      <div className="col-span-4 flex flex-col gap-6 overflow-hidden">
        <section className="bg-white/5 backdrop-blur-xl p-8 rounded-[2.5rem] border border-white/10 text-center">
          <h1 className="text-7xl font-black text-white italic tracking-tighter drop-shadow-md">
            {now.toLocaleTimeString('ko-KR', { hour12: false, hour: '2-digit', minute: '2-digit' })}
          </h1>
          <p className="text-indigo-400 font-bold mt-2 uppercase tracking-[0.3em]">{now.toLocaleDateString('ko-KR', { dateStyle: 'full' })}</p>
        </section>

        <section className="bg-white/5 backdrop-blur-md p-6 rounded-[2rem] border border-white/10 flex items-center justify-around shadow-lg">
          <Cloud size={40} className="text-sky-400" />
          <div className="text-right">
            <p className="text-4xl font-black text-white">{weather?.main ? Math.round(weather.main.temp) : '--'}°C</p>
            <p className="text-slate-400 text-sm font-black uppercase">{weather?.weather?.[0]?.description || "맑음"}</p>
          </div>
        </section>

        <section className="bg-white/5 backdrop-blur-md p-8 rounded-[3rem] border border-white/10 shadow-xl flex-1 flex flex-col min-h-0 overflow-hidden">
          <h3 className="text-xl font-black text-white mb-6 flex items-center gap-3 italic"><LayoutGrid size={24} className="text-indigo-400" /> TIMETABLE</h3>
          <div className="flex-1 grid grid-cols-6 gap-3 text-sm">
            <div />
            {["M", "T", "W", "T", "F"].map((d, i) => (
              <div key={d} className={`text-center font-black pb-2 text-base ${currentPos.dayIdx === i+1 ? "text-indigo-400" : "text-slate-600"}`}>{d}</div>
            ))}
            {[1, 2, 3, 4, 5, 6, 7].map(p => (
              <React.Fragment key={p}>
                <div className="flex items-center justify-center font-black text-slate-700 text-lg">{p}</div>
                {[1, 2, 3, 4, 5].map(d => {
                  const teacher = grid[p]?.[d] || "";
                  const isActive = currentPos.dayIdx === d && currentPos.periodIdx === p;
                  return (
                    <div key={`${d}-${p}`} className={`flex items-center justify-center rounded-2xl font-black transition-all border-2 ${isActive ? "bg-white text-black border-white shadow-2xl scale-110 z-10 text-lg" : "bg-black/20 border-white/5 text-slate-500 text-base"}`}>
                      {teacher}
                    </div>
                  );
                })}
              </React.Fragment>
            ))}
          </div>
        </section>
      </div>

      {/* 2단 (중앙): 태양, 월령, 통합 학사 일정 */}
      <div className="col-span-4 flex flex-col gap-6 overflow-hidden">
        <div className="grid grid-cols-2 gap-6">
          <section className="bg-black/40 backdrop-blur-md p-4 rounded-[2.5rem] border border-red-500/20 shadow-2xl group">
            <h3 className="text-[10px] font-black text-red-500/80 mb-3 flex items-center gap-2 tracking-widest uppercase"><Sun size={12} /> SDO AIA 171</h3>
            <div className="rounded-3xl overflow-hidden aspect-square border border-white/5 bg-slate-900">
              <img src={`${SUN_IMAGE_URL}?t=${Date.now()}`} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt="Sun" />
            </div>
          </section>
          <section className="bg-white/5 backdrop-blur-md p-8 rounded-[2.5rem] border border-white/10 flex flex-col justify-center items-center text-center shadow-xl">
            <div className="p-4 bg-yellow-400/10 rounded-full mb-4 shadow-[0_0_20px_rgba(250,204,21,0.1)]"><Moon size={40} className="text-yellow-200" /></div>
            <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-1">Moon Phase</p>
            <p className="text-4xl font-black text-yellow-200 tracking-tighter">{moonAge}<span className="text-sm ml-1 text-slate-500 font-bold italic">d</span></p>
            <p className="text-xs font-bold text-slate-400 mt-2 italic">오늘의 월령</p>
          </section>
        </div>

        <section className="bg-gradient-to-br from-indigo-500/10 to-transparent backdrop-blur-md p-10 rounded-[3rem] border border-indigo-500/20 flex-1 flex flex-col min-h-0 overflow-hidden shadow-2xl">
          <h3 className="text-2xl font-black text-indigo-300 mb-6 flex items-center gap-3 italic tracking-tighter"><Bell size={32} className="text-indigo-400" /> {now.getMonth() + 1}월 학사 일정</h3>
          <div className="flex-1 overflow-y-auto bg-[#0A0C10]/40 rounded-[2rem] p-8 border border-white/5 shadow-inner custom-scrollbar relative text-left">
            {currentMonthPlans.length > 0 ? (
              <div className="space-y-4">
                {currentMonthPlans.map((plan, idx) => (
                  <div key={idx} className="flex gap-4 items-start border-b border-white/5 pb-4 last:border-0 last:pb-0 group">
                    <div className="w-2 h-2 rounded-full bg-indigo-500 mt-2.5"></div>
                    <p className="text-lg font-bold text-slate-200 leading-relaxed group-hover:text-white transition-colors">{plan}</p>
                  </div>
                ))}
              </div>
            ) : (<p className="text-slate-600 font-bold text-center mt-10 italic">일정이 없습니다.</p>)}
          </div>
        </section>
      </div>

      {/* 3단 (우측): TODO LIST + 달력 */}
      <aside className="col-span-4 flex flex-col gap-6 h-full overflow-hidden z-10">
        {/* 할 일 목록 */}
        <section className="bg-white/5 backdrop-blur-2xl rounded-[3rem] border border-white/10 p-10 flex flex-col shadow-2xl flex-1 min-h-0 overflow-hidden">
          <header className="flex justify-between items-center mb-8 border-b border-white/10 pb-6">
            <h3 className="text-3xl font-black text-white flex items-center gap-5 tracking-tighter italic">
              <ListChecks size={36} className="text-emerald-400" /> TODO LIST
            </h3>
          </header>
          <div className="flex-1 overflow-y-auto space-y-4 pr-3 custom-scrollbar">
            {todos.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center opacity-20 text-slate-500 text-center">
                <CheckCircle2 size={60} className="mb-4" /><p className="text-xl font-black italic underline decoration-slate-800 underline-offset-8">Clear Station</p>
              </div>
            ) : (
              todos.map(t => (
                <div key={t.id} className="p-6 rounded-[2rem] bg-white/5 border border-white/5 hover:border-emerald-500/40 hover:bg-emerald-500/5 transition-all shadow-md group">
                  <p className="text-xl font-bold text-slate-300 group-hover:text-white transition-colors text-left">{t.text}</p>
                  <div className="w-8 h-1 bg-emerald-500/30 mt-4 rounded-full group-hover:w-full transition-all"></div>
                </div>
              ))
            )}
          </div>
        </section>

        {/* [NEW] 이번 달 달력 모듈 */}
        <section className="bg-white/5 backdrop-blur-xl p-8 rounded-[2.5rem] border border-white/10 shadow-2xl">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-black text-white flex items-center gap-3 italic"><Calendar size={24} className="text-indigo-400" /> {now.getFullYear()}. {now.getMonth() + 1}</h3>
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Earth Science Station</span>
          </div>
          <div className="grid grid-cols-7 gap-2 text-center text-[10px] font-black">
            {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
              <div key={d} className={i === 0 ? "text-red-500" : i === 6 ? "text-blue-500" : "text-slate-600"}>{d}</div>
            ))}
            {generateCalendar().map((day, idx) => {
              const isToday = day === now.getDate();
              return (
                <div key={idx} className={`h-8 flex items-center justify-center rounded-lg transition-all ${day ? (isToday ? "bg-indigo-500 text-white font-black shadow-lg scale-110" : "bg-white/5 text-slate-400 hover:bg-white/10 cursor-default") : ""}`}>
                  {day || ""}
                </div>
              );
            })}
          </div>
        </section>
      </aside>
    </div>
  );
}
