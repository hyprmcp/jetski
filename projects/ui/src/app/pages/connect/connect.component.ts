import { Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { HeaderComponent } from '../../components/header/header.component';
import { ContextService } from '../../services/context.service';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  lucideArrowRight,
  lucideCheck,
  lucidePlus,
  lucideUndo,
} from '@ng-icons/lucide';
import { Organization } from '../../../api/organization';
import { Project } from '../../../api/project';

@Component({
  templateUrl: './connect.component.html',
  imports: [HeaderComponent, NgIcon],
  viewProviders: [
    provideIcons({ lucideArrowRight, lucideCheck, lucideUndo, lucidePlus }),
  ],
})
export class ConnectComponent {
  private readonly context = inject(ContextService);
  private readonly route = inject(ActivatedRoute);
  protected readonly orgs = this.context.organizations;
  protected readonly allProjects = this.context.projects;
  protected readonly projects = computed(() => {
    const org = this.selectedOrg();
    if (org === undefined) {
      return [];
    }
    const projects = this.allProjects.value();
    return projects?.filter((it) => it.organizationId === org.id);
  });

  protected selectedOrg = signal<Organization | undefined>(undefined);
  protected selectedProject = signal<Project | undefined>(undefined);
}
