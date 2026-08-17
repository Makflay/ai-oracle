import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";

import type {
  DeveloperInterestForecastDto,
  ProjectForecastDto,
} from "@ai-oracle/shared";

import {
  getDeveloperInterestForecast,
  getProjectForecast,
  ApiClientError,
} from "../../api";

interface ProjectForecastRequestError {
  message: string;
  notFound: boolean;
}

export interface ForecastState {
  projectForecasts: Record<string, ProjectForecastDto>;
  projectLoading: Record<string, boolean>;
  projectErrors: Record<string, string | null>;
  projectNotFound: Record<string, boolean>;
  developerInterest: DeveloperInterestForecastDto | null;
  developerInterestLoading: boolean;
  developerInterestError: string | null;
}

const initialState: ForecastState = {
  projectForecasts: {},
  projectLoading: {},
  projectErrors: {},
  projectNotFound: {},
  developerInterest: null,
  developerInterestLoading: false,
  developerInterestError: null,
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
    rejectValue: ProjectForecastRequestError;
  }
>("forecasts/fetchProjectForecast", async (entityId, { rejectWithValue }) => {
  try {
    return await getProjectForecast(entityId);
  } catch (error: unknown) {
    return rejectWithValue({
      message: getErrorMessage(error),
      notFound: error instanceof ApiClientError && error.statusCode === 404,
    });
  }
});

export const fetchDeveloperInterestForecast = createAsyncThunk<
  DeveloperInterestForecastDto,
  void,
  {
    rejectValue: string;
  }
>(
  "forecasts/fetchDeveloperInterestForecast",
  async (_, { rejectWithValue }) => {
    try {
      return await getDeveloperInterestForecast();
    } catch (error: unknown) {
      return rejectWithValue(getErrorMessage(error));
    }
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
      .addCase(fetchDeveloperInterestForecast.pending, (state) => {
        state.developerInterestLoading = true;
        state.developerInterestError = null;
      })
      .addCase(fetchDeveloperInterestForecast.fulfilled, (state, action) => ({
        ...state,
        developerInterest: action.payload,
        developerInterestLoading: false,
        developerInterestError: null,
      }))
      .addCase(fetchDeveloperInterestForecast.rejected, (state, action) => {
        state.developerInterestLoading = false;
        state.developerInterestError =
          action.payload ?? "Unable to load developer interest forecast";
      });
  },
});

export const forecastReducer = forecastSlice.reducer;
