// SPDX-License-Identifier: BUSL-1.1

pragma solidity ^0.8.0;

import "../role/RoleModule.sol";
import "../utils/GlobalReentrancyGuard.sol";
import "./IWithdrawalHandler.sol";
import "../withdrawal/ExecuteWithdrawalUtils.sol";

// @title WithdrawalHandler
// @dev Contract to handle execution of withdrawal
contract WithdrawalHandler is IWithdrawalHandler, GlobalReentrancyGuard, RoleModule {

    constructor(
        RoleStore _roleStore,
        DataStore _dataStore,
    ) RoleModule(_roleStore) GlobalReentrancyGuard(_dataStore) {

    }

    // @dev executes a withdrawal
    // @param withdrawalParams WithdrawalUtils.WithdrawalParams
    function executeWithdrawal(
        address account,
        ExecuteWithdrawalUtils.WithdrawalParams calldata withdrawalParams
    ) external nonReentrant returns (bytes32){

        ExecuteWithdrawalUtils.ExecuteWithdrawalParams memory params = ExecuteWithdrawalUtils.ExecuteWithdrawalParams{
           dataStore,
           withdrawalParams.poolTokenAddress;        
           withdrawalParams.asset,
           withdrawalParams.amount,
           withdrawalParams.receiver
        };

        return ExecuteWithdrawalUtils.executeWithdrawal(account, params);
    }

}
