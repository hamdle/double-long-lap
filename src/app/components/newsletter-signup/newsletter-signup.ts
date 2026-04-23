import { Component, InjectionToken, computed, inject, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { InputText } from 'primeng/inputtext';
import { Button } from 'primeng/button';

// Buttondown username (the path segment in the embed-subscribe URL). Provided
// at app bootstrap when configured; otherwise the form falls back to a
// "coming soon" placeholder, matching the legacy Next.js behavior.
export const BUTTONDOWN_USER = new InjectionToken<string>('BUTTONDOWN_USER', {
  factory: () => '',
});

const BUTTONDOWN_BASE = 'https://buttondown.email/api/emails/embed-subscribe/';

@Component({
  selector: 'dll-newsletter-signup',
  imports: [ReactiveFormsModule, InputText, Button],
  templateUrl: './newsletter-signup.html',
  styleUrl: './newsletter-signup.scss',
})
export class NewsletterSignup {
  private readonly buttondownUser = inject(BUTTONDOWN_USER);

  readonly email = new FormControl('', {
    nonNullable: true,
    validators: [Validators.required, Validators.email],
  });

  readonly action = computed(() =>
    this.buttondownUser ? `${BUTTONDOWN_BASE}${this.buttondownUser}` : null,
  );

  readonly enabled = computed(() => this.action() !== null);

  // Buttondown's embed endpoint doesn't support CORS, so we mirror the legacy
  // approach: a real <form> submission targeting a popup window so the
  // confirmation page can render in a side window without leaving the site.
  onSubmit(event: SubmitEvent): void {
    if (!this.enabled() || this.email.invalid) {
      event.preventDefault();
      return;
    }
    window.open(this.action() ?? undefined, 'buttondown-popup');
    // Intentionally don't preventDefault — the form posts in the popup window.
  }
}
