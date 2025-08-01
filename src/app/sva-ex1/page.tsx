"use client";

import { useEffect, useState } from "react";
import * as server from "./server";
import { do_, stringify } from "@/utility";

export default function Page() {
  const [message, set_message] = useState("");

  useEffect(() => {
    void do_(async () => {
      // set_message(await server.test());
      set_message(stringify(await server.endpoint("getInstMetadatas")));
    });
  });

  return (
    <div>
      <div>this is the sva-ex1 page</div>
      <div>message: {message}</div>
    </div>
  );
}
