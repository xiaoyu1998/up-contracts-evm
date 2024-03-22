// SPDX-License-Identifier: BUSL-1.1

pragma solidity ^0.8.20;

import "../data/DataStore.sol";
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

import "../oracle/IPriceOracleGetter.sol";
import "../oracle/OracleStoreUtils.sol";

import "../config/ConfigStoreUtils.sol";

import "../utils/WadRayMath.sol";

// @title BorrowUtils
// @dev Library for borrow functions, to help with the borrowing of liquidity
// from a pool in return for debt tokens
library BorrowUtils {

    struct BorrowParams {
        address underlyingAsset;
        uint256 amount;
    }

    struct ExecuteBorrowParams {
        DataStore dataStore;
        address underlyingAsset;
        uint256 amount;
    }

    // @dev executes a borrow
    // @param account the withdrawing account
    // @param params ExecuteBorrowParams
    function executeBorrow(address account, ExecuteBorrowParams calldata params) external {
        Position.Props memory position  = PositionStoreUtils.get(params.dataStore, account);
        PositionUtils.validateEnabledPosition(position);

        Pool.Props memory pool          = PoolStoreUtils.get(params.dataStore, PoolUtils.getKey(params.underlyingAsset));
        PoolUtils.validateEnabledPool(pool, PoolUtils.getKey(params.underlyingAsset));
        PoolCache.Props memory poolCache = PoolUtils.cache(pool);

        pool.updateStateIntervalTransactions(poolCache);
        BorrowUtils.validateBorrow( account, params.dataStore, position, poolCache, params.amount);

        IPoolToken poolToken = IPoolToken(poolCache.poolTokenAddress);
        poolToken.addCollateral(account, params.amount);//this will change Rate

        position.setPoolAsCollateral(pool.poolKeyId(), true);
        position.setPoolAsBorrowing(pool.poolKeyId(), true);
        PositionStoreUtils.set(params.dataStore, account, position);

        poolCache.nextScaledDebt = 
            IDebtToken(poolCache.debtTokenAddress).mint(account, params.amount, poolCache.nextBorrowIndex);
        
        pool.updateInterestRates(poolCache, params.asset, 0, params.amount);
        PoolStoreUtils.set(params.dataStore, params.underlyingAsset, PoolUtils.getPoolSalt(params.asset), pool);
    }


    struct ValidateBorrowLocalVars {

        uint256 totalDebt;
        uint256 poolDecimals;
        uint256 borrowCapacity;
        uint256 userTotalCollateralInUsd;
        uint256 userTotalDebtInUsd;
        uint256 amountToBorrowInUsd;
        uint256 healthFactor;
        uint256 healthFactorCollateralRateThreshold;

        bool isActive;
        bool isFrozen;
        bool isPaused;
        bool borrowingEnabled;
    }

    // 
    // @notice Validates a withdraw action.
    // @param poolCache The cached data of the pool
    // @param amount The amount to be Borrow
    //
    function validateBorrow(
        address account,
        DataStore dataStore,
        Position.Props memory position,
        PoolCache.Props memory poolCache,
        uint256 amountToBorrow
    ) internal pure {
        if (amountToBorrow == 0) { 
            revert Errors.EmptyBorrowAmount(); 
        }

        ValidateBorrowLocalVars memory vars;
        //validate pool configuration
        (
            vars.isActive,
            vars.isFrozen,
            vars.borrowingEnabled,
            vars.isPaused
        ) = PoolConfigurationUtils.getFlags(poolCache.poolConfiguration);  
        if (!vars.isActive)         { revert Errors.PoolIsInactive(); }  
        if (vars.isPaused)          { revert Errors.PoolIsPaused();   }  
        if (vars.isFrozen)          { revert Errors.PoolIsFrozen();   }   
        if (!vars.borrowingEnabled) { revert Errors.PoolIsNotEnabled();   } 
   

        //validate pool borrow capacity
        vars.poolDecimals   = PoolConfigurationUtils.getDecimals(poolCache.poolConfiguration);
        vars.borrowCapacity = PoolConfigurationUtils.getBorrowCapacity(poolCache.poolConfiguration) 
                              * (10 ** vars.poolDecimals);
        if (vars.borrowCapacity != 0) {
            vars.totalDebt =
                poolCache.nextTotalScaledDebt.rayMul(poolCache.nextBorrowIndex) +
                amountToBorrow;
            unchecked {
                if (vars.totalDebt <= vars.borrowCapacity) {
                    revert Errors.Borrow_Capicaty_Exceeded();
                }
            }
        }

        //validate account health
        (
            vars.userTotalCollateralInUsd,
            vars.userTotalDebtInUsd
        ) = PositionUtils.calculateUserTotalCollateralAndDebt(account, dataStore, position);
        if (vars.userCollateralInUsd == 0) { revert Errors.CollateralBalanceIsZero();}

        vars.amountToBorrowInUsd = IPriceOracleGetter(OracleStoreUtils.get(dataStore))
                                       .getPrice(poolCache.underlyingAsset)
                                       .rayMul(amountToBorrow);
        //vars.healthFactor = userTotalCollateralInUsd.wadDiv(vars.userTotalDebtInUsd + vars.amountToBorrowInUsd);
        vars.healthFactor = (vars.userTotalDebtInUsd + vars.amountToBorrowInUsd).wadDiv(vars.userTotalCollateralInUsd);
        
        vars.healthFactorCollateralRateThreshold = ConfigStoreUtils.getHealthFactorCollateralRateThreshold();
        if (vars.healthFactor < vars.healthFactorCollateralRateThreshold) {
            revert Errors.CollateralCanNotCoverNewBorrow(
                vars.userTotalCollateralInUsd, 
                vars.userTotalDebtInUsd, 
                vars.amountToBorrowInUsd,
                vars.healthFactorCollateralRateThreshold
            );
        }
    }
    
}
