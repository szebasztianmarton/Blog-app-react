import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { api } from '../../api';
import { SkeletonLine } from '../ui/Skeleton';
import ErrorState from '../ui/ErrorState';

function formatDate(iso) {
  if (!iso) return null;
  try {
    const d = new Date(iso.replace(' ', 'T'));
    if (Number.isNaN(d.getTime())) return null;
    return d.toLocaleDateString('hu-HU', { year: 'numeric', month: 'long', day: 'numeric' });
  } catch (e) {
    return null;
  }
}

export default function BlogDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [blog, setBlog] = useState(null);
  const [error, setError] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let active = true;
    setError(null);
    setBlog(null);
    api.getBlog(id)
      .then((data) => { if (active) setBlog(data); })
      .catch((err) => { if (active) setError(err.message); });
    return () => { active = false; };
  }, [id, reloadKey]);

  const handleDelete = async () => {
    if (!window.confirm('Biztos törlöd ezt a bejegyzést? Nem visszavonható.')) return;
    setDeleting(true);
    try {
      await api.deleteBlog(id);
      navigate('/');
    } catch (err) {
      setError(err.message);
      setDeleting(false);
    }
  };

  if (error) {
    return (
      <div className="container-zine py-20">
        <ErrorState message={error} onRetry={() => setReloadKey((k) => k + 1)} />
        <div className="mt-8 text-center">
          <Link to="/" className="btn-brutal btn-brutal--ghost">Vissza</Link>
        </div>
      </div>
    );
  }

  if (!blog) return <BlogDetailsSkeleton />;

  const date = formatDate(blog.createdAt);

  return (
    <article className="pb-20">
      <header className="container-zine pt-12 md:pt-20">
        <nav aria-label="Vissza" className="mb-8">
          <Link to="/" className="meta-mono inline-flex items-center gap-2 hover:text-accent dark:hover:text-accent-dark">
            <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="square">
              <path d="M19 12H5M11 6l-6 6 6 6" />
            </svg>
            Vissza az archívumba
          </Link>
        </nav>

        <div className="flex flex-wrap items-center gap-3 mb-6">
          <span className="tag-mono">{blog.category}</span>
          <span className="meta-mono">#{String(blog.id).padStart(3, '0')}</span>
          {date && <span className="meta-mono">{date}</span>}
        </div>

        <h1 className="font-display text-4xl md:text-6xl font-bold tracking-tight leading-[1.05] text-balance mb-8">
          {blog.title}
        </h1>

        <div className="flex items-center justify-between border-t-2 border-b-2 border-current py-4">
          <div>
            <p className="eyebrow mb-1">Szerző</p>
            <p className="font-display text-lg md:text-xl font-medium">{blog.author}</p>
          </div>
          <button
            type="button"
            onClick={handleDelete}
            disabled={deleting}
            className="btn-brutal btn-brutal--danger btn-brutal--sm"
          >
            {deleting ? 'Törlés...' : 'Törlés'}
          </button>
        </div>
      </header>

      {blog.blogImage && (
        <figure className="container-wide my-10 md:my-16">
          <div className="border-2 border-current overflow-hidden bg-paper-muted dark:bg-night-muted">
            <img
              src={blog.blogImage}
              alt={blog.title}
              className="w-full h-auto max-h-[70vh] object-cover"
            />
          </div>
        </figure>
      )}

      <div className="container-zine">
        <div className="max-w-prose mx-auto">
          <p className="font-display text-xl md:text-2xl leading-snug text-balance mb-10 border-l-4 border-accent dark:border-accent-dark pl-6">
            {blog.body.split('.').slice(0, 1).join('.')}.
          </p>
          <div className="text-lg leading-relaxed text-pretty whitespace-pre-line space-y-6">
            {blog.body.split(/\n\n+/).map((para, i) => (
              <p key={i}>{para}</p>
            ))}
          </div>
        </div>

        <hr className="rule max-w-prose mx-auto" />

        <div className="max-w-prose mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <Link to="/" className="btn-brutal btn-brutal--ghost">
            További bejegyzések
          </Link>
        </div>
      </div>
    </article>
  );
}

function BlogDetailsSkeleton() {
  return (
    <div className="container-zine py-12 md:py-20" aria-busy="true">
      <SkeletonLine style={{ width: '8rem', height: '0.75rem' }} />
      <div className="mt-8 space-y-3">
        <SkeletonLine style={{ height: '1.25rem', width: '6rem' }} />
        <SkeletonLine style={{ height: '3rem' }} />
        <SkeletonLine style={{ height: '3rem', width: '85%' }} />
        <SkeletonLine style={{ height: '3rem', width: '60%' }} />
      </div>
      <div className="mt-10 space-y-3">
        <SkeletonLine />
        <SkeletonLine style={{ width: '95%' }} />
        <SkeletonLine style={{ width: '88%' }} />
        <SkeletonLine style={{ width: '92%' }} />
      </div>
    </div>
  );
}
