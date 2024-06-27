import Errors from "../artifacts/contracts/error/Errors.sol/Errors.json";
export const errorsInterface = new ethers.Interface(Errors.abi);
//export const errorsContract = new ethers.Contract(ethers.ZeroAddress, Errors.abi);

export function getErrorString(error) {
  return JSON.stringify({
    name: error.name,
    args: error.args.map((value) => value.toString()),
  });
}

export function parseError(reasonBytes) {
  try {
    const reason = errorsInterface.parseError(reasonBytes);
    return reason;
  } catch (e) {
    throw new Error(`Could not parse errorBytes ${reasonBytes}`);
  }
}

export function getErrorMsg(errorBytes){
    errorBytes = errorBytes.toLocaleLowerCase();
  if (!errorBytes.startsWith("0x")) {
    errorBytes = "0x" + errorBytes;
  }
  console.log("trying to parse custom error reason", errorBytes);
  try {
    const errorReason = parseError(errorBytes);
    return getErrorString(errorReason);
  } catch (e) {
    console.log(e);
  }
}
