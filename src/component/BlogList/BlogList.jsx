import { Link } from 'react-router-dom';

function formatDate(iso) {
  if (!iso) return null;
  try {
    const d = new Date(iso.replace(' ', 'T'));
    if (Number.isNaN(d.getTime())) return null;
    return d.toLocaleDateString('hu-HU', { year: 'numeric', month: '2-digit', day: '2-digit' });
  } catch (e) {
    return null;
  }
}

function BlogCard({ blog, index }) {
  const date = formatDate(blog.createdAt);
  return (
    <article
      className="card-brutal flex flex-col h-full animate-fade-up"
      style={{ animationDelay: `${Math.min(index * 40, 240)}ms` }}
    >
      <Link to={`/blogs/${blog.id}`} className="flex flex-col h-full">
        {blog.blogImage && (
          <div className="aspect-[16/10] border-b-2 border-current overflow-hidden bg-paper-muted dark:bg-night">
            <img
              src={blog.blogImage}
              alt={blog.title}
              loading="lazy"
              className="h-full w-full object-cover grayscale contrast-110 transition-transform duration-300 hover:scale-[1.03] hover:grayscale-0"
            />
          </div>
        )}
        <div className="flex flex-col flex-1 p-5 md:p-6">
          <div className="flex items-center justify-between mb-4">
            <span className="tag-mono">{blog.category}</span>
            <span className="meta-mono">
              {String(blog.id).padStart(3, '0')}
            </span>
          </div>
          <h3 className="font-display text-2xl md:text-[1.6rem] font-bold tracking-tight leading-tight text-balance mb-3">
            {blog.title}
          </h3>
          <p className="text-pretty text-ink-muted dark:text-bone-muted line-clamp-3 mb-6">
            {blog.body}
          </p>
          <div className="mt-auto flex items-center justify-between pt-4 border-t-2 border-current/15">
            <span className="font-mono text-xs uppercase tracking-wider">
              {blog.author}
            </span>
            {date && <time className="meta-mono">{date}</time>}
          </div>
        </div>
      </Link>
    </article>
  );
}

const CATEGORIES = ['None', 'technology', 'sports', 'beauty', 'travel'];

export default function BlogList({
  blogs,
  searchTerm,
  searchCategory,
  searchHandler,
  categoryHandler,
  hideToolbar = false,
}) {
  return (
    <div>
      {!hideToolbar && (
        <div className="mb-10 flex flex-col gap-3 sm:flex-row sm:items-stretch">
          <label className="relative flex-1">
            <span className="sr-only">Keresés</span>
            <input
              type="search"
              placeholder="Keresés..."
              value={searchTerm}
              onChange={(e) => searchHandler(e.target.value)}
              className="input-brutal"
              aria-label="Bejegyzések keresése"
            />
          </label>
          <select
            value={searchCategory}
            onChange={(e) => categoryHandler(e.target.value)}
            className="input-brutal sm:w-52 appearance-none"
            aria-label="Kategória szűrő"
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>{c === 'None' ? 'Összes kategória' : c}</option>
            ))}
          </select>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {blogs.map((blog, i) => (
          <BlogCard key={blog.id} blog={blog} index={i} />
        ))}
      </div>
    </div>
  );
}
