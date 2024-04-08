import { contractAt, getTokens, getContract, getContractAt } from "../utils/deploy";
import { expandDecimals } from "../utils/math";
import { getPool, getLiquidity, getDebt} from "../utils/helper";

import { WithdrawUtils } from "../typechain-types/contracts/exchange/SupplyHandler";

async function main() {
    const [owner] = await ethers.getSigners();
     
    const exchangeRouter = await getContract("ExchangeRouter"); 

    //execute withdraw
    const usdtDecimals = 6;
    const usdtAddress = getTokens("USDT")["address"];
    const usdt = await contractAt("MintableToken", usdtAddress);
    const poolUsdt = await getPool(usdtAddress); 
    const withdrawAmmount = expandDecimals(1000, usdtDecimals);
    const params: WithdrawUtils.WithdrawParamsStruct = {
        underlyingAsset: usdtAddress,
        amount: withdrawAmmount,
        to: owner.address,
    };
    const multicallArgs = [
        exchangeRouter.interface.encodeFunctionData("executeWithdraw", [params]),
    ];
    const tx = await exchangeRouter.multicall(multicallArgs);  

    //print poolUsdt
    const poolUsdtAfterWithdraw = await getPool(usdtAddress); 
    const poolToken = await getContractAt("PoolToken", poolUsdtAfterWithdraw.poolToken);
    const debtToken = await getContractAt("DebtToken", poolUsdtAfterWithdraw.debtToken);
    console.log("poolUsdtAfterWithdraw", poolUsdtAfterWithdraw);
    console.log("poolToken",await getLiquidity(poolToken, owner.address));
    console.log("debtToken",await getDebt(debtToken, owner.address)); 
    console.log("userUnderlyingAsset",await usdt.balanceOf(owner.address)); 
    console.log("poolUnderlyingAsset",await usdt.balanceOf(poolToken.target)); 

}


main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error)
    process.exit(1)
  })