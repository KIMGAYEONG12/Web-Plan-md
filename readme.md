# 크롬 확장프로그램 만들기

---

## 개발 기간

### 5/18 ~ 5/21

---

# WebToDo 📝 (WebTODO)

# 프로젝트 소개

인터넷 강의 수강, 자료 조사, 웹서핑 중 중요한 내용을 발견했을 때 별도의 메모 앱을 열지 않고 브라우저 내부에서 바로 저장할 수 있도록 제작한 크롬 확장 프로그램입니다. 마우스 우클릭만으로 할 일을 빠르게 등록하고, 팝업 창을 통해 직관적으로 완료 체크 및 삭제, 검색, 내보내기 등을 수행할 수 있습니다.

# WebToDo

웹페이지에서 빠르게 TODO와 Highlight를 저장할 수 있는 Chrome Extension입니다.
드래그 저장, 우클릭 저장, 실시간 검색, CSV 내보내기, 다크모드 등 생산성 기능을 제공합니다.

# 주요 기능

# TODO / Highlight 저장

웹페이지 텍스트 드래그 후 우클릭 할 일(TODO) 추가

현재 페이지 URL 및 텍스트 자동 저장 (50자 초과 시 말줄임표 처리)

중복 저장 방지 및 자동 Highlight 효과 적용

# Popup UI

# 실시간 디지털 시계: 상단 고정, 시간 관리 지원

# 데이터 관리: TODO 완료 체크(취소선), 개별 삭제, 전체 삭제(🧹)

# Empty State UI 지원

# 검색 및 필터링

# 팝업창 상단 실시간 검색 바 제공

# 키워드 기반 동적 필터링 출력

# 클립보드 복사

# 각 항목 옆 원클릭 복사 버튼 제공

# 할 일 텍스트 + 출처 URL 정보를 포맷팅하여 복사

# CSV Export

# 엑셀 호환 UTF-8 BOM 적용 데이터 내보내기

# 로컬 PC에 즉시 다운로드 기능 제공

# 다크모드

# 야간 작업 시 시각적 피로 완화를 위한 토글 스위치 지원

# 사용자 설정 로컬 스토리지 영구 저장

# 추가 고도화 기능

# Badge 실시간 카운트

# 사이트 favicon 자동 저장

# 페이지 hostname 그룹화

# 자동 태그 생성

# Side Panel(측면 패널) 지원

# 기술 스택

분야기술FrontendHTML5, CSS3, Vanilla JavaScriptExtensionChrome Extension Manifest V3Storagechrome.storage.localMessagingchrome.runtime.sendMessageContext Menuchrome.contextMenusClipboardnavigator.clipboardExportBlob + URL.createObjectURLUIPopup + SidePanel

# 프로젝트 구조

# Bash

# 📁 WebToDo/

├── 📄 manifest.json
├── 📄 background.js
├── 📄 content.js
├── 📄 popup.html
├── 📄 popup.css
├── 📄 popup.js
│
├── 📁 icons/
│ ├── 🖼️ icon16.png
│ ├── 🖼️ icon48.png
│ └── 🖼️ icon128.png
│
└── 📁 screenshots/ # 프로젝트 주요 기능 및 실행 화면을 보여주는 이미지 파일들

# 핵심 기능 구조

# background.js

브라우저 실행 시 컨텍스트 메뉴 제어 (생성 및 재빌드)

우클릭 이벤트 감지 및 데이터 가공/저장

DevTools 로그 출력 및 실시간 브로드캐스팅

# content.js

드래그 Highlight 효과 및 페이지 내 UI 처리

# popup.js

실시간 타이머(오차 방지) 및 데이터 동기화

검색 필터링, CSV 생성, 클립보드 API 연동

다크모드 토글 및 삭제/초기화 기능 제어

데이터 구조

# manifest.JSON

{

"id": 1716000000000,

"text": "사용자가 드래그한 할 일 텍스트",

"completed": false,

"url": "https://example.com/current-page"

}

# 사용 API

chrome.storage.local: 투두리스트 및 유저 테마 설정 영구 저장

chrome.contextMenus: 마우스 우클릭 메뉴 등록

chrome.runtime.sendMessage: 서비스 워커와 팝업 간 데이터 통신

navigator.clipboard.writeText(): 비동기 클립보드 복사

URL.createObjectURL(): CSV 다운로드용 Blob URL 매핑

# 기대 효과

기대 효과: 컨텍스트 스위칭 비용 최소화, 정보 출처 추적성 향상, 상용 수준의 편의 기능 제공
