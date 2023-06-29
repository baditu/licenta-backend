import { time, loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";
import { expect } from "chai";
import { ethers } from "hardhat";
import { keccak256 } from "ethers/lib/utils";

xdescribe("Badon Token for governance", async () => {
  let BadonFactory: any;
  let BadonContract: any;
  let owner: any;
  let user: any;

  before(async () => {
    [owner, user] = await ethers.getSigners();

    BadonFactory = await ethers.getContractFactory("Badon", owner);
  });

  beforeEach(async () => {
    BadonContract = await BadonFactory.deploy();
  });

  describe("Token must have name and symbol", async () => {
    it("Name must be equal to Badon", async () => {
      expect(await BadonContract.name()).to.be.equals("Badon");
    });

    it("Symbol must be equal to BAD", async () => {
      expect(await BadonContract.symbol()).to.be.equals("BAD");
    });
  });

  describe("Owner must have all privileges.", async () => {
    it("Should have MINTER_ROLE", async () => {
      expect(
        await BadonContract.connect(owner).hasRole(
          "0x9f2df0fed2c77648de5860a4cc508cd0818c85b8b8a1ab4ceeef8d981c8956a6",
          owner.address
        )
      ).to.be.true;
    });

    it("Should have BURNER_ROLE", async () => {
      expect(
        await BadonContract.connect(owner).hasRole(
          "0x3c11d16cbaffd01df69ce1c404f6340ee057498f5f00246190ea54220576a848",
          owner.address
        )
      ).to.be.true;
    });
  });

  describe("Can mint and burn only addresses with specific role", async () => {
    it("Only MINTER_ROLE can mint", async () => {
      await expect(BadonContract.connect(owner).mint(owner.address, 1))
        .to.emit(BadonContract, "Transfer")
        .withArgs(ethers.constants.AddressZero, owner.address, 1);

      await expect(BadonContract.connect(user).mint(user.address, 1)).to.be
        .reverted;
    });

    it("Only BURNER_ROLE can burn", async () => {
      await BadonContract.connect(owner).mint(owner.address, 1);

      await expect(BadonContract.connect(owner).burn(owner.address, 1))
        .to.emit(BadonContract, "Transfer")
        .withArgs(owner.address, ethers.constants.AddressZero, 1);

      await expect(BadonContract.connect(user).burn(user.address, 1)).to.be
        .reverted;
    });

    it("Owner can mint and burn for an user", async () => {
      await BadonContract.connect(owner).mint(user.address, 5);

      expect(await BadonContract.balanceOf(user.address)).to.be.equals(5);

      await BadonContract.connect(owner).burn(user.address, 2);

      expect(await BadonContract.balanceOf(user.address)).to.be.equals(3);
    });
  });
});
