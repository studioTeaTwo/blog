import { L402server } from './constants';

// ref: github.com/studioTeaTwo/simple-l402-server/l402.go
export type ApiResponse = {
	result: boolean;
	reason: string;
};
type fetch = typeof fetch;

export async function createInvoice(fetch: fetch) {
	const res = await fetch(`${L402server}/createInvoice`);
	const body: ApiResponse = await res.json();
	if (body.reason !== '') {
		throw new Error(body.reason);
	}

	const challenge = res.headers.get('WWW-Authenticate');
	console.log('header', challenge);
	return getToken(challenge);
}

export async function verify(macaroon: string, preimage: string, fetch: fetch) {
	// TODO: replace "LSAT" to "L402"
	const authroizaiton = { Authorization: `LSAT ${macaroon}:${preimage}` };
	const res = await fetch(`${L402server}/verify`, {
		headers: authroizaiton
	});
	const body: ApiResponse = await res.json();
	return {
		status: res.status,
		...body
	};
}

// Parse cookie
export function isValidL402token(record) {
	if (record == null) {
		return false;
	}
	const r = JSON.parse(record);
	if (!r.macaroon || !r.preimage) {
		return false;
	}
	return true;
}

// Parse cookie
export function isWaitingToPayInvoice(record) {
	if (record == null) {
		return false;
	}
	const r = JSON.parse(record);
	if (!r.macaroon || !r.invoice) {
		return false;
	}
	return true;
}

// @challenge "L402 macaroon=X invoice=Y"
function getToken(challenge: string) {
	const tokens = challenge.split(' ');
	const macaroon = tokens[1].replace('macaroon=', '');
	const invoice = tokens[2].replace('invoice=', '');
	return {
		macaroon,
		invoice
	};
}
