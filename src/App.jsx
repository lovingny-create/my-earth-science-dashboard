import React, { useState, useEffect, useRef } from 'react';
import Papa from 'papaparse';
import { Clock, Radio, CheckCircle2, Pencil, Trash2, X, Cloud } from 'lucide-react';

export default function App() {
  const [grid, setGrid] = useState([]);
  const [todos, setTodos] = useState([]);
  const [weather, setWeather] = useState(null);
  const [meal, setMeal] = useState({ label: "점심", menu: "로딩 중..." });
  const [now, setNow] = useState(new Date());
  const [currentPos, setCurrentPos] = useState({ dayIdx: -1, periodIdx: -1 });
  const [todoInput, setTodoInput] = useState("");

  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [memoMode, setMemoMode] = useState(false);
  const [ctx, setCtx] = useState(null);

  // --- [설정 주소] ---
  const TIMETABLE_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vSfFMWDov9yz7QPfJOrdu15kgAdzhpJ-kMkn1zW6QjiRUzAecmNh4sPO9C3HzYmmlhl5xS5su3EWQSy/pub?gid=0&output=csv";
  const TODO_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vSfFMWDov9yz7QPfJOrdu15kgAdzhpJ-kMkn1zW6QjiRUzAecmNh4sPO9C3HzYmmlhl5xS5su3EWQSy/pub?gid=210287103&output=csv";
  const WEATHER_API_KEY = "9addde09be74cdb63aab8481a0a207a0"; 
  const CITY = "Gwangju";

  useEffect(function() {
    function fetchData() {
      // 1. 시간표
      Papa.parse(TIMETABLE_URL, { download: true, complete: function(res) { setGrid(res.data); } });
      
      // 2. 할일
      Papa.parse(TODO_URL, {
        download: true,
        complete: function(res) {
          var fetched = res.data.filter(function(row) { return row[0] && row[0].trim() !== ""; })
            .map(function(row, idx) { return { id: "sheet-" + idx, text: row[0], done: false }; });
          setTodos(fetched);
        },
      });

      // 3. 날씨
      fetch("https://api.openweathermap.org/data/2.5/weather?q=" + CITY + "&appid=" + WEATHER_API_KEY + "&units=metric&lang=kr")
        .then(function(res) { return res.json(); }).then(function(data) { setWeather(data); });

      // 4. 광주과학고 급식 (나이스 API)
      fetchMeal();
    }

    function fetchMeal() {
      var d = new Date();
      var yyyymmdd = d.getFullYear() + ("0" + (d.getMonth() + 1)).slice(-2) + ("0" + d.getDate()).slice(-2);
      var hour = d.getHours();
      
      var mealCode = "2"; // 기본 중식
      var mealName = "점심";
      
      if (hour < 9) { mealCode = "1"; mealName = "아침"; }
      else if (hour >= 14) { mealCode = "3"; mealName = "저녁"; }

      var url = "https://open.neis.go.kr/hub/mealServiceDietInfo?Type=json&ATPT_OFCDC_SC_CODE=F10&SD_SCHUL_CODE=7380024&MLSV_YMD=" + yyyymmdd + "&MMEAL_SC_CODE=" + mealCode;

      fetch(url)
        .then(function(res) { return res.json(); })
        .then(function(data) {
          if (data.mealServiceDietInfo) {
            var menu = data.mealServiceDietInfo[1].row[0].DDISH_NM;
            var cleanMenu = menu.replace(/[0-9.()]/g, "").replace(/<br\/>/g, ", ");
            setMeal({ label: mealName, menu: cleanMenu });
          } else {
            setMeal({ label: mealName, menu: "오늘 급식 정보가 없습니다." });
          }
        })
        .catch(function() { setMeal({ label: mealName, menu: "정보를 불러오지 못했습니다." }); });
    }

    function updateTime() {
      var d = new Date(); setNow(d);
      var day = d.getDay(); 
      var time = d.getHours() * 100 + d.getMinutes();
      var p = -1;
      // 선생님 학교 종소리 시간표 반영
      if (time >= 850 && time < 950) p = 1;
      else if (time >= 950 && time < 1050) p = 2;
      else if (time >= 1050 && time < 1150) p = 3;
      else if (time >= 1150 && time < 1330) p = 4;
      else if (time >= 1330 && time < 1430) p = 5;
      else if (time >= 1430 && time < 1520) p = 6;
      else if (time >= 1520 && time < 1620) p = 7;
      setCurrentPos({ dayIdx: day, periodIdx: p });
    }

    fetchData(); updateTime();
    var timer = setInterval(fetchData, 60000);
    var timer2 = setInterval(updateTime, 1000);
    return function() { clearInterval(timer); clearInterval(timer2); };
  }, []);

  // --- 판서 기능 ---
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

  return (
    <div style={{ display: 'flex', height: '100vh', width: '100%', backgroundColor: '#0F1115', color: '#cbd5e1', padding: '20px', boxSizing: 'border-box', fontFamily: 'sans-serif', overflow: 'hidden', position: 'relative' }}>
      <div style={{ position: 'absolute', inset: 0, opacity: 0.1, pointerEvents: 'none', backgroundImage: "url('https://www.transparenttextures.com/patterns/stardust.png')" }}></div>

      {memoMode && (
        <canvas ref={canvasRef} onMouseDown={function(e) {setIsDrawing(true); draw(e);}} onMouseUp={function() {setIsDrawing(false); ctx.beginPath();}} onMouseMove={draw} onTouchStart={function(e) {setIsDrawing(true); draw(e);}} onTouchEnd={function() {setIsDrawing(false); ctx.beginPath();}} onTouchMove={draw} style={{ position: 'absolute', inset: 0, zIndex: 50, cursor: 'crosshair', touchAction: 'none' }} />
      )}

      {/* 칠판 컨트롤러 */}
      <div style={{ position: 'absolute', bottom: '40px', left: '50%', transform: 'translateX(-50%)', zIndex: 60, display: 'flex', gap: '15px', backgroundColor: '#1C1F26', padding: '15px', borderRadius: '50px', border: '1px solid #334155' }}>
        <button onClick={function() { setMemoMode(!memoMode); }} style={{ padding: '15px', borderRadius: '50px', border: 'none', backgroundColor: memoMode ? 'white' : '#334155', color: memoMode ? 'black' : 'white' }}>{memoMode ? <X size={28}/> : <Pencil size={28}/>}</button>
        {memoMode && <button onClick={function() { ctx.clearRect(0,0,canvasRef.current.width,canvasRef.current.height); }} style={{ padding: '15px', borderRadius: '50px', border: 'none', backgroundColor: '#dc2626', color: 'white' }}><Trash2 size={28}/></button>}
      </div>

      {/* 1. 왼쪽 사이드바 */}
      <div style={{ width: '22%', display: 'flex', flexDirection: 'column', gap: '20px', zIndex: 10 }}>
        <div style={{ backgroundColor: '#1C1F26', padding: '25px', borderRadius: '24px', border: '1px solid #334155', textAlign: 'center' }}>
          <h1 style={{ fontSize: '3.5rem', fontWeight: '900', margin: 0, color: 'white' }}>{now.toLocaleTimeString('ko-KR', { hour12: false, hour: '2-digit', minute: '2-digit' })}</h1>
          <p style={{ color: '#64748b', fontWeight: 'bold' }}>{now.toLocaleDateString('ko-KR', { dateStyle: 'full' })}</p>
        </div>

        {/* 날씨 카드 */}
        <div style={{ backgroundColor: '#1C1F26', padding: '20px', borderRadius: '24px', border: '1px solid #334155', textAlign: 'center' }}>
          <Cloud size={60} color="#7dd3fc" style={{ margin: '0 auto' }} />
          <p style={{ fontSize: '2.5rem', fontWeight: '900', color: 'white', margin: '10px 0' }}>{(weather && weather.main) ? Math.round(weather.main.temp) : '--'}°C</p>
          <p style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#7dd3fc' }}>{(weather && weather.weather) ? weather.weather[0].description.replace("온흐림","흐림") : "날씨 로딩"}</p>
        </div>

        {/* [NEW] 급식 카드: 시간대에 따라 아침/점심/저녁 자동 전환 */}
        <div style={{ backgroundColor: '#1C1F26', padding: '20px', borderRadius: '24px', border: '1px solid #334155', flex: 1 }}>
          <h3 style={{ fontSize: '1.2rem', fontWeight: '900', color: '#fbbf24', marginBottom: '10px', textAlign: 'center' }}>🍴 오늘 {meal.label} 메뉴</h3>
          <p style={{ fontSize: '1rem', fontWeight: 'bold', lineHeight: '1.6', color: '#e2e8f0', textAlign: 'center', wordBreak: 'keep-all' }}>{meal.menu}</p>
        </div>
      </div>

      {/* 2. 중앙 시간표 */}
      <div style={{ flex: 1, backgroundColor: 'rgba(28, 31, 38, 0.8)', borderRadius: '24px', padding: '30px', marginLeft: '20px', border: '1px solid #334155', display: 'flex', flexDirection: 'column', zIndex: 10 }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: '900', margin: '0 0 20px 0', color: 'white' }}>📡 실시간 지구과학실 대시보드</h2>
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
                      backgroundColor: isActive ? '#f1f5f9' : '#16191F', 
                      color: isActive ? '#0f172a' : '#cbd5e1', 
                      border: isActive ? '2px solid #ffffff' : '1px solid #1e293b'
                    }}>{teacher}</div>
                  );
                })}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* 3. 오른쪽 할 일 */}
      <div style={{ width: '22%', backgroundColor: '#1C1F26', borderRadius: '24px', padding: '25px', marginLeft: '20px', border: '1px solid #334155', display: 'flex', flexDirection: 'column', zIndex: 10 }}>
        <h3 style={{ fontSize: '1.5rem', fontWeight: '900', color: '#64748b', marginBottom: '20px' }}>TODO LIST</h3>
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {todos.map(function(todo) {
            return (
              <div key={todo.id} style={{ padding: '15px', borderRadius: '15px', backgroundColor: '#2D333D', border: '1px solid #475569', marginBottom: '10px', fontSize: '1.1rem', fontWeight: 'bold', color: 'white', display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ textDecoration: todo.done ? 'line-through' : 'none', opacity: todo.done ? 0.4 : 1 }}>{todo.text}</span>
                <button onClick={function() { setTodos(todos.filter(function(t) { return t.id !== todo.id; })); }} style={{ background: 'none', border: 'none', color: '#64748b' }}><Trash2 size={16}/></button>
              </div>
            );
          })}
        </div>
        <input type="text" placeholder="할 일 추가..." value={todoInput} style={{ width: '100%', backgroundColor: '#0F1115', border: '1px solid #475569', borderRadius: '12px', padding: '10px', color: 'white', marginTop: '10px' }} onChange={function(e) { setTodoInput(e.target.value); }} onKeyPress={function(e) { if (e.key === 'Enter' && todoInput) { setTodos([{ id: Date.now(), text: todoInput, done: false }].concat(todos)); setTodoInput(""); } }} />
      </div>
    </div>
  );
}
