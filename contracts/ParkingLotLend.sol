//SPDX-License-Identifier: MIT

pragma solidity ^0.8.17;

import "@openzeppelin/contracts/access/AccessControlEnumerable.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

import "hardhat/console.sol";

// contract deployed at: 0x2952e5f3880B00d0b822Ff9a6a9E152a37563A7D on mumbai

interface LendingMarketI {
  function beforeTransferHookParking(
    address _from,
    address _to,
    uint256 _tokenId
  ) external;

  function afterTransferHookParking(
    address,
    address _to,
    uint256 _tokenId
  ) external;

  function getLotUri(uint256 _tokenId) external view returns (string memory);
}

contract ParkingLotLend is AccessControlEnumerable, ERC721Enumerable {
  using Strings for uint256;

  bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
  bytes32 public constant BURNER_ROLE = keccak256("BURNER_ROLE");

  LendingMarketI public lender;

  event LenderChanged(LendingMarketI _newLender);

  error Unauthorized();

  constructor() ERC721("ParkingLotLend", "LPRKL") {
    _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
    _setupRole(MINTER_ROLE, msg.sender);
    _setupRole(BURNER_ROLE, msg.sender);
  }

  function setLender(
    LendingMarketI _lender
  ) external onlyRole((DEFAULT_ADMIN_ROLE)) {
    lender = _lender;

    emit LenderChanged(_lender);
  }

  function mint(address _owner, uint256 _tokenId) external {
    if (!hasRole(MINTER_ROLE, msg.sender) && msg.sender != address(lender))
      revert Unauthorized();

    _mint(_owner, _tokenId);
  }

  function burn(uint256 _tokenId) external {
    if (!hasRole(BURNER_ROLE, msg.sender) && msg.sender != address(lender))
      revert Unauthorized();
    _burn(_tokenId);
  }

  function exists(uint256 _tokenId) public view returns (bool) {
    return _exists(_tokenId);
  }

  function tokensOfOwner(
    address _owner
  ) external view returns (uint256[] memory) {
    uint256 tokenCount = balanceOf(_owner);
    if (tokenCount == 0) {
      // Return an empty array
      return new uint256[](0);
    } else {
      uint256[] memory result = new uint256[](tokenCount);
      uint256 index;
      for (index = 0; index < tokenCount; index++) {
        result[index] = tokenOfOwnerByIndex(_owner, index);
      }
      return result;
    }
  }

  function tokenURI(
    uint256 _tokenId
  ) public view virtual override returns (string memory) {
    return lender.getLotUri(_tokenId);
  }

  function _beforeTokenTransfer(
    address _from,
    address _to,
    uint256 _tokenId
  ) internal virtual {
    lender.beforeTransferHookParking(_from, _to, _tokenId);
    super._beforeTokenTransfer(_from, _to, _tokenId, 0);
  }

  function _afterTokenTransfer(
    address _from,
    address _to,
    uint256 _tokenId
  ) internal {
    lender.afterTransferHookParking(_from, _to, _tokenId);
    super._afterTokenTransfer(_from, _to, _tokenId, 0);
  }

  function supportsInterface(
    bytes4 interfaceId
  )
    public
    view
    virtual
    override(ERC721Enumerable, AccessControlEnumerable)
    returns (bool)
  {
    if (
      interfaceId == type(ERC721Enumerable).interfaceId ||
      interfaceId == type(AccessControlEnumerable).interfaceId ||
      interfaceId == type(AccessControl).interfaceId
    ) return true;

    return super.supportsInterface(interfaceId);
  }
}
