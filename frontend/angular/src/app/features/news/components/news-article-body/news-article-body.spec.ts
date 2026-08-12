import { ComponentFixture, TestBed } from '@angular/core/testing';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { beforeEach, describe, expect, it } from 'vitest';

import { NewsArticleBody } from './news-article-body';

describe('NewsArticleBody', () => {
  let fixture: ComponentFixture<NewsArticleBody>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NewsArticleBody],
    }).compileComponents();
  });

  function setupFixture(contentHtml: string) {
    fixture = TestBed.createComponent(NewsArticleBody);
    fixture.componentRef.setInput('contentHtml', contentHtml);
    fixture.detectChanges();
    return fixture;
  }

  it('1. componente é criado', () => {
    setupFixture('<p>Hello</p>');
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('2. renderiza parágrafo HTML como elemento', () => {
    setupFixture('<p>Paragraph content</p>');
    const pEl = fixture.nativeElement.querySelector('p');
    expect(pEl).toBeTruthy();
    expect(pEl?.textContent).toBe('Paragraph content');
  });

  it('3. renderiza headings', () => {
    setupFixture('<h2>Heading 2</h2><h3>Heading 3</h3>');
    expect(fixture.nativeElement.querySelector('h2')?.textContent).toBe('Heading 2');
    expect(fixture.nativeElement.querySelector('h3')?.textContent).toBe('Heading 3');
  });

  it('4. renderiza strong e em', () => {
    setupFixture('<p><strong>Bold</strong> and <em>Italic</em></p>');
    expect(fixture.nativeElement.querySelector('strong')?.textContent).toBe('Bold');
    expect(fixture.nativeElement.querySelector('em')?.textContent).toBe('Italic');
  });

  it('5. renderiza listas', () => {
    setupFixture('<ul><li>Item 1</li><li>Item 2</li></ul>');
    const items = fixture.nativeElement.querySelectorAll('li');
    expect(items.length).toBe(2);
    expect(items[0].textContent).toBe('Item 1');
  });

  it('6. renderiza blockquote', () => {
    setupFixture('<blockquote><p>Quote content</p></blockquote>');
    const quote = fixture.nativeElement.querySelector('blockquote');
    expect(quote).toBeTruthy();
    expect(quote?.textContent?.trim()).toBe('Quote content');
  });

  it('7. renderiza links HTTP válidos', () => {
    setupFixture('<a href="https://example.com">External Link</a>');
    const link = fixture.nativeElement.querySelector('a');
    expect(link).toBeTruthy();
    expect(link?.getAttribute('href')).toBe('https://example.com');
  });

  it('8. renderiza imagem válida', () => {
    setupFixture('<img src="https://example.com/photo.jpg" alt="Photo" />');
    const img = fixture.nativeElement.querySelector('img');
    expect(img).toBeTruthy();
    expect(img?.getAttribute('src')).toBe('https://example.com/photo.jpg');
  });

  it('9. preserva texto e estrutura de múltiplos elementos', () => {
    const html = '<h1>Title</h1><p>First</p><p>Second</p>';
    setupFixture(html);
    expect(fixture.nativeElement.querySelectorAll('p').length).toBe(2);
  });

  it('10. contentHtml vazio produz body vazio sem fallback inventado', () => {
    setupFixture('');
    const body = fixture.nativeElement.querySelector('.news-article-body');
    expect(body?.innerHTML.trim()).toBe('');
  });

  it('11. não interpola tags como texto', () => {
    setupFixture('<p>Rendered Tag</p>');
    expect(fixture.nativeElement.textContent).not.toContain('<p>');
  });

  it('12. elemento script não permanece no DOM renderizado', () => {
    setupFixture('<script>alert("xss")</script><p>Safe</p>');
    expect(fixture.nativeElement.querySelector('script')).toBeNull();
  });

  it('13. atributo de evento como onerror não permanece no DOM', () => {
    setupFixture('<img src="invalid" onerror="alert(1)" />');
    const img = fixture.nativeElement.querySelector('img');
    expect(img?.getAttribute('onerror')).toBeNull();
  });

  it('14. não usa bypassSecurityTrustHtml', () => {
    const tsCode = readFileSync(join(__dirname, 'news-article-body.ts'), 'utf-8');
    expect(tsCode).not.toContain('bypassSecurityTrustHtml');
  });

  it('15. não importa DomSanitizer ou SafeHtml', () => {
    const tsCode = readFileSync(join(__dirname, 'news-article-body.ts'), 'utf-8');
    expect(tsCode).not.toContain('DomSanitizer');
    expect(tsCode).not.toContain('SafeHtml');
  });

  it('16. usa [innerHTML] no template', () => {
    const htmlCode = readFileSync(join(__dirname, 'news-article-body.html'), 'utf-8');
    expect(htmlCode).toContain('[innerHTML]');
  });

  it('17. usa ViewEncapsulation.None', () => {
    const tsCode = readFileSync(join(__dirname, 'news-article-body.ts'), 'utf-8');
    expect(tsCode).toContain('ViewEncapsulation.None');
  });

  it('18. todos os seletores CSS não vazios estão namespaced por .news-article-body', () => {
    const cssCode = readFileSync(join(__dirname, 'news-article-body.css'), 'utf-8');
    const lines = cssCode
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l.endsWith('{'));

    for (const line of lines) {
      if (line.startsWith('@')) {
        continue;
      }
      const selectors = line.replace('{', '').split(',');
      for (const selector of selectors) {
        const trimmed = selector.trim();
        if (trimmed) {
          expect(trimmed.startsWith('.news-article-body')).toBe(true);
        }
      }
    }
  });

  it('19. não importa DTOs', () => {
    const tsCode = readFileSync(join(__dirname, 'news-article-body.ts'), 'utf-8');
    expect(tsCode.toLowerCase()).not.toContain('dto');
  });

  it('20. não conhece NewsApiService', () => {
    const tsCode = readFileSync(join(__dirname, 'news-article-body.ts'), 'utf-8');
    expect(tsCode).not.toContain('NewsApiService');
  });
});
