import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-pagination',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './pagination.component.html',
  styleUrl: './pagination.component.scss'
})
export class PaginationComponent {
  @Input({ required: true }) currentPage = 1;
  @Input({ required: true }) totalPages = 1;

  @Output() readonly pageChange = new EventEmitter<number>();

  pages(): number[] {
    const pages = [this.currentPage - 1, this.currentPage, this.currentPage + 1].filter(
      (page) => page >= 1 && page <= this.totalPages
    );

    if (!pages.includes(1)) {
      pages.unshift(1);
    }

    if (!pages.includes(this.totalPages)) {
      pages.push(this.totalPages);
    }

    return [...new Set(pages)];
  }

  goToPage(page: number): void {
    if (page === this.currentPage || page < 1 || page > this.totalPages) {
      return;
    }

    this.pageChange.emit(page);
  }
}
