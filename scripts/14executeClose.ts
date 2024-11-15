import { contractAt, sendTxn, getTokens, getContract, getEventEmitter } from "../utils/deploy";
import { expandDecimals, encodePriceSqrt } from "../utils/math";
import { getPoolInfo, getAssets, getPositions, getPositionsInfo} from "../utils/helper";
import { CloseUtils } from "../typechain-types/contracts/exchange/CloseHandler.sol/CloseHandler";
import { DepositUtils } from "../typechain-types/contracts/exchange/DepositHandler";
import { SwapUtils } from "../typechain-types/contracts/exchange/SwapHandler";
import { getErrorMsg } from "../utils/error";

async function main() {
    const [owner] = await ethers.getSigners();

    const exchangeRouter = await getContract("ExchangeRouter"); 
    const router = await getContract("Router");
    const dataStore = await getContract("DataStore");   
    const reader = await getContract("Reader");  
    // const eventEmitter = await getEventEmitter();  
    // eventEmitter.on("Close", (underlyingAssetUsd, account, amountUsdStartClose, amountUsdAfterRepayAndSellCollateral, amountUsdAfterBuyCollateralAndRepay) => {
    //     const event: CloseEvent.OutputTuple = {
    //         underlyingAssetUsd: underlyingAssetUsd,
    //         account: account,
    //         amountUsdStartClose: amountUsdStartClose,
    //         amountUsdAfterRepayAndSellCollateral: amountUsdAfterRepayAndSellCollateral,
    //         amountUsdAfterBuyCollateralAndRepay: amountUsdAfterBuyCollateralAndRepay
    //     };        
    //     console.log("eventEmitter Close" ,event);
    // });

    const usdtDecimals = getTokens("USDT")["decimals"];
    const uniDecimals = getTokens("UNI")["decimals"];
    const usdtAddress = getTokens("USDT")["address"];
    const uniAddress = getTokens("UNI")["address"];
    const usdt = await contractAt("MintableToken", usdtAddress);
    const uni = await contractAt("MintableToken", uniAddress);

    // //deposit usdt 1m and uni 10,000
    const depositAmmountUsdt = expandDecimals(1000000, usdtDecimals);
    await sendTxn(usdt.approve(router.target, depositAmmountUsdt), "usdt.approve");
    const depositAmmountUni = expandDecimals(10000, uniDecimals);
    await sendTxn(uni.approve(router.target, depositAmmountUni), "uni.approve");    
    const poolUsdt = await getPoolInfo(usdtAddress); 
    const paramsUsdt: DepositUtils.DepositParamsStruct = {
        underlyingAsset: usdtAddress,
    };
    const poolUni = await getPoolInfo(uniAddress); 
    const paramsUni: DepositUtils.DepositParamsStruct = {
        underlyingAsset: uniAddress,
    };

    // //short uni 100,000
    // const borrowAmmount = expandDecimals(100000, uniDecimals);
    // const paramsBorrow: BorrowUtils.BorrowParamsStruct = {
    //     underlyingAsset: uniAddress,
    //     amount: borrowAmmount,
    // };
    // const paramsSwap: SwapUtils.SwapParamsStruct = {
    //     underlyingAssetIn: uniAddress,
    //     underlyingAssetOut: usdtAddress,
    //     amount: borrowAmmount,
    //     sqrtPriceLimitX96: 0
    // };

    //long uni 100,000
    const borrowAmmount = expandDecimals(1000000, usdtDecimals);
    const paramsBorrow: BorrowUtils.BorrowParamsStruct = {
        underlyingAsset: usdtAddress,
        amount: borrowAmmount,
    };
    const paramsSwap: SwapUtils.SwapParamsStruct = {
        underlyingAssetIn: usdtAddress,
        underlyingAssetOut: uniAddress,
        amount: borrowAmmount+depositAmmountUsdt,
        sqrtPriceLimitX96: 0
    };

    //execute close Positions
    const paramsClose: CloseUtils.CloseParamsStruct = {
        underlyingAssetUsd: usdtAddress
    };
    const multicallArgs = [
        exchangeRouter.interface.encodeFunctionData("sendTokens", [usdtAddress, poolUsdt.poolToken, depositAmmountUsdt]),
        exchangeRouter.interface.encodeFunctionData("executeDeposit", [paramsUsdt]),
        // exchangeRouter.interface.encodeFunctionData("sendTokens", [uniAddress, poolUni.poolToken, depositAmmountUni]),
        // exchangeRouter.interface.encodeFunctionData("executeDeposit", [paramsUni]), 
        exchangeRouter.interface.encodeFunctionData("executeBorrow", [paramsBorrow]),
        exchangeRouter.interface.encodeFunctionData("executeSwap", [paramsSwap]),
        exchangeRouter.interface.encodeFunctionData("executeClose", [paramsClose]),
    ];
    // try {
    //     const estimatedGas = await exchangeRouter.multicall.estimateGas(multicallArgs);
    //     console.log("estimatedGas", estimatedGas);
    // } catch (err){
    //     for (const key in err) {
    //         if (err.hasOwnProperty(key)) {
    //             console.log(`${key}: ${err[key]}`);
    //         }
    //     }  
    //     //console.log("Error:", await getErrorMsg(err.data));      
    // }
    await sendTxn(
        exchangeRouter.multicall(multicallArgs),
        "exchangeRouter.multicall"
    );

    //print 
    const poolUsdtAfterClosePosition = await getPoolInfo(usdtAddress); 
    const poolUniAfterClosePosition = await getPoolInfo(uniAddress); 
    console.log("poolUsdtAfterClosePosition", poolUsdtAfterClosePosition);
    console.log("poolUniAfterClosePosition", poolUniAfterClosePosition);
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