/// <reference types="node" />

// * EnhanceLoad's main job:
//   transforms ElementsManifest into EnhanceElements
//   and RoutesManifest into CoreRoutesManifest

import type { HeaderTimers } from 'header-timers';
import type {
  EnhanceElements,
  RouteRecord as CoreRouteRecord,
  RoutesManifest as CoreRoutesManifest,
} from '../../app-core/src/types';

export type { CoreRouteRecord, CoreRoutesManifest, EnhanceElements };

export type RouteRecord = {
  api?: {
    mjs?: string;
  };
  page?: {
    html?: string;
    mjs?: string;
  };
}
export type RoutesManifest = Map<string, RouteRecord>;

export type ElementRecord = {
  html?: string;
  mjs?: string;
  component?: string;
}
export type ElementsManifest = Map<string, ElementRecord>;

export type LoadOptions = {
  basePath: string;
  apiPath?: string;
  pagesPath?: string;
  elementsPath?: string;
  componentsPath?: string;
  debug?: boolean;
};

export type EnhanceLoad = (options: LoadOptions) => {
  routes: CoreRoutesManifest;
  elements: EnhanceElements;
  timers: HeaderTimers;
};

