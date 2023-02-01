import {BitDataView} from "./../lib/bitdataview.js"

let bitDataView = new BitDataView({
	automaticMemoryExpansion: false,
	bufferBaseSizeBits: 800 * 8
});
bitDataView.push_Bits(0, 800 * 8);
//const uint8Array = new Uint8Array(800);
const byteDataView = new DataView(bitDataView._getData().buffer);


const COUNT_TESTS = 1000;
let timerBegin = new Date();

for(let isLittleEndian = 0; isLittleEndian < 2; isLittleEndian++)
{
	if(isLittleEndian)
		bitDataView.endianness_setLittleEndian();
	else
		bitDataView.endianness_setBigEndian();

	let valueOrigin, valueCheckedDataView, valueGetted;

	for(let i = 0; i < COUNT_TESTS; i++)
	{
		let byteOffset = Math.floor(Math.random() * 700);

		valueOrigin = Math.floor(Math.random() * 0x100000000);
		bitDataView.setAt_Uint(byteOffset * 8, 32, valueOrigin);
		valueCheckedDataView = byteDataView.getUint32(byteOffset, isLittleEndian ? true: false);
		if(valueOrigin !== valueCheckedDataView)
			throw new Error(`setAt_Uint53orLess`);
		valueGetted = bitDataView.getAt_Uint(byteOffset * 8, 32);
		if(valueOrigin !== valueGetted)
			throw new Error(`getAt_Uint53orLess`);


		/*JavaScript support Uint53 and Int54, but it hard to make library with Int54 with significant and endianness*/
		valueOrigin = Math.floor(Math.random() * 0x80000000) - 0x40000000;
		bitDataView.setAt_Int(byteOffset * 8, 32, valueOrigin);
		valueCheckedDataView = byteDataView.getInt32(byteOffset, isLittleEndian ? true: false);
		if(valueOrigin !== valueCheckedDataView)
			throw new Error(`setAt_Int53orLess`);
		valueGetted = bitDataView.getAt_Int(byteOffset * 8, 32);
		if(valueOrigin !== valueGetted)
		{
			console.error(valueOrigin.toString(16), valueCheckedDataView.toString(16), valueGetted.toString(16))
			throw new Error(`getAt_Int53orLess`);
		}

		valueOrigin = Math.floor(Math.random() * 0x10000);
		bitDataView.setAt_Uint(byteOffset * 8, 16, valueOrigin);
		valueCheckedDataView = byteDataView.getUint16(byteOffset, isLittleEndian ? true: false);
		if(valueOrigin !== valueCheckedDataView)
			throw new Error(`setAt_Uint53orLess`);
		valueGetted = bitDataView.getAt_Uint(byteOffset * 8, 16);
		if(valueOrigin !== valueGetted)
			throw new Error(`getAt_Uint53orLess`);

		valueOrigin = Math.floor(Math.random() * 0x100);
		bitDataView.setAt_Uint(byteOffset * 8, 8, valueOrigin);
		valueCheckedDataView = byteDataView.getUint8(byteOffset, isLittleEndian ? true: false);
		if(valueOrigin !== valueCheckedDataView)
			throw new Error(`setAt_Uint53orLess`);
		valueGetted = bitDataView.getAt_Uint(byteOffset * 8, 8);
		if(valueOrigin !== valueGetted)
			throw new Error(`getAt_Uint53orLess`);

		valueOrigin = Math.floor(Math.random() * 0x100);
		bitDataView.setAt_Byte(byteOffset * 8, 8, valueOrigin);
		valueCheckedDataView = byteDataView.getUint8(byteOffset, isLittleEndian ? true: false);
		if(valueOrigin !== valueCheckedDataView)
			throw new Error(`setAt_Uint8orLess`);
		valueGetted = bitDataView.getAt_Byte(byteOffset * 8, 8);
		if(valueOrigin !== valueGetted)
			throw new Error(`getAt_Uint8orLess`);

		valueOrigin = (BigInt(Math.floor(Math.random() * 0x100000000))<<32n) | BigInt(Math.floor(Math.random() * 0x100000000));
		bitDataView.setAt_BigUint(byteOffset * 8, 64, valueOrigin);
		valueCheckedDataView = byteDataView.getBigUint64(byteOffset, isLittleEndian ? true: false);
		if(valueOrigin !== valueCheckedDataView)
			throw new Error(`setAt_BigUint64orLess: ${valueOrigin}, ${valueCheckedDataView}`);
		valueGetted = bitDataView.getAt_BigUint(byteOffset * 8);
		if(valueOrigin !== valueGetted)
			throw new Error(`getAt_BigUint64orLess`);

		valueOrigin = Math.random() ;
		byteDataView.setFloat64(0, valueOrigin);
		valueOrigin = byteDataView.getFloat64(0);
		bitDataView.setAt_Float64(byteOffset * 8, valueOrigin);
		valueCheckedDataView = byteDataView.getFloat64(byteOffset, isLittleEndian ? true: false);
		if(valueOrigin !== valueCheckedDataView)
			throw new Error(`setAt_Float64: ${valueOrigin}, ${valueCheckedDataView}`);
		valueGetted = bitDataView.getAt_Float64(byteOffset * 8);
		if(valueOrigin !== valueGetted)
			throw new Error(`getAt_Float64`);

		valueOrigin = Math.random() ;
		byteDataView.setFloat32(0, valueOrigin);
		valueOrigin = byteDataView.getFloat32(0);
		bitDataView.setAt_Float32(byteOffset * 8, valueOrigin);
		valueCheckedDataView = byteDataView.getFloat32(byteOffset, isLittleEndian ? true: false);
		if(valueOrigin !== valueCheckedDataView)
			throw new Error(`setAt_Float32: ${valueOrigin}, ${valueCheckedDataView}`);
		valueGetted = bitDataView.getAt_Float32(byteOffset * 8);
		if(valueOrigin !== valueGetted)
			throw new Error(`getAt_Float32`);
	}
}
//byteDataView.setFloat64(0, value, this.endianness_isLittleEndian());

let timerEnd = new Date();
console.log("test complete",  timerEnd-timerBegin,"msec")