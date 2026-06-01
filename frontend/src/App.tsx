import NavBar from "./components/NavBar";
import MovieRecommendations from "./pages/MovieRecommendations"
import SpecificMovie from "./pages/SpecificMovie";
import HomePage from "./pages/HomePage";
import { AuthProvider } from "./components/AuthContext";
import { useState } from "react";
import { Navigate, useLocation } from "react-router-dom";

import {
    BrowserRouter as Router,
    Routes,
    Route,
} from "react-router-dom";

function AppContent() {
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const location = useLocation();
  const showNavBar = location.pathname !== '/';

  return (
    <div className={`flex flex-col ${showNavBar ? 'h-full w-full' : 'h-screen w-screen'}`}>
      {showNavBar && <NavBar setIsLoading={setIsLoading} />}
        <Routes>
          <Route index path="/" element={ <HomePage /> } />
          <Route path="/:userId" element={ <MovieRecommendations isLoading={isLoading} setIsLoading={setIsLoading} /> }/>
          <Route path='/movies/:movieId' element={ <SpecificMovie /> }/>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    </div>
  )
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </Router>
  )
}

export default App;
