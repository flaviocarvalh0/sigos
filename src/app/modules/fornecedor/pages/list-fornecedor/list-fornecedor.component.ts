import { Component, OnInit } from '@angular/core';
import { FornecedorService } from '../../../../services/fornecedor.service';
import { Fornecedor } from '../../../../Models/fornecedor.model';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';


@Component({
    selector: 'app-fornecedor-list',
    imports: [CommonModule, RouterModule],
    templateUrl: './list-fornecedor.component.html'
})
export class ListFornecedorComponent implements OnInit {

  fornecedores: Fornecedor[] = [];
  carregando = true;
  constructor(private fornecedorService: FornecedorService, private router: Router) {}

  ngOnInit(): void {
    this.carregarFornecedores();
  }

  carregarFornecedores(): void {
    this.fornecedorService.listar().subscribe({
      next: (dados) => {
        this.fornecedores = dados
        this.carregando = false;
      },
      error: (err) => {
        console.error('Erro ao carregar fornecedores', err)
        this.carregando = false;
      }
    });
  }

  novo(): void {
    this.router.navigate(['/fornecedor/form']);
  }

  editar(id: number): void {
    this.router.navigate(['/fornecedor/form', id]);
  }

  excluir(id: number): void {
    if (confirm('Confirma exclusão do fornecedor?')) {
      this.fornecedorService.deletar(id).subscribe({
        next: () => this.carregarFornecedores(),
        error: (err) => console.error('Erro ao excluir fornecedor', err)
      });
    }
  }
}
