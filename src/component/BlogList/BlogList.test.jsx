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
  },
  {
    id: 2,
    title: 'Foci VB',
    body: 'A vilagbajnoksag...',
    author: 'Bela',
    category: 'sports',
    blogImage: 'https://example.com/b.jpg',
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
    expect(screen.getByText('Szerzo: Anna')).toBeInTheDocument();
    expect(screen.getByText('#technology')).toBeInTheDocument();
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
    const input = screen.getByPlaceholderText('Kereses...');
    fireEvent.change(input, { target: { value: 'react' } });
    expect(searchHandler).toHaveBeenCalledWith('react');
  });

  it('a kategoria valasztaskor meghivja a categoryHandler-t', () => {
    const categoryHandler = jest.fn();
    renderList({ categoryHandler });
    const select = screen.getByRole('combobox');
    fireEvent.change(select, { target: { value: 'sports' } });
    expect(categoryHandler).toHaveBeenCalledWith('sports');
  });

  it('ures blog tomb eseten nem rajzol blogot', () => {
    renderList({ blogs: [] });
    expect(screen.queryByText('React alapok')).not.toBeInTheDocument();
  });
});
