import { render, screen, waitFor } from '@testing-library/react';
import App from './App';

beforeEach(() => {
  global.fetch = jest.fn(() =>
    Promise.resolve({
      ok: true,
      status: 200,
      json: () => Promise.resolve([]),
      text: () => Promise.resolve(''),
    })
  );
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe('App', () => {
  it('a fooldalon megjelenik a fejlec', async () => {
    render(<App />);
    expect(
      screen.getByRole('heading', { name: /Blog App using React JS/i })
    ).toBeInTheDocument();
  });

  it('megprobalja lekerni a blogokat a backendrol', async () => {
    render(<App />);
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalled();
    });
    const calledUrl = global.fetch.mock.calls[0][0];
    expect(calledUrl).toMatch(/\/api\/blogs/);
  });

  it('hibauzenetet jelenit meg ha a backend hibat ad', async () => {
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        text: () => Promise.resolve('Hiba'),
      })
    );
    render(<App />);
    await waitFor(() => {
      expect(screen.getByText(/Hiba:/i)).toBeInTheDocument();
    });
  });
});
