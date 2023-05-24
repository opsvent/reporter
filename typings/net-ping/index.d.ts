declare module 'net-ping' {
	export interface PingSession {
		pingHost: (target: string, cb: (error: Error | null, target: string, sent: number, rcvd: number) => void) => void;
	}

	enum NetworkProtocol {
		IPv4,
		IPv6
	}

	export const NetworkProtocol: NetworkProtocol

	export interface SessionOptions {
		networkProtocol?: NetworkProtocol;
		packetSize?: number;
		retries?: number;
		sessionId?: number;
		timeout?: number;
		ttl?: number;
	}

	export type CreateSessionFn = (options?: SessionOptions) => PingSession;

	export const createSession: CreateSessionFn
}