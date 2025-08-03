import { Sig } from "@/library/sva";
import { Subtype } from "@/utility";

export const name = "sva-ex1" as const;

export type S = Subtype<
  {
    name: typeof name;
    params_initialize: { prompt: string };
    params_action: { prompt: string };
    state: { counter: number };
    view: { prompts: string[] };
    action: { prompt: string };
  },
  Sig
>;
