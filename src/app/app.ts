import { Component, inject } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';
import { Menubar } from 'primeng/menubar';
import type { MenuItem } from 'primeng/api';
import { ThemeService } from './theme/theme.service';
import { SiteFooter } from './components/site-footer/site-footer';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, Menubar, SiteFooter],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  // Injected so the service bootstraps at app load — its constructor applies
  // the persisted theme preference to <html> and subscribes to system
  // prefers-color-scheme changes. The user-facing toggle lives in the footer.
  private readonly theme = inject(ThemeService);

  readonly menu: MenuItem[] = [
    { label: 'Standings & Results', icon: 'pi pi-trophy', routerLink: '/standings/2026/superbike' },
    { label: 'Schedule', icon: 'pi pi-calendar', routerLink: '/schedule' },
    { label: 'Riders', icon: 'pi pi-users', routerLink: '/riders' },
    { label: 'Venues', icon: 'pi pi-map-marker', routerLink: '/venues' },
  ];
}
