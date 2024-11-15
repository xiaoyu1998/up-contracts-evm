import { expect } from "chai";
import { deployFixture } from "../../utils/fixture";
import { errorsContract} from "../../utils/error";
import { expandDecimals, bigNumberify, mulDiv, rayDiv } from "../../utils/math"
import { 
    getPositions,
    getCollateral, 
    getPositionType, 
    getEntryLongPrice, 
    getAccLongAmount, 
    getEntryShortPrice, 
    getAccShortAmount,
    getDebt,
    getSupplyApy,
    getBorrowApy,
    getHasDebt,
    getHasCollateral
} from "../../utils/helper"
import { DepositUtils } from "../../typechain-types/contracts/exchange/DepositHandler";
import { BorrowUtils } from "../typechain-types/contracts/exchange/BorrowHandler";
import { CloseUtils } from "../typechain-types/contracts/exchange/CloseHandler";
import { createAsset, createUniswapV3, addLiquidityV3 } from "../../utils/assetsDex";
import { testPoolConfiguration } from "../../utils/pool";
import { ethDecimals, ethOracleDecimals, PRECISION } from "../../utils/constants";

describe("Exchange Close", () => {
    let fixture;
    let user0, user1, user2;
    let config, dataStore, roleStore, reader, router, exchangeRouter, poolFactory, poolInterestRateStrategy;
    let usdt, uni;
    let usdtPool, uniPool;
    let usdtDecimals, usdtOracleDecimals, uniDecimals, uniOracleDecimals;
    let dex, poolV3;

    beforeEach(async () => {
        fixture = await deployFixture();
        ({  config, 
            dataStore, 
            roleStore, 
            reader,
            router,
            exchangeRouter,
            poolFactory,
            poolInterestRateStrategy
         } = fixture.contracts);
        ({ user0, user1, user2 } = fixture.accounts);
        ({ usdt, uni } = fixture.assets);
        ({ usdtPool, uniPool } = fixture.pools);
        ({  usdtDecimals, 
            usdtOracleDecimals,
            uniDecimals,
            uniOracleDecimals
         } = fixture.decimals);

        [dex, poolV3] = await createUniswapV3(
            roleStore,
            user0, 
            config, 
            usdt, 
            usdtDecimals, 
            uni, 
            uniDecimals, 
            8
        );

    });

    it("executeClose collateralAmount == debtAmount, repay only ", async () => {
        const usdtDepositAmount = expandDecimals(1000000, usdtDecimals);
        await usdt.connect(user1).approve(router.target, usdtDepositAmount);
        const usdtParamsDeposit: DepositUtils.DepositParamsStructOutput = {
            underlyingAsset: usdt.target,
        };
        const uniBorrowAmmount = expandDecimals(100000, uniDecimals);
        const uniParamsBorrow: BorrowUtils.BorrowParamsStructOutput = {
            underlyingAsset: uni.target,
            amount: uniBorrowAmmount,
        }; 
        const closeParams: CloseUtils.CloseParamsStructOutput = {
            underlyingAssetUsd: usdt.target
        };
        const multicallArgs = [
            exchangeRouter.interface.encodeFunctionData("sendTokens", [usdt.target, usdtPool.poolToken, usdtDepositAmount]),
            exchangeRouter.interface.encodeFunctionData("executeDeposit", [usdtParamsDeposit]),
            exchangeRouter.interface.encodeFunctionData("executeBorrow", [uniParamsBorrow]),
            exchangeRouter.interface.encodeFunctionData("executeClose", [closeParams]),
        ];
        await exchangeRouter.connect(user1).multicall(multicallArgs);

        // expect(await getCollateral(dataStore, reader, user1.address, uni.target)).eq(0);
        // expect(await getDebt(dataStore, reader, user1.address, uni.target)).eq(0);
        // expect(await getHasDebt(dataStore, reader, user1.address, uni.target)).eq(false);
        // expect(await getHasCollateral(dataStore, reader, user1.address, uni.target)).eq(false);
        // expect(await getPositionType(dataStore, reader, user1.address, uni.target)).eq(2);
        // expect(await getEntryLongPrice(dataStore, reader, user1.address, uni.target)).eq(0);
        // expect(await getAccLongAmount(dataStore, reader, user1.address, uni.target)).eq(0);
        // expect(await getEntryShortPrice(dataStore, reader, user1.address, uni.target)).eq(0);
        // expect(await getAccShortAmount(dataStore, reader, user1.address, uni.target)).eq(0); 
        expect((await getPositions(dataStore, reader, user1.address)).length).eq(1);

        expect(await getCollateral(dataStore, reader, user1.address, usdt.target)).eq(usdtDepositAmount);
        expect(await getDebt(dataStore, reader, user1.address, usdt.target)).eq(0);
        expect(await getHasDebt(dataStore, reader, user1.address, usdt.target)).eq(false);
        expect(await getHasCollateral(dataStore, reader, user1.address, usdt.target)).eq(true);
        expect(await getPositionType(dataStore, reader, user1.address, usdt.target)).eq(2);
        expect(await getEntryLongPrice(dataStore, reader, user1.address, usdt.target)).eq(0);
        expect(await getAccLongAmount(dataStore, reader, user1.address, usdt.target)).eq(0);
        expect(await getEntryShortPrice(dataStore, reader, user1.address, usdt.target)).eq(0);
        expect(await getAccShortAmount(dataStore, reader, user1.address, usdt.target)).eq(0); 
 
    });


    it("executeClose collateralAmount == debtAmount, repay and sell", async () => {
        await addLiquidityV3(
            user0,
            usdt,
            uni,
            dex,
            poolV3
        )

        const uniDepositAmount = expandDecimals(100000, uniDecimals);
        await uni.connect(user1).approve(router.target, uniDepositAmount);
        const uniParamsDeposit: DepositUtils.DepositParamsStructOutput = {
            underlyingAsset: uni.target,
        };
        const uniBorrowAmmount = expandDecimals(100000, uniDecimals);
        const uniParamsBorrow: BorrowUtils.BorrowParamsStructOutput = {
            underlyingAsset: uni.target,
            amount: uniBorrowAmmount,
        }; 
        const closeParams: CloseUtils.CloseParamsStructOutput = {
            underlyingAssetUsd: usdt.target
        };
        const multicallArgs = [
            exchangeRouter.interface.encodeFunctionData("sendTokens", [uni.target, uniPool.poolToken, uniDepositAmount]),
            exchangeRouter.interface.encodeFunctionData("executeDeposit", [uniParamsDeposit]),
            exchangeRouter.interface.encodeFunctionData("executeBorrow", [uniParamsBorrow]),
            exchangeRouter.interface.encodeFunctionData("executeClose", [closeParams]),
        ];
        await exchangeRouter.connect(user1).multicall(multicallArgs);

        // expect(await getCollateral(dataStore, reader, user1.address, uni.target)).eq(0);
        // expect(await getDebt(dataStore, reader, user1.address, uni.target)).eq(0);
        // expect(await getHasDebt(dataStore, reader, user1.address, uni.target)).eq(false);
        // expect(await getHasCollateral(dataStore, reader, user1.address, uni.target)).eq(false);
        // expect(await getPositionType(dataStore, reader, user1.address, uni.target)).eq(2);
        // expect(await getEntryLongPrice(dataStore, reader, user1.address, uni.target)).eq(0);
        // expect(await getAccLongAmount(dataStore, reader, user1.address, uni.target)).eq(0);
        // expect(await getEntryShortPrice(dataStore, reader, user1.address, uni.target)).eq(0);
        // expect(await getAccShortAmount(dataStore, reader, user1.address, uni.target)).eq(0); 
        expect((await getPositions(dataStore, reader, user1.address)).length).eq(1);

        expect(await getCollateral(dataStore, reader, user1.address, usdt.target)).eq("797375144846");
        expect(await getDebt(dataStore, reader, user1.address, usdt.target)).eq(0);
        expect(await getHasDebt(dataStore, reader, user1.address, usdt.target)).eq(false);
        expect(await getHasCollateral(dataStore, reader, user1.address, usdt.target)).eq(true);
        expect(await getPositionType(dataStore, reader, user1.address, usdt.target)).eq(2);
        expect(await getEntryLongPrice(dataStore, reader, user1.address, usdt.target)).eq(0);
        expect(await getAccLongAmount(dataStore, reader, user1.address, usdt.target)).eq(0);
        expect(await getEntryShortPrice(dataStore, reader, user1.address, usdt.target)).eq(0);
        expect(await getAccShortAmount(dataStore, reader, user1.address, usdt.target)).eq(0); 
 
    });

    it("executeClose collateralAmount > 0, repay, buy and repay", async () => {
        await addLiquidityV3(
            user0,
            usdt,
            uni,
            dex,
            poolV3
        )

        const usdtDepositAmount = expandDecimals(2000000, usdtDecimals);
        await usdt.connect(user1).approve(router.target, usdtDepositAmount);
        const usdtParamsDeposit: DepositUtils.DepositParamsStructOutput = {
            underlyingAsset: usdt.target,
        };
        const uniBorrowAmmount = expandDecimals(200000, uniDecimals);
        const uniParamsBorrow: BorrowUtils.BorrowParamsStructOutput = {
            underlyingAsset: uni.target,
            amount: uniBorrowAmmount,
        }; 
        const uniAmountRedeem = expandDecimals(100000, uniDecimals);
        const uniParamsRedeem: RedeemUtils.RedeemParamsStructOutput = {
            underlyingAsset: uni.target,
            amount: uniAmountRedeem,
            to:user1.address
        };

        const closeParams: CloseUtils.CloseParamsStructOutput = {
            underlyingAssetUsd: usdt.target
        };
        const multicallArgs = [
            exchangeRouter.interface.encodeFunctionData("sendTokens", [usdt.target, usdtPool.poolToken, usdtDepositAmount]),
            exchangeRouter.interface.encodeFunctionData("executeDeposit", [usdtParamsDeposit]),
            exchangeRouter.interface.encodeFunctionData("executeBorrow", [uniParamsBorrow]),
            exchangeRouter.interface.encodeFunctionData("executeRedeem", [uniParamsRedeem]),
            exchangeRouter.interface.encodeFunctionData("executeClose", [closeParams]),
        ];
        await exchangeRouter.connect(user1).multicall(multicallArgs);

        // expect(await getCollateral(dataStore, reader, user1.address, uni.target)).eq(0);
        // expect(await getDebt(dataStore, reader, user1.address, uni.target)).eq(0);
        // expect(await getHasDebt(dataStore, reader, user1.address, uni.target)).eq(false);
        // expect(await getHasCollateral(dataStore, reader, user1.address, uni.target)).eq(false);
        // expect(await getPositionType(dataStore, reader, user1.address, uni.target)).eq(2);
        // expect(await getEntryLongPrice(dataStore, reader, user1.address, uni.target)).eq(0);
        // expect(await getAccLongAmount(dataStore, reader, user1.address, uni.target)).eq(0);
        // expect(await getEntryShortPrice(dataStore, reader, user1.address, uni.target)).eq(0);
        // expect(await getAccShortAmount(dataStore, reader, user1.address, uni.target)).eq(0); 
        expect((await getPositions(dataStore, reader, user1.address)).length).eq(1);

        expect(await getCollateral(dataStore, reader, user1.address, usdt.target)).eq("1598739642383");
        expect(await getDebt(dataStore, reader, user1.address, usdt.target)).eq(0);
        expect(await getHasDebt(dataStore, reader, user1.address, usdt.target)).eq(false);
        expect(await getHasCollateral(dataStore, reader, user1.address, usdt.target)).eq(true);
        expect(await getPositionType(dataStore, reader, user1.address, usdt.target)).eq(2);
        expect(await getEntryLongPrice(dataStore, reader, user1.address, usdt.target)).eq(0);
        expect(await getAccLongAmount(dataStore, reader, user1.address, usdt.target)).eq(0);
        expect(await getEntryShortPrice(dataStore, reader, user1.address, usdt.target)).eq(0);
        expect(await getAccShortAmount(dataStore, reader, user1.address, usdt.target)).eq(0); 
 
    });

    it("executeClose collateralAmount = 0, sell and repay (long)", async () => {
        await addLiquidityV3(
            user0,
            usdt,
            uni,
            dex,
            poolV3
        )
        
        const usdtDepositAmount = expandDecimals(1000000, usdtDecimals);
        await usdt.connect(user1).approve(router.target, usdtDepositAmount);
        const usdtParamsDeposit: DepositUtils.DepositParamsStructOutput = {
            underlyingAsset: usdt.target,
        };
        const usdtBorrowAmmount = expandDecimals(1000000, usdtDecimals);
        const usdtParamsBorrow: BorrowUtils.BorrowParamsStructOutput = {
            underlyingAsset: usdt.target,
            amount: usdtBorrowAmmount,
        }; 
        const paramsSwap: SwapUtils.SwapParamsStruct = {
            underlyingAssetIn: usdt.target,
            underlyingAssetOut: uni.target,
            amount: usdtDepositAmount+usdtBorrowAmmount,
            sqrtPriceLimitX96: 0
        };

        const closeParams: CloseUtils.CloseParamsStructOutput = {
            underlyingAssetUsd: usdt.target
        };
        const multicallArgs = [
            exchangeRouter.interface.encodeFunctionData("sendTokens", [usdt.target, usdtPool.poolToken, usdtDepositAmount]),
            exchangeRouter.interface.encodeFunctionData("executeDeposit", [usdtParamsDeposit]),
            exchangeRouter.interface.encodeFunctionData("executeBorrow", [usdtParamsBorrow]),
            exchangeRouter.interface.encodeFunctionData("executeSwap", [paramsSwap]),
            exchangeRouter.interface.encodeFunctionData("executeClose", [closeParams]),
        ];
        await exchangeRouter.connect(user1).multicall(multicallArgs);

        // expect(await getCollateral(dataStore, reader, user1.address, uni.target)).eq(0);
        // expect(await getDebt(dataStore, reader, user1.address, uni.target)).eq(0);
        // expect(await getHasDebt(dataStore, reader, user1.address, uni.target)).eq(false);
        // expect(await getHasCollateral(dataStore, reader, user1.address, uni.target)).eq(false);
        // expect(await getPositionType(dataStore, reader, user1.address, uni.target)).eq(2);
        // expect(await getEntryLongPrice(dataStore, reader, user1.address, uni.target)).eq(0);
        // expect(await getAccLongAmount(dataStore, reader, user1.address, uni.target)).eq(0);
        // expect(await getEntryShortPrice(dataStore, reader, user1.address, uni.target)).eq(0);
        // expect(await getAccShortAmount(dataStore, reader, user1.address, uni.target)).eq(0); 
        expect((await getPositions(dataStore, reader, user1.address)).length).eq(1);

        expect(await getCollateral(dataStore, reader, user1.address, usdt.target)).eq("988022201618");
        expect(await getDebt(dataStore, reader, user1.address, usdt.target)).eq(0);
        expect(await getHasDebt(dataStore, reader, user1.address, usdt.target)).eq(false);
        expect(await getHasCollateral(dataStore, reader, user1.address, usdt.target)).eq(true);
        expect(await getPositionType(dataStore, reader, user1.address, usdt.target)).eq(2);
        expect(await getEntryLongPrice(dataStore, reader, user1.address, usdt.target)).eq(0);
        expect(await getAccLongAmount(dataStore, reader, user1.address, usdt.target)).eq(0);
        expect(await getEntryShortPrice(dataStore, reader, user1.address, usdt.target)).eq(0);
        expect(await getAccShortAmount(dataStore, reader, user1.address, usdt.target)).eq(0); 

    });

    it("executeClose collateralAmount = 0, buy and repay (short)", async () => {
        await addLiquidityV3(
            user0,
            usdt,
            uni,
            dex,
            poolV3
        )
        
        const usdtDepositAmount = expandDecimals(1000000, usdtDecimals);
        await usdt.connect(user1).approve(router.target, usdtDepositAmount);
        const usdtParamsDeposit: DepositUtils.DepositParamsStructOutput = {
            underlyingAsset: usdt.target,
        };
        const uniBorrowAmmount = expandDecimals(100000, uniDecimals);
        const uniParamsBorrow: BorrowUtils.BorrowParamsStructOutput = {
            underlyingAsset: uni.target,
            amount: uniBorrowAmmount,
        }; 
        const paramsSwap: SwapUtils.SwapParamsStruct = {
            underlyingAssetIn: uni.target,
            underlyingAssetOut: usdt.target,
            amount: uniBorrowAmmount,
            sqrtPriceLimitX96: 0
        };

        const closeParams: CloseUtils.CloseParamsStructOutput = {
            underlyingAssetUsd: usdt.target
        };
        const multicallArgs = [
            exchangeRouter.interface.encodeFunctionData("sendTokens", [usdt.target, usdtPool.poolToken, usdtDepositAmount]),
            exchangeRouter.interface.encodeFunctionData("executeDeposit", [usdtParamsDeposit]),
            exchangeRouter.interface.encodeFunctionData("executeBorrow", [uniParamsBorrow]),
            exchangeRouter.interface.encodeFunctionData("executeSwap", [paramsSwap]),
            exchangeRouter.interface.encodeFunctionData("executeClose", [closeParams]),
        ];
        await exchangeRouter.connect(user1).multicall(multicallArgs);

        // expect(await getCollateral(dataStore, reader, user1.address, uni.target)).eq(0);
        // expect(await getDebt(dataStore, reader, user1.address, uni.target)).eq(0);
        // expect(await getHasDebt(dataStore, reader, user1.address, uni.target)).eq(false);
        // expect(await getHasCollateral(dataStore, reader, user1.address, uni.target)).eq(false);
        // expect(await getPositionType(dataStore, reader, user1.address, uni.target)).eq(2);
        // expect(await getEntryLongPrice(dataStore, reader, user1.address, uni.target)).eq(0);
        // expect(await getAccLongAmount(dataStore, reader, user1.address, uni.target)).eq(0);
        // expect(await getEntryShortPrice(dataStore, reader, user1.address, uni.target)).eq(0);
        // expect(await getAccShortAmount(dataStore, reader, user1.address, uni.target)).eq(0); 
        expect((await getPositions(dataStore, reader, user1.address)).length).eq(1);

        expect(await getCollateral(dataStore, reader, user1.address, usdt.target)).eq("995193452887");
        expect(await getDebt(dataStore, reader, user1.address, usdt.target)).eq(0);
        expect(await getHasDebt(dataStore, reader, user1.address, usdt.target)).eq(false);
        expect(await getHasCollateral(dataStore, reader, user1.address, usdt.target)).eq(true);
        expect(await getPositionType(dataStore, reader, user1.address, usdt.target)).eq(2);
        expect(await getEntryLongPrice(dataStore, reader, user1.address, usdt.target)).eq(0);
        expect(await getAccLongAmount(dataStore, reader, user1.address, usdt.target)).eq(0);
        expect(await getEntryShortPrice(dataStore, reader, user1.address, usdt.target)).eq(0);
        expect(await getAccShortAmount(dataStore, reader, user1.address, usdt.target)).eq(0); 

    });


    it("executeClose EmptyPool", async () => {
        const closeParams: CloseUtils.CloseParamsStructOutput = {
            underlyingAssetUsd: ethers.ZeroAddress
        }; 
        const multicallArgs = [
            exchangeRouter.interface.encodeFunctionData("executeClose", [closeParams]),
        ];
        await expect(
            exchangeRouter.connect(user1).multicall(multicallArgs)
        ).to.be.revertedWithCustomError(errorsContract, "EmptyPool");     
    });

    it("executeClose PoolIsNotUsd", async () => {
        const closeParams: CloseUtils.CloseParamsStructOutput = {
            underlyingAssetUsd: uni.target
        }; 
        const multicallArgs = [
            exchangeRouter.interface.encodeFunctionData("executeClose", [closeParams]),
        ];
        await expect(
            exchangeRouter.connect(user1).multicall(multicallArgs)
        ).to.be.revertedWithCustomError(errorsContract, "PoolIsNotUsd");     
    });

    it("executeClose validateClose HealthFactorLowerThanLiquidationThreshold", async () => {
        const usdtDepositAmount = expandDecimals(1000000, usdtDecimals);
        await usdt.connect(user1).approve(router.target, usdtDepositAmount);
        const usdtParamsDeposit: DepositUtils.DepositParamsStructOutput = {
            underlyingAsset: usdt.target,
        };
        const uniBorrowAmmount = expandDecimals(100000, uniDecimals);
        const uniParamsBorrow: BorrowUtils.BorrowParamsStructOutput = {
            underlyingAsset: uni.target,
            amount: uniBorrowAmmount,
        }; 
        const multicallArgs = [
            exchangeRouter.interface.encodeFunctionData("sendTokens", [usdt.target, usdtPool.poolToken, usdtDepositAmount]),
            exchangeRouter.interface.encodeFunctionData("executeDeposit", [usdtParamsDeposit]),
            exchangeRouter.interface.encodeFunctionData("executeBorrow", [uniParamsBorrow]),
        ];
        await exchangeRouter.connect(user1).multicall(multicallArgs);

        await config.setHealthFactorLiquidationThreshold(expandDecimals(400, 25));//400%
        const closeParams: CloseUtils.CloseParamsStructOutput = {
            underlyingAssetUsd: usdt.target
        };
        const multicallArgs2 = [
            exchangeRouter.interface.encodeFunctionData("executeClose", [closeParams]),
        ];       
        await expect(
            exchangeRouter.connect(user1).multicall(multicallArgs2)
        ).to.be.revertedWithCustomError(errorsContract, "HealthFactorLowerThanLiquidationThreshold");     
    });

    it("executeClose validateClose EmptyPositions", async () => {
        const closeParams: CloseUtils.CloseParamsStructOutput = {
            underlyingAssetUsd: usdt.target
        }; 
        const multicallArgs = [
            exchangeRouter.interface.encodeFunctionData("executeClose", [closeParams]),
        ];
        await expect(
            exchangeRouter.connect(user1).multicall(multicallArgs)
        ).to.be.revertedWithCustomError(errorsContract, "EmptyPositions");     
    });

    it("executeClose validateClose underlyingAsset testPoolConfiguration", async () => {
        const usdtDepositAmount = expandDecimals(10000000, usdtDecimals);
        await usdt.connect(user1).approve(router.target, usdtDepositAmount);
        const usdtParamsDeposit: DepositUtils.DepositParamsStructOutput = {
            underlyingAsset: usdt.target,
        };
        const uniBorrowAmmount = expandDecimals(100000, uniDecimals);
        const uniParamsBorrow: BorrowUtils.BorrowParamsStructOutput = {
            underlyingAsset: uni.target,
            amount: uniBorrowAmmount,
        };
        const multicallArgs = [
            exchangeRouter.interface.encodeFunctionData("sendTokens", [usdt.target, usdtPool.poolToken, usdtDepositAmount]),
            exchangeRouter.interface.encodeFunctionData("executeDeposit", [usdtParamsDeposit]),
            exchangeRouter.interface.encodeFunctionData("executeBorrow", [uniParamsBorrow]),
        ];
        await exchangeRouter.connect(user1).multicall(multicallArgs);


        const closeParams: CloseUtils.CloseParamsStructOutput = {
            underlyingAssetUsd: usdt.target
        };       

        await testPoolConfiguration(config, exchangeRouter, user1, "executeClose", uni, closeParams)
    });

    it("executeClose validateClose underlyingAssetUsd testPoolConfiguration", async () => {
        const usdtDepositAmount = expandDecimals(10000000, usdtDecimals);
        await usdt.connect(user1).approve(router.target, usdtDepositAmount);
        const usdtParamsDeposit: DepositUtils.DepositParamsStructOutput = {
            underlyingAsset: usdt.target,
        };
        const uniBorrowAmmount = expandDecimals(100000, uniDecimals);
        const uniParamsBorrow: BorrowUtils.BorrowParamsStructOutput = {
            underlyingAsset: uni.target,
            amount: uniBorrowAmmount,
        };
        const multicallArgs = [
            exchangeRouter.interface.encodeFunctionData("sendTokens", [usdt.target, usdtPool.poolToken, usdtDepositAmount]),
            exchangeRouter.interface.encodeFunctionData("executeDeposit", [usdtParamsDeposit]),
            exchangeRouter.interface.encodeFunctionData("executeBorrow", [uniParamsBorrow]),
        ];
        await exchangeRouter.connect(user1).multicall(multicallArgs);


        const closeParams: CloseUtils.CloseParamsStructOutput = {
            underlyingAssetUsd: usdt.target
        };       

        await testPoolConfiguration(config, exchangeRouter, user1, "executeClose", usdt, closeParams)
    });

}); 