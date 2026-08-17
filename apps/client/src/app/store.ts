import { configureStore } from "@reduxjs/toolkit";
import { entitiesReducer } from "../features/entities/entitiesSlice";
import { forecastReducer } from "../features/forecasts/forecastSlice";

export const store = configureStore({
  reducer: {
    entities: entitiesReducer,
    forecasts: forecastReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;

export type AppDispatch = typeof store.dispatch;
