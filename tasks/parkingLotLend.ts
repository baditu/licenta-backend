import {task} from "hardhat/config"
import { TaskArguments } from "hardhat/types"
import { ParkingLotLend } from "../typechain/contracts/ParkingLotLend.sol";
import { ParkingLotLend__factory } from "../typechain/factories/contracts/ParkingLotLend.sol/ParkingLotLend__factory"

task("deploy:ParkingLotLend")
 .setAction(async function (taskArguments: TaskArguments, { ethers }) {
   const ParkingLotLendFactory: ParkingLotLend__factory = <ParkingLotLend__factory>(
     await ethers.getContractFactory("ParkingLotLend")
   );
   const ParkingLotLend: ParkingLotLend = <ParkingLotLend>(
     await ParkingLotLendFactory.deploy()
   );
   await ParkingLotLend.deployed();
   console.log("ParkingLotLend deployed to: ", ParkingLotLend.address);
 });