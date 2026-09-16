// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract PromptMint {
    struct Prompt {
        address creator;
        string metadataURI;
        uint256 price;
        bool active;
    }

    uint256 public promptCount;
    mapping(uint256 => Prompt) public prompts;
    mapping(uint256 => mapping(address => bool)) public hasAccess;

    event PromptRegistered(uint256 indexed promptId, address indexed creator, string metadataURI, uint256 price);
    event PromptPurchased(uint256 indexed promptId, address indexed buyer, uint256 amount);
    event CreatorTipped(uint256 indexed promptId, address indexed tipper, uint256 amount);

    function registerPrompt(string calldata metadataURI, uint256 price) external returns (uint256 promptId) {
        require(bytes(metadataURI).length > 0, "metadata required");
        promptId = ++promptCount;
        prompts[promptId] = Prompt(msg.sender, metadataURI, price, true);
        emit PromptRegistered(promptId, msg.sender, metadataURI, price);
    }

    function purchasePrompt(uint256 promptId) external payable {
        Prompt memory prompt = prompts[promptId];
        require(prompt.active, "prompt unavailable");
        require(msg.value == prompt.price, "incorrect price");
        require(msg.sender != prompt.creator, "creator cannot purchase");
        hasAccess[promptId][msg.sender] = true;
        (bool paid, ) = payable(prompt.creator).call{value: msg.value}("");
        require(paid, "payout failed");
        emit PromptPurchased(promptId, msg.sender, msg.value);
    }

    function tipCreator(uint256 promptId) external payable {
        Prompt memory prompt = prompts[promptId];
        require(prompt.active, "prompt unavailable");
        require(msg.value > 0, "tip required");
        (bool paid, ) = payable(prompt.creator).call{value: msg.value}("");
        require(paid, "tip failed");
        emit CreatorTipped(promptId, msg.sender, msg.value);
    }

    function setPromptActive(uint256 promptId, bool active) external {
        require(prompts[promptId].creator == msg.sender, "not creator");
        prompts[promptId].active = active;
    }
}
