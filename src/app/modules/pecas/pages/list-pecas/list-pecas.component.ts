import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PecaService } from '../../../../services/peca.service';
import { ToastService } from '../../../../services/toast.service';
import { ListagemDinamicaComponent } from '../../../../shared/components/listagem-dinamica/listagem-dinamica.component';
import { Peca } from '../../../../Models/peca.model';

@Component({
  selector: 'app-list-peca',
  template: `<app-listagem-dinamica
              titulo="Lista de Peças"
              [dados]="pecas"
              [colunas]="colunas"
              (editar)="editarPeca($event)"
              (excluir)="excluirPeca($event)"
              (criarNovo)="novaPeca()">
            </app-listagem-dinamica>`,
  standalone: true,
  imports: [CommonModule, FormsModule, ListagemDinamicaComponent]
})
export class ListPecaComponent implements OnInit {
novaPeca() {
 this.router.navigate(["/peca/form"]);
}
  pecas: Peca[] = [];
  colunas = [
    { campo: 'id', titulo: 'ID', ordenavel: true, largura: '80px', filtro: true },
    { campo: 'nome', titulo: 'Nome', ordenavel: true, filtro: true},
    { campo: 'precoCusto', titulo: 'Preço Custo', tipo: 'moeda', filtro: false },
    { campo: 'precoVenda', titulo: 'Preço Venda', tipo: 'moeda', filtro: false  },
    { campo: 'localizacaoFisica', titulo: 'Localização', filtro: true  },
    { campo: 'quantidadeEstoque', titulo: 'Qtd Estoque', filtro: false  },
    { campo: 'quantidadeMinimaEstoque', titulo: 'Qtd Mínima', filtro: false  },
  ];

  constructor(
    private pecaService: PecaService,
    private router: Router,
    private toastService: ToastService
  ) {}

  ngOnInit(): void {
    this.carregarPecas();
  }

  carregarPecas(): void {
    this.pecaService.obterTodos().subscribe({
      next: pecas => this.pecas = pecas,
      error: err => this.toastService.error('Erro ao carregar peças: ' + err.message)
    });
  }

  editarPeca(id: number): void {
    this.router.navigate(['/peca/form', id]);
  }

  excluirPeca(id: number): void {
    this.pecaService.remover(id).subscribe({
      next: () => {
        this.toastService.success('Peça excluída com sucesso!');
        this.carregarPecas();
      },
      error: err => this.toastService.error('Erro ao excluir peça: ' + err.message)
    });
  }
}
