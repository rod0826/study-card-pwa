import fs from 'node:fs';

const targets = [
  ['data/exams/2026-mid2-sem1-final/history/core.json', 'history'],
  ['data/exams/2026-mid2-sem1-final/technology/core.json', 'technology'],
  ['data/exams/2026-mid2-sem1-final/home/core.json', 'home'],
];

for (const [file, subjectId] of targets) {
  const set = JSON.parse(fs.readFileSync(file, 'utf8'));
  if (set.schemaVersion === 2) continue;
  const categoryIds = new Map(set.categories.map((name, index) => [name, `unit-${String(index + 1).padStart(2, '0')}`]));
  const migrated = {
    schemaVersion: 2,
    id: set.id,
    examId: '2026-mid2-sem1-final',
    subjectId,
    title: set.title,
    source: set.source,
    sourceRefs: ['legacy-import'],
    description: set.description,
    categories: set.categories.map((name, index) => ({ id: categoryIds.get(name), name, order: (index + 1) * 10 })),
    cards: set.cards.map(({ category, ...card }) => ({ ...card, categoryId: categoryIds.get(category), sourceRef: 'legacy-import' })),
  };
  fs.writeFileSync(file, `${JSON.stringify(migrated, null, 2)}\n`);
}
