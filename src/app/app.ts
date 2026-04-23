import { Component, computed, inject } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';
import { Menubar } from 'primeng/menubar';
import { Button } from 'primeng/button';
import type { MenuItem } from 'primeng/api';
import { ThemeService } from './theme/theme.service';
import { NewsletterSignup } from './components/newsletter-signup/newsletter-signup';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, Menubar, Button, NewsletterSignup],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  private readonly theme = inject(ThemeService);

  readonly preference = this.theme.preference;
  readonly resolved = this.theme.resolved;

  readonly themeIcon = computed(() => {
    const pref = this.preference();
    if (pref === 'system') return 'pi pi-desktop';
    if (pref === 'dark') return 'pi pi-moon';
    return 'pi pi-sun';
  });

  readonly themeAriaLabel = computed<string>(() => {
    const pref = this.preference();
    if (pref === 'system') return 'Theme: system (cycle to light)';
    if (pref === 'dark') return 'Theme: dark (cycle to system)';
    return 'Theme: light (cycle to dark)';
  });

  readonly menu: MenuItem[] = [
    { label: 'Standings', icon: 'pi pi-trophy', routerLink: '/standings' },
    { label: 'Schedule', icon: 'pi pi-calendar', routerLink: '/schedule' },
    { label: 'Results', icon: 'pi pi-flag', routerLink: '/results' },
    { label: 'Riders', icon: 'pi pi-users', routerLink: '/riders' },
    { label: 'Venues', icon: 'pi pi-map-marker', routerLink: '/venues' },
  ];

  cycleTheme(): void {
    this.theme.cycle();
  }
}
