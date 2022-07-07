https://github.com/ShipyardDAO/student.MatricksDeCoder/tree/bcfffc3afd4e3fff6112177bb552493fa5c6ae2a/ico

The following is a micro audit by Gab

# Design Exercise

Yup, that implementation would work

# General Comments

* It is very uncommon to see the ERC20 logic (transfer, balanceOf, mint, burn, etc.) in the same contract as the ICO logic (contribute, redeem, the phases, etc.). The software pattern separation of concerns is a good guide here. Consider what design decisions led you to put these all in one contract.

* Refunding the user is an extra feature.

# Issues

**[Q-1]** From Solidity 0.5.0 onwards there's no need to `require(_treasury != address(0))` 

**[Q-2]** `setTaxable` and `setPauseStatus` could toggle their status rather than taking a parameter

**[Q-3]** Adding to whitelist should allow an array of addresses, otherwise it could cost tons of gas to add several investors

**[Q-4]** No need to initialize `isTargetReached`, `isPaused` or `totalETHContributions`, Solidity gives them these initial values by default

# Score

| Reason | Score |
|-|-|
| Late                       | - |
| Unfinished features        | 3 |
| Extra features             | 1 |
| Vulnerability              | - |
| Unanswered design exercise | - |
| Insufficient tests         | - |
| Technical mistake          | - |

Total: 4

Good job!