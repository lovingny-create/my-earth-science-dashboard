import React, { useState, useEffect } from 'react';
import Papa from 'papaparse';
import { Clock, Radio, CheckCircle2, Cloud, Sun, Calendar, LayoutGrid, Moon, ListChecks, Bell, Zap } from 'lucide-react';

// --- [1년치 학사 일정 데이터베이스] ---
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

  const TIMETABLE_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vSfFMWDov9yz7QPfJOrdu15kgAdzhpJ-kMkn1zW6QjiRUzAecmNh4sPO9C3HzYmmlhl5xS5su3EWQSy/pub?gid=0&single=true&output=csv";
  const TODO_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQFJ5d-I901hCCEPOA8awuxVJNpIbTWQjSt7_LO-fg6LzrEuQUDP2HoKAOHwE7YeTdnLVQ3devIeRf6/pub?gid=210287103&single=true&output=csv";
  const WEATHER_API_KEY = "9addde09be74cdb63aab8481a0a207a0"; 
  const CITY = "Gwangju";
  const SUN_IMAGE_URL = "https://suntoday.lmsal.com/suntoday/images/latest_171.jpg";

  const getMoonPhase = (d) => {
    let year = d.getFullYear(); let month = d.getMonth() + 1; let day = d.getDate();
    if (month < 3) { year--; month += 12; }
    const a = Math.floor(year / 100); const b = Math.floor(a / 4);
    const jd = (2 - a + b) + day + Math.floor(365.25 * (year + 4716)) + Math.floor(30.6001 * (month + 1)) - 1524.5;
    const phase = ((jd - 2451550.1) / 29.530588853) % 1;
    return phase * 30;
  };

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
  const moonAge = getMoonPhase(now).toFixed(1);

  return (
    <div className="min-h-screen bg-[#020617] text-slate-200 p-8 grid grid-cols-12 gap-8 font-sans overflow-hidden relative">
      <div className="absolute top-[-5%] left-[-5%] w-[30%] h-[30%] bg-indigo-600/10 rounded-full blur-[100px] pointer-events-none"></div>

      {/* 1단 (좌측) */}
      <div className="col-span-3 flex flex-col gap-6 overflow-hidden">
        <section className="bg-white/5 backdrop-blur-xl p-8 rounded-[2.5rem] border border-white/10 shadow-2xl text-center">
          <h1 className="text-6xl font-black text-white italic">{now.toLocaleTimeString('ko-KR', { hour12: false, hour: '2-digit', minute: '2-digit' })}</h1>
          <p className="text-indigo-400 font-bold mt-3 uppercase tracking-widest">{now.toLocaleDateString('ko-KR', { month: 'long', day: 'numeric', weekday: 'short' })}</p>
        </section>

        <section className="bg-white/5 backdrop-blur-md p-6 rounded-[2rem] border border-white/10 flex items-center justify-around">
          <Cloud size={40} className="text-sky-400" />
          <div className="text-right">
            <p className="text-4xl font-black text-white">{weather?.main ? Math.round(weather.main.temp) : '--'}°</p>
            <p className="text-slate-400 text-sm font-bold uppercase">{weather?.weather?.[0]?.description || "Loading"}</p>
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
                  return (<div key={`${d}-${p}`} className={`flex items-center justify-center rounded-xl font-bold border ${isActive ? "bg-white text-black border-white shadow-xl scale-105 z-10" : "bg-white/5 border-white/5 text-slate-500"}`}>{teacher}</div>);
                })}
              </React.Fragment>
            ))}
          </div>
        </section>
      </div>

      {/* 2단 (중앙): 통합 박스 레이아웃 적용 */}
      <div className="col-span-5 flex flex-col gap-6 overflow-hidden">
        <div className="grid grid-cols-2 gap-6">
          <section className="bg-black/40 backdrop-blur-md p-4 rounded-[2.5rem] border border-red-500/20 shadow-2xl group">
            <h3 className="text-[10px] font-black text-red-500/80 mb-3 flex items-center gap-2 tracking-widest uppercase"><Sun size={12} /> SDO AIA 171</h3>
            <div className="rounded-2xl overflow-hidden aspect-square border border-white/5">
              <img src={`${SUN_IMAGE_URL}?t=${Date.now()}`} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt="Sun" />
            </div>
          </section>
          <section className="bg-white/5 backdrop-blur-md p-8 rounded-[2.5rem] border border-white/10 flex flex-col justify-center items-center text-center shadow-xl">
            <div className="p-4 bg-yellow-400/10 rounded-full mb-4"><Moon size={40} className="text-yellow-200" /></div>
            <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-1">Moon Phase</p>
            <p className="text-4xl font-black text-yellow-200 tracking-tighter">{moonAge}<span className="text-sm ml-1 text-slate-500">d</span></p>
          </section>
        </div>

        {/* [학사 일정 통합 박스 영역] */}
        <section className="bg-gradient-to-br from-indigo-500/10 to-transparent backdrop-blur-md p-8 rounded-[3rem] border border-indigo-500/20 flex-1 flex flex-col min-h-0 overflow-hidden">
          <h3 className="text-2xl font-black text-indigo-300 mb-6 flex items-center gap-3 italic">
            <Bell size={28} /> {now.getMonth() + 1}월 학사 일정
          </h3>
          <div className="flex-1 overflow-y-auto bg-white/5 rounded-3xl p-6 border border-white/5 shadow-inner custom-scrollbar">
            {currentMonthPlans.length > 0 ? (
              <div className="space-y-4">
                {currentMonthPlans.map((plan, idx) => (
                  <p key={idx} className="text-lg font-bold text-slate-300 leading-relaxed border-b border-white/5 pb-3 last:border-0 last:pb-0">
                    {plan}
                  </p>
                ))}
              </div>
            ) : (
              <p className="text-slate-600 font-bold text-center mt-10 italic">이번 달은 등록된 일정이 없습니다.</p>
            )}
          </div>
        </section>
      </div>

      {/* 3단 (우측) */}
      <aside className="col-span-4 bg-white/5 backdrop-blur-2xl rounded-[3rem] border border-white/10 p-10 flex flex-col shadow-2xl h-full">
        <header className="flex justify-between items-center mb-10 border-b border-white/10 pb-8">
          <h3 className="text-3xl font-black text-white flex items-center gap-5"><ListChecks size={36} className="text-emerald-400" /> TODO LIST</h3>
        </header>
        <div className="flex-1 overflow-y-auto space-y-5 pr-3 custom-scrollbar">
          {todos.length === 0 ? (<div className="h-full flex flex-col items-center justify-center opacity-20"><Calendar size={80} className="text-slate-600 mb-4" /><p className="text-xl font-black">할 일을 작성해 보세요.</p></div>) : 
            todos.map(t => (<div key={t.id} className="p-7 rounded-[2rem] bg-white/5 border border-white/5 hover:border-emerald-500/40 hover:bg-emerald-500/5 transition-all shadow-md group"><p className="text-2xl font-bold text-slate-200 group-hover:text-white">{t.text}</p></div>))}
        </div>
      </aside>
    </div>
  );
}
