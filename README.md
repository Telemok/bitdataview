# bitdataview (beta version)

JavaScript ES6 DataView, but with bit address, custom int and float bit size, .set(), .get(), .push(), .pop(), .shift(), .unshift() functions

## Features

- Like **DataView**, but with **bit addressing**.
- **.set(), .get(), .push(), .unshift(), .pop(), .shift()** functions for each data type.
- Data types: boolean and custom bit size uint, float. For example: **Uint17**, **Int37** or **BigUint61**.
- Like a **BitBuffer**, **BitArray**, **BitStack**, **BitQueue**.
- **Small memory** using: 1 bit in memory for every 1 bit data. 23 bits data => 3 bytes in RAM.
- Full **assert arguments** of functions.
- Endianness: **Little Endian** and Big Endian byte order supported.
- Bit numbering: **LSB** (lest significant bit) by default, MSB (most SB) is supported.
- Can export and import to **C/C++ BitDataView** library (only if LSB + Little Endian).
- Fastest library with same advantages.
- \>50 asserted main functions, > 32 unasserted fast functions, > 25 advanced functions
- Good library to decrypt RS-232, HDLC, Ethernet, USB, Can-Bus, TCP/IP RAW packets.
- NodeJs and browser Javascript support.

## Source code:
https://github.com/Telemok/bitdataview

https://npmjs.com/@telemok/bitdataview

## Installation:
1. Create your NodeJs, Browser or Webview app.
2. Run: **npm import @telemok/bitdataview**
3. Code: **import { BitDataView } from '@telemok/bitdataview';**
4. Code: **var bitDataView = new BitDataView();**

## Main functions:

```javascript
/* setAt - set value in address at begin of bitDataView (dont't change size) */
setAt_Boolean(bitIndexAt, value)
setAt_Uint8orLess(bitIndexAt, countBitsToSet, value)
setAt_Uint53orLess(bitIndexAt, countBitsToSet, value)//use endianness
setAt_BigUint64orLess(bitIndexAt, countBitsToSet, value)//use endianness
setAt_Float32(bitIndexAt, value)//use endianness
setAt_Float64(bitIndexAt, value)//use endianness

/* setUntil - set value in address until end of bitDataView (dont't change size) */
setUntil_Boolean(bitIndexUntilEnd, value)
setUntil_Float32(bitIndexUntil, value)//use endianness
setUntil_Float64(bitIndexUntil, value)//use endianness

/* getAt - get value in address at begin of bitDataView (dont't change size) */
getAt_Boolean(bitIndexAt)
getAt_Uint8orLess(bitIndexAt = 0, countBitsToGet = 8)
getAt_Uint53orLess(bitIndexAt = 0, countBitsToGet = 53)//use endianness
getAt_BigUint64orLess(bitIndexAt = 0, countBitsToGet = 64)//use endianness
getAt_Float32(bitIndexAt)//use endianness
getAt_Float64(bitIndexAt)//use endianness

/* getUntil - get value in address until end of bitDataView (dont't change size) */
getUntil_Boolean(bitIndexUntil)

/* push - add value before end of bitDataView (increase size) */
push_Booleans(value, count = 1)
push_Uint8orLess(countBitsPushed, value)
push_Uint53orLess(countBitsToPush, value)//use endianness
push_BigUint64orLess(countBitsToPush, value)//use endianness
push_Float32(value)//use endianness
push_Float64(value)//use endianness
push_Uint8Array(uint8Array, littleEndian = false)
push_DataView(dataView, littleEndian = false)
push_Hex(hexString, littleEndian = false)

/* unshift - add value before begin of bitDataView (increase size) */
unshift_Booleans(bitValue, count = 1)
unshift_Uint8orLess(countBitsToUnshift, value)
unshift_Uint53orLess(countBitsToUnshift, value)//use endianness
unshift_BigUint64orLess(countBitsToUnshift, value)//use endianness
unshift_Float32(value)//use endianness
unshift_Float64(value)//use endianness
unshift_Uint8Array(uint8Array, littleEndian = false)
unshift_DataView(dataView, littleEndian = false)
unshift_Hex(hexString, littleEndian = false)

/* pop - take value from end of bitDataView (reduce size) */
pop_Boolean()
pop_Uint8orLess(countBitsToPop)
pop_Uint53orLess(countBitsToPop)//use endianness
pop_Float32()//use endianness
pop_Float64()//use endianness
pop_Uint8Array(countBitsToPop = this.getStoredBits()/*, littleEndian = false*/)
pop_DataView(countBytes= undefined, littleEndian = false)
pop_Hex(countBytes= undefined)//use endianness

/* shift - take value from begin of bitDataView (reduce size) */
shift_Boolean()
shift_Uint8orLess(countBitsToShift)
shift_Uint53orLess(countBitsToShift)//use endianness
//shift_Int53orLess(countBitsToShift)//use endianness
//shift_BigUint64orLess(countBitsToShift)//use endianness
//shift_BigInt64orLess(countBitsToShift)//use endianness
shift_Float32()//use endianness
shift_Float64()//use endianness
shift_Float64orLess(sign = true, exponent = 11, mantissa = 52)//use endianness
shift_Uint8Array(countBitsToShift = this.getStoredBits(), littleEndian = false)
shift_DataView(countBytes = undefined, littleEndian = false)
shift_Hex(countBytes= undefined , littleEndian = false)



```

## Advanced functions:

```javascript
clear(fullClear = false, sizeBits = 256 * 8)
clone(copyStrictPrivateStructure = false)

significantBit_setLsb()
significantBit_setMsb()
significantBit_set(significantBitType)//"LSB" or "MSB"
significantBit_isLsb()
significantBit_isMsb()
significantBit_get()//"LSB" or "MSB"

endianness_setLittleEndian()
endianness_setBigEndian()
endianness_set(endianness)//"LITTLE_ENDIAN" or "BIG_ENDIAN"
endianness_isLittleEndian()
endianness_isBigEndian()
endianness_get()//"LITTLE_ENDIAN" or "BIG_ENDIAN"

getStoredBits()
getAvailableBitsToExpandRight()
getAvailableBitsToPush()
getAvailableBitsToUnshift()
expandRight(expandBits = 256 * 8)
expandLeft(expandBits = 256 * 8)
expandRightIfNeed(checkPushBits, bitCountIfExpandRequired = 256 * 8)
expandLeftIfNeed(checkUnshiftBits, bitCountIfExpandRequired = 256 * 8)	

importUint8Array(uint8Array)
exportUnit8Array(littleEndian = false)
importHex(hexString)
exportHex(/*includeLastBits = true*/)

```

## Fast unasserted private functions (don't use it)

```javascript
_getData();

_andBitInMemoryAddress_noAsserts(bitMemoryAddress);
_orBitInMemoryAddress_noAsserts(bitMemoryAddress);
_setBitInMemoryAddress_noAsserts(bitValue, bitMemoryAddress);
_setAt_Bool_noAsserts(bitValue, bitIndexAt);
_setUntil_Bool_noAsserts(bitValue, bitIndexUntilEnd);
_getAt_BoolMemoryAddress_noAsserts(bitMemoryAddress);
_getAt_Bool_noAsserts(bitIndexAt);
_getUntil_Bool_noAsserts(bitIndexUntil);
_push_Bool_noExpandNoAsserts(bitValue);
_unshift_Bool_noExpandNoAsserts(bitValue);
_pop_Bool_noAsserts();
_shift_Bool_noAsserts();

_setAt_Uint8orLess_noAsserts(bitIndexAt = 0, countBitsToSet = 8, byteData)
_push_Uint8orLess_noExpandNoAsserts(countBitsPushed, value);
_unshift_Uint8orLess_noExpandNoAsserts(countBitsToUnshift, value);
_getAt_Uint8orLess_noAsserts(bitIndexAt = 0, countBitsToGet = 8)
_pop_Uint8orLess_noAsserts(countBitsToPop = 8)
_shift_Uint8orLess_noAsserts(countBitsToShift = 8)

_setAt_Uint53orLess_noAsserts(bitIndexAt = 0, countBitsToSet = 53, value)//use endianness
_unshift_Uint53orLess_noExpandNoAsserts(countBitsToUnshift, value)//use endianness;
_setUntil_Uint53orLess_noAsserts(bitIndexUntil = 0, countBitsToSet = 53, value)//use endianness
_push_Uint53orLess_noExpandNoAsserts(countBitsToPush, value)//use endianness;
_unshift_Uint53orLess_noExpandNoAsserts(countBitsToUnshift, value)//use endianness;
_getAt_Uint53orLess_noAsserts(bitIndexAt = 0, countBitsToGet = 53)//use endianness
_getUntil_Uint53orLess_noAsserts(bitIndexUntil = 0, countBitsToGet = 53)//use endianness
_pop_Uint53orLess_noAsserts(countBitsToPop)//use endianness
_shift_Uint53orLess_noAsserts(countBitsToShift)//use endianness

_setAt_BigUint64orLess_noAsserts(bitIndexAt = 0, countBitsToSet = 64, value)//use endianness
_setUntil_BigUint64orLess_noAsserts(bitIndexUntil = 0, countBitsToSet = 64, value)//use endianness
_push_BigUint64orLess_noExpandNoAsserts(countBitsToPush, value)//use endianness;
_unshift_BigUint64orLess_noExpandNoAsserts(countBitsToUnshift, value)//use endianness;
_setUntil_Uint8Array_noExpandNoAsserts(bitIndexUntil = 0, uint8Array)//use endianness;
```

## Examples:

#### 1. Pack Uint7, Boolean, Uint43 variables to hex. And unpack.

  ```javascript
import { BitDataView } from '@telemok/bitdataview';

let sourceData = {
	percents: 99, // maximal 7 bits
	isOn: true, // 1 bit
	msecUptime: 1234567890123, // maximal 43 bits
};
let source = new BitDataView();
source.push_Uint53orLess(7, sourceData.percents);// pack 7 bits
source.push_Booleans(sourceData.isOn);// pack 1 bit
source.push_Uint53orLess(43, sourceData.msecUptime);// pack 43 bits
let hex = source.exportHex();//export 7 + 1 + 43 = 51 bits or 5 bytes
//send hex to another device, or store to localstorage
// [another computer another script.js]
let dest = new BitDataView();
dest.importHex(hex);
let result = {};
result.percents = dest.shift_Uint53orLess(7);
result.isOn = dest.shift_Boolean();
result.msecUptime = dest.shift_Uint53orLess(43);
console.log("result", result);
```

#### 2. New instance with parameters

```javascript
import { BitDataView } from '@telemok/bitdataview';

let bitdataview = new BitDataView({
	automaticMemoryExpansion: true,
	bufferBaseSizeBits: 0, 
    significantBit: "LSB",
    endianness: "BIG_ENDIAN",
});
  ```

## Tests:

### Test1. Compare with DataView component (70 msec)
Only LSB.

Little endian and big endian.
```javascript
dataView.getUint32() with .setAt_Uint53orLess(32) and .getAt_Uint53orLess(32)
dataView.getInt32() with .setAt_Int53orLess(32) and .getAt_Int53orLess(32)
dataView.getUint16() with .setAt_Uint53orLess(16) and .getAt_Uint53orLess(16)
dataView.getUint8() with .setAt_Uint53orLess(8) and .getAt_Uint53orLess(8)
dataView.getUint8() with .setAt_Uint8orLess(8) and .getAt_Uint8orLess(8)
dataView.getBigUint64() with .setAt_BigUint64orLess(64) and .getAt_BigUint64orLess(64)
dataView.getFloat64() with .setAt_Float64() and .getAt_Float64()
dataView.getFloat32() with .setAt_Float32() and .getAt_Float32()
```
