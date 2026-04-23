import { Component, computed, input } from '@angular/core';
import { Card } from 'primeng/card';
import type { ClassGuide as ClassGuideData } from '../../data/data';

@Component({
  selector: 'dll-class-guide',
  imports: [Card],
  templateUrl: './class-guide.html',
  styleUrl: './class-guide.scss',
})
export class ClassGuide {
  readonly guide = input.required<ClassGuideData>();

  readonly hasAnySpec = computed(() => {
    const g = this.guide();
    return !!(g.engine_configurations || g.minimum_weight || g.rider_age_limit);
  });
}
