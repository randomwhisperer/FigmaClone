import { Switch, Route } from "wouter";
import { useEffect } from "react";
import Design from "@/pages/Design";
import NotFound from "@/pages/not-found";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { useAppSelector, useAppDispatch } from "@/store/hooks";
import { toggleTheme } from "@/store/slices/designSlice";
import { motion } from "framer-motion";

function App() {
  const theme = useAppSelector(state => state.design.present.theme);
  const dispatch = useAppDispatch();

  // Listen for system theme changes
  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    
    const handleChange = (e: MediaQueryListEvent) => {
      const newTheme = e.matches ? 'dark' : 'light';
      if (newTheme !== theme) {
        dispatch(toggleTheme());
      }
    };
    
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [theme, dispatch]);

  return (
    <ThemeProvider>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="h-screen w-screen overflow-hidden"
      >
        <Switch>
          <Route path="/" component={Design} />
          <Route component={NotFound} />
        </Switch>
      </motion.div>
    </ThemeProvider>
  );
}

export default App;
