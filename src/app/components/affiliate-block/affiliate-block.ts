import { Component, computed, input } from '@angular/core';
import type { AffiliateLink } from '../../data/travel-guides';

@Component({
  selector: 'dll-affiliate-block',
  templateUrl: './affiliate-block.html',
  styleUrl: './affiliate-block.scss',
})
export class AffiliateBlock {
  readonly title = input.required<string>();
  readonly blurb = input<string | undefined>(undefined);
  readonly links = input<AffiliateLink[]>([]);

  readonly hasLinks = computed(() => this.links().length > 0);
}
