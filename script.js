import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';
const supa = createClient("https://dvfsdoybqyxpwtqgffub.supabase.co", "sb_publishable_lP5gD4yHS3jLC0VbLv7ldA_TnoMk3gG");

const $ = s => document.querySelector(s), $$ = s => document.querySelectorAll(s), b = document.body;

window.handleCredentialResponse = async r => {
  try {
    const u = jwt_decode(r.credential);
    const c = $(".home-inner");
    const box = document.createElement("div");
    box.style = "display:flex;flex-direction:column;align-items:center;margin-top:20px";
    const img = Object.assign(document.createElement("img"), {
      src: u.picture,
      style: "width:80px;height:80px;border-radius:50%"
    });
    const name = Object.assign(document.createElement("span"), {
      textContent: u.name,
      style: "margin-top:10px;font-weight:bold"
    });
    box.append(img, name);
    c.append(box);
    await supa.from("users").upsert([{
      id: u.sub,
      name: u.name,
      avatar_url: u.picture,
      created_at: new Date().toISOString()
    }]);
  } catch (e) {
    console.error(e);
  }
};

window.addEventListener("DOMContentLoaded", () => {
  // Sidebar toggle
  $("#sidebarToggle").onclick = () => {
    $("#sidebar").classList.toggle("open");
    $("#overlay").classList.toggle("active");
  };
  $("#overlay").onclick = () => {
    $("#sidebar").classList.remove("open");
    $("#overlay").classList.remove("active");
  };

  // Navigation
  $$(".nav-item").forEach(n => {
    n.onclick = () => {
      $$(".nav-item").forEach(i => i.classList.remove("active"));
      n.classList.add("active");
      $$(".page").forEach(p => p.classList.remove("active"));
      $("#page-" + n.dataset.page).classList.add("active");
      $("#sidebar").classList.remove("open");
      $("#overlay").classList.remove("active");
    };
  });

  $$(".back-btn").forEach(b => {
    b.onclick = () => {
      $$(".page").forEach(p => p.classList.remove("active"));
      $("#page-main360").classList.add("active");
    };
  });

  // Clock
  setInterval(() => {
    const d = new Date();
    $("#clockTime").textContent = d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    $("#clockDate").textContent = d.toLocaleDateString();
  }, 1000);

  // Weather
  let tempC = null, code = null;
  const updateWeather = () => {
    if (tempC == null) return;
    const f = (tempC * 9 / 5 + 32).toFixed(1);
    const useF = $("#tempToggle").checked;
    $("#homeWeatherText").textContent = `${useF ? f + "°F" : tempC + "°C"} · Code ${code}`;
    $("#weatherContent").textContent = `Current temperature: ${tempC}°C / ${f}°F\nWeather code: ${code}`;
  };
  fetch("https://api.open-meteo.com/v1/forecast?latitude=40.7&longitude=-73.9&current=temperature_2m,weathercode&timezone=auto")
    .then(r => r.json())
    .then(d => {
      tempC = d.current.temperature_2m;
      code = d.current.weathercode;
      updateWeather();
    })
    .catch(() => {
      $("#homeWeatherText").textContent = "Weather unavailable";
      $("#weatherContent").textContent = "Could not load weather data.";
    });
  $("#tempToggle").onchange = updateWeather;

  // Shortener
  $("#shortBtn").onclick = () => {
    const url = $("#shortInput").value.trim();
    if (!url) return;
    fetch("https://api.tinyurl.com/create?api_token=YOUR_TOKEN", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url })
    })
      .then(r => r.json())
      .then(d => {
        $("#shortResult").textContent = d.data?.tiny_url || d.errors?.[0]?.message || "Error";
      })
      .catch(e => {
        $("#shortResult").textContent = "Network error: " + e.message;
      });
  };

  // Settings panel
  $("#settingsBtn").onclick = () => $("#settingsPanel").classList.toggle("open");
  document.addEventListener("click", e => {
    if (!$("#settingsPanel").contains(e.target) && !$("#settingsBtn").contains(e.target)) {
      $("#settingsPanel").classList.remove("open");
    }
  });

  // Theme
  const darkToggle = $("#darkToggle");
  darkToggle.checked = localStorage.getItem("darkMode") === "true";
  b.classList.toggle("dark", darkToggle.checked);
  darkToggle.onchange = e => {
    const v = e.target.checked;
    b.classList.toggle("dark", v);
    localStorage.setItem("darkMode", v);
  };

  const savedAccent = localStorage.getItem("accentColor");
  if (savedAccent) b.style.setProperty("--accent", savedAccent);
  $$(".swatch").forEach(s => {
    s.onclick = () => {
      $$(".swatch").forEach(x => x.classList.remove("active"));
      s.classList.add("active");
      const c = getComputedStyle(s).backgroundColor;
      b.style.setProperty("--accent", c);
      localStorage.setItem("accentColor", c);
    };
  });

  // Install prompt
  let dp;
  window.addEventListener("beforeinstallprompt", e => {
    e.preventDefault();
    dp = e;
    $("#installBtn").style.display = "block";
  });
  $("#installBtn").onclick = () => dp.prompt();

  // Cursor
  const dot = $(".cursor-dot"), trail = $(".cursor-trail");
  let x = 0, y = 0;
  document.addEventListener("mousemove", e => {
    x = e.clientX;
    y = e.clientY;
    dot.style.left = `${x}px`;
    dot.style.top = `${y}px`;
  });
  (function animate() {
    trail.style.left = `${x}px`;
    trail.style.top = `${y}px`;
    requestAnimationFrame(animate);
  })();

  // Music toggle (final version)
  const music = $("#bgMusic"), toggle = $("#musicToggle");
  if (music && toggle) {
    toggle.onclick = async () => {
      try {
        if (music.paused) {
          await music.play();
          toggle.textContent = "🔈 Music - Playing";
        } else {
          music.pause();
          toggle.textContent = "🔇 Music - Paused";
        }
      } catch (e) {
        console.error("Music error:", e);
      }
    };
  }

  // AI Chatbot
  if ($("#sendBtn")) {
    const d = new Date(), ds = d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    $("#date").innerText = ds;
    const mem = [{ role: "system", content: `You are a helpful AI assistant. Today's date is ${ds}.` }];
    const send = async () => {
      const i = $("#userInput"), c = $("#chat"), m = i.value.trim();
      if (!m) return;
      c.innerHTML += `<div class="message user">${m}</div>`;
      i.value = "";
      const id = "msg-" + Date.now();
      c.innerHTML += `<div class="message ai" id="${id}">Thinking...</div>`;
      c.scrollTop = c.scrollHeight;
      try {
        const { data, error } = await supa.functions.invoke("hyper-task", { body: { message: m, memory: mem } });
        if (error) throw error;
        const r = data?.reply || "No response";
        mem.push({ role: "user", content: m }, { role: "assistant", content: r });
        $("#" + id).innerHTML = marked.parse(r);
        c.scrollTop = c.scrollHeight;
      } catch (e) {
        $("#" + id).innerText = "Error: " + e.message;
      }
    };
    $("#sendBtn").onclick = send;
    $("#userInput").onkeydown = e => e.key === "Enter" && send();
  }
});
