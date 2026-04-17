type AffiliateLink = {
  label: string;
  href: string;
  vendor?: string;
};

type Props = {
  title: string;
  blurb?: string;
  links?: AffiliateLink[];
};

export function AffiliateBlock({ title, blurb, links = [] }: Props) {
  return (
    <aside
      className="p-notification--information"
      role="complementary"
      aria-label={title}
    >
      <div className="p-notification__content">
        <h4 className="p-notification__title">{title}</h4>
        {blurb ? <p className="p-notification__message">{blurb}</p> : null}
        {links.length > 0 ? (
          <ul className="p-inline-list">
            {links.map((l) => (
              <li key={l.href} className="p-inline-list__item">
                <a href={l.href} target="_blank" rel="sponsored noopener noreferrer">
                  {l.label}
                  {l.vendor ? ` · ${l.vendor}` : ""}
                </a>
              </li>
            ))}
          </ul>
        ) : (
          <p className="u-text-muted">
            <small>Affiliate partnerships coming soon. Reach out if you&rsquo;re interested.</small>
          </p>
        )}
        <p className="u-text-muted">
          <small>
            Links marked here may be affiliate links. We may earn a commission at no extra cost to you.
          </small>
        </p>
      </div>
    </aside>
  );
}
