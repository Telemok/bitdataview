# bitdataview (beta version)

[bitdataview] 
 is a JavaScript ES6 library 

## Features

- Like DataView, but byte addressing changed to **bit addressing**.
- **Set, get, push, unshift, pop, shift** functions.
- Custom bit size bool, uint, float. For example: **Uint17** or **BigUint61**.
- Full **assert** function arguments.
- NodeJs and browser Javascript support.
- Can export and import to **C/C++ BitDataView** library (only if littleEndian == true).

## Source code:
https://github.com/Telemok/bitdataview

https://npmjs.com/@telemok/bitdataview

## Installation:
1. Create your NodeJs, Browser or Webview app.
2. Run: npm import @telemok/bitdataview
3. Code: import { BitDataView } from '@telemok/bitdataview';

## Base function list:

```javascript
setAt_Bool(bitValue, bitIndexFromBegin)
setAt_Uint8orLess(bitIndexAt = 0, countBitsToSet = 8, value)
setAt_Uint53orLess(bitIndexAt, countBitsToSet, value, littleEndian = false)

setUntil_Bool(bitValue, bitIndexUntilEnd)

getAt_Bool(bitIndexFromBegin)

getUntil_Bool(bitIndexFromEnd)

push_Bools(bitValue, count = 1)
push_Uint8orLess(countBitsPushed, value)
push_Uint53orLess(countBitsToPush, value, littleEndian = false)
push_BigUint64orLess(countBitsToPush, value, littleEndian = false)

unshift_Bools(bitValue, count = 1)
unshift_Uint8orLess(countBitsToUnshift, value)
unshift_Uint53orLess(countBitsToUnshift, value, littleEndian = false)
unshift_BigUint64orLess(countBitsToUnshift, value, littleEndian = false)

pop_Bool()
pop_Uint8orLess(countBitsToPop = 8)
pop_Uint53orLess(countBitsToPop, littleEndian = false)

shift_Bool()
shift_Uint8orLess(countBitsToShift = 8)
shift_Uint53orLess(countBitsToShift, littleEndian = false)


```
___

####  clear(fullClear = false, sizeBits = 256 * 8) ;

fast clear header of bitDataView
slow create bitDataView again with zeros in memory

___

#### clone(copyStrictPrivateStructure = false)

make copy of bitDataView
___

#### getStoredBits()

___

#### getAvailableBitsToExpandRight()

___

#### getAvailableBitsToPush()

___

#### getAvailableBitsToUnshift()

___

#### expandRight(expandBits = 256 * 8)

___

####  expandLeft(expandBits = 256 * 8)

___

#### expandRightIfNeed(checkPushBits = 1, bitCountIfExpandRequired = 256 * 8)

___

#### expandLeftIfNeed(checkUnshiftBits, expandBits = 256 * 8)

___

#### setAt_Bool(bitValue, bitIndexFromBegin)

set bit by virtual index at begin of bitDataView.

___

#### setAt_Uint53orLess(bitIndexAt, countBitsToSet, value, littleEndian = false)

set unsigned integer at

___

#### setUntil_Bool(bitValue, bitIndexUntilEnd)

set bit by virtual index until end of bitDataView.

___

#### getAt_Bool(bitIndexFromBegin) 

get bit by virtual index at begin of bitDataView.

___

#### getUntil_Bool(bitIndexFromEnd)

get bit by virtual index until end of bitDataView.

___

#### push_Bools(bitValue, count = 1)

push (add to right of bitDataView) some similar bits. Like fill() funcion.

___

#### unshift_Bools(bitValue, count = 1)

unshift (add to left of bitDataView) some similar bits. Like fill() funcion.

___

#### pop_Bool()

pop (take from right of bitDataView) 1 bit.

___

#### shift_Bool() 

shift (take from left of bitDataView) 1 bit.

___

#### setAt_Uint8orLess(bitIndexAt = 0, countBitsToSet = 8, value)

set (set to custom plase of bitDataView) unsigned integer.

___

#### push_Uint8orLess(countBitsPushed, value)

push (add to right of bitDataView) unsigned integer from 0 to 8 bits.

___

#### unshift_Uint8orLess(countBitsToUnshift, value)

unshift (add to left of bitDataView) unsigned integer from 0 to 8 bits.

___

#### pop_Uint8orLess(countBitsToPop = 8)

pop (take from right of bitDataView) unsigned integer(s).

___

#### shift_Uint8orLess(countBitsToShift = 8)

shift (take from left of bitDataView) unsigned integer(s).

___

#### setAt_Uint53orLess(bitIndexAt, countBitsToSet, value, littleEndian = false)

___

#### push_Uint53orLess(countBitsToPush, value, littleEndian = false)

___

#### unshift_Uint53orLess(countBitsToUnshift, value, littleEndian = false)

___

#### shift_Uint53orLess(countBitsToShift, littleEndian = false)

___

#### pop_Uint53orLess(countBitsToPop, littleEndian = false)

___

#### push_BigUint64orLess(countBitsToPush, value, littleEndian = false)

push (add to right of bitDataView) unsigned BigInt.

___

#### unshift_BigUint64orLess(countBitsToUnshift, value, littleEndian = false)

___

## fast unasserted private functions (don't use it)

```javascript
_getData();
_andBitInMemoryAddress_noAsserts(bitMemoryAddress);
_orBitInMemoryAddress_noAsserts(bitMemoryAddress);
_setBitInMemoryAddress_noAsserts(bitValue, bitMemoryAddress);
_setAt_Bool_noAsserts(bitValue, bitIndexFromBegin);
_setUntil_Bool_noAsserts(bitValue, bitIndexUntilEnd);
_getAt_BoolMemoryAddress_noAsserts(bitMemoryAddress);
_getAt_Bool_noAsserts(bitIndexFromBegin);
_getUntil_Bool_noAsserts(bitIndexFromEnd);
_push_Bool_noExpandNoAsserts(bitValue);
_unshift_Bool_noExpandNoAsserts(bitValue);
_pop_Bool_noAsserts();
_shift_Bool_noAsserts();
_setAt_Uint8orLess_noAsserts(bitIndexAt = 0, countBitsToSet = 8, byteData)//countBitsToPop >0 <8
_push_Uint8orLess_noExpandNoAsserts(countBitsPushed, value);
_unshift_Uint8orLess_noExpandNoAsserts(countBitsToUnshift, value);
_getAt_Uint8orLess_noAsserts(bitIndexAt = 0, countBitsToGet = 8)//countBitsToPop >0 <8
_pop_Uint8orLess_noAsserts(countBitsToPop = 8)//countBitsToPop >0 <8
_shift_Uint8orLess_noAsserts(countBitsToShift = 8)//countBitsToPop >0 <8
_setAt_Uint53orLess_noAsserts(bitIndexAt = 0, countBitsToSet = 53, value,  littleEndian = false)
_unshift_Uint53orLess_noExpandNoAsserts(countBitsToUnshift, value, littleEndian = false);
_setUntil_Uint53orLess_noAsserts(bitIndexUntil = 0, countBitsToSet = 53, value,  littleEndian = false)
_push_Uint53orLess_noExpandNoAsserts(countBitsToPush, value, littleEndian = false);
_unshift_Uint53orLess_noExpandNoAsserts(countBitsToUnshift, value, littleEndian = false);
_getAt_Uint53orLess_noAsserts(bitIndexAt = 0, countBitsToGet = 53, littleEndian = false)
_getUntil_Uint53orLess_noAsserts(bitIndexUntil = 0, countBitsToGet = 53, littleEndian = false)
_pop_Uint53orLess_noAsserts(countBitsToPop, littleEndian = false)
_shift_Uint53orLess_noAsserts(countBitsToShift, littleEndian = false)
_setAt_BigUint64orLess_noAsserts(bitIndexAt = 0, countBitsToSet = 64, value,  littleEndian = false)
_setUntil_BigUint64orLess_noAsserts(bitIndexUntil = 0, countBitsToSet = 64, value,  littleEndian = false)
_push_BigUint64orLess_noExpandNoAsserts(countBitsToPush, value, littleEndian = false);
_unshift_BigUint64orLess_noExpandNoAsserts(countBitsToUnshift, value, littleEndian = false);
_setUntil_Uint8Array_noExpandNoAsserts(bitIndexUntil = 0, uint8Array, littleEndian = false);
```

## Examples:

#### 1. Pack Uint7, Boolean, Uint43 variables to hex. And unpack.

  ```javascript
import { BitDataView } from '@telemok/bitdataview';

let sourceData = {
	percents: 99,
	isOn: true,
	msecUptime: 1234567890123,
};
let source = new BitDataView();
source.push_Uint53orLess(7, sourceData.percents);// pack 7 bits
source.push_Bools(sourceData.isOn);// pack 1 bit
source.push_Uint53orLess(43, sourceData.msecUptime);// pack 43 bits
let hex = source.exportHex();//export 7 + 1 + 41 = 51 bits or 5 bytes
//send hex to another device, or store to localstorage
// [another computer another script.js]
let dest = new BitDataView();
dest.importHex(hex);
let result = {};
result.percents = dest.shift_Uint53orLess(7);
result.isOn = dest.shift_Bool();
result.msecUptime = dest.shift_Uint53orLess(43);
console.log("result", result);
```

#### 2. New instance with parameters

```javascript
import { BitDataView } from '@telemok/bitdataview';

let bitdataview = new BitDataView({
	automaticMemoryExpansion: true,
	bufferBaseSizeBits: 0,
});
  ```
