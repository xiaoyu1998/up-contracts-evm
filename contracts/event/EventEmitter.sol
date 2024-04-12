// SPDX-License-Identifier: BUSL-1.1

pragma solidity ^0.8.0;

import "../role/RoleModule.sol";

// @title EventEmitter
// @dev Contract to emit events
// This allows main events to be emitted from a single contract
contract EventEmitter is RoleModule {

    event Supply(
        address indexed pool,
        address supplier,
        address indexed to,
        uint256 amount
    );

    event Withdraw(
        address indexed pool, 
        address indexed withdrawer, 
        address indexed to, 
        uint256 amount
    );

    event Deposit(
        address indexed pool,
        address depositer,
        //address indexed to,
        uint256 amount
    );

    event Redeem(
        address indexed pool,
        address indexed redeemer,
        address indexed to,
        uint256 amount
    );

    event Borrow(
        address indexed pool,
        address borrower,
        //address indexed to,
        uint256 amount,
        uint256 borrowRate
    );

    event Repay(
        address indexed pool,
        // address indexed to,
        address indexed repayer,
        uint256 amount,
        bool useCollateral
    );


    constructor(RoleStore _roleStore) RoleModule(_roleStore) {}

    // @dev emit a general event log
    // @param eventName the name of the event
    function emitSupply(
        address underlyingAsset,
        address account,
        address to,
        uint256 supplyAmount
    ) external onlyController {
        emit Supply(
            underlyingAsset,
            account,
            to,
            supplyAmount
        );
    }

    function emitWithdraw(
        address underlyingAsset,
        address account,
        address to,
        uint256 withdrawAmount
    ) external onlyController {
        emit Withdraw(
            underlyingAsset,
            account,
            to,
            withdrawAmount
        );
    }

    function emitDeposit(
        address underlyingAsset,
        address account,
        uint256 depositAmount
    ) external onlyController {
        emit Deposit(
            underlyingAsset,
            account,
            depositAmount
        );
    }

    function emitRedeem(
        address underlyingAsset,
        address account,
        address to,
        uint256 redeemAmount
    ) external onlyController {
        emit Redeem(
            underlyingAsset,
            account,
            to,
            redeemAmount
        );
    }

    function emitBorrow(
        address underlyingAsset,
        address account,
        uint256 borrowAmount,
        uint256 borrowRate
    ) external onlyController {
        emit Borrow(
            underlyingAsset,
            account,
            borrowAmount,
            borrowRate
        );
    }

    function emitRepay(
        address underlyingAsset,
        address repayer,
        uint256 repayAmount,
        bool useCollateral
    ) external onlyController {
        emit Repay(
            underlyingAsset,
            repayer,
            repayAmount,
            useCollateral
        );
    }


}