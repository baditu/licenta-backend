import { expect } from "chai";
import exp from "constants";
import { BigNumber } from "ethers";
import { ethers } from "hardhat";

xdescribe("ParkingLot NFTs collection", async () => {
  let ParkingLotFactory: any;
  let ParkingLotContract: any;
  let owner: any;
  let user: any;

  before(async () => {
    [owner, user] = await ethers.getSigners();

    ParkingLotFactory = await ethers.getContractFactory("ParkingLot", owner);
  });

  beforeEach(async () => {
    ParkingLotContract = await ParkingLotFactory.deploy();
  });

  describe("Collection must have name and symbol", async () => {
    it("Name must be equal to ParkingLot", async () => {
      expect(await ParkingLotContract.name()).to.be.equals("ParkingLot");
    });

    it("Symbol must be equal to BAD", async () => {
      expect(await ParkingLotContract.symbol()).to.be.equals("PRKL");
    });
  });

  describe("Get and set baseURI", async () => {
    it("Should be able to set the baseURI", async () => {
      await expect(
        ParkingLotContract.connect(owner).setBaseURI(
          "https://ipfs:ana_are_mere.com"
        )
      )
        .to.emit(ParkingLotContract, "BaseURIChanged")
        .withArgs("https://ipfs:ana_are_mere.com");

      await expect(
        ParkingLotContract.connect(user).setBaseURI(
          "https://ipfs:ana_are_mere.com"
        )
      ).to.revertedWith("Ownable: caller is not the owner");
    });

    it("Should be able to get the baseURI", async () => {
      expect(await ParkingLotContract.baseURI()).to.be.equals("");

      await ParkingLotContract.connect(owner).setBaseURI(
        "https://ipfs:ana_are_mere.com"
      );

      console.log(await ParkingLotContract.baseURI());

      expect(await ParkingLotContract.baseURI()).to.be.equals(
        "https://ipfs:ana_are_mere.com"
      );
    });

    it("Should be able to compute a baseURI + tokenId for assets and get tokenURI", async () => {
      await ParkingLotContract.connect(owner).safeMint(user.address);
      await ParkingLotContract.connect(owner).safeMint(user.address);

      await ParkingLotContract.connect(owner).setBaseURI(
        "https://ipfs:ana_are_mere.com/"
      );

      expect(await ParkingLotContract.tokenURI(0)).to.be.equals(
        "https://ipfs:ana_are_mere.com/0.json"
      );
      expect(await ParkingLotContract.tokenURI(1)).to.be.equals(
        "https://ipfs:ana_are_mere.com/1.json"
      );
    });
  });

  describe("Mint function", async () => {
    it("Only owner can mint", async () => {
      await expect(ParkingLotContract.connect(owner).safeMint(owner.address))
        .to.emit(ParkingLotContract, "Transfer")
        .withArgs(ethers.constants.AddressZero, owner.address, 0);

      await expect(ParkingLotContract.connect(user).safeMint(user.address)).to
        .be.reverted;
    });

    it("Owner can mint for 4 times and the display the balance of users", async () => {
      await ParkingLotContract.connect(owner).safeMint(user.address);
      await ParkingLotContract.connect(owner).safeMint(user.address);
      await ParkingLotContract.connect(owner).safeMint(user.address);
      await ParkingLotContract.connect(owner).safeMint(user.address);

      console.log(await ParkingLotContract.tokensOfOwner(user.address));

      expect(await ParkingLotContract.balanceOf(user.address)).to.be.equals(4);
    });
  });

  describe("Burn function", async () => {
    it("Only owner can burn nfts", async () => {
      await ParkingLotContract.connect(owner).safeMint(owner.address);
      await ParkingLotContract.connect(owner).safeMint(owner.address);

      await expect(ParkingLotContract.connect(owner).burn(1))
        .to.emit(ParkingLotContract, "Transfer")
        .withArgs(owner.address, ethers.constants.AddressZero, 1);
    });

    it("Signer can burn nfts only if the owner approve that", async () => {
      await ParkingLotContract.connect(owner).safeMint(user.address);
      await ParkingLotContract.connect(owner).safeMint(user.address);

      await ParkingLotContract.connect(user).approve(owner.address, 0);
      await ParkingLotContract.connect(owner).burn(0);
      expect(await ParkingLotContract.balanceOf(user.address)).to.be.equals(1);
    });
  });

  describe("Can mint multiple assets", async () => {
    it("Can mint 5 tokens at the same time", async () => {
      await expect(ParkingLotContract.connect(owner).mintBatch(user.address, 5))
        .to.emit(ParkingLotContract, "MintBatch")
        .withArgs(user.address, 5);

      expect(await ParkingLotContract.balanceOf(user.address)).to.be.equals(5);
    });
  });

  describe("Can return tokens of owner", async () => {
    it("Can return tokens of owner", async () => {
      await ParkingLotContract.connect(owner).mintBatch(user.address, 5);

      const tokens = await ParkingLotContract.tokensOfOwner(user.address);

      for(let i = 0; i < 5; i++) {
        expect(tokens[i]).to.be.equals(BigNumber.from(i))
      }
    });
  });
});
