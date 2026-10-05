import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const source = fs.readFileSync('app.js', 'utf8').replace(/init\(\)\.catch\([\s\S]*$/, '');
function boot(storage = new Map()) {
 const element = { innerHTML: '', focus() {}, addEventListener() {}, querySelector() { return null; }, toggleAttribute() {}, setAttribute() {}, remove() {} };
 const context = vm.createContext({ console, Map, Set, Date, Intl, Math, JSON, navigator: {}, localStorage: { getItem: k => storage.get(k) ?? null, setItem: (k,v) => storage.set(k,v), removeItem: k => storage.delete(k) }, document: { querySelector: () => element, addEventListener() {}, querySelectorAll: () => [], createElement: () => element, body: { append() {} } }, window: { scrollTo() {} }, matchMedia: () => ({ matches: false }), setTimeout: () => 1, clearTimeout() {}, fetch: async file => ({ok: true, json: async () => JSON.parse(fs.readFileSync(file, 'utf8'))}) });
 vm.runInContext(source, context);
 return { run: code => vm.runInContext(code, context), storage };
}
const setup = `state.exams = [{id:'2026-mid2-sem2-midterm',title:'시험'}]; state.subjects = [{id:'korean',name:'국어'}]; state.indexes.set('2026-mid2-sem2-midterm', {subjects:[{subjectId:'korean',setFiles:['data/exams/2026-mid2-sem2-midterm/korean/core.json']}]}); state.exam=state.exams[0]; state.selected=new Set(['korean']); state.studyOrder='textbook';`;
const a = boot(); a.run(setup); await a.run('startStudy()');
a.run("grade('wrong')");
const expected = a.run('state.queue[state.index].id');
assert.equal(JSON.parse(a.storage.get('jianstudy:progress:v2'))[a.run('cardKey(state.cards[0])')].grade, 'wrong');
const b = boot(a.storage); b.run(setup);
assert.equal(await b.run("resumeStudy('2026-mid2-sem2-midterm')"), true);
assert.equal(b.run('state.queue[state.index].id'), expected);
assert.equal(b.run('state.index'), 1);
assert.equal(b.run('state.session.wrong'), 1);
assert.equal(b.run('state.queue.length'), b.run('state.cards.length') + 1);
// Data reductions must remove retired cards without repeating completed retained cards.
const saved = JSON.parse(a.storage.get('jianstudy:session:v1'));
saved['2026-mid2-sem2-midterm'].queue.splice(0,0,'korean-mid2-2-midterm-2026:retired');
saved['2026-mid2-sem2-midterm'].index += 1;
a.storage.set('jianstudy:session:v1', JSON.stringify(saved));
const c = boot(a.storage); c.run(setup); assert.equal(await c.run("resumeStudy('2026-mid2-sem2-midterm')"),true); assert.equal(c.run('state.index'),1); assert.equal(c.run('state.queue[state.index].id'),expected);
// A finished quest must not resume, and grading after leaving must do nothing.
c.run('state.index=state.queue.length; renderStudy()'); assert.equal(await c.run("resumeStudy('2026-mid2-sem2-midterm')"),false);
const before = c.storage.get('jianstudy:progress:v2'); c.run("renderExam(); grade('correct')"); assert.equal(c.storage.get('jianstudy:progress:v2'),before);
// Closing during the correct-answer animation resumes the next card exactly once.
const e = boot(); e.run(setup); await e.run('startStudy()'); e.run("grade('correct'); grade('correct')");
assert.equal(e.run('state.index'),1);
const f = boot(e.storage); await f.run('init()');
assert.equal(f.run('state.index'),1); assert.equal(f.run('state.session.correct'),1); assert.equal(f.run('state.studying'),true);
for (const subject of ['korean','science']) {
 const data = JSON.parse(fs.readFileSync(`data/exams/2026-mid2-sem2-midterm/${subject}/core.json`));
 assert.equal(data.cards.length,50); assert.equal(new Set(data.cards.map(c => c.id)).size,50);
 const previousIds = new Set([...fs.readFileSync('docs/CORE_70_REVIEW.md', 'utf8').matchAll(/`((?:kor|sci)\d{3})`/g)].map(match => match[1]));
 assert.equal(data.cards.filter(card => previousIds.has(card.id)).length,0, `${subject}: previous 70 questions must be excluded`);
 assert.deepEqual(new Set(data.cards.map(c => c.categoryId)),new Set(data.categories.map(c => c.id)));
}
// Malformed or unavailable storage must not prevent a fresh study session.
const d = boot(new Map([['jianstudy:session:v1','null']])); d.run(setup); assert.equal(await d.run("resumeStudy('2026-mid2-sem2-midterm')"),false); await d.run('startStudy()');
d.run("localStorage.setItem=()=>{throw new Error('quota')}; grade('wrong')"); assert.equal(d.run('state.index'),1);
console.log('OK: close/reopen, queue repeats, retired cards, completion, exit guard, storage failure');
