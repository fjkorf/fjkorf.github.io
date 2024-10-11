(window["webpackJsonp"] = window["webpackJsonp"] || []).push([[0],{

/***/ "../page_composer/pkg/page_composer.js":
/*!*********************************************!*\
  !*** ../page_composer/pkg/page_composer.js ***!
  \*********************************************/
/*! exports provided: __wbg_set_wasm, parse */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
eval("__webpack_require__.r(__webpack_exports__);\n/* harmony import */ var _page_composer_bg_wasm__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./page_composer_bg.wasm */ \"../page_composer/pkg/page_composer_bg.wasm\");\n/* harmony import */ var _page_composer_bg_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./page_composer_bg.js */ \"../page_composer/pkg/page_composer_bg.js\");\n/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, \"__wbg_set_wasm\", function() { return _page_composer_bg_js__WEBPACK_IMPORTED_MODULE_1__[\"__wbg_set_wasm\"]; });\n\n/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, \"parse\", function() { return _page_composer_bg_js__WEBPACK_IMPORTED_MODULE_1__[\"parse\"]; });\n\n\n\n\nObject(_page_composer_bg_js__WEBPACK_IMPORTED_MODULE_1__[\"__wbg_set_wasm\"])(_page_composer_bg_wasm__WEBPACK_IMPORTED_MODULE_0__);\n\n\n\n//# sourceURL=webpack:///../page_composer/pkg/page_composer.js?");

/***/ }),

/***/ "../page_composer/pkg/page_composer_bg.js":
/*!************************************************!*\
  !*** ../page_composer/pkg/page_composer_bg.js ***!
  \************************************************/
/*! exports provided: __wbg_set_wasm, parse */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
eval("__webpack_require__.r(__webpack_exports__);\n/* WEBPACK VAR INJECTION */(function(module) {/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, \"__wbg_set_wasm\", function() { return __wbg_set_wasm; });\n/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, \"parse\", function() { return parse; });\nlet wasm;\nfunction __wbg_set_wasm(val) {\n    wasm = val;\n}\n\n\nlet WASM_VECTOR_LEN = 0;\n\nlet cachedUint8ArrayMemory0 = null;\n\nfunction getUint8ArrayMemory0() {\n    if (cachedUint8ArrayMemory0 === null || cachedUint8ArrayMemory0.byteLength === 0) {\n        cachedUint8ArrayMemory0 = new Uint8Array(wasm.memory.buffer);\n    }\n    return cachedUint8ArrayMemory0;\n}\n\nconst lTextEncoder = typeof TextEncoder === 'undefined' ? (0, module.require)('util').TextEncoder : TextEncoder;\n\nlet cachedTextEncoder = new lTextEncoder('utf-8');\n\nconst encodeString = (typeof cachedTextEncoder.encodeInto === 'function'\n    ? function (arg, view) {\n    return cachedTextEncoder.encodeInto(arg, view);\n}\n    : function (arg, view) {\n    const buf = cachedTextEncoder.encode(arg);\n    view.set(buf);\n    return {\n        read: arg.length,\n        written: buf.length\n    };\n});\n\nfunction passStringToWasm0(arg, malloc, realloc) {\n\n    if (realloc === undefined) {\n        const buf = cachedTextEncoder.encode(arg);\n        const ptr = malloc(buf.length, 1) >>> 0;\n        getUint8ArrayMemory0().subarray(ptr, ptr + buf.length).set(buf);\n        WASM_VECTOR_LEN = buf.length;\n        return ptr;\n    }\n\n    let len = arg.length;\n    let ptr = malloc(len, 1) >>> 0;\n\n    const mem = getUint8ArrayMemory0();\n\n    let offset = 0;\n\n    for (; offset < len; offset++) {\n        const code = arg.charCodeAt(offset);\n        if (code > 0x7F) break;\n        mem[ptr + offset] = code;\n    }\n\n    if (offset !== len) {\n        if (offset !== 0) {\n            arg = arg.slice(offset);\n        }\n        ptr = realloc(ptr, len, len = offset + arg.length * 3, 1) >>> 0;\n        const view = getUint8ArrayMemory0().subarray(ptr + offset, ptr + len);\n        const ret = encodeString(arg, view);\n\n        offset += ret.written;\n        ptr = realloc(ptr, len, offset, 1) >>> 0;\n    }\n\n    WASM_VECTOR_LEN = offset;\n    return ptr;\n}\n\nlet cachedDataViewMemory0 = null;\n\nfunction getDataViewMemory0() {\n    if (cachedDataViewMemory0 === null || cachedDataViewMemory0.buffer.detached === true || (cachedDataViewMemory0.buffer.detached === undefined && cachedDataViewMemory0.buffer !== wasm.memory.buffer)) {\n        cachedDataViewMemory0 = new DataView(wasm.memory.buffer);\n    }\n    return cachedDataViewMemory0;\n}\n\nconst lTextDecoder = typeof TextDecoder === 'undefined' ? (0, module.require)('util').TextDecoder : TextDecoder;\n\nlet cachedTextDecoder = new lTextDecoder('utf-8', { ignoreBOM: true, fatal: true });\n\ncachedTextDecoder.decode();\n\nfunction getStringFromWasm0(ptr, len) {\n    ptr = ptr >>> 0;\n    return cachedTextDecoder.decode(getUint8ArrayMemory0().subarray(ptr, ptr + len));\n}\n/**\n* @param {string} input\n* @returns {string}\n*/\nfunction parse(input) {\n    let deferred2_0;\n    let deferred2_1;\n    try {\n        const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);\n        const ptr0 = passStringToWasm0(input, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);\n        const len0 = WASM_VECTOR_LEN;\n        wasm.parse(retptr, ptr0, len0);\n        var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);\n        var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);\n        deferred2_0 = r0;\n        deferred2_1 = r1;\n        return getStringFromWasm0(r0, r1);\n    } finally {\n        wasm.__wbindgen_add_to_stack_pointer(16);\n        wasm.__wbindgen_free(deferred2_0, deferred2_1, 1);\n    }\n}\n\n\n/* WEBPACK VAR INJECTION */}.call(this, __webpack_require__(/*! ./../../page_composer_js/node_modules/webpack/buildin/harmony-module.js */ \"./node_modules/webpack/buildin/harmony-module.js\")(module)))\n\n//# sourceURL=webpack:///../page_composer/pkg/page_composer_bg.js?");

/***/ }),

/***/ "../page_composer/pkg/page_composer_bg.wasm":
/*!**************************************************!*\
  !*** ../page_composer/pkg/page_composer_bg.wasm ***!
  \**************************************************/
/*! exports provided: memory, parse, __wbindgen_add_to_stack_pointer, __wbindgen_malloc, __wbindgen_realloc, __wbindgen_free */
/***/ (function(module, exports, __webpack_require__) {

eval("\"use strict\";\n// Instantiate WebAssembly module\nvar wasmExports = __webpack_require__.w[module.i];\n__webpack_require__.r(exports);\n// export exports from WebAssembly module\nfor(var name in wasmExports) if(name != \"__webpack_init__\") exports[name] = wasmExports[name];\n// exec imports from WebAssembly module (for esm order)\n\n\n// exec wasm module\nwasmExports[\"__webpack_init__\"]()\n\n//# sourceURL=webpack:///../page_composer/pkg/page_composer_bg.wasm?");

/***/ }),

/***/ "./index.js":
/*!******************!*\
  !*** ./index.js ***!
  \******************/
/*! no exports provided */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
eval("__webpack_require__.r(__webpack_exports__);\n/* harmony import */ var page_composer__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! page_composer */ \"../page_composer/pkg/page_composer.js\");\n\nconst input = document.getElementById('input'),\n      output = document.getElementById('output');\nconst update = () => { output.innerHTML = page_composer__WEBPACK_IMPORTED_MODULE_0__[\"parse\"](input.value) };\ninput.addEventListener('input', update)\nupdate();\n\n\n//# sourceURL=webpack:///./index.js?");

/***/ }),

/***/ "./node_modules/webpack/buildin/harmony-module.js":
/*!*******************************************!*\
  !*** (webpack)/buildin/harmony-module.js ***!
  \*******************************************/
/*! no static exports found */
/***/ (function(module, exports) {

eval("module.exports = function(originalModule) {\n\tif (!originalModule.webpackPolyfill) {\n\t\tvar module = Object.create(originalModule);\n\t\t// module.parent = undefined by default\n\t\tif (!module.children) module.children = [];\n\t\tObject.defineProperty(module, \"loaded\", {\n\t\t\tenumerable: true,\n\t\t\tget: function() {\n\t\t\t\treturn module.l;\n\t\t\t}\n\t\t});\n\t\tObject.defineProperty(module, \"id\", {\n\t\t\tenumerable: true,\n\t\t\tget: function() {\n\t\t\t\treturn module.i;\n\t\t\t}\n\t\t});\n\t\tObject.defineProperty(module, \"exports\", {\n\t\t\tenumerable: true\n\t\t});\n\t\tmodule.webpackPolyfill = 1;\n\t}\n\treturn module;\n};\n\n\n//# sourceURL=webpack:///(webpack)/buildin/harmony-module.js?");

/***/ })

}]);