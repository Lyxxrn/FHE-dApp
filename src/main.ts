import { bootstrapApplication } from '@angular/platform-browser';
import { MessageService } from 'primeng/api';
import { appConfig } from './app/app.config';
import { App } from './app/app';

bootstrapApplication(App, {
  ...appConfig,
  providers: [
    ...(appConfig.providers ?? []),
    MessageService
  ]
}).catch(err => console.error(err));
