export enum ApiStatus {
  Success = "success",
  Error = "error",
}

export interface ApiSuccessResponse<TData> {
  status: ApiStatus.Success;
  data: TData;
}

export interface ApiErrorResponse {
  status: ApiStatus.Error;
  error: {
    message: string;
  };
}

export type ApiResponse<TData> = ApiSuccessResponse<TData> | ApiErrorResponse;
