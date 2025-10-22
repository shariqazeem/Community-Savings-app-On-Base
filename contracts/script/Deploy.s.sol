// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../contracts/RizqFi.sol";

contract DeployScript is Script {
    function run() external {
        uint256 deployerKey = vm.envUint("PRIVATE_KEY");
        address usdc = 0x036CbD53842c5426634e7929541eC2318f3dCF7e; // Base Sepolia USDC
        
        vm.startBroadcast(deployerKey);
        RizqFi rizqfi = new RizqFi(usdc);
        vm.stopBroadcast();
        
        console.log("Deployed to:", address(rizqfi));
    }
}