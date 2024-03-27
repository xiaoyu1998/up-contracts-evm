import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";
import { poolStoreUtilsModule } from "./deployPoolStoreUtils"
import { positionStoreUtilsModule } from "./deployPositionStoreUtils"
import { feeUtilsModule } from "./deployFeeUtils"
import { configStoreUtilsModule } from "./deployConfigStoreUtils"
import { oracleStoreUtilsModule } from "./deployOracleStoreUtils"

export const redeemUtilsModule = buildModule("RedeemUtils", (m) => {
    const { poolStoreUtils } = m.useModule(poolStoreUtilsModule)
    const { positionStoreUtils } = m.useModule(positionStoreUtilsModule)
  //  const { feeUtils } = m.useModule(feeUtilsModule)
    const { configStoreUtils } = m.useModule(configStoreUtilsModule)
    const { oracleStoreUtils } = m.useModule(oracleStoreUtilsModule)

    const redeemUtils = m.library("RedeemUtils", {
        libraries: {
            PoolStoreUtils: poolStoreUtils,
            PositionStoreUtils: positionStoreUtils,
   //         FeeUtils: feeUtils,
            ConfigStoreUtils: configStoreUtils,
            OracleStoreUtils: oracleStoreUtils,
        },      
    });

    return { redeemUtils };
});

// export default redeemHandlerModule;