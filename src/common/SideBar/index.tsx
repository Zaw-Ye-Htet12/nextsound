import React, { useCallback } from "react";
import { AnimatePresence, m } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { LogOut, Library, ChevronsUpDown, Home } from "lucide-react";
import { FiSearch } from "react-icons/fi";
import { BsPersonCircle } from "react-icons/bs";

import SidebarNavItem from "./SidebarNavItem";
import ThemeOption from "./SidebarThemeOption";
import Logo from "../Logo";
import Overlay from "../Overlay";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";

import { useGlobalContext } from "@/context/globalContext";
import { useTheme } from "@/context/themeContext";
import { useAuth } from "@/context/AuthContext";
import { useAudioPlayerContext } from "@/context/audioPlayerContext";
import { useOnClickOutside } from "@/hooks/useOnClickOutside";
import { useMotion } from "@/hooks/useMotion";
import { navLinks, themeOptions } from "@/constants";
import { sideBarHeading, listItem } from "@/styles";
import { INavLink } from "@/types";
import { cn } from "@/utils/helper";

interface SideBarProps {
  onOpenSearch?: () => void;
}

const SideBar: React.FC<SideBarProps> = ({ onOpenSearch }) => {
  const { showSidebar, setShowSidebar } = useGlobalContext();
  const { theme } = useTheme();
  const { slideIn } = useMotion();
  const { user, signOut } = useAuth();
  const { currentTrack } = useAudioPlayerContext();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = React.useState(false);

  // Check if MiniPlayer is visible (when there's a current track)
  const isMiniPlayerVisible = !!currentTrack;

  const closeSideBar = useCallback(() => {
    setShowSidebar(false);
  }, [setShowSidebar]);

  const { ref } = useOnClickOutside({
    action: closeSideBar,
    enable: showSidebar,
  });

  const handleSignOut = () => {
    signOut();
    closeSideBar();
  };

  const handleSignIn = () => {
    navigate("/login");
    closeSideBar();
  };

  const handleSearch = () => {
    onOpenSearch?.();
    closeSideBar();
  };

  return (
    <AnimatePresence>
      {showSidebar && (
        <Overlay>
          <m.nav
            variants={slideIn("right", "tween", 0, 0.3)}
            initial="hidden"
            animate="show"
            exit="hidden"
            ref={ref}
            className={cn(
              `fixed top-0 right-0 sm:w-[40%] xs:w-[220px] w-[195px] overflow-y-auto shadow-md md:hidden p-4 pb-0 dark:text-gray-200 text-gray-600 flex flex-col z-[7000]`,
              theme === "Dark" ? "dark-glass" : "light-glass"
            )}
            style={{
              height: isMiniPlayerVisible ? 'calc(100vh - 76px)' : '100vh',
            }}
          >

            <div className="pt-[40px] flex-1 flex flex-col overflow-y-auto no-scrollbar">
              <h3 className={sideBarHeading}>Menu</h3>
              <ul className="flex flex-col sm:gap-2 xs:gap-[6px] gap-1 capitalize xs:text-[14px] text-[13.5px] font-medium">
                {navLinks.map((link: INavLink) => {
                  return (
                    <SidebarNavItem
                      link={link}
                      closeSideBar={closeSideBar}
                      key={link.title.replaceAll(" ", "")}
                    />
                  );
                })}

                {/* Search Item */}
                <li>
                  <button
                    onClick={handleSearch}
                    className={listItem}
                  >
                    <FiSearch className="text-[18px]" />
                    <span>Search</span>
                  </button>
                </li>

                {/* Library Item - Only show if logged in */}
                {user && (
                  <li>
                    <button
                      onClick={() => {
                        navigate("/library");
                        closeSideBar();
                      }}
                      className={listItem}
                    >
                      <Library className="h-[18px] w-[18px]" />
                      <span>Library</span>
                    </button>
                  </li>
                )}
              </ul>

              <h3 className={cn(`mt-4 `, sideBarHeading)}>Theme</h3>
              <ul className="flex flex-col sm:gap-2 xs:gap-[4px] gap-[2px] capitalize text-[14.75px] font-medium">
                {themeOptions.map((theme) => {
                  return <ThemeOption theme={theme} key={theme.title} />;
                })}
              </ul>

              {/* Account Section at Bottom */}
              <div className="mt-auto pt-4 pb-2">
                {!user ? (
                  <button
                    onClick={handleSignIn}
                    className={cn(listItem, "w-full justify-start")}
                  >
                    <BsPersonCircle className="text-[18px]" />
                    <span>Sign In</span>
                  </button>
                ) : (
                  <Collapsible
                    open={isOpen}
                    onOpenChange={setIsOpen}
                    className="w-full space-y-2"
                  >
                    <div className="flex items-center justify-between px-2 py-2 rounded-md hover:bg-black/5 dark:hover:bg-white/10 transition-colors">
                      <div className="flex items-center gap-2 overflow-hidden">
                        {user.user_metadata?.avatar_url ? (
                          <img
                            src={user.user_metadata.avatar_url}
                            alt="Avatar"
                            className="w-6 h-6 rounded-full object-cover shrink-0"
                          />
                        ) : (
                          <BsPersonCircle className="text-[18px] shrink-0" />
                        )}
                        <span className="truncate text-sm font-medium">{user.user_metadata?.full_name}</span>
                      </div>
                      <CollapsibleTrigger asChild>
                        <Button variant="ghost" size="sm" className="w-8 h-8 p-0 hover:bg-transparent">
                          <ChevronsUpDown className="h-4 w-4 opacity-50" />
                          <span className="sr-only">Toggle</span>
                        </Button>
                      </CollapsibleTrigger>
                    </div>
                    <CollapsibleContent className="space-y-1 px-2">
                      <div className="rounded-md border border-black/10 dark:border-white/10 px-3 py-2 text-xs font-mono text-muted-foreground break-all bg-black/5 dark:bg-black/20">
                        {user.email}
                      </div>
                      <button
                        onClick={handleSignOut}
                        className={cn(listItem, "w-full justify-start pl-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10")}
                      >
                        <LogOut className="h-4 w-4" />
                        <span>Log Out</span>
                      </button>
                    </CollapsibleContent>
                  </Collapsible>
                )}
              </div>
            </div>
          </m.nav>
        </Overlay>
      )}
    </AnimatePresence>
  );
};

export default SideBar;
