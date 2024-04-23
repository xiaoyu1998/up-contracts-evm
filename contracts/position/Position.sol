// SPDX-License-Identifier: BUSL-1.1

pragma solidity ^0.8.20;
import "../pool/PoolConfigurationUtils.sol";

library Position {
    // enum PositionType {
    //     None,
    //     Long,
    //     Short
    // }
    uint256 public constant PositionTypeShort = 0;
    uint256 public constant PositionTypeLong = 1;
    uint256 public constant PositionTypeNone = 2;

    struct Props {
        address account;
        address underlyingAsset;
        uint256 entryLongPrice;
        uint256 accLongAmount;
        uint256 entryShortPrice;
        uint256 accShortAmount;
        // PositionType positionType;
        uint256 positionType;//None 0 Long 1 Short 2
        bool hasCollateral;
        bool hasDebt;

        // bool isLiquidated;
        // uint256 liquidationPrice;
    }
    
}
