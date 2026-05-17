import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { api } from '../../api';

const BlogDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [blog, setBlog] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    api.getBlog(id).then(setBlog).catch(err => setError(err.message));
  }, [id]);

  const handleDelete = async () => {
    if (!window.confirm('Biztosan torolni szeretned?')) return;
    try {
      await api.deleteBlog(id);
      navigate('/');
    } catch (err) {
      setError(err.message);
    }
  };

  if (error)   return <div className="text-center mt-10 text-red-600">Hiba: {error}</div>;
  if (!blog)   return <div className="text-center mt-10">Betoltes...</div>;

  return (
    <article className="w-4/5 md:w-9/12 mx-auto md:mt-10 bg-white shadow rounded overflow-hidden">
      {blog.blogImage && (
        <img src={blog.blogImage} alt={blog.title} className="w-full h-64 md:h-96 object-cover" />
      )}
      <div className="p-6">
        <h1 className="text-3xl font-bold mb-2">{blog.title}</h1>
        <p className="text-gray-500 mb-4">Szerzo: {blog.author} &middot; #{blog.category}</p>
        <p className="text-gray-800 whitespace-pre-line">{blog.body}</p>

        <div className="mt-6 flex gap-3">
          <Link to="/" className="text-blue-500 hover:underline">Vissza</Link>
          <button onClick={handleDelete} className="text-red-500 hover:underline">Torles</button>
        </div>
      </div>
    </article>
  );
};

export default BlogDetails;
