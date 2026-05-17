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
  it('a főoldalon megjelenik a WRITEUP wordmark', async () => {
    render(<App />);
    const wordmarks = await screen.findAllByText(/writeup/i);
    expect(wordmarks.length).toBeGreaterThan(0);
  });

  it('megpróbálja lekérni a blogokat a backendről', async () => {
    render(<App />);
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalled();
    });
    const calledUrl = global.fetch.mock.calls[0][0];
    expect(calledUrl).toMatch(/\/api\/blogs/);
  });

  it('hibaüzenetet jelenít meg ha a backend hibát ad', async () => {
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
      expect(screen.getByText(/valami hiba történt/i)).toBeInTheDocument();
    });
  });
});
