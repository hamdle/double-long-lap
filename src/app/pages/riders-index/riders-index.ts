import { Component, OnInit, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TableModule } from 'primeng/table';
import { getAllRiders, type RiderProfile } from '../../data/data';
import { SeoService } from '../../seo/seo.service';

type RiderRow = RiderProfile & {
  classesLabel: string;
};

@Component({
  selector: 'dll-riders-index',
  imports: [RouterLink, TableModule],
  templateUrl: './riders-index.html',
  styles: `.h4 { font-size: 1.5rem; line-height: 2rem; font-weight: 275; }`,
})
export class RidersIndex implements OnInit {
  private readonly seo = inject(SeoService);

  readonly riders: RiderRow[] = getAllRiders().map((r) => ({
    ...r,
    classesLabel: r.appearances.map((a) => a.class_name).join(', '),
  }));

  ngOnInit(): void {
    this.seo.setMeta({
      title: 'Riders',
      description: 'MotoAmerica rider profiles and career highlights.',
      canonical: '/riders',
    });
  }
}
