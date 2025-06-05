import { Routes } from '@angular/router';
import { AuthGuard } from './guards/auth.guard';
import { RoleGuard } from './guards/role.guard'; // Certifique-se que este guarda está configurado para ler 'data: { roles: [...] }'

import { LoginComponent } from './modules/usuario/pages/login/login.component';
import { EsqueciSenhaComponent } from './modules/usuario/pages/esqueci-senha/esqueci-senha.component';

import { LayoutComponent } from './shared/components/layout/layout.component';

import { FormUsuarioComponent } from './modules/usuario/pages/form-usuario/form-usuario.component';
import { ListUsuarioComponent } from './modules/usuario/pages/list-usuario/list-usuario.component';

// Importe outros componentes de página conforme necessário (ListaClienteComponent, etc.)
import { ListaClienteComponent } from './modules/cliente/pages/lista-clientes/lista-clientes.component';
import { FormClienteComponent } from './modules/cliente/pages/form-cliente/form-cliente.component';
import { ListEmpresaComponent } from './modules/empresa/pages/lista-empresa/lista-empresa.component';
import { FormEmpresaComponent } from './modules/empresa/pages/form-empresa/form-empresa.component';
// ... importe todos os seus componentes de listagem e formulário ...
import { ListFornecedorComponent } from './modules/fornecedor/pages/list-fornecedor/list-fornecedor.component';
import { FormFornecedorComponent } from './modules/fornecedor/pages/form-fornecedor/form-fornecedor.component';
import { ListAparelhoComponent } from './modules/aparelho/pages/list-aparelho/list-aparelho.component';
import { FormAparelhoComponent } from './modules/aparelho/pages/form-aparelho/form-aparelho.component';
import { ListMarcaComponent } from './modules/marca/pages/list-marca/list-marca.component';
import { FormMarcaComponent } from './modules/marca/pages/form-marca/form-marca.component';
import { ListModeloComponent } from './modules/modelo/pages/list-modelo/list-modelo.component';
import { FormModeloComponent } from './modules/modelo/pages/form-modelo/form-modelo.component';
import { ListServicoComponent } from './modules/servico/pages/list-servico/list-servico.component';
import { FormServicoComponent } from './modules/servico/pages/form-servico/form-servico.component';
import { ListPecaComponent } from './modules/pecas/pages/list-pecas/list-pecas.component';
import { FormPecaComponent } from './modules/pecas/pages/form-peca/form-peca.component';
import { ListPrazoGarantiaComponent } from './modules/prazo-garantia/list-prazo-garantia/list-prazo-garantia.component';
import { FormPrazoGarantiaComponent } from './modules/prazo-garantia/form-prazo-garantia/form-prazo-garantia.component';
import { ListMovimentoEstoqueComponent } from './modules/movimento-estoque/list-movimento-estoque/list-movimento-estoque.component';
import { FormMovimentoEstoqueComponent } from './modules/movimento-estoque/form-movimento-estoque/form-movimento-estoque.component';
import { OrdemServicoComponent } from './modules/ordem-servico/service-orders-page/service-orders-page.component';
import { FormOrdemServicoComponent } from './modules/ordem-servico/form-ordem-servico/form-ordem-servico.component';
import { ListCategoriaComponent } from './modules/categoria/pages/list-categoria/list-categoria.component';
import { FormCategoriaComponent } from './modules/categoria/pages/form-categoria/form-categoria.component';
import { AdminLayoutComponent } from './modules/admin/layout/admin-layout/admin-layout.component';
// Supondo que você criará este para a área admin:
// import { ListGruposComponent } from './admin/pages/list-grupos/list-grupos.component';


export const routes: Routes = [
  {
    path: 'login',
    component: LoginComponent,
    data: { animation: 'LoginPage' },
  },
  {
    path: 'esqueci-senha',
    component: EsqueciSenhaComponent,
    data: { animation: 'EsqueciSenhaPage' },
  },
  {
    path: 'admin', // Prefixo para todas as rotas administrativas
    component: AdminLayoutComponent,
    canActivate: [AuthGuard, RoleGuard],
    data: {
      animation: 'AdminPage',
    },
    children: [
      { path: '', redirectTo: 'usuarios', pathMatch: 'full' }, // /admin -> /admin/usuarios
      {
        path: 'usuarios',
        component: ListUsuarioComponent,
        // canActivate: [RoleGuard], // RoleGuard já está no pai, redundante aqui se a regra for a mesma
      },
      {
        path: 'usuarios/novo',
        component: FormUsuarioComponent,
      },
      {
        path: 'usuarios/editar/:id', // Admin editando qualquer usuário
        component: FormUsuarioComponent,
      }
    ],
  },
  {
    path: '', // Rotas principais da aplicação (layout não-admin)
    component: LayoutComponent,
    canActivate: [AuthGuard], // Protege todas as rotas filhas
    data: { animation: 'LayoutPage' },
    children: [
      { path: '', redirectTo: 'ordem-servico', pathMatch: 'full' }, // Rota padrão da aplicação

      // Rota para o usuário editar o PRÓPRIO perfil
      {
        path: 'meu-perfil/editar/:id', // Rota distinta para edição do próprio perfil
        component: FormUsuarioComponent,
      },

      // Suas rotas de CRUD existentes
      { path: 'cliente', component: ListaClienteComponent, data: { animation: 'ClientePage' } },
      { path: 'cliente/form', component: FormClienteComponent },
      { path: 'cliente/form/:id', component: FormClienteComponent },

      { path: 'empresa', component: ListEmpresaComponent, data: { animation: 'EmpresaPage' } },
      { path: 'empresa/form', component: FormEmpresaComponent }, // Assumindo que pode haver um form sem ID para criar
      { path: 'empresa/form/:id', component: FormEmpresaComponent },

      { path: 'fornecedor', component: ListFornecedorComponent, data: { animation: 'FornecedorPage' } },
      { path: 'fornecedor/form', component: FormFornecedorComponent },
      { path: 'fornecedor/form/:id', component: FormFornecedorComponent },

      { path: 'aparelho', component: ListAparelhoComponent, data: { animation: 'AparelhoPage' } },
      { path: 'aparelho/form', component: FormAparelhoComponent },
      { path: 'aparelho/form/:id', component: FormAparelhoComponent },

      { path: 'marca', component: ListMarcaComponent, data: { animation: 'MarcaPage' } },
      { path: 'marca/form', component: FormMarcaComponent },
      { path: 'marca/form/:id', component: FormMarcaComponent },

      { path: 'modelo', component: ListModeloComponent, data: { animation: 'ModeloPage' } },
      { path: 'modelo/form', component: FormModeloComponent },
      { path: 'modelo/form/:id', component: FormModeloComponent },

      { path: 'servico', component: ListServicoComponent, data: { animation: 'ServicoPage' } },
      { path: 'servico/form', component: FormServicoComponent },
      { path: 'servico/form/:id', component: FormServicoComponent },

      { path: 'peca', component: ListPecaComponent, data: { animation: 'PecaPage' } },
      { path: 'peca/form', component: FormPecaComponent },
      { path: 'peca/form/:id', component: FormPecaComponent },

      { path: 'prazo_garantia', component: ListPrazoGarantiaComponent, data: { animation: 'PrazoGarantiaPage' } },
      { path: 'prazo_garantia/form', component: FormPrazoGarantiaComponent },
      { path: 'prazo_garantia/form/:id', component: FormPrazoGarantiaComponent },

      { path: 'movimento-estoque', component: ListMovimentoEstoqueComponent, data: { animation: 'MovimentnoEstoquePage' } },
      { path: 'movimento-estoque/form', component: FormMovimentoEstoqueComponent },
      { path: 'movimento-estoque/form/:id', component: FormMovimentoEstoqueComponent },

      { path: 'ordem-servico', component: OrdemServicoComponent, data: { animation: 'OrdemServicoPage' } }, // Corrigido animation
      { path: 'ordem-servico/form', component: FormOrdemServicoComponent, data: { animation: 'FormOsPage' } }, // Corrigido animation
      { path: 'ordem-servico/form/:id', component: FormOrdemServicoComponent, data: { animation: 'FormOsPage' } }, // Corrigido animation

      { path: 'categoria', component: ListCategoriaComponent, data: { animation: 'CategoriaPage' } },
      { path: 'categoria/form', component: FormCategoriaComponent },
      { path: 'categoria/form/:id', component: FormCategoriaComponent },

      { path: '**', redirectTo: 'ordem-servico' }, // Wildcard dentro do layout principal
    ],
  },
  { path: '**', redirectTo: 'login' }, // Wildcard global no final de todas as rotas
];
