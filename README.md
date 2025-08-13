# Scoring Logic iApp

This project is an iExec Decentralized Confidential Computing serverless
application that implements scoring logic using Trusted Execution Environment (TEE).

## Overview

This iApp demonstrates secure scoring logic execution:
- **Decrypt** integer A from protected data using MEDPRIVATE key via dataProtector
- **Apply TEE scoring logic**: result = A * 2  
- **Return unencrypted results** for downstream processing

Key features:
- Protected data decryption with dataProtector
- Borsh deserialization for secure data handling
- Fallback to command line arguments for testing
- Deterministic scoring logic execution in TEE

- [Quick start](#quick-start)
  - [Prerequisites](#prerequisites)
  - [`iapp` main commands](#iapp-main-commands)
  - [Develop](#develop)
  - [Test locally](#test-locally)
  - [Deploy on iExec](#deploy-on-iexec)
  - [Run on iExec](#run-on-iexec)
- [Project overview](#project-overview)
- [iApp development guidelines](#iapp-development-guidelines)
  - [iApp inputs](#iapp-inputs)
  - [iApp outputs](#iapp-outputs)
  - [working with libraries](#working-with-libraries)

## Quick start

### Prerequisites

- `iapp` CLI installed locally
- `docker` installed locally
- [dockerhub](https://hub.docker.com/) account
- ethereum wallet

### `iapp` main commands

- [`iapp init`](#develop)
- [`iapp test`](#test-locally)
- [`iapp deploy`](#deploy-on-iexec)

### Develop

`iapp init` scaffolds a ready to hack iApp template.

Start hacking by editing the source code in [./src](./src/).

See [iApp development guidelines](#iapp-development-guidelines) for more details
on the iApp development framework.

### Test locally

Use the `iapp test` command to run your app locally and check your app fulfills
the framework's [requirements for outputs](#iapp-outputs).

#### Test with command line arguments (fallback mode):
```sh
iapp test --args 5
```

#### Test with protected data (primary mode):
```sh
iapp test --protectedData [mock_name]
```

#### Example Outputs:

**With command line args** (`iapp test --args 5`):
```json
{
  "input_A": 5,
  "scoring_logic": "A * 2",
  "result": 10,
  "status": "success",
  "data_source": "command_line_args"
}
```

**With protected data** (`iapp test --protectedData [mock_name]`):
```json
{
  "scoring_logic": "A * 2",
  "result": 10,
  "status": "success",
  "data_source": "protected_data"
}
```

> 🔒 **Security Note**: When using protected data, the input value `A` is **never exposed** in the output to maintain data confidentiality.

> ℹ️ Use the following **options** with `iapp test` to simulate
> [inputs](#iapp-inputs):
>
> - `--args <args>` simulates the app invocation with public input
>   [args](https://protocol.docs.iex.ec/for-developers/technical-references/application-io#args).
> - `--inputFile <url>` simulates the app invocation with public
>   [input files](https://protocol.docs.iex.ec/for-developers/technical-references/application-io#input-files).
> - `--requesterSecret <index=value>` simulates the app invocation with
>   [requester secrets](https://protocol.docs.iex.ec/for-developers/technical-references/application-io#requester-secrets).
> - `--protectedData [mock name]` simulates the app invocation with a secret
>   [protected data](https://protocol.docs.iex.ec/for-developers/technical-references/application-iohttps://protocol.docs.iex.ec/for-developers/technical-references/application-io#protected-data).
> - if your app uses an
>   [app secret](https://protocol.docs.iex.ec/for-developers/technical-references/application-io#app-developer-secret),
>   `iapp test` will prompt you to set the app secret and simulate the run of
>   the app with it. You can choose to save the secret for further reuse by
>   `iapp test` and `iapp deploy`.

Check the test output in the [output](./output/) directory.

> ℹ️ Files used by the app while running `iapp test` are located in the
> [input](./input/) directory.

### Deploy on iExec

Use the `iapp deploy` command to transform your app into a TEE app and deploy it
on the iExec decentralized platform.

```sh
iapp deploy
```

> ℹ️ for apps using an
> [app secret](https://protocol.docs.iex.ec/for-developers/technical-references/application-io#app-developer-secret)
>
> The app secret is provisioned once, at the app deployment time. If an app
> secret was already provided to `iapp test` and saved in
> [iapp.config.json](./iapp.config.json), `iapp deploy` will reuse this secret.

### Run on iExec

Use the `run` command to run a deployed app on the iExec decentralized platform.

```sh
iapp run <iapp-address>
```

> ℹ️ Use the following **options** with `iapp run` to inject inputs:
>
> - `--args <args>` run the app with public input
>   [args](https://protocol.docs.iex.ec/for-developers/technical-references/application-io#args)
> - `--inputFile <url>` run the app with public
>   [input files](https://protocol.docs.iex.ec/for-developers/technical-references/application-io#input-files)
> - `--requesterSecret <index=value>` run the app with
>   [requester secrets](https://protocol.docs.iex.ec/for-developers/technical-references/application-io#requester-secrets)
> - `--protectedData <protected-data-address>` run the app with a secret
>   [protected data](https://protocol.docs.iex.ec/for-developers/technical-references/application-io#protected-data)

## Project overview

- [iapp.config.json](./iapp.config.json) configuration file for the `iapp`
  commands (⚠️ this file contains sensitive information such as credentials or
  wallet and should never be committed in a public repository).
- [src/](./src/) where your code lives when you [develop](#develop) your app.
  - [src/app.py](./src/app.py) main scoring logic application
  - [src/protected_data.py](./src/protected_data.py) dataProtector deserializer module for MEDPRIVATE key decryption
- [Dockerfile](./Dockerfile) how to build your app docker image.
- [input/](./input/) input directory for your [local tests](#test-locally).
- [output/](./output/) output directory for your [local tests](#test-locally).
- [cache/](./cache/) directory contains traces of your past app
  [deployments](#deploy-on-iexec) and [runs](#run-on-iexec).
- [mock/protectedData/](./mock/protectedData/) mock protected data for testing dataProtector functionality.

## Scoring Logic Implementation

This iApp implements secure scoring logic with the following architecture:

### DataProtector Integration

The application uses **dataProtector** for secure data handling:

1. **Protected Data Decryption**: 
   - Decrypts integer `A` from protected data using MEDPRIVATE key
   - Handled by `protected_data.py` dataProtector deserializer module
   - Uses borsh serialization for secure data parsing

2. **TEE Execution Flow**:
   ```
   Encrypted Data (A) → MEDPRIVATE Key → Decrypt → Scoring Logic (A * 2) → Unencrypted Result
   ```

3. **Input Methods**:
   - **Primary**: Protected data with encrypted integer A
   - **Fallback**: Command line arguments for testing

4. **Output Formats**:
   
   **Protected Data Mode** (secure):
   ```json
   {
     "scoring_logic": "A * 2", 
     "result": 10,
     "status": "success",
     "data_source": "protected_data"
   }
   ```
   
   **Fallback Mode** (testing):
   ```json
   {
     "input_A": 5,
     "scoring_logic": "A * 2", 
     "result": 10,
     "status": "success",
     "data_source": "command_line_args"
   }
   ```

### Security Features

- ✅ **TEE Environment**: All computations run in Trusted Execution Environment
- ✅ **MEDPRIVATE Key**: Secure decryption of protected data
- ✅ **Deterministic Output**: Same inputs always produce same results
- ✅ **Input Data Protection**: Protected data inputs are **never exposed** in outputs
- ✅ **Data Source Tracking**: Clear indication of whether data came from protected or test sources
- ✅ **Unencrypted Results**: Output available for downstream processing

## iApp development guidelines

iApps are serverless Decentralized Confidential Computing applications running
on iExec's decentralized workers. This framework gives the guidelines to build
such an application.

### iApp inputs

iApps can process different kind of inputs:

- Requester inputs:

  - public
    [args](https://protocol.docs.iex.ec/for-developers/technical-references/application-io#args)
  - public
    [input files](https://protocol.docs.iex.ec/for-developers/technical-references/application-io#input-files)
  - [requester secrets](https://protocol.docs.iex.ec/for-developers/technical-references/application-io#requester-secrets)

- App developer inputs

  - [app secret](https://protocol.docs.iex.ec/for-developers/technical-references/application-io#app-developer-secret)

- Third party inputs:

  - secret
    [protected data](https://protocol.docs.iex.ec/for-developers/technical-references/application-io#protected-data)

### iApp outputs

iApp's must write
[output](https://protocol.docs.iex.ec/for-developers/technical-references/application-io#application-outputs)
files in the `IEXEC_OUT` (`/iexec_out/`) directory.

Each iApp run must produce a specific [`computed.json`](#computedjson) file.

> ⚠️ **Output size limitation:**  
> The results uploaded by the worker must not exceed **50 MB**.  
> If the size exceeds this limit, the task will fail with the error
> `POST_COMPUTE_FAILED_UNKNOWN_ISSUE`.  
> Ensure your iApp generates outputs within this limit during testing.

#### `computed.json`

The `computed.json` file is a JSON file referencing a deterministic result in
the `IEXEC_OUT` directory (any iApp run with the same inputs should create the
same deterministic result).

```json
{
  "deterministic-output-path": "iexec_out/path/to/deterministic/result"
}
```

> ℹ️ Only files referenced in `deterministic-output-path` must be deterministic,
> other files produced in the `IEXEC_OUT` directory can be non-deterministic.

### working with libraries

iApp can use libraries as soon as these libraries are installed while building
the project's [`Dockerfile`](./Dockerfile).

> ℹ️ **Limitation**
>
> Transforming an app into a TEE application requires a base image (image
> `FROM`) compatible with the transformation. Currently only a small set of base
> images are available.
>
> - make sure installed libraries can run within the base image
> - do not try to replace the base image in the Dockerfile, this would lead to
>   failing TEE transformation.
