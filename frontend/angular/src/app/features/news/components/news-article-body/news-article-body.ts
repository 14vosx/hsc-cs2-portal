import { Component, input, ViewEncapsulation } from '@angular/core';

@Component({
  selector: 'app-news-article-body',
  imports: [],
  templateUrl: './news-article-body.html',
  styleUrl: './news-article-body.css',
  encapsulation: ViewEncapsulation.None,
})
export class NewsArticleBody {
  readonly contentHtml = input.required<string>();
}
