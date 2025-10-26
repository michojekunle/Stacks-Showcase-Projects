import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";

export const ModeToggle = () => {
  const [theme, setTheme] = useState<"light" | "dark">("dark");

  useEffect(() => {
    const root = window.document.documentElement;
    const initialTheme = root.classList.contains("dark") ? "dark" : "light";
    setTheme(initialTheme);
  }, []);

  const toggleTheme = () => {
    const root = window.document.documentElement;
    const newTheme = theme === "light" ? "dark" : "light";
    
    root.classList.remove(theme);
    root.classList.add(newTheme);
    setTheme(newTheme);
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleTheme}
      className="w-9 h-9 hover:bg-muted transition-colors duration-200"
      aria-label="Toggle dark/light mode"
    >
      {theme === "dark" ? (
        <Sun className="h-4 w-4 text-secondary" />
      ) : (
        <Moon className="h-4 w-4 text-primary" />
      )}
    </Button>
  );
};
