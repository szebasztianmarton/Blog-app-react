const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:4000/api';

async function request(path, options = {}) {
  const res = await fetch(`${API_URL}${path}`, {
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    ...options,
  });
  if (!res.ok) {
    const message = await res.text().catch(() => res.statusText);
    throw new Error(`API hiba (${res.status}): ${message}`);
  }
  if (res.status === 204) return null;
  return res.json();
}

export const api = {
  listBlogs: (category) => {
    const qs = category && category !== 'None' ? `?category=${encodeURIComponent(category)}` : '';
    return request(`/blogs${qs}`);
  },
  getBlog: (id) => request(`/blogs/${id}`),
  createBlog: (data) => request('/blogs', { method: 'POST', body: JSON.stringify(data) }),
  deleteBlog: (id) => request(`/blogs/${id}`, { method: 'DELETE' }),
  listCategories: () => request('/categories'),
};
