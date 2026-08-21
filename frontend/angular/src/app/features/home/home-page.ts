import { AsyncPipe, DecimalPipe, DOCUMENT } from '@angular/common';
import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  QueryList,
  ViewChildren,
  inject,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { LucideChevronDown, LucideCrown } from '@lucide/angular';
import { TranslatePipe } from '@ngx-translate/core';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Observable, shareReplay } from 'rxjs';

import { PlayerSessionService } from '../../core/session/player-session.service';
import { PlayerAvatar } from '../../shared/components/player-avatar/player-avatar';
import { HomeApiService } from './data-access/home-api.service';
import type {
  HomeNewsState,
  HomeRecentMatch,
  HomeRecentMatchesState,
  HomeSeasonContextMode,
  HomeSeasonState,
} from './domain/home-season.model';

gsap.registerPlugin(ScrollTrigger);

@Component({
  selector: 'app-home-page',
  imports: [AsyncPipe, DecimalPipe, RouterLink, LucideChevronDown, LucideCrown, TranslatePipe, PlayerAvatar],
  templateUrl: './home-page.html',
  styleUrl: './home-page.css',
  changeDetection: ChangeDetectionStrategy.Eager,
})
export class HomePage implements AfterViewInit {
  private readonly homeApi = inject(HomeApiService);
  private readonly document = inject(DOCUMENT);
  private readonly destroyRef = inject(DestroyRef);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  protected readonly playerSession = inject(PlayerSessionService);

  @ViewChildren('motionSection', { read: ElementRef })
  private motionSections!: QueryList<ElementRef<HTMLElement>>;

  private readonly boundMotionSections = new WeakSet<HTMLElement>();
  private motionMedia: ReturnType<typeof gsap.matchMedia> | null = null;

  protected readonly seasonState$: Observable<HomeSeasonState> = this.homeApi
    .getHomeSeasonMetrics()
    .pipe(shareReplay({ bufferSize: 1, refCount: true }));

  protected readonly matchesState$: Observable<HomeRecentMatchesState> = this.homeApi
    .getRecentMatches()
    .pipe(shareReplay({ bufferSize: 1, refCount: true }));

  protected readonly newsState$: Observable<HomeNewsState> = this.homeApi
    .getHomeNews()
    .pipe(shareReplay({ bufferSize: 1, refCount: true }));

  constructor() {
    this.destroyRef.onDestroy(() => this.motionMedia?.revert());
  }

  ngAfterViewInit(): void {
    if (!this.document.defaultView) {
      return;
    }

    this.motionMedia = gsap.matchMedia(this.host.nativeElement);
    this.bindMotionSections();
    this.motionSections.changes
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.bindMotionSections());
  }

  private bindMotionSections(): void {
    if (!this.motionMedia) {
      return;
    }

    for (const sectionRef of this.motionSections) {
      const section = sectionRef.nativeElement;
      if (this.boundMotionSections.has(section)) {
        continue;
      }
      this.boundMotionSections.add(section);
      this.motionMedia.add({
        desktop: '(min-width: 761px) and (prefers-reduced-motion: no-preference)',
        compact: '(max-width: 760px) and (prefers-reduced-motion: no-preference)',
        reduceMotion: '(prefers-reduced-motion: reduce)',
      }, (context) => {
        const conditions = context.conditions as {
          desktop: boolean;
          compact: boolean;
          reduceMotion: boolean;
        };
        if (!conditions.reduceMotion) {
          this.animateMotionSection(section, conditions.compact);
        }
      });
    }
  }

  private animateMotionSection(section: HTMLElement, compact: boolean): void {
    switch (section.dataset['motion']) {
      case 'hero':
        this.animateHero(section, compact);
        break;
      case 'leader':
        this.animateLeader(section, compact);
        break;
      case 'now':
        this.animateNow(section, compact);
        break;
      case 'recent':
        this.animateRecent(section, compact);
        break;
      case 'player':
        this.animatePlayerArea(section, compact);
        break;
      case 'news':
        this.animateNews(section, compact);
        break;
    }
  }

  private animateHero(section: HTMLElement, compact: boolean): void {
    const background = section.querySelector<HTMLElement>('.home-structural-background--hero');
    const content = section.querySelector<HTMLElement>('.home-hero__content');
    const cue = section.querySelector<HTMLElement>('.home-scroll-cue');
    if (background) {
      gsap.to(background, {
        yPercent: compact ? 6 : 12,
        scale: compact ? 1.14 : 1.19,
        ease: 'none',
        scrollTrigger: { trigger: section, start: 'top top', end: 'bottom top', scrub: compact ? 1.4 : 0.9 },
      });
    }
    if (content) {
      gsap.from(content, { x: compact ? -12 : -24, duration: 0.8, ease: 'power2.out' });
    }
    if (cue) {
      gsap.to(cue, { y: compact ? 5 : 8, duration: 1.15, ease: 'power1.inOut', repeat: -1, yoyo: true });
    }
  }

  private animateLeader(section: HTMLElement, compact: boolean): void {
    const background = section.querySelector<HTMLElement>('.home-leader__background');
    if (background) {
      gsap.to(background, {
        yPercent: compact ? 2 : 4,
        scale: compact ? 1.065 : 1.09,
        ease: 'none',
        scrollTrigger: { trigger: section, start: 'top bottom', end: 'bottom top', scrub: 1.5 },
      });
    }
  }

  private animateNow(section: HTMLElement, compact: boolean): void {
    const heading = section.querySelector<HTMLElement>('.home-section__heading');
    const accent = section.querySelector<HTMLElement>('.home-now-accent');
    const leaderboardRows = section.querySelectorAll<HTMLElement>('.home-leaderboard__row');
    const latestMatch = section.querySelector<HTMLElement>('.home-latest-match');
    const timeline = gsap.timeline({
      scrollTrigger: { trigger: section, start: compact ? 'top 88%' : 'top 82%', once: true },
    });
    if (heading) {
      timeline.from(heading, { x: compact ? -14 : -28, duration: 0.55, ease: 'power2.out' });
    }
    if (accent) {
      timeline.from(accent, { scaleX: 0.18, duration: 0.4, ease: 'power2.out' }, '-=0.25');
    }
    if (leaderboardRows.length > 0) {
      timeline.from(leaderboardRows, {
        x: compact ? -12 : -26,
        y: compact ? 6 : 10,
        opacity: 0.6,
        duration: 0.45,
        stagger: 0.08,
        ease: 'power2.out',
      }, '-=0.12');
    }
    if (latestMatch) {
      const badge = latestMatch.querySelector('.home-latest-match__badge');
      const teamOne = latestMatch.querySelector('.home-scoreboard__team:first-child');
      const teamTwo = latestMatch.querySelector('.home-scoreboard__team--right');
      const score = latestMatch.querySelector('.home-scoreboard__score');
      const metadata = latestMatch.querySelector('.home-meta');
      timeline.from(latestMatch, {
        x: compact ? 0 : 28,
        y: compact ? 14 : 0,
        scale: 0.985,
        duration: 0.55,
        ease: 'power2.out',
      }, '-=0.18');
      if (badge) {
        timeline.from(badge, { y: -8, duration: 0.3, ease: 'power2.out' }, '-=0.4');
      }
      if (teamOne && teamTwo) {
        timeline.from(teamOne, { x: compact ? -8 : -18, duration: 0.35, ease: 'power2.out' }, '-=0.28');
        timeline.from(teamTwo, { x: compact ? 8 : 18, duration: 0.35, ease: 'power2.out' }, '<');
      }
      if (score) {
        timeline.from(score, { scale: 0.94, duration: 0.38, ease: 'back.out(1.4)' }, '-=0.2');
      }
      if (metadata) {
        timeline.from(metadata, { y: 8, duration: 0.3, ease: 'power2.out' }, '-=0.2');
      }
    }
  }

  private animateRecent(section: HTMLElement, compact: boolean): void {
    const heading = section.querySelector<HTMLElement>('.home-section__heading');
    if (heading) {
      gsap.from(heading, {
        x: compact ? -12 : -26,
        duration: 0.65,
        ease: 'power2.out',
        scrollTrigger: { trigger: section, start: compact ? 'top 90%' : 'top 84%', once: true },
      });
    }
  }

  private animatePlayerArea(section: HTMLElement, compact: boolean): void {
    const background = section.querySelector<HTMLElement>('.home-structural-background--player');
    const content = section.querySelector<HTMLElement>('.home-player-cta__inner');
    if (background) {
      gsap.to(background, {
        yPercent: compact ? 3 : 7,
        scale: compact ? 1.09 : 1.13,
        ease: 'none',
        scrollTrigger: { trigger: section, start: 'top bottom', end: 'bottom top', scrub: compact ? 1.6 : 1.15 },
      });
    }
    if (content) {
      gsap.from(content, {
        y: compact ? 14 : 26,
        duration: 0.7,
        ease: 'power2.out',
        scrollTrigger: { trigger: section, start: compact ? 'top 90%' : 'top 84%', once: true },
      });
    }
  }

  private animateNews(section: HTMLElement, compact: boolean): void {
    const heading = section.querySelector<HTMLElement>('.home-section__heading');
    const cards = section.querySelectorAll<HTMLElement>('.home-news-card');
    const timeline = gsap.timeline({
      scrollTrigger: { trigger: section, start: compact ? 'top 90%' : 'top 84%', once: true },
    });
    if (heading) {
      timeline.from(heading, { x: compact ? -12 : -26, duration: 0.55, ease: 'power2.out' });
    }
    timeline.from(cards, {
      y: compact ? 14 : 26,
      scale: compact ? 0.995 : 0.985,
      duration: 0.65,
      stagger: 0.12,
      ease: 'power2.out',
    }, '-=0.2');
  }

  protected seasonOverviewLink(seasonSlug: string, contextMode: HomeSeasonContextMode): string {
    return contextMode === 'active' ? '/seasons/current' : `/seasons/${seasonSlug}`;
  }

  protected seasonRankingLink(seasonSlug: string, contextMode: HomeSeasonContextMode): string {
    return contextMode === 'active' ? '/seasons/current/ranking' : `/seasons/${seasonSlug}/ranking`;
  }

  protected formatDate(value: string | null): string | null {
    if (!value) {
      return null;
    }
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return null;
    }
    const day = String(date.getUTCDate()).padStart(2, '0');
    const month = String(date.getUTCMonth() + 1).padStart(2, '0');
    const year = date.getUTCFullYear();
    const hours = String(date.getUTCHours()).padStart(2, '0');
    const minutes = String(date.getUTCMinutes()).padStart(2, '0');
    return `${day}/${month}/${year} · ${hours}:${minutes} UTC`;
  }

  protected matchDate(match: HomeRecentMatch): string | null {
    return this.formatDate(match.seasonLastMapEndedAt);
  }

  protected mapLabel(match: HomeRecentMatch): string | null {
    const maps = match.maps.map((map) => {
      return `${map.name} ${map.team1Score}–${map.team2Score}`;
    });
    return maps.length > 0 ? maps.join(' · ') : null;
  }

  protected playerAreaLabelKey(): string {
    switch (this.playerSession.state().status) {
      case 'authenticated':
        return 'home.playerArea.actions.open';
      case 'anonymous':
      case 'unavailable':
        return 'home.playerArea.actions.signIn';
      default:
        return 'home.playerArea.actions.fallback';
    }
  }
}
