# JianStudy

전달된 스캔 노트 범위 안에서만 중학교 시험용 암기 카드를 만드는 작은 PWA입니다.

## 현재 포함된 세트

- 중2-1 기말 역사: 중국 고대부터 명·청까지, 37장

## 설치 안내

- iPhone/iPad: Safari에서 열기 → 공유 버튼 → 홈 화면에 추가
- Android/Chrome: 메뉴 또는 주소창의 앱 설치 선택

## 다른 과목 추가

1. 실제 스캔 이미지/노트에 있는 범위를 먼저 확인합니다.
2. `data/sets.json`에 새 세트 메타데이터를 추가합니다.
3. `data/<set-id>.json` 파일을 만들고 `cards` 배열을 채웁니다.
4. GitHub Pages에 push하면 세트 선택 목록에 자동으로 표시됩니다.

카드 기본 형식:

```json
{
  "id": "science-001",
  "type": "blank",
  "category": "단원명",
  "front": "광합성이 일어나는 세포 소기관은 ___이다.",
  "answer": "엽록체",
  "hint": "식물 세포에 있는 초록색 소기관"
}
```

## 로컬 실행

```bash
python3 -m http.server 5173
```

브라우저에서 `http://localhost:5173`을 엽니다.
