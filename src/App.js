import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

import Navbar from './component/Navbar/Navbar';
import Home from './component/Home/Home';
import AddBlog from './component/AddBlog/AddBlog';
import BlogDetails from './component/BlogDetails/BlogDetails';

export default function App() {
  return (
    <Router>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:btn-brutal"
      >
        Ugras a tartalomra
      </a>
      <Navbar />
      <main id="main" className="min-h-[calc(100vh-5rem)]">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/blogs/add" element={<AddBlog />} />
          <Route path="/blogs/:id" element={<BlogDetails />} />
        </Routes>
      </main>
      <footer className="border-t-2 border-current">
        <div className="container-wide py-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <p className="font-display text-2xl font-bold tracking-tight">
            WRITEUP<span className="text-accent dark:text-accent-dark">.</span>
          </p>
          <p className="meta-mono">© 2026 Editorial blog · MIT licensz</p>
        </div>
      </footer>
    </Router>
  );
}
