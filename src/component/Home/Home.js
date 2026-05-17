import { useEffect, useState } from 'react';
import { api } from '../../api';
import BlogList from '../BlogList/BlogList';

const Home = () => {
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchCategory, setSearchCategory] = useState('None');

  useEffect(() => {
    let active = true;
    setLoading(true);
    api.listBlogs()
      .then(data => { if (active) setBlogs(data); })
      .catch(err => { if (active) setError(err.message); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const filtered = blogs.filter(blog => {
    const matchesCategory =
      searchCategory === 'None' ||
      blog.category.toLowerCase() === searchCategory.toLowerCase();
    const matchesSearch =
      searchTerm === '' ||
      Object.values(blog).join(' ').toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  if (loading) return <div className="text-center mt-10">Betoltes...</div>;
  if (error)   return <div className="text-center mt-10 text-red-600">Hiba: {error}</div>;
  if (!blogs.length) return <div className="text-center mt-10">Nincs blog bejegyzes</div>;

  return (
    <BlogList
      blogs={filtered}
      searchTerm={searchTerm}
      searchCategory={searchCategory}
      searchHandler={setSearchTerm}
      categoryHandler={setSearchCategory}
    />
  );
};

export default Home;
