"use client";

import Link from "next/link";

export default function Error({ error, reset }) {
  return (
    <section className="error-shell" role="alert" aria-live="assertive">
      <p className="error-kicker">Something went wrong</p>
      <h2 className="error-title">We could not load this page.</h2>
      <p className="error-copy">
        {error?.message || "Try again, or go back to the homepage."}
      </p>
      <div className="error-actions">
        <button type="button" onClick={reset} className="error-primary-btn">
          Try Again
        </button>
        <Link href="/" className="error-secondary-btn">
          Back Home
        </Link>
      </div>
    </section>
  );
}
