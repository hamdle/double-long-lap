import { DOCUMENT } from '@angular/common';
import {
  Injectable,
  PLATFORM_ID,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

export type ThemePreference = 'system' | 'light' | 'dark';

const STORAGE_KEY = 'dll.theme';
const DARK_CLASS = 'is-dark';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly doc = inject(DOCUMENT);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly isBrowser = isPlatformBrowser(this.platformId);

  readonly preference = signal<ThemePreference>(this.readStoredPreference());
  private readonly systemDark = signal<boolean>(this.readSystemDark());

  readonly resolved = computed(() => {
    const pref = this.preference();
    if (pref === 'system') return this.systemDark() ? 'dark' : 'light';
    return pref;
  });

  constructor() {
    if (this.isBrowser) {
      const mq = window.matchMedia('(prefers-color-scheme: dark)');
      mq.addEventListener('change', (e) => this.systemDark.set(e.matches));
    }
    effect(() => this.applyClass(this.resolved()));
    effect(() => this.persistPreference(this.preference()));
  }

  setPreference(pref: ThemePreference): void {
    this.preference.set(pref);
  }

  cycle(): void {
    const order: ThemePreference[] = ['system', 'light', 'dark'];
    const i = order.indexOf(this.preference());
    this.setPreference(order[(i + 1) % order.length]);
  }

  private applyClass(scheme: 'light' | 'dark'): void {
    const html = this.doc.documentElement;
    if (scheme === 'dark') html.classList.add(DARK_CLASS);
    else html.classList.remove(DARK_CLASS);
    html.style.colorScheme = scheme;
  }

  private readStoredPreference(): ThemePreference {
    if (!this.isBrowser) return 'system';
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw === 'light' || raw === 'dark' || raw === 'system') return raw;
    return 'system';
  }

  private persistPreference(pref: ThemePreference): void {
    if (!this.isBrowser) return;
    window.localStorage.setItem(STORAGE_KEY, pref);
  }

  private readSystemDark(): boolean {
    if (!this.isBrowser) return true; // default to dark during SSR/prerender
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  }
}
