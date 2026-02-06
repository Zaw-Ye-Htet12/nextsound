import { lazy, Suspense, useState, useEffect } from "react";
import { Routes, Route } from "react-router-dom";

import {
  Header,
  Footer,
  SideBar,
  ScrollToTop,
  Loader,
  ErrorBoundary,
} from "@/common";
import { CommandPalette } from "@/components/ui/CommandPalette";
import { MiniPlayer } from "@/components/ui/MiniPlayer";
import { QueueDrawer } from "@/components/ui/QueueDrawer";
import { ChatWidget } from "@/components/ui/ChatWidget";
import { useAudioPlayerContext } from "@/context/audioPlayerContext";
import { Toaster } from "sonner";
import PublicRoute from "@/components/auth/PublicRoute";
import ProtectedRoute from "@/components/auth/ProtectedRoute";

import "react-loading-skeleton/dist/skeleton.css";
import "swiper/css";

const Home = lazy(() => import("./pages/Home"));
const Library = lazy(() => import("./pages/Library"));
const ArtistsPage = lazy(() => import("./pages/Artists"));
const MusicsPage = lazy(() => import("./pages/Musics"));
const ArtistPage = lazy(() => import("./pages/Artist"));
const LoginPage = lazy(() => import("./pages/Auth/LoginPage"));
const RegisterPage = lazy(() => import("./pages/Auth/RegisterPage"));
const ForgotPasswordPage = lazy(() => import("./pages/Auth/ForgotPasswordPage"));
const UpdatePasswordPage = lazy(() => import("./pages/Auth/UpdatePasswordPage"));
const VerifyEmailPage = lazy(() => import("./pages/Auth/VerifyEmailPage"));
const NotFound = lazy(() => import("./pages/NotFound"));
const SearchPage = lazy(() => import("./pages/SearchPage"));
const AlbumPage = lazy(() => import("./pages/Album"));

const App = () => {
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const {
    playTrack,
    currentTrack,
    isPlaying,
    progress,
    volume,
    isShuffled,
    repeatMode,
    isMinimized,
    togglePlay,
    skipNext,
    skipPrevious,
    seek,
    setVolume,
    toggleShuffle,
    toggleRepeat,
    toggleFavorite,
    toggleMinimize,
    closePlayer,
    toggleQueue,
    favorites
  } = useAudioPlayerContext();

  // Global keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd+K or Ctrl+K to open command palette
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen(true);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <>
      <SideBar onOpenSearch={() => setIsCommandPaletteOpen(true)} />
      <Header onOpenSearch={() => setIsCommandPaletteOpen(true)} />
      <main className="transition-all duration-300 lg:pb-14 md:pb-4 sm:pb-2 xs:pb-1 pb-0 bg-white dark:bg-deep-dark min-h-screen">
        <ScrollToTop>
          <ErrorBoundary>
            <Suspense fallback={<Loader />}>
              <Routes>
                <Route path="/" element={<Home />} />
                <Route element={<ProtectedRoute />}>
                  <Route path="/library" element={<Library />} />
                </Route>
                <Route path="/artists" element={<ArtistsPage />} />
                <Route path="/musics" element={<MusicsPage />} />
                <Route path="/artists" element={<ArtistsPage />} />
                <Route path="/musics" element={<MusicsPage />} />
                <Route path="/artist/:name" element={<ArtistPage />} />
                <Route path="/album/:id" element={<AlbumPage />} />
                <Route path="/search/:query" element={<SearchPage />} />
                <Route element={<PublicRoute />}>
                  <Route path="/login" element={<LoginPage />} />
                  <Route path="/register" element={<RegisterPage />} />
                  <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                  <Route path="/verify-email" element={<VerifyEmailPage />} />
                </Route>
                <Route path="/update-password" element={<UpdatePasswordPage />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </ErrorBoundary>
        </ScrollToTop>
      </main>

      {/* Command Palette */}
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        onItemSelect={(item) => {
          if (item.type === 'track' && item.data) {
            playTrack(item.data);
          }
        }}
      />

      <Footer />

      {/* Player Components */}
      <QueueDrawer />
      {currentTrack && (
        <MiniPlayer
          currentTrack={currentTrack}
          isPlaying={isPlaying}
          progress={progress}
          volume={volume}
          isShuffled={isShuffled}
          repeatMode={repeatMode}
          isMinimized={isMinimized}
          onTogglePlay={togglePlay}
          onSkipNext={skipNext}
          onSkipPrevious={skipPrevious}
          onSeek={seek}
          onVolumeChange={setVolume}
          onToggleShuffle={toggleShuffle}
          onToggleRepeat={toggleRepeat}
          onToggleFavorite={async () => await toggleFavorite(currentTrack)}
          onToggleMinimize={toggleMinimize}
          onClose={closePlayer}
          onToggleQueue={toggleQueue}
          isFavorite={favorites.some((t) => t.id === currentTrack.id)}
        />
      )}
      <Toaster richColors position="top-center" />
      <ChatWidget />
    </>
  );
};

export default App;
