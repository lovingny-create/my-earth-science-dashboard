import React, { useState, useEffect, useRef } from 'react';
import Papa from 'papaparse';

export default function App() {
  const [grid, setGrid] = useState([]);
  const [todos, setTodos] = useState([]);
  const [weather, setWeather] = useState(null);
  const [now, setNow] = useState(new Date());
  const [currentPos, setCurrentPos] = useState({ dayIdx: -1, periodIdx: -1 });
  const [todoInput, setTodoInput] = useState("");

  const TIMETABLE_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vSfFMWDov9yz7QPfJOrdu15kgAdzhpJ-kMkn1zW6QjiRUzAecmNh4sPO9C3HzYmmlhl5xS5su3EWQSy/pub?gid=0&output=csv";
  const TODO_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vSfFMWDov9yz7QPfJOrdu15kgAdzhpJ-kMkn1zW6QjiRUzAecmNh4sPO9C3HzYmmlhl5xS5su3EWQSy/pub?gid=210287103&output=csv";
  const WEATHER_API_KEY = "9addde09be74cdb63aab8481a0a207a0"; 
  const CITY = "Gwangju";

  useEffect(function() {
    function fetchData() {
      Papa.parse(TIMETABLE_URL, { download: true, complete: function(res) { setGrid(res.data); } });
      Papa.parse(TODO_URL, {
        download: true,
        complete: function(res) {
          var fetched = res.data.filter(function(row) { return row[0] && row[0].trim() !== ""; })
            .map(function(row, idx) { return { id: idx, text: row[0], done: false }; });
          setTodos(fetched);
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

  // 디자인 스타일 객체 (TV 브라우저 호환용)
  var styles = {
    container: { display: 'flex', height: '100vh', width: '100%', backgroundColor: '#0F1115', color: '#cbd5e1', padding: '20px', boxSizing: 'border-box', fontFamily: 'sans-serif' },
    sidebar: { width: '22%', display: 'flex', flexDirection: 'column', gap: '20px' },
    main: { flex: 1, backgroundColor: '#1C1F26', borderRadius: '24px', padding: '30px', marginLeft: '20px', border: '1px solid #334155', display: 'flex', flexDirection: 'column' },
    todo: { width: '22%', backgroundColor: '#1C1F26', borderRadius: '24px', padding: '20px', marginLeft: '20px', border: '1px solid #334155', display: 'flex', flexDirection: 'column' },
    card: { backgroundColor: '#1C1F26', padding: '25px', borderRadius: '24px', border: '1px solid #334155', textAlign: 'center' },
    grid: { display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '10px', flex: 1, marginTop: '20px' },
    cell: { display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '12px', fontSize: '1.2rem', fontWeight: 'bold', backgroundColor: '#16191F', border: '1px solid #1e293b' },
    activeCell: { backgroundColor: '#e2e8f0', color: '#0f172a', border: '2px solid #ffffff', transform: 'scale(1.02)' },
    headerCell: { textAlign: 'center', fontSize: '1.5rem', fontWeight: '900', color: '#64748b' }
  };

  var moon = (function() {
    var lp = 2551443; var phase = ((new Date().getTime() - new Date(1970, 0, 7, 20, 35, 0).getTime()) / 1000) % lp;
    var res = Math.floor(phase / (24 * 3600)) + 1;
    if (res <= 1) return { n: "삭", i: "🌑" }; if (res <= 9) return { n: "상현", i: "🌓" };
    if (res <= 16) return { n: "보름", i: "🌕" }; if (res <= 24) return { n: "하현", i: "🌗" };
    return { n: "그믐", i: "🌘" };
  })();

  return (
    <div style={styles.container}>
      {/* 1. 사이드바 */}
      <div style={styles.sidebar}>
        <div style={styles.card}>
          <h1 style={{ fontSize: '4rem', fontWeight: '900', margin: 0, color: 'white' }}>{now.toLocaleTimeString('ko-KR', { hour12: false, hour: '2-digit', minute: '2-digit' })}</h1>
          <p style={{ color: '#64748b', fontWeight: 'bold', marginTop: '10px' }}>{now.toLocaleDateString('ko-KR', { dateStyle: 'full' })}</p>
        </div>
        <div style={Object.assign({}, styles.card, { flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' })}>
          {weather && weather.weather && <img src={"https://openweathermap.org/img/wn/" + weather.weather[0].icon + "@4x.png"} style={{ width: '100px', margin: '0 auto' }} />}
          <p style={{ fontSize: '4rem', fontWeight: '900', color: 'white', margin: 0 }}>{(weather && weather.main) ? Math.round(weather.main.temp) : '--'}°C</p>
          <p style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#7dd3fc' }}>{(weather && weather.weather) ? weather.weather[0].description.replace("온흐림","흐림") : "연결 중"}</p>
          <div style={{ borderTop: '1px solid #334155', marginTop: '20px', paddingTop: '20px', fontSize: '1.2rem', fontWeight: 'bold', color: '#facc15' }}>
            {moon.n} {moon.i}
          </div>
        </div>
      </div>

      {/* 2. 시간표 */}
      <div style={styles.main}>
        <h2 style={{ fontSize: '1.8rem', fontWeight: '900', margin: 0, color: 'white' }}>📡 지구과학실 실시간 현황</h2>
        <div style={styles.grid}>
          <div />
          {["월", "화", "수", "목", "금"].map(function(d, i) {
            return <div key={d} style={Object.assign({}, styles.headerCell, currentPos.dayIdx === i + 1 ? { color: 'white' } : {})}>{d}</div>;
          })}
          {[1, 2, 3, 4, 5, 6, 7].map(function(p) {
            return (
              <React.Fragment key={p}>
                <div style={Object.assign({}, styles.cell, { backgroundColor: '#2D333D', border: '1px solid #475569', color: 'white' })}>{p}</div>
                {[1, 2, 3, 4, 5].map(function(d) {
                  var teacher = (grid[p] && grid[p][d]) || "";
                  var isActive = currentPos.dayIdx === d && currentPos.periodIdx === p;
                  return (
                    <div key={d + "-" + p} style={Object.assign({}, styles.cell, isActive ? styles.activeCell : {})}>
                      {teacher}
                    </div>
                  );
                })}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* 3. 할 일 리스트 */}
      <div style={styles.todo}>
        <h3 style={{ fontSize: '1.5rem', fontWeight: '900', color: '#94a3b8', marginBottom: '20px' }}>TODO LIST</h3>
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {todos.map(function(todo) {
            return (
              <div key={todo.id} style={{ padding: '15px', borderRadius: '15px', backgroundColor: '#2D333D', border: '1px solid #475569', marginBottom: '10px', fontSize: '1.1rem', fontWeight: 'bold', textDecoration: todo.done ? 'line-through' : 'none', opacity: todo.done ? 0.4 : 1 }}>
                {todo.text}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
