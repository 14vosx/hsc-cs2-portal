import { Component, input, ViewEncapsulation, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'app-news-article-body',
  imports: [],
  templateUrl: './news-article-body.html',
  styleUrl: './news-article-body.css',
  changeDetection: ChangeDetectionStrategy.Eager,
  encapsulation: ViewEncapsulation.None,
})
export class NewsArticleBody {
  readonly contentHtml = input.required<string>();
}
