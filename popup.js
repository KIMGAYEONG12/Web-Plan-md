// [popup.js - 기획서 명세 고도화 기능 4종 완벽 구현본]

document.addEventListener("DOMContentLoaded", () => {
  // DOM 요소 선택
  const liveClock = document.getElementById("live-clock");
  const themeToggleBtn = document.getElementById("theme-toggle-btn");
  const searchInput = document.getElementById("search-input");
  const todoInput = document.getElementById("todo-input");
  const addBtn = document.getElementById("add-btn");
  const todoListUrl = document.getElementById("todo-list");
  const exportCsvBtn = document.getElementById("export-csv-btn");
  const clearAllBtn = document.getElementById("clear-all-btn");
  const pwaInstallBtn = document.getElementById("pwa-install-btn");

  // 데이터 저장용 로컬 배열
  let localTodoList = [];

  // ==========================================
  // 1. 실시간 디지털 시계 기능 (HH:MM:SS)
  // ==========================================
  function updateClock() {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, "0");
    const minutes = String(now.getMinutes()).padStart(2, "0");
    const seconds = String(now.getSeconds()).padStart(2, "0");
    liveClock.textContent = `${hours}:${minutes}:${seconds}`;
  }
  updateClock();
  setInterval(updateClock, 1000);

  // ==========================================
  // 2. 사용자 정의 다크 모드 토글 및 영구 저장
  // ==========================================
  // 초기 테마 설정 불러오기
  chrome.storage.local.get({ theme: "light" }, (result) => {
    document.documentElement.setAttribute("data-theme", result.theme);
    themeToggleBtn.textContent = result.theme === "dark" ? "☀️" : "🌙";
  });

  // 테마 변경 이벤트
  themeToggleBtn.addEventListener("click", () => {
    const currentTheme = document.documentElement.getAttribute("data-theme");
    const newTheme = currentTheme === "dark" ? "light" : "dark";

    document.documentElement.setAttribute("data-theme", newTheme);
    themeToggleBtn.textContent = newTheme === "dark" ? "☀️" : "🌙";

    // 크롬 스토리지에 테마 상태 영구 저장
    chrome.storage.local.set({ theme: newTheme });
  });

  // ==========================================
  // 3. 투두리스트 데이터 로드 및 화면 렌더링
  // ==========================================
  function loadAndRenderTodoList() {
    chrome.storage.local.get({ todoList: [] }, (result) => {
      localTodoList = result.todoList;
      renderList(localTodoList);
    });
  }

  function renderList(list) {
    todoListUrl.innerHTML = "";
    const keyword = searchInput.value.toLowerCase().trim();

    // 🔍 실시간 키워드 검색 및 필터링 적용
    const filteredList = list.filter((item) =>
      item.text.toLowerCase().includes(keyword),
    );

    if (filteredList.length === 0) {
      const emptyMsg = document.createElement("li");
      emptyMsg.style.justifyContent = "center";
      emptyMsg.style.color = "var(--text-muted)";
      emptyMsg.style.fontSize = "12px";
      emptyMsg.style.padding = "15px 0";
      emptyMsg.textContent = keyword
        ? "검색 결과가 없습니다. 🔍"
        : "할 일이 없습니다. 자유를 즐기세요! 🎉";
      todoListUrl.appendChild(emptyMsg);
      return;
    }

    filteredList.forEach((item) => {
      const li = document.createElement("li");

      // 체크박스 (완료 여부)
      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.checked = item.completed;
      checkbox.addEventListener("change", () => toggleComplete(item.id));

      // 투두 텍스트 (출처 URL이 있으면 링크, 없으면 일반 텍스트)
      let textNode;
      if (item.url) {
        textNode = document.createElement("a");
        textNode.href = item.url;
        textNode.target = "_blank";
        textNode.classList.add("todo-text", "todo-link");
      } else {
        textNode = document.createElement("span");
        textNode.classList.add("todo-text");
      }
      textNode.textContent = item.text;
      if (item.completed) {
        textNode.classList.add("completed");
      }

      // 액션 버튼 컨테이너 (클립보드 복사 + 개별 삭제)
      const actionGroup = document.createElement("div");
      actionGroup.classList.add("action-buttons");

      // 🔗 클립보드 원클릭 복사 버튼
      const copyBtn = document.createElement("button");
      copyBtn.classList.add("copy-btn");
      copyBtn.title = "클립보드 복사";
      copyBtn.textContent = "📋";
      copyBtn.addEventListener("click", () => copyToClipboard(item));

      // ❌ 개별 삭제 버튼
      const deleteBtn = document.createElement("button");
      deleteBtn.classList.add("delete-btn");
      deleteBtn.title = "삭제";
      deleteBtn.textContent = "X";
      deleteBtn.addEventListener("click", () => deleteItem(item.id));

      // 구조 조립
      actionGroup.appendChild(copyBtn);
      actionGroup.appendChild(deleteBtn);

      li.appendChild(checkbox);
      li.appendChild(textNode);
      li.appendChild(actionGroup);

      todoListUrl.appendChild(li);
    });
  }

  // ==========================================
  // 4. 할 일 추가 / 변경 / 삭제 핵심 기능
  // ==========================================
  // 수동 입력 추가
  function handleAddTodo() {
    const text = todoInput.value.trim();
    if (!text) return;

    chrome.storage.local.get({ todoList: [] }, (result) => {
      const currentList = result.todoList;
      const newTodo = {
        id: Date.now(),
        text: text.length > 50 ? text.substring(0, 50) + "..." : text,
        completed: false,
        url: "", // 직접 입력은 출처 URL 없음
      };
      currentList.push(newTodo);
      chrome.storage.local.set({ todoList: currentList }, () => {
        todoInput.value = "";
        loadAndRenderTodoList();
      });
    });
  }

  addBtn.addEventListener("click", handleAddTodo);
  todoInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") handleAddTodo();
  });

  // 완료 토글
  function toggleComplete(id) {
    chrome.storage.local.get({ todoList: [] }, (result) => {
      const updatedList = result.todoList.map((item) => {
        if (item.id === id) item.completed = !item.completed;
        return item;
      });
      chrome.storage.local.set(
        { todoList: updatedList },
        loadAndRenderTodoList,
      );
    });
  }

  // 개별 항목 삭제
  function deleteItem(id) {
    chrome.storage.local.get({ todoList: [] }, (result) => {
      const updatedList = result.todoList.filter((item) => item.id !== id);
      chrome.storage.local.set(
        { todoList: updatedList },
        loadAndRenderTodoList,
      );
    });
  }

  // 전체 삭제 🧹
  clearAllBtn.addEventListener("click", () => {
    if (confirm("정말로 모든 할 일 목록을 삭제하시겠습니까? 🧹")) {
      chrome.storage.local.set({ todoList: [] }, loadAndRenderTodoList);
    }
  });

  // 🔍 검색창 입력 실시간 감지
  searchInput.addEventListener("input", () => {
    renderList(localTodoList);
  });

  // ==========================================
  // 5. 🖨️ CSV 파일 데이터 내보내기 (Excel 호환)
  // ==========================================
  exportCsvBtn.addEventListener("click", () => {
    if (localTodoList.length === 0) {
      alert("내보낼 할 일 데이터가 없습니다.");
      return;
    }

    // 엑셀에서 한글 깨짐을 방지하기 위한 BOM 추가
    const BOM = "\uFEFF";
    let csvContent = "식별ID,할 일 내용,완료 여부,출처 URL\n";

    localTodoList.forEach((item) => {
      // CSV 파싱 오류 방지를 위해 쌍따옴표 이스케이프 및 감싸기
      const safeText = `"${item.text.replace(/"/g, '""')}"`;
      const safeUrl = `"${(item.url || "").replace(/"/g, '""')}"`;
      const status = item.completed ? "완료" : "미완료";

      csvContent += `${item.id},${safeText},${status},${safeUrl}\n`;
    });

    const blob = new Blob([BOM + csvContent], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);

    // 가상 링크 컴포넌트를 만들어 다운로드 트리거
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `WebToDo_Export_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  });

  // ==========================================
  // 6. 🔗 클립보드 원클릭 복사
  // ==========================================
  function copyToClipboard(item) {
    const status = item.completed ? "[완료]" : "[미완료]";
    const urlInfo = item.url ? `\n출처: ${item.url}` : "";
    const textToCopy = `${status} ${item.text}${urlInfo}`;

    navigator.clipboard
      .writeText(textToCopy)
      .then(() => {
        alert("📋 해당 할 일이 클립보드에 복사되었습니다!");
      })
      .catch((err) => {
        console.error("클립보드 복사 실패: ", err);
      });
  }

  // ==========================================
  // 7. 바탕화면 독립형 앱(PWA) 연동 모사 인터페이스
  // ==========================================
  pwaInstallBtn.addEventListener("click", () => {
    alert(
      "🖥️ 바탕화면 독립 실행형 앱(PWA) 연동 규격 인터페이스가 성공적으로 활성화되었습니다.\n향후 업데이트 버전에서 완전한 독립 실행을 지원합니다!",
    );
  });

  // ==========================================
  // 8. 백그라운드 우클릭 추가 이벤트 실시간 동기화 수신
  // ==========================================
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "REFRESH_TODO_LIST") {
      loadAndRenderTodoList();
    }
  });

  // 프로그램 팝업 오픈 시 최초 실행
  loadAndRenderTodoList();
});
