import { Switch, Route, Router as WouterRouter } from "wouter";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Home from "@/pages/Home";
import Quiz from "@/pages/Quiz";
import Results from "@/pages/Results";
import Mistakes from "@/pages/Mistakes";
import StudyHub from "@/pages/StudyHub";
import LessonDetails from "@/pages/LessonDetails";
import Flashcards from "@/pages/Flashcards";
import CheatSheet from "@/pages/CheatSheet";
import DecisionTrees from "@/pages/DecisionTrees";
import ScoreMode from "@/pages/ScoreMode";
import Dump from "@/pages/Dump";
import Bookmarks from "@/pages/Bookmarks";
import ExamSim from "@/pages/ExamSim";
import Analytics from "@/pages/Analytics";
import SpacedReview from "@/pages/SpacedReview";
import QuickQuiz from "@/pages/QuickQuiz";
import Compare from "@/pages/Compare";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/study" component={StudyHub} />
      <Route path="/study/:lessonId" component={LessonDetails} />
      <Route path="/flashcards" component={Flashcards} />
      <Route path="/cheatsheet" component={CheatSheet} />
      <Route path="/decision-trees" component={DecisionTrees} />
      <Route path="/score-mode" component={ScoreMode} />
      <Route path="/dump" component={Dump} />
      <Route path="/bookmarks" component={Bookmarks} />
      <Route path="/exam-sim" component={ExamSim} />
      <Route path="/analytics" component={Analytics} />
      <Route path="/spaced-review" component={SpacedReview} />
      <Route path="/quick-quiz" component={QuickQuiz} />
      <Route path="/compare" component={Compare} />
      <Route path="/quiz/:moduleId" component={Quiz} />
      <Route path="/results/:moduleId" component={Results} />
      <Route path="/mistakes" component={Mistakes} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <TooltipProvider>
      <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
        <Router />
      </WouterRouter>
      <Toaster />
    </TooltipProvider>
  );
}

export default App;
