/**
 * @file    bitdataview.js
 * @brief   JS library for fast short easy analyse, assert, check, validate, parse data
 * @author  Dmitrii Arshinnikov <www.telemok.com@gmail.com> https://github.com/Telemok
 * @version 0.1
 * @date 2022-12-02
 *
@verbatim
			Copyright (c) 2022 telemok.com Dmitrii Arshinnikov

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

/*
* Copyright Telemok.com
*
*
* nodejs fast byte buffer: nodejs.org/api/buffer.html
* JavaScript fast byte buffer: developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/DataView
*
* BitDataView always use big-endian byte order because bit count must be divisible by 8. little-endian not support it.
* For storing little endian numbers use new DataView(); Store to dataView numbers. Use .pushDataView, .shiftDataView functions.
*
*
*
* */



//import {valda} from "https://cdn.jsdelivr.net/gh/telemok/valda@master/lib/valda.min.js"
import {valda} from "valda"
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
Count bits shifted from left.
.shift() increase it to 1.
.unshift() decrease it to 1.
_countBitsShifted can not be > _countBitsPushed
_countBitsShifted can not be < 0
*/
// const _significantBit = Symbol();
// const _SIGNIFICANT_BIT_LSB = "L";
// const _SIGNIFICANT_BIT_MSB = "M";

const _automaticMemoryExpansion = Symbol();



// const uint8Array = new Uint8Array(80);
// const view = new DataView(uint8Array.buffer);
// view.setFloat64(0, 443534534534.4534534534534566);
// view.setInt32(8, -33);
// view.setUint32(12,555);
// view.setFloat32(20, 123.456);
// XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
// FFFFFFFF000000000000000000000000000000000000000000000000000000
// FFFFFFFFIIII00000000000000000000000000000000000000000000000
// FFFFFFFFIIIIUUUU0000FFFF000000000000000000000000000000000000000000
//
//
// {latitude:44.664242342,longitude:-33333333333,altitude:3938.342}
// [44.664242342,-33333333333,3938.342]
// AAAABBBBCCCC
//
// //C++
// class Abc
// {
// 	float latitude;
// 	flaot longitude;
// 	float altitude;
// }
//
// -> arr
// Abc abc;
// memcpy(&abc, arr, 12);
//
//
// FFFFFFFFIIIIUUUU000000000005000000000000000
// FFFFFFFFIIIIUUUU000000000040000000000000000
// FFFFFFFFIIIIUUUU000030000000000000000000000
// FFFFFFFFIIIIUUUU000000000000000000000000000



/*LSB Bit Buffer*/
export class BitDataView {
	/**
	 * @constructor
	 * @param {object} parameters - base data size in bits, expandable
	 * @description
	 * automaticMemoryExpansion - false set memory static, unexpandable, fast. true allow extend memory for left and right of array
	 */
	constructor(parameters = {}) {
		this[_automaticMemoryExpansion] = valda.boolean.parse(parameters, 'automaticMemoryExpansion', () => {return true;});

		let sizeBits = valda.integerMinMax.parse(parameters, 'bufferBaseSizeBits', 0, 0xFFFFFFFE, (value) => {
			return 10;
		}, `BitDataView.constructor()`);

		// let sizeBits = 10;
		// tbr.ifExtract.integerMinMax(parameters, 'bufferBaseSizeBits', 0, 0xFFFFFFFE, (value) => {
		// 	sizeBits = value;
		// }, `BitDataView.constructor()`);

		// tbr.ifExtract.integerMinMax(parameters, 'bufferMaxSizeBits', 1, 0xFFFFFFFE, (value) => {
		// 	sizeBits = value;
		// }, `BitDataView.constructor()`);

		//this.significantBit_setLsb();
		this.clear(true, sizeBits);
	}
	_getData(){return this[_data];}
	// significantBit_setLsb() {
	// 	this[_significantBit] = _SIGNIFICANT_BIT_LSB;
	// }
	//
	// significantBit_setMsb() {
	// 	this[_significantBit] = _SIGNIFICANT_BIT_MSB;
	// }
	//
	// significantBit_set(significantBitType) {
	// 	if (significantBitType === "LSB")
	// 		this.significantBit_setLsb();
	// 	else if (significantBitType === "MSB")
	// 		this.significantBit_setMsb();
	// 	else
	// 		throw new Error(`BitDataView.setSignificantBit(wrong argument, need "LSB" (default) or "MSB")`);
	// }
	//
	// significantBit_get() {
	// 	return this[_significantBit] === _SIGNIFICANT_BIT_LSB ? "LSB" : "MSB";
	// }
	//
	// significantBit_isLsb() {
	// 	return this[_significantBit] === _SIGNIFICANT_BIT_LSB;
	// }
	//
	// significantBit_isMsb() {
	// 	return this[_significantBit] === _SIGNIFICANT_BIT_MSB;
	// }


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

	/**
	 * return bits size of stored data
	 * @description single constructor
	 */
	getStoredBits() {
		return this[_countBitsPushed] - this[_countBitsShifted];
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
		//let newArr = new Uint8Array(this[_data].length + Math.);//Увеличиваем сразу на много, чтобы часто это не делать.
		// console.log("expandBits",expandBits)
		// console.log("this[_countBitsPushLimit]",this[_countBitsPushLimit])
		// console.log("this[_data]", this[_data].length, this[_data])
		// console.log("newUint8Array", newUint8Array.length, newUint8Array)
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
	expandRightIfNeed(checkPushBits = 1, bitCountIfExpandRequired = 256 * 8) {
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
	 * @param expandBits
	 * @description after run .expandLeftIfNeed(x) you can safe do .unshift(x, ...)
	 */
	expandLeftIfNeed(checkUnshiftBits, expandBits = 256 * 8) {
		if (this[_countBitsShifted] - checkUnshiftBits < 0)
		{
			if(expandBits < checkUnshiftBits)
				expandBits = checkUnshiftBits;
			this.expandLeft(expandBits);
		}
	}



	_andBitInMemoryAddress_noAsserts(bitMemoryAddress) {
		let addressByte = bitMemoryAddress >>> 3;
		let addressBit = bitMemoryAddress & 7;
		let maskBit = 1 << addressBit;
		this[_data][addressByte] &= ~maskBit;
	}
	_orBitInMemoryAddress_noAsserts(bitMemoryAddress) {
		let addressByte = bitMemoryAddress >>> 3;
		let addressBit = bitMemoryAddress & 7;
		let maskBit = 1 << addressBit;
		this[_data][addressByte] |= maskBit;
		//this[_data][bitMemoryAddress >>> 3] |= (1 << (bitMemoryAddress & 7));
	}


	/**
	 * @description set bit in private memory position index
	 * @param {boolean} bitValue - is boolean. Used as "if(bitValue)"
	 * @param {number} bitMemoryAddress - is 32 bit unsigned integer. Not asserted for raise up work speed. Bit address of memory position, not bit index in array.
	 */
	_setBitInMemoryAddress_noAsserts(bitValue, bitMemoryAddress) {
		if(bitValue)
			this._andBitInMemoryAddress_noAsserts(bitMemoryAddress) {
		else
			this._orBitInMemoryAddress_noAsserts(itMemoryAddress) {
	
	
	/*	let addressByte = bitMemoryAddress >>> 3;
		let addressBit = bitMemoryAddress & 7;
		// if(this.significantBit_isMsb())//bespoleznaya figna, nado pered kajdim push eto delat
		// 	addressBit = 7 - addressBit;
		let maskBit = 1 << addressBit;

		if (bitValue)
			this[_data][addressByte] |= maskBit;
		else
			this[_data][addressByte] &= ~maskBit;*/
		// this[_data][addressByte] ^= (-bitValue ^ this[_data][addressByte]) & maskBit;
		// w = (w & ~maskBit) | (-f & maskBit);/* OR, for superscalar CPUs: */
		/* http://graphics.stanford.edu/~seander/bithacks.html#ConditionalSetOrClearBitsWithoutBranching */
	}
	/**
	 * @description set bit by virtual index at begin of bitDataView.
	 * @param {boolean} bitValue - is boolean. Used as "if(bitValue)"
	 * @param {number} bitIndexFromBegin - is 32 bit unsigned integer. Not asserted for raise up work speed. Bit address of memory position, not bit index in array.
	 */
	_setAt_Bool_noAsserts(bitValue, bitIndexFromBegin) {
		this._setBitInMemoryAddress_noAsserts(bitValue, this[_countBitsShifted] + bitIndexFromBegin);
	}
	/** set bit by virtual index at begin of bitDataView.
	 * @param {boolean} bitValue - is boolean. Used as "if(bitValue)". Asserted.
	 * @param {number} bitIndexFromBegin - is 32 bit unsigned integer. Bit address of memory position, not bit index in array.
	 * @description
	 */
	setAt_Bool(bitValue, bitIndexFromBegin) {
		bitValue = valda.boolean.assert(bitValue, `BitDataView.setAt_Bool(wrong bitValue)`);
		bitIndexFromBegin = valda.integerMinMax.assert(bitIndexFromBegin, 0, this.getStoredBits() - 1);
		this._setAt_Bool_noAsserts(bitValue, bitIndexFromBegin);
	}
	/**
	 * set bit by virtual index at begin of bitDataView.
	 * @param {boolean} bitValue - Used as "if(bitValue)"
	 * @param {number} bitIndexUntilEnd - is 32 bit unsigned integer. Not asserted for raise up work speed. Bit address of memory position, not bit index in array.
	 * @description
	 */
	_setUntil_Bool_noAsserts(bitValue, bitIndexUntilEnd) {
		this._setBitInMemoryAddress_noAsserts(bitValue, this[_countBitsPushed] - 1 - bitIndexUntilEnd);
	}
	/** set bit by virtual index until end of bitDataView.
	 * @param {boolean} bitValue - Used as "if(bitValue)". Asserted.
	 * @param {number} bitIndexUntilEnd - is 32 bit unsigned integer. Bit address of memory position, not bit index in array. 0 = (last bit index), 1 = (last bit index - 1). Asserted.
	 * @description
	 */
	setUntil_Bool(bitValue, bitIndexUntilEnd) {
		bitValue = valda.boolean.assert(bitValue, `BitDataView.setUntil_Bool(wrong bitValue)`);
		bitIndexUntilEnd = valda.integerMinMax.assert(bitIndexUntilEnd, 0, this.getStoredBits() - 1, `BitDataView.setUntil_Bool(wrong FromEnd)`);
		this._setUntil_Bool_noAsserts(bitValue, bitIndexUntilEnd);
	}







	_getAt_BoolMemoryAddress_noAsserts(bitMemoryAddress) {
		let addressByte = bitMemoryAddress >>> 3;
		let addressBit = bitMemoryAddress & 7;
		let myByte = this[_data][addressByte];
		//console.error("_getAt_BoolMemoryAddress_noAsserts",addressByte, addressBit, (myByte >>> addressBit) & 1)
		return (myByte >>> addressBit) & 1;
	}
	/** get bit by virtual index at begin of bitDataView.
	 * @param {number} bitIndexFromBegin - is 32 bit unsigned integer. Bit address of memory position, not bit index in array.
	 * @return {number} - return 0 or 1 bit value.
	 * @description
	 */
	_getAt_Bool_noAsserts(bitIndexFromBegin) {
		return this._getAt_BoolMemoryAddress_noAsserts(this[_countBitsShifted] + bitIndexFromBegin);
	}
	/** get bit by virtual index at begin of bitDataView.
	 * @param {number} bitIndexFromBegin - is 32 bit unsigned integer. Bit address of memory position, not bit index in array.
	 * @return {number} - return 0 or 1 bit value.
	 * @description
	 */
	getAt_Bool(bitIndexFromBegin) {
		valda.integerMinMax.assert(bitIndexFromBegin, 0, this.getStoredBits() - 1, `BitDataView.getAt_Bool(bitIndex: ${bitIndexFromBegin}, bitSize: ${this.getStoredBits()})`);
		return this._getAt_Bool_noAsserts(bitIndexFromBegin);
	}
	/** get bit by virtual index at begin of bitDataView.
	 * @param {number} bitIndexFromEnd - is 32 bit unsigned integer. Bit address of memory position, not bit index in array.
	 * @return {number} - return 0 or 1 bit value.
	 * @description
	 */
	_getUntil_Bool_noAsserts(bitIndexFromEnd) {
		return this._getAt_BoolMemoryAddress_noAsserts(this[_countBitsPushed] - 1 - bitIndexFromEnd);
	}
	/** get bit by virtual index until end of bitDataView.
	 * @param {number} bitIndexFromEnd - is 32 bit unsigned integer. Bit address of memory position, not bit index in array.
	 * @return {number} - return 0 or 1 bit value.
	 * @description
	 */
	getUntil_Bool(bitIndexFromEnd) {
		valda.integerMinMax.assert(bitIndexFromEnd, 0, this.getStoredBits() - 1, `BitDataView.getAt_Bool(bitIndex: ${bitIndexFromEnd}, bitSize: ${this.getStoredBits()})`);
		return this._getUntil_Bool_noAsserts(bitIndexFromEnd);
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
	push_Bools(bitValue, count = 1) {
		bitValue = valda.boolean.assert(bitValue, `BitDataView.push_Bools`);
		count = valda.integerMinMax.assert(count, 0, this.getAvailableBitsToPush(),`BitDataView.push_Bools`);
		this.expandRightIfNeed(count);
		for(; count; count--)
			this._push_Bool_noExpandNoAsserts(bitValue);
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
	 * @param {boolean} bitValue - 0/1 true/false value to add to right side of bitDataView
	 * @description - sork slower
	 */
	unshift_Bools(bitValue, count = 1) {
		bitValue = valda.boolean.assert(bitValue, `BitDataView.unshift_Bools`);
		count = valda.integerMinMax.assert(count, 0, this.getAvailableBitsToUnshift(),`BitDataView.unshift_Bools`);
		this.expandLeftIfNeed(count);
		for(; count; count--)
			this._unshift_Bool_noExpandNoAsserts(bitValue);
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
	pop_Bool() {
		if (this.getStoredBits() < 1)
			throw new Error(`BitDataView.pop_Bool() error because no data available in buffer`);
		return this._pop_Bool_noAsserts();
	}
	_shift_Bool_noAsserts() {
		return this._getAt_BoolMemoryAddress_noAsserts(this[_countBitsShifted]++);
	}
	/** shift (take from left of bitDataView) 1 bit.
	 * @description - swork slower.
	 * @returns {number} - 0 or 1 readed bit
	 */
	shift_Bool() {
		if (this.getStoredBits() < 1)
			throw new Error(`BitDataView.shift_Bool() error because no data available in buffer`);
		return this._shift_Bool_noAsserts();
	}






	/** set (set to custom plase of bitDataView) unsigned integer.
	 * @param {number} bitIndexAt - Bit index from begin of bitDataView. Not asserted.
	 * @param {number} countBitsToSet - Count bits from 0 to 8 of value to get. Not asserted.
	 * @return {number} byteData - byteData
	 */
	_setAt_Uint8orLess_noAsserts(bitIndexAt = 0, countBitsToSet = 8, byteData)//countBitsToPop >0 <8
	{
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
	push_Uint8orLess(countBitsPushed, value) {
		countBitsPushed = valda.integerMinMax.assert(countBitsPushed, 0, 8, `BitDataView.push_Uint8orLess(countBitsPushed)`);
		value = valda.integerMinMax.assert(value, 0, 0xFF, `BitDataView.push_Uint8orLess(value)`);
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
	unshift_Uint8orLess(countBitsToUnshift, value) {
		countBitsToUnshift = valda.integerMinMax.assert(countBitsToUnshift, 0, 8, `BitDataView.unshift_Uint8orLess(countBitsPushed)`);
		value = valda.integerMinMax.assert(value, 0, 0xFF, `BitDataView.unshift_Uint8orLess(value)`);
		this._unshift_Uint8orLess_noExpandNoAsserts(countBitsToUnshift, value);
	}

	/** get (take from custom plase of bitDataView) unsigned integer.
	 * @param {number} bitIndex - Bit index from begin of bitDataView. Not asserted.
	 * @param {number} countBitsToGet - Count bits from 0 to 8 of value to get. Not asserted.
	 * @return {number} - byteData
	 */
	_getAt_Uint8orLess_noAsserts(bitIndexAt = 0, countBitsToGet = 8)//countBitsToPop >0 <8
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
	pop_Uint8orLess(countBitsToPop = 8)//countBitsToPop >0 <8
	{
		countBitsToPop = valda.integerMinMax.assert(countBitsToPop, 0, Math.min(8, this.getStoredBits()), `BitDataView.pop_Uint8orLess(countBitsToPop)`);
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
	shift_Uint8orLess(countBitsToShift = 8)//countBitsToPop >0 <8
	{
		countBitsToShift = valda.integerMinMax.assert(countBitsToShift, 0, Math.min(8, this.getStoredBits()), `BitDataView.shift_Uint8orLess(countBitsToShift)`);
		return this._shift_Uint8orLess_noAsserts(countBitsToShift);
	}








	/** get (take from custom plase of bitDataView) unsigned integer.
	 * @param {number} bitIndex - Bit index from begin of bitDataView. Not asserted.
	 * @param {number} countBitsToSet - Count bits from 0 to 53 of value to get. Not asserted.
	 * @return {number} - value
	 */
	_setAt_Uint53orLess_noAsserts(bitIndexAt = 0, countBitsToSet = 53, value,  littleEndian = false)
	{
		//console.log("_setAt_Uint53orLess_noAsserts",this[_countBitsShifted],this[_countBitsPushed],"bitIndexAt="+bitIndexAt,"cntBits="+countBitsToSet,"val="+value.toString(16));
		if(littleEndian)//littleEndian = true in C++ TelemokBitDataView
		{
			for(; countBitsToSet > 0;)//TO DO del countBitsToSet, use bitIndexAt in for
			{
				let countBitsPushToByte = Math.min(countBitsToSet, 8);
				this._setAt_Uint8orLess_noAsserts(bitIndexAt ,countBitsPushToByte, value);
				//this._push_Uint8orLess_noExpandNoAsserts(countBitsPushToByte, value);
				value = Math.floor(value / 0x100); /* "value = (value >> 8) & 0xFF;" work only for first 32 bits */
				//let byteData = this._pop_Uint8orLess_noAsserts(Math.min(countBitsToPop, 8));
				//let byteData = value & 0xFF;
				countBitsToSet -= 8;
				bitIndexAt += 8;
				//result *= 0x100; /* Don't use "result <<= 8;" because it work for first 32 bits */
				//result += byteData; /* Don't use "result |= byteData;" because it work for first 32 bits */
			}
		}
		else
		{/*there is no definition how to be.
			number 01234567 89abc
			number cba98 76543210 #bits

			7_ littleEndian
			6_
			5_
			4c
			3b
			2a
			19
			08
			[76543210][___cba98] littleEndian
			[cba98765][43210___] littleEndian
			[cba98765][43210___] bigEndian A


			[__cba987][6543210_] littleEndian
			[__765432][10cba98_] bigEndian A?
			[__654321][0cba9876_] bigEndian B?
			[__012345][6789abc_]
			[________][________]
		*/
			for(let index = 0; countBitsToSet > 0; index += 8)
			{
				let subBitsCount = Math.min(countBitsToSet, 8);
				this._setAt_Uint8orLess_noAsserts(bitIndexAt + countBitsToSet - subBitsCount, subBitsCount, value);
				value = Math.floor(value / 0x100); /* "value = (value >> 8) & 0xFF;" work only for first 32 bits */
				countBitsToSet -= 8;
			}
		}
	}
	
	/**  unshift (add to left of bitDataView) unsigned integer.
	 * @param {number} countBitsToUnshift - Count bits from 0 to 53 of value to push. Not asserted.
	 * @param {number} value - unsigned integer number to unshift. From 0 to 1FFFFFFFFFFFFF (2 ^ 53 - 1). Not asserted.
	 * @param {boolean} littleEndian -
	 */
	_unshift_Uint53orLess_noExpandNoAsserts(countBitsToUnshift, value, littleEndian = false) {
		this[_countBitsShifted] -= countBitsToUnshift;
		this._setAt_Uint53orLess_noAsserts(0, countBitsToUnshift, value, littleEndian);
	}
	
	
	/** set (set to custom plase of bitDataView) unsigned integer.
	 * @param {number} bitIndexAt - Bit index from begin of bitDataView.
	 * @param {number} countBitsToSet - Count bits from 0 to 8 of value to get.
	 * @return {number} value - value
	 */
	setAt_Uint8orLess(bitIndexAt = 0, countBitsToSet = 8, value){
		countBitsToSet = valda.integerMinMax.assert(countBitsToSet, 0, 8, `BitDataView.setAt_Uint8orLess(countBitsToSet)`);
		bitIndexAt = valda.integerMinMax.assert(bitIndexAt, 0, this.getStoredBits() - countBitsToSet, `BitDataView.setAt_Uint8orLess(bitIndexAt)`);
		value = valda.integerMinMax.assert(value, 0, (1 << countBitsToSet) - 1, `BitDataView.setAt_Uint8orLess(value)`);
		this._setAt_Uint8orLess_noAsserts(bitIndexAt, countBitsToSet, value);
	}
	
	/**  set unsigned integer at.
	 * @param {bitIndexAt} bitIndexAt -  Bit index from begin of bitDataView.
	 * @param {number} countBitsToUnshift - Count bits from 0 to 53 of value to push. Asserted.
	 * @param {number} value - unsigned integer number to unshift. From 0 to 1FFFFFFFFFFFFF (2 ^ 53 - 1). Asserted.
	 * @param {boolean} littleEndian -
	 */
	setAt_Uint53orLess(bitIndexAt, countBitsToSet, value, littleEndian = false) {
		countBitsToSet = valda.integerMinMax.assert(countBitsToSet, 0, 53, `BitDataView.setAt_Uint53orLess(countBitsToSet)`);
		bitIndexAt = valda.integerMinMax.assert(bitIndexAt, 0, this.getStoredBits() - countBitsToSet, `BitDataView.setAt_Uint53orLess(bitIndexAt)`);
		value = valda.integerMinMax.assert(value, 0, Math.pow(2, countBitsToSet) - 1, `BitDataView.setAt_Uint53orLess(value)`);
		littleEndian = valda.boolean.assert(littleEndian, `BitDataView.setAt_Uint53orLess(littleEndian)`);
		this._setAt_Uint53orLess_noAsserts(bitIndexAt, countBitsToSet, value,  littleEndian);
	}
	
	
	
	
	
	
	
	
	
	_setUntil_Uint53orLess_noAsserts(bitIndexUntil = 0, countBitsToSet = 53, value,  littleEndian = false)
	{
		return this._setAt_Uint53orLess_noAsserts(this.getStoredBits() - bitIndexUntil - countBitsToSet, countBitsToSet, value, littleEndian);
	}

	/**  push (add to right of bitDataView) unsigned integer.
	 * @param {number} countBitsToPush - Count bits from 0 to 52 of value to push. Not asserted.
	 * @param {number} value - unsigned integer number to push. From 0 to 1FFFFFFFFFFFFF (2 ^ 53 - 1). Not asserted.
	 * @param {boolean} littleEndian -
	 * @description
	 */
	_push_Uint53orLess_noExpandNoAsserts(countBitsToPush, value, littleEndian = false) {
		this[_countBitsPushed] += countBitsToPush;
		this._setUntil_Uint53orLess_noAsserts(0, countBitsToPush, value, littleEndian);
	}
	/**  push (add to right of bitDataView) unsigned integer.
	 * @param {number} countBitsToPush - Count bits from 0 to 52 of value to push. Asserted.
	 * @param {number} value - unsigned integer number to push. From 0 to 1FFFFFFFFFFFFF (2 ^ 53 - 1). Asserted.
	 * @param {boolean} littleEndian -
	 * @description
	 */
	push_Uint53orLess(countBitsToPush, value, littleEndian = false) {
		countBitsToPush = valda.integerMinMax.assert(countBitsToPush, 0, 53, `BitDataView.push_Uint53orLess`);
		value = valda.integerMinMax.assert(value, 0, Number.MAX_SAFE_INTEGER, `BitDataView.push_Uint53orLess`);
		littleEndian = valda.boolean.assert(littleEndian, `BitDataView.push_Uint53orLess`);
		this.expandRightIfNeed(countBitsToPush);
		this._push_Uint53orLess_noExpandNoAsserts( countBitsToPush, value, littleEndian);
	}
	/**  unshift (add to left of bitDataView) unsigned integer.
	 * @param {number} countBitsToUnshift - Count bits from 0 to 53 of value to push. Not asserted.
	 * @param {number} value - unsigned integer number to unshift. From 0 to 1FFFFFFFFFFFFF (2 ^ 53 - 1). Not asserted.
	 * @param {boolean} littleEndian -
	 */
	_unshift_Uint53orLess_noExpandNoAsserts(countBitsToUnshift, value, littleEndian = false) {
		this[_countBitsShifted] -= countBitsToUnshift;
		this._setAt_Uint53orLess_noAsserts(0, countBitsToUnshift, value, littleEndian);
	}
	/**  unshift (add to left of bitDataView) unsigned integer.
	 * @param {number} countBitsToUnshift - Count bits from 0 to 53 of value to push. Asserted.
	 * @param {number} value - unsigned integer number to unshift. From 0 to 1FFFFFFFFFFFFF (2 ^ 53 - 1). Asserted.
	 * @param {boolean} littleEndian -
	 */
	unshift_Uint53orLess(countBitsToUnshift, value, littleEndian = false) {
		countBitsToUnshift = valda.integerMinMax.assert(countBitsToUnshift, 0, 53, `BitDataView.unshift_Uint53orLess`);
		value = valda.integerMinMax.assert(value, 0, Number.MAX_SAFE_INTEGER, `BitDataView.unshift_Uint53orLess`);
		littleEndian = valda.boolean.assert(littleEndian, `BitDataView.unshift_Uint53orLess`);
		this.expandLeftIfNeed(countBitsToUnshift);
		this._unshift_Uint53orLess_noExpandNoAsserts(countBitsToUnshift, value, littleEndian);
	}

	/** get (take from custom plase of bitDataView) unsigned integer.
	 * @param {number} bitIndex - Bit index from begin of bitDataView. Not asserted.
	 * @param {number} countBitsToGet - Count bits from 0 to 53 of value to get. Not asserted.
	 * @return {number} - value
	 */
	_getAt_Uint53orLess_noAsserts(bitIndexAt = 0, countBitsToGet = 53, littleEndian = false)
	{
		let s = `_getAt_Uint53orLess_noAsserts(${bitIndexAt}, ${countBitsToGet}, ${littleEndian}) =`;

		let result = 0;
		if(littleEndian)/* littleEndian is reverse for shift and pop */
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
	_getUntil_Uint53orLess_noAsserts(bitIndexUntil = 0, countBitsToGet = 53, littleEndian = false)
	{
		return this._getAt_Uint53orLess_noAsserts(this.getStoredBits() - bitIndexUntil - countBitsToGet, countBitsToGet, littleEndian);
	}

	_pop_Uint53orLess_noAsserts(countBitsToPop, littleEndian = false)
	{
		let result = this._getUntil_Uint53orLess_noAsserts(0, countBitsToPop, littleEndian);
		this[_countBitsPushed] -= countBitsToPop;
		return result;
	}
	pop_Uint53orLess(countBitsToPop, littleEndian = false)
	{
		countBitsToPop = valda.integerMinMax.assert(countBitsToPop, 0, Math.min(this.getStoredBits(), 53), `BitDataView.pop_Uint53orLess(countBitsToPop)`);
		return this._pop_Uint53orLess_noAsserts(countBitsToPop, littleEndian);
	}
	_shift_Uint53orLess_noAsserts(countBitsToShift, littleEndian = false)
	{
		let result = this._getAt_Uint53orLess_noAsserts(0, countBitsToShift, littleEndian);
		this[_countBitsShifted] += countBitsToShift;
		return result;
	}
	shift_Uint53orLess(countBitsToShift, littleEndian = false)
	{
		countBitsToShift = valda.integerMinMax.assert(countBitsToShift, 0, Math.min(this.getStoredBits(), 53), `BitDataView.shift_Uint53orLess`);
		return this._shift_Uint53orLess_noAsserts(countBitsToShift, littleEndian);
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
	//  * @description can be used with default JavaScript numbers: push_BigUint64orLess(BigInt(9876543210));
	//  */
	// push_BigUint64orLess(countBitsPushed, value) {
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
	 * @param {boolean} littleEndian -
	 */
	_setAt_BigUint64orLess_noAsserts(bitIndexAt = 0, countBitsToSet = 64, value,  littleEndian = false)
	{
		if(littleEndian)//littleEndian = true in C++ TelemokBitDataView
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
				this._setAt_Uint8orLess_noAsserts(countBitsToSet - subBitsCount, subBitsCount, Number(value & 0xFFn));
				value >>= 8n;
				countBitsToSet -= 8;
			}
		}
	}
	_setUntil_BigUint64orLess_noAsserts(bitIndexUntil = 0, countBitsToSet = 64, value,  littleEndian = false)
	{
		return this._setAt_BigUint64orLess_noAsserts(this.getStoredBits() - bitIndexUntil - countBitsToSet, countBitsToSet, value, littleEndian);
	}
	/**  push (add to right of bitDataView) unsigned BigInt.
	 * @param {number} countBitsToPush - Count bits from 0 to 64 of value to push. Not asserted.
	 * @param {number} value - unsigned integer number to push. From 0 to 1FFFFFFFFFFFFF (2 ^ 64 - 1). Not asserted.
	 * @param {boolean} littleEndian -
	 * @description
	 */
	_push_BigUint64orLess_noExpandNoAsserts(countBitsToPush, value, littleEndian = false) {
		this[_countBitsPushed] += countBitsToPush;
		this._setUntil_BigUint64orLess_noAsserts(0, countBitsToPush, value, littleEndian);
	}
	/**  push (add to right of bitDataView) unsigned BigInt.
	 * @param {number} countBitsToPush - Count bits from 0 to 52 of value to push. Asserted.
	 * @param {number} value - unsigned integer number to push. From 0 to 1FFFFFFFFFFFFF (2 ^ 64 - 1). Asserted.
	 * @param {boolean} littleEndian -
	 * @description
	 */
	push_BigUint64orLess(countBitsToPush, value, littleEndian = false) {
		countBitsToPush = valda.integerMinMax.assert(countBitsToPush, 0, 64, `BitDataView.push_BigUint64orLess`);
		if(typeof value !== 'bigint')
			throw new Error(`BitDataView.push_BigUint64orLess(typeof value is "${typeof value}", instead of "bigint")`);
		littleEndian = valda.boolean.assert(littleEndian, `BitDataView.push_BigUint64orLess`);
		this.expandRightIfNeed(countBitsToPush);
		this._push_BigUint64orLess_noExpandNoAsserts( countBitsToPush, value, littleEndian);
	}
	/**  unshift (add to left of bitDataView) unsigned integer.
	 * @param {number} countBitsToUnshift - Count bits from 0 to 64 of value to push. Not asserted.
	 * @param {number} value - unsigned integer number to unshift. From 0 to 1FFFFFFFFFFFFF (2 ^ 64 - 1). Not asserted.
	 * @param {boolean} littleEndian -
	 */
	_unshift_BigUint64orLess_noExpandNoAsserts(countBitsToUnshift, value, littleEndian = false) {
		this[_countBitsShifted] -= countBitsToUnshift;
		this._setAt_BigUint64orLess_noAsserts(0, countBitsToUnshift, value, littleEndian);
	}
	/**  unshift (add to left of bitDataView) unsigned integer.
	 * @param {number} countBitsToUnshift - Count bits from 0 to 64 of value to push. Asserted.
	 * @param {number} value - unsigned integer number to unshift. From 0 to 1FFFFFFFFFFFFF (2 ^ 64 - 1). Asserted.
	 * @param {boolean} littleEndian -
	 */
	unshift_BigUint64orLess(countBitsToUnshift, value, littleEndian = false) {
		countBitsToUnshift = valda.integerMinMax.assert(countBitsToUnshift, 0, 64, `BitDataView.unshift_BigUint64orLess`);
		if(typeof value !== 'bigint')
			throw new Error(`BitDataView.unshift_BigUint64orLess(typeof value is "${typeof value}", instead of "bigint")`);
		littleEndian = valda.boolean.assert(littleEndian, `BitDataView.unshift_BigUint64orLess`);
		this.expandLeftIfNeed(countBitsToUnshift);
		this._unshift_BigUint64orLess_noExpandNoAsserts(countBitsToUnshift, value, littleEndian);
	}












	// /**  unshift (add to left of bitDataView) unsigned integer.
	//  * @param {number} countBitsToUnshift - Count bits from 0 to 32 of value to push. Asserted.
	//  * @param {number} value - unsigned integer number to unshift. From 0 to 0xFFFFFFFF (2 ^ 32 - 1). Asserted.
	//  */
	// unshift_UIntegerLessOr32Bits_noExpandNoAsserts(countBitsToUnshift, value) {
	// 	for (let i = countBitsToUnshift - 1; i >= 0; i--)
	// 		this.unshift_Bool((value >> i) & 1);
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
	// 	// 	this.unshift_Bool((value >> i) & 1);
	// 	for (let mask = 1 << (countBitsToUnshift - 1); mask; mask >>= 1)
	// 		this.unshift_Bool(value & mask);
	// }

	// /**  unshift (add to left of bitDataView) unsigned integer.
	//  * @param {number} countBitsToUnshift - Count bits from 0 to 64 of value to push. Asserted.
	//  * @param {BigInt} value - unsigned integer number to unshift. From 0 to 0xFFFFFFFFFFFFFFFF (2 ^ 64 - 1). Asserted.
	//  */
	// unshift_BigUint64orLess(countBitsToUnshift, value) {
	// 	countBitsToUnshift = valda.integerMinMax.assert(countBitsToUnshift, 0, 64, `BitDataView.unshift_BigUint64orLess`);
	// 	if(typeof value !== 'bigint')
	// 		throw new Error(`BitDataView.unshift_BigUint64orLess(typeof value is "${typeof value}", instead of "bigint")`);
	// 	this.expandLeftIfNeed(countBitsToUnshift);
	// 	for (let i = BigInt(countBitsToUnshift) - 1n; i >= 0n; i--)
	// 		this.unshift_Bool(((value >> i) & 1n) != 0n);
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





	setAt_Float64(bitIndexAt = 0, value,  littleEndian = false)
	{
		bitIndexAt = valda.integerMinMax.assert(bitIndexAt, 0, this.getStoredBits() - 64, `BitDataView.setAt_Float64(bitIndexAt)`);
		value = valda.number.assert(value,  `BitDataView.setAt_Float64(value)`);
		littleEndian = valda.boolean.assert(littleEndian, `BitDataView.setAt_Float64(littleEndian)`);
		const uint8Array = new Uint8Array(8);
		const view = new DataView(uint8Array.buffer);
		view.setFloat64(0, value, littleEndian);
		this.setAt_Uint8Array_noExpandNoAsserts(bitIndexAt, uint8Array, false);
	}
	setUntil_Float64(bitIndexUntil = 0, value,  littleEndian = false)
	{
		return this.setAt_Float64(this.getStoredBits() - bitIndexUntil - 64, value, littleEndian);
	}
	/** push (add to right of bitDataView) Float64.
	 * @param {number} value - A signed 64-bit float number.
	 * @param {boolean} littleEndian -
	 * @description IEEE Standard 754 Floating Point Numbers: sign 1 bit, exponent 11 bits, mantissa 52 bits
	 */
	push_Float64(value, littleEndian = false)
	{
		value = valda.number.assert(value, this.getStoredBits() - 64, `BitDataView.setAt_Float64(value)`);
		littleEndian = valda.boolean.assert(littleEndian, `BitDataView.setAt_Float64(littleEndian)`);
		this.expandRightIfNeed(64);
		this[_countBitsPushed] += 64;
		this.setUntil_Float64(0, value, littleEndian);
	}
	/**   unshift (add to left of bitDataView) Float64.
	 * @param {number} value - A signed 64-bit float number.
	 * @param {boolean} littleEndian -
	 * @description IEEE Standard 754 Floating Point Numbers: sign 1 bit, exponent 11 bits, mantissa 52 bits
	 */
	unshift_Float64(value, littleEndian = false)
	{
		value = valda.number.assert(value, this.getStoredBits() - 64, `BitDataView.unshift_Float64(value)`);
		littleEndian = valda.boolean.assert(littleEndian, `BitDataView.unshift_Float64(littleEndian)`);
		this.expandLeftIfNeed(64);
		this[_countBitsShifted] += 64;
		this.setUntil_Float64(0, value, littleEndian);
	}
	/**  shift (take from left of bitDataView) Double64
	 * @param {boolean} littleEndian -
	 * @description IEEE Standard 754 Floating Point Numbers: sign 1 bit, exponent 11 bits, mantissa 52 bits
	 * @return {number} - A signed 64-bit float number.
	 */
	shift_Float64(littleEndian = false)
	{
		littleEndian = valda.boolean.assert(littleEndian, `BitDataView.shift_Float64(littleEndian)`);
		let uint8Array = this.shift_Uint8Array(64);
		let view = new DataView(uint8Array.buffer);
		return view.getFloat64(0, littleEndian);
	}
	/**  pop (take from right of bitDataView) Double64
	 * @param {boolean} littleEndian -
	 * @description IEEE Standard 754 Floating Point Numbers: sign 1 bit, exponent 11 bits, mantissa 52 bits
	 * @return {number} - A signed 64-bit float number.
	 */
	pop_Float64(littleEndian = false)
	{
		littleEndian = valda.boolean.assert(littleEndian, `BitDataView.pop_Float64(littleEndian)`);
		let uint8Array = this.pop_Uint8Array(64);
		let view = new DataView(uint8Array.buffer);
		return view.getFloat64(0, littleEndian);
	}



	setAt_Float32(bitIndexAt = 0, value,  littleEndian = false)
	{
		bitIndexAt = valda.integerMinMax.assert(bitIndexAt, 0, this.getStoredBits() - 32, `BitDataView.setAt_Float32(bitIndexAt)`);
		value = valda.number.assert(value,  `BitDataView.setAt_Float32(value)`);
		littleEndian = valda.boolean.assert(littleEndian, `BitDataView.setAt_Float32(littleEndian)`);
		const uint8Array = new Uint8Array(8);
		const view = new DataView(uint8Array.buffer);
		view.setFloat32(0, value, littleEndian);
		this.setAt_Uint8Array_noExpandNoAsserts(bitIndexAt, uint8Array, false);
	}
	setUntil_Float32(bitIndexUntil = 0, value,  littleEndian = false)
	{
		return this.setAt_Float32(this.getStoredBits() - bitIndexUntil - 32, value, littleEndian);
	}
	/** push (add to right of bitDataView) Float32.
	 * @param {number} value - A signed 32-bit float number.
	 * @param {boolean} littleEndian -
	 * @description IEEE Standard 754 Floating Point Numbers: sign 1 bit, exponent 11 bits, mantissa 52 bits
	 */
	push_Float32(value, littleEndian = false)
	{
		value = valda.number.assert(value, this.getStoredBits() - 32, `BitDataView.setAt_Float32(value)`);
		littleEndian = valda.boolean.assert(littleEndian, `BitDataView.setAt_Float32(littleEndian)`);
		this.expandRightIfNeed(32);
		this[_countBitsPushed] += 32;
		this.setUntil_Float32(0, value, littleEndian);
	}
	/**   unshift (add to left of bitDataView) Float32.
	 * @param {number} value - A signed 32-bit float number.
	 * @param {boolean} littleEndian -
	 * @description IEEE Standard 754 Floating Point Numbers: sign 1 bit, exponent 11 bits, mantissa 52 bits
	 */
	unshift_Float32(value, littleEndian = false)
	{
		value = valda.number.assert(value, this.getStoredBits() - 32, `BitDataView.unshift_Float32(value)`);
		littleEndian = valda.boolean.assert(littleEndian, `BitDataView.unshift_Float32(littleEndian)`);
		this.expandLeftIfNeed(32);
		this[_countBitsShifted] += 32;
		this.setUntil_Float32(0, value, littleEndian);
	}
	/**  shift (take from left of bitDataView) Double32
	 * @param {boolean} littleEndian -
	 * @description IEEE Standard 754 Floating Point Numbers: sign 1 bit, exponent 11 bits, mantissa 52 bits
	 * @return {number} - A signed 32-bit float number.
	 */
	shift_Float32(littleEndian = false)
	{
		littleEndian = valda.boolean.assert(littleEndian, `BitDataView.shift_Float32(littleEndian)`);
		let uint8Array = this.shift_Uint8Array(32);
		let view = new DataView(uint8Array.buffer);
		return view.getFloat32(0, littleEndian);
	}
	/**  pop (take from right of bitDataView) Double32
	 * @param {boolean} littleEndian -
	 * @description IEEE Standard 754 Floating Point Numbers: sign 1 bit, exponent 11 bits, mantissa 52 bits
	 * @return {number} - A signed 32-bit float number.
	 */
	pop_Float32(littleEndian = false)
	{
		littleEndian = valda.boolean.assert(littleEndian, `BitDataView.pop_Float32(littleEndian)`);
		let uint8Array = this.pop_Uint8Array(32);
		let view = new DataView(uint8Array.buffer);
		return view.getFloat32(0, littleEndian);
	}



	//
	// /**
	//  *
	//  * en.wikipedia.org/wiki/Half-precision_floating-point_format#IEEE_754_half-precision_binary_floating-point_format:_binary16
	//  * */
	// shift_Float16( littleEndian = false)
	// {
	// 	return this.shift_FloatCustomNoAsserts(true, 5, 10, littleEndian);
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
	 * @param littleEndian
	 * @description
	 * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number
	 */
	getAt_FloatCustom_noExpandNoAsserts(bitIndexAt = 0, isSign = true, exponentLengthBits = 11, mantissaLengthBits = 52, littleEndian = false)
	{
		let bbr = new BitDataView({
			automaticMemoryExpansion:0,
			bufferBaseSizeBits: 64,
		});
		let mantissaValue;
		let exponentValue;
		let signValue;
		if(littleEndian)
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
	 * @param littleEndian
	 */
	shift_FloatCustom(sign = true, exponent = 11, mantissa = 52, littleEndian = false)
	{
		sign = valda.boolean.assert(sign, `BitDataView.shift_FloatCustom`);
		exponent = valda.integerMinMax.assert(exponent, 0, 11, `BitDataView.shift_FloatCustom`);
		mantissa = valda.integerMinMax.assert(mantissa, 0, 52, `BitDataView.shift_FloatCustom`);
		littleEndian = valda.boolean.assert(littleEndian, `BitDataView.shift_FloatCustom`);
		if(this.getStoredBits() < sign + exponent + mantissa)
			throw new Error(`BitDataView(${this.getStoredBits()} bits stored).shift_FloatCustom(sign = ${sign}, exponent = ${exponent}, mantissa = ${mantissa}, littleEndian = ${littleEndian}) not enought bits to shift.`);

		return this.shift_FloatCustom_noExpandNoAsserts(sign, exponent, mantissa, littleEndian );
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

