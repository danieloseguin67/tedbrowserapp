import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

import { TedService } from '../../core/services/ted.service';
import { SearchResponse, TedVideo } from '../../core/models/video.model';
import { PaginationComponent } from '../../shared/components/pagination/pagination.component';

@Component({
  selector: 'app-search-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, PaginationComponent],
  templateUrl: './search-page.component.html',
  styleUrl: './search-page.component.scss'
})
export class SearchPageComponent {
  readonly categories = this.tedService.getCategories();
  readonly form = new FormGroup({
    keyword: new FormControl('', { nonNullable: true }),
    category: new FormControl('', { nonNullable: true })
  });

  videos: TedVideo[] = [];
  currentPage = 1;
  totalPages = 1;
  totalResults = 0;
  readonly pageSize = 10;
  isLoading = false;
  errorMessage = '';

  constructor(private readonly tedService: TedService) {
    this.search(1);
  }

  onSubmit(): void {
    this.search(1);
  }

  onPageChange(page: number): void {
    this.search(page);
  }

  trackById(_: number, video: TedVideo): string {
    return video.id;
  }

  onImgError(event: Event): void {
    (event.target as HTMLImageElement).src =
      "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 9'%3E%3Crect width='16' height='9' fill='%23e8f0f9'/%3E%3Ctext x='8' y='4.8' text-anchor='middle' dominant-baseline='middle' font-family='sans-serif' font-size='2.4' font-weight='700' fill='%23b0bcc8'%3ETED%3C/text%3E%3C/svg%3E";
  }

  private search(page: number): void {
    this.isLoading = true;
    this.errorMessage = '';

    const { keyword, category } = this.form.getRawValue();

    this.tedService.searchVideos(keyword, category, page, this.pageSize).subscribe({
      next: (response: SearchResponse) => {
        this.videos = response.items;
        this.totalResults = response.total;
        this.totalPages = response.totalPages;
        this.currentPage = response.page;
        this.isLoading = false;
      },
      error: (error: HttpErrorResponse) => {
        this.videos = [];
        this.totalResults = 0;
        this.totalPages = 1;
        this.currentPage = 1;
        this.isLoading = false;
        this.errorMessage =
          error.status === 0
            ? 'Could not reach TED data feeds. Please check your internet connection and retry.'
            : 'Unable to load TED videos right now. Please try again in a moment.';
      }
    });
  }
}
