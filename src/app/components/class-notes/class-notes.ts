import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import type { NoteParagraph } from '../../data/class-notes';

@Component({
  selector: 'dll-class-notes',
  imports: [RouterLink],
  templateUrl: './class-notes.html',
  styleUrl: './class-notes.scss',
})
export class ClassNotes {
  readonly paragraphs = input.required<NoteParagraph[]>();
}
