import { Switch, Route } from "wouter";
import Design from "@/pages/Design";
import NotFound from "@/pages/not-found";

function App() {
  return (
    <Switch>
      <Route path="/" component={Design} />
      <Route component={NotFound} />
    </Switch>
  );
}

export default App;
