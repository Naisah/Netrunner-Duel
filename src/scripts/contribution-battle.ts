import {
	calculateBattleScores,
	calculateStats,
	categoryWeights,
	getStatValue,
	type ContributionCalendar,
	type PlayerStats,
	type StatCategory,
} from '../lib/contribution-engine.ts';
import { isSfxEnabled, playSound, setSfxEnabled } from './sound-effects.ts';

interface PlayerRequest {
	player: 'one' | 'two';
	label: string;
	username: string;
}

class ContributionRequestError extends Error {
	constructor(
		message: string,
		readonly status: number,
	) {
		super(message);
	}
}

const form = document.querySelector<HTMLFormElement>('[data-duel-form]');
const submitButton = document.querySelector<HTMLButtonElement>('[data-submit]');
const statusMessage = document.querySelector<HTMLElement>('[data-status]');
const bootScreen = document.querySelector<HTMLElement>('[data-boot-screen]');
const bootOutput = document.querySelector<HTMLElement>('[data-boot-output]');
const soundToggle = document.querySelector<HTMLButtonElement>('[data-sound-toggle]');
let requestId = 0;

function getArena(player: PlayerRequest['player']) {
	return document.querySelector<HTMLElement>(`.arena-${player}`);
}

function updateStatus(message: string, state: 'loading' | 'success' | 'error') {
	if (!statusMessage) return;
	statusMessage.textContent = message;
	statusMessage.dataset.state = state;
	statusMessage.hidden = false;
}

function delay(milliseconds: number) {
	return new Promise<void>((resolve) => window.setTimeout(resolve, milliseconds));
}

function waitForHeatmapReveal() {
	return window.matchMedia('(prefers-reduced-motion: reduce)').matches ? delay(0) : delay(1_250);
}

async function typeTerminalLine(message: string, currentRequest: number, state = 'ok') {
	if (!bootOutput || currentRequest !== requestId) return false;
	const line = document.createElement('p');
	line.className = 'boot-line';
	line.dataset.state = state;
	const text = document.createElement('span');
	const cursor = document.createElement('span');
	cursor.className = 'boot-cursor';
	cursor.textContent = '_';
	line.append(text, cursor);
	bootOutput.append(line);

	for (const character of message) {
		if (currentRequest !== requestId) return false;
		text.textContent += character;
		await delay(15);
	}
	cursor.remove();
	return currentRequest === requestId;
}

async function startBootSequence(currentRequest: number) {
	if (!bootScreen || !bootOutput || !statusMessage) return;
	bootOutput.replaceChildren();
	bootScreen.hidden = false;
	statusMessage.hidden = true;
	await typeTerminalLine('> CONNECTING TO GITHUB GRID...', currentRequest);
	if (currentRequest !== requestId) return;
	await delay(120);
	await typeTerminalLine('> DECRYPTING CONTRIBUTION DATA...', currentRequest);
}

function resetIntegrity() {
	for (const player of ['one', 'two'] as const) {
		const fill = document.querySelector<HTMLElement>(`[data-integrity-fill="${player}"]`);
		const score = document.querySelector<HTMLElement>(`[data-integrity-score="${player}"]`);
		const track = fill?.parentElement;
		if (fill) fill.style.width = '0%';
		if (score) score.textContent = '0%';
		track?.setAttribute('aria-valuenow', '0');
	}
}

function setIntegrity(player: 'one' | 'two', score: number) {
	const fill = document.querySelector<HTMLElement>(`[data-integrity-fill="${player}"]`);
	const label = document.querySelector<HTMLElement>(`[data-integrity-score="${player}"]`);
	const track = fill?.parentElement;
	const percentage = Math.min(100, Math.max(0, score));
	if (fill) fill.style.width = `${percentage}%`;
	if (label) label.textContent = `${percentage.toFixed(0)}%`;
	track?.setAttribute('aria-valuenow', percentage.toFixed(0));
}

function resetPlayerStats(arena: HTMLElement) {
	arena.querySelector<HTMLElement>('[data-stat-longest]')!.textContent = '— days';
	arena.querySelector<HTMLElement>('[data-stat-current]')!.textContent = '— days';
	arena.querySelector<HTMLElement>('[data-stat-peak]')!.textContent = '—';
	arena.querySelector<HTMLElement>('[data-stat-consistency]')!.textContent = '—';
	const classBadge = arena.querySelector<HTMLElement>('[data-class-badge]');
	if (classBadge) {
		classBadge.hidden = true;
		classBadge.textContent = '';
		classBadge.removeAttribute('title');
	}
}

function setLoading(request: PlayerRequest) {
	const arena = getArena(request.player);
	if (!arena) return;

	resetPlayerStats(arena);
	const errorMessage = arena.querySelector<HTMLElement>('[data-player-error]');
	const username = arena.querySelector<HTMLElement>('[data-username]');
	const total = arena.querySelector<HTMLElement>('[data-total]');
	const skeleton = arena.querySelector<HTMLElement>('[data-grid-skeleton]');
	const grid = arena.querySelector<HTMLElement>('[data-grid]');
	if (errorMessage) {
		errorMessage.hidden = true;
		errorMessage.textContent = '';
	}
	if (username) username.textContent = `@${request.username}`;
	if (total) total.textContent = 'Loading…';
	if (skeleton) skeleton.hidden = false;
	if (grid) {
		grid.hidden = true;
		grid.replaceChildren();
	}
}

function setError(request: PlayerRequest, message: string) {
	const arena = getArena(request.player);
	if (!arena) return;

	resetPlayerStats(arena);
	const errorMessage = arena.querySelector<HTMLElement>('[data-player-error]');
	const total = arena.querySelector<HTMLElement>('[data-total]');
	const skeleton = arena.querySelector<HTMLElement>('[data-grid-skeleton]');
	const grid = arena.querySelector<HTMLElement>('[data-grid]');
	if (errorMessage) {
		errorMessage.textContent = message;
		errorMessage.hidden = false;
	}
	if (total) total.textContent = '—';
	if (skeleton) skeleton.hidden = true;
	if (grid) grid.hidden = true;
}

function isContributionCalendar(value: unknown): value is ContributionCalendar {
	if (typeof value !== 'object' || value === null) return false;
	const calendar = value as Record<string, unknown>;
	if (
		typeof calendar.username !== 'string' ||
		typeof calendar.totalContributions !== 'number' ||
		typeof calendar.from !== 'string' ||
		typeof calendar.to !== 'string' ||
		!Array.isArray(calendar.weeks)
	) {
		return false;
	}

	return calendar.weeks.every(
		(week: unknown) =>
			typeof week === 'object' &&
			week !== null &&
			'days' in week &&
			Array.isArray(week.days) &&
			week.days.length === 7 &&
			week.days.every(
				(day: unknown) =>
					typeof day === 'object' &&
					day !== null &&
					'date' in day &&
					typeof day.date === 'string' &&
					'count' in day &&
					typeof day.count === 'number' &&
					Number.isInteger(day.count) &&
					day.count >= 0 &&
					'level' in day &&
					typeof day.level === 'number' &&
					Number.isInteger(day.level) &&
					day.level >= 0 &&
					day.level <= 4,
			),
	);
}

async function fetchCalendar(username: string): Promise<ContributionCalendar> {
	let response: Response;
	try {
		response = await fetch(`/api/contributions/${encodeURIComponent(username)}`);
	} catch {
		throw new ContributionRequestError(
			'Could not reach the contribution service. Check your connection and try again.',
			0,
		);
	}

	let payload: unknown;
	try {
		payload = await response.json();
	} catch {
		throw new ContributionRequestError('The contribution service returned an invalid response.', response.status);
	}

	if (!response.ok) {
		const apiMessage =
			typeof payload === 'object' &&
			payload !== null &&
			'error' in payload &&
			typeof payload.error === 'string'
				? payload.error
				: '';
		if (response.status === 404) {
			throw new ContributionRequestError(`GitHub user “${username}” was not found.`, response.status);
		}
		throw new ContributionRequestError(
			apiMessage || `Could not load GitHub user “${username}” (HTTP ${response.status}).`,
			response.status,
		);
	}

	if (!isContributionCalendar(payload)) {
		throw new ContributionRequestError(
			`The contribution calendar for “${username}” has an unexpected format.`,
			response.status,
		);
	}

	return payload;
}

function renderCalendar(request: PlayerRequest, calendar: ContributionCalendar) {
	const arena = getArena(request.player);
	if (!arena) return;

	const username = arena.querySelector<HTMLElement>('[data-username]');
	const total = arena.querySelector<HTMLElement>('[data-total]');
	const dateRange = arena.querySelector<HTMLElement>('[data-date-range]');
	const skeleton = arena.querySelector<HTMLElement>('[data-grid-skeleton]');
	const grid = arena.querySelector<HTMLElement>('[data-grid]');
	if (!grid) return;

	const weeks = calendar.weeks.slice(-52);
	if (weeks.length !== 52) {
		throw new Error(`The contribution calendar for “${request.username}” does not contain 52 weeks.`);
	}

	grid.replaceChildren();
	for (const week of weeks) {
		const weekColumn = document.createElement('div');
		weekColumn.className = 'week';
		weekColumn.setAttribute('role', 'row');

		for (const day of week.days) {
			const cell = document.createElement('span');
			cell.className = 'day';
			cell.dataset.level = String(day.level);
			cell.setAttribute('role', 'gridcell');
			cell.setAttribute('aria-label', `${day.date}: ${day.count} contributions`);
			cell.title = `${day.date}: ${day.count} contributions`;
			weekColumn.append(cell);
		}

		weekColumn.style.setProperty('--column-index', String(grid.children.length));
		grid.append(weekColumn);
	}

	const displayedDays = weeks.flatMap((week) => week.days);
	const firstDate = displayedDays[0]?.date;
	const lastDate = displayedDays.at(-1)?.date;
	grid.setAttribute('aria-label', `${request.username}'s contributions from ${firstDate} to ${lastDate}`);
	if (username) username.textContent = `@${calendar.username}`;
	if (total) total.textContent = new Intl.NumberFormat().format(calendar.totalContributions);
	if (dateRange) dateRange.textContent = `${firstDate} — ${lastDate}`;
	if (skeleton) skeleton.hidden = true;
	grid.hidden = false;
}

function getNetrunnerClass(stats: PlayerStats) {
	if (stats.longestStreak > 30) {
		return { name: 'Streak Daemon', description: 'Longest contribution streak exceeds 30 days.' };
	}
	if (stats.weekendContributionRatio >= 40) {
		return {
			name: 'Weekend Hacker',
			description: 'At least 40% of contributions land on Saturday or Sunday.',
		};
	}
	if (stats.peakCount >= 20) {
		return {
			name: 'Overclock Berserker',
			description: 'Peak day reached at least 20 contributions.',
		};
	}
	if (stats.consistency >= 70) {
		return { name: 'Ghost Runner', description: 'Contributed on at least 70% of days.' };
	}
	return { name: 'Grid Nomad', description: 'A netrunner with an unpredictable contribution pattern.' };
}

function renderPlayerStats(player: PlayerRequest['player'], stats: PlayerStats) {
	const arena = getArena(player);
	if (!arena) return;
	arena.querySelector<HTMLElement>('[data-stat-longest]')!.textContent =
		`${stats.longestStreak} days`;
	arena.querySelector<HTMLElement>('[data-stat-current]')!.textContent =
		`${stats.currentStreak} days`;
	arena.querySelector<HTMLElement>('[data-stat-peak]')!.textContent =
		`${stats.peakCount} contributions (${stats.peakDate})`;
	arena.querySelector<HTMLElement>('[data-stat-consistency]')!.textContent =
		`${stats.consistency.toFixed(1)}%`;
	const classBadge = arena.querySelector<HTMLElement>('[data-class-badge]');
	if (classBadge) {
		const netrunnerClass = getNetrunnerClass(stats);
		classBadge.textContent = netrunnerClass.name;
		classBadge.title = netrunnerClass.description;
		classBadge.hidden = false;
	}
}

function displayStat(category: StatCategory, stats: PlayerStats) {
	switch (category) {
		case 'total':
			return new Intl.NumberFormat().format(stats.total);
		case 'longest':
			return `${stats.longestStreak} days`;
		case 'current':
			return `${stats.currentStreak} days`;
		case 'peak':
			return `${stats.peakCount} (${stats.peakDate})`;
		case 'consistency':
			return `${stats.consistency.toFixed(1)}%`;
	}
}

function renderScoreboard(
	players: [PlayerRequest, PlayerRequest],
	stats: [PlayerStats, PlayerStats],
) {
	const scoreboard = document.querySelector<HTMLElement>('[data-scoreboard]');
	if (!scoreboard) return null;

	scoreboard.querySelector<HTMLElement>('[data-player-one-heading]')!.textContent =
		players[0].username;
	scoreboard.querySelector<HTMLElement>('[data-player-two-heading]')!.textContent =
		players[1].username;

	let scoreOne = 0;
	let scoreTwo = 0;
	const rows: Array<{
		category: StatCategory;
		row: HTMLElement;
		comparison: number;
		weight: number;
	}> = [];
	for (const category of Object.keys(categoryWeights) as StatCategory[]) {
		const firstValue = getStatValue(category, stats[0]);
		const secondValue = getStatValue(category, stats[1]);
		const row = scoreboard.querySelector<HTMLElement>(`[data-stat-row="${category}"]`)!;
		const firstCell = row.querySelector<HTMLElement>('[data-comparison-one]')!;
		const secondCell = row.querySelector<HTMLElement>('[data-comparison-two]')!;
		const comparison = Math.sign(firstValue - secondValue);

		firstCell.textContent = displayStat(category, stats[0]);
		secondCell.textContent = displayStat(category, stats[1]);
		firstCell.removeAttribute('data-winner');
		secondCell.removeAttribute('data-winner');
		row.removeAttribute('data-tied');
		row.dataset.revealed = 'false';

		if (comparison > 0) {
			firstCell.dataset.winner = 'true';
		} else if (comparison < 0) {
			secondCell.dataset.winner = 'true';
		} else {
			row.dataset.tied = 'true';
		}
		rows.push({ category, row, comparison, weight: categoryWeights[category] });
	}

	scoreboard.querySelector<HTMLElement>('[data-score-one]')!.textContent = '0%';
	scoreboard.querySelector<HTMLElement>('[data-score-two]')!.textContent = '0%';
	scoreboard.querySelector<HTMLElement>('[data-result]')!.textContent = 'ANALYZING COMBAT DATA';
	scoreboard.querySelector<HTMLElement>('[data-result]')!.removeAttribute('data-glitch');
	const systemLog = scoreboard.querySelector<HTMLElement>('[data-system-log]');
	const systemLogOutput = scoreboard.querySelector<HTMLElement>('[data-system-log-output]');
	if (systemLog) systemLog.hidden = true;
	systemLogOutput?.replaceChildren();
	scoreboard.hidden = false;
	return { scoreboard, rows };
}

function renderSystemLog(
	scoreboard: HTMLElement,
	players: [PlayerRequest, PlayerRequest],
	stats: [PlayerStats, PlayerStats],
	scoreOne: number,
	scoreTwo: number,
) {
	const systemLog = scoreboard.querySelector<HTMLElement>('[data-system-log]');
	const output = scoreboard.querySelector<HTMLElement>('[data-system-log-output]');
	if (!systemLog || !output) return;

	const [one, two] = players;
	const [statsOne, statsTwo] = stats;
	const lines = [
		`> CONTRIBUTIONS: ${one.username} ${new Intl.NumberFormat().format(statsOne.total)} | ${two.username} ${new Intl.NumberFormat().format(statsTwo.total)}`,
		`> STREAKS: ${one.username} ${statsOne.longestStreak}d (current ${statsOne.currentStreak}d) | ${two.username} ${statsTwo.longestStreak}d (current ${statsTwo.currentStreak}d)`,
		`> PEAK DAY: ${one.username} ${statsOne.peakCount} (${statsOne.peakDate}) | ${two.username} ${statsTwo.peakCount} (${statsTwo.peakDate})`,
		scoreOne === scoreTwo
			? `> CONSISTENCY: ${one.username} ${statsOne.consistency.toFixed(1)}% | ${two.username} ${statsTwo.consistency.toFixed(1)}% — STALEMATE`
			: `> CONSISTENCY: ${one.username} ${statsOne.consistency.toFixed(1)}% | ${two.username} ${statsTwo.consistency.toFixed(1)}% — DOMINANCE CONFIRMED: ${scoreOne > scoreTwo ? one.username : two.username}`,
	];
	output.replaceChildren(
		...lines.map((text) => {
			const line = document.createElement('p');
			line.className = 'system-log-line';
			line.textContent = text;
			return line;
		}),
	);
	systemLog.hidden = false;
}

async function revealScoreboard(
	players: [PlayerRequest, PlayerRequest],
	stats: [PlayerStats, PlayerStats],
	currentRequest: number,
) {
	const rendered = renderScoreboard(players, stats);
	if (!rendered) return;
	let scoreOne = 0;
	let scoreTwo = 0;

	for (let index = 0; index < rendered.rows.length; index += 1) {
		if (index > 0) await delay(400);
		if (currentRequest !== requestId) return;

		const { row, comparison, weight } = rendered.rows[index];
		row.dataset.revealed = 'true';
		playSound('data-hit');
		if (comparison > 0) scoreOne += weight;
		else if (comparison < 0) scoreTwo += weight;
		else {
			scoreOne += weight / 2;
			scoreTwo += weight / 2;
		}

		setIntegrity('one', scoreOne);
		setIntegrity('two', scoreTwo);
		rendered.scoreboard.querySelector<HTMLElement>('[data-score-one]')!.textContent =
			`${scoreOne.toFixed(1)}%`;
		rendered.scoreboard.querySelector<HTMLElement>('[data-score-two]')!.textContent =
			`${scoreTwo.toFixed(1)}%`;
	}

	if (currentRequest !== requestId) return;
	const result = rendered.scoreboard.querySelector<HTMLElement>('[data-result]')!;
	const outcome = calculateBattleScores(stats);
	if (outcome.winner === 'tie') {
		result.textContent = 'STALEMATE';
	} else {
		const winner = players[outcome.winner === 'one' ? 0 : 1];
		result.textContent = `SYSTEM OVERRIDE: ${winner.username.toUpperCase()} WINS`;
	}
	result.dataset.text = result.textContent;
	result.dataset.glitch = 'true';
	renderSystemLog(rendered.scoreboard, players, stats, scoreOne, scoreTwo);
	playSound('victory');
	document.body.classList.remove('duel-jitter');
	void document.body.offsetWidth;
	document.body.classList.add('duel-jitter');
	window.setTimeout(() => document.body.classList.remove('duel-jitter'), 500);
}

async function runBattle(one: string, two: string) {
	if (!form || !submitButton) return;
	const currentRequest = ++requestId;
	const players: [PlayerRequest, PlayerRequest] = [
		{ player: 'one', label: 'Player 1', username: one },
		{ player: 'two', label: 'Player 2', username: two },
	];
	const scoreboard = document.querySelector<HTMLElement>('[data-scoreboard]');
	submitButton.disabled = true;
	try {
		if (scoreboard) scoreboard.hidden = true;
		resetIntegrity();
		for (const player of players) setLoading(player);

		playSound('sweep');
		const bootSequence = startBootSequence(currentRequest);
		const [results] = await Promise.all([
			Promise.allSettled(players.map(({ username }) => fetchCalendar(username))),
			bootSequence,
		]);
		if (currentRequest !== requestId) return;

		const failures: string[] = [];
		const calendars: Array<ContributionCalendar | undefined> = [];
		for (let index = 0; index < results.length; index += 1) {
			const result = results[index];
			const request = players[index];
			if (result.status === 'fulfilled') {
				try {
					renderCalendar(request, result.value);
					const stats = calculateStats(result.value);
					renderPlayerStats(request.player, stats);
					calendars[index] = result.value;
				} catch (error) {
					const message =
						error instanceof Error ? error.message : `Could not render ${request.label}'s calendar.`;
					setError(request, message);
					failures.push(`${request.label}: ${message}`);
				}
			} else {
				const message =
					result.reason instanceof Error
						? result.reason.message
						: `Could not load ${request.label}'s contribution calendar.`;
				setError(request, message);
				if (
					result.reason instanceof ContributionRequestError &&
					result.reason.status === 400
				) {
					form
						.querySelector<HTMLInputElement>(
							`[name="${request.player === 'one' ? 'playerOne' : 'playerTwo'}"]`,
						)
						?.setAttribute('aria-invalid', 'true');
				}
				failures.push(`${request.label}: ${message}`);
			}
		}

		if (failures.length) {
			await typeTerminalLine('> ACCESS DENIED', currentRequest, 'error');
			updateStatus(failures.join(' '), 'error');
			return;
		}

		if (calendars[0] && calendars[1]) {
			await waitForHeatmapReveal();
			if (currentRequest !== requestId) return;
			await typeTerminalLine('> ACCESS GRANTED', currentRequest);
			if (currentRequest !== requestId) return;
			await revealScoreboard(
				players,
				[calculateStats(calendars[0]), calculateStats(calendars[1])],
				currentRequest,
			);
		}
		if (currentRequest === requestId) updateStatus('Duel sequence complete.', 'success');
	} catch (error) {
		if (currentRequest !== requestId) return;

		const message =
			error instanceof Error
				? `Duel sequence failed: ${error.message}`
				: 'Duel sequence failed unexpectedly. Please try again.';
		for (const player of players) setError(player, message);
		if (scoreboard) scoreboard.hidden = true;
		resetIntegrity();
		if (bootScreen && bootOutput) {
			const line = document.createElement('p');
			line.className = 'boot-line';
			line.dataset.state = 'error';
			line.textContent = '> ACCESS DENIED';
			bootOutput.replaceChildren(line);
			bootScreen.hidden = false;
		}
		updateStatus(message, 'error');
	} finally {
		if (currentRequest === requestId) submitButton.disabled = false;
	}
}

form?.addEventListener('submit', (event) => {
	event.preventDefault();
	if (!form) return;
	playSound('blip');

	const formData = new FormData(form);
	const one = String(formData.get('playerOne') ?? '').trim();
	const two = String(formData.get('playerTwo') ?? '').trim();
	if (!one || !two) {
		const missingInput = form.querySelector<HTMLInputElement>(
			`[name="${!one ? 'playerOne' : 'playerTwo'}"]`,
		);
		form.querySelectorAll<HTMLInputElement>('[name="playerOne"], [name="playerTwo"]').forEach((input) => {
			if (input === missingInput) input.setAttribute('aria-invalid', 'true');
			else input.removeAttribute('aria-invalid');
		});
		updateStatus('Enter both GitHub usernames to start the duel.', 'error');
		missingInput?.focus();
		return;
	}
	form.querySelectorAll<HTMLInputElement>('[name="playerOne"], [name="playerTwo"]').forEach((input) => {
		input.removeAttribute('aria-invalid');
	});
	const url = new URL(window.location.href);
	url.searchParams.set('p1', one);
	url.searchParams.set('p2', two);
	window.history.replaceState(null, '', url);
	void runBattle(one, two);
});

form?.querySelectorAll<HTMLInputElement>('[name="playerOne"], [name="playerTwo"]').forEach((input) => {
	input.addEventListener('input', () => input.removeAttribute('aria-invalid'));
});

document.querySelectorAll<HTMLButtonElement>('[data-matchup]').forEach((button) => {
	button.addEventListener('click', () => {
		playSound('blip');
		if (!form) return;
		const matchup = button.dataset.matchup?.split(',') ?? [];
		const [one, two] = matchup;
		if (!one || !two) return;

		form.querySelector<HTMLInputElement>('[name="playerOne"]')!.value = one;
		form.querySelector<HTMLInputElement>('[name="playerTwo"]')!.value = two;
		form.requestSubmit();
	});
});

soundToggle?.addEventListener('click', () => {
	const enabled = setSfxEnabled(!isSfxEnabled());
	soundToggle.textContent = `SFX: ${enabled ? 'ON' : 'OFF'}`;
	soundToggle.setAttribute('aria-label', `Turn sound effects ${enabled ? 'off' : 'on'}`);
	soundToggle.setAttribute('aria-pressed', String(enabled));
	if (enabled) playSound('blip');
});

if (form) {
	const url = new URL(window.location.href);
	const one = url.searchParams.get('p1')?.trim() ?? '';
	const two = url.searchParams.get('p2')?.trim() ?? '';
	const playerOneInput = form.querySelector<HTMLInputElement>('[name="playerOne"]');
	const playerTwoInput = form.querySelector<HTMLInputElement>('[name="playerTwo"]');

	if (one && playerOneInput) playerOneInput.value = one;
	if (two && playerTwoInput) playerTwoInput.value = two;
	if (one && two) form.requestSubmit();
}
