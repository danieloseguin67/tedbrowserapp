import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

import { TedVideo } from '../../core/models/video.model';
import { TedService } from '../../core/services/ted.service';

const IMG_PLACEHOLDER =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 9'%3E%3Crect width='16' height='9' fill='%23e8f0f9'/%3E%3Ctext x='8' y='4.8' text-anchor='middle' dominant-baseline='middle' font-family='sans-serif' font-size='2.4' font-weight='700' fill='%23b0bcc8'%3ETED%3C/text%3E%3C/svg%3E";

@Component({
  selector: 'app-video-detail',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './video-detail.component.html',
  styleUrl: './video-detail.component.scss'
})
export class VideoDetailComponent {
  readonly video: TedVideo | undefined;
  playerActive = false;

  constructor(
    route: ActivatedRoute,
    tedService: TedService,
    private readonly sanitizer: DomSanitizer
  ) {
    const id = route.snapshot.paramMap.get('id') ?? '';
    this.video = tedService.getVideoById(id);
  }

  get posterUrl(): string | null {
    if (!this.video?.youtubeId) return null;
    return `https://img.youtube.com/vi/${this.video.youtubeId}/hqdefault.jpg`;
  }

  get embedUrl(): SafeResourceUrl | null {
    if (!this.video) return null;

    if (this.video.youtubeId) {
      return this.sanitizer.bypassSecurityTrustResourceUrl(
        `https://www.youtube-nocookie.com/embed/${this.video.youtubeId}?autoplay=1&rel=0`
      );
    }

    const match = this.video.link.match(/ted\.com\/talks\/([^?#\/]+)/);
    if (!match) return null;
    return this.sanitizer.bypassSecurityTrustResourceUrl(
      `https://embed.ted.com/talks/${match[1]}`
    );
  }

  activatePlayer(): void {
    this.playerActive = true;
  }

  onImgError(event: Event): void {
    (event.target as HTMLImageElement).src = IMG_PLACEHOLDER;
  }
}
