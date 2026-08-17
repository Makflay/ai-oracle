import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";

import type { ForecastEntity } from "@ai-oracle/shared";

import { getEntities } from "../../api";

export interface EntitiesState {
  items: ForecastEntity[];
  loading: boolean;
  error: string | null;
}

const initialState: EntitiesState = {
  items: [],
  loading: false,
  error: null,
};

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return "Unable to load entities";
}

export const fetchEntities = createAsyncThunk<
  ForecastEntity[],
  void,
  {
    rejectValue: string;
  }
>("entities/fetchEntities", async (_, { rejectWithValue }) => {
  try {
    const entities = await getEntities();

    return [...entities];
  } catch (error: unknown) {
    return rejectWithValue(getErrorMessage(error));
  }
});

const entitiesSlice = createSlice({
  name: "entities",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchEntities.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchEntities.fulfilled, (state, action) => {
        state.items = action.payload;
        state.loading = false;
        state.error = null;
      })
      .addCase(fetchEntities.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload ?? "Unable to load entities";
      });
  },
});

export const entitiesReducer = entitiesSlice.reducer;
