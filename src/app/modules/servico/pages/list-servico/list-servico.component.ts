import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Servico } from '../../../../Models/servico.mode';
import { ServicoService } from '../../../../services/service.service';


@Component({
    selector: 'app-list-servico',
    templateUrl: './list-servico.component.html',
    styleUrl: './list-servico.component.css',
    imports: [RouterModule, CommonModule],
    standalone: true,
})
export class ListServicoComponent implements OnInit {
  @ViewChild('toast') toastElement!: ElementRef;
  servicos: Servico[] = [];
  carregando = true;

  constructor(
    private servicoService: ServicoService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.carregarServicos();
  }

  carregarServicos() {
    this.servicoService.listar().subscribe({
      next: (data) => {
        this.servicos = data;
      }
    });
  }

  editarServico(id: number) {
    this.router.navigate(['/servico/form', id]);
  }

  novoServico() {
    this.router.navigate(['/servico/form']);
  }

  excluir(id: number) {
    if (confirm('Tem certeza que deseja excluir este modelo?')) {
      this.servicoService.excluir(id).subscribe(() => {
        this.servicos = this.servicos.filter((m) => m.id !== id);
      });

      this.carregarServicos();
    }
  }
}
