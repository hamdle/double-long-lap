"use client";

const BUTTONDOWN_USER = process.env.NEXT_PUBLIC_BUTTONDOWN_USER ?? "";

export function NewsletterSignup() {
  if (!BUTTONDOWN_USER) {
    return (
      <div>
        <p>
          <strong>Get the weekly lap report.</strong>
        </p>
        <p className="u-text-muted">
          <small>
            Race previews, standings moves, and venue guides — straight to your inbox. Signup
            launching soon.
          </small>
        </p>
      </div>
    );
  }

  const action = `https://buttondown.email/api/emails/embed-subscribe/${BUTTONDOWN_USER}`;
  return (
    <form
      action={action}
      method="post"
      target="popupwindow"
      onSubmit={() => window.open(action, "popupwindow")}
      className="p-form"
    >
      <p>
        <strong>Get the weekly lap report.</strong>
      </p>
      <p className="u-text-muted">
        <small>Race previews, standings moves, and venue guides — straight to your inbox.</small>
      </p>
      <div className="p-form__group">
        <label htmlFor="newsletter-email" className="u-hide">
          Email
        </label>
        <input
          type="email"
          name="email"
          id="newsletter-email"
          placeholder="you@example.com"
          required
        />
        <button type="submit" className="p-button--positive">
          Subscribe
        </button>
      </div>
    </form>
  );
}
