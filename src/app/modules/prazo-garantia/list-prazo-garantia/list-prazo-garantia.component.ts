
import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { PrazoGarantia } from '../../../Models/prazo_garantia.model';
import { PrazoGarantiaService } from '../../../services/prazo_garantia.service';

declare const bootstrap: any;

@Component({
    selector: 'app-list-prazo-garantia',
    templateUrl: './list-prazo-garantia.component.html',
    styleUrl: './list-prazo-garantia.component.css',
    imports: [RouterModule, CommonModule],
    standalone: true,
})
export class ListPrazoGarantiaComponent implements OnInit {
  @ViewChild('toast') toastElement!: ElementRef;
  prazoGarantia: PrazoGarantia[] = [];
  carregando = true;

  constructor(
    private prazoGarantiaService: PrazoGarantiaService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.carregando = true;
    this.prazoGarantiaService.listar().subscribe({
      next: (data) => {
        this.prazoGarantia = data;
        this.verificarFimCarregamento();
      },
      error: () => this.verificarFimCarregamento(),
    });
  }

  pendentes = 2;
  verificarFimCarregamento() {
    this.pendentes--;
    if (this.pendentes === 0) {
      this.carregando = false;
    }
  }

  editarPrazoGarantia(id: number) {
    this.router.navigate(['/prazo_garantia/form', id]);
  }

  novoPrazoGarantia() {
    this.router.navigate(['/prazo_garantia/form']);
  }

  excluir(id: number) {
    if (confirm('Tem certeza que deseja excluir este modelo?')) {
      this.prazoGarantiaService.excluir(id).subscribe(() => {
        this.prazoGarantia = this.prazoGarantia.filter((p) => p.id !== id);
        this.showToast('Prazo de garantia excluído com sucesso!');
      }, error => {
        console.error('Erro ao excluir prazo de garantia', error);
        this.showToast('Erro ao excluir prazo de garantia');
      });
    }
  }

  private showToast(message: string): void {
    const toastEl = document.getElementById('liveToast');
    if (toastEl) {
      const toastBody = toastEl.querySelector('.toast-body');
      if (toastBody) toastBody.textContent = message;

      const toast = new bootstrap.Toast(toastEl);
      toast.show();
    }
  }
}
