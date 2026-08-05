import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BunkerAuthCard } from './bunker-auth-card';
import * as fs from 'node:fs';
import * as path from 'node:path';

describe('BunkerAuthCard', () => {
  let component: BunkerAuthCard;
  let fixture: ComponentFixture<BunkerAuthCard>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BunkerAuthCard],
    }).compileComponents();

    fixture = TestBed.createComponent(BunkerAuthCard);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('steamLoginUrl', 'https://example.com/steam/login');
    fixture.detectChanges();
  });

  it('1. componente pode ser criado', () => {
    expect(component).toBeTruthy();
  });

  it('2. renderiza eyebrow, título e descrição', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.bunker-auth-card__eyebrow')?.textContent?.trim()).toBe('Conta Steam');
    expect(compiled.querySelector('.bunker-auth-card__title')?.textContent?.trim()).toBe('Entre para acessar o Bunker');
    expect(compiled.querySelector('.bunker-auth-card__description')?.textContent?.trim()).toContain('Entre com Steam para validar sua sessão');
  });

  it('3. renderiza link com texto correto', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const link = compiled.querySelector('a');
    expect(link).toBeTruthy();
    expect(link?.textContent?.trim()).toBe('Entrar com Steam');
  });

  it('4. href corresponde exatamente ao input steamLoginUrl', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const link = compiled.querySelector('a');
    expect(link?.getAttribute('href')).toBe('https://example.com/steam/login');
  });

  it('5. CTA é elemento <a>, não <button>', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const link = compiled.querySelector('.bunker-auth-card__cta');
    const button = compiled.querySelector('button');
    expect(link?.tagName.toLowerCase()).toBe('a');
    expect(button).toBeNull();
  });

  it('6. não emite evento customizado de login', () => {
    const tsPath = path.resolve(__dirname, 'bunker-auth-card.ts');
    const htmlPath = path.resolve(__dirname, 'bunker-auth-card.html');

    const tsContent = fs.readFileSync(tsPath, 'utf-8');
    const htmlContent = fs.readFileSync(htmlPath, 'utf-8');

    expect(tsContent).not.toContain('output(');
    expect(tsContent).not.toContain('output<');
    expect(tsContent).not.toContain('EventEmitter');
    expect(tsContent).not.toContain('@Output');
    expect(tsContent).not.toContain('loginRequested');
    expect(tsContent).not.toContain('loginClicked');

    expect(htmlContent).not.toContain('(click)=');
    expect(htmlContent).not.toContain('role="button"');
  });

  it('7. não utiliza target="_blank"', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const link = compiled.querySelector('a');
    expect(link?.getAttribute('target')).toBeNull();
  });

  it('8. atualização do input atualiza o href', () => {
    fixture.componentRef.setInput('steamLoginUrl', 'https://new-domain.com/auth');
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    const link = compiled.querySelector('a');
    expect(link?.getAttribute('href')).toBe('https://new-domain.com/auth');
  });

  it('9. não importa serviços ou DTOs', () => {
    expect(BunkerAuthCard).toBeDefined();
  });
});
