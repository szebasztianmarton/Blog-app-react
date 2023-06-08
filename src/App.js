import React, { useState, useEffect } from 'react';
import PaginationButton from './PaginationButton';
/*import React, { useState } from 'react';*/



function App() {
  const [posts, setPosts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      const response = await fetch('https://jsonplaceholder.typicode.com/posts');
      const posts = await response.json();
      setPosts(posts);
    } catch (error) {
      console.error(error);
    }
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  const filteredPosts = posts.filter((post) =>
    post.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="container mx-auto px-4 py-8">
      <header className="mb-8">
        <h1 className="text-4xl font-bold">Blog</h1>
        <div className="mt-4">
          <input
            type="text"
            className="border border-gray-400 rounded px-4 py-2 w-64"
            placeholder="Search by title..."
            value={searchTerm}
            onChange={handleSearch}
          />
        </div>
      </header>

      <div className="grid grid-cols-1 gap-8">
        {filteredPosts.map((post) => (
          <div
            key={post.id}
            className="border border-gray-400 rounded p-4 cursor-pointer"
            onClick={() => {
              window.location.href = `/post/${post.id}`;
            }}
          >
            <h2 className="text-2xl font-bold mb-2">{post.title}</h2>
            <p className="text-gray-600">Author: {post.userId}</p>
            <p>{post.body}</p>
            <img
              src={`https://placehold.co/150/${getRandomColor()}/fff?text=${encodeURIComponent(
                post.title
              )}`}
              alt="Post Image"
              className="mt-4"
            />
          </div>
        ))}
      </div>
    </div>
  );
}

function getRandomColor() {
  const colors = ['ff0000', '00ff00', '0000ff', 'ffff00', '00ffff', 'ff00ff'];
  const randomIndex = Math.floor(Math.random() * colors.length);
  return colors[randomIndex];
}

/*  const App = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = 10; // Összes oldal száma

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  ReactDOM.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
    document.getElementById('root')
  );
  
  */



 /* return (
    <div className="container mx-auto px-4 py-8">
      {(/* other ALL PAGE*/ 
/*
      <div className="flex justify-center mt-8">
        {Array.from({ length: totalPages }).map((_, index) => (
          <PaginationButton
            key={index}
            number={index + 1}
            isActive={currentPage === index + 1}
            onClick={() => handlePageChange(index + 1)}
          />
        ))}
      </div>
    </div>
  );
};
*/
export default App;
