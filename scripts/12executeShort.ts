import { contractAt, sendTxn, getTokens, getContract, getEventEmitter } from "../utils/deploy";
import { expandDecimals, encodePriceSqrt } from "../utils/math";
import { getPoolInfo, getAssets, getPositions, getPositionsInfo} from "../utils/helper";
import { SwapUtils } from "../typechain-types/contracts/exchange/SwapHandler";

async function main() {
    const [owner] = await ethers.getSigners();

    const exchangeRouter = await getContract("ExchangeRouter"); 
    const router = await getContract("Router");
    const dataStore = await getContract("DataStore");   
    const reader = await getContract("Reader"); 
    const eventEmitter = await getEventEmitter();  
    eventEmitter.on("Swap", (
        underlyingAssetIn, 
        underlyingAssetOut, 
        account,
        amountIn, 
        amountOut, 
        fee,
        collateralIn,
        debtScaledIn,
        collateralOut,
        debtScaledOut
        ) =>{
        console.log("eventEmitter Swap" ,underlyingAssetIn, underlyingAssetOut, account, amountIn, amountOut, fee, collateralIn, debtScaledIn, collateralOut, debtScaledOut);
    });

    const usdtDecimals = getTokens("USDT")["decimals"];
    const uniDecimals = getTokens("UNI")["decimals"];
    const usdtAddress = getTokens("USDT")["address"];
    const uniAddress = getTokens("UNI")["address"];
    const usdt = await contractAt("MintableToken", usdtAddress);
    const uni = await contractAt("MintableToken", uniAddress);

    //deposit
    const poolUsdt = await getPoolInfo(usdtAddress); 
    const depositAmmountUsdt = expandDecimals(1000000, usdtDecimals);
    await sendTxn(usdt.approve(router.target, depositAmmountUsdt), `usdt.approve(${router.target})`)
    const paramsUsdt: DepositUtils.DepositParamsStruct = {
        underlyingAsset: usdtAddress,
    };

    //borrow
    const borrowAmmount = expandDecimals(100000, uniDecimals);
    const paramsBorrow: BorrowUtils.BorrowParamsStruct = {
        underlyingAsset: uniAddress,
        amount: borrowAmmount,
    };

    //swap
    const paramsSwap: SwapUtils.SwapParamsStruct = {
        underlyingAssetIn: uniAddress,
        underlyingAssetOut: usdtAddress,
        amount: borrowAmmount,
        sqrtPriceLimitX96: 0
    };
    const multicallArgs = [
        // exchangeRouter.interface.encodeFunctionData("sendTokens", [usdtAddress, poolUsdt.poolToken, depositAmmountUsdt]),
        // exchangeRouter.interface.encodeFunctionData("executeDeposit", [paramsUsdt]),
        exchangeRouter.interface.encodeFunctionData("executeBorrow", [paramsBorrow]),
        exchangeRouter.interface.encodeFunctionData("executeSwap", [paramsSwap]),
    ];
    await sendTxn(
        exchangeRouter.multicall(multicallArgs, {
            gasLimit:3000000,
        }),
        "exchangeRouter.multicall"
    );

    //print 
    const poolUsdtAfterSwap = await getPoolInfo(usdtAddress); 
    const poolUniAfterSwap = await getPoolInfo(uniAddress); 
    console.log("poolUsdtAfterSwap", poolUsdtAfterSwap);
    console.log("poolUniAfterSwap", poolUniAfterSwap);
    console.log("assets",await getAssets(dataStore, reader, owner.address));
    console.log("positions",await getPositions(dataStore, reader, owner.address)); 
    console.log("positionsInfo",await getPositionsInfo(dataStore, reader, owner.address)); 

}


main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error)
    process.exit(1)
  })