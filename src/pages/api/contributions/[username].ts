import type { APIRoute } from 'astro';
import { isGitHubUsername, normalizeCalendar } from '../../../lib/contribution-engine.ts';

export const prerender = false;

const cacheHeaders = {
	'Content-Type': 'application/json; charset=utf-8',
	'Cache-Control': 'public, max-age=300',
};

const jsonResponse = (body: unknown, status = 200) =>
	new Response(JSON.stringify(body), { status, headers: cacheHeaders });

export const GET: APIRoute = async ({ params }) => {
	const username = params.username;
	if (!username || !isGitHubUsername(username)) {
		return jsonResponse({ error: 'Invalid GitHub username' }, 400);
	}

	let upstreamResponse: Response;
	try {
		upstreamResponse = await fetch(`https://github.com/${username}.contribs`);
	} catch {
		return jsonResponse({ error: 'Failed to fetch contribution data from GitHub' }, 502);
	}

	if (upstreamResponse.status === 404) {
		return jsonResponse({ error: 'GitHub user not found' }, 404);
	}
	if (!upstreamResponse.ok) {
		return jsonResponse({ error: 'GitHub contribution service returned an error' }, 502);
	}

	let payload: unknown;
	try {
		payload = await upstreamResponse.json();
	} catch {
		return jsonResponse({ error: 'GitHub returned invalid contribution data' }, 502);
	}

	const calendar = normalizeCalendar(payload, username);
	if (!calendar) {
		return jsonResponse({ error: 'GitHub returned invalid contribution data' }, 502);
	}

	return jsonResponse(calendar);
};
