# bitdataview (beta version)

ES6 bit addressing DataView+Stack+Queue+Array+Buffer with any types: Uint13, Int53, BigInt61, Float17, LSB/MSB, LE/BE, .set(), .get(), .push(), .pop(), .shift(), .unshift() 

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
- 100 asserted main methods, > 30 unasserted fast methods, > 20 advanced methods
- Binary parsing and decrypting RS-232, HDLC, Ethernet, USB, Can-Bus, TCP/IP RAW packets.
- NodeJs and browser Javascript support.
- Can be used in external schemas. Used in Telemok schemas.

## Examples:

#### 1. Pack Uint7, Boolean, Uint43 variables to hex. And unpack.

  ```javascript
import { BitDataView } from '@telemok/bitdataview';

let sourceData = {
	percents: 99, // maximal 7 bits
	isOn: true, // 1 bit
	msecUptime: -1234567890123, // maximal 43 bits
};
let source = new BitDataView();
source.push_Uint53orLess(7, sourceData.percents);// pack 7 bits
source.push_Booleans(sourceData.isOn);// pack 1 bit
source.push_Int53orLess(43, sourceData.msecUptime);// pack 43 bits
let hex = source.exportHex();//export 7 + 1 + 43 = 51 bits or 5 bytes
//send hex to another device, or store to localstorage
// [another computer another script.js]
let dest = new BitDataView();
dest.importHex(hex);
let result = {};
result.percents = dest.shift_Uint53orLess(7);
result.isOn = dest.shift_Boolean();
result.msecUptime = dest.shift_Int53orLess(43);
console.log("result", result);
```

#### 2. Unpack Uint7, Boolean, Uint43 variables in C/C++.

```C
/*C code*/
#pragma pack(1)
struct Example{
	unsigned char percents: 7;
	bool isOn;
	long msecUptime: 43;
}__attribute__((__packed__ ));
Example example;
memcpy((void*)(&example), (void*)source, sizeof(Example));
```

#### 3. New instance with parameters

```javascript
import { BitDataView } from '@telemok/bitdataview';

let bitdataview = new BitDataView({
	automaticMemoryExpansion: true,
	bufferBaseSizeBits: 0, 
    significantBit: "LSB",
    endianness: "BIG_ENDIAN",
});
  ```

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
setAt_Bit(bitIndexAt, value)
setAt_Byte(bitIndexAt, countBitsToSet/*0-8*/, value)
setAt_Uint(bitIndexAt, countBitsToSet/*0-53*/, value)//use endianness
setAt_Int(bitIndexAt, countBitsToSet/*1-53*/, value)//use endianness
setAt_BigUint(bitIndexAt, countBitsToSet/*0-64*/, value)//use endianness
//setAt_BigInt(bitIndexAt, countBitsToSet/*1-64*/, value)//use endianness
setAt_Float32(bitIndexAt, value)//use endianness
setAt_Float64(bitIndexAt, value)//use endianness

/* setUntil - set value in address until end of bitDataView (dont't change size) */
setUntil_Bit(bitIndexUntil, value)
//setUntil_Byte(bitIndexUntil, countBitsToSet/*0-8*/, value)
//setUntil_Uint(bitIndexUntil, countBitsToSet/*0-53*/, value)//use endianness
//setUntil_Int(bitIndexUntil, countBitsToSet/*1-53*/, value)//use endianness
//setUntil_BigUint(bitIndexUntil, countBitsToSet/*0-64*/, value)//use endianness
//setUntil_BigInt(bitIndexUntil, countBitsToSet/*1-64*/, value)//use endianness
setUntil_Float32(bitIndexUntil, value)//use endianness
setUntil_Float64(bitIndexUntil, value)//use endianness

/* getAt - get value in address at begin of bitDataView (dont't change size) */
getAt_Bit(bitIndexAt)
getAt_Byte(bitIndexAt, countBitsToSet/*0-8*/)
getAt_Uint(bitIndexAt, countBitsToSet/*0-53*/)//use endianness
getAt_Int(bitIndexAt, countBitsToSet/*1-53*/)//use endianness
getAt_BigUint(bitIndexAt, countBitsToSet/*0-64*/)//use endianness
//getAt_BigInt(bitIndexAt, countBitsToSet/*1-64*/)//use endianness
getAt_Float32(bitIndexAt)//use endianness
getAt_Float64(bitIndexAt)//use endianness

/* getUntil - get value in address until end of bitDataView (dont't change size) */
getUntil_Bit(bitIndexUntil)
//getUntil_Byte(bitIndexUntil, countBitsToSet/*0-8*/)
//getUntil_Uint(bitIndexUntil, countBitsToSet/*0-53*/)//use endianness
//getUntil_Int(bitIndexUntil, countBitsToSet/*1-53*/)//use endianness
//getUntil_BigUint(bitIndexUntil, countBitsToSet/*0-64*/)//use endianness
//getUntil_BigInt(bitIndexUntil, countBitsToSet/*1-64*/)//use endianness
//getUntil_Float32(bitIndexUntil)//use endianness
//getUntil_Float64(bitIndexUntil)//use endianness

/* push - add value before end of bitDataView (increase size) */
push_Bits(value, count = 1)
push_Byte(countBitsToSet/*0-8*/, value)
push_Uint(countBitsToSet/*0-53*/, value)//use endianness
push_Int(countBitsToSet/*1-53*/, value)//use endianness
push_BigUint(countBitsToSet/*0-64*/, value)//use endianness
//push_BigInt(countBitsToSet/*1-64*/, value)//use endianness
push_Float32(value)//use endianness
push_Float64(value)//use endianness
//push_Float(sign = true, exponent = 11, mantissa = 52, value)//use little endian
push_Uint8Array(uint8Array, littleEndian = false)
push_DataView(dataView, littleEndian = false)
push_Hex(hexString, littleEndian = false)

/* unshift - add value before begin of bitDataView (increase size) */
unshift_Bits(value, count = 1)
unshift_Byte(countBitsToSet/*0-8*/, value)
unshift_Uint(countBitsToSet/*0-53*/, value)//use endianness
unshift_Int(countBitsToSet/*1-53*/, value)//use endianness
unshift_BigUint(countBitsToSet/*0-64*/, value)//use endianness
//unshift_BigInt(countBitsToSet/*1-64*/, value)//use endianness
unshift_Float32(value)//use endianness
unshift_Float64(value)//use endianness
//unshift_Float(sign = true, exponent = 11, mantissa = 52, value)//use little endian
unshift_Uint8Array(uint8Array, littleEndian = false)
unshift_DataView(dataView, littleEndian = false)
unshift_Hex(hexString, littleEndian = false)

/* pop - take value from end of bitDataView (reduce size) */
pop_Bit(count = 1)
pop_Byte(countBitsToSet/*0-8*/)
pop_Uint(countBitsToSet/*0-53*/)//use endianness
pop_Int(countBitsToSet/*1-53*/)//use endianness
//pop_BigUint(countBitsToSet/*0-64*/)//use endianness
//pop_BigInt(countBitsToSet/*1-64*/)//use endianness
pop_Float32()//use endianness
pop_Float64()//use endianness
//pop_Float(sign = true, exponent = 11, mantissa = 52)//use little endian
pop_Uint8Array(countBytes = this.getStoredBits() , littleEndian = false)
pop_DataView(countBytes = undefined , littleEndian = false)
pop_Hex(countBytes = undefined , littleEndian = false)

/* shift - take value from begin of bitDataView (reduce size) */
shift_Bit(count = 1)
shift_Byte(countBitsToSet/*0-8*/)
shift_Uint(countBitsToSet/*0-53*/)//use endianness
shift_Int(countBitsToSet/*1-53*/)//use endianness
//shift_BigUint(countBitsToSet/*0-64*/)//use endianness
//shift_BigInt(countBitsToSet/*1-64*/)//use endianness
shift_Float32()//use endianness
shift_Float64()//use endianness
//shift_Float(sign = true, exponent = 11, mantissa = 52)//use little endian
shift_Uint8Array(countBytes = this.getStoredBits() , littleEndian = false)
shift_DataView(countBytes = undefined , littleEndian = false)
shift_Hex(countBytes = undefined , littleEndian = false)

importUint8Array(uint8Array)
exportUnit8Array(littleEndian = false)
importHex(hexString)
exportHex(/*includeLastBits = true*/)
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


toString()

```

## Fast unasserted private functions (don't use it)

```javascript
_getData();

_andBitInMemoryAddress_noAsserts(bitMemoryAddress);
_orBitInMemoryAddress_noAsserts(bitMemoryAddress);
_setBitInMemoryAddress_noAsserts(bitValue, bitMemoryAddress);
_setAt_Bool_noAsserts(bitValue, bitIndexAt);
_setUntil_Bool_noAsserts(bitValue, bitIndexUntil);
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



## Tests:

### Test1. Compare with DataView component (70 msec)
Only LSB.

Little endian and big endian.

1000 random offsets and values
```javascript
dataView.getUint32() vs .setAt_Uint53orLess(32) and .getAt_Uint53orLess(32)
dataView.getInt32() vs .setAt_Int53orLess(32) and .getAt_Int53orLess(32)
dataView.getUint16() vs .setAt_Uint53orLess(16) and .getAt_Uint53orLess(16)
dataView.getUint8() vs .setAt_Uint53orLess(8) and .getAt_Uint53orLess(8)
dataView.getUint8() vs .setAt_Uint8orLess(8) and .getAt_Uint8orLess(8)
dataView.getBigUint64() vs .setAt_BigUint64orLess(64) and .getAt_BigUint64orLess(64)
dataView.getFloat64() vs .setAt_Float64() and .getAt_Float64()
dataView.getFloat32() vs .setAt_Float32() and .getAt_Float32()
```
