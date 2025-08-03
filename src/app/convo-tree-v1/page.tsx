"use client";

import { ClientInst, InstMetadata } from "@/library/sva";
import { useEffect, useState } from "react";
import { S } from "./common";
import * as server from "./server";
import styles from "./page.module.css";
import { formatDate, stringify } from "@/utility";

export default function Page() {
  const [instMetadatas, set_instMetadatas] = useState<InstMetadata[]>([]);
  const [inst, set_inst] = useState<ClientInst<S> | undefined>();

  async function update_instMetadatas() {
    set_instMetadatas(await server.endpoint("getInstMetadatas"));
  }

  async function saveInst(name?: string) {
    await server.endpoint("saveInst", name);
    await update_instMetadatas();
  }

  async function submitActionParams(params: S["params_action"]) {
    await server.endpoint("actInst", params);
    await server.endpoint("saveInst");
    set_inst(await server.endpoint("getInst"));
  }

  async function submitInitializationParams(params: S["params_initialize"]) {
    await server.endpoint("initializeInst", params);
    set_inst(await server.endpoint("getInst"));
  }

  async function loadInst(id: string) {
    await server.endpoint("loadInst", id);
    set_inst(await server.endpoint("getInst"));
  }

  useEffect(() => {
    void update_instMetadatas();
  }, [inst]);

  return (
    <div className={styles.Page}>
      <div className={styles.sidebar}>
        <div className={styles.section}>
          <div className={styles.title}>New</div>
          <textarea
            className={styles.textarea}
            onKeyDown={(event) => {
              if ((event.ctrlKey || event.metaKey) && event.key === "Enter") {
                event.preventDefault();
                const params: S["params_initialize"] = {
                  prompt: event.currentTarget.value,
                };
                event.currentTarget.value = "";
                void submitInitializationParams(params);
              }
            }}
          />
        </div>
        <div className={styles.section}>
          <div className={styles.title}>Load</div>
          <div>
            {instMetadatas.map((md, i) => (
              <button onClick={() => void loadInst(md.id)} key={i}>
                <div>
                  <div>{`name: ${md.name}`}</div>
                  <div>{`id: ${md.id}`}</div>
                  <div>{`creationDate: ${formatDate(new Date(md.creationDate))}`}</div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
      <div className={styles.main}>
        {inst === undefined ? (
          <></>
        ) : (
          <ViewComponent
            inst={inst}
            saveInst={saveInst}
            submitActionParams={submitActionParams}
          />
        )}
      </div>
    </div>
  );
}

function ViewComponent(props: {
  inst: ClientInst<S>;
  saveInst: (name?: string) => Promise<void>;
  submitActionParams: (params: S["params_action"]) => Promise<void>;
}) {
  return (
    <div className={styles.View}>
      <pre>{stringify(props.inst.metadata)}</pre>
    </div>
  );
}
