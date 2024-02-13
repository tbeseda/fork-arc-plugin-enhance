/// <reference types="node" />

import type { HttpAsyncHandler, } from '@architect/functions';
import type { EnhanceHeadFn } from '@enhance/types';
import type { RadixRouter } from 'radix3';

// I can fix this nonsense by updating @architect/functions types
type ArcRequest = Partial<Parameters<HttpAsyncHandler>[0]>
type ArcResponse = Partial<Exclude<Awaited<ReturnType<HttpAsyncHandler>>, void>>

type ElementsManifest = Map<string, {
  html?: string;
  mjs?: string;
  component?: string;
}>;

type RoutesManifest = Map<string, {
  api?: string;
  page?: {
    html?: string;
    mjs?: string;
  };
}>;

export type EnhanceRouterOptions = {
  basePath: string;
  apiPath: string;
  pagesPath: string;
  elementsPath: string;
  componentsPath: string;
  head?: EnhanceHeadFn;
  state?: Record<string, any>;
  ssrOptions?: Record<string, any>;
  lazy?: boolean;
  debug?: boolean;
};

export type CreateRouteAndRenderOptions = (
  EnhanceRouterOptions & {
    log: Function,
    radixRouter: RadixRouter,
    elements: ElementsManifest,
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
  log: Function;
  report: Function;
  routes: RoutesManifest;
  radixRouter: RadixRouter;
  elements: ElementsManifest;
  routeAndRender: EnhanceRouteAndRender;
  render: EnhanceRender;
};

