import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';

import HomePage from './HomePage.jsx';
import NotFoundPage from "./NotFoundPage";

function App() {
  return (
      <Router>
        <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/notFound" element={<NotFoundPage />} />
        </Routes>
      </Router>
  );
}

export default App;
