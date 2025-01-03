// SPDX-License-Identifier: BUSL-1.1

pragma solidity ^0.8.20;

import "../role/RoleModule.sol";
import "../data/DataStore.sol";
import "../error/Errors.sol";

import "./Pool.sol";
import "./PoolStoreUtils.sol";
// import "./PoolConfigurationUtils.sol";
import "./PoolUtils.sol";
import "../token/PoolToken.sol";
import "../token/DebtToken.sol";

import "../chain/Chain.sol";
// @title PoolFactory
// @dev Contract to create pools
contract PoolFactory is RoleModule {
    using Pool for Pool.Props;

    DataStore public immutable dataStore;

    constructor(
        RoleStore _roleStore,
        DataStore _dataStore
    ) RoleModule(_roleStore) {
        dataStore = _dataStore;
    }

    // @dev creates a pool
    function createPool(
        address underlyingAsset,
        address interestRateStrategy,
        uint256 configuration
    ) external onlyPoolKeeper returns (Pool.Props memory) {
        address poolKey = Keys.poolKey(underlyingAsset);

        Pool.Props memory existingPool = PoolStoreUtils.get(address(dataStore), poolKey);
        if (existingPool.poolToken != address(0)) {
            revert Errors.PoolAlreadyExists(poolKey, existingPool.poolToken);
        }

        PoolToken poolToken = new PoolToken(roleStore, dataStore, underlyingAsset);
        DebtToken debtToken = new DebtToken(roleStore, dataStore, underlyingAsset);

        Pool.Props memory pool = Pool.Props(
            PoolStoreUtils.setKeyAsId(address(dataStore), poolKey),
        	WadRayMath.RAY,
            0,
            WadRayMath.RAY,
            0,
            interestRateStrategy,
            underlyingAsset,
            address(poolToken),
            address(debtToken),
            configuration,
            0,
            0,
            Chain.currentTimestamp()
        );

        PoolStoreUtils.set(address(dataStore), poolKey, pool);
        return pool;
    }

}
