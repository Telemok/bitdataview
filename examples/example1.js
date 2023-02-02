import {BitDataView} from "./../lib/bitdataview.js"
//import { BitDataView } from '@telemok/bitdataview';

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



