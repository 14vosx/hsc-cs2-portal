import { DOCUMENT } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, input, ViewEncapsulation } from '@angular/core';

@Component({
  selector: 'app-news-article-body',
  imports: [],
  templateUrl: './news-article-body.html',
  styleUrl: './news-article-body.css',
  changeDetection: ChangeDetectionStrategy.Eager,
  encapsulation: ViewEncapsulation.None,
})
export class NewsArticleBody {
  private readonly document = inject(DOCUMENT);

  readonly contentHtml = input.required<string>();
  protected readonly renderableContentHtml = computed(() =>
    removeExecutableHtml(this.contentHtml(), this.document),
  );
}

function removeExecutableHtml(content: string, document: Document): string {
  const template = document.createElement('template');
  template.innerHTML = content;

  template.content.querySelectorAll('script').forEach((script) => script.remove());
  template.content.querySelectorAll('*').forEach((element) => {
    for (const attribute of Array.from(element.attributes)) {
      if (attribute.name.toLowerCase().startsWith('on')) {
        element.removeAttribute(attribute.name);
      }
    }
  });

  return template.innerHTML;
}
