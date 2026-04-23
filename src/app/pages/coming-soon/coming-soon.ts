import { Component, OnInit, inject, input } from '@angular/core';
import { SeoService } from '../../seo/seo.service';

// Placeholder for top-level routes whose Angular implementation hasn't landed
// yet. Keeps URLs stable and prerender-discoverable so /standings, /schedule,
// etc. don't 404 between phases. Each phase replaces one of these with the
// real component.
@Component({
  selector: 'dll-coming-soon',
  templateUrl: './coming-soon.html',
  styleUrl: './coming-soon.scss',
})
export class ComingSoon implements OnInit {
  private readonly seo = inject(SeoService);

  readonly heading = input.required<string>();
  readonly path = input.required<string>();

  ngOnInit(): void {
    this.seo.setMeta({
      title: this.heading(),
      description: `${this.heading()} — coming soon to Double Long Lap.`,
      canonical: this.path(),
    });
  }
}
