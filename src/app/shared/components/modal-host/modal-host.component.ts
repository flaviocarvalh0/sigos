import { Component, ViewChild, ViewContainerRef } from '@angular/core';

@Component({
  selector: 'app-modal-host',
  standalone: true,
  template: `
    <div class="modal fade show d-block" tabindex="-1" style="background: rgba(0,0,0,0.5);">
      <div class="modal-dialog modal-lg">
        <div class="modal-content">
          <!-- Aqui é onde o conteúdo será injetado -->
          <ng-container #modalContainer></ng-container>
        </div>
      </div>
    </div>
  `,
})
export class ModalHostComponent {
  @ViewChild('modalContainer', { read: ViewContainerRef, static: true })
  viewContainerRef!: ViewContainerRef;
}
