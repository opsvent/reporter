# Changelog

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

### [0.1.2](https://github.com/opsvent/reporter/compare/v0.1.1...v0.1.2) (2023-07-01)


### Bug Fixes

* **PingJob:** Avoid collision if multiple instances are running on the same machine ([607a653](https://github.com/opsvent/reporter/commit/607a653fb662106a176bdf6054167bebf25738a2))
* **ScriptJob:** Check for function type and timeout on initial script run ([4f16d71](https://github.com/opsvent/reporter/commit/4f16d7125510ca989f8a2c8c0de819b7005ea9a5))

### 0.1.1 (2023-05-26)


### Features

* Implemented job execution and reporting for all the monitor types except the script monitor ([52edb49](https://github.com/opsvent/reporter/commit/52edb49c756caebaf3eb38d92a5fefd5a7685fcc))
* **ScriptJob:** Implemented script job runner using isolated-vm ([63c5dbf](https://github.com/opsvent/reporter/commit/63c5dbf126586231479a8dfb72dfa99a6afcfe39))


### Bug Fixes

* **PingJob:** Added session close to ping job ([edb0bf7](https://github.com/opsvent/reporter/commit/edb0bf729d3a552fa754fc434e634ca17e1ba532))
* **Runner:** Unschedule all jobs before scheduling new jobs using the current scheduling system ([4a8cfb9](https://github.com/opsvent/reporter/commit/4a8cfb9a7c116de384773edd11c67494e405b1d3))


### Build/CI

* Added support for esm modules ([8df0a1c](https://github.com/opsvent/reporter/commit/8df0a1ca27dd243b7c93fe6bb9aed130e2e597ca))
* Initialized development environment ([4d0b1a2](https://github.com/opsvent/reporter/commit/4d0b1a291c19c37aeebe8e5639607a65d7a154e7))
