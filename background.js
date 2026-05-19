// ======================================================
// WebToDo Background Service Worker
// Manifest V3
// ======================================================

console.log("✅ WebToDo background.js 실행됨");

// ======================================================
// 상수
// ======================================================

const MENU_ID = "add_todo_item";

// ======================================================
// 설치/업데이트 시 실행
// ======================================================

chrome.runtime.onInstalled.addListener(() => {
  console.log("🔄 확장 프로그램 설치 또는 업데이트");

  createContextMenu();
});

// ======================================================
// 브라우저 시작 시
// ======================================================

chrome.runtime.onStartup.addListener(() => {
  console.log("🚀 WebToDo 시작됨");
});

// ======================================================
// Context Menu 생성
// ======================================================

function createContextMenu() {
  chrome.contextMenus.removeAll(() => {
    if (chrome.runtime.lastError) {
      console.error(
        "❌ contextMenus.removeAll 오류:",
        chrome.runtime.lastError.message,
      );
    }

    chrome.contextMenus.create(
      {
        id: MENU_ID,

        title: "WebToDo 저장",

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
// 우클릭 메뉴 클릭 이벤트
// ======================================================

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  try {
    // ==================================================
    // 메뉴 확인
    // ==================================================

    if (info.menuItemId !== MENU_ID) {
      return;
    }

    console.log("🖱️ TODO 메뉴 클릭");

    // ==================================================
    // 탭 체크
    // ==================================================

    if (!tab?.id || !tab?.url) {
      console.log("ℹ️ 유효하지 않은 탭");

      return;
    }

    // ==================================================
    // 브라우저 내부 페이지 제외
    // ==================================================

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

    // ==================================================
    // Storage 데이터 가져오기
    // ==================================================

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

    const id = `${Date.now()}_${Math.random()
      .toString(36)
      .substring(2, 9)}`;

    // ==================================================
    // TODO 데이터
    // ==================================================

    const newTodo = {
      id,

      text: todoText,

      completed: false,

      url: info.pageUrl || tab.url,

      title: tab.title || "",

      createdAt: new Date().toISOString(),
    };

    // ==================================================
    // Highlight 데이터
    // ==================================================

    const newHighlight = {
      id,

      text: todoText,

      url: info.pageUrl || tab.url,

      title: tab.title || "",

      createdAt: new Date().toISOString(),
    };

    // ==================================================
    // 배열 맨 앞 추가
    // ==================================================

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

    // ==================================================
    // Popup 새로고침 요청
    // ==================================================

    chrome.runtime.sendMessage(
      {
        action: "REFRESH_TODO_LIST",
      },
      () => {
        if (chrome.runtime.lastError) {
          console.log("ℹ️ popup 실행 안됨");
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

    // ==================================================
    // 토스트 메시지 요청
    // ==================================================

    chrome.tabs.sendMessage(
      tab.id,
      {
        action: "SHOW_NOTIFICATION",
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
    console.error("❌ background.js 전체 오류:", error);
  }
});

// ======================================================
// 메시지 수신
// ======================================================

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  try {
    // ==================================================
    // Ping 테스트
    // ==================================================

    if (request.action === "PING") {
      sendResponse({
        success: true,

        message: "background.js alive",
      });

      return;
    }

    // ==================================================
    // 기본 응답
    // ==================================================

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
});