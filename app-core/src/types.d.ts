/// <reference types="node" />

// TODO: better naming for types
// ? namespace?

import type { HttpAsyncHandler, } from '@architect/functions';
import type { EnhanceHeadFn, EnhanceElemFn, EnhanceApiFn } from '@enhance/types';
import type { RadixRouter } from 'radix3';
import type { HeaderTimers } from 'header-timers';

// I can fix this nonsense by updating @architect/functions types
type ArcRequest = Partial<Parameters<HttpAsyncHandler>[0]>
type ArcResponse = Partial<Exclude<Awaited<ReturnType<HttpAsyncHandler>>, void>>

export type { EnhanceElemFn }

export type HTTPishMethod = 'get' | 'post' | 'put' | 'patch' | 'destroy' | 'head' | 'options';
export interface ApiDictionary {
  [key in HTTPishMethod]: EnhanceApiFn;
}
export interface EnhanceElements {
  [key: string]: EnhanceElemFn;
};

export type RouteRecord = {
  api?: {
    fn?: ApiDictionary;
    deferredFn?: Promise<ApiDictionary>;
  };
  page?: {
    html?: string;
    deferredHtml?: Promise<string>;
    element?: {
      tagName: string; // required for element
      fn?: EnhanceElemFn;
      deferredFn?: Promise<{ default: EnhanceElemFn }>;
    };
  };
}
export type RoutesManifest = Map<string, RouteRecord>;

export type EnhanceRouterOptions = {
  routes: RoutesManifest;
  elements?: EnhanceElements
  head?: EnhanceHeadFn;
  state?: Record<string, any>;
  ssrOptions?: Record<string, any>;
  debug?: boolean;
};

export type CreateRouteAndRenderOptions = (
  EnhanceRouterOptions & {
    log: {
      (...strings: any[]): void;
      request: (req: ArcRequest) => void;
    },
    radixRouter: RadixRouter,
    elements: EnhanceElements,
  }
)

export type RouteAndRenderRequest = (ArcRequest & Record<string, any>);
export type RouteAndRenderResult = Promise<(ArcResponse & Record<string, any>)>;

export type EnhanceRender = (
  string: string,
  store?: { req?: ArcRequest, status?: number, error?: any, state?: Record<string, any> },
  elements?: EnhanceElements
) => Promise<string>;
export type EnhanceRouteAndRender = (
  req: RouteAndRenderRequest,
  state?: Record<string, any>
) => Promise<RouteAndRenderResult>;

export type CreateEnhanceRouteAndRender = (options: CreateRouteAndRenderOptions) => {
  render: EnhanceRender
  routeAndRender: EnhanceRouteAndRender,
  timers: HeaderTimers
};

export type CreateEnhanceRouter = (options: EnhanceRouterOptions) => {
  options: EnhanceRouterOptions;
  routes: RoutesManifest;
  elements: EnhanceElements;
  radixRouter: RadixRouter;
  timers: HeaderTimers;
  log: Function;
  report: Function;
  render: EnhanceRender;
  routeAndRender: EnhanceRouteAndRender;
};

