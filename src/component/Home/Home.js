import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../api';
import BlogList from '../BlogList/BlogList';
import { SkeletonGrid } from '../ui/Skeleton';
import EmptyState from '../ui/EmptyState';
import ErrorState from '../ui/ErrorState';

const CATEGORIES = ['None', 'technology', 'sports', 'beauty', 'travel'];

export default function Home() {
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchCategory, setSearchCategory] = useState('None');
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);
    api.listBlogs()
      .then((data) => { if (active) setBlogs(data); })
      .catch((err) => { if (active) setError(err.message); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [reloadKey]);

  const filtered = useMemo(() => {
    return blogs.filter((blog) => {
      const matchesCategory =
        searchCategory === 'None' ||
        blog.category.toLowerCase() === searchCategory.toLowerCase();
      const haystack = Object.values(blog).join(' ').toLowerCase();
      const matchesSearch = searchTerm === '' || haystack.includes(searchTerm.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [blogs, searchTerm, searchCategory]);

  const hasFilter = searchTerm !== '' || searchCategory !== 'None';

  return (
    <>
      <section className="container-zine pt-16 md:pt-24 pb-12 md:pb-16">
        <h1 className="heading-display text-balance mb-8">
          Gondolatok,<br />
          <span className="text-accent dark:text-accent-dark">vita</span> és<br />
          minden ami közöttük van.
        </h1>
        <p className="max-w-prose text-lg md:text-xl leading-relaxed text-ink-muted dark:text-bone-muted text-pretty">
          Egy editorial blog technológiáról, sportról, szépségről és utazásról.
          Hosszú olvasmányok, éles vélemények, semmi szűrő.
        </p>
        <div className="mt-10 flex flex-wrap gap-3">
          <Link to="/blogs/add" className="btn-brutal btn-brutal--accent">
            Írok valamit
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square">
              <path d="M5 12h14M13 6l6 6-6 6" />
            </svg>
          </Link>
          <a href="#blogs" className="btn-brutal btn-brutal--ghost">Görgetj le</a>
        </div>
      </section>

      <hr className="rule-accent container-zine" />

      <section id="blogs" className="container-zine pb-24">
        <div className="flex flex-col gap-6 mb-10 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="eyebrow mb-2">{blogs.length} bejegyzés</p>
            <h2 className="font-display text-4xl md:text-5xl font-bold tracking-tight">
              A teljes archívum
            </h2>
          </div>
          <SearchControls
            searchTerm={searchTerm}
            searchCategory={searchCategory}
            onSearch={setSearchTerm}
            onCategory={setSearchCategory}
          />
        </div>

        {loading && <SkeletonGrid count={6} />}

        {!loading && error && (
          <ErrorState message={error} onRetry={() => setReloadKey((k) => k + 1)} />
        )}

        {!loading && !error && filtered.length === 0 && (
          <EmptyState
            title={hasFilter ? 'Nincs találat a keresésre' : 'Még nincs bejegyzés'}
            description={
              hasFilter
                ? 'Próbálj meg módosítani a keresést vagy a kategóriát.'
                : 'Légy te az első aki ír egyet.'
            }
            action={
              hasFilter ? (
                <button
                  type="button"
                  className="btn-brutal btn-brutal--ghost"
                  onClick={() => { setSearchTerm(''); setSearchCategory('None'); }}
                >
                  Szűrők törlése
                </button>
              ) : (
                <Link to="/blogs/add" className="btn-brutal btn-brutal--accent">
                  Új bejegyzés
                </Link>
              )
            }
          />
        )}

        {!loading && !error && filtered.length > 0 && (
          <BlogList
            blogs={filtered}
            searchTerm={searchTerm}
            searchCategory={searchCategory}
            searchHandler={setSearchTerm}
            categoryHandler={setSearchCategory}
            hideToolbar
          />
        )}
      </section>
    </>
  );
}

function SearchControls({ searchTerm, searchCategory, onSearch, onCategory }) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row md:w-auto md:min-w-[460px]">
      <label className="relative flex-1">
        <span className="sr-only">Keresés</span>
        <svg
          viewBox="0 0 24 24"
          aria-hidden="true"
          className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-muted dark:text-bone-muted"
          fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square"
        >
          <circle cx="11" cy="11" r="7" />
          <path d="M21 21l-4.3-4.3" />
        </svg>
        <input
          type="search"
          placeholder="Keresés..."
          value={searchTerm}
          onChange={(e) => onSearch(e.target.value)}
          className="input-brutal pl-9"
          aria-label="Bejegyzések keresése"
        />
      </label>

      <label className="sm:w-auto">
        <span className="sr-only">Kategória</span>
        <select
          value={searchCategory}
          onChange={(e) => onCategory(e.target.value)}
          className="input-brutal appearance-none pr-9 sm:w-44"
          aria-label="Kategória szűrő"
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='3'><path d='M6 9l6 6 6-6'/></svg>\")",
            backgroundRepeat: 'no-repeat',
            backgroundPosition: 'right 0.75rem center',
          }}
        >
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>{c === 'None' ? 'Összes kategória' : c}</option>
          ))}
        </select>
      </label>
    </div>
  );
}
