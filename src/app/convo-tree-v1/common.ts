/* eslint-disable @typescript-eslint/no-empty-object-type */

import { Sig } from "@/library/sva";
import { Subtype } from "@/utility";

export const name = "convo-tree-v1" as const;

export type S = Subtype<
  {
    name: typeof name;
    params_initialize: { prompt: string };
    params_action: { prompt: string };
    state: State;
    view: View;
    action: Action;
  },
  Sig
>;

export type State = {};

export type View = {};

export type Action = {};
