/**
 * @file    bitdataview.js
 * @brief
 * Like DataView, but byte addressing changed to bit addressing.
 * Set, get, push, unshift, pop, shift functions for each data type.
 * Data types: boolean and custom bit size uint, int, float. For example: Uint17, Int27 or BigUint61.
 * Like a BitBuffer, BitArray, BitStack, BitQueue.
 * Small memory using: used 1 bit in memory for every 1 bit data. 23 bits data => 3 bytes in RAM.
 * Full assert arguments of functions.
 * NodeJs and browser Javascript support.
 * Endianness: Little Endian and Big Endian byte order supported.
 * Significant bit: LSB (lest) by default, MSB (most) is supported.
 * Can export and import to C/C++ BitDataView library (only if LSB + Little Endian).
 * Fastest library with same advantages.
 * >44 asserted main functions, > 32 unasserted fast functions, > 25 advanced functions
 * Good library to decrypt RS-232, HDLC, Ethernet, USB, Can-Bus, TCP/IP RAW packets.
 * @author  Dmitrii Arshinnikov <www.telemok.com@gmail.com> github.com/Telemok npmjs.com/~telemok
 * @version 0.1.2
 * @date 2023-02-01
 *
@verbatim
			Copyright (c) 2023 telemok.com Dmitrii Arshinnikov

			Licensed under the Apache License, Version 2.0(the "License");
			you may not use this file except in compliance with the License.
			You may obtain a copy of the License at

			http://www.apache.org/licenses/LICENSE-2.0

			Unless required by applicable law or agreed to in writing, software
			distributed under the License is distributed on an "AS IS" BASIS,
			WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
			See the License for the specific language governing permissions and
			limitations under the License.
@endverbatim
 */


//import {valda} from "https://cdn.jsdelivr.net/gh/telemok/valda@master/lib/valda.min.js"
import {valda} from "@telemok/valda"
export {valda};

/*Data Uint8Array. Expandable to right or left.*/
const _data = Symbol();

/*Data size in bits. Expandable.*/
const _countBitsPushLimit = Symbol();

/* Count bits pushed to right.
.push() increase it to 1.
.pop() decrease it to 1.
_countBitsPushed can not be > _countBitsPushLimit
*/
const _countBitsPushed = Symbol();

/*
Count bits shifted from left.
.shift() increase it to 1.
.unshift() decrease it to 1.
_countBitsShifted can not be > _countBitsPushed
_countBitsShifted can not be < 0
*/
const _countBitsShifted = Symbol();

/*
https://en.wikipedia.org/wiki/Bit_numbering
*/
const _significantBit = Symbol();
const _SIGNIFICANT_BIT_LSB = Symbol();
const _SIGNIFICANT_BIT_MSB = Symbol();

/* https://en.wikipedia.org/wiki/Endianness
x86-64 instruction set architectures use the little-endian format
RISC-V and ARM support both
JavaScript DataView use big-endian by default (why?)
* */
const _endianness = Symbol();
const _ENDIANNESS_LITTLE_ENDIAN = Symbol();
const _ENDIANNESS_BIG_ENDIAN = Symbol();

/*
* RS-232, HDLC, Ethernet, and USB = LSB + Litte Endian
* telemok.com = LSB + Litte Endian
* LSB + Litte Endian is easiest for developers
* BitDataView recommened to use LSB + Litte Endian, it more safe and fast

* BitDataView like to use big-endian byte order with (bits%8)!=0 because bit count must be divisible by 8. little-endian not support it.???
* For storing little endian numbers use new DataView(); Store to dataView numbers. Use .pushDataView, .shiftDataView functions.

*
* */
const _automaticMemoryExpansion = Symbol();




export class BitDataView{
	/**
	 * @constructor
	 * @param {object} parameters - base data size in bits, expandable
	 * @description
	 * automaticMemoryExpansion - false set memory static, unexpandable, fast. true allow extend memory for left and right of array
	 * bufferBaseSizeBits - 256 * 8 if not setted. Base count of maxiaml data bits. Can be expanded.
	 * significantBit - "LSB" by default, "MSB" - advanced
	 * endianness - "LITTLE_ENDIAN" by default, "BIG_ENDIAN" - advanced
	 */
	constructor(parameters = {}) {
		this[_automaticMemoryExpansion] = true;
		if('automaticMemoryExpansion' in parameters)
			this[_automaticMemoryExpansion] = valda.boolean.parse(parameters, 'automaticMemoryExpansion');

		let sizeBits = 256 * 8;
		if('bufferBaseSizeBits' in parameters)
			sizeBits = valda.integerMinMax.parse(parameters, 'bufferBaseSizeBits', 0, 0xFFFFFFFE);

		this.significantBit_setLsb();
		if('significantBit' in parameters)
			this.significantBit_set(parameters.significantBit);

		/*Attention!!! In JavaScript DataView by default is Big Endian!!!*/
		this.endianness_setLittleEndian();
		if('endianness' in parameters)
			this.endianness_set(parameters.endianness);

		this.clear(true, sizeBits);
	}
	_getData(){return this[_data];}


	/**
	 * return bits size of stored data
	 * @description single constructor
	 */
	getStoredBits() {
		return this[_countBitsPushed] - this[_countBitsShifted];
	}

	endianness_setLittleEndian() {this[_endianness] = _ENDIANNESS_LITTLE_ENDIAN;}//work very fast
	endianness_setBigEndian() {this[_endianness] = _ENDIANNESS_BIG_ENDIAN;}//work very fast
	endianness_set(endianness) {
		if (endianness === "LITTLE_ENDIAN")
			this.endianness_setLittleEndian();
		else if (endianness === "BIG_ENDIAN")
			this.endianness_setBigEndian();
		else
			throw new Error(`BitDataView.endianness_set(wrong argument, need "LITTLE_ENDIAN" (default) or "BIG_ENDIAN")`);
	}
	endianness_isLittleEndian() {return this[_endianness] === _ENDIANNESS_LITTLE_ENDIAN;}//work very fast
	endianness_isBigEndian() {return this[_endianness] === _ENDIANNESS_BIG_ENDIAN;}//work very fast
	endianness_get() {
		return this.endianness_isLittleEndian() ? "LITTLE_ENDIAN" : "BIG_ENDIAN";
	}

	significantBit_setLsb() {this[_significantBit] = _SIGNIFICANT_BIT_LSB;}//work very fast
	significantBit_setMsb() {this[_significantBit] = _SIGNIFICANT_BIT_MSB;}//work very fast
	significantBit_set(significantBitType) {
		if (significantBitType === "LSB")
			this.significantBit_setLsb();
		else if (significantBitType === "MSB")
			this.significantBit_setMsb();
		else
			throw new Error(`BitDataView.significantBit_set(wrong argument, need "LSB" (default) or "MSB")`);
	}
	significantBit_isLsb() {return this[_significantBit] === _SIGNIFICANT_BIT_LSB;}//work very fast
	significantBit_isMsb() {return this[_significantBit] === _SIGNIFICANT_BIT_MSB;}//work very fast
	significantBit_get() {
		return this[_significantBit] === _SIGNIFICANT_BIT_LSB ? "LSB" : "MSB";
	}


	//getMemoryUsed(){return this[_data].length;}

	/**
	 * @param {boolean} fullClear - false is default fast clear headers without changing buffer data and size, true is slow clear data from memory.
	 * @param {number} sizeBits - maximal 0xFFFFFFFE because C/C++ version of TelemokBitDataView used uint32_t links to head and tail
	 * @description fast clear header of bitDataView
		slow create bitDataView again with zeros in memory
	 */
	clear(fullClear = false, sizeBits = 256 * 8) {
		if (fullClear) {
			sizeBits = valda.integerMinMax.assert(sizeBits, 0, 0xFFFFFFFE);//0xFFFFFFE = (2^32)-2
			let sizeBytes = Math.ceil(sizeBits / 8);
			this[_countBitsPushLimit] = sizeBits;
			this[_data] = new Uint8Array(sizeBytes);
		}
		this[_countBitsPushed] = 0;
		this[_countBitsShifted] = 0;
	}
	/**
	 * @description make copy of bitDataView
	 * @param {boolean} copyStrictPrivateStructure - False is default, faster. True is slower, but copy full instance structure.
	 */
	clone(copyStrictPrivateStructure = false) {
		let copy = new BitDataView();
		copy[_countBitsPushLimit] = this[_countBitsPushLimit];
		if (copyStrictPrivateStructure) {/*clone as it*/
			copy[_countBitsPushed] = this[_countBitsPushed];
			copy[_countBitsShifted] = this[_countBitsShifted];
			copy[_data] = new Uint8Array(this[_data]);
		} else {/*clone faster and with minimal memory using and optimising _countBitsPushed and _countBitsShifted (only bytes will shifted, not bits)*/
			let moveLeftBytes = Math.floor(this[_countBitsShifted] / 8);
			let length = Math.ceil(this[_countBitsPushed] / 8) - moveLeftBytes;
			copy[_countBitsShifted] = this[_countBitsShifted] % 8;
			copy[_countBitsPushed] = /*length * 8 + */this[_countBitsPushed] - moveLeftBytes * 8;
			copy[_data] = this[_data].subarray(moveLeftBytes, moveLeftBytes + length);
		}
		copy[_automaticMemoryExpansion] = this[_automaticMemoryExpansion];
		return copy;
	}


	getAvailableBitsToExpandRight() {
		return 0xFFFFFFFE - this[_countBitsPushLimit];
	}
	// getAvailableBitsToPush_noExpand() {
	// 	return this[_countBitsPushLimit] - this[_countBitsPushed];
	// }
	getAvailableBitsToPush() {
		if(this[_automaticMemoryExpansion])
			return 0xFFFFFFFE - this[_countBitsPushed];
		return this[_countBitsPushLimit] - this[_countBitsPushed];
	}
	getAvailableBitsToUnshift() {
		if(this[_automaticMemoryExpansion])
			return (Math.floor(0xFFFFFFFE / 8) - this[_data].length) * 8 + this[_countBitsShifted];
		return this[_countBitsShifted];
	}

	/**
	 * @param {number} expandBits - add 'expandBytes' to buffer size to right
	 * @description if no size for push to BitDataView, size can be expanded
	 */
	expandRight(expandBits = 256 * 8) {
		if (!this[_automaticMemoryExpansion])
			throw new Error(`BitDataView.expandRight() can't expand memory for ${expandBits} bits, because it deny. .setAutomaticMemoryExpansionOn() or find overflow problem.`);
		expandBits = valda.integerMinMax.assert(expandBits, 0, 0xFFFFFFFE - this[_countBitsPushLimit]);
		this[_countBitsPushLimit] += expandBits;
		let newUint8Array = new Uint8Array(Math.ceil(this[_countBitsPushLimit] / 8));//Увеличиваем сразу на много, чтобы часто это не делать.
		newUint8Array.set(this[_data], 0);
		this[_data] = newUint8Array;
	}

	/**
	 * @param {number} expandBits - count bits to
	 * @description Сложение двух чисел*/
	expandLeft(expandBits = 256 * 8) {
		if (!this[_automaticMemoryExpansion])
			throw new Error(`BitDataView.expandLeft() can't expand memory for ${expandBits} bits, because it deny. .setAutomaticMemoryExpansionOn() or find overflow problem.`);
		expandBits = valda.integerMinMax.assert(expandBits, 0, 0xFFFFFFFF - this[_countBitsPushLimit]);
		if(expandBits % 8)
			throw new Error(`expandLeft only allow *8 bit count: 8, 16, 24, ...`);
		let offsetBytes = expandBits >>> 3;
		this[_countBitsPushLimit] += expandBits;
		this[_countBitsPushed] += expandBits;
		this[_countBitsShifted] += expandBits;
		let newUint8Array = new Uint8Array(Math.ceil(this[_countBitsPushLimit] / 8));
		newUint8Array.set(this[_data], offsetBytes);
		this[_data] = newUint8Array;
	}

	/**
	 * @return
	 * @param checkPushBits
	 * @param bitCountIfExpandRequired
	 * @description after run .expandRightIfNeed(x) you can safe do .push(x, ...)
	 */
	expandRightIfNeed(checkPushBits, bitCountIfExpandRequired = 256 * 8) {
		//console.log('expandRightIfNeed', checkPushBits,expandBytes,this[_countBitsPushed] , this[_countBitsPushLimit])
		if (this[_countBitsPushed] + checkPushBits > this[_countBitsPushLimit])
		{
			if(bitCountIfExpandRequired < checkPushBits)
				bitCountIfExpandRequired = checkPushBits;
			this.expandRight(bitCountIfExpandRequired);
		}
	}

	/**
	 * @description Сложение двух чисел
	 * @return
	 * @param checkUnshiftBits
	 * @param bitCountIfExpandRequired
	 * @description after run .expandLeftIfNeed(x) you can safe do .unshift(x, ...)
	 */
	expandLeftIfNeed(checkUnshiftBits, bitCountIfExpandRequired = 256 * 8) {
		if (this[_countBitsShifted] - checkUnshiftBits < 0)
		{
			if(bitCountIfExpandRequired < checkUnshiftBits)
				bitCountIfExpandRequired = checkUnshiftBits;
			this.expandLeft(bitCountIfExpandRequired);
		}
	}





	/* DATA SET BLOCK*/
	/* DATA SET BLOCK*/

	_andBitInMemoryAddress_noAsserts(bitMemoryAddress) {
		let addressByte = bitMemoryAddress >>> 3;
		let addressBit = bitMemoryAddress & 7;
		if(this.significantBit_isMsb())
			addressBit = 7 - addressBit;
		let maskBit = 1 << addressBit;
		this[_data][addressByte] &= ~maskBit;
	}
	_orBitInMemoryAddress_noAsserts(bitMemoryAddress) {
		let addressByte = bitMemoryAddress >>> 3;
		let addressBit = bitMemoryAddress & 7;
		if(this.significantBit_isMsb())
			addressBit = 7 - addressBit;
		let maskBit = 1 << addressBit;
		this[_data][addressByte] |= maskBit;
	}


	/**
	 * @description set bit in private memory position index
	 * @param {boolean} bitValue - is boolean. Used as "if(bitValue)"
	 * @param {number} bitMemoryAddress - is 32 bit unsigned integer. Not asserted for raise up work speed. Bit address of memory position, not bit index in array.
	 */
	_setBitInMemoryAddress_noAsserts(bitValue, bitMemoryAddress) {
		if(bitValue)
			this._orBitInMemoryAddress_noAsserts(bitMemoryAddress);
		else
			this._andBitInMemoryAddress_noAsserts(bitMemoryAddress);
		/* http://graphics.stanford.edu/~seander/bithacks.html#ConditionalSetOrClearBitsWithoutBranching bit hacks for superscalar CPUs dont' work in JavaScript because: limited to 32 bits, almost 53 bits*/
	}
	/**
	 * @description set bit by virtual index at begin of bitDataView.
	 * @param {boolean} bitValue - is boolean. Used as "if(bitValue)"
	 * @param {number} bitIndexAt - is 32 bit unsigned integer. Not asserted for raise up work speed. Bit address of memory position, not bit index in array.
	 */
	_setAt_Bool_noAsserts(bitIndexAt, bitValue) {
		this._setBitInMemoryAddress_noAsserts(bitValue, this[_countBitsShifted] + bitIndexAt);
	}
	/** set bit by virtual index at begin of bitDataView.
	 * @param {boolean} bitValue - is boolean. Used as "if(bitValue)". Asserted.
	 * @param {number} bitIndexAt - is 32 bit unsigned integer. Bit address of memory position, not bit index in array.
	 * @description
	 */
	setAt_Bit(bitIndexAt, value) {
		value = valda.boolean.assert(value, `BitDataView.setAt_Bit(wrong value)`);
		bitIndexAt = valda.integerMinMax.assert(bitIndexAt, 0, this.getStoredBits() - 1);
		this._setAt_Bool_noAsserts(bitIndexAt, value);
	}
	/**
	 * set bit by virtual index at begin of bitDataView.
	 * @param {number} bitIndexUntil - is 32 bit unsigned integer. Not asserted for raise up work speed. Bit address of memory position, not bit index in array.
	 * @param {boolean} value - Used as "if(bitValue)"
	 * @description
	 */
	_setUntil_Bool_noAsserts(bitIndexUntil, value) {
		this._setBitInMemoryAddress_noAsserts(value, this[_countBitsPushed] - 1 - bitIndexUntil);
	}
	/** set bit by virtual index until end of bitDataView.
	 * @param {number} bitIndexUntil - is 32 bit unsigned integer. Bit address of memory position, not bit index in array. 0 = (last bit index), 1 = (last bit index - 1). Asserted.
	 * @param {boolean} bitValue - Used as "if(bitValue)". Asserted.
	 * @description
	 */
	setUntil_Bit(bitIndexUntil, value) {
		bitIndexUntil = valda.integerMinMax.assert(bitIndexUntil, 0, this.getStoredBits() - 1, `BitDataView.setUntil_Bit(wrong bitIndexUntil)`);
		value = valda.boolean.assert(value, `BitDataView.setUntil_Bit(wrong value)`);
		this._setUntil_Bool_noAsserts(bitIndexUntil, value);
	}







	_getAt_BoolMemoryAddress_noAsserts(bitMemoryAddress) {
		let addressByte = bitMemoryAddress >>> 3;
		let addressBit = bitMemoryAddress & 7;
		if(this.significantBit_isMsb())
			addressBit = 7 - addressBit;
		let myByte = this[_data][addressByte];
		return (myByte >>> addressBit) & 1;
	}
	/** get bit by virtual index at begin of bitDataView.
	 * @param {number} bitIndexAt - is 32 bit unsigned integer. Bit address of memory position, not bit index in array.
	 * @return {number} - return 0 or 1 bit value.
	 * @description
	 */
	_getAt_Bool_noAsserts(bitIndexAt) {
		return this._getAt_BoolMemoryAddress_noAsserts(this[_countBitsShifted] + bitIndexAt);
	}
	/** get bit by virtual index at begin of bitDataView.
	 * @param {number} bitIndexAt - is 32 bit unsigned integer. Bit address of memory position, not bit index in array.
	 * @return {number} - return 0 or 1 bit value.
	 * @description
	 */
	getAt_Bit(bitIndexAt) {
		valda.integerMinMax.assert(bitIndexAt, 0, this.getStoredBits() - 1, `BitDataView.getAt_Bit(bitIndex: ${bitIndexAt}, bitSize: ${this.getStoredBits()})`);
		return this._getAt_Bool_noAsserts(bitIndexAt);
	}
	/** get bit by virtual index at begin of bitDataView.
	 * @param {number} bitIndexUntil - is 32 bit unsigned integer. Bit address of memory position, not bit index in array.
	 * @return {number} - return 0 or 1 bit value.
	 * @description
	 */
	_getUntil_Bool_noAsserts(bitIndexUntil) {
		return this._getAt_BoolMemoryAddress_noAsserts(this[_countBitsPushed] - 1 - bitIndexUntil);
	}
	/** get bit by virtual index until end of bitDataView.
	 * @param {number} bitIndexUntil - is 32 bit unsigned integer. Bit address of memory position, not bit index in array.
	 * @return {number} - return 0 or 1 bit value.
	 * @description
	 */
	getUntil_Bit(bitIndexUntil) {
		valda.integerMinMax.assert(bitIndexUntil, 0, this.getStoredBits() - 1, `BitDataView.getAt_Bit(bitIndex: ${bitIndexUntil}, bitSize: ${this.getStoredBits()})`);
		return this._getUntil_Bool_noAsserts(bitIndexUntil);
	}

	/**  push (add to right of bitDataView) 1 bit.
	 * @param {boolean} bitValue - 0/1 true/false value to add to right side of bitDataView
	 * @description - work faster
	 */
	_push_Bool_noExpandNoAsserts(bitValue) {
		this._setBitInMemoryAddress_noAsserts(bitValue, this[_countBitsPushed]++);
		//this[_countBitsPushed]++;
	}
	/**  push (add to right of bitDataView) some similar bits. Like fill() funcion.
	 * @param {boolean} bitValue - 0/1 true/false value to add to right side of bitDataView
	 * @param {number} count - count of similar bits to add. Default = 1.
	 * @description - work slower
	 */
	push_Bits(value, count = 1) {
		value = valda.boolean.assert(value, `BitDataView.push_Bits(wrong value)`);
		count = valda.integerMinMax.assert(count, 0, this.getAvailableBitsToPush(),`BitDataView.push_Bits(wrong count)`);
		this.expandRightIfNeed(count);
		for(; count; count--)
			this._push_Bool_noExpandNoAsserts(value);
	}

	/** unshift (add to left of bitDataView) some similar bits. Like fill() funcion.
	 * @param {boolean} bitValue - 0/1 true/false value to add to right side of bitDataView
	 * @description - work faster
	 */
	_unshift_Bool_noExpandNoAsserts(bitValue) {
		//this[_countBitsShifted]--;
		this._setBitInMemoryAddress_noAsserts(bitValue, --this[_countBitsShifted]);
	}
	/** unshift (add to left of bitDataView) 1 bit.
	 * @param {boolean} value - 0/1 true/false value to add to right side of bitDataView
	 * @description - sork slower
	 */
	unshift_Bits(value, count = 1) {
		value = valda.boolean.assert(value, `BitDataView.unshift_Bits(wrong value)`);
		count = valda.integerMinMax.assert(count, 0, this.getAvailableBitsToUnshift(),`BitDataView.unshift_Bits(wrong count)`);
		this.expandLeftIfNeed(count);
		for(; count; count--)
			this._unshift_Bool_noExpandNoAsserts(value);
	}


	/** pop (take from right of bitDataView) 1 bit.
	 * @description - sork faster.
	 * @returns {number} - 0 or 1 readed bit
	 */
	_pop_Bool_noAsserts() {
		//this[_countBitsPushed]--;
		return this._getAt_BoolMemoryAddress_noAsserts(--this[_countBitsPushed]);
	}
	/** pop (take from right of bitDataView) 1 bit.
	 * @description - work slower.
	 * @returns {number} - 0 or 1 readed bit
	 */
	pop_Bit() {
		if (this.getStoredBits() < 1)
			throw new Error(`BitDataView.pop_Bit() error because no data available in buffer`);
		return this._pop_Bool_noAsserts();
	}
	_shift_Bool_noAsserts() {
		return this._getAt_BoolMemoryAddress_noAsserts(this[_countBitsShifted]++);
	}
	/** shift (take from left of bitDataView) 1 bit.
	 * @description - swork slower.
	 * @returns {number} - 0 or 1 readed bit
	 */
	shift_Bit() {
		if (this.getStoredBits() < 1)
			throw new Error(`BitDataView.shift_Bit() error because no data available in buffer`);
		return this._shift_Bool_noAsserts();
	}






	/** set (set to custom plase of bitDataView) unsigned integer.
	 * @param {number} bitIndexAt - Bit index from begin of bitDataView. Not asserted.
	 * @param {number} countBitsToSet - Count bits from 0 to 8 of value to get. Not asserted.
	 * @return {number} byteData - byteData
	 */
	_setAt_Uint8orLess_noAsserts(bitIndexAt = 0, countBitsToSet = 8, byteData)//countBitsToPop >0 <8
	{
		//console.log(`${bitIndexAt}, ${countBitsToSet}, ${byteData}`)
		let memoryAddress = this[_countBitsShifted] + bitIndexAt;
		for(let bitMask = 1; countBitsToSet; countBitsToSet--)
		{
			//this._setBitInMemoryAddress_noAsserts(byteData & bitMask, memoryAddress++);
			//bitMask <<= 1;
			//console.log(`_setAt_Uint8orLess_noAsserts(bitIndexAt=${bitIndexAt},${countBitsToSet},${byteData},memoryAddress=${memoryAddress})`);
			this._setBitInMemoryAddress_noAsserts(byteData & 1, memoryAddress++);
			//console.log(`all = ${this.toString(2)}`)
			byteData >>>= 1;
		}
	}
	/**  push (add to right of bitDataView) unsigned integer.
	 * @param {number} countBitsPushed - Count bits from 0 to 8 of value to push. Not asserted.
	 * @param {number} value - unsigned integer number to push. From 0 to 0xFF (2 ^ 8 - 1). Not asserted.
	 */
	_push_Uint8orLess_noExpandNoAsserts(countBitsPushed, value) {
		for (let i = 0; i < countBitsPushed; i++) {
			this._push_Bool_noExpandNoAsserts((value >> i) & 1)
		}
	}
	/**  push (add to right of bitDataView) unsigned integer from 0 to 8 bits.
	 * @param {number} countBitsPushed - Count bits from 0 to 8 of value to push. Asserted.
	 * @param {number} value - unsigned integer number to push. From 0 to 0xFF (2 ^ 8 - 1). Asserted.
	 */
	push_Byte(countBitsPushed, value) {
		countBitsPushed = valda.integerMinMax.assert(countBitsPushed, 0, 8, `BitDataView.push_Byte(countBitsPushed)`);
		value = valda.integerMinMax.assert(value, 0, 0xFF, `BitDataView.push_Byte(value)`);
		this.expandRightIfNeed(countBitsPushed);
		this._push_Uint8orLess_noExpandNoAsserts(countBitsPushed, value);
	}
	/**  unshift (add to left of bitDataView) unsigned integer.
	 * @param {number} countBitsToUnshift - Count bits from 0 to 32 of value to push. Asserted.
	 * @param {number} value - unsigned integer number to unshift. From 0 to 0xFFFFFFFF (2 ^ 32 - 1). Asserted.
	 */
	_unshift_Uint8orLess_noExpandNoAsserts(countBitsToUnshift, value) {
		for (let i = countBitsToUnshift - 1; i >= 0; i--)
			this._unshift_Bool_noExpandNoAsserts((value >> i) & 1);
	}
	/**  unshift (add to left of bitDataView) unsigned integer from 0 to 8 bits.
	 * @param {number} countBitsToUnshift - Count bits from 0 to 32 of value to push. Asserted.
	 * @param {number} value - unsigned integer number to unshift. From 0 to 0xFFFFFFFF (2 ^ 32 - 1). Asserted.
	 */
	unshift_Byte(countBitsToUnshift, value) {
		countBitsToUnshift = valda.integerMinMax.assert(countBitsToUnshift, 0, 8, `BitDataView.unshift_Byte(countBitsPushed)`);
		value = valda.integerMinMax.assert(value, 0, 0xFF, `BitDataView.unshift_Byte(value)`);
		this._unshift_Uint8orLess_noExpandNoAsserts(countBitsToUnshift, value);
	}

	/** get (take from custom plase of bitDataView) unsigned integer.
	 * @param {number} bitIndexAt - Bit index from begin of bitDataView. Not asserted.
	 * @param {number} countBitsToGet - Count bits from 0 to 8 of value to get. Not asserted.
	 * @return {number} - byteData
	 */
	_getAt_Uint8orLess_noAsserts(bitIndexAt = 0, countBitsToGet = 8)
	{
		let memoryAddress = this[_countBitsShifted] + bitIndexAt;
		let byteData = 0;
		for(let bitMask = 1; countBitsToGet; countBitsToGet--)
		{
			if(this._getAt_BoolMemoryAddress_noAsserts(memoryAddress++))
				byteData |= bitMask;
			bitMask <<= 1;
		}
		return byteData;
	}

	/** get (take from custom place of bitDataView) unsigned integer.
	 * @param {number} bitIndexAt - Bit index from begin of bitDataView. Not asserted.
	 * @param {number} countBitsToGet - Count bits from 0 to 8 of value to get. Not asserted.
	 * @return {number} - byteData
	 */
	getAt_Byte(bitIndexAt = 0, countBitsToGet = 8)
	{
		countBitsToGet = valda.integerMinMax.assert(countBitsToGet, 0, 8, `BitDataView.getAt_Byte(wrong countBitsToGet)`);
		bitIndexAt = valda.integerMinMax.assert(bitIndexAt, 0, this.getStoredBits() - countBitsToGet, `BitDataView.getAt_Byte(wrong bitIndexAt)`);
		return this._getAt_Uint8orLess_noAsserts(bitIndexAt, countBitsToGet);
	}

	/** pop (take from right of bitDataView) unsigned integer(s).
	 * @param {number} countBitsToPop - Count bits from 0 to 8 of value to pop. Not asserted.
	 * @return {number} - byteData
	 */
	_pop_Uint8orLess_noAsserts(countBitsToPop = 8)//countBitsToPop >0 <8
	{
		let byteData = 0;
		for(let bitMask = 1 << (countBitsToPop - 1); bitMask; bitMask >>= 1)
		{
			if(this._pop_Bool_noAsserts())
				byteData |= bitMask;
		}
		return byteData;
	}
	/** pop (take from right of bitDataView) unsigned integer(s).
	 * @param {number} countBitsToPop - Count bits from 0 to 8 of value to pop. Not asserted.
	 * @return {number} - byteData
	 */
	pop_Byte(countBitsToPop)//countBitsToPop >0 <8
	{
		countBitsToPop = valda.integerMinMax.assert(countBitsToPop, 0, Math.min(8, this.getStoredBits()), `BitDataView.pop_Byte(countBitsToPop)`);
		return this._pop_Uint8orLess_noAsserts(countBitsToPop);
	}
	/** shift (take from left of bitDataView) unsigned integer(s).
	 * @param {number} countBitsToShift - Count bits from 0 to 8 of value to shift. Not asserted.
	 * @return {number} - byteData
	 */
	_shift_Uint8orLess_noAsserts(countBitsToShift = 8)//countBitsToPop >0 <8
	{
		let byteData = this._getAt_Uint8orLess_noAsserts(0, countBitsToShift);
		this[_countBitsShifted] += countBitsToShift;
		return byteData;
		// let byteData = 0;
		// for(let bitMask = 1; countBitsToShift; countBitsToShift--)
		// {
		// 	if(this._shift_Bool_noAsserts())
		// 		byteData |= bitMask;
		// 	bitMask <<= 1;
		// }
		// return byteData;
	}
	/** shift (take from left of bitDataView) unsigned integer(s).
	 * @param {number} countBitsToShift - Count bits from 0 to 8 of value to shift. Not asserted.
	 * @return {number} - byteData
	 */
	shift_Byte(countBitsToShift)//countBitsToPop >0 <8
	{
		countBitsToShift = valda.integerMinMax.assert(countBitsToShift, 0, Math.min(8, this.getStoredBits()), `BitDataView.shift_Byte(countBitsToShift)`);
		return this._shift_Uint8orLess_noAsserts(countBitsToShift);
	}








	/** get (take from custom plase of bitDataView) unsigned integer.
	 * @param {number} bitIndex - Bit index from begin of bitDataView. Not asserted.
	 * @param {number} countBitsToSet - Count bits from 0 to 53 of value to get. Not asserted.
	 * @return {number} - value
	 */
	_setAt_Uint53orLess_noAsserts(bitIndexAt = 0, countBitsToSet = 53, value/*,  littleEndian = false*/)
	{
		//console.log("_setAt_Uint53orLess_noAsserts",this[_countBitsShifted],this[_countBitsPushed],"bitIndexAt="+bitIndexAt,"cntBits="+countBitsToSet,"val="+value.toString(16));
		if(this.endianness_isLittleEndian())//littleEndian = true in C++ TelemokBitDataView
		{
			for(; countBitsToSet > 0;)//TO DO del countBitsToSet, use bitIndexAt in for
			{
				let subBitsCount = Math.min(countBitsToSet, 8);
				this._setAt_Uint8orLess_noAsserts(bitIndexAt ,subBitsCount, value);
				value = Math.floor(value / 0x100); /* "value = (value >> 8) & 0xFF;" work only for first 32 bits */
				countBitsToSet -= 8;
				bitIndexAt += 8;
			}
		}
		else
		{
			for(let index = 0; countBitsToSet > 0; index += 8)
			{
				let subBitsCount = Math.min(countBitsToSet, 8);
				this._setAt_Uint8orLess_noAsserts(bitIndexAt + countBitsToSet - subBitsCount, subBitsCount, value);
				value = Math.floor(value / 0x100); /* "value = (value >> 8) & 0xFF;" work only for first 32 bits */
				countBitsToSet -= 8;
			}
		}
	}
	/** set () unsigned integer.
	 * @param {number} bitIndexAt - Bit index from begin of bitDataView. Not asserted.
	 * @param {number} countBitsToSet - Count bits from 0 to 53 of value to get. Not asserted.
	 * @param {number} value - value
	 */
	_setAt_Int53orLess_noAsserts(bitIndexAt = 0, countBitsToSet = 54, value)
	{
		//console.log("_setAt_Int53orLess_noAsserts",this[_countBitsShifted],this[_countBitsPushed],"bitIndexAt="+bitIndexAt,"cntBits="+countBitsToSet,"val="+value.toString(16));
		if(this.endianness_isLittleEndian())//littleEndian = true in C++ TelemokBitDataView
		{
			for(; countBitsToSet > 0;)//TO DO del countBitsToSet, use bitIndexAt in for
			{
				let subBitsCount = Math.min(countBitsToSet, 8);
				this._setAt_Uint8orLess_noAsserts(bitIndexAt ,subBitsCount, value);
				value = Math.floor(value / 0x100); /* "value = (value >> 8) & 0xFF;" work only for first 32 bits */
				countBitsToSet -= 7;
				bitIndexAt += 8;
			}
		}
		else
		{
			for(let index = 0; countBitsToSet > 0; index += 8)
			{
				let subBitsCount = Math.min(countBitsToSet, 8);
				this._setAt_Uint8orLess_noAsserts(bitIndexAt + countBitsToSet - subBitsCount, subBitsCount, value);
				value = Math.floor(value / 0x100); /* "value = (value >> 8) & 0xFF;" work only for first 32 bits */
				countBitsToSet -= 8;
			}
		}
	}
	setAt_Int(bitIndexAt = 0, countBitsToSet = 54, value) {
			countBitsToSet = valda.integerMinMax.assert(countBitsToSet, 1, 54);
			bitIndexAt = valda.integerMinMax.assert(bitIndexAt, 0, this.getStoredBits() - countBitsToSet);
			let tmp = Math.pow(2, countBitsToSet - 1);
			value = valda.integerMinMax.assert(value, -tmp, tmp - 1);
		return this._setAt_Int53orLess_noAsserts(bitIndexAt, countBitsToSet, value);
	}

	/**  unshift (add to left of bitDataView) unsigned integer.
	 * @param {number} countBitsToUnshift - Count bits from 0 to 53 of value to push. Not asserted.
	 * @param {number} value - unsigned integer number to unshift. From 0 to 1FFFFFFFFFFFFF (2 ^ 53 - 1). Not asserted.
	 */
	_unshift_Uint53orLess_noExpandNoAsserts(countBitsToUnshift, value) {
		this[_countBitsShifted] -= countBitsToUnshift;
		this._setAt_Uint53orLess_noAsserts(0, countBitsToUnshift, value);
	}


	/** set (set to custom plase of bitDataView) unsigned integer.
	 * @param {number} bitIndexAt - Bit index from begin of bitDataView.
	 * @param {number} countBitsToSet - Count bits from 0 to 8 of value to get.
	 * @return {number} value - value
	 */
	setAt_Byte(bitIndexAt, countBitsToSet, value){
		countBitsToSet = valda.integerMinMax.assert(countBitsToSet, 0, 8, `BitDataView.setAt_Byte(countBitsToSet)`);
		bitIndexAt = valda.integerMinMax.assert(bitIndexAt, 0, this.getStoredBits() - countBitsToSet, `BitDataView.setAt_Byte(bitIndexAt)`);
		value = valda.integerMinMax.assert(value, 0, (1 << countBitsToSet) - 1, `BitDataView.setAt_Byte(value)`);
		this._setAt_Uint8orLess_noAsserts(bitIndexAt, countBitsToSet, value);
	}

	/**  set unsigned integer at.
	 * @param {bitIndexAt} bitIndexAt -  Bit index from begin of bitDataView.
	 * @param {number} countBitsToUnshift - Count bits from 0 to 53 of value to push. Asserted.
	 * @param {number} value - unsigned integer number to unshift. From 0 to 1FFFFFFFFFFFFF (2 ^ 53 - 1). Asserted.
	 */
	setAt_Uint(bitIndexAt, countBitsToSet, value) {
		countBitsToSet = valda.integerMinMax.assert(countBitsToSet, 0, 53, `BitDataView.setAt_Uint(wrong countBitsToSet)`);
		bitIndexAt = valda.integerMinMax.assert(bitIndexAt, 0, this.getStoredBits() - countBitsToSet, `BitDataView.setAt_Uint(wrong bitIndexAt)`);
		value = valda.integerMinMax.assert(value, 0, Math.pow(2, countBitsToSet) - 1);
		this._setAt_Uint53orLess_noAsserts(bitIndexAt, countBitsToSet, value);
	}







	_setUntil_Uint53orLess_noAsserts(bitIndexUntil = 0, countBitsToSet = 53, value)
	{
		return this._setAt_Uint53orLess_noAsserts(this.getStoredBits() - bitIndexUntil - countBitsToSet, countBitsToSet, value);
	}
	_setUntil_Int53orLess_noAsserts(bitIndexUntil = 0, countBitsToSet = 53, value)
	{
		return this._setAt_Int53orLess_noAsserts(this.getStoredBits() - bitIndexUntil - countBitsToSet, countBitsToSet, value);
	}

	/**  push (add to right of bitDataView) unsigned integer.
	 * @param {number} countBitsToPush - Count bits from 0 to 52 of value to push. Not asserted.
	 * @param {number} value - unsigned integer number to push. From 0 to 1FFFFFFFFFFFFF (2 ^ 53 - 1). Not asserted.
	 * @description
	 */
	_push_Uint53orLess_noExpandNoAsserts(countBitsToPush, value) {
		this[_countBitsPushed] += countBitsToPush;
		this._setUntil_Uint53orLess_noAsserts(0, countBitsToPush, value);
	}
	/**  push (add to right of bitDataView) unsigned integer.
	 * @param {number} countBitsToPush - Count bits from 0 to 52 of value to push. Asserted.
	 * @param {number} value - unsigned integer number to push. From 0 to 1FFFFFFFFFFFFF (2 ^ 53 - 1). Asserted.
	 * @description
	 */
	push_Uint(countBitsToPush, value) {
		countBitsToPush = valda.integerMinMax.assert(countBitsToPush, 0, 53, `BitDataView.push_Uint53orLess`);
		value = valda.integerMinMax.assert(value, 0, Number.MAX_SAFE_INTEGER, `BitDataView.push_Uint53orLess`);
		this.expandRightIfNeed(countBitsToPush);
		this._push_Uint53orLess_noExpandNoAsserts( countBitsToPush, value);
	}
		/**  push (add to right of bitDataView) unsigned integer.
	 * @param {number} countBitsToPush - Count bits from 0 to 52 of value to push. Not asserted.
	 * @param {number} value - unsigned integer number to push. From 0 to 1FFFFFFFFFFFFF (2 ^ 53 - 1). Not asserted.
	 * @description
	 */
	_push_Int53orLess_noExpandNoAsserts(countBitsToPush, value) {
		this[_countBitsPushed] += countBitsToPush;
		this._setUntil_Int53orLess_noAsserts(0, countBitsToPush, value);
	}
	/**  push (add to right of bitDataView) unsigned integer.
	 * @param {number} countBitsToPush - Count bits from 0 to 52 of value to push. Asserted.
	 * @param {number} value - unsigned integer number to push. From 0 to 1FFFFFFFFFFFFF (2 ^ 53 - 1). Asserted.
	 * @description
	 */
	push_Int(countBitsToPush, value) {
		countBitsToPush = valda.integerMinMax.assert(countBitsToPush, 0, 53, `BitDataView.push_Int53orLess`);
		value = valda.integerMinMax.assert(value, 0, Number.MAX_SAFE_INTEGER, `BitDataView.push_Int53orLess`);
		this.expandRightIfNeed(countBitsToPush);
		this._push_Int53orLess_noExpandNoAsserts( countBitsToPush, value);
	}



	/**  unshift (add to left of bitDataView) unsigned integer.
	 * @param {number} countBitsToUnshift - Count bits from 0 to 53 of value to push. Not asserted.
	 * @param {number} value - unsigned integer number to unshift. From 0 to 1FFFFFFFFFFFFF (2 ^ 53 - 1). Not asserted.
	 */
	_unshift_Uint53orLess_noExpandNoAsserts(countBitsToUnshift, value) {
		this[_countBitsShifted] -= countBitsToUnshift;
		this._setAt_Uint53orLess_noAsserts(0, countBitsToUnshift, value);
	}
	/**  unshift (add to left of bitDataView) unsigned integer.
	 * @param {number} countBitsToUnshift - Count bits from 0 to 53 of value to push. Asserted.
	 * @param {number} value - unsigned integer number to unshift. From 0 to 1FFFFFFFFFFFFF (2 ^ 53 - 1). Asserted.
	 */
	unshift_Uint(countBitsToUnshift, value) {
		countBitsToUnshift = valda.integerMinMax.assert(countBitsToUnshift, 0, 53, `BitDataView.unshift_Uint53orLess`);
		value = valda.integerMinMax.assert(value, 0, Number.MAX_SAFE_INTEGER, `BitDataView.unshift_Uint53orLess`);
		this.expandLeftIfNeed(countBitsToUnshift);
		this._unshift_Uint53orLess_noExpandNoAsserts(countBitsToUnshift, value);
	}

	/**  unshift (add to left of bitDataView) signed integer.
	 * @param {number} countBitsToUnshift - Count bits from 0 to 53 of value to push. Not asserted.
	 * @param {number} value - signed integer number to unshift. From 0 to 1FFFFFFFFFFFFF (2 ^ 53 - 1). Not asserted.
	 */
	_unshift_Int53orLess_noExpandNoAsserts(countBitsToUnshift, value) {
		this[_countBitsShifted] -= countBitsToUnshift;
		this._setAt_Int53orLess_noAsserts(0, countBitsToUnshift, value);
	}
	/**  unshift (add to left of bitDataView) signed integer.
	 * @param {number} countBitsToUnshift - Count bits from 0 to 53 of value to push. Asserted.
	 * @param {number} value - signed integer number to unshift. From 0 to 1FFFFFFFFFFFFF (2 ^ 53 - 1). Asserted.
	 */
	unshift_Int(countBitsToUnshift, value) {
		countBitsToUnshift = valda.integerMinMax.assert(countBitsToUnshift, 0, 53);
		value = valda.integerMinMax.assert(value, 0, Number.MAX_SAFE_INTEGER);
		this.expandLeftIfNeed(countBitsToUnshift);
		this._unshift_Int53orLess_noExpandNoAsserts(countBitsToUnshift, value);
	}

	/** get (take from custom plase of bitDataView) unsigned integer.
	 * @param {number} bitIndex - Bit index from begin of bitDataView. Not asserted.
	 * @param {number} countBitsToGet - Count bits from 0 to 53 of value to get. Not asserted.
	 * @return {number} - value
	 */
	_getAt_Uint53orLess_noAsserts(bitIndexAt = 0, countBitsToGet = 53)
	{
		//let s = `_getAt_Uint53orLess_noAsserts(${bitIndexAt}, ${countBitsToGet}, ${littleEndian}) =`;

		let result = 0;
		if(this.endianness_isLittleEndian())/* littleEndian is reverse for shift and pop */
		{
			for(let byteMultiplier = 1; countBitsToGet > 0; bitIndexAt += 8)
			{
				let byteData = this._getAt_Uint8orLess_noAsserts(bitIndexAt, Math.min(countBitsToGet, 8));
				countBitsToGet -= 8;
				result += byteData * byteMultiplier; /* Don't use "result |= (byteData << (8 * byteIndex));" because it work for first 32 bits */
				byteMultiplier *= 0x100;
			}
		}
		else
		{
			for(; countBitsToGet > 0; bitIndexAt += 8)
			{
				let count = Math.min(countBitsToGet, 8);
				let byteData = this._getAt_Uint8orLess_noAsserts(bitIndexAt, count);
				countBitsToGet -= 8;
				result *= (1 << count); /* Don't use "result <<= 8;" because it work for first 32 bits */
				result += byteData; /* Don't use "result |= byteData;" because it work for first 32 bits */
			}
		}
		//console.log(`${s} "${result.toString(2)}"`);
		return result;
	}
	/** get (take from custom plase of bitDataView) unsigned integer.
	 * @param {number} bitIndex - Bit index from begin of bitDataView. Not asserted.
	 * @param {number} countBitsToGet - Count bits from 0 to 53 of value to get. Not asserted.
	 * @return {number} - value
	 */
	getAt_Uint(bitIndexAt = 0, countBitsToGet = 53) {
		countBitsToGet = valda.integerMinMax.assert(countBitsToGet, 0, 53, `BitDataView.getAt_Uint(wrong countBitsToGet)`);
		bitIndexAt = valda.integerMinMax.assert(bitIndexAt, 0, this.getStoredBits() - countBitsToGet, `BitDataView.getAt_Uint(wrong bitIndexAt)`);
		return this._getAt_Uint53orLess_noAsserts(bitIndexAt, countBitsToGet);
	}



	/** get (take from custom plase of bitDataView) unsigned integer.
	 * @param {number} bitIndex - Bit index from begin of bitDataView. Not asserted.
	 * @param {number} countBitsToGet - Count bits from 0 to 53 of value to get. Not asserted.
	 * @return {number} - value
	 */
	_getAt_Int53orLess_noAsserts(bitIndexAt = 0, countBitsToGet = 54, /*TODO вернуть littleEndian, иначе не будет работать custom float*/)
	{
		let result = 0;
		let countBitsToGetMantissa = countBitsToGet;
		let maskSign = Math.pow(2, countBitsToGetMantissa - 1);
		let maskNegative = Math.pow(2, countBitsToGetMantissa) - 1;
		if(this.endianness_isLittleEndian())/* littleEndian is reverse for shift and pop */
		{
			//console.log("get LE int54",bitIndexAt,countBitsToGet);
			for(let byteMultiplier = 1; countBitsToGetMantissa > 0; bitIndexAt += 8)
			{
				let byteData = this._getAt_Uint8orLess_noAsserts(bitIndexAt, Math.min(countBitsToGetMantissa, 8));
				countBitsToGetMantissa -= 8;
				result += byteData * byteMultiplier; /* Don't use "result |= (byteData << (8 * byteIndex));" because it work for first 32 bits */
				byteMultiplier *= 0x100;
			}
		}
		else
		{
			//console.log("get BE int54",bitIndexAt,countBitsToGet);
			//countBitsToGetMantissa--;
			//bitIndexAt++;
			for(; countBitsToGetMantissa > 0; bitIndexAt += 8)
			{
				let count = Math.min(countBitsToGetMantissa, 8);
				let byteData = this._getAt_Uint8orLess_noAsserts(bitIndexAt, count);
				countBitsToGetMantissa -= 8;
				result *= (1 << count); /* Don't use "result <<= 8;" because it work for first 32 bits */
				result += byteData; /* Don't use "result |= byteData;" because it work for first 32 bits */
			}
		}

		let sign = (maskSign & result) ? true : false;
		if(sign)
			result = result - maskNegative - 1;
		return result;
	}
	/** get (take from custom plase of bitDataView) unsigned integer.
	 * @param {number} bitIndex - Bit index from begin of bitDataView. Not asserted.
	 * @param {number} countBitsToGet - Count bits from 0 to 53 of value to get. Not asserted.
	 * @return {number} - value
	 */
	getAt_Int(bitIndexAt = 0, countBitsToGet = 54) {
		countBitsToGet = valda.integerMinMax.assert(countBitsToGet, 0, 54);
		bitIndexAt = valda.integerMinMax.assert(bitIndexAt, 0, this.getStoredBits() - countBitsToGet);
		return this._getAt_Int53orLess_noAsserts(bitIndexAt, countBitsToGet);
	}
	_getUntil_Uint53orLess_noAsserts(bitIndexUntil = 0, countBitsToGet = 53)
	{
		return this._getAt_Uint53orLess_noAsserts(this.getStoredBits() - bitIndexUntil - countBitsToGet, countBitsToGet);
	}
	_getUntil_Int53orLess_noAsserts(bitIndexUntil = 0, countBitsToGet = 53)
	{
		return this._getAt_Int53orLess_noAsserts(this.getStoredBits() - bitIndexUntil - countBitsToGet, countBitsToGet);
	}

	_pop_Uint53orLess_noAsserts(countBitsToPop)
	{
		let result = this._getUntil_Uint53orLess_noAsserts(0, countBitsToPop);
		this[_countBitsPushed] -= countBitsToPop;
		return result;
	}
	pop_Uint(countBitsToPop)
	{
		countBitsToPop = valda.integerMinMax.assert(countBitsToPop, 0, Math.min(this.getStoredBits(), 53), `BitDataView.pop_Uint(countBitsToPop)`);
		return this._pop_Uint53orLess_noAsserts(countBitsToPop);
	}
	_pop_Int53orLess_noAsserts(countBitsToPop)
	{
		let result = this._getUntil_Int53orLess_noAsserts(0, countBitsToPop);
		this[_countBitsPushed] -= countBitsToPop;
		return result;
	}
	pop_Int(countBitsToPop)
	{
		countBitsToPop = valda.integerMinMax.assert(countBitsToPop, 0, Math.min(this.getStoredBits(), 53), `BitDataView.pop_Int(countBitsToPop)`);
		return this._pop_Int53orLess_noAsserts(countBitsToPop);
	}

	_shift_Uint53orLess_noAsserts(countBitsToShift)
	{
		let result = this._getAt_Uint53orLess_noAsserts(0, countBitsToShift);
		this[_countBitsShifted] += countBitsToShift;
		return result;
	}
	shift_Uint(countBitsToShift)
	{
		countBitsToShift = valda.integerMinMax.assert(countBitsToShift, 0, Math.min(this.getStoredBits(), 53), `BitDataView.shift_Uint53orLess`);
		return this._shift_Uint53orLess_noAsserts(countBitsToShift);
	}
	_shift_Int53orLess_noAsserts(countBitsToShift)
	{
		let result = this._getAt_Int53orLess_noAsserts(0, countBitsToShift);
		this[_countBitsShifted] += countBitsToShift;
		return result;
	}
	shift_Int(countBitsToShift)
	{
		countBitsToShift = valda.integerMinMax.assert(countBitsToShift, 0, Math.min(this.getStoredBits(), 53));
		return this._shift_Int53orLess_noAsserts(countBitsToShift);
	}










	//
	// /**  push (add to right of bitDataView) unsigned integer.
	//  * @param {number} countBitsPushed - Count bits from 0 to 32 of value to push. Asserted.
	//  * @param {number} value - unsigned integer number to push. From 0 to 0xFFFFFFFF (2 ^ 32 - 1). Asserted.
	//  */
	// push_UIntegerLessOr32Bits_noExpandNoAsserts(countBitsPushed, value) {
	// 	for (let i = 0; i < countBitsPushed; i++) {
	// 		this._push_Bool_noExpandNoAsserts((value >> i) & 1)
	// 	}
	// }
	// /**  push (add to right of bitDataView) unsigned integer.
	//  * @param {number} countBitsPushed - Count bits from 0 to 32 of value to push. Asserted.
	//  * @param {number} value - unsigned integer number to push. From 0 to 0xFFFFFFFF (2 ^ 32 - 1). Asserted.
	//  */
	// push_UIntegerLessOr32Bits(countBitsPushed, value) {
	// 	countBitsPushed = valda.integerMinMax.assert(countBitsPushed, 0, 32, `BitDataView.push_UintLessOr32Bits`);
	// 	value = valda.integerMinMax.assert(value, 0, 0xFFFFFFFE, `BitDataView.push_UintLessOr32Bits`);
	// 	this.expandRightIfNeed(countBitsPushed);
	// 	for (let i = 0; i < countBitsPushed; i++) {
	// 		this._push_Bool_noExpandNoAsserts((value >> i) & 1)
	// 	}
	// }

	// /**  push (add to right of bitDataView) unsigned integer.
	//  * @param {number} countBitsPushed - Count bits from 0 to 64 of value to push. Asserted.
	//  * @param {BigInt} value - unsigned integer number to push. From 0 to 0xFFFFFFFFFFFFFFFF (2 ^ 64 - 1). Asserted.
	//  * @description can be used with default JavaScript numbers: push_BigUint(BigInt(9876543210));
	//  */
	// push_BigUint(countBitsPushed, value) {
	// 	countBitsPushed = valda.integerMinMax.assert(countBitsPushed, 0, 64, `BitDataView.push_UintLessOr64Bits`);
	// 	value = valda.instance.assert(value, BigInt, `BitDataView.push_UintLessOr64Bits`);
	// 	this.expandRightIfNeed(countBitsPushed);
	// 	for (let i = 0n, max = BigInt(countBitsPushed); i < max; i++) {
	// 		this._push_Bool_noExpandNoAsserts((value >> i) & 1)
	// 	}
	// }







	/** get (take from custom plase of bitDataView) unsigned integer.
	 * @param {number} bitIndex - Bit index from begin of bitDataView. Not asserted.
	 * @param {number} countBitsToSet - Count bits from 0 to 53 of value to get. Not asserted.
	 * @param {BigInt} value -
	 */
	_setAt_BigUint64orLess_noAsserts(bitIndexAt = 0, countBitsToSet = 64, value)
	{
		if(this.endianness_isLittleEndian())//littleEndian = true in C++ TelemokBitDataView
		{
			for(; countBitsToSet > 0; )
			{
				let countBitsPushToByte = Math.min(countBitsToSet, 8);
				this._setAt_Uint8orLess_noAsserts(bitIndexAt ,countBitsPushToByte, Number(value & 0xFFn));
				value >>= 8n;
				countBitsToSet -= 8;
				bitIndexAt += 8;
			}
		}
		else
		{
			for(; countBitsToSet > 0; )
			{
				let subBitsCount = Math.min(countBitsToSet, 8);
				this._setAt_Uint8orLess_noAsserts(bitIndexAt+countBitsToSet - subBitsCount, subBitsCount, Number(value & 0xFFn));
				value >>= 8n;
				countBitsToSet -= 8;
			}
		}
	}
	/** get (take from custom plase of bitDataView) unsigned integer.
	 * @param {number} bitIndex - Bit index from begin of bitDataView. Not asserted.
	 * @param {number} countBitsToSet - Count bits from 0 to 53 of value to get. Not asserted.
	 * @param {BigInt} value -
	 */
	setAt_BigUint(bitIndexAt = 0, countBitsToSet = 64, value)
	{
		//console.log("setAt_BigUint64orLess")
		countBitsToSet = valda.integerMinMax.assert(countBitsToSet, 0, 64/*, `BitDataView.setAt_BigUint(wrong countBitsToGet)`*/);
		bitIndexAt = valda.integerMinMax.assert(bitIndexAt, 0, this.getStoredBits() - countBitsToSet/*, `BitDataView.setAt_BigUint(wrong bitIndexAt)`*/);
		//TODO check value
		return this._setAt_BigUint64orLess_noAsserts(bitIndexAt, countBitsToSet, value);
	}

	_setUntil_BigUint64orLess_noAsserts(bitIndexUntil = 0, countBitsToSet = 64, value)
	{
		return this._setAt_BigUint64orLess_noAsserts(this.getStoredBits() - bitIndexUntil - countBitsToSet, countBitsToSet, value);
	}
	/**  push (add to right of bitDataView) unsigned BigInt.
	 * @param {number} countBitsToPush - Count bits from 0 to 64 of value to push. Not asserted.
	 * @param {number} value - unsigned integer number to push. From 0 to 1FFFFFFFFFFFFF (2 ^ 64 - 1). Not asserted.
	 * @description
	 */
	_push_BigUint64orLess_noExpandNoAsserts(countBitsToPush, value) {
		this[_countBitsPushed] += countBitsToPush;
		this._setUntil_BigUint64orLess_noAsserts(0, countBitsToPush, value);
	}
	/**  push (add to right of bitDataView) unsigned BigInt.
	 * @param {number} countBitsToPush - Count bits from 0 to 52 of value to push. Asserted.
	 * @param {number} value - unsigned integer number to push. From 0 to 1FFFFFFFFFFFFF (2 ^ 64 - 1). Asserted.
	 * @description
	 */
	push_BigUint(countBitsToPush, value) {
		countBitsToPush = valda.integerMinMax.assert(countBitsToPush, 0, 64, `BitDataView.push_BigUint64orLess`);
		if(typeof value !== 'bigint')
			throw new Error(`BitDataView.push_BigUint(typeof value is "${typeof value}", instead of "bigint")`);
		this.expandRightIfNeed(countBitsToPush);
		this._push_BigUint64orLess_noExpandNoAsserts( countBitsToPush, value);
	}
	/**  unshift (add to left of bitDataView) unsigned integer.
	 * @param {number} countBitsToUnshift - Count bits from 0 to 64 of value to push. Not asserted.
	 * @param {number} value - unsigned integer number to unshift. From 0 to 1FFFFFFFFFFFFF (2 ^ 64 - 1). Not asserted.
	 */
	_unshift_BigUint64orLess_noExpandNoAsserts(countBitsToUnshift, value) {
		this[_countBitsShifted] -= countBitsToUnshift;
		this._setAt_BigUint64orLess_noAsserts(0, countBitsToUnshift, value);
	}
	/**  unshift (add to left of bitDataView) unsigned integer.
	 * @param {number} countBitsToUnshift - Count bits from 0 to 64 of value to push. Asserted.
	 * @param {number} value - unsigned integer number to unshift. From 0 to 1FFFFFFFFFFFFF (2 ^ 64 - 1). Asserted.
	 */
	unshift_BigUint(countBitsToUnshift, value) {
		countBitsToUnshift = valda.integerMinMax.assert(countBitsToUnshift, 0, 64, `BitDataView.unshift_BigUint64orLess`);
		if(typeof value !== 'bigint')
			throw new Error(`BitDataView.unshift_BigUint(typeof value is "${typeof value}", instead of "bigint")`);
		this.expandLeftIfNeed(countBitsToUnshift);
		this._unshift_BigUint64orLess_noExpandNoAsserts(countBitsToUnshift, value);
	}














	/** get (take from custom plase of bitDataView) unsigned integer.
	 * @param {number} bitIndex - Bit index from begin of bitDataView. Not asserted.
	 * @param {number} countBitsToGet - Count bits from 0 to 64 of value to get. Not asserted.
	 */
	_getAt_BigUint64orLess_noAsserts(bitIndexAt = 0, countBitsToGet = 64){
	let result = 0n;
	if(this.endianness_isLittleEndian())/* littleEndian is reverse for shift and pop */
	{
		for(let byteMultiplier = 1n; countBitsToGet > 0; bitIndexAt += 8)
		{
			let byteData = BigInt(this._getAt_Uint8orLess_noAsserts(bitIndexAt, Math.min(countBitsToGet, 8)));
			countBitsToGet -= 8;
			result += byteData * byteMultiplier; /* Don't use "result |= (byteData << (8 * byteIndex));" because it work for first 32 bits */
			byteMultiplier <<= 8n
			//byteMultiplier *= 0x100n;
		}
	}
	else
	{
		for(; countBitsToGet > 0; bitIndexAt += 8)
		{
			let count = Math.min(countBitsToGet, 8);
			let byteData = BigInt(this._getAt_Uint8orLess_noAsserts(bitIndexAt, count));
			countBitsToGet -= 8;
			result <<= BigInt(count);
			result |= byteData;
		}
	}
	//console.log(`${s} "${result.toString(2)}"`);
	return result;
}
/** get (take from custom plase of bitDataView) unsigned integer.
	 * @param {number} bitIndex - Bit index from begin of bitDataView. Not asserted.
	 * @param {number} countBitsToGet - Count bits from 0 to 64 of value to get. Not asserted.
	 */
	getAt_BigUint(bitIndexAt = 0, countBitsToGet = 64){
		countBitsToGet = valda.integerMinMax.assert(countBitsToGet, 0, 64);
		bitIndexAt = valda.integerMinMax.assert(bitIndexAt, 0, this.getStoredBits() - countBitsToGet);
		return this._getAt_BigUint64orLess_noAsserts(bitIndexAt, countBitsToGet);
	}
	// {
	// 	if(this.endianness_isLittleEndian())//littleEndian = true in C++ TelemokBitDataView
	// 	{
	// 		for(; countBitsToSet > 0; )
	// 		{
	// 			let countBitsPushToByte = Math.min(countBitsToSet, 8);
	// 			this._setAt_Uint8orLess_noAsserts(bitIndexAt ,countBitsPushToByte, Number(value & 0xFFn));
	// 			value >>= 8n;
	// 			countBitsToSet -= 8;
	// 			bitIndexAt += 8;
	// 		}
	// 	}
	// 	else
	// 	{
	// 		for(; countBitsToSet > 0; )
	// 		{
	// 			let subBitsCount = Math.min(countBitsToSet, 8);
	// 			this._setAt_Uint8orLess_noAsserts(countBitsToSet - subBitsCount, subBitsCount, Number(value & 0xFFn));
	// 			value >>= 8n;
	// 			countBitsToSet -= 8;
	// 		}
	// 	}
	// }
	//
	//








	// /**  unshift (add to left of bitDataView) unsigned integer.
	//  * @param {number} countBitsToUnshift - Count bits from 0 to 32 of value to push. Asserted.
	//  * @param {number} value - unsigned integer number to unshift. From 0 to 0xFFFFFFFF (2 ^ 32 - 1). Asserted.
	//  */
	// unshift_UIntegerLessOr32Bits_noExpandNoAsserts(countBitsToUnshift, value) {
	// 	for (let i = countBitsToUnshift - 1; i >= 0; i--)
	// 		this.unshift_Bit((value >> i) & 1);
	// }
	// /**  unshift (add to left of bitDataView) unsigned integer.
	//  * @param {number} countBitsToUnshift - Count bits from 0 to 32 of value to push. Asserted.
	//  * @param {number} value - unsigned integer number to unshift. From 0 to 0xFFFFFFFF (2 ^ 32 - 1). Asserted.
	//  */
	// unshift_UIntegerLessOr32Bits(countBitsToUnshift, value) {
	// 	countBitsToUnshift = valda.integerMinMax.assert(countBitsToUnshift, 0, 32, `BitDataView.unshift_UIntegerLessOr32Bits`);
	// 	value = valda.integerMinMax.assert(value, 0, 0xFFFFFFFF, `BitDataView.unshift_UIntegerLessOr32Bits`);
	// 	this.expandLeftIfNeed(countBitsToUnshift);
	// 	// for (let i = countBitsToUnshift - 1; i >= 0; i--)
	// 	// 	this.unshift_Bit((value >> i) & 1);
	// 	for (let mask = 1 << (countBitsToUnshift - 1); mask; mask >>= 1)
	// 		this.unshift_Bit(value & mask);
	// }

	// /**  unshift (add to left of bitDataView) unsigned integer.
	//  * @param {number} countBitsToUnshift - Count bits from 0 to 64 of value to push. Asserted.
	//  * @param {BigInt} value - unsigned integer number to unshift. From 0 to 0xFFFFFFFFFFFFFFFF (2 ^ 64 - 1). Asserted.
	//  */
	// unshift_BigUint(countBitsToUnshift, value) {
	// 	countBitsToUnshift = valda.integerMinMax.assert(countBitsToUnshift, 0, 64, `BitDataView.unshift_BigUint64orLess`);
	// 	if(typeof value !== 'bigint')
	// 		throw new Error(`BitDataView.unshift_BigUint(typeof value is "${typeof value}", instead of "bigint")`);
	// 	this.expandLeftIfNeed(countBitsToUnshift);
	// 	for (let i = BigInt(countBitsToUnshift) - 1n; i >= 0n; i--)
	// 		this.unshift_Bit(((value >> i) & 1n) != 0n);
	// }








	// /**  shift (take from left of bitDataView) unsigned integer(s).
	//  * @param {number} bitsEach - Count bits from 0 to 53 of value to shift. Asserted.
	//  * @param {number} countIfArray - Repeat (countIfArray) times and return as [] if countIfArray > 0. Return single value if countIfArray == 0 (default). Asserted.
	//  * @return - [numbers] if countIfArray > 0 or number if countIfArray == 0 (default)
	//  */
	// shift_UIntegers(bitsEach, countIfArray = 0)
	// {
	// 	bitsEach = valda.integerMinMax.assert(bitsEach, 0, 53, `BitDataView.shift_UIntegers(wrong bitsEach)`);
	// 	countIfArray = valda.integerMinMax.assert(countIfArray, 0, 0x7FFFFFF8, `BitDataView.shift_UIntegers(wrong countIfArray)`);
	// 	let count = countIfArray ? countIfArray : 1;
	// 	if(this[_countBitsShifted] + bitsEach * count > this[_countBitsPushed])
	// 		throw new Error(`BitDataView.shift_UIntegers(bitsEach = ${bitsEach}, countIfArray = ${countIfArray}) not enought ${bitsEach * count} bits, only ${this.getStoredBits()} bits stored.`);
	// 		//throw new Error(`BitDataView.shift_UIntegers() no elements. countBitsShifted: ${this[_countBitsShifted]}, countBitsPushed: ${this[_countBitsPushed]}, bitsEach: ${bitsEach}`);
	// 	let resultArr;
	// 	if(countIfArray)
	// 	{
	// 		if(bitsEach > 32)
	// 			resultArr = new Array(count);
	// 		else if(bitsEach > 16)
	// 			resultArr = new Uint32Array(count);
	// 		else if(bitsEach > 8)
	// 			resultArr = new Uint16Array(count);
	// 		else
	// 			resultArr = new Uint8Array(count);
	// 	}
	// 	for(let arrIndex = 0; arrIndex < count; arrIndex++)
	// 	{
	// 		let tmp = 0;
	// 		/* Attention! Bitwise operations like "<<=" and "|=" work in JavaScript only for first 32 bits of number! */
	// 		for(let i = 0, mask = 1; i < bitsEach; i++, mask *= 2)
	// 		{
	// 			if(this._shift_Bool_noAsserts())
	// 				tmp += mask;
	// 		}
	// 		if(!countIfArray)
	// 			return tmp;
	// 		resultArr[arrIndex] = tmp;
	// 	}
	// 	return resultArr;
	// }
	/**  shift (take from left of bitDataView) BigInt(s).
	 * @param {number} bitsEach - Count bits from 0 to 64 of value to shift. Asserted.
	 * @param {number} countIfArray - Repeat (countIfArray) times and return as [] if countIfArray > 0. Return single value if countIfArray == 0 (default). Asserted.
	 * @return - BigInt or array.[BigInts] if countIfArray > 0 or BigInt if countIfArray == 0 (default)
	 */
	// shift_UnsignedBigIntegers(bitsEach, countIfArray = 0)
	// {
	// 	bitsEach = valda.integerMinMax.assert(bitsEach, 0, 64, `BitDataView.shift_BigUIntegers(wrong bitsEach)`);
	// 	countIfArray = valda.integerMinMax.assert(countIfArray, 0, 0x7FFFFFF8, `BitDataView.shift_UnsignedBigIntegers(wrong countIfArray)`);
	// 	let count = countIfArray ? countIfArray : 1;
	// 	if(this[_countBitsShifted] + bitsEach * count > this[_countBitsPushed])
	// 		throw new Error(`BitDataView.shift_UnsignedBigIntegers(bitsEach = ${bitsEach}, countIfArray = ${countIfArray}) not enought ${bitsEach * count} bits, only ${this.getStoredBits()} bits stored.`);
	//
	// 	let resultArr;
	// 	if(countIfArray)
	// 	{
	// 		resultArr = new BigUint64Array(count);
	// 	}
	// 	for(let arrIndex = 0; arrIndex < count; arrIndex++)
	// 	{
	// 		let tmp = 0n;
	// 		/* Attention! Bitwise operations like "<<=" and "|=" work in JavaScript only for first 32 bits of number! */
	// 		for(let i = 0, mask = 1n; i < bitsEach; i++, mask *= 2n)
	// 		{
	// 			if(this._shift_Bool_noAsserts())
	// 				tmp += mask;
	// 		}
	// 		if(!countIfArray)
	// 			return tmp;
	// 		resultArr[arrIndex] = tmp;
	// 	}
	// 	return resultArr;
	// }


	// /**  pop (take from right of bitDataView) unsigned integer(s).
	//  * @param {number} bitsEach - Count bits from 0 to 53 of value to pop. Asserted.
	//  * @param {number} countIfArray - Repeat (countIfArray) times and return as [] if countIfArray > 0. Return single value if countIfArray == 0 (default). Asserted.
	//  * @return {number or array} - [numbers] if countIfArray > 0 or number if countIfArray == 0 (default)
	//  */
	// pop_UIntegers(bitsEach, countIfArray = 0)
	// {
	// 	bitsEach = valda.integerMinMax.assert(bitsEach, 0, 53, `BitDataView.pop_UIntegers(wrong bitsEach)`);
	// 	countIfArray = valda.integerMinMax.assert(countIfArray, 0, 0x7FFFFFF8, `BitDataView.pop_UIntegers(wrong countIfArray)`);
	// 	let count = countIfArray ? countIfArray : 1;
	// 	if(this[_countBitsShifted] + bitsEach * count > this[_countBitsPushed])
	// 		throw new Error(`BitDataView.pop_UIntegers(bitsEach = ${bitsEach}, countIfArray = ${countIfArray}) not enought ${bitsEach * count} bits, only ${this.getStoredBits()} bits stored.`);
	// 		//throw new Error(`BitDataView.pop_UIntegers() no elements. countBitsShifted: ${this[_countBitsShifted]}, countBitsPushed: ${this[_countBitsPushed]}, bitsEach: ${bitsEach}`);
	//
	// 	let resultArr;
	// 	if(countIfArray)
	// 	{
	// 		if(bitsEach > 32)
	// 			resultArr = new Array(count);
	// 		else if(bitsEach > 16)
	// 			resultArr = new Uint32Array(count);
	// 		else if(bitsEach > 8)
	// 			resultArr = new Uint16Array(count);
	// 		else
	// 			resultArr = new Uint8Array(count);
	// 	}
	// 	for(let arrIndex = 0; arrIndex < count; arrIndex++)
	// 	{
	// 		let tmp = 0;
	// 		/* Attention! Bitwise operations like "<<=" and "|=" work in JavaScript only for first 32 bits of number! */
	//
	// 		for(let i = 0, mask = Math.pow(2, bitsEach - 1); i < bitsEach; i++, mask /= 2)
	// 		{
	// 			if(this._pop_Bool_noAsserts())
	// 				tmp += mask;
	// 		}
	//
	// 		if(!countIfArray)
	// 			return tmp;
	// 		resultArr[arrIndex] = tmp;
	// 	}
	// 	return resultArr;
	// }
	// /**  pop (take from right of bitDataView) BigInt(s).
	//  * @param {number} bitsEach - Count bits from 0 to 64 of value to pop. Asserted.
	//  * @param {number} countIfArray - Repeat (countIfArray) times and return as BigUint64Array if countIfArray > 0. Return single value if countIfArray == 0 (default). Asserted.
	//  * @return {BigInt or BigUint64Array} - [BigInts] if countIfArray > 0 or BigInt if countIfArray == 0 (default)
	//  */
	// pop_UnsignedBigIntegers(bitsEach, countIfArray = 0)
	// {
	// 	bitsEach = valda.integerMinMax.assert(bitsEach, 0, 64, `BitDataView.pop_BigUIntegers(wrong bitsEach)`);
	// 	countIfArray = valda.integerMinMax.assert(countIfArray, 0, 0x7FFFFFF8, `BitDataView.pop_UnsignedBigIntegers(wrong countIfArray)`);
	// 	let count = countIfArray ? countIfArray : 1;
	// 	if(this[_countBitsShifted] + bitsEach * count > this[_countBitsPushed])
	// 		throw new Error(`BitDataView.pop_UnsignedBigIntegers(bitsEach = ${bitsEach}, countIfArray = ${countIfArray}) not enought ${bitsEach * count} bits, only ${this.getStoredBits()} bits stored.`);
	//
	// 	let resultArr;
	// 	if(countIfArray)
	// 	{
	// 		resultArr = new BigUint64Array(count);
	// 	}
	// 	for(let arrIndex = 0; arrIndex < count; arrIndex++)
	// 	{
	// 		let tmp = 0n;
	// 		/* Attention! Bitwise operations like "<<=" and "|=" work in JavaScript only for first 32 bits of number! */
	// 		//for(let i = 0, mask = 1n << BigInt(bitsEach - 1); i < bitsEach; i++, mask >>= 1)
	// 		for(let mask = 1n << BigInt(bitsEach - 1); mask > 0n; mask >>= 1)
	// 		{
	// 			if(this._pop_Bool_noAsserts())
	// 				tmp += mask;
	// 		}
	// 		if(!countIfArray)
	// 			return tmp;
	// 		resultArr[arrIndex] = tmp;
	// 	}
	// 	return resultArr;
	// }

	// /**  fw
	//  * @param bitsEach
	//  * @param countIfArray
	//  */
	// pop_Uint(bitsEach, countIfArray = 0)
	// {
	// 	valda.integerMinMax.assert(bitsEach, 1, 53, `BitDataView.pop_Uint(bits: "error")`);
	// 	valda.integerMinMax.assert(countIfArray, 0, 0x7FFFFFF8, `BitDataView.pop_Uint(countIfArray: "error")`);
	// 	let count = countIfArray ? countIfArray : 1;
	// 	if(this[_countBitsShifted] + bitsEach * count > this[_countBitsPushed])
	// 		throw new Error(`BitDataView.pop_Uint() no elements. countBitsShifted: ${this[_countBitsShifted]}, countBitsPushed: ${this[_countBitsPushed]}`);
	//
	// 	let resultArr = new Array(count);
	// 	for(let arrIndex = 0; arrIndex < count; arrIndex++)
	// 	{
	// 		let tmp = 0;
	// 		/* Attention! Bitwise operations like "<<=" and "|=" work in JavaScript only for first 32 bits of number! */
	// 		for(let i = 0, mask = Math.pow(2, bitsEach - 1); i < bitsEach; i++, mask /= 2)
	// 		{
	// 			if(this._pop_Bool_noAsserts())
	// 				tmp += mask;
	// 		}
	// 		if(!countIfArray)
	// 			return tmp;
	// 		resultArr[arrIndex] = tmp;
	// 	}
	// 	return resultArr;
	// }


	// /**  push (add to right of bitDataView) Uint8Array instance.
	//  * @param {Uint8Array} - uint8Array data to push
	//  */
	// push_Uint8Array_noExpandNoAsserts(uint8Array)
	// {
	// 		for(let i = 0; i < uint8Array.length; i++)
	// 		{
	// 			this.push_UIntegerLessOr32Bits_noExpandNoAsserts(8, uint8Array[i]);
	// 		}
	// }



	setAt_Uint8Array_noExpandNoAsserts(bitIndexAt = 0, uint8Array, littleEndian = false)
	{
		if(littleEndian)
		{
			//for(let i = uint8Array.length - 1; i >= 0; i--)
			for(let i = uint8Array.length - 1; i >= 0; i--)
				this._setAt_Uint8orLess_noAsserts(bitIndexAt + i * 8,8, uint8Array[uint8Array.length - 1 - i]);
		}
		else
		{
			for(let i = 0; i < uint8Array.length; i++)
				this._setAt_Uint8orLess_noAsserts(bitIndexAt + i * 8,8, uint8Array[i]);
		}
	}
	_setUntil_Uint8Array_noExpandNoAsserts(bitIndexUntil = 0, uint8Array, littleEndian = false)
	{
		return this.setAt_Uint8Array_noExpandNoAsserts(this.getStoredBits() - bitIndexUntil - uint8Array.length * 8, uint8Array, littleEndian);
	}

	/**  push (add to right of bitDataView) Uint8Array instance.
	 * @param {Uint8Array} - uint8Array data to push
	 */
	push_Uint8Array(uint8Array, littleEndian = false)
	{
		uint8Array = valda.uint8Array.assert(uint8Array, 'BitDataView.push_Uint8Array()');
		littleEndian = valda.boolean.assert(littleEndian);
		//countBitsPushed = valda.integerMinMax.assert(countBitsPushed, 0, 32, `BitDataView.push_UintLessOr32Bits`);
		//value = valda.integerMinMax.assert(value, 0, 0xFFFFFFFF, `BitDataView.push_UintLessOr32Bits`);
		this.expandRightIfNeed(uint8Array.length * 8);
		this[_countBitsPushed] += uint8Array.length * 8;
		this._setUntil_Uint8Array_noExpandNoAsserts(0, uint8Array, false);
		// if(littleEndian)
		// {
		// 	for(let i = uint8Array.length - 1; i >= 0; i--)
		// 		this._push_Uint8orLess_noExpandNoAsserts(8, uint8Array[i]);
		// }
		// else
		// {
		// 	for(let i = 0; i < uint8Array.length; i++)
		// 		this._push_Uint8orLess_noExpandNoAsserts(8, uint8Array[i]);
		// }
	}
	/**  unshift (add to left of bitDataView) Uint8Array instance.
	 * @param {Uint8Array} - uint8Array data to unshift
	 */
	unshift_Uint8Array(uint8Array, littleEndian = false)
	{
		uint8Array = valda.uint8Array.assert(uint8Array, 'BitDataView.unshift_Uint8Array()');
		this.expandLeftIfNeed(uint8Array.length * 8);

		if(littleEndian)
		{
			for(let i = 0; i < uint8Array.length; i++)
				this.unshift_UIntegerLessOr32Bits_noExpandNoAsserts(8, uint8Array[i]);
		}
		else
		{
			for(let i = uint8Array.length - 1; i >= 0; i--)
				this.unshift_UIntegerLessOr32Bits_noExpandNoAsserts(8, uint8Array[i]);
		}
	}

	/**  push (add to right of bitDataView) Uint8Array instance.
	 * @param {Uint8Array} - uint8Array data to push
	 */
	// push_ArrayBuffer(arrayBuffer, littleEndian = false)
	// {
	// 	arrayBuffer = valda.instance.assert(arrayBuffer, ArrayBuffer, 'BitDataView.push_ArrayBuffer()');
	// 	littleEndian = valda.boolean.assert(littleEndian);
	// 	//countBitsPushed = valda.integerMinMax.assert(countBitsPushed, 0, 32, `BitDataView.push_UintLessOr32Bits`);
	// 	//value = valda.integerMinMax.assert(value, 0, 0xFFFFFFFF, `BitDataView.push_UintLessOr32Bits`);
	// 	console.log("arrayBuffer",arrayBuffer)
	// 	this.expandRightIfNeed(arrayBuffer.byteLength * 8);
	// 	//a.byteLength
	// 	//let a = new ArrayBuffer();
	//
	// 	if(littleEndian)
	// 	{
	// 		for(let i = arrayBuffer.byteLength - 1; i >= 0; i--)
	// 			this.push_UIntegerLessOr32Bits_noExpandNoAsserts(8, arrayBuffer.slice(i,i));
	// 	}
	// 	else
	// 	{
	// 		for(let i = 0; i < arrayBuffer.byteLength; i++)
	// 		{
	// 			this.push_UIntegerLessOr32Bits_noExpandNoAsserts(8, arrayBuffer[i]);
	// 		}
	// 	}
	// }


	// /**  fw
	//  * @param bitsSumm
	//  */
	// shiftUint8Array(bitsSumm = this[_countBitsPushed] - this[_countBitsShifted])
	// {
	// 	bitsSumm = valda.integerMinMax.assert(bitsSumm, 0, 0x7FFFFFF8, `BitDataView.shiftUint8Array(bits)`);
	// 	let countBytes = Math.ceil(bitsSumm / 8);
	// 	let data = new Uint8Array(countBytes);
	// 	for(let index = 0; index - bitsSumm; index++)
	// 	{
	// 		let byteIndex = index >> 3;
	// 		let bitIndex = index & 7;
	// 		if(this.shiftBoolean())
	// 			data[byteIndex] |= (1 << bitIndex);
	// 	}
	// 	return data;
	// }

	_getAt_Uint8Array_noAssert(address, countBitsToGet = this.getStoredBits(), littleEndian = false)
	{
		//countBitsToGet = valda.integerMinMax.assert(countBitsToGet, 0, this.getStoredBits());
		//littleEndian = valda.boolean.assert(littleEndian);
		// if(this[_countBitsShifted] + bitsEach * count > this[_countBitsPushed])
		// 	throw new Error(`BitDataView.shift_UIntegers(bitsEach = ${bitsEach}, countIfArray = ${countIfArray}) not enought ${bitsEach * count} bits, only ${this.getStoredBits()} bits stored.`);
		let countBytes = Math.ceil(countBitsToGet / 8);
		let uint8Array = new Uint8Array(countBytes);
		for(let i = 0; countBitsToGet > 0; i++)
		{
			let count = countBitsToGet >= 8 ? 8 : countBitsToGet;
			let resultByteIndex = littleEndian ? countBytes - 1 - i : i;
			uint8Array[resultByteIndex] = this._getAt_Uint8orLess_noAsserts(address, count);
			address += 8;
			countBitsToGet -= 8;
		}
		// let uint8Array = this.shift_UIntegers(8, countElements);
		// if(littleEndian)
		// 	uint8Array.reverse();
		return uint8Array;
	}


	/**  shift (take from left of bitDataView) Unit8Array.
	 * @param {number} countBitsToShift - Count bits to shift. If count % 8 != 0, free spaces will be filled by 0. Asserted.
	 * @param {boolean} littleEndian - undefined by default. Byte order. Asserted.
	 * @return {Uint8Array} -
	 */
	shift_Uint8Array(countBitsToShift = this.getStoredBits(), littleEndian = false)
	{
		countBitsToShift = valda.integerMinMax.assert(countBitsToShift, 0, this.getStoredBits(), `BitDataView.shift_Uint8Array`);
		littleEndian = valda.boolean.assert(littleEndian, `BitDataView.shift_Uint8Array`);
		// if(this[_countBitsShifted] + bitsEach * count > this[_countBitsPushed])
		// 	throw new Error(`BitDataView.shift_UIntegers(bitsEach = ${bitsEach}, countIfArray = ${countIfArray}) not enought ${bitsEach * count} bits, only ${this.getStoredBits()} bits stored.`);
		let countBytes = Math.ceil(countBitsToShift / 8);
		let uint8Array = new Uint8Array(countBytes);
		for(let i = 0; countBitsToShift > 0; i++)
		{
			let count = countBitsToShift >= 8 ? 8 : countBitsToShift;
			let resultByteIndex = littleEndian ? countBytes - 1 - i : i;
			uint8Array[resultByteIndex] = this._shift_Uint8orLess_noAsserts(count);
			countBitsToShift -= 8;
		}
		// let uint8Array = this.shift_UIntegers(8, countElements);
		// if(littleEndian)
		// 	uint8Array.reverse();
		return uint8Array;
	}
//	shift_Uint16Array(countElements) {return this.shift_UIntegers(16, countElements);}
	///shift_Uint32Array(countElements) {return this.shift_UIntegers(32, countElements);}
	//shift_BigUint64Array(countElements) {return this.shift_UnsignedBigIntegers(64, countElements);}

	/**  pop (take from right of bitDataView) Unit8Array.
	 * @param {number} countBitsToPop - Count bytes to pop. Asserted.
	 * @param {boolean} littleEndian -
	 * @return {Uint8Array} -
	 */
	pop_Uint8Array(countBitsToPop = this.getStoredBits()/*, littleEndian = false*/)
	{
		countBitsToPop = valda.integerMinMax.assert(countBitsToPop, 0, this.getStoredBits(), `BitDataView.pop_Uint8Array`);
		//littleEndian = valda.boolean.assert(littleEndian, `BitDataView.shift_Uint8Array`);
		let countElements = Math.ceil(countBitsToPop / 8);
		let uint8Array = new Uint8Array(countElements);
		for(let i = 0; countBitsToPop > 0; i++)
		{
			let countBitsInCurrentElement = Math.min(countBitsToPop, 8);//countBitsToPop >= 8 ? 8 : countBitsToPop;
			//let resultByteIndex = littleEndian ? countElements - 1 - i : i;
			let resultByteIndex = i;
			//uint8Array[resultByteIndex] = this._pop_Uint53orLess_noAsserts(count);
			uint8Array[resultByteIndex] = this._pop_Uint8orLess_noAsserts(countBitsInCurrentElement);
			countBitsToPop -= 8;
		}
		// let uint8Array = this.shift_UIntegers(8, countElements);
		// if(littleEndian)
		// 	uint8Array.reverse();
		return uint8Array;
	}

	// /**  pop (take from right of bitDataView) Unit16Array.
	//  * @param {number} countBitsToPop - Count bytes to pop. Asserted.
	//  * @param {boolean} littleEndian -
	//  * @return {Uint16Array} -
	//  */
	// pop_Uint16Array(countBitsToPop = this.getStoredBits(), littleEndian = false)
	// {
	// 	countBitsToPop = valda.integerMinMax.assert(countBitsToPop, 0, this.getStoredBits(), `BitDataView.pop_Uint8Array`);
	// 	littleEndian = valda.boolean.assert(littleEndian, `BitDataView.shift_Uint8Array`);
	// 	let countElements = Math.ceil(countBitsToPop / 16);
	// 	let uint8Array = new Uint16Array(countBytes);
	// 	for(let i = 0; countBitsToPop > 0; i++)
	// 	{
	// 		let countBitsInCurrentInteger = Math.min(countBitsToPop, 16);//countBitsToPop >= 8 ? 8 : countBitsToPop;
	// 		let resultByteIndex = littleEndian ? countElements - 1 - i : i;
	// 		//uint8Array[resultByteIndex] = this._pop_Uint53orLess_noAsserts(count);
	// 		uint8Array[resultByteIndex] = this._pop_Uint53orLess_noAsserts(countBitsInCurrentInteger);
	// 		countBitsToPop -= 16;
	// 	}
	// 	// let uint8Array = this.shift_UIntegers(8, countElements);
	// 	// if(littleEndian)
	// 	// 	uint8Array.reverse();
	// 	return uint8Array;
	// }

	// pop_Uint16Array(countElements) {return this.pop_UIntegers(16, countElements);}
	// pop_Uint32Array(countElements) {return this.pop_UIntegers(32, countElements);}
	// pop_BigUint64Array(countElements) {return this.pop_UnsignedBigIntegers(64, countElements);}


	/**  push (add to right of bitDataView) hex string.
	 * @param hexString
	 */
	push_Hex(hexString, littleEndian = false)
	{
		let uint8Array = this.constructor.convert_hexToUint8Array(hexString, 'BitDataView.push_Hex');
		this.push_Uint8Array(uint8Array, littleEndian);
	}
	/**  unshift (add to left of bitDataView) hex string.
	 * @param hexString
	 */
	unshift_Hex(hexString, littleEndian = false)
	{
		let uint8Array = this.constructor.convert_hexToUint8Array(hexString, 'BitDataView.unshift_Hex');
		this.unshift_Uint8Array(uint8Array, littleEndian);
	}
	/**  pop (take from right of bitDataView) hex string.
	 * @param {number} countBytes - Count bytes to pop. All data if undefined. Asserted.
	 * @param {boolean} littleEndian -
	 * @return {string} - hex
	 */
	pop_Hex(countBytes= undefined, littleEndian = false)
	{
		let uint8Array = this.pop_Uint8Array(typeof countBytes === 'undefined' ? undefined : countBytes * 8, littleEndian);
		return this.constructor.convert_uint8ArrayToHex(uint8Array, 'BitDataView.pop_Hex');
	}
	/**  shift (take from left of bitDataView) hex string.
	 * @param {number} countBytes - Count bytes to shift. All data if undefined. Asserted.
	 * @param {boolean} littleEndian -
	 * @return {string} - hex
	 */
	shift_Hex(countBytes= undefined , littleEndian = false)
	{
		let uint8Array = this.shift_Uint8Array(typeof countBytes === 'undefined' ? undefined : countBytes * 8, littleEndian);
		return this.constructor.convert_uint8ArrayToHex(uint8Array, 'BitDataView.shift_Hex');
	}



	/**  push (add to right of bitDataView) DataView instance.
	 * @param {DataView} dataView
	 */
	push_DataView(dataView, littleEndian = false)
	{
		dataView = valda.instance.assert(dataView, DataView);
		//let uint8Array = new Uint8Array(dataView.buffer);
		//this.push_Uint8Array(uint8Array);
		this.push_Uint8Array(dataView.buffer);
	}
	/**  unshift (add to left of bitDataView) DataView instance.
	 * @param {DataView} dataView
	 * @param littleEndian
	 */
	unshift_DataView(dataView, littleEndian = false)
	{
		dataView = valda.instance.assert(dataView, DataView);
		this.unshift_Uint8Array(dataView.buffer, littleEndian);
	}
	/**  pop (take from right of bitDataView) DataView instance.
	 * @param {number} countBytes - Count bytes to pop. Asserted.
	 * @param littleEndian
	 * @return {DataView} - DataView instance
	 */
	pop_DataView(countBytes= undefined, littleEndian = false)
	{
		let uint8Array = this.pop_Uint8Array(typeof countBytes === 'undefined' ? undefined : countBytes * 8, littleEndian);
		return new DataView(uint8Array);
	}

	/**  shift (take from left of bitDataView) DataView instance.
	 * @param {number} countBytes - Count bytes to shift. Asserted.
	 * @param littleEndian
	 * @return {DataView} - DataView instance
	 */
	shift_DataView(countBytes= undefined, littleEndian = false)
	{
		let uint8Array = this.shift_Uint8Array(typeof countBytes === 'undefined' ? undefined : countBytes * 8, littleEndian);
		return new DataView(uint8Array.buffer);
	}



	importUint8Array(uint8Array)
	{
		this.clear();
		this.push_Uint8Array(uint8Array);
	}
	exportUnit8Array(littleEndian = false)
	{
		let countBitsToShift = this.getStoredBits();
		let countBytes = Math.ceil(countBitsToShift / 8);
		let uint8Array = new Uint8Array(countBytes);
		for(let i = 0; countBitsToShift > 0; i++)
		{
			let count = Math.min(countBitsToShift, 8);
			let resultByteIndex = littleEndian ? countBytes - 1 - i : i;
			uint8Array[resultByteIndex] = this._getAt_Uint8orLess_noAsserts(i * 8, count);
			countBitsToShift -= 8;
		}
		// for(let i = 0; countBitsToShift > 0; i++)
		// {
		// 	let count = countBitsToShift >= 8 ? 8 : countBitsToShift;
		// 	let resultByteIndex = littleEndian ? countBytes - 1 - i : i;
		// 	uint8Array[resultByteIndex] = this._shift_Uint8orLess_noAsserts(count);
		// 	countBitsToShift -= 8;
		// }
		// let uint8Array = this.shift_UIntegers(8, countElements);
		// if(littleEndian)
		// 	uint8Array.reverse();
		return uint8Array;
	}
	// exportUnit8Array(includeLastBits = true)
	// {//includeLastBits сохранять ли биты после полных байт
	// 	if(!(this[_countBitsShifted] & 7))/*optimisation for speed up if conditions complete - when data aligned in memory*/
	// 	{
	// 		let a = this[_data].slice(this[_countBitsShifted] / 8, Math.ceil(this[_countBitsPushed] / 8));
	// 		if(this[_countBitsPushed] & 7)/* remove unused waste bits in last byte */
	// 			a[a.length - 1] = a[a.length - 1] & (0xFF >> (8 - (this[_countBitsPushed] & 7)));
	// 		return a;
	// 	}
	// 	let bitCount = this.getStoredBits();
	// 	let byteCount =  Math.ceil(bitCount / 8) ;
	// 	if(!includeLastBits)
	// 	{
	// 		byteCount = Math.floor(bitCount / 8);
	// 		bitCount = byteCount * 8;
	// 	}
	//
	// 	let result = new Uint8Array(byteCount);
	// 	for(let i = 0; i < bitCount; i++)
	// 	{
	// 		if(this._getAt_Bool_noAsserts(i))
	// 			result[i >> 3] |= (1 << (i & 7));
	// 		//result[i >> 3] |= (this._getAt_Bool_noAsserts(i) ? (1 << (i & 7)) : 0);
	// 	}
	// 	return result;
	// }
	/**  fw
	 * @param hexString
	 */
	importHex(hexString)
	{
		//Buffer.from(hexString, "hex");
		let uint8Array = this.constructor.convert_hexToUint8Array(hexString);
		this.importUint8Array(uint8Array);
	}
	/**  fw
	 * @param includeLastBits
	 */
	exportHex(/*includeLastBits = true*/)
	{
		let uint8Array = this.exportUnit8Array(/*includeLastBits*/);
		return this.constructor.convert_uint8ArrayToHex(uint8Array);
	}





	setAt_Float64(bitIndexAt, value)
	{
		bitIndexAt = valda.integerMinMax.assert(bitIndexAt, 0, this.getStoredBits() - 64, `BitDataView.setAt_Float64(bitIndexAt)`);
		value = valda.number.assert(value,  `BitDataView.setAt_Float64(value)`);
		const uint8Array = new Uint8Array(8);
		const view = new DataView(uint8Array.buffer);
		view.setFloat64(0, value, this.endianness_isLittleEndian());
		this.setAt_Uint8Array_noExpandNoAsserts(bitIndexAt, uint8Array, false);
	}
	setUntil_Float64(bitIndexUntil, value)
	{
		return this.setAt_Float64(this.getStoredBits() - bitIndexUntil - 64, value);
	}
	/** push (add to right of bitDataView) Float64.
	 * @param {number} value - A signed 64-bit float number.
	 * @description IEEE Standard 754 Floating Point Numbers: sign 1 bit, exponent 11 bits, mantissa 52 bits
	 */
	push_Float64(value)
	{
		value = valda.number.assert(value, this.getStoredBits() - 64, `BitDataView.setAt_Float64(value)`);
		this.expandRightIfNeed(64);
		this[_countBitsPushed] += 64;
		this.setUntil_Float64(0, value);
	}
	/**   unshift (add to left of bitDataView) Float64.
	 * @param {number} value - A signed 64-bit float number.
	 * @description IEEE Standard 754 Floating Point Numbers: sign 1 bit, exponent 11 bits, mantissa 52 bits
	 */
	unshift_Float64(value)
	{
		value = valda.number.assert(value, this.getStoredBits() - 64, `BitDataView.unshift_Float64(value)`);
		this.expandLeftIfNeed(64);
		this[_countBitsShifted] += 64;
		this.setUntil_Float64(0, value);
	}
	/**  shift (take from left of bitDataView) Double64
	 * @description IEEE Standard 754 Floating Point Numbers: sign 1 bit, exponent 11 bits, mantissa 52 bits
	 * @return {number} - A signed 64-bit float number.
	 */
	shift_Float64()
	{
		let uint8Array = this.shift_Uint8Array(64);
		let view = new DataView(uint8Array.buffer);
		return view.getFloat64(0, this.endianness_isLittleEndian());
	}
	/**  pop (take from right of bitDataView) Double64
	 * @description IEEE Standard 754 Floating Point Numbers: sign 1 bit, exponent 11 bits, mantissa 52 bits
	 * @return {number} - A signed 64-bit float number.
	 */
	pop_Float64()
	{
		let uint8Array = this.pop_Uint8Array(64);
		let view = new DataView(uint8Array.buffer);
		return view.getFloat64(0, this.endianness_isLittleEndian());
	}



	setAt_Float32(bitIndexAt, value)
	{
		bitIndexAt = valda.integerMinMax.assert(bitIndexAt, 0, this.getStoredBits() - 32, `BitDataView.setAt_Float32(bitIndexAt)`);
		value = valda.number.assert(value,  `BitDataView.setAt_Float32(value)`);
		const uint8Array = new Uint8Array(8);
		const view = new DataView(uint8Array.buffer);
		view.setFloat32(0, value, this.endianness_isLittleEndian());
		this.setAt_Uint8Array_noExpandNoAsserts(bitIndexAt, uint8Array, false);
	}
	setUntil_Float32(bitIndexUntil, value)
	{
		return this.setAt_Float32(this.getStoredBits() - bitIndexUntil - 32, value);
	}
	/** push (add to right of bitDataView) Float32.
	 * @param {number} value - A signed 32-bit float number.
	 * @description IEEE Standard 754 Floating Point Numbers: sign 1 bit, exponent 11 bits, mantissa 52 bits
	 */
	push_Float32(value)
	{
		value = valda.number.assert(value, this.getStoredBits() - 32, `BitDataView.setAt_Float32(value)`);
		this.expandRightIfNeed(32);
		this[_countBitsPushed] += 32;
		this.setUntil_Float32(0, value);
	}
	/**   unshift (add to left of bitDataView) Float32.
	 * @param {number} value - A signed 32-bit float number.
	 * @description IEEE Standard 754 Floating Point Numbers: sign 1 bit, exponent 11 bits, mantissa 52 bits
	 */
	unshift_Float32(value)
	{
		value = valda.number.assert(value, this.getStoredBits() - 32, `BitDataView.unshift_Float32(value)`);
		this.expandLeftIfNeed(32);
		this[_countBitsShifted] += 32;
		this.setUntil_Float32(0, value);
	}


	getAt_Float32(bitIndexAt)
	{
		bitIndexAt = valda.integerMinMax.assert(bitIndexAt, 0, this.getStoredBits() - 32);
		let uint8Array = this._getAt_Uint8Array_noAssert(bitIndexAt, 32);
		let view = new DataView(uint8Array.buffer);
		return view.getFloat32(0, this.endianness_isLittleEndian());
	}

	getAt_Float64(bitIndexAt)
	{
		bitIndexAt = valda.integerMinMax.assert(bitIndexAt, 0, this.getStoredBits() - 64);
		let uint8Array = this._getAt_Uint8Array_noAssert(bitIndexAt, 64);
		let view = new DataView(uint8Array.buffer);
		return view.getFloat64(0, this.endianness_isLittleEndian());
	}


	/**  shift (take from left of bitDataView) Double32
	 * @description IEEE Standard 754 Floating Point Numbers: sign 1 bit, exponent 11 bits, mantissa 52 bits
	 * @return {number} - A signed 32-bit float number.
	 */
	shift_Float32()
	{
		let uint8Array = this.shift_Uint8Array(32);
		let view = new DataView(uint8Array.buffer);
		return view.getFloat32(0, this.endianness_isLittleEndian());
	}
	/**  pop (take from right of bitDataView) Double32
	 * @description IEEE Standard 754 Floating Point Numbers: sign 1 bit, exponent 11 bits, mantissa 52 bits
	 * @return {number} - A signed 32-bit float number.
	 */
	pop_Float32()
	{
		let uint8Array = this.pop_Uint8Array(32);
		let view = new DataView(uint8Array.buffer);
		return view.getFloat32(0, this.endianness_isLittleEndian());
	}



	//
	// /**
	//  *
	//  * en.wikipedia.org/wiki/Half-precision_floating-point_format#IEEE_754_half-precision_binary_floating-point_format:_binary16
	//  * */
	// shift_Float16( littleEndian = false)
	// {
	// 	return this.shift_Float64orLessNoAsserts(true, 5, 10, littleEndian);
	// }




	// static convertSignExponentMantissaToFloatNoAsserts(sign, exponent, mantissa)
	// {
	//
	// }

	/* Custom configurable float
	* Float	± (2 – 2^-mantissaLengthBits) × 2^bias
	* */
	/**  fw
	 * @param isSign
	 * @param exponentLengthBits
	 * @param mantissaLengthBits
	 * @description
	 * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number
	 */
	getAt_FloatCustom_noExpandNoAsserts(bitIndexAt = 0, isSign = true, exponentLengthBits = 11, mantissaLengthBits = 52)
	{
		let bbr = new BitDataView({
			automaticMemoryExpansion:0,
			bufferBaseSizeBits: 64,
		});
		let mantissaValue;
		let exponentValue;
		let signValue;
		if(this.endianness_isLittleEndian())
		{
			mantissaValue = this._getAt_Uint53orLess_noAsserts(0, mantissaLengthBits, true);
			exponentValue = this._getAt_Uint53orLess_noAsserts(mantissaLengthBits, exponentLengthBits, true);
			signValue = (isSign ? this._getAt_Bool_noAsserts(mantissaLengthBits + exponentLengthBits) : 0);
		}
		else
		{
			throw new Error(`getAt_FloatCustom_noExpandNoAsserts does not support littleEndian == false`);
			// if(!exponentValue)
			// {
			// 	if(!mantissaValue)
			// 		return 0;
			// 	return "denormalised";
			// }
			// if(exponentValue == 255)
			// {
			// 	if(mantissaValue)
			// 		return Number.NaN;
			// 	if(signValue)
			// 		return Number.NEGATIVE_INFINITY;
			// 	return Number.POSITIVE_INFINITY;
			// }
			// let bias = Math.pow(2, exponentLengthBits - 1) - 1;
			// let resultValue = (signValue ? -1 : 1)
			// 	* ((mantissaValue / Math.pow(2, mantissaLengthBits) + 1)
			// 		* Math.pow(2,exponentValue - bias));
			// return resultValue;
		}
		//console.log("mantissaValue",mantissaValue.toString(2))
		//console.log("exponentValue",exponentValue.toString(2))
		//console.log("signValue",signValue.toString(2))
		bbr._setAt_Uint53orLess_noAsserts(0, mantissaLengthBits, mantissaValue, true);
		bbr._setAt_Uint53orLess_noAsserts(52, exponentLengthBits, exponentValue, true);
		if(isSign)
			bbr._setAt_Uint53orLess_noAsserts(53,1, signValue)
		return bbr.shift_Float64(true);
	}
	/** shift (take from left of bitDataView) Float with custom size
	 * @param sign
	 * @param exponent
	 * @param mantissa
	 */
	shift_Float64orLess(sign = true, exponent = 11, mantissa = 52)
	{
		sign = valda.boolean.assert(sign, `BitDataView.shift_Float64orLess`);
		exponent = valda.integerMinMax.assert(exponent, 0, 11, `BitDataView.shift_Float64orLess`);
		mantissa = valda.integerMinMax.assert(mantissa, 0, 52, `BitDataView.shift_Float64orLess`);
		if(this.getStoredBits() < sign + exponent + mantissa)
			throw new Error(`BitDataView(${this.getStoredBits()} bits stored).shift_Float64orLess(sign = ${sign}, exponent = ${exponent}, mantissa = ${mantissa}, littleEndian = ${this.endianness_isLittleEndian()}) not enought bits to shift.`);

		return this.shift_Float64orLess_noExpandNoAsserts(sign, exponent, mantissa );
	}



	/**
	 * @param {*} - parameters. 2 - for binary output, 16 - for hex output, undefined for full output
	 * @return {string} - information aboutBitDataView
	 * */
	toString(parameters)
	{
		if(parameters == 2)
		{
			let s = "";
			for(let i = 0, n = this.getStoredBits(); i < n; i++)
				s += this._getAt_Bool_noAsserts(i);
			return this.getStoredBits()+": "+s;
		}
		if(parameters == 16)
			return this.exportHex();
		if(typeof parameters !== 'undefined')
			throw new Error(`Wrong parameters for BitDataView.toString(parameters)`);
		return `BitDataView = {countBitsShifted: ${this[_countBitsShifted]}, countBitsPushed: ${this[_countBitsPushed]}, getStoredBits: ${this.getStoredBits()}, countBitsPushLimit: ${this[_countBitsPushLimit]}. hex: "${this.exportHex()}"}`;
	}




	static convert_hexToUint8Array = (hex, errorPrefix = 'BitDataView.convert_hexToUint8Array') =>
	{
		valda.hex.assert(hex, errorPrefix);
		let a = new Uint8Array(hex.length / 2)
		for(let i = 0; i < a.length; i++)
		{
			let oneByteHex = hex.substr(i * 2, 2)
			a[i] = parseInt(oneByteHex, 16)
		}
		return a;
	}
	static convert_uint8ArrayToHex = (arr, errorPrefix = 'BitDataView.convert_uint8ArrayToHex') =>
	{
		valda.uint8Array.assert(arr, errorPrefix);
		let hex = ""
		for(let i = 0; i < arr.length; i++)
			hex += ('0' + arr[i].toString(16)).slice(-2);
		return hex;
	}
	//whyNotEquals()
	//equals()
	//getVersion()
}

const result = {
	BitDataView: BitDataView,
};
export default result;

