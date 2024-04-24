/**
 * Copyright (c) HashiCorp, Inc.
 * SPDX-License-Identifier: MPL-2.0
 */

const core = require("@actions/core");
const { Octokit } = require("@octokit/core");
const { retry } = require("@octokit/plugin-retry");
const { throttling } = require("@octokit/plugin-throttling");
const { createUnathenticatedAuth } = require("@octokit/auth-unauthenticated");

const rateLimitRetries = 5;
const secondaryRateLimitRetries = 5;

async function client(version, token) {
  const opts = {
    throttle: {
      onRateLimit: (retryAfter, options) => {
        core.info(
          `Rate limit triggered for request ${options.method} ${options.url} (attempt ${options.request.retryCount}/${rateLimitRetries})`,
        );

        if (options.request.retryCount < rateLimitRetries) {
          core.info(`Retrying after ${retryAfter} seconds`);
          return true;
        }

        core.warning(
          `Exhausted rate limit retry count (${rateLimitRetries}) for ${options.method} ${options.url}`,
        );
      },
      onSecondaryRateLimit: (retryAfter, options) => {
        core.info(
          `Secondary rate limit triggered for request ${options.method} ${options.url} (attempt ${options.request.retryCount}/${secondaryRateLimitRetries})`,
        );

        if (options.request.retryCount < secondaryRateLimitRetries) {
          core.info(`Retrying after ${retryAfter} seconds`);
          return true;
        }

        core.warning(
          `Exhausted secondary rate limit retry count (${secondaryRateLimitRetries}) for ${options.method} ${options.url}`,
        );
      },
    },
    userAgent: `action-setup-enos/${version}"`,
  };

  if (token !== undefined && token.length > 0) {
    core.debug(`Using auth-token strategy (${token}:${token.length})`);
    opts.auth = token;
  } else {
    core.debug(`Using auth-unauthenticated strategy`);
    opts.authStrategy = createUnathenticatedAuth;
  }

  const Client = Octokit.plugin(throttling, retry).defaults(opts);

  return new Client();
}

module.exports = {
  client,
};
