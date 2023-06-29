//SPDX-License-Identifier: MIT

pragma solidity ^0.8.15;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";

interface IERC721Full is IERC721 {
    function mint(address _owner, uint256 _tokenId) external;

    function burn(uint256 _tokenId) external;
}