// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IERC20 {
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
    function transfer(address to, uint256 amount) external returns (bool);
}

contract RizqFi {
    IERC20 public immutable USDC;
    
    enum Phase { Joining, Deposit, Payout, Completed }
    
    struct Committee {
        address creator;
        string name;
        uint256 contributionAmount;
        uint8 maxMembers;
        uint8 currentMembers;
        uint256 roundDuration;
        uint256 startDate;
        uint256 nextRoundDate;
        uint8 currentRound;
        uint8 depositsThisRound;
        uint8 nextPayoutIndex;
        Phase phase;
        bool isActive;
        bool isCompleted;
        bytes32 inviteCode;
        bool isPrivate;
    }
    
    struct Member {
        address wallet;
        uint256 totalContributed;
        bool hasReceivedPayout;
        bool hasDepositedCurrentRound;
        bool isActive;
        uint256 joinedAt;
    }
    
    uint256 public committeeCount;
    mapping(uint256 => Committee) public committees;
    mapping(uint256 => mapping(address => Member)) public members;
    mapping(uint256 => address[]) public memberList;
    mapping(uint256 => mapping(address => bool)) public isCreatorOrMember;
    
    event CommitteeCreated(uint256 indexed id, address creator, string name, bool isPrivate);
    event MemberJoined(uint256 indexed committeeId, address member, uint256 amount);
    event ContributionMade(uint256 indexed committeeId, address member, uint256 round);
    event PayoutDistributed(uint256 indexed committeeId, address recipient, uint256 amount, uint256 round);
    event PhaseChanged(uint256 indexed committeeId, Phase newPhase, uint8 round);
    
    error InvalidParameters();
    error NotInJoiningPhase();
    error CommitteeFull();
    error AlreadyMember();
    error TransferFailed();
    error NotInDepositPhase();
    error NotMember();
    error AlreadyDeposited();
    error NotInPayoutPhase();
    error NotCreator();
    error PayoutAlreadyReceived();
    error InsufficientBalance();
    error InvalidInviteCode();
    error NotAuthorized();
    
    constructor(address _usdc) {
        USDC = IERC20(_usdc);
    }
    
    function createCommittee(
        string memory _name,
        uint256 _contributionAmount,
        uint8 _maxMembers,
        uint256 _roundDuration,
        uint256 _startDate,
        bool _isPrivate
    ) external returns (uint256, bytes32) {
        if (_maxMembers < 3 || _maxMembers > 20) revert InvalidParameters();
        if (_contributionAmount == 0) revert InvalidParameters();
        if (_roundDuration < 1 days) revert InvalidParameters();
        
        uint256 id = committeeCount++;
        
        // Generate unique invite code
        bytes32 inviteCode = keccak256(abi.encodePacked(
            id,
            msg.sender,
            block.timestamp,
            _name
        ));
        
        committees[id] = Committee({
            creator: msg.sender,
            name: _name,
            contributionAmount: _contributionAmount,
            maxMembers: _maxMembers,
            currentMembers: 0,
            roundDuration: _roundDuration,
            startDate: _startDate,
            nextRoundDate: _startDate,
            currentRound: 1,
            depositsThisRound: 0,
            nextPayoutIndex: 0,
            phase: Phase.Joining,
            isActive: false,
            isCompleted: false,
            inviteCode: inviteCode,
            isPrivate: _isPrivate
        });
        
        // Mark creator as authorized
        isCreatorOrMember[id][msg.sender] = true;
        
        emit CommitteeCreated(id, msg.sender, _name, _isPrivate);
        return (id, inviteCode);
    }
    
    function joinCommittee(uint256 _id, bytes32 _inviteCode) external {
        Committee storage c = committees[_id];
        
        // Check invite code for private committees
        if (c.isPrivate && c.inviteCode != _inviteCode) revert InvalidInviteCode();
        
        if (c.phase != Phase.Joining) revert NotInJoiningPhase();
        if (c.currentMembers >= c.maxMembers) revert CommitteeFull();
        if (members[_id][msg.sender].wallet != address(0)) revert AlreadyMember();
        
        if (!USDC.transferFrom(msg.sender, address(this), c.contributionAmount)) {
            revert TransferFailed();
        }
        
        members[_id][msg.sender] = Member({
            wallet: msg.sender,
            totalContributed: c.contributionAmount,
            hasReceivedPayout: false,
            hasDepositedCurrentRound: true,
            isActive: true,
            joinedAt: block.timestamp
        });
        
        memberList[_id].push(msg.sender);
        isCreatorOrMember[_id][msg.sender] = true;
        c.currentMembers++;
        c.depositsThisRound++;
        
        emit MemberJoined(_id, msg.sender, c.contributionAmount);
        
        // Auto-transition to Payout phase when committee is full
        if (c.currentMembers == c.maxMembers) {
            c.phase = Phase.Payout;
            c.isActive = true;
            emit PhaseChanged(_id, Phase.Payout, c.currentRound);
        }
    }
    
    function contribute(uint256 _id) external {
        Committee storage c = committees[_id];
        Member storage m = members[_id][msg.sender];
        
        if (c.phase != Phase.Deposit) revert NotInDepositPhase();
        if (!m.isActive) revert NotMember();
        if (m.hasDepositedCurrentRound) revert AlreadyDeposited();
        
        if (!USDC.transferFrom(msg.sender, address(this), c.contributionAmount)) {
            revert TransferFailed();
        }
        
        m.totalContributed += c.contributionAmount;
        m.hasDepositedCurrentRound = true;
        c.depositsThisRound++;
        
        emit ContributionMade(_id, msg.sender, c.currentRound);
        
        // Auto-transition to Payout phase when all deposits received
        if (c.depositsThisRound == c.currentMembers) {
            c.phase = Phase.Payout;
            emit PhaseChanged(_id, Phase.Payout, c.currentRound);
        }
    }
    
    function distributePayout(uint256 _id) external {
        Committee storage c = committees[_id];
        
        if (c.phase != Phase.Payout) revert NotInPayoutPhase();
        if (msg.sender != c.creator) revert NotCreator();
        
        address recipient = memberList[_id][c.nextPayoutIndex];
        if (members[_id][recipient].hasReceivedPayout) revert PayoutAlreadyReceived();
        
        uint256 payout = c.contributionAmount * c.maxMembers;
        
        if (!USDC.transfer(recipient, payout)) {
            revert TransferFailed();
        }
        
        members[_id][recipient].hasReceivedPayout = true;
        
        emit PayoutDistributed(_id, recipient, payout, c.currentRound);
        
        c.nextPayoutIndex++;
        
        // Check if committee is completed
        if (c.nextPayoutIndex >= c.maxMembers) {
            c.phase = Phase.Completed;
            c.isCompleted = true;
            c.isActive = false;
            emit PhaseChanged(_id, Phase.Completed, c.currentRound);
            return;
        }
        
        // Start next round
        c.currentRound++;
        c.depositsThisRound = 0;
        c.nextRoundDate = block.timestamp + c.roundDuration;
        c.phase = Phase.Deposit;
        emit PhaseChanged(_id, Phase.Deposit, c.currentRound);
        
        // Reset deposit flags for all members
        address[] memory list = memberList[_id];
        for (uint8 i = 0; i < list.length; i++) {
            members[_id][list[i]].hasDepositedCurrentRound = false;
        }
    }
    
    // View functions
    function getMembers(uint256 _id) external view returns (address[] memory) {
        return memberList[_id];
    }
    
    function getMemberInfo(uint256 _id, address _member) external view returns (Member memory) {
        return members[_id][_member];
    }
    
    function getCommitteeDetails(uint256 _id) external view returns (
        Committee memory committee,
        address[] memory memberAddresses,
        uint256 contractBalance
    ) {
        return (
            committees[_id],
            memberList[_id],
            address(this).balance
        );
    }
    
    function canViewCommittee(uint256 _id, address _user) external view returns (bool) {
        Committee storage c = committees[_id];
        if (!c.isPrivate) return true;
        return isCreatorOrMember[_id][_user];
    }
    
    function verifyInviteCode(uint256 _id, bytes32 _inviteCode) external view returns (bool) {
        return committees[_id].inviteCode == _inviteCode;
    }
    
    function canJoin(uint256 _id, address _user) external view returns (bool) {
        Committee storage c = committees[_id];
        return c.phase == Phase.Joining && 
               c.currentMembers < c.maxMembers && 
               members[_id][_user].wallet == address(0);
    }
    
    function canContribute(uint256 _id, address _user) external view returns (bool) {
        Committee storage c = committees[_id];
        Member storage m = members[_id][_user];
        return c.phase == Phase.Deposit && 
               m.isActive && 
               !m.hasDepositedCurrentRound;
    }
    
    function canDistribute(uint256 _id, address _user) external view returns (bool) {
        Committee storage c = committees[_id];
        return c.phase == Phase.Payout && 
               _user == c.creator &&
               c.depositsThisRound == c.currentMembers;
    }
    
    // Emergency function for creator to rescue funds if committee fails
    function emergencyWithdraw(uint256 _id) external {
        Committee storage c = committees[_id];
        require(msg.sender == c.creator, "Not creator");
        require(block.timestamp > c.nextRoundDate + (c.roundDuration * 2), "Too early");
        require(!c.isCompleted, "Already completed");
        
        // Return funds proportionally to members who contributed
        address[] memory list = memberList[_id];
        for (uint8 i = 0; i < list.length; i++) {
            Member storage m = members[_id][list[i]];
            if (m.totalContributed > 0 && m.isActive) {
                USDC.transfer(list[i], m.totalContributed);
                m.totalContributed = 0;
            }
        }
        
        c.isActive = false;
        c.isCompleted = true;
    }
}