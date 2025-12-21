export interface APIResponse<T> {
  data: T;
}

export interface APIError {
  error: {
    message: string;
    statusCode: number;
    stack?: string;
  };
}

