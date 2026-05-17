import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../api';

const CATEGORIES = ['technology', 'sports', 'beauty', 'travel'];

export default function AddBlog() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    title: '',
    body: '',
    author: '',
    category: 'technology',
    blogImage: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const update = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const created = await api.createBlog(form);
      navigate(`/blogs/${created.id}`);
    } catch (err) {
      setError(err.message);
      setSubmitting(false);
    }
  };

  return (
    <div className="w-4/5 md:w-9/12 mx-auto md:mt-10">
      <form
        onSubmit={handleSubmit}
        className="bg-white shadow-md rounded px-8 pt-6 pb-8 my-4 flex flex-col"
      >
        <h1 className="text-2xl text-gray-700 font-semibold mb-4">Uj blog bejegyzes</h1>

        {error && (
          <div className="mb-4 p-2 bg-red-100 text-red-700 rounded">{error}</div>
        )}

        <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="title">Cim</label>
        <input
          id="title" type="text" required
          className="shadow border rounded w-full py-2 px-3 text-gray-700 mb-4 focus:outline-none focus:shadow-outline"
          value={form.title} onChange={update('title')}
        />

        <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="author">Szerzo</label>
        <input
          id="author" type="text" required
          className="shadow border rounded w-full py-2 px-3 text-gray-700 mb-4 focus:outline-none focus:shadow-outline"
          value={form.author} onChange={update('author')}
        />

        <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="category">Kategoria</label>
        <select
          id="category" required
          className="shadow border rounded w-full py-2 px-3 text-gray-700 mb-4 focus:outline-none focus:shadow-outline"
          value={form.category} onChange={update('category')}
        >
          {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>

        <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="blogImage">Kep URL (opcionalis)</label>
        <input
          id="blogImage" type="url"
          className="shadow border rounded w-full py-2 px-3 text-gray-700 mb-4 focus:outline-none focus:shadow-outline"
          value={form.blogImage} onChange={update('blogImage')}
        />

        <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="body">Tartalom</label>
        <textarea
          id="body" rows="6" required
          className="shadow border rounded w-full py-2 px-3 text-gray-700 mb-4 focus:outline-none focus:shadow-outline"
          value={form.body} onChange={update('body')}
        />

        <button
          type="submit"
          disabled={submitting}
          className="bg-blue-500 hover:bg-blue-700 disabled:bg-gray-400 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline self-start"
        >
          {submitting ? 'Mentes...' : 'Blog hozzaadasa'}
        </button>
      </form>
    </div>
  );
}
