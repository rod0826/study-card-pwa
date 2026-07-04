# 다른 과목 카드 세트 추가 가이드

JianStudy는 정적 PWA라서 과목/시험 범위를 JSON 파일로 추가하면 앱에 자동으로 노출됩니다.

## 원칙

- 사용자가 전달한 스캔 이미지/노트에 실제로 있는 범위만 카드화합니다.
- 교과서 일반 범위나 예상 시험 범위를 임의로 확장하지 않습니다.
- 원본 사진은 공개 저장소에 올리지 않고, 파생된 카드 데이터만 저장합니다.
- 한 카드는 하나의 기억 포인트만 묻도록 쪼갭니다.

## 추가 절차

1. 새 카드 JSON 파일을 `data/<set-id>.json` 형태로 만듭니다.
2. `data/sets.json`에 새 세트 메타데이터를 추가합니다.
3. `sw.js`의 `ASSETS` 배열에 새 카드 JSON 경로를 추가합니다.
4. `CACHE_NAME`을 한 단계 올립니다. 예: `jianstudy-v4` → `jianstudy-v5`
5. 로컬 서버에서 데이터/앱 로딩을 확인합니다.
6. 커밋 후 GitHub Pages 배포 URL에서 다시 확인합니다.

## 카드 세트 파일 형식

예: `data/science-mid2-final-2026.json`

```json
{
  "id": "science-mid2-final-2026",
  "title": "중2 기말 과학",
  "subject": "과학",
  "grade": "중학교 2학년",
  "exam": "기말",
  "source": "스캔 노트",
  "description": "전달된 스캔 이미지 범위에 맞춰 주요 개념을 빈칸 카드로 복습합니다.",
  "categories": ["단원명"],
  "cards": [
    {
      "id": "s001",
      "type": "blank",
      "category": "단원명",
      "front": "광합성이 일어나는 세포 소기관은 ___이다.",
      "answer": "엽록체",
      "hint": "식물 세포에 있는 초록색 소기관"
    }
  ]
}
```

## `data/sets.json` 등록 형식

```json
{
  "id": "science-mid2-final-2026",
  "title": "중2 기말 과학",
  "subject": "과학",
  "grade": "중학교 2학년",
  "exam": "기말",
  "description": "스캔 이미지 기반: 실제 전달 범위",
  "cardCount": 1,
  "file": "data/science-mid2-final-2026.json",
  "tags": ["중2", "과학", "기말", "스캔기반"]
}
```

## 검증 명령

```bash
python3 -m json.tool data/sets.json >/dev/null
python3 -m json.tool data/<set-id>.json >/dev/null
python3 -m http.server 5173
```

다른 터미널에서:

```bash
curl -s http://127.0.0.1:5173/data/sets.json | python3 -m json.tool >/dev/null
curl -s http://127.0.0.1:5173/data/<set-id>.json | python3 -m json.tool >/dev/null
```

GitHub Pages 배포 후에는 공개 URL에서도 같은 파일을 확인합니다.
