export type Sig = {
  name: string;
  params_initialize: unknown;
  params_action: unknown;
  state: unknown;
  view: unknown;
  action: unknown;
};

export type InstMetadata = {
  id: string;
  name: string;
  creationDate: number;
};

export type Spec<S extends Sig> = {
  name: S["name"];
  initializeState: (
    metadata: InstMetadata,
    params: S["params_initialize"],
  ) => Promise<S["state"]>;
  view: (
    metadata: InstMetadata,
    turns: Turn<S>[],
    state: S["state"],
  ) => Promise<S["view"]>;
  generateActions: (
    turns: Turn<S>[],
    state: S["state"],
    params: S["params_action"],
  ) => Promise<S["action"][]>;
  // only here should the state be modified
  interpretAction: (
    state: S["state"],
    params: S["params_action"],
    action: S["action"],
  ) => Promise<void>;
};

export type Inst<S extends Sig> = {
  metadata: InstMetadata;
  initialState: S["state"];
  turns: Turn<S>[];
  state: S["state"];
};

export type Turn<S extends Sig> = {
  params: S["params_action"];
  state: S["state"];
  actions: S["action"][];
};

export type ClientInst<S extends Sig> = {
  metadata: InstMetadata;
  view: S["view"];
};

export type Endpoint<S extends Sig> = {
  getInstMetadatas: () => Promise<InstMetadata[]>;
  initializeInst: (params: S["params_initialize"]) => Promise<InstMetadata>;
  loadInst: (id: string) => Promise<void>;
  saveInst: (name?: string) => Promise<void>;
  getInst: () => Promise<ClientInst<S>>;
  actInst: (params: S["params_action"]) => Promise<void>;
};
