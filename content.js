/**
 * ======================================================
 * WebToDo content.js
 * FINAL STABLE VERSION
 * ======================================================
 */

(() => {
  // ======================================================
  // 중복 실행 방지
  // ======================================================

  if (window.__WEBTODO_CONTENT_LOADED__) {
    return;
  }

  window.__WEBTODO_CONTENT_LOADED__ = true;

  console.log("✅ WebToDo content.js 실행됨");

  // ======================================================
  // runtime 체크
  // ======================================================

  if (
    typeof chrome === "undefined" ||
    !chrome.runtime ||
    !chrome.runtime.onMessage
  ) {
    console.error("❌ chrome.runtime unavailable");

    return;
  }

  // ======================================================
  // 메시지 리스너
  // ======================================================

  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    try {
      // ================================================
      // 저장 알림
      // ================================================

      if (request.action === "SHOW_NOTIFICATION") {
        showToast(request.message || "✅ WebToDo에 저장되었습니다!");

        sendResponse({
          success: true,
        });

        return true;
      }

      // ================================================
      // 형광펜 효과
      // ================================================

      if (request.action === "HIGHLIGHT_SELECTION") {
        highlightSelection();

        sendResponse({
          success: true,
        });

        return true;
      }

      sendResponse({
        success: true,
      });

      return true;
    } catch (error) {
      console.error("❌ content.js 오류:", error);

      sendResponse({
        success: false,
        error: error.message,
      });

      return true;
    }
  });

  // ======================================================
  // 형광펜 기능
  // ======================================================

  function highlightSelection() {
    try {
      const selection = window.getSelection();

      if (!selection || selection.rangeCount === 0) {
        return;
      }

      const selectedText = selection.toString().trim();

      if (!selectedText) {
        return;
      }

      const range = selection.getRangeAt(0);

      // ================================================
      // 이미 highlight 내부면 중단
      // ================================================

      const parentNode = range.commonAncestorContainer;

      if (
        parentNode &&
        parentNode.parentElement &&
        parentNode.parentElement.classList.contains("webtodo-highlight")
      ) {
        return;
      }

      // ================================================
      // span 생성
      // ================================================

      const highlight = document.createElement("span");

      highlight.className = "webtodo-highlight";

      Object.assign(highlight.style, {
        background: "#7dd3fc",
        color: "#111827",
        padding: "2px 4px",
        borderRadius: "4px",
        fontWeight: "600",
        boxShadow: "0 0 0 1px rgba(0,0,0,0.06)",
        transition: "all 0.25s ease",
      });

      highlight.title = "Saved by WebToDo";

      // ================================================
      // surroundContents
      // ================================================

      try {
        range.surroundContents(highlight);
      } catch {
        const extracted = range.extractContents();

        highlight.appendChild(extracted);

        range.insertNode(highlight);
      }

      // ================================================
      // 애니메이션
      // ================================================

      requestAnimationFrame(() => {
        highlight.style.background = "#38bdf8";
      });

      // ================================================
      // 라벨 표시
      // ================================================

      showFloatingLabel(highlight);

      // ================================================
      // 선택 해제
      // ================================================

      selection.removeAllRanges();
    } catch (error) {
      console.error("❌ highlightSelection 오류:", error);
    }
  }

  // ======================================================
  // Floating Label
  // ======================================================

  function showFloatingLabel(target) {
    try {
      if (!target || !document.body) {
        return;
      }

      const rect = target.getBoundingClientRect();

      const label = document.createElement("div");

      label.textContent = "📌 WebToDo 저장됨";

      Object.assign(label.style, {
        position: "absolute",

        top: `${window.scrollY + rect.top - 42}px`,

        left: `${window.scrollX + rect.left}px`,

        zIndex: "999999",

        background: "#0ea5e9",

        color: "#ffffff",

        padding: "6px 10px",

        borderRadius: "8px",

        fontSize: "12px",

        fontWeight: "700",

        boxShadow: "0 6px 18px rgba(0,0,0,0.2)",

        opacity: "0",

        transform: "translateY(6px)",

        transition: "all 0.25s ease",

        pointerEvents: "none",
      });

      document.body.appendChild(label);

      requestAnimationFrame(() => {
        label.style.opacity = "1";

        label.style.transform = "translateY(0)";
      });

      setTimeout(() => {
        label.style.opacity = "0";

        label.style.transform = "translateY(4px)";

        setTimeout(() => {
          label.remove();
        }, 300);
      }, 2200);
    } catch (error) {
      console.error("❌ floating label 오류:", error);
    }
  }

  // ======================================================
  // Toast
  // ======================================================

  function showToast(message) {
    try {
      let toast = document.getElementById("webtodo-toast");

      // ================================================
      // 생성
      // ================================================

      if (!toast) {
        toast = document.createElement("div");

        toast.id = "webtodo-toast";

        document.body.appendChild(toast);

        Object.assign(toast.style, {
          position: "fixed",

          bottom: "20px",

          right: "20px",

          background: "#111827",

          color: "#ffffff",

          padding: "12px 18px",

          borderRadius: "10px",

          zIndex: "999999",

          fontSize: "14px",

          fontWeight: "600",

          fontFamily: "'Segoe UI', sans-serif",

          boxShadow: "0 8px 24px rgba(0,0,0,0.28)",

          opacity: "0",

          transform: "translateY(8px)",

          transition: "all 0.25s ease",

          pointerEvents: "none",
        });
      }

      // ================================================
      // 중복 제거
      // ================================================

      if (toast._timeout) {
        clearTimeout(toast._timeout);
      }

      // ================================================
      // 표시
      // ================================================

      toast.textContent = message;

      requestAnimationFrame(() => {
        toast.style.opacity = "1";

        toast.style.transform = "translateY(0)";
      });

      // ================================================
      // 숨김
      // ================================================

      toast._timeout = setTimeout(() => {
        toast.style.opacity = "0";

        toast.style.transform = "translateY(8px)";
      }, 2400);
    } catch (error) {
      console.error("❌ toast 오류:", error);
    }
  }
})();
