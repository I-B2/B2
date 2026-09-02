const SUPABASE_URL = "https://yojtvziupqwgcuocheho.supabase.co";

const SUPABASE_KEY = "sb_publishable_0DlyNWk3bTJshNF-zskexA_IsSK3BAF";

const db = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_KEY,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false
    }
  }
);

const CANDIDATES = ["Brajesh", "Bittu", "Anshu", "Priti", "Ribha"];
const HOURS = 24;

const dateInput = document.getElementById("reportDate");
const tableHead = document.querySelector("#hourTable thead tr");
const tableBody = document.querySelector("#hourTable tbody");
const summaryCards = document.getElementById("summaryCards");

const totalCanvas = document.getElementById("totalChart");
const progressCanvas = document.getElementById("progressChart");
const rankCanvas = document.getElementById("rankChart");

const today = new Date();
dateInput.value = today.toISOString().slice(0, 10);

function storageKey() {
  return `study-report-${dateInput.value}`;
}

function emptyData() {
  return CANDIDATES.map(() => Array(HOURS).fill(false));
}

async function loadData() {
  const selectedDate = dateInput.value;

  const { data: rows, error } = await db
    .from("study_hours")
    .select("candidate, hour, completed")
    .eq("date", selectedDate);

  if (error) {
    console.error("Load error:", error);
    return emptyData();
  }

  const result = emptyData();

  rows.forEach(row => {
    const candidateIndex = CANDIDATES.indexOf(row.candidate);
    const hourIndex = Number(row.hour) - 1;

    if (
      candidateIndex !== -1 &&
      hourIndex >= 0 &&
      hourIndex < HOURS
    ) {
      result[candidateIndex][hourIndex] = !!row.completed;
    }
  });

  return result;
}

let data = emptyData();
let loggedInCandidate = null;

function hourText(h) {
  return h === 0 ? "1" : String(h + 1);
}

function buildTable() {
  while (tableHead.children.length > 1) tableHead.removeChild(tableHead.lastChild);
  tableBody.innerHTML = "";

  for (let h = 0; h < HOURS; h++) {
    const th = document.createElement("th");
    th.innerHTML = `<span class="hour-label">${hourText(h)}H</span>`;
    tableHead.appendChild(th);
  }

  CANDIDATES.forEach((name, candidateIndex) => {
    const tr = document.createElement("tr");
    const nameCell = document.createElement("td");
    nameCell.className = "candidate-col";
    nameCell.innerHTML = `<span class="candidate-name">${name}</span>`;
    tr.appendChild(nameCell);

    for (let h = 0; h < HOURS; h++) {
      const td = document.createElement("td");
      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.className = "hour-checkbox";
      checkbox.checked = data[candidateIndex][h];
     if (CANDIDATES[candidateIndex] !== loggedInCandidate) {
  checkbox.style.pointerEvents = "none";
}
      checkbox.addEventListener("change", async () => {
  const checked = checkbox.checked;

  data[candidateIndex][h] = checked;
  render();

  const { error } = await db
    .from("study_hours")
    .upsert(
      {
        date: dateInput.value,
        candidate: CANDIDATES[candidateIndex],
        hour: h + 1,
        completed: checked
      },
      {
        onConflict: "date,candidate,hour"
      }
    );

  if (error) {
    console.error("Save error:", error);
    alert("Data save nahi hua!");
  }
});

      td.appendChild(checkbox);
      tr.appendChild(td);
    }
    tableBody.appendChild(tr);
  });
}

function totals() {
  return data.map(row => row.filter(Boolean).length);
}

function cumulative(candidateIndex, hourIndex) {
  return data[candidateIndex].slice(0, hourIndex + 1).filter(Boolean).length;
}

function drawCanvas(canvas, draw) {
  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();
  const width = Math.max(300, rect.width);
  const height = 300;
  canvas.width = width * dpr;
  canvas.height = height * dpr;
  const ctx = canvas.getContext("2d");
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  draw(ctx, width, height);
}

function setup(ctx, width, height) {
  ctx.clearRect(0, 0, width, height);
  ctx.font = "12px Arial";
  ctx.lineWidth = 1;
}

function drawTotalChart() {
  drawCanvas(totalCanvas, (ctx, width, height) => {
    setup(ctx, width, height);
    const values = totals();
    const left = 42, right = 15, top = 20, bottom = 45;
    const chartW = width - left - right;
    const chartH = height - top - bottom;
    const max = Math.max(5, ...values);
    const barW = chartW / values.length * 0.55;

    ctx.strokeStyle = "#e5eaf1";
    for (let i = 0; i <= max; i++) {
      const y = top + chartH - (i / max) * chartH;
      ctx.beginPath(); ctx.moveTo(left, y); ctx.lineTo(width - right, y); ctx.stroke();
      ctx.fillStyle = "#748092"; ctx.fillText(i, 17, y + 4);
    }

    values.forEach((v, i) => {
      const x = left + (i + .5) * chartW / values.length - barW / 2;
      const h = (v / max) * chartH;
      ctx.fillStyle = "#315efb";
      ctx.fillRect(x, top + chartH - h, barW, h);
      ctx.fillStyle = "#182230";
      ctx.font = "bold 12px Arial";
      ctx.textAlign = "center";
      ctx.fillText(v + "h", x + barW / 2, top + chartH - h - 7);
      ctx.font = "12px Arial";
      ctx.fillStyle = "#566274";
      ctx.fillText(CANDIDATES[i], x + barW / 2, height - 18);
    });
    ctx.textAlign = "left";
  });
}

function drawProgressChart() {
  drawCanvas(progressCanvas, (ctx, width, height) => {
    setup(ctx, width, height);
    const left = 42, right = 15, top = 25, bottom = 45;
    const chartW = width - left - right;
    const chartH = height - top - bottom;
    const max = Math.max(5, ...totals());
    const series = ["#315efb", "#16a36a", "#e38b2c", "#a84ee8", "#e34d59"];

    ctx.strokeStyle = "#e5eaf1";
    for (let i = 0; i <= max; i++) {
      const y = top + chartH - (i / max) * chartH;
      ctx.beginPath(); ctx.moveTo(left, y); ctx.lineTo(width - right, y); ctx.stroke();
      ctx.fillStyle = "#748092"; ctx.fillText(i, 17, y + 4);
    }

    for (let c = 0; c < CANDIDATES.length; c++) {
      ctx.strokeStyle = series[c];
      ctx.lineWidth = 2.5;
      ctx.beginPath();

      for (let h = 0; h < HOURS; h++) {
        const x = left + (h / (HOURS - 1)) * chartW;
        const val = cumulative(c, h);
        const y = top + chartH - (val / max) * chartH;
        if (h === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.stroke();

      for (let h = 0; h < HOURS; h++) {
        if (!data[c][h]) continue;
        const x = left + (h / (HOURS - 1)) * chartW;
        const val = cumulative(c, h);
        const y = top + chartH - (val / max) * chartH;
        ctx.fillStyle = series[c];
        ctx.beginPath(); ctx.arc(x, y, 3, 0, Math.PI * 2); ctx.fill();
      }
    }

    ctx.fillStyle = "#566274";
    ctx.textAlign = "center";
    [0, 5, 10, 15, 20, 23].forEach(h => {
      const x = left + (h / (HOURS - 1)) * chartW;
      ctx.fillText((h + 1) + "H", x, height - 18);
    });

    ctx.textAlign = "left";
    let lx = left;
    CANDIDATES.forEach((name, i) => {
      ctx.fillStyle = series[i];
      ctx.fillRect(lx, 5, 12, 4);
      ctx.fillStyle = "#566274";
      ctx.fillText(name, lx + 17, 10);
      lx += ctx.measureText(name).width + 45;
    });
  });
}

function drawRankChart() {
  drawCanvas(rankCanvas, (ctx, width, height) => {
    setup(ctx, width, height);
    const ranked = CANDIDATES.map((name, i) => ({ name, value: totals()[i] }))
      .sort((a, b) => b.value - a.value);

    const left = 95, right = 45, top = 18, rowH = 45;
    const max = Math.max(5, ...ranked.map(x => x.value));
    const barMax = width - left - right;

    ranked.forEach((item, i) => {
      const y = top + i * rowH;
      ctx.fillStyle = "#edf1f6";
      ctx.fillRect(left, y, barMax, 25);

      ctx.fillStyle = "#315efb";
      ctx.fillRect(left, y, (item.value / max) * barMax, 25);

      ctx.fillStyle = "#182230";
      ctx.font = "bold 13px Arial";
      ctx.textAlign = "right";
      ctx.fillText((i + 1) + ". " + item.name, left - 10, y + 17);

      ctx.textAlign = "left";
      ctx.fillText(item.value + "h", Math.min(left + (item.value / max) * barMax + 8, width - 32), y + 17);
    });
    ctx.textAlign = "left";
  });
}

function renderCards() {
  const values = totals();
  const max = Math.max(1, ...values);
  summaryCards.innerHTML = "";

  CANDIDATES.forEach((name, i) => {
    const card = document.createElement("div");
    card.className = "card";
    card.innerHTML = `
      <div class="card-name">${name}</div>
      <div class="card-hours">${values[i]} <span>hours</span></div>
      <div class="mini-progress"><div style="width:${(values[i] / max) * 100}%"></div></div>
    `;
    summaryCards.appendChild(card);
  });
}

function render() {
  renderCards();
  drawTotalChart();
  drawProgressChart();
  drawRankChart();
}

dateInput.addEventListener("change", async () => {
  data = await loadData();
  buildTable();
  render();
});

document.getElementById("resetBtn").addEventListener("click", async () => {
  if (!confirm("Is date ka poora study data reset karna hai?")) return;

  const { error } = await db
    .from("study_hours")
    .delete()
    .eq("date", dateInput.value);

  if (error) {
    console.error("Reset error:", error);
    alert("Data reset nahi hua!");
    return;
  }

  data = emptyData();
  buildTable();
  render();
});

window.addEventListener("resize", render);

async function startApp() {
  data = await loadData();
  buildTable();
  render();
}

const loginScreen = document.getElementById("loginScreen");
const candidateSelect = document.getElementById("candidateSelect");
const passcodeInput = document.getElementById("passcodeInput");
const loginBtn = document.getElementById("loginBtn");
const loginMessage = document.getElementById("loginMessage");


async function startRealtime() {
  db
    .channel("study-hours-realtime")
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "study_hours"
      },
      async () => {
        data = await loadData();
        buildTable();
        render();
      }
    )
    .subscribe();
}


async function login() {
  const email = candidateSelect.value;
  const password = passcodeInput.value;
loggedInCandidate = CANDIDATES.find(
  name => name.toLowerCase() === email.split("@")[0].toLowerCase()
);
  
  loginMessage.textContent = "";

  if (!password) {
    loginMessage.textContent = "Passcode डालो";
    return;
  }

  loginBtn.disabled = true;
  loginBtn.textContent = "Logging in...";

  const { error } = await db.auth.signInWithPassword({
    email: email,
    password: password
  });

  if (error) {
    console.error("Login error:", error);
    loginMessage.textContent = "गलत passcode!";
    loginBtn.disabled = false;
    loginBtn.textContent = "Login";
    return;
  }

  loginScreen.style.display = "none";

  await startApp();
  await startRealtime();
}


loginBtn.addEventListener("click", login);


passcodeInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    login();
  }
});


async function checkExistingLogin() {
  const { data: { session } } = await db.auth.getSession();

  if (session) {
    loginScreen.style.display = "none";

    await startApp();
    await startRealtime();
  }
}


checkExistingLogin();
