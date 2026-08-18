import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";

import type {
  DeveloperInterestForecastDto,
  ProjectForecastDto,
  DeveloperInterestRefreshDto,
  ProjectForecastRefreshDto,
} from "@ai-oracle/shared";

import {
  DeveloperInterestApiErrorCode,
  ProjectForecastApiErrorCode,
} from "@ai-oracle/shared";

import {
  getDeveloperInterestForecast,
  getProjectForecast,
  ApiClientError,
  refreshDeveloperInterestForecast as requestDeveloperInterestRefresh,
  refreshProjectForecast as requestProjectForecastRefresh,
} from "../../api";

interface ForecastRequestError {
  message: string;
  notFound: boolean;
}

export interface ForecastState {
  projectForecasts: Record<string, ProjectForecastDto>;
  projectLoading: Record<string, boolean>;
  projectErrors: Record<string, string | null>;
  projectNotFound: Record<string, boolean>;

  projectRefreshing: Record<string, boolean>;
  projectRefreshErrors: Record<string, string | null>;
  projectRefreshResults: Record<string, boolean | null>;

  developerInterest: DeveloperInterestForecastDto | null;
  developerInterestLoading: boolean;
  developerInterestError: string | null;
  developerInterestNotFound: boolean;

  developerInterestRefreshing: boolean;
  developerInterestRefreshError: string | null;
  developerInterestRefreshResult: boolean | null;
}

const initialState: ForecastState = {
  projectForecasts: {},
  projectLoading: {},
  projectErrors: {},
  projectNotFound: {},

  projectRefreshing: {},
  projectRefreshErrors: {},
  projectRefreshResults: {},

  developerInterest: null,
  developerInterestLoading: false,
  developerInterestError: null,
  developerInterestNotFound: false,

  developerInterestRefreshing: false,
  developerInterestRefreshError: null,
  developerInterestRefreshResult: null,
};

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return "Unable to load forecast";
}

export const fetchProjectForecast = createAsyncThunk<
  ProjectForecastDto,
  string,
  {
    rejectValue: ForecastRequestError;
  }
>("forecasts/fetchProjectForecast", async (entityId, { rejectWithValue }) => {
  try {
    return await getProjectForecast(entityId);
  } catch (error: unknown) {
    return rejectWithValue({
      message: getErrorMessage(error),
      notFound:
        error instanceof ApiClientError &&
        error.code === ProjectForecastApiErrorCode.ForecastNotFound,
    });
  }
});

export const fetchDeveloperInterestForecast = createAsyncThunk<
  DeveloperInterestForecastDto,
  void,
  {
    rejectValue: ForecastRequestError;
  }
>(
  "forecasts/fetchDeveloperInterestForecast",
  async (_, { rejectWithValue }) => {
    try {
      return await getDeveloperInterestForecast();
    } catch (error: unknown) {
      return rejectWithValue({
        message: getErrorMessage(error),
        notFound:
          error instanceof ApiClientError &&
          error.code === DeveloperInterestApiErrorCode.ForecastNotFound,
      });
    }
  },
);

export const refreshProjectForecast = createAsyncThunk<
  ProjectForecastRefreshDto,
  string,
  {
    state: {
      forecasts: ForecastState;
    };
    rejectValue: string;
  }
>(
  "forecasts/refreshProjectForecast",
  async (entityId, { rejectWithValue }) => {
    try {
      return await requestProjectForecastRefresh(entityId);
    } catch (error: unknown) {
      return rejectWithValue(getErrorMessage(error));
    }
  },
  {
    condition: (entityId, { getState }) =>
      !(getState().forecasts.projectRefreshing[entityId] ?? false),
  },
);

export const refreshDeveloperInterestForecast = createAsyncThunk<
  DeveloperInterestRefreshDto,
  void,
  {
    state: {
      forecasts: ForecastState;
    };
    rejectValue: string;
  }
>(
  "forecasts/refreshDeveloperInterestForecast",
  async (_, { rejectWithValue }) => {
    try {
      return await requestDeveloperInterestRefresh();
    } catch (error: unknown) {
      return rejectWithValue(getErrorMessage(error));
    }
  },
  {
    condition: (_, { getState }) =>
      !getState().forecasts.developerInterestRefreshing,
  },
);

const forecastSlice = createSlice({
  name: "forecasts",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchProjectForecast.pending, (state, action) => {
        const entityId = action.meta.arg;

        state.projectLoading[entityId] = true;
        state.projectErrors[entityId] = null;
        state.projectNotFound[entityId] = false;
      })
      .addCase(fetchProjectForecast.fulfilled, (state, action) => {
        const entityId = action.meta.arg;

        return {
          ...state,
          projectForecasts: {
            ...state.projectForecasts,
            [entityId]: action.payload,
          },
          projectLoading: {
            ...state.projectLoading,
            [entityId]: false,
          },
          projectErrors: {
            ...state.projectErrors,
            [entityId]: null,
          },
          projectNotFound: {
            ...state.projectNotFound,
            [entityId]: false,
          },
        };
      })
      .addCase(fetchProjectForecast.rejected, (state, action) => {
        const entityId = action.meta.arg;

        state.projectLoading[entityId] = false;
        state.projectErrors[entityId] =
          action.payload?.message ?? "Unable to load project forecast";
        state.projectNotFound[entityId] = action.payload?.notFound ?? false;
      })
      .addCase(refreshProjectForecast.pending, (state, action) => {
        const entityId = action.meta.arg;

        state.projectRefreshing[entityId] = true;
        state.projectRefreshErrors[entityId] = null;
        state.projectRefreshResults[entityId] = null;
      })
      .addCase(refreshProjectForecast.fulfilled, (state, action) => {
        const entityId = action.meta.arg;

        return {
          ...state,
          projectForecasts: {
            ...state.projectForecasts,
            [entityId]: action.payload.forecast,
          },
          projectRefreshing: {
            ...state.projectRefreshing,
            [entityId]: false,
          },
          projectRefreshErrors: {
            ...state.projectRefreshErrors,
            [entityId]: null,
          },
          projectRefreshResults: {
            ...state.projectRefreshResults,
            [entityId]: action.payload.refreshed,
          },
          projectNotFound: {
            ...state.projectNotFound,
            [entityId]: false,
          },
          projectErrors: {
            ...state.projectErrors,
            [entityId]: null,
          },
        };
      })
      .addCase(refreshProjectForecast.rejected, (state, action) => {
        const entityId = action.meta.arg;

        state.projectRefreshing[entityId] = false;
        state.projectRefreshErrors[entityId] =
          action.payload ?? "Unable to refresh project forecast";
        state.projectRefreshResults[entityId] = null;
      })
      .addCase(fetchDeveloperInterestForecast.pending, (state) => {
        state.developerInterestLoading = true;
        state.developerInterestError = null;
        state.developerInterestNotFound = false;
      })
      .addCase(fetchDeveloperInterestForecast.fulfilled, (state, action) => ({
        ...state,
        developerInterest: action.payload,
        developerInterestLoading: false,
        developerInterestError: null,
        developerInterestNotFound: false,
      }))
      .addCase(fetchDeveloperInterestForecast.rejected, (state, action) => {
        state.developerInterestLoading = false;
        state.developerInterestError =
          action.payload?.message ??
          "Unable to load developer interest forecast";
        state.developerInterestNotFound = action.payload?.notFound ?? false;
      })
      .addCase(refreshDeveloperInterestForecast.pending, (state) => {
        state.developerInterestRefreshing = true;
        state.developerInterestRefreshError = null;
        state.developerInterestRefreshResult = null;
      })
      .addCase(refreshDeveloperInterestForecast.fulfilled, (state, action) => ({
        ...state,
        developerInterest: action.payload.forecast,
        developerInterestRefreshing: false,
        developerInterestRefreshError: null,
        developerInterestRefreshResult: action.payload.refreshed,
        developerInterestLoading: false,
        developerInterestError: null,
        developerInterestNotFound: false,
      }))
      .addCase(refreshDeveloperInterestForecast.rejected, (state, action) => {
        state.developerInterestRefreshing = false;
        state.developerInterestRefreshError =
          action.payload ?? "Unable to refresh developer interest forecast";
        state.developerInterestRefreshResult = null;
      });
  },
});

export const forecastReducer = forecastSlice.reducer;
