import React, { useState, useEffect, useRef } from 'react';
import Papa from 'papaparse';
import { Clock, Radio, CheckCircle2, Pencil, Trash2, X } from 'lucide-react';

export default function App() {
  const [grid, setGrid] = useState([]);
  const [todos, setTodos] = useState([]);
  const [weather, setWeather] = useState(null);
  const [now, setNow] = useState(new Date());
  const [currentPos, setCurrentPos] = useState({ dayIdx: -1, periodIdx: -1 });
  const [todoInput, setTodoInput] = useState("");

  // --- 판서 상태 ---
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [memoMode, setMemoMode] = useState(false);
  const [ctx, setCtx] = useState(null);

  // --- [주요 설정] ---
  const TIMETABLE_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vSfFMWDov9yz7QPfJOrdu15kgAdzhpJ-kMkn1zW6QjiRUzAecmNh4sPO9C3HzYmmlhl5xS5su3EWQSy/pub?gid=0&output=csv"; // 시트1 주소
  const TODO_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vSfFMWDov9yz7QPfJOrdu15kgAdzhpJ-kMkn1zW6QjiRUzAecmNh4sPO9C3HzYmmlhl5xS5su3EWQSy/pub?gid=684281614&single=true&output=csv"; // 시트2 주소
  const WEATHER_API_KEY = "9addde09be74cdb63aab8481a0a207a0"; 
  const CITY = "Gwangju";

  useEffect(() => {
    const fetchData = () => {
      // 1. 시트1 (시간표) 가져오기
      Papa.parse(TIMETABLE_URL, {
        download: true,
        complete: (res) => setGrid(res.data),
      });

      // 2. 시트2 (할 일) 가져오기
      Papa.parse(TODO_URL, {
        download: true,
        complete: (res) => {
          // 시트2의 A열 데이터를 가져와 TODO 리스트 생성
          const fetched = res.data
            .filter(row => row[0] && row[0].trim() !== "") // 빈 줄 제외
            .map((row, idx) => ({ id: idx, text: row[0], done: false }));
          setTodos(fetched);
        },
      });

      // 3. 날씨 가져오기
      fetch(`https://api.openweathermap.org/data/2.5/weather?q=${CITY}&appid=${WEATHER_API_KEY}&units=metric&lang=kr`)
        .then(res => res.json()).then(data => setWeather(data));
    };

    const updateTime = () => {
      const d = new Date(); setNow(d);
      const day = d.getDay(); const time = d.getHours() * 100 + d.getMinutes();
      let p = -1;
      if (time >= 900 && time < 950) p = 1;
      else if (time >= 1000 && time < 1050) p = 2;
      else if (time >= 1100 && time < 1150) p = 3;
      else if (time >= 1200 && time < 1250) p = 4;
      else if (time >= 1350 && time < 1440) p = 5;
      else if (time >= 1450 && time < 1540) p = 6;
      else if (time >= 1550 && time < 1640) p = 7;
      setCurrentPos({ dayIdx: day, periodIdx: p });
    };

    fetchData(); updateTime();
    const timer = setInterval(() => { fetchData(); updateTime(); }, 60000);
    return () => clearInterval(timer);
  }, []);

  // --- 판서 로직 ---
  useEffect(() => {
    if (memoMode && canvasRef.current) {
      const canvas = canvasRef.current;
      canvas.width = window.innerWidth; canvas.height = window.innerHeight;
      const context = canvas.getContext('2d');
      context.lineCap = "round"; context.strokeStyle = "#3b82f6"; context.lineWidth = 5;
      setCtx(context);
    }
  }, [memoMode]);

  const draw = (e) => {
    if (!isDrawing) return;
    const x = e.clientX || (e.touches && e.touches[0].clientX);
    const y = e.clientY || (e.touches && e.touches[0].clientY);
    ctx.lineTo(x, y); ctx.stroke(); ctx.beginPath(); ctx.moveTo(x, y);
  };

  const getMoon = () => {
    const lp = 2551443; const phase = ((now.getTime() - new Date(1970, 0, 7, 20, 35, 0).getTime()) / 1000) % lp;
    const res = Math.floor(phase / (24 * 3600)) + 1;
    if (res <= 1) return { n: "삭", i: "🌑" }; if (res <= 9) return { n: "상현", i: "🌓" };
    if (res <= 16) return { n: "보름", i: "🌕" }; if (res <= 24) return { n: "하현", i: "🌗" };
    return { n: "그믐", i: "🌘" };
  };

  return (
    <div className="flex h-screen w-full bg-[#0F1115] text-slate-200 p-6 gap-6 font-sans overflow-hidden relative select-none">
      <div className="absolute inset-0 opacity-10 pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/stardust.png')]"></div>

      {memoMode && (
        <canvas ref={canvasRef} onMouseDown={(e) => {setIsDrawing(true); draw(e);}} onMouseUp={() => {setIsDrawing(false); ctx.beginPath();}} onMouseMove={draw} onTouchStart={(e) => {setIsDrawing(true); draw(e);}} onTouchEnd={() => {setIsDrawing(false); ctx.beginPath();}} onTouchMove={draw} className="absolute inset-0 z-50 cursor-crosshair touch-none" />
      )}

      {/* 칠판 컨트롤러 */}
      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-[60] flex gap-4 bg-[#1C1F26] p-4 rounded-full border border-slate-700 shadow-2xl">
        <button onClick={() => setMemoMode(!memoMode)} className={`p-3 rounded-full ${memoMode ? 'bg-blue-600' : 'bg-slate-800'}`}>{memoMode ? <X /> : <Pencil />}</button>
        {memoMode && <button onClick={() => ctx.clearRect(0,0,canvasRef.current.width,canvasRef.current.height)} className="p-3 bg-red-600 rounded-full"><Trash2 /></button>}
      </div>

      {/* 왼쪽 사이드바 */}
      <aside className="w-1/5 flex flex-col gap-6 z-10">
        <div className="bg-[#1C1F26] p-6 rounded-3xl border border-slate-800 shadow-xl text-center">
          <h1 className="text-6xl font-black mb-1 leading-none">{now.toLocaleTimeString('ko-KR', { hour12: false, hour: '2-digit', minute: '2-digit' })}</h1>
          <p className="text-slate-500 font-bold text-sm mt-2">{now.toLocaleDateString('ko-KR', { dateStyle: 'full' })}</p>
        </div>

        <div className="bg-[#1C1F26] p-6 rounded-3xl border border-slate-800 flex-1 flex flex-col justify-center items-center shadow-2xl text-center">
          {weather?.weather && <img src={`https://openweathermap.org/img/wn/${weather.weather[0].icon}@4x.png`} className="w-24 h-24" alt="weather icon" />}
          <p className="text-5xl font-black">{weather?.main ? Math.round(weather.main.temp) : '--'}°C</p>
          <p className="text-lg font-bold text-blue-300 mb-6">{weather?.weather?.[0].description.replace("온흐림","흐림")}</p>
          <div className="w-full flex justify-between px-4 border-t border-slate-800 pt-6">
             <span className="text-xl font-bold text-yellow-400 font-black">{getMoon().n} {getMoon().i}</span>
          </div>
        </div>
      </aside>

      {/* 중앙 시간표 */}
      <main className="flex-1 bg-[#1C1F26]/80 rounded-3xl border border-slate-700 p-8 flex flex-col z-10 shadow-2xl">
        <h2 className="text-2xl font-black flex items-center gap-3 mb-8 text-white">
          <Radio size={28} className="text-red-500 animate-pulse" /> 지구과학과 시간표
        </h2>
        <div className="flex-1 grid grid-cols-6 gap-3">
          <div />
          {["월", "화", "수", "목", "금"].map((d, i) => (
            <div key={d} className={`text-center text-2xl font-black ${currentPos.dayIdx === i + 1 ? "text-blue-400" : "text-white"}`}>{d}</div>
          ))}
          {[1, 2, 3, 4, 5, 6, 7].map(p => (
            <React.Fragment key={p}>
              <div className="flex items-center justify-center bg-[#2D333D] rounded-xl font-black text-2xl text-slate-100 border border-slate-600">{p}</div>
              {[1, 2, 3, 4, 5].map(d => {
                const teacher = grid[p]?.[d] || "";
                const isActive = currentPos.dayIdx === d && currentPos.periodIdx === p;
                return (
                  <div key={`${d}-${p}`} className={`flex items-center justify-center rounded-xl text-xl font-black border-2 ${isActive ? "bg-blue-600 text-white shadow-[0_0_40px_rgba(37,99,235,0.7)] scale-105 border-blue-300 z-20" : "bg-[#16191F] border-slate-800"}`}>
                    {teacher}
                  </div>
                );
              })}
            </React.Fragment>
          ))}
        </div>
      </main>

      {/* 오른쪽 할 일 (시트2 연동) */}
      <aside className="w-1/5 bg-[#1C1F26] rounded-3xl border border-slate-800 p-6 z-10 shadow-xl flex flex-col">
        <h3 className="text-xl font-black flex items-center gap-2 mb-6 text-blue-400">
          <CheckCircle2 size={24} /> TODO LIST
        </h3>
        <div className="flex-1 overflow-y-auto space-y-3 mb-4">
          {todos.map(todo => (
            <div key={todo.id} className={`p-4 rounded-2xl border flex items-center justify-between ${todo.done ? 'bg-slate-800 opacity-40' : 'bg-[#2D333D] border-slate-600'}`}>
              <div className="flex items-center gap-3 flex-1 cursor-pointer" onClick={() => setTodos(todos.map(t => t.id === todo.id ? {...t, done: !t.done} : t))}>
                <span className={`text-base font-bold ${todo.done ? 'line-through text-slate-500' : 'text-slate-100'}`}>{todo.text}</span>
              </div>
              <button onClick={() => setTodos(todos.filter(t => t.id !== todo.id))} className="text-slate-600 hover:text-red-500 ml-2">
                <Trash2 size={18} />
              </button>
            </div>
          ))}
        </div>
        <input 
          type="text" placeholder="빠른 추가..." value={todoInput}
          className="w-full bg-[#0F1115] border border-slate-700 rounded-xl p-3 text-sm focus:outline-none"
          onChange={(e) => setTodoInput(e.target.value)}
          onKeyPress={(e) => {
            if (e.key === 'Enter' && todoInput) {
              setTodos([{ id: Date.now(), text: todoInput, done: false }, ...todos]);
              setTodoInput("");
            }
          }}
        />
      </aside>
    </div>
  );
}
