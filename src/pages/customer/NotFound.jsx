import React from 'react';
import { Link } from 'react-router-dom';

const NotFound = () => {
  return (
    <div className="container section-padding text-center mx-auto max-w-md mt-2">
      <h1 className="text-error" style={{ fontSize: '4rem', marginBottom: '1rem' }}>404</h1>
      <h2 className="mb-2">Page Not Found</h2>
      <p className="text-muted mb-2">
        The page you are looking for might have been removed, had its name changed, or is temporarily unavailable.
      </p>
      <Link to="/" className="btn btn--primary">Return to Home</Link>
    </div>
  );
};

export default NotFound;
