// [background.js - 완벽 예외 처리 적용 최종 완성본]

// 확장 프로그램 설치 또는 업데이트 시 우클릭 메뉴 생성
chrome.runtime.onInstalled.addListener(() => {
  // 중복 생성 에러를 방지하기 위해 기존 컨텍스트 메뉴를 모두 제거 후 생성
  chrome.contextMenus.removeAll(() => {
    chrome.contextMenus.create({
      id: "add_todo_item",
      title: "할 일(TODO) 추가: '%s'",
      contexts: ["selection", "page"],
    });
    console.log("WebToDo: 우클릭 컨텍스트 메뉴가 성공적으로 등록되었습니다.");
  });
});

// 우클릭 메뉴 클릭 이벤트 리스너
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "add_todo_item") {
    let todoText = "새로운 할 일";

    // 텍스트가 제대로 선택되었는지 검증 및 트리밍
    if (info.selectionText && info.selectionText.trim() !== "") {
      todoText = info.selectionText.trim();

      // [UX 최적화] 너무 긴 텍스트를 드래그했을 경우 팝업 UI 깨짐 방지를 위해 50자로 제한
      if (todoText.length > 50) {
        todoText = todoText.substring(0, 50) + "...";
      }
    }

    // 크롬 로컬 스토리지에서 기존 리스트 가져오기
    chrome.storage.local.get({ todoList: [] }, (result) => {
      let currentList = result.todoList;

      // 기획서 명세에 맞춘 데이터 구조 객체 생성 (안전한 URL 기본값 처리 추가)
      const newTodo = {
        id: Date.now(),
        text: todoText,
        completed: false,
        url: info.pageUrl || "", // URL이 undefined일 경우 빈 문자열로 안전하게 저장
      };

      currentList.push(newTodo);

      // 스토리지에 최종 저장
      chrome.storage.local.set({ todoList: currentList }, () => {
        // DevTools 콘솔창 실시간 디버깅 로그 출력
        console.log("🎯 성공적으로 할 일이 백그라운드에 저장되었습니다!");
        console.log("저장된 데이터:", newTodo);

        // 팝업창이 켜져 있다면 실시간으로 화면을 다시 그리라는 신호(Message) 브로드캐스팅
        chrome.runtime
          .sendMessage({ action: "REFRESH_TODO_LIST" })
          .catch(() => {
            // 팝업창이 닫혀 있을 때는 메시지 받을 대상이 없으므로 발생하는 에러이며, 비동기 통신 특성상 정상적인 현상입니다.
          });
      });
    });
  }
});
