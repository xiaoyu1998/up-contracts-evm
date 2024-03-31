// SPDX-License-Identifier: BUSL-1.1

pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

import "../data/DataStore.sol";
import "../data/Keys.sol";
import "../error/Errors.sol";

import "../pool/Pool.sol";
import "../pool/PoolCache.sol";
import "../pool/PoolUtils.sol";
import "../pool/PoolStoreUtils.sol";
import "../token/IPoolToken.sol";
import "../token/IDebtToken.sol";

import "../position/Position.sol";
import "../position/PositionUtils.sol";
import "../position/PositionStoreUtils.sol";

import "../utils/WadRayMath.sol";

// @title RepayUtils
// @dev Library for deposit functions, to help with the depositing of liquidity
// into a market in return for market tokens
library RepayUtils {
    using Pool for Pool.Props;
    using PoolCache for PoolCache.Props;
    using Position for Position.Props;
    using WadRayMath for uint256;

    struct RepayParams {
        address underlyingAsset;
        uint256 amount;
    }

    struct ExecuteRepayParams {
        DataStore dataStore;
        address underlyingAsset;
        uint256 amount;
    }

    // @dev executes a repay
    // @param account the repaying account
    // @param params ExecuteRepayParams
    function executeRepay(address account, ExecuteRepayParams calldata params) external {
        address poolKey = Keys.poolKey(params.underlyingAsset);
        Pool.Props memory pool = PoolStoreUtils.get(params.dataStore, poolKey);
        PoolUtils.validateEnabledPool(pool, poolKey);
        PoolCache.Props memory poolCache = PoolUtils.cache(pool);
        PoolUtils.updateStateBetweenTransactions(pool, poolCache);

        uint256 repayAmount;
        uint256 collateralAmount;
        IPoolToken poolToken = IPoolToken(poolCache.poolToken);
        if(params.amount > 0) { // reduce collateral to repay
            repayAmount = params.amount;
            collateralAmount = poolToken.balanceOfCollateral(account);
            // if(repayAmount > collateralAmount){// all collateral to repay 
            //     repayAmount = collateralAmount;
            // }
        } else {//transferin to repay
            repayAmount = poolToken.recordTransferIn(params.underlyingAsset);
        }

        uint256 extraAmountToRefund;
        IDebtToken debtToken = IDebtToken(poolCache.debtToken);
        uint256 debtAmount = debtToken.balanceOf(account);
        if(repayAmount > debtAmount) {
            extraAmountToRefund = repayAmount - debtAmount;
            repayAmount         = debtAmount;      
        }

        bytes32 positionKey = Keys.accountPositionKey(params.underlyingAsset, account);
        Position.Props memory position  = PositionStoreUtils.get(params.dataStore, positionKey);
        RepayUtils.validateRepay(
            account, 
            position, 
            pool, 
            repayAmount, 
            debtAmount, 
            collateralAmount
        );

        poolCache.nextTotalScaledDebt = debtToken.burn(account, repayAmount, poolCache.nextBorrowIndex);
        if(debtToken.scaledBalanceOf(account) == 0) {
            position.hasDebt = false; 
            PositionStoreUtils.set(params.dataStore, positionKey, position);
        }
        if(collateralAmount > 0) {//reduce collateral to repay
            poolToken.removeCollateral(account, repayAmount);
            if(poolToken.balanceOfCollateral(account) == 0) {
                position.hasCollateral = false;
                PositionStoreUtils.set(params.dataStore, positionKey, position);
            }
        }

        PoolUtils.updateInterestRates(
            pool,
            poolCache, 
            params.underlyingAsset, 
            repayAmount, 
            0
        );

        PoolStoreUtils.set(
            params.dataStore, 
            poolKey, 
            pool
        );

        if(extraAmountToRefund > 0 && collateralAmount == 0) {//Refund extra
            poolToken.transferOutUnderlyingAsset(account, extraAmountToRefund);
            poolToken.syncUnderlyingAssetBalance();
        }

    }


    
    // @notice Validates a repay action.
    // @param poolCache The cached data of the pool
    // @param amount The amount to be repay
    // @param userBalance The balance of the user
    function validateRepay(
        address account,
        Position.Props memory position,
        Pool.Props memory pool,
        uint256 repayAmount,
        uint256 debtAmount,
        uint256 collateralAmount
    ) internal pure {
        PositionUtils.validateEnabledPosition(position);

        if(repayAmount == 0) {
            revert Errors.EmptyRepayAmount();
        }

        if(debtAmount == 0) {
            revert Errors.UserDoNotHaveDebtInPool(account, pool.underlyingAsset);
        }

        if(collateralAmount > 0){
            if(collateralAmount < repayAmount){
                revert Errors.InsufficientCollateralAmountForRepay(repayAmount, collateralAmount);
            }
        }
    }
    
}
