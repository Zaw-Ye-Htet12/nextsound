import { FiSun } from "react-icons/fi";
import { BsMoonStarsFill } from "react-icons/bs";
import { AiOutlineHome } from "react-icons/ai";

import { ITheme, INavLink } from "../types";

export const navLinks: INavLink[] = [
  {
    title: "home",
    path: "/",
    icon: AiOutlineHome,
  },
  {
    title: "library",
    path: "/library",
    icon: AiOutlineHome, // We'll update this to a proper icon later if needed, but AiOutlineHome works for now or let's use a heart or something better
  },
];

export const themeOptions: ITheme[] = [
  {
    title: "Dark",
    icon: BsMoonStarsFill,
  },
  {
    title: "Light",
    icon: FiSun,
  },
];


export const sections = [
  {
    title: "Global Top Hits",
    category: "tracks",
    type: "top hits 2024",
  },
  {
    title: "Trending Artists",
    category: "artist",
    type: "top hits 2024",
  },
  {
    title: "Pop Anthems",
    category: "tracks",
    type: "pop music",
  },
  {
    title: "Rock Classics",
    category: "tracks",
    type: "rock classics",
  },
  {
    title: "K-Pop Essentials",
    category: "tracks",
    type: "kpop hits",
  },
  {
    title: "Acoustic Chill",
    category: "tracks",
    type: "acoustic chill",
  },
  {
    title: "Hip-Hop / Rap",
    category: "tracks",
    type: "hip hop hits",
  },
  {
    title: "Electronic / Dance",
    category: "tracks",
    type: "electronic dance",
  },
  {
    title: "R&B Vibes",
    category: "tracks",
    type: "r&b hits",
  },
];
