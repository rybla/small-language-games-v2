import { Sig } from "@/library/sva";
import { Subtype } from "@/utility";

export type S = Subtype<
  {
    name: "sva-ex1";
    params_initialize: { prompt: string };
    params_action: { prompt: string };
    state: { counter: number };
    view: { prompts: string[] };
    action: { prompt: string };
  },
  Sig
>;
