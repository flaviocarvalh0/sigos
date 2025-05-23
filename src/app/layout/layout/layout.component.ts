import { Component, HostListener, Renderer2 } from '@angular/core';
import { CommonModule, NgClass } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth/auth.service';

@Component({
    selector: 'app-layout',
    imports: [CommonModule, RouterModule, NgClass],
    templateUrl: './layout.component.html',
    styleUrls: ['./layout.component.css'],
    standalone : true,
})
export class LayoutComponent {
  isSidebarCollapsed = false;
  isDarkTheme = false;

  constructor(private renderer: Renderer2, public auth: AuthService) {
    this.checkScreenWidth();
  }

  @HostListener('window:resize', [])
  onResize() {
    this.checkScreenWidth();
  }

  private checkScreenWidth() {
    if (typeof window !== 'undefined') {
      this.isSidebarCollapsed = window.innerWidth < 768;
    }
  }

  toggleSidebar() {
    this.isSidebarCollapsed = !this.isSidebarCollapsed;
  }

  toggleTheme() {
    this.isDarkTheme = !this.isDarkTheme;

    if (this.isDarkTheme) {
      this.renderer.addClass(document.body, 'dark-theme');
    } else {
      this.renderer.removeClass(document.body, 'dark-theme');
    }
  }
}
