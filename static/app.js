const DAYS_TR = ["Pazar","Pazartesi","Salı","Çarşamba","Perşembe","Cuma","Cumartesi"];

const CONDITION_MAP = [
  { codes: [1000], emoji: "☀️", theme: "gunesli", cat: "cat-sunglasses.gif" },
  { codes: [1003], emoji: "🌤️", theme: "bulutlu", cat: "cat-normal.gif" },
  { codes: [1006,1009], emoji: "☁️", theme: "bulutlu", cat: "cat-normal.gif" },
  { codes: [1180,1183,1186,1189,1240], emoji: "🌧️", theme: "yagmurlu", cat: "cat-umbrella.gif" },
  { codes: [1192,1195,1243,1246], emoji: "🌧️", theme: "yagmurlu", cat: "cat-umbrella.gif" },
  { codes: [1273,1276,1279,1282], emoji: "⛈️", theme: "yagmurlu", cat: "cat-umbrella.gif" },
  { codes: [1066,1069,1072,1114,1117,1210,1213,1216,1219,1222,1225,1255,1258], emoji: "❄️", theme: "karli", cat: "cat-winter.gif" }
];

function mapCondition(code, text) {
  for (const m of CONDITION_MAP) if (m.codes.includes(code)) return m;
  return { emoji: "☁️", theme: "bulutlu", cat: "cat-normal.gif" };
}

function applyTheme(themeName) {
  const hour = new Date().getHours();
  if (hour >= 22 || hour < 6) document.body.className = "theme-gece";
  else document.body.className = `theme-${themeName}`;
}

function applyCat(gifName) {
  const catImg = document.getElementById("cat");
  const hour = new Date().getHours();
  if (hour >= 22 || hour < 6) catImg.src = "/static/cat-sleep.gif";
  else catImg.src = `/static/${gifName}`;
}

async function fetchWeather(lat, lon) {
  const res = await fetch(`/weather?lat=${lat}&lon=${lon}`);
  return res.json();
}

function fillHeader(data) {
  const cur = data.current;
  const loc = data.location;
  const todayName = DAYS_TR[new Date().getDay()];
  const cond = mapCondition(cur.condition.code, cur.condition.text);

  document.getElementById("location").textContent = `${loc.name}, ${loc.country}`;
  document.getElementById("current-temp").textContent = `${Math.round(cur.temp_c)}°C`;
  document.getElementById("current-desc").textContent =
    `${todayName} • ${cur.condition.text} ${cond.emoji} • Hissedilen ${Math.round(cur.feelslike_c)}°C`;

  // Ek bilgiler (kedi GIF'in altında)
  document.getElementById("extra-info").innerHTML = `
    Nem: ${cur.humidity}%<br>
    Rüzgar: ${cur.wind_kph} km/s ${cur.wind_dir}<br>
    Basınç: ${cur.pressure_mb} mb
  `;

  applyTheme(cond.theme);
  applyCat(cond.cat);
}

function renderHourly(data) {
  const wrap = document.getElementById("hourly-scroll");
  wrap.innerHTML = "";
  const now = new Date();
  const today = data.forecast.forecastday[0];
  const tomorrow = data.forecast.forecastday[1];

  const todayHours = today.hour.filter(h => new Date(h.time) >= now);
  const tomorrowHours = tomorrow.hour.filter(h => new Date(h.time).getHours() <= 6);
  const merged = [...todayHours, ...tomorrowHours];

  merged.forEach(h => {
    const dt = new Date(h.time);
    const cond = mapCondition(h.condition.code, h.condition.text);
    const card = document.createElement("div");
    card.className = "hour-card";
    card.innerHTML = `
      <div class="temp">${Math.round(h.temp_c)}°C</div>
      <div class="emoji">${cond.emoji}</div>
      <div class="time">${String(dt.getHours()).padStart(2,"0")}:00</div>
    `;
    // Saatlik karta tıklayınca kedi/tema o saate göre değişsin
    card.addEventListener("click", () => {
      applyTheme(cond.theme);
      applyCat(cond.cat);
    });
    wrap.appendChild(card);
  });
}

function renderDaily(data) {
  const wrap = document.getElementById("daily-scroll");
  wrap.innerHTML = "";
  data.forecast.forecastday.slice(0,3).forEach(d => {
    const dt = new Date(d.date);
    const dayName = DAYS_TR[dt.getDay()];
    const cond = mapCondition(d.day.condition.code, d.day.condition.text);
    const card = document.createElement("div");
    card.className = "day-card";
    card.innerHTML = `
      <div class="day">${dayName}</div>
      <div class="emoji">${cond.emoji}</div>
      <div class="range">${Math.round(d.day.maxtemp_c)}°C / ${Math.round(d.day.mintemp_c)}°C</div>
      <div class="desc">${d.day.condition.text}</div>
    `;
    card.addEventListener("click", () => {
      // Günlük karta basınca saatlikler yüklenir
      const wrapH = document.getElementById("hourly-scroll");
      wrapH.innerHTML = "";
      d.hour.forEach(h => {
        const dt = new Date(h.time);
        const condH = mapCondition(h.condition.code, h.condition.text);
        const cardH = document.createElement("div");
        cardH.className = "hour-card";
        cardH.innerHTML = `
          <div class="temp">${Math.round(h.temp_c)}°C</div>
          <div class="emoji">${condH.emoji}</div>
          <div class="time">${String(dt.getHours()).padStart(2,"0")}:00</div>
        `;
        cardH.addEventListener("click", () => {
          applyTheme(condH.theme);
          applyCat(condH.cat);
        });
        wrapH.appendChild(cardH);
      });
      // Günün genel durumu için tema + kedi
      applyTheme(cond.theme);
      applyCat(cond.cat);
    });
    wrap.appendChild(card);
  });
}

async function initWeather(lat, lon) {
  const data = await fetchWeather(lat, lon);
  fillHeader(data);
  renderHourly(data);
  renderDaily(data);
}

window.addEventListener("DOMContentLoaded", () => {
  const refreshMs = 30 * 60 * 1000; // 30 dakika
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(async pos => {
      const lat = pos.coords.latitude;
      const lon = pos.coords.longitude;
      await initWeather(lat, lon);
      setInterval(() => initWeather(lat, lon), refreshMs);
    }, async () => {
      const lat = 41.01, lon = 28.97; // fallback İstanbul
      await initWeather(lat, lon);
      setInterval(() => initWeather(lat, lon), refreshMs);
    });
  } else {
    const lat = 41.01, lon = 28.97;
    initWeather(lat, lon);
    setInterval(() => initWeather(lat, lon), refreshMs);
  }
});
