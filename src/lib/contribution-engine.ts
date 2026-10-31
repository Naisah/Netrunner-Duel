export interface ContributionDay {
	date: string;
	count: number;
	level: number;
}

export interface ContributionWeek {
	firstDay: string;
	days: ContributionDay[];
}

export interface ContributionCalendar {
	username: string;
	totalContributions: number;
	from: string;
	to: string;
	weeks: ContributionWeek[];
}

export interface PlayerStats {
	total: number;
	longestStreak: number;
	currentStreak: number;
	peakCount: number;
	peakDate: string;
	consistency: number;
	weekendContributionRatio: number;
}

export type StatCategory = 'total' | 'longest' | 'current' | 'peak' | 'consistency';

export const categoryWeights: Record<StatCategory, number> = {
	total: 35,
	longest: 20,
	current: 15,
	peak: 15,
	consistency: 15,
};

const isDate = (value: unknown): value is string => {
	if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
		return false;
	}

	const date = new Date(`${value}T00:00:00.000Z`);
	return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
	typeof value === 'object' && value !== null && !Array.isArray(value);

const deriveIntensityLevel = (count: number) =>
	count === 0 ? 0 : Math.min(4, Math.ceil(count / 3));

export const isGitHubUsername = (username: string) =>
	/^(?=.{1,39}$)(?!.*--)[A-Za-z0-9]+(?:-[A-Za-z0-9]+)*$/.test(username);

export const normalizeCalendar = (
	payload: unknown,
	username: string,
): ContributionCalendar | null => {
	if (!isRecord(payload)) {
		return null;
	}

	const { from, to, total_contributions: totalContributions, weeks: sourceWeeks } = payload;
	if (
		!isDate(from) ||
		!isDate(to) ||
		typeof totalContributions !== 'number' ||
		!Number.isInteger(totalContributions) ||
		totalContributions < 0 ||
		!Array.isArray(sourceWeeks) ||
		sourceWeeks.length === 0
	) {
		return null;
	}

	const weeks: ContributionWeek[] = [];
	for (const sourceWeek of sourceWeeks) {
		if (
			!isRecord(sourceWeek) ||
			!isDate(sourceWeek.first_day) ||
			!Array.isArray(sourceWeek.contribution_days)
		) {
			return null;
		}

		const days: ContributionDay[] = [];
		const weekdays = new Set<number>();
		for (const sourceDay of sourceWeek.contribution_days) {
			if (!isRecord(sourceDay)) {
				return null;
			}

			const { weekday, count, level } = sourceDay;
			if (
				typeof weekday !== 'number' ||
				!Number.isInteger(weekday) ||
				weekday < 0 ||
				weekday > 6 ||
				weekdays.has(weekday) ||
				typeof count !== 'number' ||
				!Number.isInteger(count) ||
				count < 0
			) {
				return null;
			}

			weekdays.add(weekday);
			const firstDay = new Date(`${sourceWeek.first_day}T00:00:00.000Z`);
			const date = new Date(firstDay.getTime() + weekday * 86_400_000)
				.toISOString()
				.slice(0, 10);
			const validLevel =
				typeof level === 'number' && Number.isInteger(level) && level >= 0 && level <= 4;

			days.push({
				date,
				count,
				level: validLevel ? level : deriveIntensityLevel(count),
			});
		}

		if (weekdays.size !== 7) {
			return null;
		}

		days.sort((a, b) => a.date.localeCompare(b.date));
		weeks.push({ firstDay: sourceWeek.first_day, days });
	}

	return {
		username,
		totalContributions,
		from,
		to,
		weeks,
	};
};

function getCalendarDays(calendar: ContributionCalendar) {
	const from = Date.parse(`${calendar.from}T00:00:00Z`);
	const to = Date.parse(`${calendar.to}T00:00:00Z`);
	return calendar.weeks
		.flatMap((week) => week.days)
		.filter((day) => {
			const date = Date.parse(`${day.date}T00:00:00Z`);
			return date >= from && date <= to;
		})
		.sort((a, b) => a.date.localeCompare(b.date));
}

export function calculateStats(calendar: ContributionCalendar): PlayerStats {
	const days = getCalendarDays(calendar);
	let longestStreak = 0;
	let runningStreak = 0;
	let activeDays = 0;
	let peakDay: ContributionDay | undefined;
	let weekendContributions = 0;
	let totalContributions = 0;

	for (let index = 0; index < days.length; index += 1) {
		const day = days[index];
		const previousDay = days[index - 1];
		const dayOfWeek = new Date(`${day.date}T00:00:00Z`).getUTCDay();
		totalContributions += day.count;
		if (dayOfWeek === 0 || dayOfWeek === 6) weekendContributions += day.count;
		const isConsecutive =
			!previousDay ||
			Date.parse(`${day.date}T00:00:00Z`) - Date.parse(`${previousDay.date}T00:00:00Z`) ===
				86_400_000;

		if (day.count > 0) {
			activeDays += 1;
			runningStreak = isConsecutive ? runningStreak + 1 : 1;
			longestStreak = Math.max(longestStreak, runningStreak);
		} else {
			runningStreak = 0;
		}

		if (!peakDay || day.count > peakDay.count) peakDay = day;
	}

	let currentStreak = 0;
	for (let index = days.length - 1; index >= 0; index -= 1) {
		const day = days[index];
		if (day.count === 0) break;
		if (
			index < days.length - 1 &&
			Date.parse(`${days[index + 1].date}T00:00:00Z`) -
				Date.parse(`${day.date}T00:00:00Z`) !==
				86_400_000
		) {
			break;
		}
		currentStreak += 1;
	}

	return {
		total: calendar.totalContributions,
		longestStreak,
		currentStreak,
		peakCount: peakDay?.count ?? 0,
		peakDate: peakDay?.date ?? '—',
		consistency: days.length ? (activeDays / days.length) * 100 : 0,
		weekendContributionRatio: totalContributions
			? (weekendContributions / totalContributions) * 100
			: 0,
	};
}

export function getStatValue(category: StatCategory, stats: PlayerStats) {
	switch (category) {
		case 'total':
			return stats.total;
		case 'longest':
			return stats.longestStreak;
		case 'current':
			return stats.currentStreak;
		case 'peak':
			return stats.peakCount;
		case 'consistency':
			return stats.consistency;
	}
}

export function calculateBattleScores(stats: [PlayerStats, PlayerStats]) {
	let one = 0;
	let two = 0;

	for (const category of Object.keys(categoryWeights) as StatCategory[]) {
		const comparison = Math.sign(
			getStatValue(category, stats[0]) - getStatValue(category, stats[1]),
		);
		const weight = categoryWeights[category];
		if (comparison > 0) one += weight;
		else if (comparison < 0) two += weight;
		else {
			one += weight / 2;
			two += weight / 2;
		}
	}

	return {
		one,
		two,
		winner: one === two ? ('tie' as const) : one > two ? ('one' as const) : ('two' as const),
	};
}
