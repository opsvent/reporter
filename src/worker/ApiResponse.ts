import ErrorResponse from './ErrorResponse.js';

type ApiResponse<T> = T | ErrorResponse;

export default ApiResponse;
