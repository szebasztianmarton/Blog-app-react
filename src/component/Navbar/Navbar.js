import { useState } from 'react';
import { Link } from 'react-router-dom';

const Navbar = () => {
  const [isOpen, setOpen] = useState(false);

  return (
    <header className="md:flex md:items-center md:justify-between py-4 pb-0 md:pb-4">
      <div className="w-4/5 md:w-9/12 mx-auto md:flex md:items-center md:justify-center">
        <div className="flex items-center justify-between md:justify-center">
          <div className="flex items-center justify-between mb-4 md:mb-0 md:hidden">
            <h1 className="leading-none text-2xl">
              <Link to="/" className="text-4xl no-underline font-allison text-primary">
                WriteUp
              </Link>
            </h1>
          </div>

          <button
            className="md:hidden mb-4"
            onClick={() => setOpen(!isOpen)}
            aria-label="Menu valto"
            aria-expanded={isOpen}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>

        <nav className={`md:block ${isOpen ? 'block' : 'hidden'}`}>
          <ul className="list-reset md:flex md:items-center">
            <li className="md:ml-4 md:mx-8 mb-2 md:mb-0">
              <Link to="/blogs/add" className="nav-link">Uj blog</Link>
            </li>
            <li className="md:ml-4 md:mx-8 mb-2 md:mb-0">
              <Link to="/" className="nav-link">Blogok</Link>
            </li>
            <li className="items-center justify-between mb-4 md:mb-0 md:mx-8 hidden md:inline">
              <h1 className="leading-none text-2xl">
                <Link to="/" className="text-4xl no-underline font-allison text-primary">
                  WriteUp
                </Link>
              </h1>
            </li>
          </ul>
        </nav>
      </div>
    </header>
  );
};

export default Navbar;
