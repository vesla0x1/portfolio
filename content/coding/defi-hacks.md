+++
title = "DeFi Hacks Playground"
description = "Explore Ethereum hacks using **Solidity** and **Foundry**."
draft = false
date = "2024-03-01"

[taxonomies]
tags = ["coding", "solidity", "foundry", "defi hacks"]

[extra]
category = "Personal projects"
home_feed_label = "Personal project"
+++

**[Github](https://github.com/vesla0x1/defi-hacks)**

This is a playground for me to learn and practice smart contract security by replaying (in)famous Ethereum transactions, similar to [DeFi Hack Labs](https://github.com/SunWeb3Sec/DeFiHackLabs/). However, in this project my goal is not just to replay the transaction, but also to test fixes for the hack and explore the vulnerable contracts involved in the attack by cloning the original contracts and modifying their code. This allows me better understand each step of the transaction by creating logs and visualizing events in flexible manner.

## Attacks
| Name   | Date          | Category        | Loss      | Fix  |
|:------:|:-------------:|:---------------:|:---------:|:----:|
| [MiM Spell](/articles/mim-spell-attack/) | 2024/01/30    | Precision loss  | ~$6,5M | [🛠️](https://github.com/vesla0x1/defi-hacks/commit/ab6bc9b7f43cd3f45496a47b3e4038bb79e9bf58) |
