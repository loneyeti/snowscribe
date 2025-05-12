import { Inter, Cactus_Classical_Serif } from "next/font/google";

export const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  weight: ["400", "500", "600", "700", "800"],
  display: 'swap', // Explicitly set display swap
});

export const cactusSerif = Cactus_Classical_Serif({
  subsets: ["latin"],
  variable: "--font-cactus-serif",
  weight: "400",
  display: 'swap', // Explicitly set display swap
});
