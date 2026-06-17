// ==========================================
// MOUSE INTERACTION & FOCUS MANAGEMENT
// ==========================================
function setupMouseInteraction() {
  const interactiveElements = document.querySelectorAll('.interactive');
  interactiveElements.forEach(el => {
    el.addEventListener('mouseenter', () => {
      if (window.electronAPI) window.electronAPI.setIgnoreMouseEvents(false);
    });
    el.addEventListener('mouseleave', () => {
      if (window.electronAPI) window.electronAPI.setIgnoreMouseEvents(true, { forward: true });
    });
  });
}

// Enable keyboard input temporarily when editing input elements
function registerKeyboardFocus(inputElement) {
  inputElement.addEventListener('focus', () => {
    if (window.electronAPI) window.electronAPI.setFocusable(true);
  });
  inputElement.addEventListener('blur', () => {
    if (window.electronAPI) window.electronAPI.setFocusable(false);
    if (window.electronAPI) window.electronAPI.setIgnoreMouseEvents(true, { forward: true });
  });
}

// ==========================================
// STATE MANAGEMENT & DATA MODELS
// ==========================================
const DEFAULT_TASKS = [
  { id: 1, text: "Morning Workout", time: "06:30 AM", completed: true, starred: false },
  { id: 2, text: "Read 20 Pages", time: "08:00 AM", completed: true, starred: false },
  { id: 3, text: "Code Project Module", time: "10:00 AM", completed: true, starred: true },
  { id: 4, text: "Study Data Structures", time: "01:00 PM", completed: false, starred: false },
  { id: 5, text: "Work on Project Report", time: "03:00 PM", completed: true, starred: false },
  { id: 6, text: "Learn Something New", time: "07:00 PM", completed: false, starred: true },
  { id: 7, text: "Meditation 10 Min", time: "09:00 PM", completed: true, starred: false },
  { id: 8, text: "Daily Reflection", time: "09:30 PM", completed: false, starred: false }
];

const DEFAULT_WINS = [
  "Completed workout",
  "Good progress on project",
  "Read and learned"
];

const DEFAULT_CHALLENGES = [
  "Distraction in afternoon",
  "Couldn't finish DSA practice"
];

const STATE_KEYS = {
  TASKS: 'productive_tasks',
  NOTES: 'productive_notes',
  WINS: 'productive_wins',
  CHALLENGES: 'productive_challenges',
  SUMMARY: 'productive_summary',
  DAYS_HISTORY: 'productive_days_history',
  DAY_SCORES: 'productive_day_scores',
  STREAK: 'productive_streak',
  DAYS_TASKS: 'productive_days_tasks',
  DAYS_NOTES: 'productive_days_notes',
  DAYS_WINS: 'productive_days_wins',
  DAYS_CHALLENGES: 'productive_days_challenges',
  DAYS_SUMMARY: 'productive_days_summary'
};

let state = {
  currentDate: new Date(),
  selectedDateStr: getFormattedDate(new Date()),
  tasks: [],
  daysTasks: {},
  notes: "",
  wins: [],
  challenges: [],
  summary: "",
  daysNotes: {},
  daysWins: {},
  daysChallenges: {},
  daysSummary: {},
  daysHistory: {},
  dayScores: {},
  streak: { count: 12, best: 24 }
};

// ==========================================
// DATE HELPERS
// ==========================================
function getFormattedDate(date) {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

function getReadableDate(date) {
  const options = { day: 'numeric', month: 'long', year: 'numeric' };
  return date.toLocaleDateString('en-US', options);
}

function getDayName(date) {
  const options = { weekday: 'long' };
  return date.toLocaleDateString('en-US', options);
}

function isFutureDate(dateStr) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const parts = dateStr.split('-');
  const d = new Date(parts[0], parts[1] - 1, parts[2]);
  return d > today;
}

// ==========================================
// LOAD & SAVE LOGIC
// ==========================================
function loadState() {
  const legacyTasks = JSON.parse(localStorage.getItem(STATE_KEYS.TASKS)) || null;

  state.daysTasks = JSON.parse(localStorage.getItem(STATE_KEYS.DAYS_TASKS)) || {};
  state.daysNotes = JSON.parse(localStorage.getItem(STATE_KEYS.DAYS_NOTES)) || {};
  state.daysWins = JSON.parse(localStorage.getItem(STATE_KEYS.DAYS_WINS)) || {};
  state.daysChallenges = JSON.parse(localStorage.getItem(STATE_KEYS.DAYS_CHALLENGES)) || {};
  state.daysSummary = JSON.parse(localStorage.getItem(STATE_KEYS.DAYS_SUMMARY)) || {};
  state.daysHistory = JSON.parse(localStorage.getItem(STATE_KEYS.DAYS_HISTORY)) || generateMockHistory();
  state.dayScores = JSON.parse(localStorage.getItem(STATE_KEYS.DAY_SCORES)) || {};
  state.streak = JSON.parse(localStorage.getItem(STATE_KEYS.STREAK)) || { count: 12, best: 24 };

  const d = state.selectedDateStr;
  const future = isFutureDate(d);

  state.tasks = future ? [] : (state.daysTasks[d] || legacyTasks || DEFAULT_TASKS);
  state.daysTasks[d] = state.tasks;
  state.notes = future ? "" : (state.daysNotes[d] || "Productive day overall. Completed most important tasks. Need to improve focus in the afternoon.");
  state.wins = future ? [] : (state.daysWins[d] || DEFAULT_WINS);
  state.challenges = future ? [] : (state.daysChallenges[d] || DEFAULT_CHALLENGES);
  state.summary = future ? "" : (state.daysSummary[d] || "A good and productive day. Keep building consistency.");
}

function saveState() {
  const d = state.selectedDateStr;
  if (!state.daysTasks) state.daysTasks = {};
  if (!state.daysNotes) state.daysNotes = {};
  if (!state.daysWins) state.daysWins = {};
  if (!state.daysChallenges) state.daysChallenges = {};
  if (!state.daysSummary) state.daysSummary = {};

  state.daysTasks[d] = state.tasks;
  state.daysNotes[d] = state.notes;
  state.daysWins[d] = state.wins;
  state.daysChallenges[d] = state.challenges;
  state.daysSummary[d] = state.summary;

  localStorage.setItem(STATE_KEYS.TASKS, JSON.stringify(state.tasks));
  localStorage.setItem(STATE_KEYS.DAYS_TASKS, JSON.stringify(state.daysTasks));
  localStorage.setItem(STATE_KEYS.DAYS_NOTES, JSON.stringify(state.daysNotes));
  localStorage.setItem(STATE_KEYS.DAYS_WINS, JSON.stringify(state.daysWins));
  localStorage.setItem(STATE_KEYS.DAYS_CHALLENGES, JSON.stringify(state.daysChallenges));
  localStorage.setItem(STATE_KEYS.DAYS_SUMMARY, JSON.stringify(state.daysSummary));
  localStorage.setItem(STATE_KEYS.DAYS_HISTORY, JSON.stringify(state.daysHistory));
  localStorage.setItem(STATE_KEYS.DAY_SCORES, JSON.stringify(state.dayScores));
  localStorage.setItem(STATE_KEYS.STREAK, JSON.stringify(state.streak));
}

function switchToDate(newDateStr, targetDate) {
  saveState();

  state.selectedDateStr = newDateStr;
  const future = isFutureDate(newDateStr);

  state.tasks = future ? [] : (state.daysTasks[newDateStr] || DEFAULT_TASKS);
  state.notes = future ? "" : (state.daysNotes[newDateStr] || "Productive day overall. Completed most important tasks. Need to improve focus in the afternoon.");
  state.wins = future ? [] : (state.daysWins[newDateStr] || DEFAULT_WINS);
  state.challenges = future ? [] : (state.daysChallenges[newDateStr] || DEFAULT_CHALLENGES);
  state.summary = future ? "" : (state.daysSummary[newDateStr] || "A good and productive day. Keep building consistency.");

  document.getElementById('sidebar-day-month').innerText = getReadableDate(targetDate);
  document.getElementById('sidebar-day-name').innerText = getDayName(targetDate);

  renderTasksList();
  renderBullets();
  updateCalculatedStats();

  document.getElementById('notes-text').innerText = state.notes;
  document.getElementById('notes-text').classList.remove('hidden');
  document.getElementById('notes-textarea').classList.add('hidden');

  document.getElementById('summary-text').innerText = state.summary;
  document.getElementById('summary-text').classList.remove('hidden');
  document.getElementById('summary-textarea').classList.add('hidden');

  const sidebar = document.querySelector('.sidebar-panel');
  sidebar.style.opacity = '0.7';
  setTimeout(() => { sidebar.style.opacity = '1'; }, 100);
}

// Mock historical productivity data for visual richness on calendar/heatmap
function generateMockHistory() {
  const mock = {};
  const today = new Date();
  // Fill past 60 days
  for (let i = 0; i < 60; i++) {
    const d = new Date();
    d.setDate(today.getDate() - i);
    const dateStr = getFormattedDate(d);

    // Weighted random distribution
    const r = Math.random();
    if (r > 0.4) {
      mock[dateStr] = 'completed';
    } else if (r > 0.2) {
      mock[dateStr] = 'partial';
    } else if (r > 0.08) {
      mock[dateStr] = 'low';
    } else {
      mock[dateStr] = 'no-data';
    }
  }
  return mock;
}

function calculateStreak() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const selectedMonth = state.currentDate.getMonth();
  const selectedYear = state.currentDate.getFullYear();

  const firstDay = new Date(selectedYear, selectedMonth, 1);
  const lastDayOfMonth = new Date(selectedYear, selectedMonth + 1, 0);
  const totalDaysInMonth = lastDayOfMonth.getDate();

  const isCurrentMonth = selectedYear === today.getFullYear() && selectedMonth === today.getMonth();

  // Future month: no data
  if (!isCurrentMonth && state.currentDate > today) {
    state.streak.count = 0;
    state.streak.best = 0;
    state.streak.daysInMonth = totalDaysInMonth;
    return;
  }

  // Best streak: longest consecutive run within the month (scans all days)
  let bestStreak = 0;
  let tempStreak = 0;
  const scanDate = new Date(firstDay);
  while (scanDate <= lastDayOfMonth) {
    const dateStr = getFormattedDate(scanDate);
    const status = state.daysHistory[dateStr];
    if (status === 'completed' || status === 'partial') {
      tempStreak++;
      if (tempStreak > bestStreak) bestStreak = tempStreak;
    } else {
      tempStreak = 0;
    }
    scanDate.setDate(scanDate.getDate() + 1);
  }

  // Current streak
  let currentStreak = 0;
  if (isCurrentMonth) {
    // Current month: count backwards from today
    const d = new Date(today);
    while (d >= firstDay) {
      const dateStr = getFormattedDate(d);
      const status = state.daysHistory[dateStr];
      if (status === 'completed' || status === 'partial') {
        currentStreak++;
        d.setDate(d.getDate() - 1);
      } else {
        break;
      }
    }
  } else {
    // Past month: current streak = best streak (month is over)
    currentStreak = bestStreak;
  }

  state.streak.count = currentStreak;
  state.streak.best = bestStreak;
  state.streak.daysInMonth = totalDaysInMonth;
}

// ==========================================
// CALCULATE STATS
// ==========================================
function updateCalculatedStats() {
  const total = state.tasks.length;
  const completed = state.tasks.filter(t => t.completed).length;
  const pending = total - completed;
  const scorePercent = total > 0 ? Math.round((completed / total) * 100) : 0;

  // 1. Sidebar overview values
  document.getElementById('overview-tasks-count').innerText = total;
  document.getElementById('overview-completed-count').innerText = completed;
  document.getElementById('overview-pending-count').innerText = pending;
  document.getElementById('overview-score-percent').innerText = `${scorePercent}%`;

  // Animate sidebar circular progress ring
  // Circumference = 2 * PI * 9 = 56.54
  const ring = document.getElementById('overview-score-ring');
  const dashOffset = 56.54 - (scorePercent / 100) * 56.54;
  ring.style.strokeDasharray = '56.54';
  ring.style.strokeDashoffset = dashOffset;

  // 2. Bottom Row Stat: Daily Progress
  document.getElementById('monthly-progress-text').innerText = `${scorePercent}%`;
  // Circumference = 2 * PI * 16 = 100.53
  const progressRing = document.getElementById('monthly-progress-ring');
  const progressOffset = 100.53 - (scorePercent / 100) * 100.53;
  progressRing.style.strokeDasharray = '100.53';
  progressRing.style.strokeDashoffset = progressOffset;

  // 3. Bottom Row Stat: Tasks Completed
  document.getElementById('tasks-completed-text').innerText = completed;
  document.getElementById('tasks-completed-total').innerText = `Out of ${total}`;

  // Update selected date in days history
  const selStr = state.selectedDateStr;
  state.dayScores[selStr] = scorePercent;
  if (total === 0) {
    state.daysHistory[selStr] = 'no-data';
  } else if (scorePercent >= 80) {
    state.daysHistory[selStr] = 'completed';
  } else if (scorePercent >= 50) {
    state.daysHistory[selStr] = 'partial';
  } else if (scorePercent > 0) {
    state.daysHistory[selStr] = 'low';
  } else {
    state.daysHistory[selStr] = 'no-data';
  }

  // Update streak from actual history data
  calculateStreak();
  document.getElementById('streak-count').innerText = state.streak.count;
  document.getElementById('streak-best').innerText = `Best: ${state.streak.best} of ${state.streak.daysInMonth} days`;

  // Render dependants
  renderCalendar();
  renderWeeklyHeatmap();
  calculateFocusScore();
  renderSparkline();
  saveState();
}

// ==========================================
// RENDER: CALENDAR WIDGET
// ==========================================
function renderCalendar() {
  console.log("renderCalendar called");

  const currentMonth = state.currentDate.getMonth();
  console.log("currentMonth", currentMonth);

  const year = state.currentDate.getFullYear();
  const month = currentMonth;

  const daysContainer = document.getElementById('calendar-days');
  console.log("daysContainer", daysContainer);
  console.log("children before", daysContainer?.children?.length ?? null);


  // Set month & year title

  const monthNames = ["January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"];
  document.getElementById('calendar-month-year').innerText = `${monthNames[month]} ${year}`;

  // (diagnostics for children after clear live near initial daysContainer declaration)
  daysContainer.innerHTML = '';
  console.log('children after clear (innerHTML)', daysContainer.children.length);


  // Get first day of month and last day of month

  const firstDayIndex = new Date(year, month, 1).getDay(); // 0 is Sun, 1 is Mon, etc.
  // Convert Sunday=0 to Sunday=7 for European layout (Mon=1, Tue=2, ..., Sun=7)
  const adjustedFirstDayIndex = firstDayIndex === 0 ? 7 : firstDayIndex;

  const lastDay = new Date(year, month + 1, 0).getDate();
  const prevLastDay = new Date(year, month, 0).getDate();

  // Draw previous month days
  for (let x = adjustedFirstDayIndex - 1; x > 0; x--) {
    const prevDay = prevLastDay - x + 1;
    const dayEl = createDayElement(prevDay, true, month - 1, year);
    daysContainer.appendChild(dayEl);
  }

  // Draw current month days
  const today = new Date();
  for (let i = 1; i <= lastDay; i++) {
    const isToday = (i === today.getDate() && month === today.getMonth() && year === today.getFullYear());
    const dayEl = createDayElement(i, false, month, year, isToday);
    daysContainer.appendChild(dayEl);
  }

  // Draw next month days to complete 6-row grid (42 cells total)
  const totalCellsUsed = (adjustedFirstDayIndex - 1) + lastDay;
  const remainingCells = 42 - totalCellsUsed;
  for (let j = 1; j <= remainingCells; j++) {
    const dayEl = createDayElement(j, true, month + 1, year);
    daysContainer.appendChild(dayEl);
  }

  // Diagnostics: validate expected number of cells rendered
  console.log('calendarDays expected cells:', 42);
  console.log('calendar-days children after render:', daysContainer.children.length);
}


function createDayElement(dayNum, isOtherMonth, monthIndex, year, isToday = false) {
  const el = document.createElement('div');
  el.classList.add('calendar-day');
  if (isOtherMonth) el.classList.add('other-month');
  if (isToday) el.classList.add('today');

  // Day number label
  const numEl = document.createElement('span');
  numEl.classList.add('day-num');
  numEl.innerText = dayNum;
  el.appendChild(numEl);

  // Map to YYYY-MM-DD to query completion history
  // Handle overflow/underflow months safely
  const targetDate = new Date(year, monthIndex, dayNum);
  const dateStr = getFormattedDate(targetDate);
  const status = state.daysHistory[dateStr] || 'no-data';

  // Status indicator dot
  const dotEl = document.createElement('span');
  if (isToday) {
    dotEl.classList.add('status-dot', 'today-indicator');
  } else {
    dotEl.classList.add('status-dot', status);
  }
  el.appendChild(dotEl);

  // Set click action to anchor view (mocking day switching)
  el.addEventListener('click', () => {
    switchToDate(dateStr, targetDate);
  });

  return el;
}

// ==========================================
// RENDER: WEEKLY HEATMAP
// ==========================================
function renderWeeklyHeatmap() {
  const grid = document.getElementById('heatmap-grid');
  grid.innerHTML = '';

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Use the selected month from state.currentDate
  const selectedMonth = state.currentDate.getMonth();
  const selectedYear = state.currentDate.getFullYear();

  // First day of the selected month
  const firstDay = new Date(selectedYear, selectedMonth, 1);

  // Find the Monday of the week containing the first day
  const dayOfWeek = firstDay.getDay();
  const mondayOffset = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  const startMonday = new Date(firstDay);
  startMonday.setDate(firstDay.getDate() - mondayOffset);

  // Fill 5 weeks (35 cells), row = day of week (Mon=1..Sun=7), col = week (1..5)
  for (let week = 0; week < 5; week++) {
    for (let dow = 0; dow < 7; dow++) {
      const d = new Date(startMonday);
      d.setDate(startMonday.getDate() + week * 7 + dow);

      // Skip future dates
      if (d > today) continue;

      // Only show days within the selected month
      if (d.getMonth() !== selectedMonth || d.getFullYear() !== selectedYear) continue;

      const dateStr = getFormattedDate(d);
      const status = state.daysHistory[dateStr] || 'no-data';

      const cell = document.createElement('div');
      cell.classList.add('heatmap-cell', status);
      cell.style.gridRow = (dow + 1).toString();
      cell.style.gridColumn = (week + 1).toString();
      cell.title = `${getReadableDate(d)}: ${status.replace('-', ' ')}`;
      grid.appendChild(cell);
    }
  }
}

// ==========================================
// FOCUS SCORE
// ==========================================
function calculateFocusScore() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const selectedMonth = state.currentDate.getMonth();
  const selectedYear = state.currentDate.getFullYear();

  const lastDay = new Date(selectedYear, selectedMonth + 1, 0);
  const isCurrentMonth = selectedYear === today.getFullYear() && selectedMonth === today.getMonth();
  const endDate = isCurrentMonth ? today : lastDay;

  let totalScore = 0;
  let daysWithData = 0;
  const d = new Date(selectedYear, selectedMonth, 1);
  while (d <= endDate) {
    const dateStr = getFormattedDate(d);
    const score = state.dayScores[dateStr];
    if (score !== undefined) {
      totalScore += score;
      daysWithData++;
    }
    d.setDate(d.getDate() + 1);
  }

  const monthlyAvg = daysWithData > 0 ? Math.round(totalScore / daysWithData) : 0;

  document.getElementById('focus-score-text').innerText = `${monthlyAvg}%`;
  document.getElementById('focus-score-sub').innerText = `${daysWithData} days tracked`;
}

// ==========================================
// RENDER: FOCUS SPARKLINE
// ==========================================
function renderSparkline() {
  const sparklinePath = document.getElementById('sparkline-path');
  if (!sparklinePath) return;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const selectedMonth = state.currentDate.getMonth();
  const selectedYear = state.currentDate.getFullYear();

  const firstDay = new Date(selectedYear, selectedMonth, 1);
  const lastDay = new Date(selectedYear, selectedMonth + 1, 0);
  const isCurrentMonth = selectedYear === today.getFullYear() && selectedMonth === today.getMonth();
  const endDate = isCurrentMonth ? today : lastDay;

  // Collect scores for each day in the month
  const scores = [];
  const d = new Date(firstDay);
  while (d <= endDate) {
    const dateStr = getFormattedDate(d);
    scores.push(state.dayScores[dateStr] || 0);
    d.setDate(d.getDate() + 1);
  }

  if (scores.length === 0) {
    sparklinePath.setAttribute('d', 'M 0 17.5 L 100 17.5');
    return;
  }

  // Map scores to SVG points (viewBox: 0 0 100 35)
  const width = 100;
  const height = 35;
  const padding = 2;
  const usableHeight = height - padding * 2;

  const points = scores.map((score, i) => ({
    x: scores.length === 1 ? width / 2 : (i / (scores.length - 1)) * width,
    y: padding + usableHeight - (score / 100) * usableHeight
  }));

  // Build smooth cubic bezier curve
  let path = `M ${points[0].x} ${points[0].y}`;
  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1];
    const curr = points[i];
    const cpx = (prev.x + curr.x) / 2;
    path += ` C ${cpx} ${prev.y}, ${cpx} ${curr.y}, ${curr.x} ${curr.y}`;
  }

  sparklinePath.setAttribute('d', path);
}

// ==========================================
// RENDER & MANAGE TASKS CHECKLIST
// ==========================================
function renderTasksList() {
  const container = document.getElementById('tasks-list');
  container.innerHTML = '';

  state.tasks.forEach(task => {
    const item = document.createElement('div');
    item.classList.add('task-item');
    if (task.completed) item.classList.add('completed');

    // Left: Checkbox & Text
    const left = document.createElement('div');
    left.classList.add('task-left');

    const label = document.createElement('label');
    label.classList.add('checkbox-container');

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.checked = task.completed;
    checkbox.addEventListener('change', () => {
      task.completed = checkbox.checked;
      if (task.completed) {
        item.classList.add('completed');
      } else {
        item.classList.remove('completed');
      }
      updateCalculatedStats();
    });

    const checkmark = document.createElement('span');
    checkmark.classList.add('checkmark');

    label.appendChild(checkbox);
    label.appendChild(checkmark);

    const textSpan = document.createElement('span');
    textSpan.classList.add('task-text');
    textSpan.innerText = task.text;

    left.appendChild(label);
    left.appendChild(textSpan);

    // Right: Time, Star & Delete
    const right = document.createElement('div');
    right.classList.add('task-right');

    const timeSpan = document.createElement('span');
    timeSpan.classList.add('task-time');
    timeSpan.innerText = task.time;

    // Star button
    const starBtn = document.createElement('button');
    starBtn.classList.add('star-btn');
    if (task.starred) starBtn.classList.add('starred');
    // Draw star SVG
    starBtn.innerHTML = `
      <svg width="14" height="14" viewBox="0 0 24 24" fill="${task.starred ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
      </svg>
    `;
    starBtn.addEventListener('click', () => {
      task.starred = !task.starred;
      renderTasksList();
      saveState();
    });

    // Delete button
    const delBtn = document.createElement('button');
    delBtn.classList.add('delete-btn');
    delBtn.innerHTML = `
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <polyline points="3 6 5 6 21 6"></polyline>
        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
      </svg>
    `;
    delBtn.addEventListener('click', () => {
      state.tasks = state.tasks.filter(t => t.id !== task.id);
      renderTasksList();
      updateCalculatedStats();
    });

    right.appendChild(timeSpan);
    right.appendChild(starBtn);
    right.appendChild(delBtn);

    item.appendChild(left);
    item.appendChild(right);
    container.appendChild(item);
  });
}

// ==========================================
// RENDER WINS & CHALLENGES
// ==========================================
function renderBullets() {
  // Wins
  const winsContainer = document.getElementById('wins-list');
  winsContainer.innerHTML = '';
  state.wins.forEach((win, idx) => {
    const li = document.createElement('li');
    li.innerText = win;
    li.title = "Click to remove win";
    li.addEventListener('click', () => {
      state.wins.splice(idx, 1);
      renderBullets();
      saveState();
    });
    winsContainer.appendChild(li);
  });

  // Challenges
  const challengesContainer = document.getElementById('challenges-list');
  challengesContainer.innerHTML = '';
  state.challenges.forEach((chal, idx) => {
    const li = document.createElement('li');
    li.innerText = chal;
    li.title = "Click to remove challenge";
    li.addEventListener('click', () => {
      state.challenges.splice(idx, 1);
      renderBullets();
      saveState();
    });
    challengesContainer.appendChild(li);
  });
}

// ==========================================
// EVENT HANDLERS & BINDINGS
// ==========================================
function setupEventHandlers() {
  // Date anchors in Sidebar
  document.getElementById('sidebar-day-month').innerText = getReadableDate(new Date());
  document.getElementById('sidebar-day-name').innerText = getDayName(new Date());

  // Month navigation
  document.getElementById('prev-month').addEventListener('click', () => {
    state.currentDate.setMonth(state.currentDate.getMonth() - 1);
    renderCalendar();
    renderWeeklyHeatmap();
    calculateStreak();
    document.getElementById('streak-count').innerText = state.streak.count;
    document.getElementById('streak-best').innerText = `Best: ${state.streak.best} of ${state.streak.daysInMonth} days`;
    calculateFocusScore();
    renderSparkline();
  });
  document.getElementById('next-month').addEventListener('click', () => {
    state.currentDate.setMonth(state.currentDate.getMonth() + 1);
    renderCalendar();
    renderWeeklyHeatmap();
    calculateStreak();
    document.getElementById('streak-count').innerText = state.streak.count;
    document.getElementById('streak-best').innerText = `Best: ${state.streak.best} of ${state.streak.daysInMonth} days`;
    calculateFocusScore();
    renderSparkline();
  });
  document.getElementById('today-btn').addEventListener('click', () => {
    const today = new Date();
    state.currentDate = today;
    switchToDate(getFormattedDate(today), today);
    calculateStreak();
    document.getElementById('streak-count').innerText = state.streak.count;
    document.getElementById('streak-best').innerText = `Best: ${state.streak.best} of ${state.streak.daysInMonth} days`;
    calculateFocusScore();
    renderSparkline();
  });

  // Minimize dashboard panel button (closes/hides dashboard)
  document.getElementById('minimize-dashboard').addEventListener('click', () => {
    if (window.electronAPI) window.electronAPI.setIgnoreMouseEvents(true);
    const root = document.querySelector('.dashboard-root');
    root.style.opacity = '0';
    root.style.transform = 'scale(0.98)';
    setTimeout(() => {
      // Small visual delay before actually minimizing/hiding
      root.style.opacity = '1';
      root.style.transform = 'scale(1)';
    }, 400);
  });

  // Lock panel toggle
  const lockBtn = document.getElementById('lock-btn');
  lockBtn.addEventListener('click', () => {
    const isDashboardLocked = lockBtn.classList.toggle('locked');
    if (isDashboardLocked) {
      lockBtn.innerHTML = `
        <svg id="lock-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
      `;
      // Lock it in non-interactive mode
      if (window.electronAPI) window.electronAPI.setIgnoreMouseEvents(true);
    } else {
      lockBtn.innerHTML = `
        <svg id="lock-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
      `;
      if (window.electronAPI) window.electronAPI.setIgnoreMouseEvents(true, { forward: true });
    }
  });

  // Tasks addition form
  const addTaskBtn = document.getElementById('add-task-btn');
  const taskForm = document.getElementById('task-form');
  const taskInput = document.getElementById('task-input');
  const taskTime = document.getElementById('task-time');
  const saveTaskBtn = document.getElementById('save-task');
  const cancelTaskBtn = document.getElementById('cancel-task');

  registerKeyboardFocus(taskInput);
  registerKeyboardFocus(taskTime);

  addTaskBtn.addEventListener('click', () => {
    taskForm.classList.remove('hidden');
    taskInput.focus();
  });

  function closeTaskForm() {
    taskForm.classList.add('hidden');
    taskInput.value = '';
    taskTime.value = '';
    taskInput.blur();
    taskTime.blur();
  }

  saveTaskBtn.addEventListener('click', () => {
    const text = taskInput.value.trim();
    let time = taskTime.value.trim() || new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    if (text) {
      const newTask = {
        id: Date.now(),
        text: text,
        time: time,
        completed: false,
        starred: false
      };
      state.tasks.push(newTask);
      renderTasksList();
      updateCalculatedStats();
      closeTaskForm();
    }
  });

  cancelTaskBtn.addEventListener('click', closeTaskForm);

  // Notes editing
  const notesText = document.getElementById('notes-text');
  const notesTextarea = document.getElementById('notes-textarea');
  const editNotesBtn = document.getElementById('edit-notes-btn');

  registerKeyboardFocus(notesTextarea);

  notesText.innerText = state.notes;

  editNotesBtn.addEventListener('click', () => {
    const isEditing = !notesText.classList.contains('hidden');
    if (isEditing) {
      // Switch to textarea
      notesTextarea.value = state.notes;
      notesText.classList.add('hidden');
      notesTextarea.classList.remove('hidden');
      notesTextarea.focus();
      editNotesBtn.innerHTML = `
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#22c55e" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
      `;
    } else {
      // Save notes
      state.notes = notesTextarea.value;
      notesText.innerText = state.notes;
      notesText.classList.remove('hidden');
      notesTextarea.classList.add('hidden');
      notesTextarea.blur();
      editNotesBtn.innerHTML = `
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>
      `;
      saveState();
    }
  });

  // Summary editing
  const summaryText = document.getElementById('summary-text');
  const summaryTextarea = document.getElementById('summary-textarea');
  const editSummaryBtn = document.getElementById('edit-summary-btn');

  registerKeyboardFocus(summaryTextarea);

  summaryText.innerText = state.summary;

  editSummaryBtn.addEventListener('click', () => {
    const isEditing = !summaryText.classList.contains('hidden');
    if (isEditing) {
      summaryTextarea.value = state.summary;
      summaryText.classList.add('hidden');
      summaryTextarea.classList.remove('hidden');
      summaryTextarea.focus();
      editSummaryBtn.innerHTML = `
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#22c55e" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
      `;
    } else {
      state.summary = summaryTextarea.value;
      summaryText.innerText = state.summary;
      summaryText.classList.remove('hidden');
      summaryTextarea.classList.add('hidden');
      summaryTextarea.blur();
      editSummaryBtn.innerHTML = `
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>
      `;
      saveState();
    }
  });

  // Wins and Challenges addition
  const addWinBtn = document.getElementById('add-win-btn');
  const addChallengeBtn = document.getElementById('add-challenge-btn');
  const bulletForm = document.getElementById('bullet-form');
  const bulletInput = document.getElementById('bullet-input');
  const saveBulletBtn = document.getElementById('save-bullet');
  const cancelBulletBtn = document.getElementById('cancel-bullet');

  registerKeyboardFocus(bulletInput);

  let bulletTarget = 'wins'; // or 'challenges'

  addWinBtn.addEventListener('click', () => {
    bulletTarget = 'wins';
    bulletForm.classList.remove('hidden');
    bulletInput.placeholder = "Add a new Win/Achievement...";
    bulletInput.focus();
  });

  addChallengeBtn.addEventListener('click', () => {
    bulletTarget = 'challenges';
    bulletForm.classList.remove('hidden');
    bulletInput.placeholder = "Add a new Challenge/Obstacle...";
    bulletInput.focus();
  });

  function closeBulletForm() {
    bulletForm.classList.add('hidden');
    bulletInput.value = '';
    bulletInput.blur();
  }

  saveBulletBtn.addEventListener('click', () => {
    const text = bulletInput.value.trim();
    if (text) {
      if (bulletTarget === 'wins') {
        state.wins.push(text);
      } else {
        state.challenges.push(text);
      }
      renderBullets();
      saveState();
      closeBulletForm();
    }
  });

  cancelBulletBtn.addEventListener('click', closeBulletForm);
}

// ==========================================
// VIRTUAL DESKTOP ICONS LOGIC
// ==========================================
function setupDesktopIcons() {
  const icons = document.querySelectorAll('.desktop-icon');

  // Clear selection when clicking empty space
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.desktop-icon')) {
      icons.forEach(i => i.classList.remove('selected'));
    }
  });

  icons.forEach(icon => {
    icon.addEventListener('mouseenter', () => {
      if (window.electronAPI) window.electronAPI.setIgnoreMouseEvents(false);
    });
    icon.addEventListener('mouseleave', () => {
      if (!icon.classList.contains('selected')) {
        if (window.electronAPI) window.electronAPI.setIgnoreMouseEvents(true, { forward: true });
      }
    });

    // Single click: select
    icon.addEventListener('click', (e) => {
      e.stopPropagation();
      icons.forEach(i => i.classList.remove('selected'));
      icon.classList.add('selected');
      if (window.electronAPI) window.electronAPI.setIgnoreMouseEvents(false);
    });

    // Double click: open folder or focus UI element
    icon.addEventListener('dblclick', () => {
      const path = icon.getAttribute('data-path');
      const folder = icon.getAttribute('data-folder');

      if (path) {
        if (window.electronAPI) window.electronAPI.openPath(path);
      } else if (folder === 'notes') {
        const notesSection = document.querySelector('.notes-section');
        notesSection.style.transform = 'scale(1.02)';
        notesSection.style.boxShadow = '0 0 15px rgba(96, 165, 250, 0.3)';
        setTimeout(() => {
          notesSection.style.transform = 'scale(1)';
          notesSection.style.boxShadow = 'none';
        }, 500);

        // Auto trigger notes edit
        const editNotesBtn = document.getElementById('edit-notes-btn');
        const notesText = document.getElementById('notes-text');
        if (!notesText.classList.contains('hidden')) {
          editNotesBtn.click();
        }
      }
    });

    icon.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        icon.dispatchEvent(new Event('dblclick'));
      }
    });
  });
}

// ==========================================
// APPLICATION INITIALIZATION
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
  // Load State
  loadState();

  // Initialize renders
  renderCalendar();
  renderWeeklyHeatmap();
  renderSparkline();
  renderTasksList();
  renderBullets();

  // Event handlers
  setupEventHandlers();

  // Setup desktop icons
  setupDesktopIcons();

  // Calculate and animate stats
  updateCalculatedStats();

  // Setup Mouse Toggling Interaction last so it captures all dynamically rendered panels
  setupMouseInteraction();
});
