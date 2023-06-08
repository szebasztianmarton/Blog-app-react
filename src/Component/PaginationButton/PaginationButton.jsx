import React from 'react';
import classNames from 'classnames';

const PaginationButton = ({ number, isActive, onClick }) => {
  const buttonClasses = classNames('px-4 py-2 rounded', {
    'bg-blue-500 text-white': isActive,
    'bg-gray-200 text-gray-700': !isActive,
  });

  return (
    <button className={buttonClasses} onClick={onClick}>
      {number}
    </button>
  );
};

export default PaginationButton;
