import { Component, computed, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { SelectButton } from 'primeng/selectbutton';
import type { SelectButtonChangeEvent } from 'primeng/selectbutton';
import { ThemeService, type ThemePreference } from '../../theme/theme.service';
import { NewsletterSignup } from '../newsletter-signup/newsletter-signup';

interface FooterLink {
  label: string;
  link: string;
}

interface ThemeOption {
  value: ThemePreference;
  icon: string;
  label: string;
}

@Component({
  selector: 'dll-site-footer',
  imports: [RouterLink, FormsModule, SelectButton, NewsletterSignup],
  templateUrl: './site-footer.html',
  styleUrl: './site-footer.scss',
})
export class SiteFooter {
  private readonly theme = inject(ThemeService);

  // Signal exposed for the segmented control's [ngModel] binding.
  readonly themePref = this.theme.preference;

  readonly copyrightYear = computed(() => new Date().getFullYear());

  readonly exploreLinks: FooterLink[] = [
    { label: 'Standings', link: '/standings' },
    { label: 'Schedule', link: '/schedule' },
    { label: 'Results', link: '/results' },
    { label: 'Riders', link: '/riders' },
    { label: 'Venues', link: '/venues' },
  ];

  // Headline classes of the current season, picked editorially rather than
  // enumerating every class_guide slug — the footer shouldn't sprawl.
  readonly seriesLinks: FooterLink[] = [
    { label: 'Superbike', link: '/standings/superbike' },
    { label: 'Supersport', link: '/standings/supersport' },
    { label: 'Twins Cup', link: '/standings/twins-cup' },
    { label: 'Stock 1000', link: '/standings/stock-1000' },
    { label: 'King of the Baggers', link: '/standings/mission-king-of-the-baggers' },
    { label: 'Super Hooligan', link: '/standings/mission-super-hooligan' },
  ];

  readonly themeOptions: ThemeOption[] = [
    { value: 'system', icon: 'pi pi-desktop', label: 'System' },
    { value: 'light', icon: 'pi pi-sun', label: 'Light' },
    { value: 'dark', icon: 'pi pi-moon', label: 'Dark' },
  ];

  onThemeChange(event: SelectButtonChangeEvent): void {
    // SelectButton emits the selected option's value; allowEmpty=false so it
    // never emits null when clicking the already-selected option.
    const value = event.value as ThemePreference;
    if (value) this.theme.setPreference(value);
  }
}
