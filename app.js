// ========================================
// MedTrace - Smart Health Companion
// Main Application JavaScript
// ========================================

// ========== STATE ==========
let medications = [
  { id: 1, name: 'Crocin 500mg', dose: '500mg', time: '11:00', freq: 'Daily', emoji: '🔴', done: false },
  { id: 2, name: 'Vitamin D3', dose: '1000IU', time: '08:00', freq: 'Daily', emoji: '🟡', done: true },
  { id: 3, name: 'Metformin', dose: '500mg', time: '13:00', freq: 'Twice daily', emoji: '🟢', done: false },
  { id: 4, name: 'Omega-3', dose: '1000mg', time: '20:00', freq: 'Daily', emoji: '🔵', done: false },
  { id: 5, name: 'Aspirin', dose: '75mg', time: '22:00', freq: 'Daily', emoji: '🟠', done: false },
];

let reminders = [
  { id: 1, name: 'Crocin 500mg', time: '11:00', freq: 'Daily' },
  { id: 2, name: 'Vitamin D3', time: '08:00', freq: 'Daily' },
  { id: 3, name: 'Metformin', time: '13:00', freq: 'Twice daily' },
];

let family = [
  { id: 1, name: 'Priya Singh', rel: 'Mother', avatar: '👩', meds: 3, symp: 1, age: 52, blood: 'B+' },
  { id: 2, name: 'Rahul Singh', rel: 'Father', avatar: '👨', meds: 5, symp: 2, age: 55, blood: 'O+' },
  { id: 3, name: 'Ananya', rel: 'Sister', avatar: '👧', meds: 1, symp: 0, age: 20, blood: 'A+' },
];

const symptoms = [
  'Headache', 'Fever', 'Nausea', 'Fatigue', 'Cough',
  'Cold', 'Back Pain', 'Dizziness', 'Chest Pain', 'Shortness of Breath'
];

let selectedSymptoms = [];
const allergies = ['Penicillin', 'Sulfa drugs', 'NSAIDs'];
let aiHistory = [];
let darkMode = false;
let activeTab = 'home';
let charts = {};
let recognition = null;

// ========== CHART DATA ==========
const weekData = { labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'], data: [3, 5, 4, 6, 5, 7, 6] };
const monthData = { labels: ['W1', 'W2', 'W3', 'W4'], data: [18, 22, 19, 25] };
const moodData = { labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'], data: [7, 6, 8, 5, 9, 8, 7] };
let currentChartType = 'week';


// ===================================================
// UTILITY FUNCTIONS
// ===================================================

function getHour() {
  return new Date().getHours();
}

function greet() {
  const h = getHour();
  if (h < 12) return 'Good Morning 👋';
  if (h < 17) return 'Good Afternoon ☀️';
  return 'Good Evening 🌙';
}

function showNotif(msg, dur = 3500) {
  const n = document.getElementById('notif');
  n.textContent = msg;
  n.classList.add('show');
  setTimeout(() => n.classList.remove('show'), dur);
}


// ===================================================
// THEME
// ===================================================

function toggleTheme() {
  darkMode = !darkMode;
  document.body.classList.toggle('dark', darkMode);
  const darkLabel = document.getElementById('darkLabel');
  if (darkLabel) darkLabel.textContent = darkMode ? 'On' : 'Off';
  rebuildCharts();
}


// ===================================================
// LOGIN / LOGOUT
// ===================================================

function doLogin() {
  const email = document.getElementById('loginEmail').value;
  document.getElementById('loginScreen').style.display = 'none';
  document.getElementById('appRoot').style.display = 'block';

  document.getElementById('greetText').textContent = greet();
  const username = email.split('@')[0];
  document.getElementById('greetName').textContent = 'Welcome back, ' + username;
  document.getElementById('profileName').textContent = username;
  document.getElementById('profileEmail').textContent = email;

  init();
}

function doLogout() {
  document.getElementById('appRoot').style.display = 'none';
  document.getElementById('loginScreen').style.display = 'flex';
}


// ===================================================
// NAVIGATION
// ===================================================

function switchTab(tab) {
  // Hide all screens
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  // Remove active from nav
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));

  const screens = {
    home: 'homeScreen',
    meds: 'medsScreen',
    voice: 'voiceScreen',
    reminders: 'remindersScreen',
    family: 'familyScreen',
    profile: 'profileScreen',
    symptoms: 'medsScreen'
  };

  const navMap = {
    home: 'nav-home',
    meds: 'nav-meds',
    reminders: 'nav-reminders',
    profile: 'nav-profile'
  };

  const screen = document.getElementById(screens[tab] || 'homeScreen');
  if (screen) screen.classList.add('active');

  const nav = document.getElementById(navMap[tab]);
  if (nav) nav.classList.add('active');

  activeTab = tab;
  renderAll();
}


// ===================================================
// RENDER FUNCTIONS
// ===================================================

function renderAll() {
  renderHomeMeds();
  renderMedsFull();
  renderReminders();
  renderFamily();
  renderSymptoms();
  renderAIHistory();
}

function medCard(m, mini = false) {
  let statusBadge;
  if (m.done) {
    statusBadge = '<span class="med-badge badge-green">Taken</span>';
  } else if (m.time < '12:00') {
    statusBadge = '<span class="med-badge badge-orange">Morning</span>';
  } else {
    statusBadge = '<span class="med-badge badge-red">Upcoming</span>';
  }

  return `<div class="med-item">
    <div class="med-dot" style="background:${m.done ? '#d1fae5' : '#eef2ff'}">${m.emoji}</div>
    <div class="med-info">
      <div class="med-name">${m.name}</div>
      <div class="med-time">⏰ ${m.time} · ${m.freq} · ${m.dose}</div>
    </div>
    ${mini ? '' : statusBadge}
    <button class="med-check ${m.done ? 'done' : ''}" onclick="toggleMed(${m.id})">${m.done ? '✓' : ''}</button>
  </div>`;
}

function renderHomeMeds() {
  const el = document.getElementById('homeMedList');
  if (el) el.innerHTML = medications.slice(0, 3).map(m => medCard(m, true)).join('');

  const next = medications.find(m => !m.done);
  if (next) {
    const nr = document.getElementById('nextRemName');
    const nt = document.getElementById('nextRemTime');
    if (nr) nr.textContent = next.name;
    if (nt) nt.textContent = next.time + ' · ' + next.freq;
  }

  const medCount = document.getElementById('medCount');
  if (medCount) medCount.textContent = medications.length;
}

function renderMedsFull() {
  const el = document.getElementById('medListFull');
  if (el) el.innerHTML = medications.map(m => medCard(m)).join('');

  const al = document.getElementById('allergyList');
  if (al) al.innerHTML = allergies.map(a => `<span class="allergy-tag">⚠️ ${a}</span>`).join('');
}

function toggleMed(id) {
  const m = medications.find(x => x.id === id);
  if (m) {
    m.done = !m.done;
    if (m.done) showNotif('✅ ' + m.name + ' marked as taken!');
  }

  renderAll();

  // Recalculate health score
  const done = medications.filter(x => x.done).length;
  const score = Math.round(50 + (done / medications.length) * 50);

  const ringScore = document.querySelector('.ring-score');
  if (ringScore) ringScore.textContent = score;

  const circ = document.getElementById('healthRingCircle');
  if (circ) {
    const offset = 213.6 - (213.6 * (score / 100));
    circ.setAttribute('stroke-dashoffset', offset);
  }

  // Update ring info text
  const remaining = medications.filter(x => !x.done).length;
  const ringInfo = document.querySelector('.ring-info h4');
  if (ringInfo) {
    if (score >= 90) ringInfo.textContent = 'Excellent Health Score';
    else if (score >= 70) ringInfo.textContent = 'Good Health Score';
    else ringInfo.textContent = 'Keep Going!';
  }
  const ringDesc = document.querySelector('.ring-info p');
  if (ringDesc) {
    if (remaining === 0) ringDesc.innerHTML = 'All medications taken!<br>Great job today 🎉';
    else ringDesc.innerHTML = `Take ${remaining} more med${remaining > 1 ? 's' : ''} today<br>to improve your score`;
  }
}


// ===================================================
// REMINDERS
// ===================================================

function renderReminders() {
  const el = document.getElementById('reminderList');
  if (!el) return;
  el.innerHTML = reminders.map(r => `<div class="reminder-item">
    <div class="rem-time">${r.time}</div>
    <div class="rem-info">
      <div class="rem-name">💊 ${r.name}</div>
      <div class="rem-freq">${r.freq}</div>
    </div>
    <button class="rem-del" onclick="deleteReminder(${r.id})">🗑</button>
  </div>`).join('');
}

function addReminder() {
  const name = document.getElementById('remMed').value.trim();
  const time = document.getElementById('remTime').value;
  const freq = document.getElementById('remFreq').value;
  if (!name) {
    showNotif('⚠️ Enter medicine name');
    return;
  }

  const id = Date.now();
  reminders.push({ id, name, time, freq });
  document.getElementById('remMed').value = '';
  renderAll();
  showNotif('🔔 Reminder set for ' + name + '!');

  // Schedule browser notification
  const [h, m] = time.split(':').map(Number);
  const now = new Date();
  const target = new Date();
  target.setHours(h, m, 0, 0);
  const diff = target - now;
  if (diff > 0) {
    setTimeout(() => showNotif('💊 Time to take ' + name + '!'), diff);
  }
}

function deleteReminder(id) {
  reminders = reminders.filter(r => r.id !== id);
  renderAll();
  showNotif('🗑 Reminder removed');
}


// ===================================================
// FAMILY
// ===================================================

function renderFamily() {
  const el = document.getElementById('familyGrid');
  if (!el) return;

  el.innerHTML = family.map(f => `<div class="family-card" onclick="openFamModal(${f.id})">
    <div class="fam-avatar" style="background:linear-gradient(135deg,#eef2ff,#e0f2fe)">${f.avatar}</div>
    <div class="fam-name">${f.name}</div>
    <div class="fam-rel">${f.rel} · Age ${f.age}</div>
    <div class="fam-stats">
      <span class="fam-stat">💊 ${f.meds}</span>
      <span class="fam-stat">🩺 ${f.symp}</span>
    </div>
  </div>`).join('') +
  `<div class="add-fam" onclick="addFamilyMember()">
    <div class="plus">+</div>
    <span>Add Member</span>
  </div>`;

  const famCount = document.getElementById('famCount');
  if (famCount) famCount.textContent = family.length;
}

function openFamModal(id) {
  const f = family.find(x => x.id === id);
  if (!f) return;

  document.getElementById('famModalTitle').textContent = f.avatar + ' ' + f.name;
  document.getElementById('famModalContent').innerHTML = `
    <div class="profile-info" style="margin-bottom:16px">
      <div class="info-item"><div class="info-val">${f.age}</div><div class="info-label">Age</div></div>
      <div class="info-item"><div class="info-val">${f.blood || '--'}</div><div class="info-label">Blood</div></div>
      <div class="info-item"><div class="info-val">${f.meds}</div><div class="info-label">Meds</div></div>
    </div>
    <div class="med-list">
      <div class="med-item">
        <div class="med-dot" style="background:#eef2ff">💊</div>
        <div class="med-info"><div class="med-name">Vitamin B12</div><div class="med-time">⏰ 08:00 · Daily</div></div>
      </div>
    </div>
    <button class="btn-primary" style="margin-top:14px" onclick="showNotif('📱 Health alert sent to ${f.name}!')">Send Health Alert</button>`;
  openModal('famModal');
}

function addFamilyMember() {
  const names = ['Grandma', 'Uncle Raj', 'Aunt Priya', 'Brother Arjun'];
  const emojis = ['👵', '👴', '👩', '👦'];
  const i = family.length % 4;
  family.push({
    id: Date.now(),
    name: names[i],
    rel: 'Family',
    avatar: emojis[i],
    meds: 2,
    symp: 0,
    age: 30 + (i * 5),
    blood: 'O+'
  });
  renderAll();
  showNotif('👨‍👩‍👧 Family member added!');
}


// ===================================================
// SYMPTOMS
// ===================================================

function renderSymptoms() {
  const el = document.getElementById('symptomChips');
  if (!el) return;
  el.innerHTML = symptoms.map(s =>
    `<span class="symptom-chip ${selectedSymptoms.includes(s) ? 'selected' : ''}" onclick="toggleSymptom('${s}')">${s}</span>`
  ).join('');

  const sympCount = document.getElementById('sympCount');
  if (sympCount) sympCount.textContent = selectedSymptoms.length || 3;
}

function toggleSymptom(s) {
  if (selectedSymptoms.includes(s)) {
    selectedSymptoms = selectedSymptoms.filter(x => x !== s);
  } else {
    selectedSymptoms.push(s);
  }
  renderSymptoms();
}

function logSymptoms() {
  if (!selectedSymptoms.length) {
    showNotif('⚠️ Select at least one symptom');
    return;
  }
  showNotif('✅ Symptoms logged: ' + selectedSymptoms.join(', '));
  selectedSymptoms = [];
  renderSymptoms();
}


// ===================================================
// AI & VOICE
// ===================================================

function renderAIHistory() {
  const el = document.getElementById('aiHistory');
  if (!el) return;

  if (aiHistory.length === 0) {
    el.innerHTML = '<div style="color:var(--sub);font-size:14px;text-align:center;padding:20px">No queries yet. Ask anything!</div>';
    return;
  }

  el.innerHTML = aiHistory.slice(-3).reverse().map(h => `<div class="reminder-item">
    <div style="font-size:24px">🤖</div>
    <div class="rem-info">
      <div class="rem-name">${h.q}</div>
      <div class="rem-freq">${h.a.slice(0, 80)}...</div>
    </div>
  </div>`).join('');
}

function startVoice() {
  if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    recognition = new SR();
    recognition.lang = 'en-IN';
    recognition.start();

    document.getElementById('micPulse').classList.add('listening');
    document.getElementById('voiceBtnText').textContent = 'Listening...';

    recognition.onresult = (e) => {
      const transcript = e.results[0][0].transcript;
      document.getElementById('voiceResult').style.display = 'block';
      document.getElementById('voiceResult').textContent = '🗣 "' + transcript + '"';
      document.getElementById('aiInput').value = transcript;
      document.getElementById('micPulse').classList.remove('listening');
      document.getElementById('voiceBtnText').textContent = 'Tap to Speak';
      getAISuggestion();
    };

    recognition.onerror = () => {
      document.getElementById('micPulse').classList.remove('listening');
      document.getElementById('voiceBtnText').textContent = 'Tap to Speak';
      showNotif('⚠️ Voice not available in this browser');
    };
  } else {
    showNotif('⚠️ Speech recognition not supported');
  }
}

async function getAISuggestion() {
  const q = document.getElementById('aiInput').value.trim();
  if (!q) {
    showNotif('⚠️ Enter a query');
    return;
  }

  const aiEl = document.getElementById('aiResponse');
  aiEl.style.display = 'block';
  aiEl.textContent = '🤖 Thinking...';

  // Local AI responses for common health queries (works offline)
  const localResponses = {
    headache: '🤖 For a headache, try resting in a quiet dark room, staying hydrated, and taking a paracetamol if needed. If headaches persist or are severe, please consult your doctor.',
    fever: '🤖 For fever, stay hydrated and rest well. You can take paracetamol (Crocin) as directed. If fever exceeds 103°F or persists beyond 3 days, consult a doctor immediately.',
    cold: '🤖 For a common cold, drink warm fluids, get plenty of rest, and use steam inhalation. Consider vitamin C supplements. If symptoms worsen after a week, see your doctor.',
    cough: '🤖 For cough, try warm honey-lemon water and stay hydrated. Avoid cold beverages. If cough persists beyond 2 weeks or produces blood, consult your doctor immediately.',
    nausea: '🤖 For nausea, try small sips of water or ginger tea. Eat bland foods like crackers. Avoid heavy or spicy meals. If vomiting persists, consult your doctor.',
    fatigue: '🤖 Fatigue can result from poor sleep, dehydration, or nutritional deficiencies. Ensure 7-8 hours of sleep, stay hydrated, and consider checking your vitamin D and B12 levels.',
    stomach: '🤖 For stomach issues, try bland foods (BRAT diet), stay hydrated, and avoid spicy or oily foods. If pain is severe or persistent, please consult a doctor.',
    pain: '🤖 For general pain, rest the affected area and apply ice/heat as appropriate. Over-the-counter pain relievers may help. For persistent or severe pain, consult your doctor.',
    sleep: '🤖 For better sleep, maintain a consistent schedule, avoid screens before bed, limit caffeine, and create a dark, cool environment. If insomnia persists, consult your doctor.',
    anxiety: '🤖 For anxiety, try deep breathing exercises (4-7-8 technique), regular exercise, and mindfulness. If anxiety significantly impacts your daily life, consider consulting a mental health professional.',
  };

  // Check for local response match
  const qLower = q.toLowerCase();
  let answered = false;
  for (const [keyword, response] of Object.entries(localResponses)) {
    if (qLower.includes(keyword)) {
      aiEl.textContent = response;
      aiHistory.push({ q, a: response.replace('🤖 ', '') });
      renderAIHistory();
      answered = true;
      break;
    }
  }

  if (!answered) {
    // Fallback generic response
    aiEl.textContent = '🤖 Based on your query, I recommend maintaining a healthy lifestyle with proper nutrition, hydration, and rest. For specific medical concerns, please consult your healthcare provider for personalized advice.';
    aiHistory.push({ q, a: 'Based on your query, I recommend consulting your healthcare provider for personalized advice.' });
    renderAIHistory();
  }

  document.getElementById('aiInput').value = '';
}


// ===================================================
// MODALS
// ===================================================

function openModal(id) {
  document.getElementById(id).classList.add('open');
}

function closeModal(id) {
  document.getElementById(id).classList.remove('open');
}

function openAddMedModal() {
  openModal('addMedModal');
}

function addMed() {
  const name = document.getElementById('newMedName').value.trim();
  const dose = document.getElementById('newMedDose').value.trim() || 'As prescribed';
  const time = document.getElementById('newMedTime').value;
  const freq = document.getElementById('newMedFreq').value;
  const emojis = ['🔴', '🟡', '🟢', '🔵', '🟠', '🟣'];

  if (!name) {
    showNotif('⚠️ Enter medicine name');
    return;
  }

  medications.push({
    id: Date.now(),
    name,
    dose,
    time,
    freq,
    emoji: emojis[medications.length % 6],
    done: false
  });

  closeModal('addMedModal');
  renderAll();
  showNotif('💊 ' + name + ' added!');
  document.getElementById('newMedName').value = '';
  document.getElementById('newMedDose').value = '';
}


// ===================================================
// CHARTS
// ===================================================

function getChartDefaults() {
  return {
    responsive: true,
    plugins: { legend: { display: false } },
    scales: {
      x: {
        grid: { color: darkMode ? 'rgba(255,255,255,.06)' : 'rgba(0,0,0,.06)' },
        ticks: { color: darkMode ? '#8892b0' : '#6b7280', font: { size: 11 } }
      },
      y: {
        grid: { color: darkMode ? 'rgba(255,255,255,.06)' : 'rgba(0,0,0,.06)' },
        ticks: { color: darkMode ? '#8892b0' : '#6b7280', font: { size: 11 } }
      }
    }
  };
}

function buildMainChart() {
  const ctx = document.getElementById('mainChart');
  if (!ctx) return;
  if (charts.main) charts.main.destroy();

  const d = currentChartType === 'week' ? weekData :
            currentChartType === 'month' ? monthData : moodData;

  charts.main = new Chart(ctx, {
    type: 'line',
    data: {
      labels: d.labels,
      datasets: [{
        data: d.data,
        borderColor: '#4f46e5',
        backgroundColor: 'rgba(79,70,229,.12)',
        tension: 0.4,
        fill: true,
        pointBackgroundColor: '#4f46e5',
        pointRadius: 4
      }]
    },
    options: { ...getChartDefaults(), animation: { duration: 600 } }
  });
}

function buildFamilyChart() {
  const ctx = document.getElementById('familyChart');
  if (!ctx) return;
  if (charts.family) charts.family.destroy();

  charts.family = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: family.map(f => f.name.split(' ')[0]),
      datasets: [
        { label: 'Meds', data: family.map(f => f.meds), backgroundColor: 'rgba(79,70,229,.7)', borderRadius: 8 },
        { label: 'Symptoms', data: family.map(f => f.symp), backgroundColor: 'rgba(6,182,212,.7)', borderRadius: 8 }
      ]
    },
    options: {
      ...getChartDefaults(),
      plugins: {
        legend: { display: true, labels: { color: darkMode ? '#e8eaf6' : '#1a1f36' } }
      }
    }
  });
}

function switchChart(type, btn) {
  currentChartType = type;
  document.querySelectorAll('.chart-tab').forEach(t => t.classList.remove('active'));
  btn.classList.add('active');
  buildMainChart();
}

function rebuildCharts() {
  setTimeout(() => {
    buildMainChart();
    buildFamilyChart();
  }, 100);
}


// ===================================================
// INITIALIZATION
// ===================================================

function init() {
  renderAll();
  setTimeout(buildMainChart, 200);
  setTimeout(buildFamilyChart, 400);

  // Auto reminder check every minute
  setInterval(() => {
    const now = new Date();
    const hh = String(now.getHours()).padStart(2, '0');
    const mm = String(now.getMinutes()).padStart(2, '0');
    const t = hh + ':' + mm;
    reminders.forEach(r => {
      if (r.time === t) showNotif('💊 Time to take ' + r.name + '!', 5000);
    });
  }, 60000);
}


// ===================================================
// EVENT LISTENERS (on DOM ready)
// ===================================================

document.addEventListener('DOMContentLoaded', () => {
  // Close modal on background click
  document.querySelectorAll('.modal-bg').forEach(mb => {
    mb.addEventListener('click', e => {
      if (e.target === mb) mb.classList.remove('open');
    });
  });

  // Allow Enter key on login password
  const loginPassword = document.getElementById('loginPassword');
  if (loginPassword) {
    loginPassword.addEventListener('keydown', e => {
      if (e.key === 'Enter') doLogin();
    });
  }

  // Allow Enter key on AI input
  const aiInput = document.getElementById('aiInput');
  if (aiInput) {
    aiInput.addEventListener('keydown', e => {
      if (e.key === 'Enter') getAISuggestion();
    });
  }

  // Allow Enter key on reminder input
  const remMed = document.getElementById('remMed');
  if (remMed) {
    remMed.addEventListener('keydown', e => {
      if (e.key === 'Enter') addReminder();
    });
  }
});
