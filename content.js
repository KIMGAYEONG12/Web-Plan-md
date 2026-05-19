/**
 * showToast(message)
 * -----------------
 * 화면 우측 하단에 일시적으로 메시지를 보여주는 토스트 기능
 *
 * 특징:
 * 1. 기존 toast가 없으면 HTML에 생성
 * 2. 메시지 표시 후 2.5초 뒤 자동으로 사라짐
 * 3. div 제거하지 않고 재사용
 * 4. 스타일은 JS 내에서 직접 설정
 *
 * 사용 예시:
 * showToast("TODO가 추가되었습니다!");
 */
function showToast(message) {
  let toast = document.getElementById("popup-toast");

  // 없으면 생성
  if (!toast) {
    toast = document.createElement("div");
    toast.id = "popup-toast";
    document.body.appendChild(toast);

    // 기본 스타일
    Object.assign(toast.style, {
      position: "fixed",
      bottom: "20px",
      right: "20px",
      background: "blue",
      color: "white",
      padding: "12px 18px",
      borderRadius: "8px",
      zIndex: "999999",
      fontSize: "14px",
      fontFamily: "sans-serif",
      boxShadow: "0 4px 10px gray",
      opacity: "0",
      transition: "opacity 0.5s ease",
      pointerEvents: "none",
    });
  }

  // 이전 타이머 있으면 제거
  if (toast._timeout) {
    clearTimeout(toast._timeout);
  }

  // 메시지 설정
  toast.textContent = message;

  // 보여주기
  requestAnimationFrame(() => {
    toast.style.opacity = "1";
  });

  // 자동 숨기기
  toast._timeout = setTimeout(() => {
    toast.style.opacity = "0";
    // 0.5초 후 텍스트 초기화
    toast._timeout = setTimeout(() => {
      toast.textContent = "";
    }, 500);
  }, 2500);
}