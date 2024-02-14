/// <reference types="node" />

import type { HttpAsyncHandler, } from '@architect/functions';
import type { EnhanceHeadFn } from '@enhance/types';
import type { RadixRouter } from 'radix3';
import type { HeaderTimers } from 'header-timers';

// I can fix this nonsense by updating @architect/functions types
type ArcRequest = Partial<Parameters<HttpAsyncHandler>[0]>
type ArcResponse = Partial<Exclude<Awaited<ReturnType<HttpAsyncHandler>>, void>>

export type HTTPishMethod = 'get' | 'post' | 'put' | 'patch' | 'destroy' | 'head' | 'options';

export type RouteRecord = {
  api?: {
    fn?: Record<HTTPishMethod, Function>;
    deferredFn?: Promise<Record<HTTPishMethod, Function>>;
    file?: {
      mjs?: string;
    };
  };
  page?: {
    html?: string;
    deferredHtml?: Promise<string>;
    element?: {
      tagName?: string;
      deferredFn?: Promise<Function>;
      fn?: Function;
    };
    file?: {
      html?: string;
      mjs?: string;
    };
  };
}
export type RoutesManifest = Map<string, RouteRecord>;

export type ElementRecord = {
  fn?: Function;
  file?: {
    html?: string;
    mjs?: string;
    component?: string;
  };
}
export type ElementsManifest = Map<string, ElementRecord>;

export type EnhanceRouterOptions = {
  basePath: string;
  apiPath?: string;
  pagesPath?: string;
  elementsPath?: string;
  componentsPath?: string;
  routes?: RoutesManifest;
  elements?: ElementsManifest;
  head?: EnhanceHeadFn;
  state?: Record<string, any>;
  ssrOptions?: Record<string, any>;
  debug?: boolean;
};

export type CreateRouteAndRenderOptions = (
  EnhanceRouterOptions & {
    log: Function,
    radixRouter: RadixRouter,
    elements: ElementsManifest,
    apiPath: string,
    pagesPath: string,
    elementsPath: string,
    componentsPath: string,
    timers: HeaderTimers,
  }
)

export type RouteAndRenderRequest = (ArcRequest & Record<string, any>);
export type RouteAndRenderResult = Promise<(ArcResponse & Record<string, any>)>;

export type EnhanceRender = (
  string: string,
  store?: { req?: ArcRequest, status?: number, error?: any, state?: Record<string, any> },
  elements?: Record<string, Function>
) => Promise<string>;
export type EnhanceRouteAndRender = (
  req: RouteAndRenderRequest,
  state?: Record<string, any>
) => Promise<RouteAndRenderResult>;

export type CreateEnhanceRouteAndRender = (options: CreateRouteAndRenderOptions) => {
  render: EnhanceRender
  routeAndRender: EnhanceRouteAndRender,
};

export type CreateEnhanceRouter = (options: EnhanceRouterOptions) => {
  options: EnhanceRouterOptions;
  routes: RoutesManifest;
  elements: ElementsManifest;
  radixRouter: RadixRouter;
  timers: HeaderTimers;
  log: Function;
  report: Function;
  render: EnhanceRender;
  routeAndRender: EnhanceRouteAndRender;
};

