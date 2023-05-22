interface ErrorResponse {
	statusCode: number;
	error: string;
	message: string;
}

export const isErrorResponse = (response: any): response is ErrorResponse => {
	return !!response?.error;
};

export default ErrorResponse;
