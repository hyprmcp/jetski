import { DatePipe, DecimalPipe, JsonPipe, KeyValuePipe } from '@angular/common';
import { Component, input } from '@angular/core';
import { type CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideEllipsis, lucideEye } from '@ng-icons/lucide';
import { BrnDialogContent, BrnDialogImports } from '@spartan-ng/brain/dialog';
import { HlmButton } from '@spartan-ng/helm/button';
import { HlmIcon } from '@spartan-ng/helm/icon';
import { HlmDialogImports } from '../../../../../../libs/ui/ui-dialog-helm/src';
import type {
  JsonRcpResponse,
  MCPServerLog,
} from '../../../../../api/mcp-server-log';
import { HighlightJsonPipe } from '../../../../pipes/highlight-json-pipe';

@Component({
  selector: 'app-logs-actions',
  imports: [
    HlmButton,
    NgIcon,
    HlmIcon,
    BrnDialogContent,
    HlmDialogImports,
    BrnDialogImports,
    JsonPipe,
    DatePipe,
    DecimalPipe,
    KeyValuePipe,
    HighlightJsonPipe,
  ],
  providers: [provideIcons({ lucideEllipsis, lucideEye })],
  template: `
    <hlm-dialog>
      <button hlmBtn brnDialogTrigger variant="ghost" class="h-8 w-8 p-0">
        <span class="sr-only">Open menu</span>
        <ng-icon hlm size="sm" name="lucideEye" />
      </button>

      <hlm-dialog-content
        class="md:max-w-3xl overflow-y-auto max-h-screen"
        *brnDialogContent="let ctx"
      >
        <hlm-dialog-header>
          <h3 brnDialogTitle>Tool Call Details</h3>
        </hlm-dialog-header>

        <div class="flex flex-col gap-4 pt-4">
          <div>
            <strong>Timestamp: </strong>
            <span>{{ mcpServerLog().startedAt | date: 'long' }}</span>
          </div>

          <div>
            <strong>Duration: </strong>
            <span>{{ mcpServerLog().duration / 1000 / 1000 | number }} ms</span>
          </div>

          @if (mcpServerLog().userAgent) {
            <div>
              <strong>User Agent: </strong>
              <span>{{ mcpServerLog().userAgent }}</span>
            </div>
          }

          @if (typeof mcpServerLog().httpStatusCode === 'number') {
            <div>
              <strong>HTTP Status: </strong>
              <span>{{ mcpServerLog().httpStatusCode }}</span>
            </div>
          }

          @if (mcpServerLog().mcpRequest; as request) {
            <div>
              <strong>Method: </strong>
              <span>{{ request.method }}</span>
            </div>

            @if (request.params) {
              @if (request.method === 'tools/call') {
                <div>
                  <strong>Tool: </strong>
                  <span>{{ request.params.name }}</span>
                </div>

                @if (request.params.arguments) {
                  <div>
                    <strong>Arguments: </strong>
                    <dl class="ps-4">
                      @for (
                        kv of request.params.arguments | keyvalue;
                        track kv.key
                      ) {
                        <dt class="font-bold inline">{{ kv.key }}:&nbsp;</dt>
                        <dd class="inline font-mono">{{ kv.value | json }}</dd>
                      }
                    </dl>
                  </div>
                }

                @if (mcpServerLog().mcpResponse; as response) {
                  @if (getResponseTextContent(response); as content) {
                    <div>
                      <strong>Response Content: </strong>
                      <pre
                        class="whitespace-pre-wrap text-sm bg-muted dark:bg-primary-foreground rounded-sm p-2 mt-1"
                        >{{ content }}</pre
                      >
                    </div>
                  }

                  @if (getResponseStructuredContent(response); as content) {
                    <div>
                      <strong>Response Structured Content: </strong>
                      <pre
                        class="overflow-auto text-sm bg-muted dark:bg-primary-foreground rounded-sm p-2 mt-1"
                        [innerHtml]="content | hljson"
                      ></pre>
                    </div>
                  }
                }
              }
            }
          }

          @if (mcpServerLog().mcpRequest; as request) {
            <details>
              <summary class="cursor-pointer">
                <strong>Raw Request</strong>
              </summary>
              <pre
                class="overflow-auto text-sm bg-muted dark:bg-primary-foreground rounded-sm p-2 mt-1"
                [innerHtml]="request | hljson"
              ></pre>
            </details>
          }

          @if (mcpServerLog().mcpResponse; as response) {
            <details>
              <summary class="cursor-pointer">
                <strong>Raw Response</strong>
              </summary>
              <pre
                class="overflow-auto text-sm bg-muted dark:bg-primary-foreground rounded-sm p-2 mt-1"
                [innerHtml]="response | hljson"
              ></pre>
            </details>
          }
        </div>
      </hlm-dialog-content>
    </hlm-dialog>
  `,
})
export class LogsActionsComponent {
  mcpServerLog = input.required<MCPServerLog>();

  protected getResponseTextContent(
    response: JsonRcpResponse,
  ): string | undefined {
    // there can only be one content item with type "text"
    return (response.result as CallToolResult)?.content?.find(
      (it) => it.type === 'text',
    )?.text;
  }

  protected getResponseStructuredContent(response: JsonRcpResponse): unknown {
    return (response.result as CallToolResult)?.structuredContent;
  }
}
