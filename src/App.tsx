import { HashRouter, Routes, Route, Navigate } from "react-router-dom";
import { PuzzleGate } from "./pages/PuzzleGate";
import { MainPage } from "./pages/MainPage";
import { MemoView } from "./pages/MemoView";

/**
 * We use HashRouter so that GitHub Pages deep links work without a
 * server-side rewrite. URLs will look like:
 *   elisaho.github.io/#/whatisthetime
 *   elisaho.github.io/#/memos/3
 */
export function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<PuzzleGate />} />
        <Route path="/whatisthetime" element={<MainPage />} />
        <Route path="/memos/:id" element={<MemoView />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </HashRouter>
  );
}
