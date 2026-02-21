import Image from "next/image";
import { useTheme } from "../providers/ThemeProvider";

export default function Logo() {
  const { theme } = useTheme();
  return (
    <div>
      <Image
        src={`${theme === "dark" ? "/logo-dark.png" : "/logo.png"}`}
        alt="Unison"
        width={32}
        height={32}
        className="w-20 h-20 object-contain"
      />
      <p className="text-sm">Multilingual Collaboration</p>
    </div>
  );
}
