import { contractAt, sendTxn, getTokens, getContract, getEventEmitter } from "../utils/deploy";
import { expandDecimals, encodePriceSqrt,calcPriceImpact, calcSilppage, calcSqrtPriceLimitX96} from "../utils/math";
import { getPoolsInfo, getLiquidityAndDebts, getPositions, getPositionsInfo,getLiquidationHealthFactor} from "../utils/helper";

async function main() {
    const [owner] = await ethers.getSigners();

    console.log("owner", owner);

    const usdtDecimals = getTokens("USDT")["decimals"];
    const usdtAddress = getTokens("USDT")["address"];
    const usdt = await contractAt("MintableToken", usdtAddress);
    const uniDecimals = getTokens("UNI")["decimals"];
    const uniAddress = getTokens("UNI")["address"];
    const uni = await contractAt("MintableToken", uniAddress);
    const dataStore = await getContract("DataStore");   
    const reader = await getContract("Reader");  
    const uniIsZero =  (uniAddress.toLowerCase() < usdtAddress.toLowerCase()) ? true:false;

    //
    const feeAmount = await reader.getDexPoolFeeAmount(dataStore, uniAddress, usdtAddress);
    const quoterAddress = "0xFCb9aB7bBf155F5d76de65a2ae429aB5CCEdeA69";
    const quoter = await contractAt("Quoter", quoterAddress);
    const uniAmountIn = expandDecimals(10000, uniDecimals);
    const [usdtAmountOut, startSqrtPriceX96] = await quoter.quoteExactInputSingle.staticCall(
        uniAddress, 
        usdtAddress,
        feeAmount,
        uniAmountIn,
        0 //the max sqrtPriceLimitX96 
    );
    console.log("priceImpact", calcPriceImpact(usdtAmountOut, uniAmountIn, startSqrtPriceX96, uniIsZero).toString()); 
    console.log("silppage", calcSilppage(usdtAmountOut, uniAmountIn, startSqrtPriceX96, uniIsZero).toString()); //delete feeAmount in amountIn to get the silppage without fee
    console.log("startSqrtPriceX96", startSqrtPriceX96, "sqrtPriceLimitX96", calcSqrtPriceLimitX96(startSqrtPriceX96, "0.05", uniIsZero).toString());


    console.log("Assets", await getLiquidityAndDebts(dataStore, reader, owner.address));
    console.log("positions", await getPositions(dataStore, reader, owner.address)); 
    //console.log("positionsInfo", await getPositionsInfo(dataStore, reader, owner.address)); 
    //console.log("pools", await getPoolsInfo(dataStore, reader));
    console.log("HealthFactor", await getLiquidationHealthFactor(owner.address));
    console.log("userUSDT", await usdt.balanceOf(owner.address)); 
    console.log("userUNI", await uni.balanceOf(owner.address)); 

    // const filter = {
    //   address: ['0x2eDc460229DC2710b4977d9F7225E6236dbAF7a2'],
    //   //address: ['0x70121A415b6D3607B1469fbDBdC8bB6DC12E9FB8'],
    //   fromBlock: 2735,
    //   toBlock: "latest",
    // };

    // const provider = new ethers.getDefaultProvider("http://192.168.2.106:8545");
    // console.log(await provider.getLogs(filter));

}


main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error)
    process.exit(1)
  })