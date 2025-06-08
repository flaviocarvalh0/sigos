import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { CrudService } from '../crud.service';
import { Workflow } from '../../Models/workflow/workflow.model';
import { environment } from '../../environments/environment';


@Injectable({ providedIn: 'root' })
export class WorkflowService extends CrudService<Workflow, number>{
  protected readonly apiUrlBase = environment.apiUrl;
  protected readonly endpoint = 'workflows';

  constructor(http: HttpClient) {
    super(http);
  }
}
