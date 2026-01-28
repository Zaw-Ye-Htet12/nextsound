import { configureStore } from '@reduxjs/toolkit';
import { itunesApi } from '@/services/ItunesAPI';
import { musicApi } from '@/services/MusicAPI';
import { deezerApi } from '@/services/DeezerAPI';

export const store = configureStore({
  reducer: {
    // iTunes API
    [itunesApi.reducerPath]: itunesApi.reducer,
    // Unified Music API
    [musicApi.reducerPath]: musicApi.reducer,
    // Deezer API
    [deezerApi.reducerPath]: deezerApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(
      itunesApi.middleware,
      musicApi.middleware,
      deezerApi.middleware
    ),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;