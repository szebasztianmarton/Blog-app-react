import { useRef } from 'react';
import { Link } from 'react-router-dom';

const BlogList = ({ blogs, searchTerm, searchCategory, searchHandler, categoryHandler }) => {
  const inputEl = useRef('');
  const selectEl = useRef('');

  return (
    <div className="w-4/5 md:w-9/12 mx-auto md:mt-10">
      <div className="flex flex-col md:flex-row justify-between mb-10 gap-4">
        <div className="w-full md:w-1/3 shadow flex">
          <input
            className="w-full rounded p-2 outline-none"
            type="text"
            placeholder="Kereses..."
            value={searchTerm}
            onChange={(e) => searchHandler(e.target.value)}
            ref={inputEl}
          />
          <button
            className="bg-white w-auto flex justify-end items-center text-blue-500 p-2 hover:text-blue-400"
            aria-label="Kereses"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </button>
        </div>

        <div>
          <select
            value={searchCategory}
            ref={selectEl}
            onChange={(e) => categoryHandler(e.target.value)}
            className="w-full md:w-auto h-10 border-none outline-none shadow-md bg-white text-sub-title px-2"
          >
            <option value="None">Osszes kategoria</option>
            <option value="technology">Technology</option>
            <option value="sports">Sports</option>
            <option value="beauty">Beauty</option>
            <option value="travel">Travel</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {blogs.map((blog) => (
          <article className="blog-div bg-white shadow rounded overflow-hidden" key={blog.id}>
            <Link to={`/blogs/${blog.id}`}>
              {blog.blogImage && (
                <img
                  src={blog.blogImage}
                  alt={blog.title}
                  className="object-cover h-64 md:h-52 w-full"
                  loading="lazy"
                />
              )}
              <div className="p-4">
                <h2 className="py-2 text-title text-xl font-semibold">{blog.title}</h2>
                <p className="pb-2 text-sub-title text-sm text-gray-500">Szerzo: {blog.author}</p>
                <p className="pb-2 text-content">
                  {blog.body.slice(0, 100)}
                  <span className="text-primary">... Tovabb</span>
                </p>
                <span className="inline-block bg-gray-50 shadow-md rounded-full px-2 md:px-3 py-1 text-sm font-semibold text-gray-700">
                  #{blog.category}
                </span>
              </div>
            </Link>
          </article>
        ))}
      </div>
    </div>
  );
};

export default BlogList;
