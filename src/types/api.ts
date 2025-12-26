export interface APIResponse<T> {
  data: T;
  reply?: string;
}

export interface APIError {
  error: {
    message: string;
    statusCode: number;
    stack?: string;
  };
}

