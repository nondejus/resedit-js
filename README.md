[![NPM version](https://badge.fury.io/js/resedit.svg)](https://www.npmjs.com/package/resedit)
[![Build Status](https://travis-ci.org/jet2jet/resedit-js.svg?branch=master)](https://travis-ci.org/jet2jet/resedit-js)

# resedit-js

(Beta) resedit-js is a library that manipulates resouces contained by Windows Executable files. All implementations are written in JavaScript (TypeScript), so there are no further restrictions for running environment.

## Install

```
npm install resedit
```

## Supported formats

- Windows Executables (PE Format, such as `.exe` and `.dll`), both 32-bit and 64-bit, are supported.
  - Executables for 16-bit Windows is not supported.
- `.res` file is not supported now.
- PNG-based icon data is supported on `require('resedit').Resource.IconGroupEntry` class.

## Parsing signed executables

- Parsing signed executables (by using Authenticode or etc.) is not allowed by default and an exception will be thrown if `NtExecutable.from` receives a signed binary.
- To parse signed, `{ ignoreCert: true }` object must be passed to the second argument of `NtExecutable.from`.
- Although the base executable data is signed, `NtExecutable.generate` will generate unsigned executable binary. If you want to re-sign it, generate function with signing (see below) or any other signing tool such as Microsoft `signtool` must be used.

## (Beta) Signing executables with resedit-js

resedit-js provides basic signing process `generateExecutableWithSign` function, which is based on [Authenticode specification](https://download.microsoft.com/download/9/c/5/9c5b2167-8017-4bae-9fde-d599bac8184a/authenticode_pe.docx) and related RFCs.

To keep resedit-js generic library, the followings are required to use signing process.

- Encryption / calculating hash (digest) process (e.g. Node.js built-in `crypto` module)
  - A private key data is implicitly required to encrypt data.
- DER-format public key binary (such as `*.cer` file data), which is paired with the private key used by encryption process.
- (optional) Generating timestamp data, especially communicating with TSA server (e.g. HTTP/HTTPS API)

These requirements are represented as [`SignerObject`](./src/main/sign/SignerObject.ts). The caller of `generateExecutableWithSign` function must implement this object to sign executables.

An example code is here: [signTest.js](./examples/sign/signTest.js)

Note that resedit-js only provides basic signing process, and provides as beta version. For example adding more attributes/informations to certificates are not supported now.

## Notes

- **It is not strongly recommended that the destination executable file is equal to the source executable file.**
- Using from command-line is not supported now.

## Examples

For more APIs, please see `dist` directory of the package. And, [some test codes](./src/test) may help you for usages.

```js
const ResEdit = require('resedit');
const fs = require('fs');

// load and parse data
let data = fs.readFileSync('MyApp.exe');
let exe = ResEdit.NtExecutable.from(data.buffer);
let res = ResEdit.NtExecutableResource.from(exe);

// rewrite resources
// - You can use helper classes as followings:
//   - ResEdit.Resource.IconGroupEntry: access icon resource data
//   - ResEdit.Resource.StringTable: access string resource data
//   - ResEdit.Resource.VersionInfo: access version info data
let viList = ResEdit.Resource.VersionInfo.fromEntries(res.entries);
let vi = viList[0];
vi.fixedInfo.fileVersionMS = 0x10001; // '1.1'
vi.fixedInfo.fileVersionLS = 0;
// ('lang: 1033' means 'en-US', 'codepage: 1200' is the default codepage)
vi.setStringValues(
  { lang: 1033, codepage: 1200 },
  {
    FileDescription: 'My application',
    FileVersion: '1.1',
    ProductName: 'My product',
  }
);
vi.outputToResourceEntries(res.entries);

// write to another binary
res.outputResource(exe);
let newBinary = exe.generate();
fs.writeFileSync('MyApp_modified.exe', new Buffer(newBinary));
```

## License

[MIT License](./LICENSE)
