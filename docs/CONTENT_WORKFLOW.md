# 시험 자료 투입과 카드 제작

## 원본 자료를 넣는 위치

사진, 스캔, PDF는 Git 저장소인 `study-card-pwa` 안에 넣지 않는다. 한 단계 위의 비공개 자료 폴더를 사용한다.

```text
../source-materials/<시험 ID>/<과목 ID>/
```

중2 2학기 중간고사 과학 자료의 예:

```text
../source-materials/2026-mid2-sem2-midterm/science/
├── textbook-scope.pdf
├── class-note-01.jpg
└── worksheet-01.png
```

시험 ID와 과목 ID는 `data/catalog/exams.json`, `data/catalog/subjects.json`에서 확인한다.

## 카드 제작 원칙

- 원본에서 확인되는 내용만 사용한다.
- 글자가 불분명한 내용은 추측하지 않는다.
- 한 카드는 한 가지 기억 포인트만 묻는다.
- QnA 자료가 있으면 이를 우선하고 암기 노트로 빠진 내용을 보완한다.
- 자동으로 만든 카드 후보는 원본과 대조한 뒤 반영한다.
- 원본 사진과 PDF는 공개 저장소나 GitHub Pages에 올리지 않는다.

## 앱에 반영되는 위치

검수를 마친 카드만 다음 위치에 JSON으로 저장한다.

```text
data/exams/<시험 ID>/<과목 ID>/core.json
```

해당 시험의 `index.json`에 카드 파일을 연결하고 `status`를 `reviewed`로 바꾼다. 이후 아래 명령으로 전체 참조와 카드 데이터를 검사한다.

```bash
node scripts/validate-data.mjs
node scripts/generate-asset-manifest.mjs
node scripts/generate-asset-manifest.mjs --check
node --check app.js
node --check sw.js
```
