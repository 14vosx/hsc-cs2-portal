import { Component, ChangeDetectionStrategy } from '@angular/core';
import { TestBed } from '@angular/core/testing';

@Component({
  selector: 'app-testing-foundation',
  changeDetection: ChangeDetectionStrategy.Eager,
  template: '<p>{{ message }}</p>',
})
class TestingFoundationComponent {
  readonly message = 'Angular TestBed with Vitest';
}

describe('Angular testing foundation', () => {
  it('renders a component through TestBed', async () => {
    await TestBed.configureTestingModule({
      imports: [TestingFoundationComponent],
    }).compileComponents();

    const fixture = TestBed.createComponent(TestingFoundationComponent);
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain(
      'Angular TestBed with Vitest',
    );
  });
});
