+++
title = "Flat Money"
date = "2024-02-20"
description = "The Flat Money protocol allows people to deposit Rocket Pool ETH (rETH) and mint UNIT, a decentralized delta-neutral flatcoin designed to outpace inflation."

[taxonomies]
tags = ["Audit Report", "Sherlock"]
home = ["recent"]

[extra]
platform = "Sherlock"
audit_link = "https://audits.sherlock.xyz/contests/132"
report = "https://audits.sherlock.xyz/contests/132/report"
start = "2024-01-22"
finish = "2024-02-04"
payment = 41.11
nsloc = 2215
protocol_category = "Perps"
findings = "1M"
ranking_position = 31
participants = 257
ranking_link = "https://twitter.com/sherlockdefi/status/1764374914838954220"
home_feed_label = "Audit Report"
overview = "The [Flat Money](https://flat.money/) protocol allows people to deposit Rocket Pool ETH (rETH) and mint UNIT, a decentralized delta-neutral flatcoin designed to outpace inflation. Flat Money also offers Leverage Traders the ability to deposit rETH and open rETH leveraged long positions through perpetual futures contracts."
references = [{name = "Flat Money docs", url = "https://docs.flat.money/"}, {name = "Flat Money site", url="https://flat.money"}, { name = "Contest page on Sherlock", url = "https://audits.sherlock.xyz/contests/132"}, { name = "Official Sherlock's Report", url = "https://audits.sherlock.xyz/contests/132/report" }, { name = "Sherlock's tweet of my classification", url="https://twitter.com/sherlockdefi/status/1764374914838954220"}]

findings_data = [
    { id = "M-1", severity = "Medium", payment = 41.11, original_report = "https://github.com/sherlock-audit/2023-12-flatmoney-judging/issues/252", duplicates = 10 }
]

+++

# Medium findings
## [M-1] Malicious actors can accumulate a huge amount of internal points (FMP) and inflate their value {#M-1}
### Summary
Malicious actors can take advantage of the absence of a time restriction (or penalty) mechanism for withdrawing collateral to earn internal points (FMP) at a very low rate (only the 0.3% withdraw fee), inflating their value.

### Vulnerability Detail
A bad actor can deposit collateral, earning FMP points and withdraw all the collateral deposited instantly, paying only the small withdraw fee (0.3% - keeper fees can be avoided if the order is executed by the user). Once there is no time restriction to earn points or a penalty mechanism to reduce points when withdrawing collateral, the bad actor can repeat this process (almost) indefinitely (until all its collateral is spent paying the withdraw fee), accumulating FMP points and inflating their value.

### Impact
Malicious users can accumulate a huge amount of FMP, inflating their value.

### Code Snippet
- [https://github.com/sherlock-audit/2023-12-flatmoney/blob/main/flatcoin-v1/src/StableModule.sol#L82-L84](https://github.com/sherlock-audit/2023-12-flatmoney/blob/main/flatcoin-v1/src/StableModule.sol#L82-L84)

- [https://github.com/sherlock-audit/2023-12-flatmoney/blob/main/flatcoin-v1/src/PointsModule.sol#L77-L87](https://github.com/sherlock-audit/2023-12-flatmoney/blob/main/flatcoin-v1/src/PointsModule.sol#L77-L87)

### Tool used
Foundry

### Recommendation
Implement a mechanism that restricts the FMP earnings by time and/or reduces the point quantity when a user withdraws collateral.