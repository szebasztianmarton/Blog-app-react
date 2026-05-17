import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../../api';

const CATEGORIES = ['technology', 'sports', 'beauty', 'travel'];

const initial = {
  title: '',
  body: '',
  author: '',
  category: 'technology',
  blogImage: '',
};

export default function AddBlog() {
  const navigate = useNavigate();
  const [form, setForm] = useState(initial);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});

  const update = (key) => (e) => {
    setForm((f) => ({ ...f, [key]: e.target.value }));
    if (fieldErrors[key]) {
      setFieldErrors((fe) => ({ ...fe, [key]: undefined }));
    }
  };

  const validate = () => {
    const errs = {};
    if (!form.title.trim())  errs.title  = 'Kotelezo mezo';
    if (!form.author.trim()) errs.author = 'Kotelezo mezo';
    if (!form.body.trim())   errs.body   = 'Kotelezo mezo';
    if (!form.category)      errs.category = 'Valaszd ki a kategoriat';
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    if (!validate()) return;
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
    <div className="container-zine py-12 md:py-20">
      <nav aria-label="Iranyt mutato" className="mb-8">
        <Link to="/" className="meta-mono inline-flex items-center gap-2 hover:text-accent dark:hover:text-accent-dark">
          <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="square">
            <path d="M19 12H5M11 6l-6 6 6 6" />
          </svg>
          Vissza az archivumba
        </Link>
      </nav>

      <header className="mb-12">
        <p className="eyebrow mb-4">Compose / New</p>
        <h1 className="font-display text-5xl md:text-6xl font-bold tracking-tight text-balance">
          Uj bejegyzes
        </h1>
        <p className="mt-4 max-w-prose text-ink-muted dark:text-bone-muted">
          Toltsd ki a mezoket. A piros csillaggal jelolt mezok kotelezok.
          A bejegyzes azonnal elerheto lesz az archivumban.
        </p>
      </header>

      {error && (
        <div
          role="alert"
          className="border-2 border-accent dark:border-accent-dark p-4 mb-8 font-mono text-sm"
        >
          <span className="font-bold uppercase tracking-wider">Hiba: </span>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate className="space-y-8">
        <Field
          id="title"
          label="Cim"
          required
          error={fieldErrors.title}
        >
          <input
            id="title"
            type="text"
            value={form.title}
            onChange={update('title')}
            placeholder="Adj egy markans cimet..."
            className="input-brutal"
            autoComplete="off"
            aria-invalid={!!fieldErrors.title}
          />
        </Field>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <Field id="author" label="Szerzo" required error={fieldErrors.author}>
            <input
              id="author"
              type="text"
              value={form.author}
              onChange={update('author')}
              placeholder="A te neved"
              className="input-brutal"
              autoComplete="name"
              aria-invalid={!!fieldErrors.author}
            />
          </Field>

          <Field id="category" label="Kategoria" required error={fieldErrors.category}>
            <select
              id="category"
              value={form.category}
              onChange={update('category')}
              className="input-brutal appearance-none pr-9"
              style={{
                backgroundImage:
                  "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='3'><path d='M6 9l6 6 6-6'/></svg>\")",
                backgroundRepeat: 'no-repeat',
                backgroundPosition: 'right 0.75rem center',
              }}
              aria-invalid={!!fieldErrors.category}
            >
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </Field>
        </div>

        <Field id="blogImage" label="Boritokep URL" hint="Opcionalis — barmilyen elerheto kep URL">
          <input
            id="blogImage"
            type="url"
            value={form.blogImage}
            onChange={update('blogImage')}
            placeholder="https://..."
            className="input-brutal"
            autoComplete="off"
          />
        </Field>

        <Field id="body" label="Tartalom" required error={fieldErrors.body} hint="Markdown nem tamogatott, csak sima szoveg.">
          <textarea
            id="body"
            rows={10}
            value={form.body}
            onChange={update('body')}
            placeholder="Irj valamit ami szamit..."
            className="input-brutal resize-y min-h-[12rem]"
            aria-invalid={!!fieldErrors.body}
          />
        </Field>

        <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t-2 border-current/15">
          <button
            type="submit"
            disabled={submitting}
            className="btn-brutal btn-brutal--accent"
          >
            {submitting ? 'Mentes...' : 'Publikalas'}
            {!submitting && (
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square">
                <path d="M5 12h14M13 6l6 6-6 6" />
              </svg>
            )}
          </button>
          <Link to="/" className="btn-brutal btn-brutal--ghost">
            Megse
          </Link>
        </div>
      </form>
    </div>
  );
}

function Field({ id, label, required, error, hint, children }) {
  return (
    <div>
      <label htmlFor={id} className="label-brutal">
        {label}
        {required && <span className="text-accent dark:text-accent-dark ml-1" aria-hidden>*</span>}
      </label>
      {children}
      {error ? (
        <p className="mt-2 font-mono text-xs text-accent dark:text-accent-dark" role="alert">
          ↳ {error}
        </p>
      ) : hint ? (
        <p className="mt-2 font-mono text-xs text-ink-muted dark:text-bone-muted">{hint}</p>
      ) : null}
    </div>
  );
}
