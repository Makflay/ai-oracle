import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";

import type {
  ForecastHistoryItemDto,
  ForecastStatus,
  ForecastType,
} from "@ai-oracle/shared";

import { getForecastHistory } from "../../api";

import type { ForecastHistoryFilters } from "../../api";

export interface HistoryFilters {
  entityId: string | null;
  forecastType: ForecastType | null;
  status: ForecastStatus | null;
}

export interface HistoryState {
  items: ForecastHistoryItemDto[];
  loading: boolean;
  error: string | null;
  filters: HistoryFilters;
}

const initialFilters: HistoryFilters = {
  entityId: null,
  forecastType: null,
  status: null,
};

const initialState: HistoryState = {
  items: [],
  loading: false,
  error: null,
  filters: initialFilters,
};

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return "Unable to load forecast history";
}

function toApiFilters(filters: HistoryFilters): ForecastHistoryFilters {
  const apiFilters: ForecastHistoryFilters = {};

  if (filters.entityId !== null) {
    apiFilters.entityId = filters.entityId;
  }

  if (filters.forecastType !== null) {
    apiFilters.forecastType = filters.forecastType;
  }

  if (filters.status !== null) {
    apiFilters.status = filters.status;
  }

  return apiFilters;
}

export const fetchForecastHistory = createAsyncThunk<
  ForecastHistoryItemDto[],
  void,
  {
    state: {
      history: HistoryState;
    };
    rejectValue: string;
  }
>("history/fetchForecastHistory", async (_, { getState, rejectWithValue }) => {
  try {
    const filters = getState().history.filters;
    const history = await getForecastHistory(toApiFilters(filters));

    return [...history];
  } catch (error: unknown) {
    return rejectWithValue(getErrorMessage(error));
  }
});

const historySlice = createSlice({
  name: "history",
  initialState,
  reducers: {
    setHistoryEntityId: (state, action: { payload: string | null }) => {
      state.filters.entityId = action.payload;
    },

    setHistoryForecastType: (
      state,
      action: { payload: ForecastType | null },
    ) => {
      state.filters.forecastType = action.payload;
    },

    setHistoryStatus: (state, action: { payload: ForecastStatus | null }) => {
      state.filters.status = action.payload;
    },

    resetHistoryFilters: (state) => {
      state.filters = {
        ...initialFilters,
      };
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchForecastHistory.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchForecastHistory.fulfilled, (state, action) => ({
        ...state,
        items: action.payload,
        loading: false,
        error: null,
      }))
      .addCase(fetchForecastHistory.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload ?? "Unable to load forecast history";
      });
  },
});

export const {
  resetHistoryFilters,
  setHistoryEntityId,
  setHistoryForecastType,
  setHistoryStatus,
} = historySlice.actions;

export const historyReducer = historySlice.reducer;
