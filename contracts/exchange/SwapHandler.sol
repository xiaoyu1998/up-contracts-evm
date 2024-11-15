// SPDX-License-Identifier: BUSL-1.1

pragma solidity ^0.8.20;

import "../role/RoleModule.sol";
import "../utils/GlobalReentrancyGuard.sol";
import "../event/EventEmitter.sol";
import "../swap/SwapUtils.sol";
import "./ISwapHandler.sol";

// @title SwapHandler
// @dev Contract to handle execution of swap
contract SwapHandler is ISwapHandler, GlobalReentrancyGuard, RoleModule {
    EventEmitter public immutable eventEmitter;

    constructor(
        RoleStore _roleStore,
        DataStore _dataStore,
        EventEmitter _eventEmitter
    ) RoleModule(_roleStore) GlobalReentrancyGuard(_dataStore) {
        eventEmitter = _eventEmitter;
    }

    // @dev executes a swap
    // @param swapParams SwapUtils.SwapParams
    function executeSwap(
        address account,
        SwapUtils.SwapParams calldata swapParams
    ) external globalNonReentrant onlyController{

        SwapUtils.ExecuteSwapParams memory params = SwapUtils.ExecuteSwapParams(
           address(dataStore),
           address(eventEmitter),
           swapParams.underlyingAssetIn,     
           swapParams.underlyingAssetOut,         
           swapParams.amount,
           swapParams.sqrtPriceLimitX96
        );

        SwapUtils.executeSwapExactIn(account, params);
    }

    // @dev executes a swapExactOut
    // @param swapParams SwapUtils.SwapParams
    function executeSwapExactOut(
        address account,
        SwapUtils.SwapParams calldata swapParams
    ) external globalNonReentrant onlyController{

        SwapUtils.ExecuteSwapParams memory params = SwapUtils.ExecuteSwapParams(
           address(dataStore),
           address(eventEmitter),
           swapParams.underlyingAssetIn,     
           swapParams.underlyingAssetOut,         
           swapParams.amount,
           swapParams.sqrtPriceLimitX96
        );

        SwapUtils.executeSwapExactOut(account, params);
    }

}
