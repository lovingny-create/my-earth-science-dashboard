import React, { useState, useEffect, useRef } from 'react';
import Papa from 'papaparse';
import { Clock, Radio, CheckCircle2, Pencil, Trash2, X, Cloud } from 'lucide-react';

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

  // --- [주의!] 시트1(시간표) 주소 ---
  const TIMETABLE_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vSfFMWDov9yz7QPfJOrdu15kgAdzhpJ-kMkn1zW6QjiRUzAecmNh4sPO9C3HzYmmlhl5xS5su3EWQSy/pub?gid=0&output=csv";
  
  // --- [주의!] 시트2(할일) 주소: 반드시 선생님의 시트2 '웹에 게시' 주소로 교체하세요! ---
  // 주소 끝에 gid=숫자 부분이 시트2를 의미합니다.
  const TODO_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQFJ5d-I901hCCEPOA8awuxvJNpIbTWQjSt7_L0-fg6LzrEuQUDP2HoKAOHwE7YeTdnLVQ3devIeRf6/pub?output=csv";

  const WEATHER_API_KEY = "9addde09be74cdb63aab8481a0a207a0"; 
  const CITY = "Gwangju";

  useEffect(function() {
    function fetchData() {
      // 시간표 파싱
      Papa.parse(TIMETABLE_URL, { 
        download: true, 
        header: false,
        skipEmptyLines: true,
        complete: function(res) { setGrid(res.data); } 
      });

      // 할일 목록 파싱 (더 안정적인 로직으로 변경)
      Papa.parse(TODO_URL, {
        download: true,
        header: false,
        skipEmptyLines: true,
        complete: function(res) {
          if (res.data && res.data.length > 0) {
            var fetched = res.data
              .filter(function(row) { return row[0] && row[0].trim() !== ""; })
              .map(function(row, idx) { return { id: "sheet-" + idx, text: row[0], done: false }; });
            setTodos(fetched);
          }
        },
      });

      fetch("https://api.openweathermap.org/data/2.5/weather?q=" + CITY + "&appid=" + WEATHER_API_KEY + "&units=metric&lang=kr")
        .then(function(res) { return res.json(); }).then(function(data) { setWeather(data); });
    }

    function updateTime() {
      var d = new Date(); setNow(d);
      var day = d.getDay(); 
      var time = d.getHours() * 100 + d.getMinutes();
      var p = -1;
      if (time >= 850 && time < 950) p = 1;
      else if (time >= 950 && time < 1049) p = 2;
      else if (time >= 1050 && time < 1149) p = 3;
      else if (time >= 1150 && time < 1329) p = 4;
      else if (time >= 1330 && time < 1429) p = 5;
      else if (time >= 1430 && time < 1519) p = 6;
      else if (time >= 1520 && time < 1620) p = 7;
      setCurrentPos({ dayIdx: day, periodIdx: p });
    }

    fetchData(); updateTime();
    var timer = setInterval(fetchData, 60000);
    var timer2 = setInterval(updateTime, 1000);
    return function() { clearInterval(timer); clearInterval(timer2); };
  }, []);

  // 판서 기능
  useEffect(function() {
    if (memoMode && canvasRef.current) {
      var canvas = canvasRef.current;
      canvas.width = window.innerWidth; canvas.height = window.innerHeight;
      var context = canvas.getContext('2d');
      context.lineCap = "round"; context.strokeStyle = "#ffffff"; context.lineWidth = 5;
      setCtx(context);
    }
  }, [memoMode]);

  var draw = function(e) {
    if (!isDrawing) return;
    var x = e.clientX || (e.touches && e.touches[0].clientX);
    var y = e.clientY || (e.touches && e.touches[0].clientY);
    ctx.lineTo(x, y); ctx.stroke(); ctx.beginPath(); ctx.moveTo(x, y);
  };

  var moon = (function() {
    var lp = 2551443; var phase = ((new Date().getTime() - new Date(1970, 0, 7, 20, 35, 0).getTime()) / 1000) % lp;
    var res = Math.floor(phase / (24 * 3600)) + 1;
    if (res <= 1) return { n: "삭", i: "🌑" }; if (res <= 9) return { n: "상현", i: "🌓" };
    if (res <= 16) return { n: "보름", i: "🌕" }; if (res <= 24) return { n: "하현", i: "🌗" };
    return { n: "그믐", i: "🌘" };
  })();

  return (
    <div style={{ display: 'flex', height: '100vh', width: '100%', backgroundColor: '#0F1115', color: '#cbd5e1', padding: '20px', boxSizing: 'border-box', fontFamily: 'sans-serif', overflow: 'hidden', position: 'relative' }}>
      <div style={{ position: 'absolute', inset: 0, opacity: 0.1, pointerEvents: 'none', backgroundImage: "url('https://www.transparenttextures.com/patterns/stardust.png')" }}></div>

      {memoMode && (
        <canvas ref={canvasRef} onMouseDown={function(e) {setIsDrawing(true); draw(e);}} onMouseUp={function() {setIsDrawing(false); ctx.beginPath();}} onMouseMove={draw} onTouchStart={function(e) {setIsDrawing(true); draw(e);}} onTouchEnd={function() {setIsDrawing(false); ctx.beginPath();}} onTouchMove={draw} style={{ position: 'absolute', inset: 0, zIndex: 50, cursor: 'crosshair', touchAction: 'none' }} />
      )}

      {/* 칠판 컨트롤러 */}
      <div style={{ position: 'absolute', bottom: '40px', left: '50%', transform: 'translateX(-50%)', zIndex: 60, display: 'flex', gap: '15px', backgroundColor: '#1C1F26', padding: '15px', borderRadius: '50px', border: '1px solid #334155', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)' }}>
        <button onClick={function() { setMemoMode(!memoMode); }} style={{ padding: '15px', borderRadius: '50px', border: 'none', backgroundColor: memoMode ? 'white' : '#334155', color: memoMode ? 'black' : 'white', cursor: 'pointer' }}>{memoMode ? <X size={28}/> : <Pencil size={28}/>}</button>
        {memoMode && <button onClick={function() { ctx.clearRect(0,0,canvasRef.current.width,canvasRef.current.height); }} style={{ padding: '15px', borderRadius: '50px', border: 'none', backgroundColor: '#dc2626', color: 'white', cursor: 'pointer' }}><Trash2 size={28}/></button>}
      </div>

      {/* 1. 사이드바 */}
      <div style={{ width: '22%', display: 'flex', flexDirection: 'column', gap: '20px', zIndex: 10 }}>
        <div style={{ backgroundColor: '#1C1F26', padding: '25px', borderRadius: '24px', border: '1px solid #334155', textAlign: 'center' }}>
          <h1 style={{ fontSize: '3.5rem', fontWeight: '900', margin: 0, color: 'white' }}>{now.toLocaleTimeString('ko-KR', { hour12: false, hour: '2-digit', minute: '2-digit' })}</h1>
          <p style={{ color: '#64748b', fontWeight: 'bold', marginTop: '10px' }}>{now.toLocaleDateString('ko-KR', { dateStyle: 'full' })}</p>
        </div>
        <div style={{ backgroundColor: '#1C1F26', padding: '25px', borderRadius: '24px', border: '1px solid #334155', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', textAlign: 'center' }}>
          {/* [날씨 아이콘] 엑박 방지: 내장 Cloud 아이콘 사용 */}
          <Cloud size={80} color="#7dd3fc" style={{ margin: '0 auto' }} />
          <p style={{ fontSize: '3.5rem', fontWeight: '900', color: 'white', margin: '15px 0' }}>{(weather && weather.main) ? Math.round(weather.main.temp) : '--'}°C</p>
          <p style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#7dd3fc' }}>{(weather && weather.weather) ? weather.weather[0].description.replace("온흐림","흐림") : "연결 중"}</p>
          <div style={{ borderTop: '1px solid #334155', marginTop: '20px', paddingTop: '20px', fontSize: '1.2rem', fontWeight: 'bold', color: '#facc15' }}>
            {moon.n} {moon.i}
          </div>
        </div>
      </div>

      {/* 2. 시간표 */}
      <div style={{ flex: 1, backgroundColor: 'rgba(28, 31, 38, 0.8)', borderRadius: '24px', padding: '30px', marginLeft: '20px', border: '1px solid #334155', display: 'flex', flexDirection: 'column', zIndex: 10 }}>
        <h2 style={{ fontSize: '1.8rem', fontWeight: '900', margin: '0 0 20px 0', color: 'white', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Radio size={28} color="#ef4444" /> 지구과학실 실시간 현황
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '10px', flex: 1 }}>
          <div />
          {["월", "화", "수", "목", "금"].map(function(d, i) {
            return <div key={d} style={{ textAlign: 'center', fontSize: '1.5rem', fontWeight: '900', color: (currentPos.dayIdx === i + 1 ? 'white' : '#475569') }}>{d}</div>;
          })}
          {[1, 2, 3, 4, 5, 6, 7].map(function(p) {
            return (
              <React.Fragment key={p}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '12px', fontSize: '1.5rem', fontWeight: '900', backgroundColor: '#2D333D', border: '1px solid #475569', color: 'white' }}>{p}</div>
                {[1, 2, 3, 4, 5].map(function(d) {
                  var teacher = (grid[p] && grid[p][d]) || "";
                  var isActive = currentPos.dayIdx === d && currentPos.periodIdx === p;
                  return (
                    <div key={d + "-" + p} style={{ 
                      display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '12px', fontSize: '1.2rem', fontWeight: 'bold', 
                      backgroundColor: isActive ? '#e2e8f0' : '#16191F', 
                      color: isActive ? '#0f172a' : '#cbd5e1', 
                      border: isActive ? '2px solid #ffffff' : '1px solid #1e293b',
                      boxShadow: isActive ? '0 0 20px rgba(255,255,255,0.3)' : 'none'
                    }}>
                      {teacher}
                    </div>
                  );
                })}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* 3. 할 일 (시트2 데이터 연동) */}
      <div style={{ width: '22%', backgroundColor: '#1C1F26', borderRadius: '24px', padding: '25px', marginLeft: '20px', border: '1px solid #334155', display: 'flex', flexDirection: 'column', zIndex: 10 }}>
        <h3 style={{ fontSize: '1.5rem', fontWeight: '900', color: '#64748b', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}><CheckCircle2 size={24} /> TODO LIST</h3>
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {todos.length === 0 ? (
            <p style={{ color: '#475569', textAlign: 'center', marginTop: '50px' }}>할 일이 없습니다.</p>
          ) : (
            todos.map(function(todo) {
              return (
                <div key={todo.id} style={{ padding: '15px', borderRadius: '15px', backgroundColor: '#2D333D', border: '1px solid #475569', marginBottom: '10px', fontSize: '1.1rem', fontWeight: 'bold', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ textDecoration: todo.done ? 'line-through' : 'none', opacity: todo.done ? 0.4 : 1 }}>{todo.text}</span>
                  <button onClick={function() { setTodos(todos.filter(function(t) { return t.id !== todo.id; })); }} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer' }}><Trash2 size={16}/></button>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
