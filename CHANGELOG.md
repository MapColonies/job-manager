# Changelog

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

### [2.10.1](https://github.com/MapColonies/job-manager/compare/v2.10.0...v2.10.1) (2024-12-17)

## [2.10.0](https://github.com/MapColonies/job-manager/compare/v2.9.0...v2.10.0) (2024-12-04)


### Features

* add suspended status code(MAPCO-5527) ([#48](https://github.com/MapColonies/job-manager/issues/48)) ([1cb313a](https://github.com/MapColonies/job-manager/commit/1cb313a4cbcb1c8c8912fdeed413ef0f59f4d87a))

## [2.9.0](https://github.com/MapColonies/job-manager/compare/v2.8.0...v2.9.0) (2024-11-24)


### Features

* added option for releaseInactive to not raise task attempts (MAPCO-5466) ([#46](https://github.com/MapColonies/job-manager/issues/46)) ([660f0db](https://github.com/MapColonies/job-manager/commit/660f0dbea8c5169983c4590316f0e8b08c2c3b2a))

## [2.8.0](https://github.com/MapColonies/job-manager/compare/v2.7.0...v2.8.0) (2024-08-21)


### Features

* add taskType to find query(MAPCO-4570) ([#45](https://github.com/MapColonies/job-manager/issues/45)) ([06fd445](https://github.com/MapColonies/job-manager/commit/06fd44589afb80d1f63caa910edb8d5c53915ebc))


### Bug Fixes

* start pending request log should be debug ([#44](https://github.com/MapColonies/job-manager/issues/44)) ([1028ac1](https://github.com/MapColonies/job-manager/commit/1028ac110f9a1ba4734ea98c77e09a1477c77c76))

## [2.7.0](https://github.com/MapColonies/job-manager/compare/v2.6.4...v2.7.0) (2024-07-14)


### Features

* enable search with multiple types and statuses (MAPCO-4427, MAPCO-4430) ([#41](https://github.com/MapColonies/job-manager/issues/41)) ([17a4724](https://github.com/MapColonies/job-manager/commit/17a4724898873b8dbc5f55f51bbb760da8276dac))

### [2.6.4](https://github.com/MapColonies/job-manager/compare/v2.6.3...v2.6.4) (2024-07-08)


### Bug Fixes

* adapting new CI workflow version ([#40](https://github.com/MapColonies/job-manager/issues/40)) ([deb1672](https://github.com/MapColonies/job-manager/commit/deb16721d0e01d77b32d54981066a933d7931f21))

### [2.6.3](https://github.com/MapColonies/job-manager/compare/v2.6.2...v2.6.3) (2024-07-08)

### [2.6.2](https://github.com/MapColonies/job-manager/compare/v2.6.1...v2.6.2) (2024-07-08)


### Bug Fixes

* handle ingestion vs export raster jobs with nullish identifier ([#39](https://github.com/MapColonies/job-manager/issues/39)) ([d360597](https://github.com/MapColonies/job-manager/commit/d360597a83f196034ac9b65ca6fc58835cb65e4a))

### [2.6.1](https://github.com/MapColonies/job-manager/compare/v2.6.0...v2.6.1) (2024-06-30)


### Bug Fixes

* add default not value empty string to "additionalIdentifiers" ([#38](https://github.com/MapColonies/job-manager/issues/38)) ([6c8d974](https://github.com/MapColonies/job-manager/commit/6c8d97474f1b2e7694f3dc8b07d8909b3140324e))

## [2.6.0](https://github.com/MapColonies/job-manager/compare/v2.5.0...v2.6.0) (2024-03-31)


### Features

* changes for new common job-manager umbrella and new build and push (MAPCO-4080) ([#37](https://github.com/MapColonies/job-manager/issues/37)) ([7b2549e](https://github.com/MapColonies/job-manager/commit/7b2549e94f27b9b64acec8fd2c6dc48cac4a890e))

## [2.5.0](https://github.com/MapColonies/job-manager/compare/v2.4.2...v2.5.0) (2024-02-26)


### Features

* adding traces support (MAPCO-3893) ([#36](https://github.com/MapColonies/job-manager/issues/36)) ([2e8920d](https://github.com/MapColonies/job-manager/commit/2e8920d0fecfc2a7b644679434b7097fb960201d))

### [2.4.2](https://github.com/MapColonies/job-manager/compare/v2.4.1...v2.4.2) (2024-02-15)


### Bug Fixes

* release-tasks-according-to-job-status (MAPCO-3951) ([#31](https://github.com/MapColonies/job-manager/issues/31)) ([a7d42a4](https://github.com/MapColonies/job-manager/commit/a7d42a48e3a8d1657e7120ad7b24299847eb826e))
* reverted job paramters index ([#34](https://github.com/MapColonies/job-manager/issues/34)) ([fb0050d](https://github.com/MapColonies/job-manager/commit/fb0050dd83e8ff04dc67549c1dcfbd3bbebcf832))

### [2.4.1](https://github.com/MapColonies/job-manager/compare/v2.4.0...v2.4.1) (2023-12-31)

## [2.4.0](https://github.com/MapColonies/job-manager/compare/v2.3.2...v2.4.0) (2023-11-22)


### Features

* added get job by job parameters support ([#32](https://github.com/MapColonies/job-manager/issues/32)) ([94ef0a3](https://github.com/MapColonies/job-manager/commit/94ef0a3b8624e94a40acadf41ed6c40b0f27f3e1))

### [2.3.2](https://github.com/MapColonies/job-manager/compare/v2.3.1...v2.3.2) (2023-09-20)


### Bug Fixes

* applied the reverted commit changes ([793616d](https://github.com/MapColonies/job-manager/commit/793616de6dfcce94349c82951b89764dce77c3b5))
* removed chart name from template names (MAPCO-3109) ([#30](https://github.com/MapColonies/job-manager/issues/30)) ([789ef06](https://github.com/MapColonies/job-manager/commit/789ef069449332b7cfe61e55c33f4440f54fb652))
* reverted to previous commit ([08d7cac](https://github.com/MapColonies/job-manager/commit/08d7cac5e9c76e43faea49768c4ed6656c70e9ef))

### [2.3.1](https://github.com/MapColonies/job-manager/compare/v2.3.0...v2.3.1) (2023-08-31)

## [2.3.0](https://github.com/MapColonies/job-manager/compare/v2.2.1...v2.3.0) (2023-08-31)


### Features

* change default get job by id and jobs to return withaot tasks ([#28](https://github.com/MapColonies/job-manager/issues/28)) ([5b4668f](https://github.com/MapColonies/job-manager/commit/5b4668f40db4d59eab87e76ac5eb161e17cb307c))

### [2.2.1](https://github.com/MapColonies/job-manager/compare/v2.2.0...v2.2.1) (2023-05-29)

## [2.2.0](https://github.com/MapColonies/job-manager/compare/v2.1.4...v2.2.0) (2023-05-29)


### Features

* update-task - set status non required (MAPCO-3147) ([#25](https://github.com/MapColonies/job-manager/issues/25)) ([97724fc](https://github.com/MapColonies/job-manager/commit/97724fc6afbcce2478c39f86f791f3d5c8100fce))

### [2.1.4](https://github.com/MapColonies/job-manager/compare/v2.1.3...v2.1.4) (2023-05-21)

### [2.1.3](https://github.com/MapColonies/job-manager/compare/v2.1.2...v2.1.3) (2023-05-18)


### Bug Fixes

* fix build ands push workflow ([#23](https://github.com/MapColonies/job-manager/issues/23)) ([9c995e5](https://github.com/MapColonies/job-manager/commit/9c995e5bd2597ded204703bb00c229f310450754))

### [2.1.2](https://github.com/MapColonies/job-manager/compare/v2.1.1...v2.1.2) (2023-05-14)

### [2.1.1](https://github.com/MapColonies/job-manager/compare/v2.1.0...v2.1.1) (2023-04-04)


### Bug Fixes

* provide types and ignoreTypes array for inactive API (MAPCO-3022) ([#20](https://github.com/MapColonies/job-manager/issues/20)) ([319c529](https://github.com/MapColonies/job-manager/commit/319c5291dfcf1739e053331baf4ac3e10a3f5ad5))

## [2.1.0](https://github.com/MapColonies/job-manager/compare/v2.0.0...v2.1.0) (2023-01-08)


### Features

* available actions support (MAPCO-2734) ([#15](https://github.com/MapColonies/job-manager/issues/15)) ([e9dc177](https://github.com/MapColonies/job-manager/commit/e9dc17759d9a08ec8b1361b5937995f29ef555d5))

## [2.0.0](https://github.com/MapColonies/job-manager/compare/v1.1.1...v2.0.0) (2022-11-27)


### ⚠ BREAKING CHANGES

* add 'domain' identifier field to schema and API (MAPCO-2709) (#13)

### Features

* add 'domain' identifier field to schema and API (MAPCO-2709) ([#13](https://github.com/MapColonies/job-manager/issues/13)) ([0c5cf30](https://github.com/MapColonies/job-manager/commit/0c5cf30430c8ef366666499f473b5668c3f4df5e))

### [1.1.1](https://github.com/MapColonies/job-manager/compare/v1.1.0...v1.1.1) (2022-10-23)


### Bug Fixes

* restrict abort operation on pending and in-progress ([#10](https://github.com/MapColonies/job-manager/issues/10)) ([0715175](https://github.com/MapColonies/job-manager/commit/0715175ee04d41ca81b8eb9ccb1e6a9bd874fbfc))

## [1.1.0](https://github.com/MapColonies/job-manager/compare/v1.0.6...v1.1.0) (2022-09-22)


### Features

* added internalId as optional query param ([#8](https://github.com/MapColonies/job-manager/issues/8)) ([0697e63](https://github.com/MapColonies/job-manager/commit/0697e63a98399f47ec80acc51ab75342873e6873))

### [1.0.6](https://github.com/MapColonies/job-manager/compare/v1.0.5...v1.0.6) (2022-09-08)


### Bug Fixes

* log level info for not found on start pending ([87f072a](https://github.com/MapColonies/job-manager/commit/87f072a367ed6b2ba93334911220d7b189e6d2c8))

### [1.0.5](https://github.com/MapColonies/job-manager/compare/v1.0.4...v1.0.5) (2022-08-29)

### [1.0.4](https://github.com/MapColonies/job-manager/compare/v1.0.3...v1.0.4) (2022-08-23)


### Bug Fixes

* added resstable parm to task update ([#5](https://github.com/MapColonies/job-manager/issues/5)) ([da05a2f](https://github.com/MapColonies/job-manager/commit/da05a2fa5dabeb192b6c82b2fb7885d4f6d59ec4))

### [1.0.3](https://github.com/MapColonies/job-manager/compare/v1.0.2...v1.0.3) (2022-08-21)


### Bug Fixes

* config fix ([#4](https://github.com/MapColonies/job-manager/issues/4)) ([6c0184f](https://github.com/MapColonies/job-manager/commit/6c0184f54dc59bddc72bf689c9952791456fdcbd))

### [1.0.2](https://github.com/MapColonies/job-manager/compare/v1.0.1...v1.0.2) (2022-08-21)


### Bug Fixes

* upgrade deps ([#3](https://github.com/MapColonies/job-manager/issues/3)) ([3ac696e](https://github.com/MapColonies/job-manager/commit/3ac696e4337e2be0f0cbb745b18ca36bae3e9e16))

### [1.0.1](https://github.com/MapColonies/job-manager/compare/v1.0.0...v1.0.1) (2022-08-18)


### Bug Fixes

* revert node12 and es2017 for typeorm 0.2.30 ([#2](https://github.com/MapColonies/job-manager/issues/2)) ([24969a7](https://github.com/MapColonies/job-manager/commit/24969a76976775b4a590b8ee2177289469dc8cb3))

## 1.0.0 (2022-08-18)
