import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";
import { roleStoreModule } from "./deployRoleStore"
import { dataStoreModule } from "./deployDataStore"
import { poolStoreUtilsModule } from "./deployPoolStoreUtils"
// import * as keys from "../../utils/keys";

export const configModule = buildModule("Config", (m) => {
    const { roleStore } = m.useModule(roleStoreModule)
    const { dataStore } = m.useModule(dataStoreModule)
    const { poolStoreUtils } = m.useModule(poolStoreUtilsModule)

    const config = m.contract("Config", [roleStore, dataStore], {
        libraries: {
            PoolStoreUtils: poolStoreUtils
        },
    });
    // m.call(roleStore, "grantRole",  [config, keys.CONTROLLER]);

    return { config };
});

//export default configModule;