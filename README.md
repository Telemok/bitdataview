# bitdataview (beta version)

ES6 bit addressing DataView+Stack+Queue+Buffer with any types: Uint13, Int53, BigInt61, Float17, LSB/MSB, LE/BE, .set(), .get(), .push(), .pop(), .shift(), .unshift() 

## Features

- Like **DataView**, but with **bit addressing**.
- **.set(), .get(), .push(), .unshift(), .pop(), .shift()** methods for each data type.
- Data types: boolean and custom bit size integers and floats. For example: **Uint17**, **Int39** or **BigUint59**.
- Like a **BitBuffer**, **BitArray**, **BitStack**, **BitQueue**.
- **Small memory** using: 1 bit in memory for every 1 bit data. 23 bits data => 3 bytes in RAM.
- Full **assert arguments** of functions.
- Endianness: **Little Endian** and Big Endian byte order supported.
- Bit numbering: **LSB** (lest significant bit) by default, MSB (most SB) is supported.
- Can export and import to **C/C++ BitDataView** library (only if LSB + Little Endian).
- 100 asserted main methods, 100 unasserted fast methods, > 20 advanced methods
- Binary parsing and decrypting RS-232, HDLC, Ethernet, USB, Can-Bus, TCP/IP RAW packets.
- NodeJs and browser Javascript support.
- Can be used in external schemas. Used in Telemok schemas.
- Old browser support.
- IOT pack data for exchange between C/C++ and JavaScript ready.

## Examples:
Available in folder /examples/

#### 1. Pack Uint7, Boolean, Int43 variables to hex. And unpack.

```javascript
import { BitDataView } from '@telemok/bitdataview';

let sourceData = {
	percents: 99, // maximal 7 bits
	isOn: true, // 1 bit
	moneyBalance: -1234567890123, // maximal 43 bits
};
let source = new BitDataView();
source.push_Byte(7, sourceData.percents);// pack 7 bits
source.push_Bits(sourceData.isOn);// pack 1 bit
source.push_Int(43, sourceData.moneyBalance);// pack 43 bits
console.log("storedBits", source.getStoredBits());//storedBits 51
let hex = source.exportHex();//export 7 + 1 + 43 = 51 bits or 7 bytes
console.log("hex", hex);//hex e335fb048ee006
//send hex to another device, or store to localstorage
// [another computer another script.js]
let dest = new BitDataView();
dest.importHex(hex);
let result = {
	percents: dest.shift_Byte(7),
	isOn: dest.shift_Bit(),
	moneyBalance: dest.shift_Int(43),
};
console.log("result", result);//result { percents: 99, isOn: 1, moneyBalance: -1234567890123 }
```

#### 2. Unpack Uint7, Boolean, Int43 variables in C/C++.

```C
/*C code*/
#pragma pack(1)
struct Example{
	unsigned char percents: 7;
	bool isOn;
	long moneyBalance: 43;
}__attribute__((__packed__ ));
Example example;
memcpy((void*)(&example), (void*)source, sizeof(Example));
```

#### 3. New instance with parameters

```javascript
import { BitDataView } from '@telemok/bitdataview';

let bitdataview = new BitDataView({
    automaticMemoryExpansion: true,//Allow auto expand, when push or unshift
    bufferBaseSizeBits: 0, //Base size, default is 256 * 8 bits
    significantBit: "LSB", //Bits order
    endianness: "BIG_ENDIAN", //Bytes order
	startOffsetBits: 0, //Move start offset to begin of buffer
});
```
#### 4. Make binary packed packet

```javascript
import { BitDataView } from '@telemok/bitdataview';

function userPutDataToPacket(bitdataview) {//put some user different data
	bitdataview.push_Uint(12, driver.PACKET_TYPE_TELEMETRY_1);
	bitdataview.push_Float32(driver.getTemperature());
	bitdataview.push_Int(19, driver.getBalance());
	bitdataview.push_Byte(7, driver.getPercents());
	bitdataview.push_Uint(12, driver.getThermocouple());
	bitdataview.push_BigUint(59, driver.getUptimeTicks());
}

let bitdataview = new BitDataView({
    automaticMemoryExpansion: false, //Fixed buffer size, deny auto expand
    bufferBaseSizeBits: 400, //Buffer size bits
    significantBit: "LSB", //Bits order
    endianness: "LITTLE_ENDIAN", //Bytes order
	startOffsetBits: 9 + 12, //Move start offset to free space for prepend length of packet
});
userPutDataToPacket(bitdataview);//Get any user data
if(bitdataview.getStoredBits() > 375)//Check data size overflow
	throw new Error(`Overflow`);
bitdataview.unshift_Uint(9, bitdataview.getStoredBits());//Put 9-bit length of packet BEFORE packet.
let uint8ArrayPacket = bitdataview.exportUnit8Array();//Zeroes will be added to end of byte
bitdataview.unshift_Uint(16, crc16(uint8ArrayPacket));//Add crc16 of length+packet to begin of packet
bitdataview.push_Uint(8, "\n".charCodeAt(0));//Add "\n" as end of packet

protocol.sendHex(bitdataview.exportHex());
```
#### 5. Parse binary unpack packet

```javascript
import { BitDataView } from '@telemok/bitdataview';

let bitdataview = new BitDataView({
	automaticMemoryExpansion: false, //Fixed buffer size, deny auto expand
	bufferBaseSizeBits: 400, //Buffer size bits
	significantBit: "LSB", //Bits order
	endianness: "LITTLE_ENDIAN", //Bytes order
	startOffsetBits: 0,
});

function parsePacket(bitdataview)
{
	valda.instance.assert(bitdataview, BitDataView);//Check bitdataview is instanceof BitDataView
	let length = bitdataview.shift(9);//Read 9-bit length from begin of packet
	if(length > bitdataview.getStoredBits())
		throw new Error(`Wrong length`);
    let packetType = bitdataview.shift_Uint(12);
	if(packetType === driver.PACKET_TYPE_TELEMETRY_1)
    {
      //Check packet size if need. But if no data will be auto throw. Length don't used, it example.
      let result = {
        temperature: bitdataview.shift_Float32(),
        balance: bitdataview.shift_Int(19),
        percents: bitdataview.shift_Byte(7),
        thermocouple: bitdataview.shift_Uint(12),
        uptimeTicks: bitdataview.shift_BigUint(59),
      };
      console.log("result","PACKET_TYPE_TELEMETRY_1", result);
    }
	else
		console.error(`Parsed wrong packet type`, packetType);
}

protocol.addEventListener('readByte', event =>{
	let detail = valda.object.parse(event, 'detail');
	let byte = valda.integer.parse(detail, 'byte', 0, 255);
	
	if(byte === "\n".charCodeAt(0))//end of packet finded
    {
        if(bitdataview.getStoredBits() < 9 + 16 + 12)
          throw new Error(`Low size packet`);
        let crc16True = bitdataview.shift_Uint(16);//Read crc16 from packet
        let uint8ArrayPacket = bitdataview.exportUnit8Array();//Zeroes will be added to end of byte
        let crc16Calc = crc16(uint8ArrayPacket);//Calc crc16 of length+packet to end of packet
        if(crc16True !== crc16Calc)
          throw new Error(`Wrong crc16`);
	    parsePacket(bitdataview);
    }
	if(bitdataview.getAvailableBitsToPush() < 8)
    {
        bitdataview.clear();
        console.error("Wrong packet stream");
        return;
    }
	bitdataview.push_Byte(8, byte);
});
```

## Source code:
https://github.com/Telemok/bitdataview <BR>
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
setAt_BigInt(bitIndexAt, countBitsToSet/*1-64*/, value)//use endianness
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
getAt_BigInt(bitIndexAt, countBitsToSet/*1-64*/)//use endianness
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
push_Nothing(countBits)
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


## Tests:

### Test1. Compare with DataView component (70 msec)
Only LSB.

Little endian and big endian.

1000 random offsets and values
```javascript
dataView.getUint32() vs .setAt_Uint(32) and .getAt_Uint(32)
dataView.getInt32() vs .setAt_Int(32) and .getAt_Int(32)
dataView.getUint16() vs .setAt_Uint(16) and .getAt_Uint(16)
dataView.getUint8() vs .setAt_Uint(8) and .getAt_Uint(8)
dataView.getUint8() vs .setAt_Byte(8) and .getAt_Byte(8)
dataView.getBigUint64() vs .setAt_BigUint(64) and .getAt_BigUint(64)
dataView.getFloat64() vs .setAt_Float64() and .getAt_Float64()
dataView.getFloat32() vs .setAt_Float32() and .getAt_Float32()
```

## Another libs another authors:

Warning, table has many mistakes!

Url | Lng | Addr<BR>bits | Var<BR>bits | LE<BR>BE | MSB<BR>LSB| types | Buffer<BR>Stack<BR>Queue<BR>Schema | Comment
--- | --- | ---- | ---- | ------  | ------- | ------- | -------| -------
https://www.npmjs.com/package/@telemok/bitdataview <BR>https://github.com/Telemok/bitdataview | JS | x1 | x1 | LE<BR>BE | MSB<BR>LSB| Bool<BR>(u)int<BR>float<BR>big(U)Int | Buffer<BR>Stack<BR>Queue | This library
https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/DataView | JS | x8 | x8 | LE<BR>BE | | (u)int<BR>float<BR>big(U)Int | Buffer | Internal
https://nodejs.org/api/buffer.html | JS | x8 | x8 |  | |  | Buffer | Internal
https://github.com/feross/buffer | JS | x8 | x8 |  | |  | Buffer | 
https://github.com/JoshGlazebrook/smart-buffer | JS | x8 | x8 |  | |  | Buffer | 
https://github.com/FlorianWendelborn/bitwise | JS | x1 |  |  | | Bool | Array | ?Many memory
https://github.com/inolen/bit-buffer | JS | x8 | x8 |  | |  | Buffer | 
https://github.com/rochars/byte-data | JS | x8 | x8 |  | |  | Buffer | 
https://github.com/uupaa/Bit.js/ | JS | x1 | x1 |  | | Bool<BR>Uint | Buffer | 
https://github.com/fredricrylander/bits | JS | x1 | x1 |  | | Bool<BR>Uint | Buffer | 
https://github.com/steinwurf/bitter | C++ | x1 | x1 | LE | MSB<BR>LSB | Bool<BR>Uint | Buffer | 
https://github.com/conekt/bitsandbytes | JS | x8 | x8 | LE<BR>BE |  | | Queue? | 
https://github.com/thi-ng/umbrella/tree/develop/packages/bitstream | JS | x1 | x1 | BE | LSB | Bool<BR>Uint | Queue | 
https://www.npmjs.com/package/node-bit-stream | JS | x8 | x8 |  |  |  |  | 
https://www.npmjs.com/package/bits-bytes | JS | x1 | x1 |  |  | Bool<BR>Uint | ??? | 
https://www.npmjs.com/package/@binary-format/binary-format | TS | x8 | x8 |  |  |Uint | Queue |  
https://www.npmjs.com/package/hipparchos | JS | x1 | x8 |  |  |Uint | Buffer |  
https://www.npmjs.com/package/@thi.ng/rle-pack | TS | x1 | x1 |  |  |Uint |  |  no direct access
https://www.npmjs.com/package/binopsy | JS |  |  |  |  |   |  | 
https://www.npmjs.com/package/uint-buffer | JS | x8 | x8 | LE<BR>BE |  | Uint  | Buffer | like DataView
https://github.com/keichi/binary-parser | JS | x8 | x8 | LE<BR>BE |  |  |  | 
https://github.com/anfema/bin-grammar | JS | x8 | x8 | LE<BR>BE |  | Uint | Schema | 
https://www.npmjs.com/package/@astronautlabs/bitstream | ES6 | -- | x1 | BE | MSB<BR>LSB | Uint | Queue | Many interesting code.
https://github.com/RobertBorg/node-BinaryFormat | JS | x8 | x8 | ??? | ??? |??? | Schema |  C/compatible


