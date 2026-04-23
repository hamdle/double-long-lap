import { Component, OnInit, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Chip } from 'primeng/chip';
import { SeoService } from '../../seo/seo.service';

@Component({
  selector: 'dll-results-index',
  imports: [RouterLink, Chip],
  templateUrl: './results-index.html',
  styles: `.h4 { font-size: 1.5rem; line-height: 2rem; font-weight: 275; }`,
})
export class ResultsIndex implements OnInit {
  private readonly seo = inject(SeoService);

  ngOnInit(): void {
    this.seo.setMeta({
      title: 'Results',
      description: 'Race-by-race MotoAmerica results, class by class.',
      canonical: '/results',
    });
  }
}
