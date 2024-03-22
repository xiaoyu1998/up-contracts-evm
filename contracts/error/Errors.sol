// SPDX-License-Identifier: BUSL-1.1

pragma solidity ^0.8.20;

library Errors {
    error ErrorToReplace();

    // PoolFactory errors
    error PoolAlreadyExists(bytes32 salt, address existingPoolAddress);

    // PoolStoreUtils errors
    error PoolNotFound(address key);

    // PoolToken errors
    error InsufficientBalanceAfterSubstractionCollateral(uint256 amount, uint256 availableBalance);

    // PoolInterestRateStrategy errors
    error InvalidOptimalUsageRate(uint256 optimalUsageRatio);

    //PoolConfigurationUtils errors
    error InvalidDecimals(uint256 decimals, uint256 MaxValidDecimals);
    error InvalidFeeFactor(uint256 feeFactor, uint256 MaxValidFeeFactor);
    error InvalidBorrowCapacity(uint256 borrowCapacity, uint256 MaxValidBorrowCapacity);
    error InvalidSupplyCapacity(uint256 supplyCapacity, uint256 MaxValidSupplyCapacity);


    //Position errors
    error InvalidPoolIndex(uint256 poolKeyId);

    //PositionUtils errors
    error EmptyPosition();

    // BorrowUtils, WithdrawUtils errors
    error PoolIsInactive();
    error PoolIsPaused();
    error PoolIsFrozen();
    error PoolIsNotEnabled();
    error CollateralBalanceIsZero();
    error CollateralCanNotCoverNewBorrow(uint256 userTotalCollateralInUsd, uint256 userTotalDebtInUsd, uint256 amountToBorrowInUsd, uint256 healthFactorCollateralRateThreshold);

    // SupplyUtils errors
    error EmptySupplyAmounts();
    error SupplyCapacityExceeded(uint256 totalSupplyAddUnclaimedFeeAddAmount, uint256 supplyCapacity);

    // WithdrawUtils errors
    error EmptyWithdrawAmounts();
    error InsufficientUserBalance(uint256 amount, uint256 userBalance);

    // RepayUtils errors
    error EmptyRepayAmount();
    error UserDoNotHaveDebtInPool(address account, address poolKey);
    error InsufficientCollateralAmountForRepay(uint256 repayAmount, uint256 collateralAmount);

    // RedeemUtils errors
    error EmptyRedeemAmount();
    error CollateralCanNotCoverRedeem(uint256 userTotalCollateral, uint256 userTotalDebt, uint256 amountToRedeem, uint256 HealthFactorCollateralRateThreshold);

    // RoleModule errors
    error Unauthorized(address msgSender, string role);

    // RoleStore errors
    error ThereMustBeAtLeastOneRoleAdmin();
    error ThereMustBeAtLeastOneTimelockMultiSig();

    //token
    error EmptyBurnAmounts();
    error EmptyMintAmounts();

}
