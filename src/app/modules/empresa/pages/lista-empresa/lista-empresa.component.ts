import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { Empresa } from '../../../../Models/empresa.model';
import { EmpresaService } from '../../../../services/empresa.service';

@Component({
  selector: 'app-empresa-list',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './lista-empresa.component.html',
})
export class ListEmpresaComponent implements OnInit {
  empresas: Empresa[] = [];

  constructor(private empresaService: EmpresaService, private router: Router) {}

  ngOnInit(): void {
    this.loadEmpresas();
  }

  loadEmpresas() {
    this.empresaService.getEmpresas().subscribe(data => (this.empresas = data));
  }

  editar(id: number) {
    this.router.navigate(['/empresa/form', id]);
  }

  excluir(id: number) {
    if (confirm('Confirma exclusão?')) {
      this.empresaService.
      deleteEmpresa(id).subscribe(() => this.loadEmpresas());
    }
  }

  novo() {
    this.router.navigate(['/empresa/form']);
  }
}
