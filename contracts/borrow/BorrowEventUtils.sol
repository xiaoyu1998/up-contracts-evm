// SPDX-License-Identifier: BUSL-1.1

pragma solidity ^0.8.20;

import "../event/IEventEmitter.sol";

library BorrowEventUtils {

    function emitBorrow(
        address eventEmitter,
        address underlyingAsset,
        address account,
        uint256 borrowAmount,
        uint256 borrowRate,
        uint256 collateral,
        uint256 debtScaled 
    ) external {
        IEventEmitter(eventEmitter).emitBorrow(
            underlyingAsset,
            account,
            borrowAmount,
            borrowRate,
            collateral,
            debtScaled
        );
    }

}
