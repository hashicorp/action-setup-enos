/**
 * Copyright IBM Corp. 2022, 2025
 * SPDX-License-Identifier: MPL-2.0
 */

import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    sequence: {
      hooks: "list",
    },
  },
});
