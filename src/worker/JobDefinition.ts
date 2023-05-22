export enum JobType {
	http = 'http',
	ping = 'ping',
	keyword = 'keyword',
	script = 'script'
}

export enum PingIPVersion {
	ipv4 = 'ipv4',
	ipv6 = 'ipv6'
}

export interface JobDefinition {
	id: number;
	type: JobType;
	frequency: number;
}

export interface HTTPJobDefinition extends JobDefinition {
	type: JobType.http;
	endpoint: string;
	allowedHttpStatuses: (number | [number, number])[];
	timeout: number;
}

export interface PingJobDefinition extends JobDefinition {
	type: JobType.ping;
	version: PingIPVersion;
	endpoint: string;
	timeout: number;
}

export interface KeywordJobDefinition extends JobDefinition {
	type: JobType.keyword;
	endpoint: string;
	keywords: string[];
	timeout: number;
}

export interface ScriptJobDefinition extends JobDefinition {
	type: JobType.script;
	script: string;
	timeout: number;
}
