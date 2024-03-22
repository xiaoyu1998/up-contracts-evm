// SPDX-License-Identifier: BUSL-1.1

pragma solidity ^0.8.20;

import "../token/ScaledToken.sol";
import "../bank/Bank.sol";

// @title PoolToken
// @dev The pool token for a pool, stores funds for the pool and keeps track
// of the liquidity owners
contract PoolToken is ScaledToken, Bank {
	address internal _underlyingAsset;
	// address internal _poolKey;

    mapping(address => uint256) private _Collaterals;
	uint256 private _totalCollateral;

    constructor(
    	RoleStore _roleStore, 
    	DataStore _dataStore,
    	address underlyingAsset_
    ) ScaledToken("UF_POOL_TOKEN", "UF_POOL_TOKEN") Bank(_roleStore, _dataStore) {
    	_underlyingAsset = underlyingAsset_;
    }

	/// @inheritdoc IERC20
	function balanceOf(
	    address user
	) public view virtual override(IndexRC20) returns (uint256) {
	    return super.balanceOf(user)
	    	.rayMul(PoolUtils.getPoolNormalizedLiquidityIndex(dataStore, _underlyingAsset));
	}

	/// @inheritdoc IERC20
	function totalSupply() public view virtual override(IndexRC20) returns (uint256) {
		uint256 currentSupplyScaled = super.totalSupply();
		if (currentSupplyScaled == 0) {return 0;}
		return currentSupplyScaled
			.rayMul(PoolUtils.getPoolNormalizedLiquidityIndex(dataStore, _underlyingAsset));
	}

    // @dev mint pool tokens to an account
    // @param account the account to mint to
    // @param amount the amount of tokens to mint
    function mint(
    	address to, 
    	uint256 amount, 
    	uint256 index
    ) external virtual override  onlyController returns (bool) {
      	return _mintScaled(pool, to, amount, index);
    }

    // @dev burn pool tokens from an account
    // @param account the account to burn tokens for
    // @param amount the amount of tokens to burn
    function burn(
    	address from, 
    	address to, 
    	uint256 amount, 
    	uint256 index
    ) external virtual override onlyController returns (bool) {
		_burnScaled(pool, from, to, amount, index);
		if (to != address(this)) {
	         //TODO move to validation module
	         uint256 availableBalance = totalUnderlyingAssetBalanceSubstractionTotalCollateral();
			 if (amount > availableBalance){
			 	 revert Errors.InsufficientBalanceAfterSubstractionCollateral(amount, availableBalance);
			 }

			 IERC20(_underlyingAsset).safeTransfer(to, amount);
		}       
    }

	/// @inheritdoc IPoolToken
	function transferOnLiquidation(
		address from,
		address to,
		uint256 amount
	) external virtual override onlyController {
		// Being a normal transfer, the Transfer() and BalanceTransfer() are emitted
		// so no need to emit a specific event here
		_transfer(from, to, amount, false);
	}

	function _transfer(
		address from, 
		address to, 
		uint128 amount
	) internal virtual override {
		_transfer(from, to, amount, true);
	}


	function _transfer(
		address from, 
		address to, 
		uint256 amount, 
		bool validate
	) internal virtual override{
		address underlyingAsset = _underlyingAsset;

		//Pool.Props memory pool = PoolStoreUtils.get(dataStore, _poolKey)
		// if(pool == null){
		// 	revert erros.PoolNotFound(_poolKey);
		// }
		uint256 index = PoolUtils.getPoolNormalizedLiquidityIndex(dataStore, _poolKey);

		// uint256 fromBalanceBefore = super.balanceOf(from).rayMul(index);
		// uint256 toBalanceBefore = super.balanceOf(to).rayMul(index);

		super._transfer(from, to, amount, index);

		// if (validate) {
		//   POOL.finalizeTransfer(underlyingAsset, from, to, amount, fromBalanceBefore, toBalanceBefore);
		// }
		emit BalanceTransfer(from, to, amount.rayDiv(index), index);
	}

	function underlyingAsset() public view returns (address) {
		return _underlyingAsset;
	}

	function addCollateral(
		address account, 
		uint256 amount
	) public onlyController {
        _Collaterals[account] = _Collaterals[account] + amount;
        _totalCollateral   = _totalCollateral + amount;
	}

	function removeCollateral(
		address account, 
		uint256 amount
	) public onlyController {
		if( _Collaterals[account] < amount){
			revert Errors.InsufficientCollateralAmount(amount, _Collaterals[account]);
		}
        _Collaterals[account] = _Collaterals[account] - amount;
        _totalCollateral   = _totalCollateral - amount;
	}

	function balanceOfCollateral(
		address account
	) public view  returns (uint256)   {
		return _Collaterals[account];
	}

	function totalCollateral() public view  returns (uint256) {
		return _totalCollateral;
	}

	function totalUnderlyingAssetBalanceSubstractionTotalCollateral() public view returns (uint256) {
		return IERC20(_underlyingAsset).balanceOf(address(this)) - totalCollateral();
	}


}