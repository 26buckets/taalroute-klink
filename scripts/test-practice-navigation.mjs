import assert from 'node:assert/strict';
import test from 'node:test';
import { defaultRouteSettings, parseRouteSettings } from '../lib/learner-route.ts';
import { defaultPracticePreferences, parsePracticePreferences, practiceLocation } from '../lib/practice-navigation.ts';

test('navigation preferences validate input and retain both old route axes', () => {
  for (const raw of [null, 'bad', 'null', '[]', '{"level":"b2","help":"other"}']) assert.deepEqual(parsePracticePreferences(raw), defaultPracticePreferences);
  const raw = '{"literacy":"alfa-b","language":"a2","pictures":"request"}';
  const settings = parseRouteSettings(raw);
  assert.deepEqual(parsePracticePreferences(null, settings), { level: 'alfa-b', help: 'practice' });
  assert.deepEqual(parsePracticePreferences(null, { ...defaultRouteSettings, language: 'a2' }), { level: 'a2', help: 'practice' });
  assert.deepEqual(parsePracticePreferences('{"level":"a1","help":"guided"}', settings), { level: 'a1', help: 'guided' });
  assert.deepEqual(settings, JSON.parse(raw));
});

test('Start restores the last selection while inner bookmarks keep their original scope', () => {
  const preferences = { level: 'a2', help: 'guided' };
  assert.deepEqual(practiceLocation('#learner/home', preferences), preferences);
  assert.deepEqual(practiceLocation('#learner/chapters', preferences), preferences);
  assert.equal(practiceLocation('#learner/chapters/words', preferences).level, 'all');
  assert.equal(practiceLocation('#learner/chapters/words', preferences).help, undefined);
  const explicit = practiceLocation('#learner/chapters/words/meet?level=alfa-a&help=practice', preferences);
  assert.equal(explicit.level, 'alfa-a'); assert.equal(explicit.help, 'practice'); assert.equal(explicit.activity, 'meet');
  assert.equal(practiceLocation('#learner/chapters?level=all', preferences).level, 'all');
  assert.equal(practiceLocation('#learner/chapters?level=support', preferences).level, 'support');
  assert.equal(practiceLocation('#learner/chapters?level=b2', preferences).level, 'all');
});
