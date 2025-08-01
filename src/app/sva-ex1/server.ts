/* eslint-disable @typescript-eslint/no-unused-vars */

"use server";

import { Endpoint, Sig, Spec } from "@/library/sva";
import { Server } from "@/library/sva-server";
import { Codomain, Domains } from "@/utility";
import { S } from "./common";

export async function test() {
  return "hello world";
}

const spec: Spec<S> = {
  name: "sva-ex1",
  initialize: (metadata, params) => {
    throw new Error("Function not implemented.");
  },
  view: (metadata, turns, state) => {
    throw new Error("Function not implemented.");
  },
  generateActions: (state, params) => {
    throw new Error("Function not implemented.");
  },
  interpretAction: (state, params, action) => {
    throw new Error("Function not implemented.");
  },
};

const server = new Server(spec);

// BEGIN endpoint

const endpoint_impl = server.make_endpoint();

export async function endpoint<S extends Sig, K extends keyof Endpoint<S>>(
  key: K,
  ...args: Domains<Endpoint<S>[K]>
): Promise<Codomain<Endpoint<S>[K]>> {
  const f = endpoint_impl;
  // @ts-expect-error apparently type checker can't substitute keys properly
  return await f[key](...args);
}

// END endpoint
