import React, { useState, useEffect, useRef } from 'react';
import Papa from 'papaparse';
import { Clock, Radio, CheckCircle2, Pencil, Trash2, X, Cloud } from 'lucide-react';

export default function App() {
  const [grid, setGrid] = useState([]);
  const [todos, setTodos] = useState([]);
  const [weather, setWeather] = useState(null);
  const [meal, setMeal] = useState({ label: "급식", menu: "데이터 로딩 중..." });
  const [now, setNow] = useState(new Date());
  const [currentPos, setCurrentPos] = useState({ dayIdx: -1, periodIdx: -1 });
  const [todoInput, setTodoInput] = useState("");

  // --- [인증키 및 설정값] ---
  const NEIS_API_KEY = "5bfe4967b9b64a3fb1693f1cc5371d50"; // 나이스에서 받은 인증키를 여기에 넣으세요!
  const TIMETABLE_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vSfFMWDov9yz7QPfJOrdu15kgAdzhpJ-kMkn1zW6QjiRUzAecmNh4sPO9C3HzYmmlhl5xS5su3EWQSy/pub?gid=0&output=csv";
  const TODO_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQFJ5d-I901hCCEPOA8awuxvJNpIbTWQjSt7_L0-fg6LzrEuQUDP2HoKAOHwE7YeTdnLVQ3devIeRf6/pub?output=csv";
  const WEATHER_API_KEY = "9addde09be74cdb63aab8481a0a207a0"; 
  const CITY = "Gwangju";

  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [memoMode, setMemoMode] = useState(false);
  const [ctx, setCtx] = useState(null);

  useEffect(function() {
    function fetchData() {
      // 1. 시간표 파싱
      Papa.parse(TIMETABLE_URL, { download: true, complete: function(res) { setGrid(res.data); } });
      
      // 2. 할일 목록 파싱
      Papa.parse(TODO_URL, {
        download: true,
        complete: function(res) {
          var fetched = res.data.filter(function(row) { return row[0] && row[0].trim() !== ""; })
            .map(function(row, idx) { return { id: "sheet-" + idx, text: row[0], done: false }; });
          setTodos(fetched);
        },
      });

      // 3. 날씨 데이터
      fetch("https://api.openweathermap.org/data/2.5/weather?q=" + CITY + "&appid=" + WEATHER_API_KEY + "&units=metric&lang=kr")
        .then(function(res) { return res.json(); }).then(function(data) { setWeather(data); });

      // 4. 급식 데이터 (나이스 인증키 포함 버전)
      fetchMeal();
    }

    function fetchMeal() {
      var d = new Date();
      var yyyymmdd = d.getFullYear() + ("0" + (d.getMonth() + 1)).slice(-2) + ("0" + d.getDate()).slice(-2);
      var hour = d.getHours();
      
      var targetCode = "2"; // 기본 점심
      var mealLabel = "점심";
      if (hour < 9) { targetCode = "1"; mealLabel = "아침"; }
      else if (hour >= 14) { targetCode = "3"; mealLabel = "저녁"; }

      // 인증키(KEY)가 포함된 정식 API 주소
      var url = "
