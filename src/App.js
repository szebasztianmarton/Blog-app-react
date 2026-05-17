import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';

import Navbar from './component/Navbar/Navbar';
import Home from './component/Home/Home';
import AddBlog from './component/AddBlog/AddBlog';
import BlogDetails from './component/BlogDetails/BlogDetails';

const App = () => {
  return (
    <Router>
      <div className="main-container">
        <Navbar />
        <h1 className="main-heading text-center text-3xl my-6">
          Blog App using React JS
        </h1>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/blogs/add" element={<AddBlog />} />
          <Route path="/blogs/:id" element={<BlogDetails />} />
        </Routes>
      </div>
    </Router>
  );
};

export default App;
