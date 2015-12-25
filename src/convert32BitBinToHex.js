// convert 32-bit BIN to 4 byte HEX;
export function convert32BitBinToHex (_bin) {
  return parseInt(_bin, 2).toString(16);
}