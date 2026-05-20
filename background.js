// ======================================================
// WebToDo Background Service Worker
// FINAL STABLE VERSION
// Manifest V3
// ======================================================

console.log("✅ WebToDo background.js 실행됨");

// ======================================================
// 상수
// ======================================================

const MENU_ID = "add_todo_item";

// ======================================================
// 한국 시간 생성
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
// Badge 업데이트
// ======================================================

async function updateBadge() {
  try {
    const result = await chrome.storage.local.get({
      todoList: [],
    });

    const todos = Array.isArray(result.todoList) ? result.todoList : [];

    const incompleteCount = todos.filter((todo) => !todo.completed).length;

    await chrome.action.setBadgeBackgroundColor({
      color: "#0ea5e9",
    });

    // 일부 브라우저에서 미지원일 수 있음
    if (chrome.action.setBadgeTextColor) {
      await chrome.action.setBadgeTextColor({
        color: "#ffffff",
      });
    }

    await chrome.action.setBadgeText({
      text: incompleteCount > 0 ? String(incompleteCount) : "",
    });

    console.log(`✅ Badge 업데이트: ${incompleteCount}`);
  } catch (error) {
    console.error("❌ Badge 업데이트 오류:", error);
  }
}

// ======================================================
// AI 요약
// ======================================================

async function summarizeText(text) {
  try {
    if (!text || text.length < 20) {
      return "";
    }

    // API KEY 미설정시 스킵
    const API_KEY = "hf_YOUR_REAL_API_KEY";

    if (!API_KEY || API_KEY.includes("YOUR_REAL_API_KEY")) {
      console.log("ℹ️ HuggingFace API Key 미설정");

      return "";
    }

    const controller = new AbortController();

    const timeout = setTimeout(() => {
      controller.abort();
    }, 15000);

    const response = await fetch(
      "https://api-inference.huggingface.co/models/facebook/bart-large-cnn",
      {
        method: "POST",

        signal: controller.signal,

        headers: {
          "Content-Type": "application/json",

          Authorization: `Bearer ${API_KEY}`,
        },

        body: JSON.stringify({
          inputs: text,
        }),
      },
    );

    clearTimeout(timeout);

    if (!response.ok) {
      console.error("❌ AI 응답 실패:", response.status);

      return "";
    }

    const result = await response.json();

    if (Array.isArray(result) && result[0]?.summary_text) {
      return result[0].summary_text;
    }

    return "";
  } catch (error) {
    console.error("❌ AI 요약 오류:", error);

    return "";
  }
}

// ======================================================
// 설치/업데이트
// ======================================================

chrome.runtime.onInstalled.addListener(async () => {
  console.log("🔄 확장 프로그램 설치 또는 업데이트");

  createContextMenu();

  await updateBadge();

  // ================================================
  // Side Panel 설정
  // ================================================

  if (chrome.sidePanel) {
    try {
      await chrome.sidePanel.setPanelBehavior({
        openPanelOnActionClick: true,
      });

      console.log("✅ Side Panel 설정 완료");
    } catch (error) {
      console.error("❌ Side Panel 오류:", error);
    }
  }
});

// ======================================================
// 브라우저 시작
// ======================================================

chrome.runtime.onStartup.addListener(async () => {
  console.log("🚀 WebToDo 시작됨");

  createContextMenu();

  await updateBadge();
});

// ======================================================
// Storage 변경 감지 → Badge 자동 업데이트
// ======================================================

chrome.storage.onChanged.addListener(async (changes, areaName) => {
  try {
    if (areaName === "local" && changes.todoList) {
      await updateBadge();
    }
  } catch (error) {
    console.error("❌ storage.onChanged 오류:", error);
  }
});

// ======================================================
// Context Menu 생성
// ======================================================

function createContextMenu() {
  chrome.contextMenus.removeAll(() => {
    if (chrome.runtime.lastError) {
      console.error("❌ removeAll 오류:", chrome.runtime.lastError.message);
    }

    chrome.contextMenus.create(
      {
        id: MENU_ID,

        title: "📌 WebToDo 저장",

        contexts: ["selection"],
      },
      () => {
        if (chrome.runtime.lastError) {
          console.error(
            "❌ contextMenus.create 오류:",
            chrome.runtime.lastError.message,
          );

          return;
        }

        console.log("✅ Context Menu 생성 완료");
      },
    );
  });
}

// ======================================================
// Context Menu 클릭
// ======================================================

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  try {
    // ================================================
    // 메뉴 확인
    // ================================================

    if (info.menuItemId !== MENU_ID) {
      return;
    }

    // ================================================
    // 탭 체크
    // ================================================

    if (!tab?.id || !tab?.url) {
      console.log("ℹ️ 유효하지 않은 탭");

      return;
    }

    // ================================================
    // 내부 페이지 제외
    // ================================================

    if (
      tab.url.startsWith("chrome://") ||
      tab.url.startsWith("edge://") ||
      tab.url.startsWith("about:")
    ) {
      console.log("ℹ️ 브라우저 내부 페이지 제외");

      return;
    }

    // ==================================================
    // TODO 텍스트 생성
    // ==================================================

    let todoText = "새 TODO";

    if (info.selectionText?.trim()) {
      todoText = info.selectionText.trim();

      // 길이 제한
      if (todoText.length > 200) {
        todoText = `${todoText.substring(0, 200)}...`;
      }
    } else if (tab.title) {
      todoText = tab.title;
    }

    // ================================================
    // AI 요약
    // ================================================

    const summary = await summarizeText(todoText);

    // ================================================
    // 기존 데이터
    // ================================================

    const storageData = await chrome.storage.local.get({
      todoList: [],
      highlightList: [],
    });

    const todoList = Array.isArray(storageData.todoList)
      ? storageData.todoList
      : [];

    const highlightList = Array.isArray(storageData.highlightList)
      ? storageData.highlightList
      : [];

    // ==================================================
    // ID 생성
    // ==================================================

    const id = `${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    const koreanDate = getKoreanDateTime();

    // ==================================================
    // TODO 데이터
    // ==================================================

    const newTodo = {
      id,

      text: todoText,

      summary,

      completed: false,

      url: info.pageUrl || tab.url,

      title: tab.title || "",

      koreanDate,

      createdAt: new Date().toISOString(),
    };

    // ==================================================
    // Highlight 데이터
    // ==================================================

    const newHighlight = {
      id,

      text: todoText,

      summary,

      url: info.pageUrl || tab.url,

      title: tab.title || "",

      koreanDate,

      createdAt: new Date().toISOString(),
    };

    // ================================================
    // 저장
    // ================================================

    todoList.unshift(newTodo);

    highlightList.unshift(newHighlight);

    // ==================================================
    // Storage 저장
    // ==================================================

    await chrome.storage.local.set({
      todoList,

      highlightList,
    });

    console.log("✅ TODO + Highlight 저장 완료");

    // ================================================
    // Badge 즉시 업데이트
    // ================================================

    await updateBadge();

    // ==================================================
    // Popup 새로고침 요청
    // ==================================================

    chrome.runtime.sendMessage(
      {
        action: "REFRESH_TODO_LIST",
      },
      () => {
        if (chrome.runtime.lastError) {
          console.log("ℹ️ popup 미실행 상태");
        }
      },
    );

    // ==================================================
    // content.js 메시지 전송
    // ==================================================

    chrome.tabs.sendMessage(
      tab.id,
      {
        action: "HIGHLIGHT_SELECTION",
      },
      () => {
        if (chrome.runtime.lastError) {
          console.log(
            "ℹ️ HIGHLIGHT_SELECTION 실패:",
            chrome.runtime.lastError.message,
          );
        }
      },
    );

    // ================================================
    // 토스트
    // ================================================

    chrome.tabs.sendMessage(
      tab.id,
      {
        action: "SHOW_NOTIFICATION",

        message: "✅ WebToDo 저장 완료",
      },
      () => {
        if (chrome.runtime.lastError) {
          console.log(
            "ℹ️ SHOW_NOTIFICATION 실패:",
            chrome.runtime.lastError.message,
          );
        }
      },
    );
  } catch (error) {
    console.error("❌ background.js 오류:", error);
  }
});

// ======================================================
// 메시지 수신
// ======================================================

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  (async () => {
    try {
      // ==============================================
      // Ping
      // ==============================================

      if (request.action === "PING") {
        sendResponse({
          success: true,

          message: "background alive",
        });

        return;
      }

      // ==============================================
      // Badge 강제 업데이트
      // ==============================================

      if (request.action === "UPDATE_BADGE") {
        await updateBadge();

        sendResponse({
          success: true,
        });

        return;
      }

      // ==============================================
      // Context Menu 재생성
      // ==============================================

      if (request.action === "RECREATE_CONTEXT_MENU") {
        createContextMenu();

        sendResponse({
          success: true,
        });

        return;
      }

      sendResponse({
        success: true,
      });
    } catch (error) {
      console.error("❌ onMessage 오류:", error);

      sendResponse({
        success: false,

        error: error.message,
      });
    }
  })();

  return true;
});
