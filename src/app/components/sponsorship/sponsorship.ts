import { Component, input } from '@angular/core';

@Component({
  selector: 'dll-sponsorship',
  template: `
    <div
      class="dll-sponsorship"
      [attr.aria-label]="section() + ' sponsorship slot'"
    >
      <p class="u-text-muted">
        <small>
          <strong>This section is unsponsored.</strong>
          Interested in putting your brand in front of MotoAmerica fans?
          <a href="mailto:hello@doublelonglap.com">Get in touch.</a>
        </small>
      </p>
    </div>
  `,
  styles: `
    .dll-sponsorship {
      border: 1px dashed rgba(0, 0, 0, 0.2);
      border-radius: 4px;
      padding: var(--vf-sph-large);
      text-align: center;
    }
    :host-context(html.is-dark) .dll-sponsorship {
      border-color: rgba(255, 255, 255, 0.2);
    }
    .dll-sponsorship p { margin: 0; }
  `,
})
export class Sponsorship {
  readonly section = input.required<string>();
}
