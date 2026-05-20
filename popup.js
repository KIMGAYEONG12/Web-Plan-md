/**
 * ======================================================
 * WebToDo popup.js
 * FINAL STABLE FULL VERSION
 * ======================================================
 */

document.addEventListener("DOMContentLoaded", () => {
  // ======================================================
  // STORAGE SAFE
  // ======================================================

  const storage = chrome?.storage?.local ? chrome.storage.local : null;

  if (!storage) {
    console.error("❌ storage unavailable");
    return;
  }

  // ======================================================
  // DOM
  // ======================================================

  const todoList = document.getElementById("todo-list");
  const highlightList = document.getElementById("highlight-list");

  const todoCount = document.getElementById("todo-count");
  const highlightCount = document.getElementById("highlight-count");

  const themeBtn = document.getElementById("theme-toggle-btn");

  const searchInput = document.getElementById("search-input");

  const clock = document.getElementById("live-clock");

  const sidePanelBtn = document.getElementById("open-sidepanel-btn");

  const clearAllBtn = document.getElementById("clear-all-btn");

  const exportBtn = document.getElementById("export-csv-btn");

  const toast = document.getElementById("popup-toast");

  const todoInput = document.getElementById("todo-input");

  const highlightInput = document.getElementById("highlight-input");

  const addBtn = document.getElementById("add-btn");

  const highlightAddBtn = document.getElementById("highlight-add-btn");

  const todoEmpty = document.getElementById("todo-empty");

  const highlightEmpty = document.getElementById("highlight-empty");

  // ======================================================
  // HTML ESCAPE (XSS 방어)
  // ======================================================

  function escapeHTML(str = "") {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  // ======================================================
  // TOAST
  // ======================================================

  let toastTimer = null;

  function showToast(message = "") {
    if (!toast) return;

    clearTimeout(toastTimer);

    toast.textContent = message;

    toast.classList.add("show");

    toastTimer = setTimeout(() => {
      toast.classList.remove("show");
    }, 2200);
  }

  // ======================================================
  // 한국 시간
  // ======================================================

  function getKoreanDateTime() {
    return new Intl.DateTimeFormat("ko-KR", {
      timeZone: "Asia/Seoul",

      year: "numeric",

      month: "2-digit",

      day: "2-digit",

      hour: "2-digit",

      minute: "2-digit",

      second: "2-digit",

      hour12: false,
    }).format(new Date());
  }

  // ======================================================
  // CLOCK
  // ======================================================

  function updateClock() {
    if (!clock) return;

    clock.textContent = new Date().toLocaleTimeString("ko-KR", {
      timeZone: "Asia/Seoul",

      hour12: false,
    });
  }

  updateClock();

  setInterval(updateClock, 1000);

  // ======================================================
  // THEME
  // ======================================================

  function applyTheme(theme) {
    document.documentElement.setAttribute("data-theme", theme);

    localStorage.setItem("theme", theme);
  }

  const savedTheme = localStorage.getItem("theme") || "light";

  applyTheme(savedTheme);

  if (themeBtn) {
    themeBtn.addEventListener("click", () => {
      const current = document.documentElement.getAttribute("data-theme");

      const next = current === "dark" ? "light" : "dark";

      applyTheme(next);

      showToast(next === "dark" ? "🌙 다크모드" : "☀️ 라이트모드");
    });
  }

  // ======================================================
  // SIDE PANEL
  // ======================================================

  if (sidePanelBtn && chrome.sidePanel && chrome.tabs) {
    sidePanelBtn.addEventListener("click", async () => {
      try {
        const tabs = await chrome.tabs.query({
          active: true,

          currentWindow: true,
        });

        if (!tabs?.length) {
          return;
        }

        await chrome.sidePanel.open({
          tabId: tabs[0].id,
        });
      } catch (error) {
        console.error(error);

        showToast("사이드패널 오류");
      }
    });
  }

  // ======================================================
  // CSV EXPORT
  // ======================================================

  if (exportBtn) {
    exportBtn.addEventListener("click", async () => {
      try {
        const data = await storage.get(["todoList", "highlightList"]);

        const todos = Array.isArray(data.todoList) ? data.todoList : [];

        const highlights = Array.isArray(data.highlightList)
          ? data.highlightList
          : [];

        let csv = "TYPE,TEXT,DATE,COMPLETED,SUMMARY\n";

        todos.forEach((item) => {
          csv += `"TODO","${String(item.text || "").replace(
            /"/g,
            '""',
          )}","${String(item.koreanDate || "").replace(/"/g, '""')}","${Boolean(
            item.completed,
          )}","${String(item.summary || "").replace(/"/g, '""')}"\n`;
        });

        highlights.forEach((item) => {
          csv += `"HIGHLIGHT","${String(item.text || "").replace(
            /"/g,
            '""',
          )}","${String(item.koreanDate || "").replace(
            /"/g,
            '""',
          )}","","${String(item.summary || "").replace(/"/g, '""')}"\n`;
        });

        const blob = new Blob([csv], {
          type: "text/csv;charset=utf-8;",
        });

        const url = URL.createObjectURL(blob);

        const a = document.createElement("a");

        a.href = url;

        a.download = `webtodo-${Date.now()}.csv`;

        document.body.appendChild(a);

        a.click();

        document.body.removeChild(a);

        URL.revokeObjectURL(url);

        showToast("CSV 다운로드 완료 💾");
      } catch (error) {
        console.error(error);

        showToast("CSV 다운로드 실패");
      }
    });
  }

  // ======================================================
  // 전체 삭제
  // ======================================================

  if (clearAllBtn) {
    clearAllBtn.addEventListener("click", async () => {
      const ok = confirm("정말 전체 삭제하시겠습니까?");

      if (!ok) return;

      try {
        await storage.set({
          todoList: [],

          highlightList: [],
        });

        chrome.runtime.sendMessage({
          action: "UPDATE_BADGE",
        });

        showToast("전체 삭제 완료 🧹");

        await loadData();
      } catch (error) {
        console.error(error);

        showToast("전체 삭제 실패");
      }
    });
  }

  // ======================================================
  // TAB
  // ======================================================

  document.querySelectorAll(".tab-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const target = btn.getAttribute("data-tab");

      document.querySelectorAll(".tab-btn").forEach((b) => {
        b.classList.remove("active");
      });

      document.querySelectorAll(".content-section").forEach((section) => {
        section.classList.remove("active");
      });

      document.querySelectorAll(".input-area").forEach((area) => {
        area.classList.remove("active");
      });

      btn.classList.add("active");

      document.getElementById(`${target}-section`)?.classList.add("active");

      document.getElementById(`${target}-input-area`)?.classList.add("active");
    });
  });

  // ======================================================
  // AI 3줄 요약 생성
  // ======================================================

  function generateSummary(text = "") {
    const cleaned = text.replace(/\s+/g, " ").trim();

    if (!cleaned) {
      return "";
    }

    if (cleaned.length <= 90) {
      return cleaned;
    }

    const sentences = cleaned
      .split(/[.!?。！？]/)
      .filter(Boolean)
      .slice(0, 3);

    return sentences.join(" • ").slice(0, 160);
  }

  // ======================================================
  // ADD ITEM
  // ======================================================

  async function addItem(type) {
    try {
      const input = type === "todo" ? todoInput : highlightInput;

      if (!input) return;

      const text = input.value.trim();

      if (!text) {
        showToast("내용 입력 필요");

        return;
      }

      const key = type === "todo" ? "todoList" : "highlightList";

      const data = await storage.get(key);

      const list = Array.isArray(data[key]) ? data[key] : [];

      list.unshift({
        id: crypto?.randomUUID?.() || `${Date.now()}_${Math.random()}`,

        text,

        summary: generateSummary(text),

        completed: false,

        koreanDate: getKoreanDateTime(),

        createdAt: Date.now(),
      });

      await storage.set({
        [key]: list,
      });

      chrome.runtime.sendMessage({
        action: "UPDATE_BADGE",
      });

      input.value = "";

      showToast(
        type === "todo" ? "✅ TODO 저장 완료" : "✨ Highlight 저장 완료",
      );

      await loadData();
    } catch (error) {
      console.error(error);

      showToast("저장 오류");
    }
  }

  // ======================================================
  // TODO TOGGLE
  // ======================================================

  async function toggleTodo(id) {
    try {
      const data = await storage.get("todoList");

      const todos = Array.isArray(data.todoList) ? data.todoList : [];

      const updated = todos.map((item) => {
        if (item.id === id) {
          return {
            ...item,

            completed: !item.completed,
          };
        }

        return item;
      });

      await storage.set({
        todoList: updated,
      });

      chrome.runtime.sendMessage({
        action: "UPDATE_BADGE",
      });

      await loadData();
    } catch (error) {
      console.error(error);

      showToast("체크 오류");
    }
  }

  // ======================================================
  // DELETE
  // ======================================================

  async function deleteItem(id, type) {
    try {
      const key = type === "todo" ? "todoList" : "highlightList";

      const data = await storage.get(key);

      const updated = (Array.isArray(data[key]) ? data[key] : []).filter(
        (item) => item.id !== id,
      );

      await storage.set({
        [key]: updated,
      });

      chrome.runtime.sendMessage({
        action: "UPDATE_BADGE",
      });

      showToast("삭제 완료 ❌");

      await loadData();
    } catch (error) {
      console.error(error);

      showToast("삭제 오류");
    }
  }

  // ======================================================
  // EMPTY STATE
  // ======================================================

  function updateEmptyState(todos, highlights) {
    if (todoEmpty) {
      todoEmpty.classList.toggle("hidden", todos.length > 0);
    }

    if (highlightEmpty) {
      highlightEmpty.classList.toggle("hidden", highlights.length > 0);
    }
  }

  // ======================================================
  // RENDER
  // ======================================================

  function render(items, container, type) {
    if (!container) return;

    container.innerHTML = "";

    const keyword = (searchInput?.value || "").toLowerCase();

    const filtered = items.filter((item) =>
      String(item.text || "")
        .toLowerCase()
        .includes(keyword),
    );

    filtered.forEach((item) => {
      const li = document.createElement("li");

      if (type === "highlight") {
        li.classList.add("highlight-item");
      }

      const textClass = type === "highlight" ? "highlight-text" : "";

      li.innerHTML = `
        <div class="item-row">

          ${
            type === "todo"
              ? `
                <input
                  type="checkbox"
                  class="todo-check"
                  ${item.completed ? "checked" : ""}
                />
              `
              : ""
          }

          <span
            class="${textClass}"
            style="
              text-decoration:
                ${item.completed ? "line-through" : "none"};

              opacity:
                ${item.completed ? "0.5" : "1"};
            "
          >
            ${escapeHTML(item.text)}
          </span>

          <button class="delete-btn">
            ❌
          </button>

        </div>

        <div class="item-date">
          📅 ${escapeHTML(item.koreanDate || "")}
        </div>

        ${
          item.summary
            ? `
              <div class="ai-summary">
                🤖 ${escapeHTML(item.summary)}
              </div>
            `
            : ""
        }
      `;

      const deleteBtn = li.querySelector(".delete-btn");

      if (deleteBtn) {
        deleteBtn.addEventListener("click", () => deleteItem(item.id, type));
      }

      const checkbox = li.querySelector(".todo-check");

      if (checkbox) {
        checkbox.addEventListener("change", () => toggleTodo(item.id));
      }

      container.appendChild(li);
    });
  }

  // ======================================================
  // LOAD DATA
  // ======================================================

  async function loadData() {
    try {
      const data = await storage.get(["todoList", "highlightList"]);

      const todos = Array.isArray(data.todoList) ? data.todoList : [];

      const highlights = Array.isArray(data.highlightList)
        ? data.highlightList
        : [];

      render(todos, todoList, "todo");

      render(highlights, highlightList, "highlight");

      if (todoCount) {
        todoCount.textContent = String(todos.length);
      }

      if (highlightCount) {
        highlightCount.textContent = String(highlights.length);
      }

      updateEmptyState(todos, highlights);
    } catch (error) {
      console.error(error);

      showToast("불러오기 오류");
    }
  }

  // ======================================================
  // STORAGE 실시간 감지
  // popup 자동 갱신
  // ======================================================

  chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName !== "local") {
      return;
    }

    if (changes.todoList || changes.highlightList) {
      loadData();
    }
  });

  // ======================================================
  // BACKGROUND REFRESH
  // ======================================================

  chrome.runtime.onMessage.addListener((request) => {
    if (request.action === "REFRESH_TODO_LIST") {
      loadData();
    }
  });

  // ======================================================
  // EVENTS
  // ======================================================

  if (addBtn) {
    addBtn.addEventListener("click", () => addItem("todo"));
  }

  if (highlightAddBtn) {
    highlightAddBtn.addEventListener("click", () => addItem("highlight"));
  }

  [todoInput, highlightInput].filter(Boolean).forEach((input) => {
    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        addItem(input.id === "todo-input" ? "todo" : "highlight");
      }
    });
  });

  if (searchInput) {
    searchInput.addEventListener("input", loadData);
  }

  // ======================================================
  // START
  // ======================================================

  loadData();
});
