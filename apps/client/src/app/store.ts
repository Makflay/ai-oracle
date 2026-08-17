import { configureStore } from "@reduxjs/toolkit";
import { entitiesReducer } from "../features/entities/entitiesSlice";
import { forecastReducer } from "../features/forecasts/forecastSlice";
import { historyReducer } from "../features/history/historySlice";

export const store = configureStore({
  reducer: {
    entities: entitiesReducer,
    forecasts: forecastReducer,
    history: historyReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;

export type AppDispatch = typeof store.dispatch;
