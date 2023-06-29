import {task} from "hardhat/config"
import { TaskArguments } from "hardhat/types"
import { Marketplace } from "../typechain/contracts/Marketplace.sol";
import { Marketplace__factory } from "../typechain/factories/contracts/Marketplace.sol/Marketplace__factory"

task("deploy:Marketplace")
 .setAction(async function (taskArguments: TaskArguments, { ethers }) {
   const MarketplaceFactory: Marketplace__factory = <Marketplace__factory>(
     await ethers.getContractFactory("Marketplace")
   );
   const Marketplace: Marketplace = <Marketplace>(
     await MarketplaceFactory.deploy("0x843C2538724f4D595a905d1Ea937361934D209a9", "0x5c71b7E64Dae588840F50106BB5Bf39090f0DcCD")
   );
   await Marketplace.deployed();
   console.log("Marketplace deployed to: ", Marketplace.address);
 });