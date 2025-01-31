import {
  DepositCall,
  RedeemCall,
  BondCreated,
  BondRedeemed,
} from "../generated/FraxBond/FraxBond";
import { Deposit, Redemption } from "../generated/schema";
import { loadOrCreateTransaction } from "./utils/Transactions";
import { loadOrCreateBRICKie, updateBrickieBalance } from "./utils/BRICKie";
import { toDecimal } from "./utils/Decimals";
import { FRAXBOND_TOKEN } from "./utils/Constants";
import { loadOrCreateToken } from "./utils/Tokens";
import { createDailyBondRecord } from "./utils/DailyBond";

export function handleDeposit(call: BondCreated): void {
  let brickie = loadOrCreateBRICKie(call.transaction.from);
  let transaction = loadOrCreateTransaction(call.transaction, call.block);
  let token = loadOrCreateToken(FRAXBOND_TOKEN);

  let amount = toDecimal(call.params.deposit, 18);
  let deposit = new Deposit(transaction.id);
  deposit.transaction = transaction.id;
  deposit.brickie = brickie.id;
  deposit.amount = amount;
  deposit.value = amount;
  deposit.maxPremium = toDecimal(call.params.deposit);
  deposit.token = token.id;
  deposit.timestamp = transaction.timestamp;
  deposit.save();

  createDailyBondRecord(
    deposit.timestamp,
    token,
    deposit.amount,
    deposit.value
  );
  updateBrickieBalance(brickie, transaction);
}

export function handleRedeem(call: BondRedeemed): void {
  let brickie = loadOrCreateBRICKie(call.transaction.from);
  let transaction = loadOrCreateTransaction(call.transaction, call.block);

  let redemption = Redemption.load(transaction.id);
  if (redemption == null) {
    redemption = new Redemption(transaction.id);
  }
  redemption.transaction = transaction.id;
  redemption.brickie = brickie.id;
  redemption.token = loadOrCreateToken(FRAXBOND_TOKEN).id;
  redemption.timestamp = transaction.timestamp;
  redemption.save();
  updateBrickieBalance(brickie, transaction);
}
