
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

// Importando a classe base e os modelos
import { CrudService } from '../crud.service';
import {
  WorkflowEstado,
  WorkflowEstadoCriacaoPayload,
  WorkflowEstadoAtualizacaoPayload
} from '../../Models/workflow/workflow-estado.model';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class WorkflowEstadoService extends CrudService<WorkflowEstado, number> {
  protected override apiUrlBase: string = environment.apiUrl
  // Define o endpoint específico para este serviço
  protected override readonly endpoint: string = 'workflow-estados';

  constructor(protected override http: HttpClient) {
    super(http);
  }
}
