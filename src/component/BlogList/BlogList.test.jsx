import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import BlogList from './BlogList';

const sampleBlogs = [
  {
    id: 1,
    title: 'React alapok',
    body: 'A React egy JavaScript konyvtar...',
    author: 'Anna',
    category: 'technology',
    blogImage: 'https://example.com/a.jpg',
    createdAt: '2026-05-17 12:00:00',
  },
  {
    id: 2,
    title: 'Foci VB',
    body: 'A vilagbajnoksag...',
    author: 'Bela',
    category: 'sports',
    blogImage: 'https://example.com/b.jpg',
    createdAt: '2026-05-17 13:00:00',
  },
];

function renderList(props = {}) {
  const defaults = {
    blogs: sampleBlogs,
    searchTerm: '',
    searchCategory: 'None',
    searchHandler: jest.fn(),
    categoryHandler: jest.fn(),
  };
  return render(
    <MemoryRouter>
      <BlogList {...defaults} {...props} />
    </MemoryRouter>
  );
}

describe('BlogList', () => {
  it('kirajzolja az osszes atadott blogot', () => {
    renderList();
    expect(screen.getByText('React alapok')).toBeInTheDocument();
    expect(screen.getByText('Foci VB')).toBeInTheDocument();
    expect(screen.getByText('Anna')).toBeInTheDocument();
    expect(screen.getAllByText('technology').length).toBeGreaterThan(0);
  });

  it('a blog cimre kattintva navigalhato link mutat a reszletekre', () => {
    renderList();
    const links = screen.getAllByRole('link');
    const hrefs = links.map((a) => a.getAttribute('href'));
    expect(hrefs).toContain('/blogs/1');
    expect(hrefs).toContain('/blogs/2');
  });

  it('a kereses input valtozasakor meghivja a searchHandler-t', () => {
    const searchHandler = jest.fn();
    renderList({ searchHandler });
    const input = screen.getByLabelText(/bejegyzesek keresese/i);
    fireEvent.change(input, { target: { value: 'react' } });
    expect(searchHandler).toHaveBeenCalledWith('react');
  });

  it('a kategoria valasztaskor meghivja a categoryHandler-t', () => {
    const categoryHandler = jest.fn();
    renderList({ categoryHandler });
    const select = screen.getByLabelText(/kategoria szuro/i);
    fireEvent.change(select, { target: { value: 'sports' } });
    expect(categoryHandler).toHaveBeenCalledWith('sports');
  });

  it('ures blog tomb eseten nem rajzol blogot', () => {
    renderList({ blogs: [] });
    expect(screen.queryByText('React alapok')).not.toBeInTheDocument();
  });

  it('hideToolbar=true eseten nem latszik a kereso', () => {
    renderList({ hideToolbar: true });
    expect(screen.queryByLabelText(/bejegyzesek keresese/i)).not.toBeInTheDocument();
  });
});
