// SPDX-License-Identifier: MIT
pragma solidity 0.8.9;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/*
Yes, an ICO contributor can invest during both the Seed and General phases. (Assuming they were whitelisted to participate in the seed phase.)

Limits for whitelisted investors do not increase when the general phase begins. The limits do not stack.

If a whitelisted investor invests 1000+ ether during the seed phase, they should not be allowed to invest any more during the general phase.

If they invest 1 ETH during the seed phase, their limit for the rest of the seed phase is 1499 ETH. The moment we enter the general phase, their limit is now 999 ETH. 

*/

contract SpaceCoin is ERC20, Ownable {

    bool public isTargetReached = false;
    bool public isPaused = false; // flag keep track if contributing/buying into ICO is paused by owner
    bool public isTaxable = true; //flag to decide if transfers can be taxed
    address public immutable treasury; // address for 2% taxes on transfers
    enum Phase {
        Seed,
        General,
        Open
    }
    Phase public phase = Phase.Seed; // start in Seed Phase when deployed

    uint256 public constant taxRate = 2; //percentage tax charged on all transfers in SPC - paid by sender
    uint256 public constant rate = 5; // rate of exchange 1 ETH for SPC token
    uint256 public constant cap = 500000 ether; // maximum total supply of SPC token
    uint256 public constant limitSeed = 1500 ether; //maximum ETH contribution in Seed Phase
    uint256 public constant limitGeneral = 1000 ether; // maximum ETH contribution in General Phase
    uint256 public constant targetSeed = 15000 ether; // target ETH to raise in Seed Phases
    uint256 public constant targetTotal = 30000 ether; // target total ETH to raise overall
    uint256 public totalETHContributions = 0;

    mapping(address => bool) public isWhitelisted; //track whitelisted investors for Seed Phase
    mapping(address => uint256) public contributions; //track investor ETH contributions

    event Buy(address indexed contributor, uint256 indexed amount, uint256 indexed refund);
    event PhaseUpdated(string indexed previous, string indexed current);
    event WhitelistUpdated(address indexed contributor, bool indexed status);
    event PauseUpdated(bool status);
    event TaxableUpdated(bool status);
    event Claim(address indexed claimer, uint256 indexed ethContributed, uint256 indexed tokensGranted);
    event OwnerWithdraw(address indexed to, uint256 indexed amount);

    constructor(address _treasury) ERC20("Space Coin", "SPC") {
        require(_treasury != address(0), "invalid address");
        uint256 _toMint = rate * targetTotal; //total SPC to be created for ICO
        uint256 _notMint = cap - _toMint; // remaining SPC of cap to be minted to owner initially
        treasury = _treasury;
        _mint(msg.sender, _notMint);
    }

    /// @notice function set by owner if transfers taxable
    /// @param _status bool to toggle taxation on or off
    function setTaxable(bool _status) external onlyOwner {
        isTaxable = _status;
        emit TaxableUpdated(_status);
    }

    /// @notice function set by owner to pause or unpaused buying into ico
    /// @param _status bool to toggle paused on or off
    function setPauseStatus(bool _status) external onlyOwner {
        isPaused = _status;
        emit PauseUpdated(_status);
    }

    /// @notice function set by owner to add or remove from whitelist
    /// @param _contributor address to add or remove from whitelist
    /// @param _status bool to toggle whitelisted status on or off
    function setWhitelist(address _contributor, bool _status) external onlyOwner {
        isWhitelisted[_contributor] = _status;
        emit WhitelistUpdated(_contributor, _status);
    }

    /// @notice function set by owner to change the phases of ico
    /// @param _phase input to set new Phase
    function setPhase(Phase _phase) external onlyOwner {
        require(uint8(_phase) > uint8(phase), "cant change phase backwards");
        Phase prevPhase = phase;
        phase = _phase;
        string memory prevStatus = getStringStatus(prevPhase);
        string memory currStatus = getStringStatus(_phase);
        emit PhaseUpdated(prevStatus, currStatus);
    }

    /// @notice function to get string representation of phase for event logging
    /// @param _phase enum phase to represent
    /// @return result representing the status or phase
    function getStringStatus(Phase _phase) public pure returns (string memory result) {
        if (_phase == Phase.Seed) result = "Seed";
        if (_phase == Phase.General) result = "General";
        if (_phase == Phase.Open) result = "Open";
    }

    /// @notice function to get contribution limits in each phase
    /// @return _limitContribution the contribution/ETH value limit
    function _getlimitPhase() internal view returns (uint256 _limitContribution) {
        if (phase == Phase.Seed) {
            _limitContribution = limitSeed;
        }
        if (phase == Phase.General) {
            _limitContribution = limitGeneral;
        }
        if (phase == Phase.Open) {
            _limitContribution = type(uint256).max;
        }
    }

    /// @notice function to refund if exceed target
    /// @return _refund amount to refund contributor
    function _getRefundAmount(uint256 _amount, uint256 _target) internal view returns (uint256 _refund) {
        _refund = totalETHContributions + _amount > _target ? totalETHContributions + _amount - _target : 0;
    }

    /// @notice function to contribute to ico and be able to claim SPC tokens in Open Phase
    function buy() external payable {
        // keep track amount contributed up to limit....
        require(!isPaused, "ico contributions paused");
        require(!isTargetReached,"required amount already raised");
        address _contributor = _msgSender();
        uint256 _amount = msg.value;
        uint256 _target = targetTotal;
        if (phase == Phase.Seed) {
            require(isWhitelisted[_contributor], "not whitelisted");
            _target = targetSeed;
        }
        uint256 _limit = _getlimitPhase();
        uint256 _currContributions = contributions[msg.sender];
        require(_amount + _currContributions <= _limit, "contribution above limit");
        uint256 _refund = _getRefundAmount(_amount, _target);
        uint256 _contribution = _amount - _refund;
        contributions[_contributor] += _contribution;
        totalETHContributions += _contribution;
        if (_refund > 0) {
            isTargetReached = true;
            (bool success, ) = _contributor.call{ value: _refund }("");
            // even if reenters will just make another contribution de to checks
            // additionally on reenter all effects updated before the call so no state change problems on reenter
            require(success, "error sending refund");
        }
        emit Buy(_contributor, _amount,  _refund);
    }

    /// @notice function investors to claim SPC tokens (only in Open Phase)
    function claim() external {
        //Pull pattern vs push pattern to avoid looping arrays
        require(phase == Phase.Open, "not in Open phase");
        address _contributor = _msgSender();
        require(contributions[_contributor] > 0, "do not have funds");
        uint256 _ethContributed = contributions[_contributor];
        uint256 _tokensDue = _ethContributed * rate;
        contributions[_contributor] = 0;
        _mint(_contributor, _tokensDue);
        emit Claim(_contributor, _ethContributed, _tokensDue);
    }

    /// @notice function to allow owner to withdraw ETH amount if target reached.
    /*
     ---Was not specified in specs but potential solution
    function ownerWithdraw(address _to, uint256 _amount) external onlyOwner {
        require(_to != address(0), "invalid address");
        require(_amount <= totalETHContributions, "insufficient funds");
        totalETHContributions -= _amount;
        (bool success, ) = _to.call{ value: _amount }("");
        require(success, "failed to transfer");
        emit OwnerWithdraw(_to, _amount);
    }
    */

    // @notice function to calculate and dedux tax from sender
    function _handleTaxTransfer(address _from, address _to, uint256 _amount) internal {
        uint256 _taxAmount = (_amount * taxRate) / 100;
        uint256 _amountSend = _amount - _taxAmount;
        super._transfer(_from, _to, _amountSend);
        super._transfer(_from, treasury, _taxAmount);
    }

    /// @notice function override internal _transfer to add taxation part if applicable
    function _transfer(
        address from,
        address to,
        uint256 amount
    ) internal virtual override {
        if (isTaxable) {
            _handleTaxTransfer(from, to, amount);
        } else {
            super._transfer(from, to, amount);
        }
    }
}
