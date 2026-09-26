import fs from 'node:fs';

const read = (file) => JSON.parse(fs.readFileSync(file, 'utf8'));
const exams = read('data/catalog/exams.json');
const subjects = read('data/catalog/subjects.json');
const subjectIds = new Set(subjects.map((subject) => subject.id));
const examIds = new Set();
const setIds = new Set();
const allowedExamStatuses = new Set(['current', 'upcoming', 'archived']);
const allowedSubjectStatuses = new Set(['empty', 'draft', 'ready', 'reviewed']);
let cards = 0;

if (exams.filter((exam) => exam.status === 'current').length !== 1) throw new Error('exactly one exam must have current status');
if (subjectIds.size !== subjects.length) throw new Error('duplicate subject id');

for (const exam of exams) {
  if (examIds.has(exam.id)) throw new Error(`duplicate exam id: ${exam.id}`);
  if (!allowedExamStatuses.has(exam.status)) throw new Error(`${exam.id}: invalid status ${exam.status}`);
  examIds.add(exam.id);
  if (new Set(exam.subjectIds).size !== exam.subjectIds.length) throw new Error(`${exam.id}: duplicate subject in subjectIds`);
  for (const subjectId of exam.subjectIds) if (!subjectIds.has(subjectId)) throw new Error(`${exam.id}: unknown subject ${subjectId}`);
  const index = read(exam.indexFile);
  if (index.examId !== exam.id) throw new Error(`${exam.id}: index examId mismatch`);
  const indexedSubjects = new Set();
  for (const entry of index.subjects) {
    if (!exam.subjectIds.includes(entry.subjectId)) throw new Error(`${exam.id}: unregistered subject ${entry.subjectId}`);
    if (indexedSubjects.has(entry.subjectId)) throw new Error(`${exam.id}: duplicate subject ${entry.subjectId}`);
    if (!allowedSubjectStatuses.has(entry.status)) throw new Error(`${exam.id}/${entry.subjectId}: invalid status ${entry.status}`);
    if (entry.status === 'empty' && entry.setFiles.length) throw new Error(`${exam.id}/${entry.subjectId}: empty subject has card files`);
    if (entry.status !== 'empty' && !entry.setFiles.length) throw new Error(`${exam.id}/${entry.subjectId}: ${entry.status} subject has no card files`);
    indexedSubjects.add(entry.subjectId);
    for (const file of entry.setFiles) {
      if (!fs.existsSync(file)) throw new Error(`${exam.id}: missing ${file}`);
      const set = read(file); const ids = new Set();
      if (setIds.has(set.id)) throw new Error(`duplicate set id: ${set.id}`);
      setIds.add(set.id);
      if (set.schemaVersion !== 2) throw new Error(`${set.id}: schemaVersion must be 2`);
      if (set.examId !== exam.id) throw new Error(`${set.id}: examId mismatch`);
      if (set.subjectId !== entry.subjectId) throw new Error(`${set.id}: subjectId mismatch`);
      if (!Array.isArray(set.categories) || !Array.isArray(set.cards) || !Array.isArray(set.sourceRefs)) throw new Error(`${set.id}: categories, cards, or sourceRefs is not an array`);
      const categoryIds = new Set(); const fronts = new Set();
      for (const category of set.categories) {
        if (!category.id || !category.name || categoryIds.has(category.id)) throw new Error(`${set.id}: invalid or duplicate category ${category.id || '?'}`);
        categoryIds.add(category.id);
      }
      for (const card of set.cards) {
        if (ids.has(card.id)) throw new Error(`${set.id}: duplicate card ${card.id}`);
        if (fronts.has(card.front)) throw new Error(`${set.id}: duplicate card question ${card.front}`);
        if (!categoryIds.has(card.categoryId)) throw new Error(`${set.id}: unknown category ${card.categoryId}`);
        if (!set.sourceRefs.includes(card.sourceRef)) throw new Error(`${set.id}/${card.id}: unknown sourceRef ${card.sourceRef}`);
        for (const field of ['id', 'front', 'answer']) if (typeof card[field] !== 'string' || !card[field].trim()) throw new Error(`${set.id}/${card.id || '?'}: missing ${field}`);
        if (card.acceptedAnswers !== undefined && !Array.isArray(card.acceptedAnswers)) throw new Error(`${set.id}/${card.id}: acceptedAnswers is not an array`);
        ids.add(card.id); fronts.add(card.front); cards += 1;
      }
    }
  }
  if (indexedSubjects.size !== exam.subjectIds.length) throw new Error(`${exam.id}: subject index is incomplete`);
}

console.log(`OK: ${exams.length} exams, ${subjects.length} subjects, ${cards} linked cards`);
