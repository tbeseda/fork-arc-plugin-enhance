/// <reference types="node" />

// TODO: better naming for types
// ? namespace?

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
    fn?: {
      [key in HTTPishMethod]?: Function;
    };
    deferredFn?: Promise<Record<HTTPishMethod, Function>>;
  };
  page?: {
    html?: string;
    deferredHtml?: Promise<string>;
    element?: {
      tagName?: string;
      deferredFn?: Promise<Function>;
      fn?: Function;
    };
  };
}
export type RoutesManifest = Map<string, RouteRecord>;

export type EnhanceRouterOptions = {
  routes: RoutesManifest;
  elements?: {
    [key: string]: Function;
  };
  head?: EnhanceHeadFn;
  state?: Record<string, any>;
  ssrOptions?: Record<string, any>;
  debug?: boolean;
};

export type CreateRouteAndRenderOptions = (
  EnhanceRouterOptions & {
    log: Function,
    radixRouter: RadixRouter,
    elements: Record<string, Function>,
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
  elements: Record<string, Function>;
  radixRouter: RadixRouter;
  timers: HeaderTimers;
  log: Function;
  report: Function;
  render: EnhanceRender;
  routeAndRender: EnhanceRouteAndRender;
};

