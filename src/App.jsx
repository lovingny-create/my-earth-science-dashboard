import React, { useState, useEffect } from 'react';
import Papa from 'papaparse';
import { Clock, Radio, CheckCircle2, Cloud, Sun, Calendar, LayoutGrid, Moon, ListChecks, Bell, Zap, Info } from 'lucide-react';

// --- [학사 일정 데이터베이스] ---
const ACADEMIC_CALENDAR = {
  "2026-3": ["2(월): 입사일, 1학기 시작일", "3(화): 1학기 개학일, 입학식", "9(월): 학급임원 선출, 학급자치회 편성", "13(금): 퇴사일", "18(수): 졸업논문계획서 제출", "20(금): 3학년 교육과정설명회", "25(수): 심화R&E계획서 제출, 자기소개서 특강(3학년)", "26(목): 학술동아리", "27(금): 1, 2학년 교육과정설명회, 퇴사일"],
  "2026-4": ["1(수): 수요일 수업", "2(목): 학술동아리", "3(금): 1인 1기 활동", "4(토): 과학나눔 페스티벌", "10(금): 퇴사일", "21(화)~24(금): 1차 지필평가", "24(금): 퇴사일", "28(화): 인문감성프로그램"],
  "2026-5": ["1(금): 퇴사일", "5(화): 어린이날", "7(목): 스포츠 문화축전", "8(금): 대학탐방/역사알기, 퇴사일", "9(토): 과학아카데미 1차", "12(화): 화요일 수업", "14(목)~15(금): 도서관의 날", "15(금): 1인 1기 활동", "20(수)~22(금): 수업공개의 날", "21(목)~29(금): 수강신청 기간", "22(금): 퇴사일", "25(월): 석가탄신일 대체공휴일", "29(금): 1인 1기 활동"],
  "2026-6": ["3(수): 지방선거", "5(금): 퇴사일", "6(토): 현충일", "10(수): 연구활동보고서 제출", "11(목): 학술동아리", "12(금): 1인 1기 활동", "15(월): 상반기 모범학생 표창", "22(월)~26(금): 2차 지필평가", "23(화): 금요일 대체 수업, 퇴사일", "29(월): 학생회 선거"],
  "2026-7": ["3(금): 3학년 교육과정설명회, 퇴사일, 방학일", "12(일): 신입생 2차 평가"],
  "2026-8": ["8(토): 신입생 3차 전형", "15(토): 광복절", "17(월): 광복절 대체휴일, 입사일", "18(화): 2학기 개학일/시작일", "21(금): 1인 1기 활동", "28(금): 퇴사일"],
  "2026-9": ["4(금)~6(일): 과학기술창업캠프", "7(월)~11(금): 수시 원서 접수 기간", "10(목): 과학아카데미 2차", "11(금): 1,2학년 설명회, 퇴사일", "16(수): 퇴사일, 교직원 워크숍", "18(금): 1인 1기 활동", "24(목)~27(일): 추석 연휴", "29(화): 목요일 대체 수업"],
  "2026-10": ["3(토): 개천절", "5(월): 개천절 대체휴일", "9(금): 한글날", "12(월)~16(금): 1차 지필평가", "16(금): 퇴사일", "17(토): 학술동아리", "23(금): 퇴사일", "26(월): 학술동아리", "30(금): 1인 1기 활동"],
  "2026-11": ["2(월): 월요일 대체 수업, 퇴사일", "3(화): 금요일 대체 수업", "4(수)~6(금): 1,2학년 자연탐사 / 3학년 입시", "6(금): 퇴사일", "11(수)~13(금): 2학기 수업공개", "12(목)~13(금): 독서의 날 행사", "17(화): 동아리 발표대회", "18(수): 연구활동보고서 제출", "20(금): 퇴사일", "25(수): 연구활동 발표대회", "27(금): 1인 1기 활동"],
  "2026-12": ["2(수): 수요일 수업", "4(금): 퇴사일", "10(목)~16(수): 2차 지필평가", "18(금): 퇴사일", "22(화): 졸업사정회, 축제", "24(목): 화요일 대체 수업, 방학일, 퇴사일", "25(금): 성탄절"],
  "2027-1": ["1(금): 신정", "4(월)~10(일): 국제교류", "14(목)~15(금): 신구부장 워크숍"],
  "2027-2": ["1(월): 퇴사일", "2(화)~13(토): 수강신청", "5(금): 영재선정심사위원회", "6(토)~9(화): 설날 연휴", "18(목)~19(금): 신학기 워크숍", "27(토): 졸업식", "28(일): 1, 2학년 2학기 종료일"]
};

export default function App() {
  const [grid, setGrid] = useState([]);
  const [todos, setTodos] = useState([]);
  const [weather, setWeather] = useState(null);
  const [now, setNow] = useState(new Date());
  const [currentPos, setCurrentPos] = useState({ dayIdx: -1, periodIdx: -1 });

  // --- [설정 정보: 선생님 이미지 기반으로 오타를 완벽 수정했습니다] ---
  const NEIS_API_KEY = "5bfe4967b9b64a3fb1693f1cc5371d50"; 
  const TIMETABLE_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vSfFMWDov9yz7QPfJOrdu15kgAdzhpJ-kMkn1zW6QjiRUzAecmNh4sPO9C3HzYmmlhl5xS5su3EWQSy/pub?gid=0&output=csv";
  const TODO_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQFJ5d-I901hCCEP0A8awuxVJNplbTWQjSt7_L0-fg6LzrEuQUDP2HoKAOHwE7YeTdnLVQ3devIeRf6/pub?gid=210287103&output=csv";
  const WEATHER_API_KEY = "9addde09be74cdb63aab8481a0a207a0"; 
  const CITY = "Gwangju";
  
  // 가장 안정적인 전세계 태양 미러 서버 (171A 파장)
  const SUN_IMAGE_URL = "https://suntoday.lmsal.com/suntoday/images/latest_171.jpg";

  useEffect(() => {
    const fetchData = () => {
      const cb = `&t=${Date.now()}`;
      Papa.parse(TIMETABLE_URL + cb, { download: true, complete: (res) => { if (res.data) setGrid(res.data); } });
      Papa.parse(TODO_URL + cb, { download: true, complete: (res) => {
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

  return (
    <div className="min-h-screen bg-[#020617] text-slate-200 p-8 grid grid-cols-12 gap-8 font-sans overflow-hidden relative">
      <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-10 pointer-events-none"></div>

      {/* 1단: 일시, 날씨, 시간표 */}
      <div className="col-span-3 flex flex-col gap-6 overflow-hidden">
        <section className="bg-white/5 backdrop-blur-xl p-8 rounded-[2.5rem] border border-white/10 shadow-2xl text-center">
          <h1 className="text-6xl font-black text-white italic">{now.toLocaleTimeString('ko-KR', { hour12: false, hour: '2-digit', minute: '2-digit' })}</h1>
          <p className="text-indigo-400 font-bold mt-3 uppercase tracking-widest">{now.toLocaleDateString('ko-KR', { month: 'long', day: 'numeric', weekday: 'short' })}</p>
        </section>

        <section className="bg-white/5 backdrop-blur-md p-6 rounded-[2rem] border border-white/10 flex items-center justify-around shadow-lg">
          <Cloud size={40} className="text-sky-400" />
          <div className="text-right">
            <p className="text-4xl font-black text-white">{weather?.main ? Math.round(weather.main.temp) : '--'}°C</p>
            <p className="text-slate-400 text-sm font-bold uppercase">{weather?.weather?.[0]?.description || "맑음"}</p>
          </div>
        </section>

        <section className="bg-white/5 backdrop-blur-md p-6 rounded-[2.5rem] border border-white/10 shadow-xl flex-1 flex flex-col min-h-0 overflow-hidden">
          <h3 className="text-lg font-black text-white mb-6 flex items-center gap-3"><LayoutGrid size={20} className="text-indigo-400" /> TIMETABLE</h3>
          <div className="flex-1 grid grid-cols-6 gap-2 text-[10px]">
            <div />{["M", "T", "W", "T", "F"].map((d, i) => (<div key={d} className={`text-center font-black pb-1 ${currentPos.dayIdx === i+1 ? "text-indigo-400" : "text-slate-600"}`}>{d}</div>))}
            {[1, 2, 3, 4, 5, 6, 7].map(p => (
              <React.Fragment key={p}>
                <div className="flex items-center justify-center font-black text-slate-700">{p}</div>
                {[1, 2, 3, 4, 5].map(d => {
                  const teacher = grid[p]?.[d] || "";
                  const isActive = currentPos.dayIdx === d && currentPos.periodIdx === p;
                  return (<div key={`${d}-${p}`} className={`flex items-center justify-center rounded-xl font-bold border transition-all ${isActive ? "bg-white text-black border-white shadow-xl scale-105 z-10" : "bg-white/5 border-white/5 text-slate-500"}`}>{teacher}</div>);
                })}
              </React.Fragment>
            ))}
          </div>
        </section>
      </div>

      {/* 2단: 태양, 월령, 통합 학사 일정 */}
      <div className="col-span-5 flex flex-col gap-6 h-full overflow-hidden">
        <div className="grid grid-cols-2 gap-6">
          <section className="bg-black/40 backdrop-blur-md p-4 rounded-[2.5rem] border border-red-500/20 shadow-2xl group">
            <h3 className="text-[10px] font-black text-red-500/80 mb-3 flex items-center gap-2 tracking-widest uppercase"><Sun size={12} /> Live Sun (Mirror)</h3>
            <div className="rounded-2xl overflow-hidden aspect-square border border-white/5 bg-slate-900">
              <img src={`${SUN_IMAGE_URL}?t=${Date.now()}`} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt="Sun" />
            </div>
          </section>

          <section className="bg-white/5 backdrop-blur-md p-8 rounded-[2.5rem] border border-white/10 flex flex-col justify-center items-center text-center shadow-xl">
            <div className="p-4 bg-yellow-400/10 rounded-full mb-4 shadow-[0_0_20px_rgba(250,204,21,0.1)]"><Moon size={40} className="text-yellow-200" /></div>
            <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-1">Moon Phase</p>
            <p className="text-4xl font-black text-yellow-200 tracking-tighter">
              {((((2 - Math.floor(now.getFullYear()/100) + Math.floor(Math.floor(now.getFullYear()/100)/4)) + now.getDate() + Math.floor(365.25 * (now.getFullYear() + 4716)) + Math.floor(30.6001 * (now.getMonth() + 2)) - 1524.5) - 2451550.1) / 29.530588853 % 1 * 30).toFixed(1)}
              <span className="text-sm ml-1 text-slate-500 font-bold italic">d</span>
            </p>
          </section>
        </div>

        {/* [리뉴얼] 통합 학사 일정 박스 */}
        <section className="bg-gradient-to-br from-indigo-500/10 to-transparent backdrop-blur-md p-8 rounded-[3rem] border border-indigo-500/20 flex-1 flex flex-col min-h-0 overflow-hidden shadow-2xl">
          <h3 className="text-2xl font-black text-indigo-300 mb-6 flex items-center gap-3 italic"><Bell size={28} className="text-indigo-400" /> {now.getMonth() + 1}월 학사 일정</h3>
          <div className="flex-1 overflow-y-auto bg-white/5 rounded-3xl p-7 border border-white/5 shadow-inner custom-scrollbar relative">
            <div className="absolute top-0 right-0 p-4 opacity-5"><Calendar size={100} /></div>
            {currentMonthPlans.length > 0 ? (
              <div className="space-y-4 text-left">
                {currentMonthPlans.map((plan, idx) => (
                  <div key={idx} className="flex gap-4 items-start border-b border-white/5 pb-4 last:border-0 last:pb-0 group hover:translate-x-2 transition-transform">
                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-2.5"></div>
                    <p className="text-lg font-bold text-slate-200 leading-relaxed group-hover:text-white transition-colors">{plan}</p>
                  </div>
                ))}
              </div>
            ) : (<p className="text-slate-600 font-bold text-center mt-10 italic">일정 정보가 없습니다.</p>)}
          </div>
        </section>
      </div>

      {/* 3단: TODO LIST */}
      <aside className="col-span-4 bg-white/5 backdrop-blur-2xl rounded-[3rem] border border-white/10 p-10 flex flex-col shadow-2xl h-full relative">
        <header className="flex justify-between items-center mb-10 border-b border-white/10 pb-8">
          <h3 className="text-3xl font-black text-white flex items-center gap-5 tracking-tighter"><ListChecks size={36} className="text-emerald-400" /> TODO LIST</h3>
          <span className="text-[10px] font-black text-slate-500 bg-slate-800/50 px-4 py-2 rounded-full border border-slate-700 tracking-[0.2em] uppercase">Private</span>
        </header>
        <div className="flex-1 overflow-y-auto space-y-5 pr-3 custom-scrollbar">
          {todos.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center opacity-20 text-slate-500">
              <CheckCircle2 size={80} className="mb-4" /><p className="text-xl font-black italic">No Pending Tasks</p>
            </div>
          ) : (
            todos.map(t => (
              <div key={t.id} className="p-7 rounded-[2rem] bg-white/5 border border-white/5 hover:border-emerald-500/40 hover:bg-emerald-500/5 transition-all shadow-md group">
                <p className="text-2xl font-bold text-slate-300 group-hover:text-white transition-colors text-left">{t.text}</p>
                <div className="w-8 h-1 bg-emerald-500/30 mt-4 rounded-full group-hover:w-full transition-all"></div>
              </div>
            ))
          )}
        </div>
        <footer className="mt-8 pt-8 border-t border-white/5 text-[9px] text-slate-700 font-black text-center tracking-[0.5em] uppercase italic">Smart Station v6.0</footer>
      </aside>
    </div>
  );
}
