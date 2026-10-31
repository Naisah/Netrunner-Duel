import assert from 'node:assert/strict';
import test from 'node:test';
import {
	calculateBattleScores,
	calculateStats,
	normalizeCalendar,
} from '../src/lib/contribution-engine.ts';
import { GET } from '../src/pages/api/contributions/[username].ts';

const millisecondsPerDay = 86_400_000;

function makeCalendar(from, to, countForDate = () => 0) {
	const fromTime = Date.parse(`${from}T00:00:00Z`);
	const toTime = Date.parse(`${to}T00:00:00Z`);
	const firstDay = new Date(fromTime);
	const weekday = firstDay.getUTCDay();
	firstDay.setUTCDate(firstDay.getUTCDate() - (weekday === 0 ? 6 : weekday - 1));

	const weeks = [];
	let totalContributions = 0;
	for (
		let weekTime = firstDay.getTime();
		weekTime <= toTime;
		weekTime += millisecondsPerDay * 7
	) {
		const days = [];
		for (let dayIndex = 0; dayIndex < 7; dayIndex += 1) {
			const date = new Date(weekTime + dayIndex * millisecondsPerDay)
				.toISOString()
				.slice(0, 10);
			const count = date >= from && date <= to ? countForDate(date) : 0;
			totalContributions += count;
			days.push({ date, count, level: count === 0 ? 0 : 1 });
		}
		weeks.push({ firstDay: days[0].date, days });
	}

	return { username: 'test-user', totalContributions, from, to, weeks };
}

function makeSourceWeek(firstDay, counts = []) {
	return {
		first_day: firstDay,
		contribution_days: Array.from({ length: 7 }, (_, weekday) => ({
			weekday,
			count: counts[weekday] ?? 0,
			level: 0,
		})),
	};
}

test('normalizes contribution days and derives missing intensity levels', () => {
	const sourceWeek = makeSourceWeek('2024-01-01', [0, 1, 2, 3, 4, 5, 6]);
	sourceWeek.contribution_days.forEach((day) => {
		day.level = null;
	});
	const calendar = normalizeCalendar(
		{
			from: '2024-01-01',
			to: '2024-01-07',
			total_contributions: 7,
			weeks: [sourceWeek],
		},
		'runner',
	);

	assert.ok(calendar);
	assert.equal(calendar.username, 'runner');
	assert.deepEqual(
		calendar.weeks[0].days.map(({ date, count }) => [date, count]),
		Array.from({ length: 7 }, (_, day) => [
			new Date(Date.UTC(2024, 0, day + 1)).toISOString().slice(0, 10),
			day,
		]),
	);
	assert.deepEqual(
		calendar.weeks[0].days.map(({ level }) => level),
		[0, 1, 1, 1, 2, 2, 2],
	);
});

test('rejects malformed contribution weeks', () => {
	const malformed = makeSourceWeek('2024-01-01').contribution_days.slice(1);
	assert.equal(
		normalizeCalendar(
			{
				from: '2024-01-01',
				to: '2024-01-07',
				total_contributions: 0,
				weeks: [{ first_day: '2024-01-01', contribution_days: malformed }],
			},
			'runner',
		),
		null,
	);
});

test('calculates zero stats for a full year with no contributions', () => {
	const stats = calculateStats(makeCalendar('2024-01-01', '2024-12-31'));

	assert.equal(stats.total, 0);
	assert.equal(stats.longestStreak, 0);
	assert.equal(stats.currentStreak, 0);
	assert.equal(stats.peakCount, 0);
	assert.equal(stats.consistency, 0);
	assert.equal(stats.weekendContributionRatio, 0);
});

test('continues a contribution streak across month and year boundaries', () => {
	const calendar = makeCalendar('2023-12-30', '2024-01-03', () => 1);
	const stats = calculateStats(calendar);

	assert.equal(stats.longestStreak, 5);
	assert.equal(stats.currentStreak, 5);
	assert.equal(stats.total, 5);
});

test('splits weighted scores evenly when player stats are identical', () => {
	const stats = calculateStats(makeCalendar('2024-01-01', '2024-01-07', () => 2));
	const outcome = calculateBattleScores([stats, { ...stats }]);

	assert.deepEqual(outcome, { one: 50, two: 50, winner: 'tie' });
});

test('rejects invalid usernames before making an upstream request', async () => {
	const originalFetch = globalThis.fetch;
	let fetchCalled = false;
	globalThis.fetch = async () => {
		fetchCalled = true;
		throw new Error('Invalid usernames must not reach GitHub.');
	};

	try {
		for (const username of ['../other', 'name/path', 'user@host', 'two--hyphens', '-leading', 'trailing-']) {
			const response = await GET({ params: { username } });
			assert.equal(response.status, 400, `${username} should be rejected`);
			assert.deepEqual(await response.json(), { error: 'Invalid GitHub username' });
		}
		assert.equal(fetchCalled, false);
	} finally {
		globalThis.fetch = originalFetch;
	}
});
