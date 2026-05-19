// ======================================================
// WebTODO - popup.js
// ======================================================

// -----------------------------
// DOM
// -----------------------------
const todoInput = document.getElementById("todo-input");
const addBtn = document.getElementById("add-btn");

const todoList = document.getElementById("todo-list");
const highlightList = document.getElementById("highlight-list");

const todoCount = document.getElementById("todo-count");
const highlightCount = document.getElementById("highlight-count");

const todoEmpty = document.getElementById("todo-empty");
const highlightEmpty = document.getElementById("highlight-empty");

const searchInput = document.getElementById("search-input");

const tabButtons = document.querySelectorAll(".tab-btn");
const sections = document.querySelectorAll(".content-section");

const clearAllBtn = document.getElementById("clear-all-btn");
const exportCsvBtn = document.getElementById("export-csv-btn");

const toast = document.getElementById("popup-toast");

const themeToggleBtn = document.getElementById("theme-toggle-btn");

const liveClock = document.getElementById("live-clock");

// -----------------------------
// STORAGE KEY
// -----------------------------
const TODO_KEY = "webtodo_todos";
const HIGHLIGHT_KEY = "webtodo_highlights";
const THEME_KEY = "webtodo_theme";

// -----------------------------
// STATE
// -----------------------------
let todos = JSON.parse(localStorage.getItem(TODO_KEY)) || [];
let highlights = JSON.parse(localStorage.getItem(HIGHLIGHT_KEY)) || [];

// -----------------------------
// INIT
// -----------------------------
document.addEventListener("DOMContentLoaded", () => {
  renderTodos();
  renderHighlights();
  updateStats();
  initClock();
  loadTheme();
});

// ======================================================
// TODO
// ======================================================
function saveTodos() {
  localStorage.setItem(TODO_KEY, JSON.stringify(todos));
}

function renderTodos(filter = "") {
  todoList.innerHTML = "";
  const filtered = todos.filter(todo => todo.text.toLowerCase().includes(filter.toLowerCase()));
  todoEmpty.style.display = filtered.length === 0 ? "block" : "none";

  filtered.forEach(todo => {
    const li = document.createElement("li");
    li.className = "todo-item";
    li.innerHTML = `
      <div class="todo-left">
        <input type="checkbox" ${todo.completed ? "checked" : ""} data-id="${todo.id}" class="todo-check">
        <span class="todo-text ${todo.completed ? "completed" : ""}">${escapeHtml(todo.text)}</span>
      </div>
      <button class="delete-btn" data-id="${todo.id}">❌</button>
    `;
    todoList.appendChild(li);
  });
}

function addTodo() {
  const text = todoInput.value.trim();
  if (!text) return showToast("내용을 입력해주세요.");
  todos.unshift({ id: Date.now(), text, completed: false, createdAt: new Date().toISOString() });
  saveTodos();
  renderTodos(searchInput.value);
  updateStats();
  todoInput.value = "";
  showToast("TODO 추가 완료!");
}

addBtn.addEventListener("click", addTodo);
todoInput.addEventListener("keypress", e => e.key === "Enter" && addTodo());

todoList.addEventListener("click", e => {
  const id = Number(e.target.dataset.id);
  if (e.target.classList.contains("delete-btn")) {
    todos = todos.filter(todo => todo.id !== id);
    saveTodos();
    renderTodos(searchInput.value);
    updateStats();
    showToast("삭제 완료");
  }
  if (e.target.classList.contains("todo-check")) {
    todos = todos.map(todo => todo.id === id ? { ...todo, completed: !todo.completed } : todo);
    saveTodos();
    renderTodos(searchInput.value);
    updateStats();
  }
});

// ======================================================
// Highlight
// ======================================================
function saveHighlights() {
  localStorage.setItem(HIGHLIGHT_KEY, JSON.stringify(highlights));
}

function renderHighlights(filter = "") {
  highlightList.innerHTML = "";
  const filtered = highlights.filter(item => item.text.toLowerCase().includes(filter.toLowerCase()));
  highlightEmpty.style.display = filtered.length === 0 ? "block" : "none";

  filtered.forEach(item => {
    const li = document.createElement("li");
    li.className = "highlight-item";
    li.innerHTML = `
      <div class="highlight-content">✨ ${escapeHtml(item.text)}</div>
      <button class="delete-btn" data-id="${item.id}">❌</button>
    `;
    highlightList.appendChild(li);
  });
}

function addHighlight() {
  const text = prompt("새로운 Highlight 입력:");
  if (!text) return showToast("내용을 입력해주세요.");
  highlights.unshift({ id: Date.now(), text });
  saveHighlights();
  renderHighlights(searchInput.value);
  updateStats();
  showToast("Highlight 추가 완료!");
}

highlightList.addEventListener("click", e => {
  const id = Number(e.target.dataset.id);
  if (e.target.classList.contains("delete-btn")) {
    highlights = highlights.filter(item => item.id !== id);
    saveHighlights();
    renderHighlights(searchInput.value);
    updateStats();
    showToast("삭제 완료");
  }
});

// ======================================================
// 통계 & 검색
// ======================================================
function updateStats() {
  todoCount.textContent = todos.length;
  highlightCount.textContent = highlights.length;
}

searchInput.addEventListener("input", () => {
  const query = searchInput.value;
  renderTodos(query);
  renderHighlights(query);
});

// ======================================================
// 탭
// ======================================================
tabButtons.forEach(btn => {
  btn.addEventListener("click", () => {
    tabButtons.forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    sections.forEach(sec => sec.classList.remove("active"));
    document.getElementById(btn.dataset.tab + "-section").classList.add("active");
  });
});

// ======================================================
// 전체 삭제
// ======================================================
clearAllBtn.addEventListener("click", () => {
  if (confirm("정말 모든 데이터를 삭제하시겠습니까?")) {
    todos = [];
    highlights = [];
    saveTodos();
    saveHighlights();
    renderTodos();
    renderHighlights();
    updateStats();
    showToast("모든 데이터 삭제 완료!");
  }
});

// ======================================================
// CSV 내보내기
// ======================================================
exportCsvBtn.addEventListener("click", () => {
  let csv = "Type,Content,Completed,CreatedAt\n";
  todos.forEach(t => csv += `TODO,${t.text},${t.completed},${t.createdAt}\n`);
  highlights.forEach(h => csv += `Highlight,${h.text},,\n`);
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "webtodo.csv";
  a.click();
  URL.revokeObjectURL(url);
  showToast("CSV 내보내기 완료!");
});

// ======================================================
// 토스트
// ======================================================
function showToast(msg) {
  toast.textContent = msg;
  toast.classList.add("show");
  setTimeout(() => toast.classList.remove("show"), 2000);
}

// ======================================================
// 테마
// ======================================================
themeToggleBtn.addEventListener("click", () => {
  document.body.classList.toggle("dark");
  const theme = document.body.classList.contains("dark") ? "dark" : "light";
  localStorage.setItem(THEME_KEY, theme);
});

function loadTheme() {
  const theme = localStorage.getItem(THEME_KEY) || "light";
  if (theme === "dark") document.body.classList.add("dark");
}

// ======================================================
// 시계
// ======================================================
function initClock() {
  function updateClock() {
    const now = new Date();
    liveClock.textContent = now.toLocaleTimeString();
  }
  updateClock();
  setInterval(updateClock, 1000);
}

// ======================================================
// HTML escape
// ======================================================
function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}