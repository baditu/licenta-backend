//SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";
import ".././interfaces/IERC721Full.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/IERC721Metadata.sol";
import ".././interfaces/Structs.sol";

import "hardhat/console.sol";

// deployed at: 0x5c71b7E64Dae588840F50106BB5Bf39090f0DcCD

interface ParkingLotI is IERC721 {

}

contract Marketplace is IERC721Receiver, Ownable, ReentrancyGuard {
    ParkingLotI public immutable parkingLot;
    IERC20 public immutable badons;

    uint256 public listPrice;

    uint16 public constant DENOMINATOR = 10_000;
    uint16 public badonsPercentageForDApp;
    address public depositForDApp;

    mapping(uint256 => ListedLot) public listedLots;

    event NFTListed(uint256 indexed _tokenId, address _owner, uint256 _price);
    event ListPriceChanged(uint256 _newPrice);
    event SetBadonsPercentageForDApp(uint256 _newPercentage);
    event SetDepositForDApp(address _newDepositForDApp);
    event CancelSellingNFT(address _owner, uint256 _tokenId);
    event NFTBought(uint256 indexed _tokenId, address _buyer, uint256 _price);

    error PriceTooSmall();
    error NotTheOwner();
    error AddressZero();
    error InvalidPercentage();
    error Unauthorized();
    error Sold();
    error NotListed();

    constructor(ParkingLotI _parkingLot, IERC20 _badons) {
        parkingLot = _parkingLot;
        badons = _badons;
    }

    function listNFT(uint256 _tokenId, uint256 _price) external nonReentrant {
        if (_price < listPrice) revert PriceTooSmall();
        if (parkingLot.ownerOf(_tokenId) != msg.sender) revert NotTheOwner();

        listedLots[_tokenId] = ListedLot({
            tokenId: _tokenId,
            owner: msg.sender,
            price: _price,
            listed: true
        });

        parkingLot.safeTransferFrom(msg.sender, address(this), _tokenId, "");

        emit NFTListed(_tokenId, msg.sender, _price);
    }

    function cancelNFT(uint256 _tokenId) external nonReentrant {
        ListedLot storage listedLot = listedLots[_tokenId];

        if (listedLot.owner != msg.sender) revert NotTheOwner();
        if (listedLot.listed == false) revert Sold();

        delete listedLots[_tokenId];

        parkingLot.safeTransferFrom(address(this), msg.sender, _tokenId, "");

        emit CancelSellingNFT(msg.sender, _tokenId);
    }

    //need to approve badons
    function buyNFT(uint256 _tokenId) external nonReentrant {
        ListedLot storage listedLot = listedLots[_tokenId];
        if (listedLot.listed == false) revert NotListed();

        uint256 totalBadonsToPay = listedLot.price;
        uint256 percentage = (totalBadonsToPay * badonsPercentageForDApp) /
            DENOMINATOR;

        totalBadonsToPay -= percentage;

        badons.transferFrom(msg.sender, depositForDApp, percentage);
        badons.transferFrom(msg.sender, listedLot.owner, totalBadonsToPay);

        parkingLot.safeTransferFrom(address(this), msg.sender, _tokenId, "");

        delete listedLots[_tokenId];

        emit NFTBought(_tokenId, msg.sender, totalBadonsToPay);
    }

    function isLotInMarket(
        uint256 _tokenId
    ) external view returns (ListedLot memory) {
        return listedLots[_tokenId];
    }

    function onERC721Received(
        address _operator,
        address,
        uint256,
        bytes calldata
    ) external view returns (bytes4) {
        if (_operator != address(this)) revert Unauthorized();
        return this.onERC721Received.selector;
    }

    function setListPrice(uint256 _listPrice) external onlyOwner {
        listPrice = _listPrice;

        emit ListPriceChanged(_listPrice);
    }

    function setBadonsPercentageForDApp(
        uint16 _newPercentage
    ) external onlyOwner {
        if (_newPercentage > 1_000) {
            revert InvalidPercentage();
        }

        badonsPercentageForDApp = _newPercentage;

        emit SetBadonsPercentageForDApp(_newPercentage);
    }

    function setDepositForDApp(address _newDepositForDApp) external onlyOwner {
        if (_newDepositForDApp == address(0)) {
            revert AddressZero();
        }
        depositForDApp = _newDepositForDApp;
        emit SetDepositForDApp(_newDepositForDApp);
    }
}
