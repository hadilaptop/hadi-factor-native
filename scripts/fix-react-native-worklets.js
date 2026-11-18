const fs = require("node:fs");
const path = require("node:path");

const root = path.join(__dirname, "..");
const workletsHeader = path.join(
  root,
  "node_modules",
  "react-native-worklets",
  "android",
  "src",
  "main",
  "cpp",
  "worklets",
  "android",
  "JScriptBufferWrapper.h",
);

if (fs.existsSync(workletsHeader)) {
  const original = fs.readFileSync(workletsHeader, "utf8");
  const obsoleteInclude = "#include <jsireact/JSIExecutor.h>";
  if (original.includes(obsoleteInclude)) {
    const updated = original
      .replaceAll(obsoleteInclude + "\r\n", "")
      .replaceAll(obsoleteInclude + "\n", "");
    fs.writeFileSync(workletsHeader, updated, "utf8");
  }
  if (fs.readFileSync(workletsHeader, "utf8").includes(obsoleteInclude)) {
    throw new Error("[Hadman Factor] Could not remove the unused React Native JSIExecutor include.");
  }
}

const mountingHeader = path.join(
  root,
  "node_modules",
  "react-native",
  "ReactCommon",
  "react",
  "renderer",
  "mounting",
  "MountingOverrideDelegate.h",
);
const mountingHeaderSource = String.raw`/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <react/renderer/mounting/MountingTransaction.h>

#pragma once

namespace facebook::react {

class MountingCoordinator;

/**
 * Generic interface for anything that needs to override specific
 * MountingCoordinator methods. This is for platform-specific escape hatches
 * like animations.
 */
class MountingOverrideDelegate {
 public:
  virtual bool shouldOverridePullTransaction() const = 0;
  virtual ~MountingOverrideDelegate() = default;

  /**
   * Delegates that override this method are responsible for:
   *
   * - Returning a MountingTransaction with mutations
   * - Calling
   * - Telemetry, if appropriate
   *
   * @param surfaceId the Id of the surface to be mounted
   * @param number of the transaction
   * @param telemetry object associated with the transaction
   * @param mutations list of the mutations from the ShadowTree
   * @return the mounting transaction, if it was created
   */
  virtual std::optional<MountingTransaction> pullTransaction(
      SurfaceId surfaceId,
      MountingTransaction::Number number,
      const TransactionTelemetry &telemetry,
      ShadowViewMutationList mutations) const = 0;
};

} // namespace facebook::react
`;

if (!fs.existsSync(mountingHeader)) {
  fs.writeFileSync(mountingHeader, mountingHeaderSource, "utf8");
}
const verifiedMountingHeader = fs.readFileSync(mountingHeader, "utf8");
if (!verifiedMountingHeader.includes("class MountingOverrideDelegate")) {
  throw new Error("[Hadman Factor] React Native MountingOverrideDelegate compatibility header is invalid.");
}

console.log("[Hadman Factor] React Native/Worklets Android compatibility patch verified.");
