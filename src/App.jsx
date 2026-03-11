import React, { useState, useEffect, useRef } from 'react';
import Papa from 'papaparse';
import { Clock, Radio, CheckCircle2, Pencil, Trash2, X, Cloud } from 'lucide-react'; // 'Cloud' 아이콘 추가

export default function App() {
  const [grid, setGrid] = useState([]);
  const [todos, setTodos] = useState([]);
  const [weather, setWeather] = useState(null);
  const [now, setNow] = useState(new Date());
  const [currentPos, setCurrentPos] = useState({ dayIdx: -1, periodIdx: -1 });
  const [todoInput, setTodoInput] = useState("");

  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [memoMode, setMemoMode] = useState(false);
  const [ctx, setCtx] = useState(null);

  const TIMETABLE_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vSfFMWDov9yz7QPfJOrdu15kgAdzhpJ-kMkn1zW6QjiRUzAecmNh4sPO9C3HzYmmlhl5xS5su3EWQSy/pub?gid=0&output=csv";
  const TODO_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vSfFMWDov9yz7QPfJOrdu15kgAdzhpJ-kMkn1zW6QjiRUzAecmNh4sPO9C3HzYmmlhl5xS5su3EWQSy/pub?gid=684281614&single=true&output=csv";
  const WEATHER_API_KEY = "9addde09be74cdb63aab8481a0a207a0"; 
  const CITY = "Gwangju";

  useEffect(() => {
    const fetchData = function() {
      Papa.parse(TIMETABLE_URL, { download: true, complete: function(res) { setGrid(res.data); } });
      Papa.parse(TODO_URL, {
        download: true,
        complete: function(res) {
          const fetched = res.data.filter(function(row) { return row[0] && row[0].trim() !== ""; })
            .map(function(row, idx) { return { id: idx, text: row[0], done: false }; });
          setTodos(fetched);
        },
      });
      fetch("https://api.openweathermap.org/data/2.5/weather?q=" + CITY + "&appid=" + WEATHER_API_KEY + "&units=metric&lang=kr")
        .then(function(res) { return res.json(); }).then(function(data) { setWeather(data); });
    };

    const updateTime = function() {
      const d = new Date(); setNow(d);
      const day = d.getDay(); 
      const time = d.getHours() * 100 + d.getMinutes();
      let p = -1;
      if (time >= 850 && time < 950) p = 1;
      else if (time >= 950 && time < 1050) p = 2;
      else if (time >= 1050 && time < 1150) p = 3;
      else if (time >= 1150 && time < 1330) p = 4;
      else if (time >= 1330 && time < 1430) p = 5;
      else if (time >= 1430 && time < 1520) p = 6;
      else if (time >= 1520 && time < 1620) p = 7;
      setCurrentPos({ dayIdx: day, periodIdx: p });
    };

    fetchData(); updateTime();
    const timer = setInterval(function() { fetchData(); updateTime(); }, 60000);
    return function() { clearInterval(timer); };
  }, []);

  useEffect(() => {
    if (memoMode && canvasRef.current) {
      const canvas = canvasRef.current;
      canvas.width = window.innerWidth; canvas.height = window.innerHeight;
      const context = canvas.getContext('2d');
      context.lineCap = "round"; context.strokeStyle = "#ffffff"; context.lineWidth = 5;
      setCtx(context);
    }
  }, [memoMode]);

  const draw = function(e) {
    if (!isDrawing) return;
    const x = e.clientX || (e.touches && e.touches[0].clientX);
    const y = e.clientY || (e.touches && e.touches[0].clientY);
    ctx.lineTo(x, y); ctx.stroke(); ctx.beginPath(); ctx.moveTo(x, y);
  };

  const moon = (function() {
    const lp = 2551443; const phase = ((now.getTime() - new Date(1970, 0, 7, 20, 35, 0).getTime()) / 1000) % lp;
    const res = Math.floor(phase / (24 * 3600)) + 1;
    if (res <= 1) return { n: "삭", i: "🌑" }; if (res <= 9) return { n: "상현", i: "🌓" };
    if (res <= 16) return { n: "보름", i: "🌕" }; if (res <= 24) return { n: "하현", i: "🌗" };
    return { n: "그믐", i: "🌘" };
  })();

  return (
    <div className="flex h-screen w-full bg-[#0F1115] text-slate-200 p-6 gap-6 font-sans overflow-hidden relative select-none">
      <div className="absolute inset-0 opacity-10 pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/stardust.png')]"></div>

      {memoMode && (
        <canvas ref={canvasRef} onMouseDown={function(e) {setIsDrawing(true); draw(e);}} onMouseUp={function() {setIsDrawing(false); ctx.beginPath();}} onMouseMove={draw} onTouchStart={function(e) {setIsDrawing(true); draw(e);}} onTouchEnd={function() {setIsDrawing(false); ctx.beginPath();}} onTouchMove={draw} className="absolute inset-0 z-50 cursor-crosshair touch-none" />
      )}

      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-[60] flex gap-4 bg-[#1C1F26] p-4 rounded-full border border-slate-700 shadow-2xl">
        <button onClick={function() { setMemoMode(!memoMode); }} className={"p-4 rounded-full " + (memoMode ? 'bg-white text-black' : 'bg-slate-800')}>{memoMode ? <X size={28}/> : <Pencil size={28}/>}</button>
        {memoMode && <button onClick={function() { ctx.clearRect(0,0,canvasRef.current.width,canvasRef.current.height); }} className="p-4 bg-red-600 rounded-full"><Trash2 size={28}/></button>}
      </div>

      <aside className="w-1/5 flex flex-col gap-6 z-10">
        <div className="bg-[#1C1F26] p-8 rounded-3xl border border-slate-800 shadow-xl text-center">
          <h1 className="text-6xl font-black mb-1 text-white">{now.toLocaleTimeString('ko-KR', { hour12: false, hour: '2-digit', minute: '2-digit' })}</h1>
          <p className="text-slate-500 font-black text-sm mt-3">{now.toLocaleDateString('ko-KR', { dateStyle: 'full' })}</p>
        </div>

        <div className="bg-[#1C1F26] p-6 rounded-3xl border border-slate-800 flex-1 flex flex-col justify-center items-center shadow-2xl text-center">
          {/* [날씨 아이콘 수정] 외부 이미지를 버리고 내장된 'Cloud' 아이콘을 사용합니다. */}
          {weather && weather.weather && <Cloud size={100} color="#94a3b8" style={{ margin: '0 auto' }} />}
          
          <p className="text-6xl font-black">{(weather && weather.main) ? Math.round(weather.main.temp) : '--'}°C</p>
          <p className="text-xl font-bold text-slate-400 mb-6">{(weather && weather.weather) ? weather.weather[0].description.replace("온흐림","흐림") : "연결 중"}</p>
          <div className="w-full flex justify-center px-4 border-t border-slate-800 pt-6">
             <span className="text-xl font-bold text-yellow-500 font-black">EARTH SCIENCE</span>
          </div>
        </div>
      </aside>

      <main className="flex-1 bg-[#1C1F26]/80 rounded-3xl border border-slate-700 p-8 flex flex-col z-10 shadow-2xl overflow-hidden">
        <h2 className="text-2xl font-black flex items-center gap-3 mb-8 text-white">
          <Radio size={28} className="text-red-500 animate-pulse" /> 지구과학실 실시간 현황
        </h2>
        <div className="flex-1 grid grid-cols-6 gap-3">
          <div />
          {["월", "화", "수", "목", "금"].map(function(d, i) {
            return <div key={d} className={"text-center text-2xl font-black " + (currentPos.dayIdx === i + 1 ? "text-white" : "text-slate-600")}>{d}</div>;
          })}
          {[1, 2, 3, 4, 5, 6, 7].map(function(p) {
            return (
              <React.Fragment key={p}>
                <div className="flex items-center justify-center bg-[#2D333D] rounded-xl font-black text-2xl text-slate-100 border border-slate-600 shadow-inner">{p}</div>
                {[1, 2, 3, 4, 5].map(function(d) {
                  const teacher = (grid[p] && grid[p][d]) || "";
                  const isActive = currentPos.dayIdx === d && currentPos.periodIdx === p;
                  return (
                    <div key={d + "-" + p} className={"flex items-center justify-center rounded-xl text-xl font-black border-2 transition-all duration-500 " + 
                      (isActive 
                        ? "bg-slate-200 text-slate-900 shadow-lg scale-105 border-white z-20" 
                        : "bg-[#16191F] border-slate-800 text-slate-400")}
                    >
                      {teacher}
                    </div>
                  );
                })}
              </React.Fragment>
            );
          })}
        </div>
      </main>

      <aside className="w-1/5 bg-[#1C1F26] rounded-3xl border border-slate-800 p-6 z-10 shadow-xl flex flex-col">
        <h3 className="text-xl font-black flex items-center gap-2 mb-6 text-slate-400"><CheckCircle2 size={24} /> TODO LIST</h3>
        <div className="flex-1 overflow-y-auto space-y-3 mb-4">
          {todos.map(function(todo) {
            return (
              <div key={todo.id} className={"p-4 rounded-2xl border flex items-center justify-between " + (todo.done ? 'bg-slate-800 opacity-40' : 'bg-[#2D333D] border-slate-600')}>
                <span className={"text-base font-bold flex-1 cursor-pointer " + (todo.done ? 'line-through text-slate-500' : 'text-slate-100')} onClick={function() { setTodos(todos.map(function(t) { return t.id === todo.id ? { ...t, done: !t.done } : t; })); }}>{todo.text}</span>
                <button onClick={function() { setTodos(todos.filter(function(t) { return t.id !== todo.id; })); }} className="text-slate-600 hover:text-red-500 ml-2"><Trash2 size={18} /></button>
              </div>
            );
          })}
        </div>
        <input type="text" placeholder="할 일 추가..." value={todoInput} className="w-full bg-[#0F1115] border border-slate-700 rounded-xl p-3 text-sm focus:outline-none" onChange={function(e) { setTodoInput(e.target.value); }} onKeyPress={function(e) { if (e.key === 'Enter' && todoInput) { setTodos([{ id: Date.now(), text: todoInput, done: false }].concat(todos)); setTodoInput(""); } }} />
      </aside>
    </div>
  );
}
