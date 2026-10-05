import { removeItem } from './endpoints/playlists';

// Spotify's Remove Items from Playlist endpoint takes the tracks payload on the
// DELETE body. So the client has to forward the body on DELETE (it used to drop
// it), and the endpoint has to build the payload instead of spreading the raw
// input, which would leak playlist_id — a path segment — into the body.
describe('spotify playlists.removeItem request body', () => {
	const realFetch = global.fetch;
	afterEach(() => {
		global.fetch = realFetch;
	});

	function stubFetch() {
		const captured: { method?: string; body?: RequestInit['body'] } = {};
		global.fetch = (async (_url: string, init: RequestInit) => {
			captured.method = init.method;
			captured.body = init.body;
			return {
				ok: true,
				status: 200,
				headers: { get: () => 'application/json' },
				json: async () => ({ snapshot_id: 'snapshot-1' }),
			} as unknown as Response;
		}) as unknown as typeof fetch;
		return captured;
	}

	const ctx = {
		key: 'test-token',
		$getAccountId: async () => 'account-1',
	};

	it('sends the tracks payload and no playlist_id', async () => {
		const captured = stubFetch();

		await removeItem(ctx as never, {
			playlist_id: 'playlist-123',
			tracks: [{ uri: 'spotify:track:4uLU6hMCjMI75M1A2tKUQC' }],
		});

		expect(captured.method).toBe('DELETE');
		const body = JSON.parse(captured.body as string);
		expect(body).toEqual({
			tracks: [{ uri: 'spotify:track:4uLU6hMCjMI75M1A2tKUQC' }],
		});
		expect(body).not.toHaveProperty('playlist_id');
	});

	it('forwards snapshot_id when one is given', async () => {
		const captured = stubFetch();

		await removeItem(ctx as never, {
			playlist_id: 'playlist-123',
			tracks: [{ uri: 'spotify:track:4uLU6hMCjMI75M1A2tKUQC' }],
			snapshot_id: 'snapshot-0',
		});

		expect(JSON.parse(captured.body as string)).toEqual({
			tracks: [{ uri: 'spotify:track:4uLU6hMCjMI75M1A2tKUQC' }],
			snapshot_id: 'snapshot-0',
		});
	});

	it('omits snapshot_id when it is absent', async () => {
		const captured = stubFetch();

		await removeItem(ctx as never, {
			playlist_id: 'playlist-123',
			tracks: [{ uri: 'spotify:track:4uLU6hMCjMI75M1A2tKUQC' }],
		});

		expect(JSON.parse(captured.body as string)).not.toHaveProperty(
			'snapshot_id',
		);
	});
});
