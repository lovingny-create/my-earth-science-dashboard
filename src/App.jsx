import React, { useState, useEffect, useRef } from 'react';
import Papa from 'papaparse';
import { Clock, Radio, CheckCircle2, Pencil, Trash2, X, Cloud } from 'lucide-react';

export default function App() {
  const [grid, setGrid] = useState([]);
  const [todos, setTodos] = useState([]);
  const [weather, setWeather] = useState(null);
  const [meal, setMeal] = useState({ label: "급식", menu: "로딩 중..." });
  const [now, setNow] = useState(new Date());
  const [currentPos, setCurrentPos] = useState({ dayIdx: -1, periodIdx: -1 });
  const [todoInput, setTodoInput] = useState("");

  const NEIS_API_KEY = "5bfe4967b9b64a3fb1693f1cc5371d50"; 
  const TIMETABLE_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vSfFMWDov9yz7QPfJOrdu15kgAdzhpJ-kMkn1zW6QjiRUzAecmNh4sPO9C3HzYmmlhl5xS5su3EWQSy/pub?gid=0&output=csv";
  const TODO_URL = "
지구과학과 TODO LIST
지구과학과 TODO LIST

100%
10
A1

지구과학과 기자재 논의
 
 
 	


스크린 리더 지원 사용 설정
스크린 리더 기능을 사용하려면 Ctrl+Alt+Z을(를) 누르세요. 단축키에 대해 알아보려면 Ctrl+슬래시을(를) 누르세요.
웹에 게시
웹에 게시된 문서입니다.

콘텐츠를 웹에 게시하여 모든 사용자에게 공개하세요. 문서 링크를 올리거나 문서를 삽입할 수 있습니다. 자세히 알아보기

링크

삽입
전체 문서
쉼표로 구분된 값(.csv)
참고: 뷰어가 게시된 차트의 기본 데이터에 액세스할 수도 있습니다. 자세히 알아보기
https://docs.google.com/spreadsheets/d/e/2PACX-1vQFJ5d-I901hCCEPOA8awuxvJNpIbTWQjSt7_L0-fg6LzrEuQUDP2HoKAOHwE7YeTdnLVQ3devIeRf6/pub?output=csv
복사하려면 Ctrl+C 키를 누르세요.

복사하려면 Ctrl+C 키를 누르세요.
또는 다음을 통해 링크를 공유합니다.

파일이 수정되면 자동으로 다시 게시
";
  const WEATHER_API_KEY = "9addde09be74cdb63aab8481a0a207a0"; 
  const CITY = "Gwangju";

  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [memoMode, setMemoMode] = useState(false);
  const [ctx, setCtx] = useState(null);

  useEffect(function() {
    // --- [선생님이 물어보신 바로 그 부분!] ---
    function fetchData() {
      // 주소 끝에 시간을 붙여서 구글의 5분 지연을 최대한 우회합니다.
      const cacheBuster = "&t=" + new Date().getTime(); [cite: 12]

      // 1. 시간표 가져오기
      Papa.parse(TIMETABLE_URL + cacheBuster, { [cite: 12]
        download: true, 
        complete: function(res) { setGrid(res.data); } 
      });
      
      // 2. 할일 목록 가져오기
      Papa.parse(TODO_URL + cacheBuster, { [cite: 12]
        download: true,
        complete: function(res) {
          if (res.data && res.data.length > 0) {
            var fetched = res.data
              .filter(function(row) { return row[0] && row[0].trim() !== ""; })
              .map(function(row, idx) { return { id: "sheet-" + idx, text: row[0], done: false }; });
            setTodos(fetched);
          }
        },
      });

      // 3. 날씨 가져오기
      fetch("https://api.openweathermap.org/data/2.5/weather?q=" + CITY + "&appid=" + WEATHER_API_KEY + "&units=metric&lang=kr")
        .then(function(res) { return res.json(); }).then(function(data) { setWeather(data); });

      // 4. 급식 가져오기
      fetchMeal();
    }

    function fetchMeal() {
      var d = new Date();
      var yyyymmdd = d.getFullYear() + ("0" + (d.getMonth() + 1)).slice(-2) + ("0" + d.getDate()).slice(-2);
      var hour = d.getHours();
      var targetCode = "2"; var mealLabel = "점심";
      if (hour < 9) { targetCode = "1"; mealLabel = "아침"; }
      else if (hour >= 14) { targetCode = "3"; mealLabel = "저녁"; }

      var url = "https://open.neis.go.kr/hub/mealServiceDietInfo?KEY=" + NEIS_API_KEY + "&Type=json&ATPT_OFCDC_SC_CODE=F10&SD_SCHUL_CODE=7380024&MLSV_YMD=" + yyyymmdd;
      fetch(url).then(function(res) { return res.json(); }).then(function(data) {
        if (data.mealServiceDietInfo) {
          var rows = data.mealServiceDietInfo[1].row;
          var found = rows.filter(function(r) { return r.MMEAL_SC_CODE === targetCode; })[0];
          if (found) { setMeal({ label: mealLabel, menu: found.DDISH_NM.replace(/[0-9.()]/g, "").replace(/<br\/>/g, ", ") }); }
        } else { setMeal({ label: mealLabel, menu: "급식 정보를 등록 중입니다.🍱" }); }
      });
    }

    function updateTime() {
      var d = new Date(); setNow(d);
      var day = d.getDay(); var time = d.getHours() * 100 + d.getMinutes();
      var p = -1;
      if (time >= 850 && time < 950) p = 1; else if (time >= 950 && time < 1050) p = 2;
      else if (time >= 1050 && time < 1150) p = 3; else if (time >= 1150 && time < 1330) p = 4;
      else if (time >= 1330 && time < 1430) p = 5; else if (time >= 1430 && time < 1520) p = 6;
      else if (time >= 1520 && time < 1620) p = 7;
      setCurrentPos({ dayIdx: day, periodIdx: p });
    }

    fetchData(); updateTime();
    var timer = setInterval(fetchData, 60000); // 1분마다 시트 확인
    var timer2 = setInterval(updateTime, 1000);
    return function() { clearInterval(timer); clearInterval(timer2); };
  }, []);

  // --- 이하 판서 및 디자인 로직 (동일) ---
  useEffect(function() {
    if (memoMode && canvasRef.current) {
      var canvas = canvasRef.current; canvas.width = window.innerWidth; canvas.height = window.innerHeight;
      var context = canvas.getContext('2d'); context.lineCap = "round"; context.strokeStyle = "#ffffff"; context.lineWidth = 5;
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
      {memoMode && (
        <canvas ref={canvasRef} onMouseDown={function(e) {setIsDrawing(true); draw(e);}} onMouseUp={function() {setIsDrawing(false); ctx.beginPath();}} onMouseMove={draw} onTouchStart={function(e) {setIsDrawing(true); draw(e);}} onTouchEnd={function() {setIsDrawing(false); ctx.beginPath();}} onTouchMove={draw} style={{ position: 'absolute', inset: 0, zIndex: 50, cursor: 'crosshair', touchAction: 'none' }} />
      )}
      <div style={{ position: 'absolute', bottom: '40px', left: '50%', transform: 'translateX(-50%)', zIndex: 60, display: 'flex', gap: '15px', backgroundColor: '#1C1F26', padding: '15px', borderRadius: '50px', border: '1px solid #334155' }}>
        <button onClick={function() { setMemoMode(!memoMode); }} style={{ padding: '15px', borderRadius: '50px', border: 'none', backgroundColor: memoMode ? 'white' : '#334155', color: memoMode ? 'black' : 'white' }}>{memoMode ? <X size={28}/> : <Pencil size={28}/>}</button>
        {memoMode && <button onClick={function() { ctx.clearRect(0,0,canvasRef.current.width,canvasRef.current.height); }} style={{ padding: '15px', borderRadius: '50px', border: 'none', backgroundColor: '#dc2626', color: 'white' }}><Trash2 size={28}/></button>}
      </div>
      <div style={{ width: '22%', display: 'flex', flexDirection: 'column', gap: '20px', zIndex: 10 }}>
        <div style={{ backgroundColor: '#1C1F26', padding: '25px', borderRadius: '24px', border: '1px solid #334155', textAlign: 'center' }}>
          <h1 style={{ fontSize: '3.5rem', fontWeight: '900', margin: 0, color: 'white' }}>{now.toLocaleTimeString('ko-KR', { hour12: false, hour: '2-digit', minute: '2-digit' })}</h1>
          <p style={{ color: '#64748b', fontWeight: 'bold' }}>{now.toLocaleDateString('ko-KR', { dateStyle: 'full' })}</p>
        </div>
        <div style={{ backgroundColor: '#1C1F26', padding: '20px', borderRadius: '24px', border: '1px solid #334155', textAlign: 'center' }}>
          <Cloud size={60} color="#7dd3fc" style={{ margin: '0 auto' }} />
          <p style={{ fontSize: '2.5rem', fontWeight: '900', color: 'white', margin: '10px 0' }}>{(weather && weather.main) ? Math.round(weather.main.temp) : '--'}°C</p>
          <p style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#7dd3fc' }}>{(weather && weather.weather) ? weather.weather[0].description : "날씨 로딩"}</p>
        </div>
        <div style={{ backgroundColor: '#1C1F26', padding: '20px', borderRadius: '24px', border: '1px solid #334155', flex: 1, overflow: 'hidden' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: '900', color: '#fbbf24', marginBottom: '10px', textAlign: 'center' }}>🍴 오늘 {meal.label} 메뉴</h3>
          <p style={{ fontSize: '1rem', fontWeight: 'bold', lineHeight: '1.5', color: '#f1f5f9', textAlign: 'center' }}>{meal.menu}</p>
        </div>
      </div>
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
                    <div key={d + "-" + p} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '12px', fontSize: '1.2rem', fontWeight: 'bold', backgroundColor: isActive ? '#f1f5f9' : '#16191F', color: isActive ? '#0f172a' : '#cbd5e1', border: isActive ? '2px solid #ffffff' : '1px solid #1e293b' }}>{teacher}</div>
                  );
                })}
              </React.Fragment>
            );
          })}
        </div>
      </div>
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
      </div>
    </div>
  );
}
