/* eslint-disable @typescript-eslint/no-empty-object-type */

import { Sig } from "@/library/sva";
import { Subtype } from "@/utility";

export type S = Subtype<
  {
    name: "sva-ex1";
    params_initialize: {};
    params_action: {};
    state: {};
    view: {};
    action: {};
  },
  Sig
>;
